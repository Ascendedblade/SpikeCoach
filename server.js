const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const MODEL = 'gpt-6-luna';
const MAX_CHAT_CHARS = 250;
const SYSTEM_PROMPT_MAIN =
  'You are SpikeCoach, an expert Valorant coach in the main desktop app. ' +
  'Answer any Valorant question accurately but keep replies SHORT: usually 2-4 sentences, or at most 3 very brief bullet points. ' +
  'No long guides, no multi-paragraph essays. Stay focused on Valorant only.';
const SYSTEM_PROMPT_INGAME =
  'You are SpikeCoach Coach Chat inside a live Valorant match overlay. ' +
  'Give one or two short sentences of general Valorant advice only. No lists, no long explanations, no lineup or strat deep-dives.';
const MAX_OUTPUT_TOKENS_MAIN = 180;
const MAX_OUTPUT_TOKENS_INGAME = 90;

const USER_LIMITS = { perMinute: 8, perHour: 40, minuteMs: 60 * 1000, hourMs: 60 * 60 * 1000 };
const IP_LIMITS = { perMinute: 16, perHour: 80, minuteMs: 60 * 1000, hourMs: 60 * 60 * 1000 };
const RATE_LIMIT_MESSAGE = "You've sent too many messages. Please wait a little before trying again.";

const firebaseConfigured = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);
const requireVerifiedUser = process.env.NODE_ENV === 'production' || firebaseConfigured;

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set.');
}
if (requireVerifiedUser && !firebaseConfigured) {
  console.warn('Firebase Admin credentials are not set. /api/chat will reject requests until they are configured.');
} else if (!firebaseConfigured) {
  console.warn('Firebase Admin is not configured. Local /api/chat is limited by IP only.');
}

let openai = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

let firebaseAuth = null;
function getFirebaseAuth() {
  if (!firebaseConfigured) return null;
  if (!firebaseAuth) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    }
    firebaseAuth = admin.auth();
  }
  return firebaseAuth;
}

function createMemoryRateStore() {
  var buckets = new Map();
  return {
    take: function (key, now, limits) {
      var stamps = buckets.get(key) || [];
      var kept = [];
      var minuteCount = 0;
      for (var i = 0; i < stamps.length; i++) {
        if (now - stamps[i] >= limits.hourMs) continue;
        kept.push(stamps[i]);
        if (now - stamps[i] < limits.minuteMs) minuteCount += 1;
      }
      if (minuteCount >= limits.perMinute || kept.length >= limits.perHour) {
        if (kept.length) buckets.set(key, kept);
        else buckets.delete(key);
        return { allowed: false };
      }
      kept.push(now);
      buckets.set(key, kept);
      return { allowed: true };
    }
  };
}

// Swap this store for Redis later. Callers only use take(key, now, limits).
var rateStore = createMemoryRateStore();

function clientIp(req) {
  var forwarded = req.get('x-forwarded-for');
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip || 'unknown';
}

function isAllowedOrigin(origin) {
  if (!origin || origin === 'null') return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (origin.indexOf('overwolf-extension://') === 0) return true;
  var extras = String(process.env.ALLOWED_ORIGINS || '').split(',');
  for (var i = 0; i < extras.length; i++) {
    if (extras[i].trim() && extras[i].trim() === origin) return true;
  }
  return false;
}

function readBearer(req) {
  var header = req.get('authorization') || '';
  var match = header.match(/^Bearer\s+(\S+)\s*$/i);
  return match ? match[1] : '';
}

function chatFailure(error) {
  var status = error && error.status;
  var code = (error && (error.code || (error.error && error.error.code))) || '';
  console.error('openai_chat_failed', { status: status || null, code: code || null });
  if (code === 'insufficient_quota' || code === 'billing_hard_limit_reached') {
    return { status: 503, error: 'The coach is temporarily unavailable. Please try again later.' };
  }
  if (status === 429 || code === 'rate_limit_exceeded') {
    return { status: 503, error: 'The coach is busy right now. Please try again in a moment.' };
  }
  return { status: 503, error: 'The coach could not answer just now. Please try again.' };
}

function normalizeChatMode(raw) {
  return raw === 'ingame' ? 'ingame' : 'main';
}

function getChatCoachConfig(mode) {
  if (mode === 'ingame') {
    return {
      instructions: SYSTEM_PROMPT_INGAME,
      max_output_tokens: MAX_OUTPUT_TOKENS_INGAME,
      reasoning: { effort: 'none' }
    };
  }
  return {
    instructions: SYSTEM_PROMPT_MAIN,
    max_output_tokens: MAX_OUTPUT_TOKENS_MAIN,
    reasoning: { effort: 'none' }
  };
}

function extractResponseText(result) {
  if (result && typeof result.output_text === 'string' && result.output_text.trim()) {
    return result.output_text.trim();
  }
  if (!result || !Array.isArray(result.output)) {
    return '';
  }
  var parts = [];
  for (var i = 0; i < result.output.length; i++) {
    var item = result.output[i];
    if (!item || item.type !== 'message' || !Array.isArray(item.content)) continue;
    for (var j = 0; j < item.content.length; j++) {
      var block = item.content[j];
      if (block && block.type === 'output_text' && block.text) {
        parts.push(block.text);
      }
    }
  }
  return parts.join('\n').trim();
}

app.set('trust proxy', 1);
var localDev = process.env.NODE_ENV !== 'production';
app.use(function (req, res, next) {
  if (req.get('access-control-request-private-network') === 'true') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});
app.use(cors({
  origin: localDev ? true : function (origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '16kb' }));

app.get('/health', function (req, res) {
  res.json({ status: 'ok' });
});

app.post('/api/chat', async function (req, res) {
  console.log('[SpikeCoach Chat] received', {
    origin: req.get('origin') || null,
    authorization: !!readBearer(req)
  });
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }

  var message = req.body.message;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  message = message.trim();
  if (message.length > MAX_CHAT_CHARS) {
    return res.status(400).json({ error: 'Please keep messages to ' + MAX_CHAT_CHARS + ' characters or fewer.' });
  }

  var chatMode = normalizeChatMode(req.body.mode);
  var coachConfig = getChatCoachConfig(chatMode);

  var now = Date.now();
  var ip = clientIp(req);
  var ipLimits = requireVerifiedUser ? IP_LIMITS : USER_LIMITS;
  if (!rateStore.take('ip:' + ip, now, ipLimits).allowed) {
    return res.status(429).json({ error: RATE_LIMIT_MESSAGE });
  }

  var userId = null;
  if (requireVerifiedUser) {
    if (!firebaseConfigured) {
      return res.status(503).json({ error: 'Coach Chat is not available right now.' });
    }
    var token = readBearer(req);
    if (!token) {
      return res.status(401).json({ error: 'Sign in to use Coach Chat.' });
    }
    try {
      var decoded = await getFirebaseAuth().verifyIdToken(token);
      userId = decoded && decoded.uid;
    } catch (authError) {
      var authCode = authError && authError.code;
      console.error('firebase_token_rejected', { code: authCode || null });
      var expired = authCode === 'auth/id-token-expired';
      return res.status(401).json({
        error: expired ? 'Your session expired. Sign in again.' : 'Sign in to use Coach Chat.'
      });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Sign in to use Coach Chat.' });
    }
    if (!rateStore.take('user:' + userId, now, USER_LIMITS).allowed) {
      return res.status(429).json({ error: RATE_LIMIT_MESSAGE });
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('openai_key_missing');
    return res.status(503).json({ error: 'Coach Chat is not available right now.' });
  }

  try {
    var result = await getOpenAI().responses.create({
      model: MODEL,
      instructions: coachConfig.instructions,
      input: message,
      max_output_tokens: coachConfig.max_output_tokens,
      reasoning: coachConfig.reasoning
    });
    var reply = extractResponseText(result);
    if (!reply) {
      console.error('openai_chat_empty', {
        user: userId || 'ip',
        mode: chatMode,
        status: result && result.status,
        incomplete: result && result.incomplete_details
      });
      return res.status(503).json({
        error: 'The coach could not finish that answer. Try again or ask a shorter question.'
      });
    }
    console.log('openai_chat_ok', { user: userId || 'ip', mode: chatMode, chars: message.length, replyChars: reply.length });
    res.json({ response: reply });
  } catch (error) {
    var failure = chatFailure(error);
    res.status(failure.status).json({ error: failure.error });
  }
});

app.use(function (err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  console.error('request_failed', { type: err && err.type ? err.type : 'unknown' });
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, HOST, function () {
  console.log('Server listening on ' + HOST + ':' + PORT);
});
