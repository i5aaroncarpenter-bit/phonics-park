/**
 * Phonics Park audio — formant-ish kid voice, park SFX, Saturday organ loop.
 * Mute follows save.mute. Unlock AudioContext on first tap.
 */

let ctx = null;
let master = null;
let muted = false;
let unlocked = false;
let noiseBuf = null;
let musicTimer = null;
let musicStep = 0;
let musicGain = null;

const PHON = {
  m: { kind: "nasal", f0: 190, f1: 270, f2: 1180, chirp: 180, dur: 0.28 },
  n: { kind: "nasal", f0: 195, f1: 270, f2: 1750, chirp: 210, dur: 0.28 },
  s: { kind: "fric", hp: 4200, chirp: 2200, dur: 0.22 },
  a: { kind: "vowel", f0: 210, f1: 780, f2: 1480, f3: 2500, chirp: 440, dur: 0.32 },
  i: { kind: "vowel", f0: 230, f1: 400, f2: 2100, f3: 2900, chirp: 660, dur: 0.3 },
  o: { kind: "vowel", f0: 200, f1: 520, f2: 900, f3: 2400, chirp: 330, dur: 0.32 },
  e: { kind: "vowel", f0: 220, f1: 530, f2: 1850, f3: 2600, chirp: 520, dur: 0.26 },
  t: { kind: "stop", hp: 2800, chirp: 800, dur: 0.09 },
  p: { kind: "stop", hp: 900, chirp: 700, dur: 0.08 },
  d: { kind: "vstop", f0: 160, hp: 1800, chirp: 500, dur: 0.1 },
  c: { kind: "stop", hp: 1600, chirp: 600, dur: 0.09 },
  k: { kind: "stop", hp: 1600, chirp: 600, dur: 0.09 },
  ck: { kind: "stop", hp: 1600, chirp: 600, dur: 0.1 },
  g: { kind: "vstop", f0: 140, hp: 1200, chirp: 390, dur: 0.11 },
  b: { kind: "vstop", f0: 140, hp: 700, chirp: 280, dur: 0.1 },
  h: { kind: "fric", hp: 900, chirp: 480, dur: 0.14, quiet: 0.12 },
  l: { kind: "vowel", f0: 190, f1: 380, f2: 1200, f3: 2500, chirp: 300, dur: 0.2 },
  r: { kind: "vowel", f0: 180, f1: 450, f2: 1100, f3: 1600, chirp: 260, dur: 0.2 },
  f: { kind: "fric", hp: 1600, chirp: 1400, dur: 0.18 },
  sh: { kind: "fric", hp: 2200, bp: 2800, chirp: 1600, dur: 0.26 },
  ch: { kind: "affric", hp: 2400, chirp: 1200, dur: 0.18 },
  th: { kind: "fric", hp: 1400, bp: 1800, chirp: 900, dur: 0.22, quiet: 0.14 },
  st: { kind: "blend", parts: ["s", "t"] },
  sl: { kind: "blend", parts: ["s", "l"] },
  tr: { kind: "blend", parts: ["t", "r"] },
  bl: { kind: "blend", parts: ["b", "l"] },
  ai: { kind: "vowel", f0: 210, f1: 520, f2: 1900, f3: 2600, chirp: 494, dur: 0.36, glide: [480, 2100] },
  oa: { kind: "vowel", f0: 195, f1: 480, f2: 850, f3: 2300, chirp: 349, dur: 0.36, glide: [400, 780] },
  ee: { kind: "vowel", f0: 240, f1: 300, f2: 2300, f3: 3100, chirp: 659, dur: 0.34 },
  "long-a": { kind: "vowel", f0: 215, f1: 560, f2: 1800, f3: 2600, chirp: 494, dur: 0.36, glide: [480, 2100] },
  "long-i": { kind: "vowel", f0: 210, f1: 700, f2: 1300, f3: 2500, chirp: 392, dur: 0.38, glide: [380, 2200] },
  "long-o": { kind: "vowel", f0: 195, f1: 500, f2: 880, f3: 2300, chirp: 349, dur: 0.36, glide: [400, 780] },
  "long-e": { kind: "vowel", f0: 240, f1: 300, f2: 2300, f3: 3100, chirp: 659, dur: 0.34 },
  silent: { kind: "silent", dur: 0.04 },
};

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.85;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

export function setMuted(flag) {
  muted = !!flag;
  if (musicGain) musicGain.gain.value = muted ? 0 : 0.11;
  if (muted) stopMusic();
  else if (unlocked) startMusic();
}

export function isMuted() {
  return muted;
}

export async function unlock() {
  const c = ensure();
  if (!c) return;
  try {
    if (c.state === "suspended") await c.resume();
  } catch {
    /* ignore */
  }
  unlocked = true;
  if (!muted) startMusic();
}

export function playPhoneme(name) {
  const c = ensure();
  if (!c || muted || c.state !== "running") return 0.2;
  const key = String(name || "").toLowerCase();
  const spec = PHON[key] || PHON.a;
  const t = c.currentTime + 0.01;
  return schedulePhoneme(c, t, spec, key);
}

export function playWord(word, graphemes = [], kind = "") {
  const c = ensure();
  if (!c || muted || c.state !== "running") return 0.4;
  const units = unitsFor(word, graphemes, kind);
  let t = c.currentTime + 0.02;
  for (const u of units) {
    const spec = PHON[u] || PHON.a;
    const used = schedulePhoneme(c, t, spec, u);
    t += used + 0.045;
  }
  return Math.max(0.3, t - c.currentTime);
}

function unitsFor(word, graphemes, kind) {
  if (graphemes && graphemes.length) {
    return graphemes.map((g) => mapGrapheme(g, kind, graphemes));
  }
  return [String(word || "a").toLowerCase()];
}

function mapGrapheme(g, kind, graphemes) {
  const x = String(g).toLowerCase();
  if (x === "e" && kind === "silent-e" && graphemes[graphemes.length - 1] === "e") return "silent";
  if (kind === "silent-e" && (x === "a" || x === "i" || x === "o" || x === "u")) return `long-${x}`;
  if (x === "ai") return "long-a";
  if (x === "oa") return "long-o";
  if (x === "ee") return "long-e";
  return x;
}

function schedulePhoneme(c, t, spec, key) {
  if (spec.kind === "blend") {
    let tt = t;
    let total = 0;
    for (const p of spec.parts) {
      const s = PHON[p] || PHON.a;
      const d = schedulePhoneme(c, tt, s, p);
      tt += d * 0.72;
      total += d * 0.72;
    }
    chirp(c, t, spec.parts ? (PHON[spec.parts[0]]?.chirp || 500) : 500, 0.12, 0.08);
    return total + 0.04;
  }
  if (spec.kind === "silent") {
    chirp(c, t, 180, 0.05, 0.03);
    return spec.dur;
  }
  if (spec.kind === "vowel" || spec.kind === "nasal") {
    vowel(c, t, spec);
    chirp(c, t, spec.chirp, spec.dur * 0.55, 0.1);
    return spec.dur;
  }
  if (spec.kind === "fric") {
    fric(c, t, spec);
    chirp(c, t + 0.02, spec.chirp, spec.dur * 0.4, 0.06);
    return spec.dur;
  }
  if (spec.kind === "stop" || spec.kind === "vstop") {
    stopBurst(c, t, spec);
    chirp(c, t, spec.chirp, 0.07, 0.1);
    return spec.dur + 0.04;
  }
  if (spec.kind === "affric") {
    stopBurst(c, t, { hp: 2000, dur: 0.04 });
    fric(c, t + 0.04, { hp: 2400, dur: 0.12 });
    chirp(c, t, spec.chirp, 0.1, 0.08);
    return spec.dur;
  }
  chirp(c, t, 400, 0.15, 0.1);
  return 0.16;
}

function outGain(c, t, dur, peak) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);
  return g;
}

function vowel(c, t, spec) {
  const dur = spec.dur;
  const g = outGain(c, t, dur, spec.kind === "nasal" ? 0.16 : 0.2);
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(spec.f0, t);
  if (spec.glide) {
    osc.frequency.linearRampToValueAtTime(spec.f0 * 1.06, t + dur);
  }
  const vib = c.createOscillator();
  const vg = c.createGain();
  vib.frequency.value = 5.2;
  vg.gain.value = 3.2;
  vib.connect(vg);
  vg.connect(osc.frequency);
  const formants = [
    [spec.f1, 7, 1],
    [spec.f2, 9, 0.55],
    [spec.f3 || 2600, 11, 0.22],
  ];
  for (const [freq, q, amt] of formants) {
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(freq, t);
    if (spec.glide) bp.frequency.linearRampToValueAtTime(spec.glide[formants.indexOf(formants.find((f) => f[0] === freq)) === 1 ? 1 : 0] || freq, t + dur);
    bp.Q.value = q;
    const fg = c.createGain();
    fg.gain.value = amt;
    osc.connect(bp);
    bp.connect(fg);
    fg.connect(g);
  }
  osc.start(t);
  osc.stop(t + dur + 0.02);
  vib.start(t);
  vib.stop(t + dur + 0.02);
}

function noiseSrc(c, t, dur) {
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  src.start(t);
  src.stop(t + dur + 0.02);
  return src;
}

function fric(c, t, spec) {
  const dur = spec.dur;
  const g = outGain(c, t, dur, spec.quiet || 0.18);
  const src = noiseSrc(c, t, dur);
  const f = c.createBiquadFilter();
  f.type = spec.bp ? "bandpass" : "highpass";
  f.frequency.value = spec.bp || spec.hp || 3000;
  f.Q.value = spec.bp ? 2.2 : 0.8;
  src.connect(f);
  f.connect(g);
}

function stopBurst(c, t, spec) {
  const dur = spec.dur || 0.08;
  const g = outGain(c, t, dur, 0.22);
  const src = noiseSrc(c, t, dur);
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = spec.hp || 1200;
  src.connect(f);
  f.connect(g);
  if (spec.f0) {
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = spec.f0;
    const og = outGain(c, t, dur + 0.04, 0.12);
    osc.connect(og);
    osc.start(t);
    osc.stop(t + dur + 0.04);
  }
}

function chirp(c, t, freq, dur, peak) {
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq * 0.92, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 1.15), t + dur);
  const g = outGain(c, t, dur, peak || 0.08);
  osc.connect(g);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

function tone(c, t, freq, dur, type, peak) {
  const osc = c.createOscillator();
  osc.type = type || "square";
  osc.frequency.setValueAtTime(freq, t);
  const g = outGain(c, t, dur, peak || 0.12);
  osc.connect(g);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

export function sfx(name) {
  const c = ensure();
  if (!c || muted || c.state !== "running") return;
  const t = c.currentTime + 0.005;
  switch (name) {
    case "bat":
    case "crack":
      batCrack(c, t);
      break;
    case "cheer":
      crowdCheer(c, t);
      break;
    case "organ":
      organSting(c, t);
      break;
    case "umpire":
      umpire(c, t);
      break;
    case "glove":
    case "pop":
      glovePop(c, t);
      break;
    case "miss":
    case "boop":
      missBoop(c, t);
      break;
    case "strike":
      umpire(c, t);
      tone(c, t + 0.18, 196, 0.12, "square", 0.1);
      break;
    default:
      chirp(c, t, 520, 0.12, 0.1);
  }
}

function batCrack(c, t) {
  const g = outGain(c, t, 0.22, 0.32);
  const src = noiseSrc(c, t, 0.12);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  src.connect(hp);
  hp.connect(g);
  tone(c, t, 140, 0.08, "square", 0.16);
  tone(c, t + 0.02, 90, 0.1, "triangle", 0.12);
}

function crowdCheer(c, t) {
  for (let i = 0; i < 6; i++) {
    const src = noiseSrc(c, t + i * 0.05, 0.55);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 400 + i * 180;
    bp.Q.value = 1.2;
    const g = outGain(c, t + i * 0.04, 0.7, 0.07);
    src.connect(bp);
    bp.connect(g);
  }
  tone(c, t + 0.05, 523, 0.18, "triangle", 0.06);
  tone(c, t + 0.18, 659, 0.2, "triangle", 0.06);
}

function organSting(c, t) {
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((f, i) => {
    const osc = c.createOscillator();
    osc.type = "square";
    osc.frequency.value = f;
    const g = outGain(c, t + i * 0.09, 0.22, 0.09);
    const f1 = c.createBiquadFilter();
    f1.type = "lowpass";
    f1.frequency.value = 1800;
    osc.connect(f1);
    f1.connect(g);
    osc.start(t + i * 0.09);
    osc.stop(t + i * 0.09 + 0.24);
  });
}

function umpire(c, t) {
  vowel(c, t, { f0: 140, f1: 600, f2: 1100, f3: 2200, dur: 0.16 });
  vowel(c, t + 0.17, { f0: 160, f1: 500, f2: 900, f3: 2000, dur: 0.22 });
  chirp(c, t, 180, 0.14, 0.1);
}

function glovePop(c, t) {
  tone(c, t, 90, 0.07, "sine", 0.18);
  const g = outGain(c, t, 0.1, 0.2);
  const src = noiseSrc(c, t, 0.08);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  src.connect(lp);
  lp.connect(g);
}

function missBoop(c, t) {
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(240, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.18);
  const g = outGain(c, t, 0.2, 0.12);
  osc.connect(g);
  osc.start(t);
  osc.stop(t + 0.22);
}

/* Tiny original Saturday-morning ballpark loop (not a licensed tune). */
const MELODY = [
  [523.25, 1], [587.33, 1], [659.25, 1], [783.99, 1],
  [659.25, 1], [587.33, 1], [523.25, 2],
  [392.0, 1], [440.0, 1], [392.0, 1], [329.63, 1],
  [261.63, 2], [0, 2],
];
const BASS = [130.81, 130.81, 174.61, 196.0, 130.81, 130.81, 196.0, 174.61];

export function startMusic() {
  const c = ensure();
  if (!c || muted || musicTimer) return;
  if (!musicGain) {
    musicGain = c.createGain();
    musicGain.gain.value = 0.1;
    musicGain.connect(master);
  } else {
    musicGain.gain.value = 0.1;
  }
  musicStep = 0;
  const bpm = 112;
  const stepMs = (60 / bpm) * 1000 / 2;
  const tick = () => {
    if (muted || !ctx) return;
    const t = ctx.currentTime + 0.03;
    const beat = musicStep % 8;
    const [freq, len] = MELODY[musicStep % MELODY.length];
    if (freq) {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = freq;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 1400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14 * len);
      osc.connect(filt);
      filt.connect(g);
      g.connect(musicGain);
      osc.start(t);
      osc.stop(t + 0.16 * len);
    }
    const bass = BASS[beat];
    const b = ctx.createOscillator();
    b.type = "triangle";
    b.frequency.value = bass;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    b.connect(bg);
    bg.connect(musicGain);
    b.start(t);
    b.stop(t + 0.24);
    if (beat === 2 || beat === 6) {
      const src = noiseSrc(ctx, t, 0.06);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2000;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.05, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      src.connect(hp);
      hp.connect(ng);
      ng.connect(musicGain);
    }
    musicStep += 1;
  };
  tick();
  musicTimer = setInterval(tick, stepMs);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicGain) musicGain.gain.value = 0;
}

document.addEventListener(
  "pointerdown",
  () => {
    unlock();
  },
  { once: true, capture: true }
);
