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

/* ---------- listening (Speak the Sword) ---------- */

function Recognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function recognitionAvailable() {
  return !!Recognition() && (typeof isSecureContext === "undefined" || isSecureContext);
}

/**
 * Start listening. `onUpdate(text, isFinal)` receives the growing transcript.
 * Returns { stop(), done } where `done` resolves { transcript, error } once
 * recognition ends (by stop(), silence, or a timeout).
 */
export function startListening({ lang = "en-US", maxMs = 45000, onUpdate = null } = {}) {
  const R = Recognition();
  let finals = [];
  let interim = "";
  let error = null;
  let stopped = false;
  let rec = null;
  let timer = 0;
  const done = new Promise((resolve) => {
    const settle = () => {
      clearTimeout(timer);
      resolve({ transcript: [...finals, interim].join(" ").replace(/\s+/g, " ").trim(), error });
    };
    if (!R) {
      error = "unsupported";
      settle();
      return;
    }
    stopSpeaking();
    duck(true);
    rec = new R();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals.push(t);
        else interim += t;
      }
      if (onUpdate) onUpdate([...finals, interim].join(" ").replace(/\s+/g, " ").trim(), false);
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") error = e.error || "error";
    };
    rec.onend = () => {
      duck(false);
      settle();
    };
    try {
      rec.start();
    } catch (e) {
      error = "start-failed";
      duck(false);
      settle();
    }
    timer = setTimeout(() => stop(), maxMs);
  });
  function stop() {
    if (stopped) return;
    stopped = true;
    try {
      rec && rec.stop();
    } catch {
      /* ignore */
    }
  }
  return { stop, done };
}
