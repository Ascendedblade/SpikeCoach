// Guess the Rank — Supabase catalog, session flow, scoring, and YouTube embed.
import { supabase } from './supabase-client.js';
import {
  CANONICAL_RANK_ORDER,
  isCanonicalRank,
  toCanonicalRank,
  rankDistance,
  pointsForDistance,
  feedbackLabelForDistance,
  fisherYatesShuffle
} from './guess-rank-config.js';

var LOG = '[SpikeCoach GuessTheRank]';
var YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed/';

var session = {
  activeClipPool: [],
  shuffledClips: [],
  currentClipIndex: 0,
  currentClip: null,
  totalScore: 0,
  guessesCompleted: 0,
  perfectCount: 0,
  currentGuessSubmitted: false,
  latestPointsEarned: 0,
  lastClipId: null
};

function youtubeEmbedUrl(videoId) {
  return YOUTUBE_EMBED_BASE + encodeURIComponent(videoId);
}

function isValidVideoId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{6,20}$/.test(value.trim());
}

function normalizeClipRow(row) {
  return {
    id: row.id,
    youtube_video_id: String(row.youtube_video_id || '').trim(),
    correct_rank: String(row.correct_rank || '').trim()
  };
}

function isValidClipRow(row) {
  if (!row || row.id == null || row.id === '') return false;
  var vid = String(row.youtube_video_id || '').trim();
  var rank = String(row.correct_rank || '').trim();
  if (!isValidVideoId(vid)) return false;
  if (!isCanonicalRank(rank)) return false;
  return true;
}

function el(id) {
  return document.getElementById(id);
}

function setMessage(text, visible) {
  var node = el('guessRankMessage');
  if (!node) return;
  if (!visible || !text) {
    node.textContent = '';
    node.hidden = true;
    return;
  }
  node.textContent = text;
  node.hidden = false;
}

function updateScoreboard() {
  var score = el('guessRankScore');
  var correct = el('guessRankCorrect');
  var wrong = el('guessRankWrong');
  if (score) score.textContent = String(session.totalScore);
  if (correct) correct.textContent = String(session.perfectCount);
  if (wrong) wrong.textContent = String(Math.max(0, session.guessesCompleted - session.perfectCount));
}

function setGuessControlsEnabled(enabled) {
  var base = el('guessRankBaseRanks');
  if (base) {
    base.querySelectorAll('.guess-rank-icon-card').forEach(function (btn) {
      btn.disabled = !enabled;
      if (!enabled) btn.classList.remove('active');
    });
  }
  var panel = el('guessSubrankPanel');
  if (panel) {
    panel.querySelectorAll('.guess-subrank-btn').forEach(function (btn) {
      btn.disabled = !enabled;
    });
  }
}

function clearRankSelectionUi() {
  var base = el('guessRankBaseRanks');
  if (base) base.querySelectorAll('.guess-rank-icon-card').forEach(function (c) { c.classList.remove('active'); });
  var panel = el('guessSubrankPanel');
  if (panel) panel.innerHTML = '';
}

function hideResult() {
  var result = el('guessRankResult');
  var next = el('guessRankNextBtn');
  if (result) {
    result.hidden = true;
    result.innerHTML = '';
  }
  if (next) next.hidden = true;
}

function showResult(guessRank, correctRank, distance, points) {
  var label = feedbackLabelForDistance(distance);
  var result = el('guessRankResult');
  if (!result) return;
  result.innerHTML =
    '<div class="guess-result-grid">' +
      '<div class="guess-result-block"><span class="guess-result-label">Your Guess</span><strong>' + escapeHtml(guessRank) + '</strong></div>' +
      '<div class="guess-result-block"><span class="guess-result-label">Correct Rank</span><strong>' + escapeHtml(correctRank) + '</strong></div>' +
    '</div>' +
    '<div class="guess-result-points"><span class="guess-result-label">' + escapeHtml(label) + '</span><strong>+' + points + ' points</strong></div>' +
    '<div class="guess-result-total">Total Score: <strong>' + session.totalScore + '</strong></div>';
  result.hidden = false;
  var next = el('guessRankNextBtn');
  if (next) next.hidden = false;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setGuessRankVideo(videoId) {
  var frame = el('guessRankYoutubeFrame');
  if (!frame || !videoId) return;
  var url = youtubeEmbedUrl(videoId);
  if (frame.getAttribute('src') === url) return;
  frame.setAttribute('src', 'about:blank');
  frame.setAttribute('src', url);
}

function showClipAtIndex(index) {
  var clip = session.shuffledClips[index];
  if (!clip) return;
  session.currentClipIndex = index;
  session.currentClip = clip;
  session.currentGuessSubmitted = false;
  session.latestPointsEarned = 0;
  console.log(LOG, 'Showing clip index ' + index);
  setGuessRankVideo(clip.youtube_video_id);
  hideResult();
  clearRankSelectionUi();
  setGuessControlsEnabled(true);
  setMessage('', false);
}

function reshufflePool() {
  var lastId = session.lastClipId;
  var next = fisherYatesShuffle(session.activeClipPool);
  if (next.length > 1 && lastId != null && next[0].id === lastId) {
    var swap = 1 + Math.floor(Math.random() * (next.length - 1));
    var tmp = next[0];
    next[0] = next[swap];
    next[swap] = tmp;
  }
  session.shuffledClips = next;
  session.currentClipIndex = 0;
}

function advanceToNextClip() {
  if (!session.currentGuessSubmitted) return;
  session.lastClipId = session.currentClip && session.currentClip.id;
  var nextIndex = session.currentClipIndex + 1;
  if (nextIndex >= session.shuffledClips.length) {
    reshufflePool();
    nextIndex = 0;
  }
  showClipAtIndex(nextIndex);
}

function resetSessionScores() {
  session.totalScore = 0;
  session.guessesCompleted = 0;
  session.perfectCount = 0;
  session.currentGuessSubmitted = false;
  session.latestPointsEarned = 0;
  session.lastClipId = null;
  updateScoreboard();
}

function startSessionWithPool(clips) {
  session.activeClipPool = clips;
  resetSessionScores();
  session.shuffledClips = fisherYatesShuffle(clips);
  session.currentClipIndex = 0;
  console.log(LOG, 'Starting session with ' + clips.length + ' clips');
  showClipAtIndex(0);
}

export async function fetchActiveGuessRankClips() {
  var result = await supabase
    .from('guess_rank_clips')
    .select('id, youtube_video_id, correct_rank')
    .eq('active', true);

  if (result.error) throw result.error;

  var valid = [];
  (result.data || []).forEach(function (row) {
    if (!row || row.id == null) {
      console.warn(LOG, 'Skipped malformed row');
      return;
    }
    var normalized = {
      id: row.id,
      youtube_video_id: row.youtube_video_id,
      correct_rank: row.correct_rank
    };
    if (!isValidClipRow(normalized)) {
      console.warn(LOG, 'Skipped invalid row', { id: row.id });
      return;
    }
    valid.push(normalizeClipRow(normalized));
  });

  console.log(LOG, 'Loaded ' + valid.length + ' valid clips');
  return valid;
}

var catalogCache = null;
var catalogRequest = null;

function loadGuessRankCatalog(force) {
  if (force) {
    catalogCache = null;
    catalogRequest = null;
  }
  if (catalogCache) return Promise.resolve(catalogCache);
  if (catalogRequest) return catalogRequest;
  catalogRequest = fetchActiveGuessRankClips().then(function (clips) {
    catalogCache = clips;
    catalogRequest = null;
    return clips;
  }).catch(function (error) {
    catalogRequest = null;
    catalogCache = null;
    throw error;
  });
  return catalogRequest;
}

export async function beginGuessRankSession() {
  setMessage('Loading Guess the Rank clips…', true);
  hideResult();
  clearRankSelectionUi();
  setGuessControlsEnabled(false);
  var frame = el('guessRankYoutubeFrame');
  if (frame) frame.setAttribute('src', 'about:blank');

  try {
    var clips = await loadGuessRankCatalog(false);
    if (!clips.length) {
      session.activeClipPool = [];
      session.shuffledClips = [];
      session.currentClip = null;
      setMessage('No Guess the Rank clips are currently available.', true);
      return;
    }
    setMessage('', false);
    startSessionWithPool(clips);
  } catch (error) {
    console.error(LOG, 'Failed to load clips');
    session.activeClipPool = [];
    session.shuffledClips = [];
    session.currentClip = null;
    setMessage('Unable to load Guess the Rank clips. Please try again.', true);
  }
}

function submitGuess(mainRank, subrank) {
  if (session.currentGuessSubmitted || !session.currentClip) return;
  var guessed = toCanonicalRank(mainRank, subrank);
  if (!guessed || !isCanonicalRank(guessed)) return;

  var correct = session.currentClip.correct_rank;
  var distance = rankDistance(correct, guessed);
  if (distance == null) return;

  var points = pointsForDistance(distance);
  session.currentGuessSubmitted = true;
  session.latestPointsEarned = points;
  session.totalScore += points;
  session.guessesCompleted += 1;
  if (distance === 0) session.perfectCount += 1;

  console.log(LOG, 'Guess distance: ' + distance + ', awarded ' + points + ' points');
  updateScoreboard();
  showResult(guessed, correct, distance, points);
  setGuessControlsEnabled(false);
}

function renderSubrankChoices(rankName) {
  var panel = el('guessSubrankPanel');
  if (!panel || session.currentGuessSubmitted) return;

  var subrankButtons = [1, 2, 3].map(function (subrank) {
    var subrankIconSrc = 'Rank_Icons/' + rankName + '_' + subrank + '_Rank.webp';
    return (
      '<button type="button" class="guess-subrank-btn" data-rank="' + escapeHtml(rankName) + '" data-subrank="' + subrank + '">' +
        '<img src="' + escapeHtml(subrankIconSrc) + '" alt="">' +
        '<span>' + escapeHtml(rankName + ' ' + subrank) + '</span>' +
      '</button>'
    );
  }).join('');

  panel.innerHTML =
    '<div class="guess-subrank-title">' + escapeHtml(rankName) + ' Subranks</div>' +
    '<div class="guess-subrank-grid">' + subrankButtons + '</div>';
}

var uiBound = false;

function bindGuessRankUi() {
  if (uiBound) return;
  var base = el('guessRankBaseRanks');
  var panel = el('guessSubrankPanel');
  var next = el('guessRankNextBtn');
  if (!base && !panel && !next) return;
  uiBound = true;

  if (base) {
    base.addEventListener('click', function (e) {
      var rankButton = e.target.closest('.guess-rank-icon-card');
      if (!rankButton || rankButton.disabled || session.currentGuessSubmitted) return;

      var rankName = rankButton.getAttribute('data-rank');
      var hasSubranks = rankButton.getAttribute('data-has-subranks') === 'true';
      base.querySelectorAll('.guess-rank-icon-card').forEach(function (card) { card.classList.remove('active'); });
      rankButton.classList.add('active');

      if (!hasSubranks) {
        submitGuess(rankName, null);
        panel.innerHTML = '<div class="guess-subrank-title">' + escapeHtml(rankName) + '</div>';
        return;
      }
      renderSubrankChoices(rankName);
    });
  }

  if (panel) {
    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('.guess-subrank-btn');
      if (!btn || btn.disabled || session.currentGuessSubmitted) return;
      submitGuess(btn.getAttribute('data-rank'), btn.getAttribute('data-subrank'));
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      advanceToNextClip();
    });
  }
}

function initGuessRankYoutubeFrame() {
  var frame = el('guessRankYoutubeFrame');
  if (!frame) return;
  frame.addEventListener('error', function () {
    console.error(LOG, 'YouTube iframe error event');
  });
}

export function mountGuessRankUi() {
  uiBound = false;
  bindGuessRankUi();
  initGuessRankYoutubeFrame();
  updateScoreboard();
}

window.SpikeCoachGuessRank = {
  mountUi: mountGuessRankUi,
  beginSession: beginGuessRankSession,
  refreshCatalog: function () { return loadGuessRankCatalog(true); },
  getClips: function () { return session.activeClipPool.slice(); },
  getCurrentClip: function () { return session.currentClip; },
  getCanonicalRanks: function () { return CANONICAL_RANK_ORDER.slice(); }
};
