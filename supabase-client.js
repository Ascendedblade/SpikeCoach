// Browser-safe Supabase client for SpikeCoach (Guess the Rank content only).
// Uses the Supabase *publishable* key — safe for frontend use. Never put service_role,
// sb_secret_* keys, or database passwords in this file.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm';

var SUPABASE_URL = 'https://psgpxjimroeuzqbkzmrk.supabase.co';
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_qDbVi93bQdEbZxi-hYnJcA_6mt8TuPm';

export var supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

window.spikeCoachSupabase = supabase;
