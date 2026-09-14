/**
 * Sound: synthesized SFX (coins, sword clangs, shield blocks, fanfares) and
 * a heroic little music loop, all from WebAudio. No files to download.
 */

let ctx = null;
let master = null;
let musicGain = null;
let noiseBuf = null;
let unlocked = false;
let sfxOn = true;
let musicOn = true;
let musicTimer = null;
let step = 0;
let musicMode = "camp";

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.12;
  musicGain.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
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
  if (musicOn) startMusic(musicMode);
}

export function setSfx(on) {
  sfxOn = !!on;
}
export function setMusic(on) {
  musicOn = !!on;
  if (!musicOn) stopMusic();
  else if (unlocked) startMusic(musicMode);
}

function ready() {
  return ctx && sfxOn && ctx.state === "running";
}

function tone(freq, t, dur, { type = "square", vol = 0.2, slide = 0, attack = 0.005 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(t, dur, { hp = 1000, vol = 0.3, q = 1 } = {}) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = hp;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t);
  s.stop(t + dur + 0.02);
}

export function sfx(name) {
  if (!ready()) return;
  const t = ctx.currentTime + 0.005;
  switch (name) {
    case "tap":
      tone(660, t, 0.06, { type: "triangle", vol: 0.12 });
      break;
    case "good":
      tone(523, t, 0.09, { type: "triangle", vol: 0.18 });
      tone(784, t + 0.08, 0.14, { type: "triangle", vol: 0.18 });
      break;
    case "bad":
      tone(220, t, 0.18, { type: "sawtooth", vol: 0.12, slide: -80 });
      break;
    case "coin":
      tone(1318, t, 0.08, { type: "square", vol: 0.1 });
      tone(1760, t + 0.07, 0.16, { type: "square", vol: 0.1 });
      break;
    case "coins":
      for (let i = 0; i < 5; i++) {
        tone(1200 + i * 160, t + i * 0.06, 0.1, { type: "square", vol: 0.08 });
      }
      break;
    case "clang":
      noise(t, 0.12, { hp: 3200, vol: 0.35, q: 2 });
      tone(1900, t, 0.25, { type: "triangle", vol: 0.12, slide: -600 });
      tone(2600, t, 0.18, { type: "sine", vol: 0.08, slide: -900 });
      break;
    case "slash":
      noise(t, 0.16, { hp: 1800, vol: 0.3, q: 0.8 });
      tone(400, t, 0.16, { type: "sawtooth", vol: 0.08, slide: -250 });
      break;
    case "crit":
      noise(t, 0.2, { hp: 2400, vol: 0.4, q: 1.5 });
      tone(180, t, 0.3, { type: "sawtooth", vol: 0.18, slide: -120 });
      tone(2200, t + 0.03, 0.3, { type: "triangle", vol: 0.12, slide: -1200 });
      break;
    case "block":
      noise(t, 0.08, { hp: 900, vol: 0.35, q: 3 });
      tone(320, t, 0.2, { type: "square", vol: 0.1, slide: -100 });
      break;
    case "hurt":
      tone(160, t, 0.22, { type: "sawtooth", vol: 0.15, slide: -60 });
      noise(t, 0.1, { hp: 500, vol: 0.2 });
      break;
    case "roar":
      tone(90, t, 0.7, { type: "sawtooth", vol: 0.2, slide: -40 });
      noise(t, 0.6, { hp: 300, vol: 0.25, q: 0.7 });
      break;
    case "whoosh":
      noise(t, 0.25, { hp: 1200, vol: 0.2, q: 0.5 });
      break;
    case "tick":
      tone(880, t, 0.04, { type: "square", vol: 0.05 });
      break;
    case "fanfare": {
      const seq = [523, 659, 784, 1047];
      seq.forEach((f, i) => tone(f, t + i * 0.12, 0.3, { type: "square", vol: 0.12 }));
      tone(1319, t + 0.5, 0.6, { type: "square", vol: 0.14 });
      tone(659, t + 0.5, 0.6, { type: "triangle", vol: 0.1 });
      break;
    }
    case "victory": {
      const seq = [392, 523, 659, 784, 1047, 784, 1047];
      seq.forEach((f, i) => tone(f, t + i * 0.11, 0.28, { type: "square", vol: 0.13 }));
      tone(1319, t + 0.8, 0.9, { type: "square", vol: 0.15 });
      tone(784, t + 0.8, 0.9, { type: "triangle", vol: 0.12 });
      tone(523, t + 0.8, 0.9, { type: "triangle", vol: 0.1 });
      break;
    }
    case "defeat":
      [392, 349, 311, 262].forEach((f, i) => tone(f, t + i * 0.22, 0.4, { type: "triangle", vol: 0.14 }));
      break;
    case "levelup":
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.07, 0.35, { type: "triangle", vol: 0.14 }));
      break;
    case "unlock":
      tone(440, t, 0.12, { type: "triangle", vol: 0.14 });
      tone(880, t + 0.12, 0.3, { type: "triangle", vol: 0.14 });
      break;
    case "drum":
      tone(110, t, 0.25, { type: "sine", vol: 0.35, slide: -60 });
      noise(t, 0.08, { hp: 200, vol: 0.2 });
      break;
    case "page":
      noise(t, 0.18, { hp: 2200, vol: 0.12, q: 0.6 });
      break;
    default:
      tone(600, t, 0.08, { type: "triangle", vol: 0.1 });
  }
}

/* ---------- music ---------- */

const CAMP = {
  bpm: 92,
  bass: [110, 110, 146.8, 146.8, 130.8, 130.8, 98, 110],
  lead: [
    [440, 0], [0, 0], [523, 0], [587, 0], [659, 0], [0, 0], [587, 0], [523, 0],
    [493, 0], [0, 0], [440, 0], [0, 0], [392, 0], [440, 0], [493, 0], [0, 0],
  ],
};
const BATTLE = {
  bpm: 132,
  bass: [82.4, 82.4, 82.4, 98, 82.4, 82.4, 73.4, 77.8],
  lead: [
    [330, 0], [330, 0], [392, 0], [0, 0], [330, 0], [0, 0], [294, 0], [330, 0],
    [349, 0], [0, 0], [330, 0], [294, 0], [262, 0], [0, 0], [294, 0], [247, 0],
  ],
};

function musicTick(pattern) {
  if (!ctx || !musicOn) return;
  const t = ctx.currentTime + 0.02;
  const beat = 60 / pattern.bpm / 2;
  const bass = pattern.bass[Math.floor(step / 2) % pattern.bass.length];
  if (step % 2 === 0) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = bass;
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.8);
    o.connect(g).connect(musicGain);
    o.start(t);
    o.stop(t + beat * 2);
  }
  if (musicMode === "battle" && step % 4 === 0) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 220;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    s.connect(f).connect(g).connect(musicGain);
    s.start(t);
    s.stop(t + 0.2);
  }
  const [f] = pattern.lead[step % pattern.lead.length];
  if (f) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = musicMode === "battle" ? "square" : "triangle";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.95);
    o.connect(g).connect(musicGain);
    o.start(t);
    o.stop(t + beat);
  }
  step += 1;
  musicTimer = setTimeout(() => musicTick(pattern), beat * 1000);
}

export function startMusic(mode = musicMode) {
  musicMode = mode;
  if (!ctx || !musicOn || !unlocked) return;
  stopMusic();
  step = 0;
  musicTick(mode === "battle" ? BATTLE : CAMP);
}

export function stopMusic() {
  if (musicTimer) clearTimeout(musicTimer);
  musicTimer = null;
}

export function duck(on) {
  if (!musicGain || !ctx) return;
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(on ? 0.04 : 0.12, ctx.currentTime + 0.2);
}
