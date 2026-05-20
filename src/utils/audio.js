/**
 * audio.js — Core audio playback engine.
 *
 * Architecture (ElevenLabs only — no Web Speech API):
 * 1. Check audioMap for pre-generated static .mp3 asset.
 * 2. If not found, dynamically generate via ElevenLabs TTS API.
 * 3. Playback uses HTML5 Audio API with Promise-based completion.
 * 4. Preloading: while playing segment i, preload segment i+1.
 * 5. `narrate()` plays an array of segments sequentially with sync callbacks.
 */

import { audioMap } from './audioMap';

// ─── Config ────────────────────────────────────────────────────────────────────
const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice
const MODEL_ID = 'eleven_multilingual_v2';

const STYLE_SETTINGS = {
  statement:     { stability: 0.5, similarity_boost: 0.75, style: 0.0 },
  instruction:   { stability: 0.5, similarity_boost: 0.75, style: 0.0 },
  question:      { stability: 0.6, similarity_boost: 0.75, style: 0.15 },
  encouragement: { stability: 0.45, similarity_boost: 0.8, style: 0.2 },
  emphasis:      { stability: 0.65, similarity_boost: 0.8, style: 0.1 },
  thinking:      { stability: 0.55, similarity_boost: 0.7, style: 0.15 },
  celebration:   { stability: 0.3, similarity_boost: 0.75, style: 0.25 },
};

// ─── Caches ────────────────────────────────────────────────────────────────────
const elevenLabsCache = new Map();   // text → blob URL
const audioElementCache = new Map(); // text → preloaded Audio element

// ─── Current playback state ────────────────────────────────────────────────────
let currentAudio = null;
let narrationAborted = false;

// ─── Get Audio URL ─────────────────────────────────────────────────────────────
/**
 * Resolves the playable URL for a text string.
 * Priority: audioMap (static) → elevenLabsCache (memory) → ElevenLabs API (dynamic).
 */
export async function getAudioUrl(text, style = 'statement') {
  // 1. Static asset from audioMap
  if (audioMap[text]) {
    return audioMap[text];
  }

  // 2. In-memory cache from prior dynamic request
  if (elevenLabsCache.has(text)) {
    return elevenLabsCache.get(text);
  }

  // 3. Dynamic generation via ElevenLabs API
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    // No API key available — skip audio silently
    return null;
  }

  try {
    const settings = STYLE_SETTINGS[style] || STYLE_SETTINGS.statement;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { ...settings, use_speaker_boost: true },
      }),
    });

    if (!response.ok) {
      console.warn(`ElevenLabs API error for "${text}": ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    elevenLabsCache.set(text, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn('ElevenLabs fetch failed:', err);
    return null;
  }
}


// ─── Speak ─────────────────────────────────────────────────────────────────────
/**
 * Speaks a text string. Returns a Promise that resolves when playback finishes.
 * This is the primary function components use for syncing UI with audio.
 *
 * @param {string} text - The text to speak.
 * @param {boolean} enabled - If false, resolves immediately (audio muted).
 * @param {string} style - One of the style keys for dynamic generation.
 * @returns {Promise<void>}
 */
export function speak(text, enabled = true, style = 'statement') {
  if (!enabled || !text) return Promise.resolve();

  return new Promise(async (resolve) => {
    // Stop any currently playing audio
    stopCurrentAudio();

    const url = await getAudioUrl(text, style);

    if (url) {
      // HTML5 Audio playback
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        console.warn(`Audio playback error for: "${text}"`);
        currentAudio = null;
        resolve();
      };

      try {
        await audio.play();
      } catch (e) {
        // Autoplay blocked — resolve silently
        console.warn('Autoplay blocked:', e);
        currentAudio = null;
        resolve();
      }
    } else {
      // No ElevenLabs URL available — resolve silently
      resolve();
    }
  });
}

// ─── Stop ──────────────────────────────────────────────────────────────────────
/** Stop any currently playing audio. */
export function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/** Abort an ongoing narration sequence. */
export function stopNarration() {
  narrationAborted = true;
  stopCurrentAudio();
}

// ─── Preload ───────────────────────────────────────────────────────────────────
/**
 * Preload audio for a narration segment array.
 * Eagerly fetches URLs so they are cached and ready for instant playback.
 */
export async function preloadNarration(segments) {
  if (!segments || segments.length === 0) return;
  const promises = segments.map(seg => getAudioUrl(seg.text, seg.style));
  await Promise.allSettled(promises);
}

// ─── Narrate ───────────────────────────────────────────────────────────────────
/**
 * Play an array of narration segments sequentially.
 * While playing segment i, preloads segment i+1.
 * Returns a Promise that resolves when all segments finish or narration is aborted.
 *
 * @param {Array<{text: string, style: string}>} segments
 * @param {boolean} enabled
 * @param {function} onSegmentStart - Called with (segment, index) when each segment starts.
 * @param {function} onSegmentEnd   - Called with (segment, index) when each segment ends.
 * @returns {Promise<void>}
 */
export async function narrate(segments, enabled = true, { onSegmentStart, onSegmentEnd } = {}) {
  if (!enabled || !segments || segments.length === 0) return;

  narrationAborted = false;

  // Preload first segment immediately
  await getAudioUrl(segments[0].text, segments[0].style);

  for (let i = 0; i < segments.length; i++) {
    if (narrationAborted) break;

    const seg = segments[i];

    // Preload next segment while current plays
    if (i + 1 < segments.length) {
      getAudioUrl(segments[i + 1].text, segments[i + 1].style);
    }

    if (onSegmentStart) onSegmentStart(seg, i);

    await speak(seg.text, enabled, seg.style);

    if (onSegmentEnd) onSegmentEnd(seg, i);

    if (narrationAborted) break;
  }
}

// ─── Sound Effects (kept from original) ────────────────────────────────────────
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

export function playTone(frequency, duration = 200) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) { /* silent fallback */ }
}

export const sounds = {
  correct: () => { playTone(523, 150); setTimeout(() => playTone(659, 150), 150); setTimeout(() => playTone(784, 200), 300); },
  wrong: () => { playTone(220, 300); },
  badge: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 200), i * 150)); },
  click: () => playTone(440, 80),
  streak: () => { playTone(880, 100); setTimeout(() => playTone(1100, 150), 100); },
};

// ─── Unlock Audio Context ──────────────────────────────────────────────────────
/**
 * Call this on the very first user interaction (e.g., "Start Journey" button).
 * This unlocks both the AudioContext (for sound effects) and the HTML5 Audio
 * (for ElevenLabs playback) on mobile browsers that block autoplay.
 */
export function unlockAudioContext() {
  // Unlock AudioContext
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { /* ignore */ }

  // Unlock HTML5 Audio with a silent play
  try {
    const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYlMZVsAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZB4P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==');
    silentAudio.volume = 0;
    silentAudio.play().catch(() => {});
  } catch (e) { /* ignore */ }
}
