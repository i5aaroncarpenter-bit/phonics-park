/**
 * Verses are read aloud with the Web Speech API so pre-readers can play
 * too. Word boundaries are reported (when the browser supports them) so
 * the Forge can highlight words as they are spoken.
 */

import { duck } from "./audio.js";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
let enabled = true;
let voice = null;
let current = null;

const PREFERRED = [
  "Google US English", "Samantha", "Microsoft Aria", "Microsoft Jenny", "Microsoft Guy",
  "Microsoft Zira", "Daniel", "Karen", "Moira", "Google UK English Male", "Google UK English Female",
];

export function speechAvailable() {
  return !!(synth && typeof SpeechSynthesisUtterance !== "undefined");
}

export function setSpeechEnabled(on) {
  enabled = !!on;
  if (!enabled) stopSpeaking();
}

export function initSpeech() {
  if (!speechAvailable()) return;
  const load = () => {
    const list = synth.getVoices();
    if (!list.length) return;
    const en = list.filter((v) => /^en/i.test(v.lang));
    voice = null;
    for (const name of PREFERRED) {
      const v = en.find((x) => x.name.includes(name));
      if (v) {
        voice = v;
        break;
      }
    }
    if (!voice) voice = en.find((v) => v.default) || en[0] || list[0];
  };
  load();
  if (typeof synth.addEventListener === "function") synth.addEventListener("voiceschanged", load);
  else synth.onvoiceschanged = load;
  setTimeout(load, 500);
  // iOS only allows speech started inside a gesture until the synth has spoken once.
  document.addEventListener(
    "pointerdown",
    () => {
      try {
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0;
        synth.speak(u);
      } catch {
        /* ignore */
      }
    },
    { once: true, capture: true },
  );
}

export function stopSpeaking() {
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    /* ignore */
  }
  current = null;
  duck(false);
}

/**
 * Speak text. onWord(index) fires as each word starts (best effort).
 * Resolves when speech ends or is cancelled.
 */
export function speak(text, { rate = 0.9, onWord = null, onEnd = null } = {}) {
  return new Promise((resolve) => {
    if (!enabled || !speechAvailable() || !text) {
      if (onEnd) onEnd();
      resolve(false);
      return;
    }
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1;
    u.volume = 1;
    current = u;
    const words = text.split(/\s+/);
    // Character offsets for each word so charIndex can be mapped to a word index.
    const offsets = [];
    let pos = 0;
    for (const w of words) {
      const i = text.indexOf(w, pos);
      offsets.push(i);
      pos = i + w.length;
    }
    let boundaryFired = false;
    let fallback = null;
    if (onWord) {
      u.onboundary = (e) => {
        if (e.name && e.name !== "word") return;
        boundaryFired = true;
        let idx = 0;
        for (let i = 0; i < offsets.length; i++) if (offsets[i] <= e.charIndex) idx = i;
        onWord(idx);
      };
      // Browsers without boundary events (Safari, some Android) get a timed sweep.
      const perWord = Math.max(180, (text.length * 62) / Math.max(1, words.length) / rate);
      let i = 0;
      fallback = setInterval(() => {
        if (boundaryFired) {
          clearInterval(fallback);
          return;
        }
        if (i < words.length) onWord(i++);
      }, perWord);
    }
    const done = () => {
      if (fallback) clearInterval(fallback);
      if (current === u) current = null;
      duck(false);
      if (onEnd) onEnd();
      resolve(true);
    };
    u.onend = done;
    u.onerror = done;
    duck(true);
    try {
      synth.speak(u);
    } catch {
      done();
    }
  });
}

export function isSpeaking() {
  return !!(synth && synth.speaking);
}
