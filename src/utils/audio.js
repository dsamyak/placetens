/**
 * audio.js — Core audio playback engine.
 *
 * Architecture (ElevenLabs only — no Web Speech API):
 * 1. Check audioMap for pre-generated static .mp3 asset.
 * 2. If not found, dynamically generate via ElevenLabs TTS API.
 * 3. Playback uses HTML5 Audio API with Promise-based completion.
 * 4. Preloading: while playing segment i, preload segment i+1.
 * 5. `narrate()` plays an array of segments sequentially with sync callbacks.
 * 6. Global Playback Tracking & Mute control to prevent audio overlap.
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

// ─── Playback & Global State ───────────────────────────────────────────────────
let currentAudio = null;
let currentPlaybackId = 0;
let globalAudioEnabled = true;

/** Set global mute/unmute state */
export function setGlobalAudioEnabled(enabled) {
  globalAudioEnabled = !!enabled;
  if (!globalAudioEnabled) {
    stopNarration();
  }
}

/** Check global mute state */
export function isAudioEnabled() {
  return globalAudioEnabled;
}

// ─── Stop Audio Functions ─────────────────────────────────────────────────────
export function stopCurrentAudio() {
  currentPlaybackId++;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch (e) { /* ignore */ }
    currentAudio = null;
  }
}

export function stopNarration() {
  stopCurrentAudio();
}

// ─── Get Audio URL ─────────────────────────────────────────────────────────────
export async function getAudioUrl(text, style = 'statement') {
  if (!text) return null;
  if (audioMap[text]) return audioMap[text];
  if (elevenLabsCache.has(text)) return elevenLabsCache.get(text);

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk_0af55b573c54fe31387443150c45624fed865ccc914cd486';
  if (!apiKey || apiKey === 'your_api_key_here') return null;

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
export function speak(text, enabled = true, style = 'statement', isSequenceItem = false) {
  if (!globalAudioEnabled || !enabled || !text) return Promise.resolve();

  if (!isSequenceItem) {
    stopCurrentAudio();
  }
  const myPlaybackId = currentPlaybackId;

  return new Promise(async (resolve) => {
    const url = await getAudioUrl(text, style);

    // If cancelled or muted during fetch, abort immediately!
    if (myPlaybackId !== currentPlaybackId || !globalAudioEnabled) {
      resolve();
      return;
    }

    if (url) {
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };

      try {
        await audio.play();
      } catch (e) {
        console.warn('Autoplay blocked:', e);
        if (currentAudio === audio) currentAudio = null;
        resolve();
      }
    } else {
      resolve();
    }
  });
}

// ─── Preload ───────────────────────────────────────────────────────────────────
export async function preloadNarration(segments) {
  if (!segments || segments.length === 0 || !globalAudioEnabled) return;
  const promises = segments.map(seg => getAudioUrl(seg.text, seg.style));
  await Promise.allSettled(promises);
}

// ─── Narrate ───────────────────────────────────────────────────────────────────
export async function narrate(segments, enabled = true, { onSegmentStart, onSegmentEnd } = {}) {
  if (!globalAudioEnabled || !enabled || !segments || segments.length === 0) return;

  stopCurrentAudio();
  const sequencePlaybackId = currentPlaybackId;

  for (let i = 0; i < segments.length; i++) {
    if (currentPlaybackId !== sequencePlaybackId || !globalAudioEnabled) break;

    const seg = segments[i];

    if (i + 1 < segments.length) {
      getAudioUrl(segments[i + 1].text, segments[i + 1].style);
    }

    if (onSegmentStart) onSegmentStart(seg, i);

    await speak(seg.text, enabled, seg.style, true);

    if (onSegmentEnd) onSegmentEnd(seg, i);

    if (currentPlaybackId !== sequencePlaybackId || !globalAudioEnabled) break;
  }
}

// ─── Sound Effects ─────────────────────────────────────────────────────────────
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

export function playTone(frequency, duration = 200) {
  if (!globalAudioEnabled) return;
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
  correct: () => { if (globalAudioEnabled) { playTone(523, 150); setTimeout(() => playTone(659, 150), 150); setTimeout(() => playTone(784, 200), 300); } },
  wrong: () => { if (globalAudioEnabled) playTone(220, 300); },
  badge: () => { if (globalAudioEnabled) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 200), i * 150)); },
  click: () => { if (globalAudioEnabled) playTone(440, 80); },
  streak: () => { if (globalAudioEnabled) { playTone(880, 100); setTimeout(() => playTone(1100, 150), 100); } },
};

// ─── Unlock Audio Context ──────────────────────────────────────────────────────
export function unlockAudioContext() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { /* ignore */ }

  try {
    const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYlMZVsAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZB4P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==');
    silentAudio.volume = 0;
    silentAudio.play().catch(() => {});
  } catch (e) { /* ignore */ }
}
