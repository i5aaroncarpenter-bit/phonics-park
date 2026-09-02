/**
 * Voice for Phonics Bowl.
 *
 * Words, sentences and the coach are spoken with the Web Speech API (a real
 * human-sounding voice). Isolated letter sounds are spoken with carefully
 * chosen respellings ("mmm", "buh", "shh") so the child hears the SOUND, not
 * the letter name. If speech synthesis is missing we fall back to a tiny
 * formant synthesizer so the game is still playable.
 */

let muted = false;
let rate = 0.92;
let voice = null;
let voiceName = "";
let voicesReady = false;
const live = new Set();
let captionFn = null;

/** Register a listener that receives coach/announcer lines for on-screen captions. */
export function onCaption(fn) {
  captionFn = fn;
}

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

/** Respellings that make text-to-speech produce a phoneme instead of a letter name. */
const SOUND = {
  m: "mmm", n: "nnn", s: "sss", f: "fff", l: "lll", r: "rrr", v: "vvv", z: "zzz",
  b: "buh", c: "kuh", k: "kuh", ck: "kuh", d: "duh", g: "guh", p: "puh", t: "tuh", j: "juh",
  h: "huh", w: "wuh", y: "yuh", qu: "kwuh", x: "ks", ch: "chuh", sh: "shh", th: "thuh", wh: "wuh",
  ng: "ing", nk: "ink", ll: "lll", ss: "sss", ff: "fff", dd: "duh", mm: "mmm", tt: "tuh", nn: "nnn",
  a: "ah", e: "eh", i: "ih", o: "aw", u: "uh",
  ai: "ay", ay: "ay", "a_e": "ay", "long-a": "ay",
  ee: "ee", ea: "ee", "e_e": "ee", "long-e": "ee",
  ie: "eye", igh: "eye", "i_e": "eye", "long-i": "eye",
  oa: "oh", ow: "oh", "o_e": "oh", "long-o": "oh",
  oo: "oo", ue: "oo", "u_e": "yoo", "long-u": "yoo",
  ar: "ar", or: "or", er: "er", ir: "er", ur: "er", oi: "oy", oy: "oy", ou: "ow",
  st: "sss tuh", sl: "sss lll", tr: "tuh rrr", bl: "buh lll", fl: "fff lll", gr: "guh rrr",
  sp: "sss puh", cl: "kuh lll", dr: "duh rrr", sn: "sss nnn", sw: "sss wuh", cr: "kuh rrr",
  fr: "fff rrr", pl: "puh lll", br: "buh rrr", gl: "guh lll", sm: "sss mmm", pr: "puh rrr",
  mp: "mmm puh", nd: "nnn duh", nt: "nnn tuh", sk: "sss kuh", lk: "lll kuh", ft: "fff tuh", lt: "lll tuh",
  silent: "",
};

/* Kid-friendly voice preference order. */
const PREFERRED = [
  "Google US English", "Samantha", "Microsoft Aria", "Microsoft Jenny", "Microsoft Ana",
  "Microsoft Zira", "Karen", "Moira", "Tessa", "Allison", "Ava", "Susan", "Google UK English Female",
];

export function speechAvailable() {
  return !!(synth && typeof SpeechSynthesisUtterance !== "undefined");
}

export function initSpeech(prefName) {
  if (!speechAvailable()) return;
  voiceName = prefName || "";
  // iOS/Safari only allow speech that starts inside a user gesture until the
  // synth has spoken once, so prime it with a silent utterance on first tap.
  document.addEventListener("pointerdown", () => {
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      synth.speak(u);
    } catch { /* ignore */ }
  }, { once: true, capture: true });
  const load = () => {
    const list = synth.getVoices();
    if (!list.length) return;
    voicesReady = true;
    pickVoice(list);
  };
  load();
  if (typeof synth.addEventListener === "function") synth.addEventListener("voiceschanged", load);
  else synth.onvoiceschanged = load;
  // Some browsers only populate voices after a tick.
  setTimeout(load, 300);
  setTimeout(load, 1500);
}

function pickVoice(list) {
  const en = list.filter((v) => /^en[-_]/i.test(v.lang) || v.lang === "en");
  const pool = en.length ? en : list;
  if (voiceName) {
    const exact = pool.find((v) => v.name === voiceName);
    if (exact) { voice = exact; return; }
  }
  for (const name of PREFERRED) {
    const hit = pool.find((v) => v.name.startsWith(name));
    if (hit) { voice = hit; return; }
  }
  voice = pool.find((v) => /en[-_]US/i.test(v.lang) && v.localService) || pool.find((v) => /en[-_]US/i.test(v.lang)) || pool[0] || null;
}

export function listVoices() {
  if (!speechAvailable()) return [];
  return synth.getVoices().filter((v) => /^en/i.test(v.lang)).map((v) => ({ name: v.name, lang: v.lang }));
}

export function currentVoiceName() {
  return voice ? voice.name : "";
}

export function setVoiceByName(name) {
  voiceName = name || "";
  if (speechAvailable()) pickVoice(synth.getVoices());
}

export function setSpeechMuted(flag) {
  muted = !!flag;
  if (muted) stopSpeech();
}

export function setSpeechRate(r) {
  rate = Math.max(0.6, Math.min(1.3, Number(r) || 0.92));
}

export function stopSpeech() {
  if (!speechAvailable()) return;
  try { synth.cancel(); } catch { /* ignore */ }
  live.clear();
}

function utter(text, opts = {}) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || "en-US";
    u.rate = (opts.rate || 1) * rate;
    u.pitch = opts.pitch ?? 1.05;
    u.volume = opts.volume ?? 1;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      live.delete(u);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    live.add(u);
    // Safety net — some engines never fire onend.
    setTimeout(finish, 600 + text.length * 110 / u.rate);
    try { synth.speak(u); } catch { finish(); }
  });
}

/** Speak one or more phrases. Interrupts anything already speaking by default. */
export async function say(text, opts = {}) {
  if (muted || !text) return;
  if (!speechAvailable()) {
    await fallbackWord(String(text));
    return;
  }
  if (opts.interrupt !== false) {
    stopSpeech();
    // Chrome can drop an utterance queued in the same tick as cancel().
    await new Promise((r) => setTimeout(r, 30));
  }
  try { if (synth.paused) synth.resume(); } catch { /* ignore */ }
  const parts = Array.isArray(text) ? text : [text];
  let last;
  for (const p of parts) {
    if (!p) continue;
    last = utter(typeof p === "string" ? p : p.text, typeof p === "string" ? opts : { ...opts, ...p });
  }
  await last;
}

/** Speak a whole word naturally (this is the primary model for the child). */
export function sayWord(item, opts = {}) {
  const word = typeof item === "string" ? item : item.word;
  if (!speechAvailable()) return fallbackWord(word, item);
  return say(word, { rate: opts.slow ? 0.78 : 0.95, pitch: 1.05, interrupt: opts.interrupt });
}

/** Speak a single sound tile. */
export function saySound(g, item) {
  const key = String(g || "").toLowerCase();
  const text = respell(key, item);
  if (!text) return Promise.resolve();
  if (!speechAvailable()) return fallbackSound(key);
  return say(text, { rate: 0.9, pitch: 1.05 });
}

/**
 * Stretch a word out sound-by-sound, then say it whole:
 * "kuh ... ah ... tuh ... cat".
 */
export async function stretchWord(item) {
  if (muted) return;
  const g = item.g || [item.word];
  const units = graphemeUnits(item);
  if (!speechAvailable()) {
    for (const u of units) await fallbackSound(u);
    await fallbackWord(item.word, item);
    return;
  }
  stopSpeech();
  const seq = [];
  for (let i = 0; i < g.length; i++) {
    const t = SOUND[units[i]] ?? units[i];
    if (t) seq.push({ text: t, rate: 0.85, pitch: 1.05 });
  }
  seq.push({ text: item.word, rate: 0.82, pitch: 1.05 });
  await say(seq, { interrupt: false });
}

/** The coach's voice — slightly lower and quicker. */
export function coach(text, opts = {}) {
  if (captionFn) captionFn(text, "coach");
  return say(text, { rate: 1.0, pitch: 0.98, ...opts });
}

/** Cheerful announcer line. */
export function announce(text) {
  if (captionFn) captionFn(text, "announce");
  return say(text, { rate: 1.02, pitch: 1.12 });
}

/** Short play-call cue ("Pass play!") spoken before the prompt. */
export function cue(text) {
  if (captionFn) captionFn(text, "cue");
  return say(text, { rate: 1.08, pitch: 1.15 });
}

/* ---------- grapheme → sound unit ---------- */

/**
 * Map a word's graphemes to the sound units used by the respelling table,
 * handling magic-e (long vowel + silent e) and silent final e in words
 * like horse / purse.
 */
export function graphemeUnits(item) {
  const g = (item.g || [item.word]).map((x) => x.toLowerCase());
  const kind = item.kind || "";
  const out = [...g];
  const last = g.length - 1;
  const finalE = g[last] === "e" && g.length >= 3;
  if (kind === "magic-e" && finalE) {
    out[last] = "silent";
    for (let i = last - 1; i >= 0; i--) {
      if ("aeiou".includes(g[i]) && g[i].length === 1) {
        out[i] = `long-${g[i]}`;
        break;
      }
    }
  } else if (finalE && kind !== "word" && kind !== "sight" && g.length >= 4) {
    out[last] = "silent";
  }
  return out;
}

function respell(key, item) {
  if (item && item.g) {
    const idx = item.g.map((x) => x.toLowerCase()).indexOf(key);
    if (idx >= 0) {
      const unit = graphemeUnits(item)[idx];
      return SOUND[unit] ?? unit;
    }
  }
  return SOUND[key] ?? key;
}

/* ---------- fallback formant synth (no Web Speech) ---------- */

let actx = null;
let noise = null;

function ac() {
  if (actx) return actx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  actx = new AC();
  noise = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return actx;
}

const PHON = {
  m: { kind: "nasal", f0: 190, f1: 270, f2: 1180, dur: 0.28 }, n: { kind: "nasal", f0: 195, f1: 270, f2: 1750, dur: 0.28 },
  s: { kind: "fric", hp: 4200, dur: 0.22 }, f: { kind: "fric", hp: 1600, dur: 0.18 }, sh: { kind: "fric", bp: 2800, dur: 0.26 },
  th: { kind: "fric", bp: 1800, dur: 0.22, quiet: 0.12 }, h: { kind: "fric", hp: 900, dur: 0.14, quiet: 0.12 },
  a: { kind: "vowel", f0: 210, f1: 780, f2: 1480, dur: 0.3 }, e: { kind: "vowel", f0: 220, f1: 530, f2: 1850, dur: 0.26 },
  i: { kind: "vowel", f0: 230, f1: 400, f2: 2100, dur: 0.28 }, o: { kind: "vowel", f0: 200, f1: 520, f2: 900, dur: 0.3 },
  u: { kind: "vowel", f0: 200, f1: 620, f2: 1200, dur: 0.26 }, l: { kind: "vowel", f0: 190, f1: 380, f2: 1200, dur: 0.2 },
  r: { kind: "vowel", f0: 180, f1: 450, f2: 1100, dur: 0.2 }, w: { kind: "vowel", f0: 180, f1: 350, f2: 800, dur: 0.16 },
  y: { kind: "vowel", f0: 230, f1: 300, f2: 2300, dur: 0.16 }, v: { kind: "nasal", f0: 170, f1: 300, f2: 1100, dur: 0.2 },
  z: { kind: "fric", hp: 4000, dur: 0.22 },
  t: { kind: "stop", hp: 2800, dur: 0.09 }, p: { kind: "stop", hp: 900, dur: 0.08 }, k: { kind: "stop", hp: 1600, dur: 0.09 },
  c: { kind: "stop", hp: 1600, dur: 0.09 }, ck: { kind: "stop", hp: 1600, dur: 0.09 }, ch: { kind: "stop", hp: 2400, dur: 0.14 },
  d: { kind: "vstop", f0: 160, hp: 1800, dur: 0.1 }, g: { kind: "vstop", f0: 140, hp: 1200, dur: 0.11 },
  b: { kind: "vstop", f0: 140, hp: 700, dur: 0.1 }, j: { kind: "vstop", f0: 150, hp: 2200, dur: 0.12 },
  "long-a": { kind: "vowel", f0: 215, f1: 560, f2: 1800, dur: 0.36 }, "long-e": { kind: "vowel", f0: 240, f1: 300, f2: 2300, dur: 0.34 },
  "long-i": { kind: "vowel", f0: 210, f1: 700, f2: 1300, dur: 0.38 }, "long-o": { kind: "vowel", f0: 195, f1: 500, f2: 880, dur: 0.36 },
  "long-u": { kind: "vowel", f0: 210, f1: 330, f2: 900, dur: 0.36 },
};
const ALIAS = { ai: "long-a", ay: "long-a", ee: "long-e", ea: "long-e", oa: "long-o", ow: "long-o", oo: "long-u", ie: "long-i", igh: "long-i",
  ar: "a", or: "o", er: "u", ir: "u", ur: "u", wh: "w", qu: "k", ng: "n", nk: "n", ll: "l", ss: "s", ff: "f", x: "s", silent: null };

function synthUnit(c, t, unit) {
  let key = ALIAS[unit] === undefined ? unit : ALIAS[unit];
  if (key === null) return 0.04;
  if (!PHON[key] && key.length === 2) {
    const a = synthUnit(c, t, key[0]);
    const b = synthUnit(c, t + a * 0.7, key[1]);
    return a * 0.7 + b;
  }
  const spec = PHON[key] || PHON.a;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(spec.quiet || 0.2, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + spec.dur);
  g.connect(c.destination);
  if (spec.kind === "vowel" || spec.kind === "nasal") {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = spec.f0;
    for (const [f, q, amt] of [[spec.f1, 7, 1], [spec.f2, 9, 0.5]]) {
      const bp = c.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q;
      const fg = c.createGain(); fg.gain.value = amt;
      osc.connect(bp); bp.connect(fg); fg.connect(g);
    }
    osc.start(t); osc.stop(t + spec.dur + 0.02);
  } else {
    const src = c.createBufferSource();
    src.buffer = noise; src.loop = true;
    const f = c.createBiquadFilter();
    f.type = spec.bp ? "bandpass" : "highpass";
    f.frequency.value = spec.bp || spec.hp || 2000;
    src.connect(f); f.connect(g);
    src.start(t); src.stop(t + spec.dur + 0.02);
    if (spec.f0) {
      const osc = c.createOscillator();
      osc.type = "triangle"; osc.frequency.value = spec.f0;
      const og = c.createGain();
      og.gain.setValueAtTime(0.12, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + spec.dur + 0.04);
      osc.connect(og); og.connect(c.destination);
      osc.start(t); osc.stop(t + spec.dur + 0.05);
    }
  }
  return spec.dur;
}

async function fallbackSound(unit) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") { try { await c.resume(); } catch { /* ignore */ } }
  const d = synthUnit(c, c.currentTime + 0.01, unit);
  await new Promise((r) => setTimeout(r, d * 1000 + 40));
}

async function fallbackWord(word, item) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") { try { await c.resume(); } catch { /* ignore */ } }
  const units = item && item.g ? graphemeUnits(item) : String(word).toLowerCase().replace(/[^a-z]/g, "").split("");
  let t = c.currentTime + 0.02;
  for (const u of units) t += synthUnit(c, t, u) + 0.03;
  await new Promise((r) => setTimeout(r, (t - c.currentTime) * 1000 + 40));
}
