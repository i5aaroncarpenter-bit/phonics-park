/**
 * Recorded phoneme clips (assets/sounds/*.mp3). These are the isolated
 * sounds the child hears when tapping a tile — real diphone audio, so /s/ is
 * "ssss" and never the letter name. Built by tools/build-sounds.mjs.
 */

import { audioContext, sfxDestination } from "./audio.js";

const BASE = new URL("../assets/sounds/", import.meta.url);

/** Every clip that exists on disk. */
export const CLIP_NAMES = new Set([
  "m", "n", "s", "f", "l", "r", "v", "z", "sh", "th", "th2", "ng", "h", "w", "y",
  "b", "d", "g", "p", "t", "k", "j", "ch", "qu", "x", "nk",
  "a", "e", "i", "o", "u", "ay", "ee", "eye", "oh", "yoo", "oo", "uu", "ar", "or", "er", "oy", "ow",
  "st", "sl", "tr", "bl", "fl", "gr", "sp", "cl", "dr", "sn", "sw", "cr", "fr", "pl", "br", "gl", "sm", "pr",
  "mp", "nd", "nt", "sk", "lk", "ft", "lt",
]);

const cache = new Map();
let failed = false;

function load(name) {
  if (!cache.has(name)) {
    const p = (async () => {
      const ctx = audioContext();
      if (!ctx) throw new Error("no audio");
      const res = await fetch(new URL(`${name}.mp3`, BASE));
      if (!res.ok) throw new Error(`clip ${name} ${res.status}`);
      const buf = await res.arrayBuffer();
      return await ctx.decodeAudioData(buf);
    })();
    p.catch(() => { cache.delete(name); failed = true; });
    cache.set(name, p);
  }
  return cache.get(name);
}

/** Warm the cache so the first tap is instant. */
export function preloadClips(names = [...CLIP_NAMES]) {
  for (const n of names) load(n).catch(() => {});
}

export function clipsAvailable() {
  return !failed && !!audioContext();
}

/**
 * Play one clip; resolves when it has finished. Rejects if the clip cannot
 * be loaded so callers can fall back to speech synthesis.
 */
export async function playClip(name, { rate = 1, gain = 1 } = {}) {
  const ctx = audioContext();
  if (!ctx) throw new Error("no audio");
  if (ctx.state === "suspended") { try { await ctx.resume(); } catch { /* ignore */ } }
  const buffer = await load(name);
  return new Promise((resolve) => {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(sfxDestination());
    src.onended = () => resolve();
    src.start();
    setTimeout(resolve, buffer.duration * 1000 / rate + 150);
  });
}
