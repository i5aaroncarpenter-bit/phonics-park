/**
 * Stadium audio for Phonics Bowl — all synthesized with Web Audio so the game
 * ships with zero binary assets. Whistles, crowd, tackles, kicks, fanfares
 * and two original marching-band style loops.
 */

import { setSpeechMuted, onSpeaking } from "./speech.js";

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let noiseBuf = null;
let muted = false;
let unlocked = false;
let crowdNode = null;
let crowdGain = null;
let seq = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 6;
  master.connect(comp);
  comp.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.16;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

export async function unlock() {
  const c = ensure();
  if (!c) return;
  try { if (c.state === "suspended") await c.resume(); } catch { /* ignore */ }
  unlocked = true;
}

export function isMuted() {
  return muted;
}

export function setMuted(flag) {
  muted = !!flag;
  setSpeechMuted(muted);
  if (master) master.gain.value = muted ? 0 : 0.9;
}

function ready() {
  const c = ensure();
  return c && !muted && c.state === "running" ? c : null;
}

/* ---------- building blocks ---------- */

function env(c, t, dur, peak, dest, attack = 0.012) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest || sfxBus);
  return g;
}

function tone(c, t, freq, dur, type = "square", peak = 0.12, dest, glideTo) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, glideTo), t + dur);
  const g = env(c, t, dur, peak, dest);
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.02);
  return o;
}

function noise(c, t, dur, { type = "highpass", freq = 2000, q = 0.8, peak = 0.2, dest, sweepTo } = {}) {
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = env(c, t, dur, peak, dest);
  src.connect(f);
  f.connect(g);
  src.start(t);
  src.stop(t + dur + 0.03);
}

/* ---------- SFX ---------- */

export function sfx(name, opt = {}) {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.005;
  switch (name) {
    case "whistle": whistle(c, t, opt.long); break;
    case "snap": tone(c, t, 220, 0.05, "square", 0.1, sfxBus, 90); noise(c, t, 0.05, { freq: 3000, peak: 0.12 }); break;
    case "throw": noise(c, t, 0.35, { type: "bandpass", freq: 600, sweepTo: 2600, q: 1.5, peak: 0.18 }); break;
    case "catch": tone(c, t, 160, 0.09, "sine", 0.2, sfxBus, 90); noise(c, t, 0.06, { type: "lowpass", freq: 900, peak: 0.15 }); break;
    case "tackle": tackle(c, t); break;
    case "kick": tone(c, t, 120, 0.12, "sine", 0.3, sfxBus, 55); noise(c, t, 0.1, { type: "lowpass", freq: 1200, peak: 0.2 }); break;
    case "post": tone(c, t, 880, 0.5, "triangle", 0.14, sfxBus, 860); tone(c, t, 1320, 0.3, "sine", 0.06); break;
    case "run": for (let i = 0; i < 4; i++) noise(c, t + i * 0.13, 0.06, { type: "lowpass", freq: 700, peak: 0.08 }); break;
    case "cheer": crowdCheer(c, t, opt.big); break;
    case "aww": crowdAww(c, t); break;
    case "touchdown": fanfare(c, t); crowdCheer(c, t + 0.05, true); break;
    case "firstdown": chime(c, t, [659.25, 783.99, 1046.5]); break;
    case "coin": chime(c, t, [1046.5, 1318.5], 0.07, 0.07); break;
    case "coins": for (let i = 0; i < 5; i++) chime(c, t + i * 0.07, [1046.5 + i * 120], 0.06, 0.06); break;
    case "star": chime(c, t, [523.25, 659.25, 783.99, 1046.5], 0.1, 0.1); break;
    case "click": tone(c, t, 660, 0.05, "triangle", 0.08, sfxBus, 520); break;
    case "tap": tone(c, t, 520, 0.06, "sine", 0.1, sfxBus, 600); break;
    case "wrong": tone(c, t, 240, 0.18, "square", 0.09, sfxBus, 120); break;
    case "buzzer": tone(c, t, 110, 0.7, "sawtooth", 0.16); tone(c, t, 112, 0.7, "square", 0.08); break;
    case "fire": fireSting(c, t); break;
    case "drumroll": for (let i = 0; i < 12; i++) noise(c, t + i * 0.055, 0.04, { type: "bandpass", freq: 1800, q: 1.2, peak: 0.1 + i * 0.01 }); break;
    case "hike": tone(c, t, 300, 0.08, "square", 0.08, sfxBus, 220); tone(c, t + 0.1, 380, 0.1, "square", 0.08, sfxBus, 260); break;
    case "win": fanfare(c, t); fanfare(c, t + 0.9, true); crowdCheer(c, t, true); break;
    case "lose": tone(c, t, 330, 0.3, "triangle", 0.1, sfxBus, 262); tone(c, t + 0.35, 262, 0.5, "triangle", 0.1, sfxBus, 196); break;
    case "trophy": chime(c, t, [523.25, 659.25, 783.99, 1046.5, 1318.5], 0.14, 0.12); break;
    default: tone(c, t, 500, 0.08, "triangle", 0.08);
  }
}

function whistle(c, t, long) {
  const dur = long ? 0.9 : 0.45;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(2300, t);
  const trill = c.createOscillator();
  trill.frequency.value = 38;
  const tg = c.createGain();
  tg.gain.value = 140;
  trill.connect(tg);
  tg.connect(o.frequency);
  const g = env(c, t, dur, 0.16, sfxBus, 0.02);
  o.connect(g);
  o.start(t); o.stop(t + dur + 0.02);
  trill.start(t); trill.stop(t + dur + 0.02);
  noise(c, t, dur, { type: "bandpass", freq: 2300, q: 8, peak: 0.05 });
}

function tackle(c, t) {
  tone(c, t, 90, 0.18, "sine", 0.35, sfxBus, 40);
  noise(c, t, 0.14, { type: "lowpass", freq: 700, peak: 0.28 });
  noise(c, t + 0.02, 0.2, { type: "bandpass", freq: 300, q: 1, peak: 0.12 });
}

function crowdCheer(c, t, big) {
  const n = big ? 10 : 6;
  for (let i = 0; i < n; i++) {
    noise(c, t + i * 0.05, big ? 1.6 : 0.8, { type: "bandpass", freq: 350 + i * 160, q: 1.1, peak: big ? 0.07 : 0.05 });
  }
  if (big) {
    for (let i = 0; i < 3; i++) noise(c, t + 0.3 + i * 0.3, 0.7, { type: "bandpass", freq: 900 + i * 300, q: 2, peak: 0.04 });
  }
}

function crowdAww(c, t) {
  for (let i = 0; i < 4; i++) {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(220 + i * 40, t);
    o.frequency.exponentialRampToValueAtTime(150 + i * 25, t + 0.7);
    const f = c.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 900;
    const g = env(c, t + i * 0.03, 0.7, 0.035, sfxBus, 0.08);
    o.connect(f); f.connect(g);
    o.start(t); o.stop(t + 0.8);
  }
  noise(c, t, 0.7, { type: "bandpass", freq: 500, q: 1, peak: 0.05 });
}

function chime(c, t, notes, step = 0.09, len = 0.25) {
  notes.forEach((f, i) => {
    tone(c, t + i * step, f, len, "triangle", 0.12);
    tone(c, t + i * step, f * 2, len * 0.6, "sine", 0.04);
  });
}

/* Original stadium horn riff. */
function fanfare(c, t, alt) {
  const riff = alt
    ? [[392, 0.12], [523.25, 0.12], [659.25, 0.12], [783.99, 0.3], [659.25, 0.12], [783.99, 0.45]]
    : [[392, 0.11], [392, 0.11], [392, 0.11], [523.25, 0.32], [659.25, 0.12], [783.99, 0.5]];
  let tt = t;
  for (const [f, d] of riff) {
    for (const [mult, type, pk] of [[1, "sawtooth", 0.09], [1.003, "square", 0.05], [0.5, "triangle", 0.07]]) {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = f * mult;
      const fl = c.createBiquadFilter();
      fl.type = "lowpass";
      fl.frequency.setValueAtTime(900, tt);
      fl.frequency.exponentialRampToValueAtTime(3200, tt + 0.05);
      const g = env(c, tt, d, pk, sfxBus, 0.02);
      o.connect(fl); fl.connect(g);
      o.start(tt); o.stop(tt + d + 0.03);
    }
    tt += d + 0.03;
  }
}

function fireSting(c, t) {
  [[523.25, 0], [659.25, 0.07], [783.99, 0.14], [1046.5, 0.21], [1318.5, 0.3]].forEach(([f, dt]) => {
    tone(c, t + dt, f, 0.22, "square", 0.08);
    tone(c, t + dt, f / 2, 0.22, "sawtooth", 0.05);
  });
  noise(c, t, 0.5, { type: "bandpass", freq: 800, sweepTo: 4000, q: 1.5, peak: 0.1 });
}

/* ---------- ambient crowd ---------- */

export function crowd(level = 0.4) {
  const c = ready();
  if (!c) return;
  if (!crowdNode) {
    crowdNode = c.createBufferSource();
    crowdNode.buffer = noiseBuf;
    crowdNode.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 500;
    f.Q.value = 0.7;
    crowdGain = c.createGain();
    crowdGain.gain.value = 0;
    crowdNode.connect(f);
    f.connect(crowdGain);
    crowdGain.connect(sfxBus);
    crowdNode.start();
  }
  crowdGain.gain.cancelScheduledValues(c.currentTime);
  crowdGain.gain.setTargetAtTime(level * 0.06, c.currentTime, 0.6);
}

export function crowdOff() {
  if (crowdGain && ctx) crowdGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
}

/* ---------- music sequencer ---------- */

const NOTE = { C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99 };

const TRACKS = {
  menu: {
    bpm: 128,
    kick:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1],
    hat:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass:  ["C3", 0, "C3", 0, "G3", 0, "G3", 0, "A3", 0, "A3", 0, "F3", 0, "G3", 0],
    lead:  ["C5", 0, "E5", 0, "G5", 0, "E5", 0, "D5", 0, "C5", 0, "D5", "E5", 0, 0,
            "C5", 0, "E5", 0, "G5", 0, "A4", 0, "B4", 0, "C5", 0, "D5", 0, 0, 0],
  },
  game: {
    bpm: 140,
    kick:  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    snare: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    hat:   [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
    bass:  ["E3", 0, 0, "E3", 0, 0, "G3", 0, "E3", 0, 0, "E3", 0, "D3", 0, 0],
    lead:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            "E4", 0, "G4", 0, "A4", 0, 0, 0, "G4", 0, "E4", 0, 0, 0, 0, 0],
  },
  victory: {
    bpm: 120,
    kick:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    hat:   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bass:  ["C3", 0, "G3", 0, "C3", 0, "G3", 0, "F3", 0, "C3", 0, "G3", 0, "G3", 0],
    lead:  ["C5", "C5", "G4", 0, "E5", 0, "C5", 0, "D5", 0, "E5", "D5", "C5", 0, 0, 0,
            "E5", "E5", "C5", 0, "G5", 0, "E5", 0, "D5", 0, "C5", "D5", "E5", 0, 0, 0],
  },
};

export function startMusic(track = "menu") {
  const c = ensure();
  if (!c) return;
  if (seq && seq.track === track) return;
  stopMusic();
  const T = TRACKS[track] || TRACKS.menu;
  const stepDur = 60 / T.bpm / 4;
  seq = { track, step: 0, next: c.currentTime + 0.05, timer: 0 };
  const schedule = () => {
    if (!seq || muted) return;
    while (seq.next < c.currentTime + 0.18) {
      const t = seq.next;
      const i = seq.step % 16;
      const li = seq.step % T.lead.length;
      if (T.kick[i]) { tone(c, t, 150, 0.16, "sine", 0.5, musicBus, 45); }
      if (T.snare[i]) noise(c, t, 0.12, { type: "bandpass", freq: 1900, q: 0.9, peak: 0.28, dest: musicBus });
      if (T.hat[i]) noise(c, t, 0.035, { type: "highpass", freq: 7000, peak: i % 2 ? 0.07 : 0.11, dest: musicBus });
      if (T.bass[i]) tone(c, t, NOTE[T.bass[i]], stepDur * 1.6, "triangle", 0.45, musicBus);
      if (T.lead[li]) {
        tone(c, t, NOTE[T.lead[li]], stepDur * 1.5, "square", 0.13, musicBus);
        tone(c, t, NOTE[T.lead[li]] * 0.5, stepDur * 1.5, "sawtooth", 0.05, musicBus);
      }
      seq.next += stepDur;
      seq.step += 1;
    }
  };
  schedule();
  seq.timer = setInterval(schedule, 60);
}

export function stopMusic() {
  if (seq) {
    clearInterval(seq.timer);
    seq = null;
  }
}

let musicLevel = 0.16;
export function musicVolume(v) {
  musicLevel = v;
  if (musicBus) musicBus.gain.setTargetAtTime(v, ctx.currentTime, 0.3);
}

// Duck the music while the voice is talking so words stay crystal clear.
onSpeaking((isSpeaking) => {
  if (!musicBus || !ctx) return;
  musicBus.gain.setTargetAtTime(isSpeaking ? musicLevel * 0.3 : musicLevel, ctx.currentTime, 0.15);
});

document.addEventListener("pointerdown", () => { unlock(); }, { once: true, capture: true });
