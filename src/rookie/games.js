/**
 * Little League rounds for ages 3–5. No clocks, huge targets, everything is
 * spoken, wrong taps just bounce, and after two misses the answer glows.
 *
 *   parade    meet a letter (name, sound, keyword) then find it
 *   trace     finger-trace the uppercase letter
 *   lineup    which picture starts with this sound?
 *   rhyme     which picture rhymes?
 *   clap      clap the syllables, then pick how many
 *   alphabet  tap the letters in ABC order (with music)
 */

import { esc, ICON } from "../ui.js";
import { say, saySound, sayWord, coach, stopSpeech } from "../speech.js";
import { sfx, audioContext, sfxDestination } from "../audio.js";
import { teamColors } from "../save.js";
import { LETTERS, STARTERS, RHYMES, SYLLABLE_SPLIT, PRAISE, ENCOURAGE, shuffle, pick } from "./data.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function praise() {
  return say(pick(PRAISE), { rate: 1.05, pitch: 1.15 });
}
export function encourage() {
  return say(pick(ENCOURAGE), { rate: 1.0, pitch: 1.05 });
}

function letterName(l) {
  // Speaking a single capital letter makes every voice say the letter's name.
  return say(l.toUpperCase(), { rate: 0.9, pitch: 1.1 });
}

/** Generic 2–3 choice round with gentle retries. Returns {correct, tries}. */
function choiceRound(D, { title, prompt, visual, options, speakPrompt, speakOption, onCorrect }) {
  return new Promise((resolve) => {
    let tries = 0;
    let done = false;
    D.panel.innerHTML = `
      <div class="play-head"><div class="play-title">${ICON.play} ${title}</div><div class="prompt">${prompt}</div></div>
      ${visual || ""}
      <div class="opt-row rookie-opts" id="opts">
        ${options.map((o, i) => `<button class="opt ${o.big ? "opt-big" : "opt-letter"} ${o.cls || ""}" data-i="${i}" type="button" aria-label="${esc(o.label || o.text)}">${o.html || esc(o.text)}</button>`).join("")}
      </div>
      <div class="controls"><button class="btn icon-btn" id="hear" type="button" aria-label="Hear it again">${ICON.ear}</button></div>
    `;
    const opts = D.panel.querySelector("#opts");
    D.panel.querySelector("#hear").onclick = () => { sfx("tap"); speakPrompt(); };
    let busy = false;
    opts.querySelectorAll(".opt").forEach((btn) => {
      btn.onclick = async () => {
        if (busy || done) return;
        busy = true;
        stopSpeech();
        const o = options[Number(btn.dataset.i)];
        tries += 1;
        if (speakOption) await speakOption(o);
        if (o.correct) {
          done = true;
          btn.classList.add("good");
          opts.querySelectorAll(".opt").forEach((b) => { b.disabled = true; });
          sfx("catch");
          if (onCorrect) await onCorrect(o);
          await praise();
          resolve({ correct: tries === 1, tries });
          return;
        }
        btn.classList.add("bad");
        btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake");
        sfx("wrong");
        await encourage();
        btn.classList.remove("bad");
        btn.disabled = true;
        if (tries >= 2) {
          const right = opts.querySelector(`.opt[data-i="${options.findIndex((x) => x.correct)}"]`);
          if (right) right.classList.add("glow");
        }
        await speakPrompt();
        busy = false;
      };
    });
    speakPrompt();
  });
}

/* ---------- PARADE + FIND ---------- */

export async function parade(D, L, learned) {
  D.panel.innerHTML = `
    <div class="play-head"><div class="play-title">${ICON.play} LETTER PARADE</div><div class="prompt">Meet the letter ${L.upper}!</div></div>
    <div class="parade">
      <button class="letter-card big-letter" id="big" type="button"><span class="up">${L.upper}</span><span class="low">${L.l}</span></button>
      <div class="parade-word"><span class="parade-pic">${L.pic}</span><b>${esc(L.word)}</b></div>
    </div>
    <div class="controls"><button class="btn icon-btn" id="hear" type="button" aria-label="Hear it again">${ICON.ear}</button></div>
  `;
  const big = D.panel.querySelector("#big");
  const intro = async () => {
    big.classList.add("bounce");
    await letterName(L.l);
    await saySound(L.clip);
    await say(`${L.upper} is for ${L.word}!`, { rate: 0.95, pitch: 1.1 });
    big.classList.remove("bounce");
  };
  big.onclick = () => { sfx("tap"); big.classList.add("bounce"); setTimeout(() => big.classList.remove("bounce"), 700); saySound(L.clip); };
  D.panel.querySelector("#hear").onclick = () => { sfx("tap"); intro(); };
  for (const p of D.field.state.players) if (p.team === "home") p.anim = "cheer";
  await intro();
  for (const p of D.field.state.players) p.anim = "idle";
  await wait(300);
  // Find it among lookalikes.
  const decoys = shuffle(learned.filter((x) => x !== L.l)).slice(0, 2);
  while (decoys.length < 2) { const d = pick(LETTERS).l; if (d !== L.l && !decoys.includes(d)) decoys.push(d); }
  const options = shuffle([L.l, ...decoys]).map((l) => ({ text: l.toUpperCase(), correct: l === L.l, l }));
  return choiceRound(D, {
    title: "FIND THE LETTER", prompt: `Find the letter ${L.upper}!`, options,
    speakPrompt: async () => { await say(`Find the letter`, { rate: 1 }); await letterName(L.l); },
    speakOption: async (o) => { await letterName(o.l); },
    onCorrect: async () => { await saySound(L.clip); },
  });
}

/* ---------- TRACE ---------- */

export function trace(D, L, save) {
  return new Promise((resolve) => {
    const colors = teamColors(save);
    D.panel.innerHTML = `
      <div class="play-head"><div class="play-title">${ICON.play} TRACE THE LETTER</div><div class="prompt">Follow the arrow with your finger to draw ${L.upper}!</div></div>
      <div class="trace-wrap"><canvas class="trace-canvas" id="trace"></canvas></div>
      <div class="controls">
        <button class="btn" id="show" type="button">👆 Show me</button>
        <button class="btn icon-btn" id="hear" type="button" aria-label="Hear the letter">${ICON.ear}</button>
      </div>
    `;
    const canvas = D.panel.querySelector("#trace");
    const ctx = canvas.getContext("2d");
    const strokes = L.strokes;
    let size = 300;
    let si = 0;
    let pi = 0;
    let drawing = false;
    let done = false;
    let demo = null;
    let guideT = 0;
    let raf = 0;

    function resize() {
      const wrap = canvas.parentElement.getBoundingClientRect();
      size = Math.max(180, Math.min(wrap.width, 360));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const P = (pt) => [pt[0] * size, pt[1] * size];

    function drawPath(pts, upTo = pts.length - 1) {
      ctx.beginPath();
      for (let i = 0; i <= upTo && i < pts.length; i++) { const [x, y] = P(pts[i]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    }

    function render() {
      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Faint full letter
      ctx.lineWidth = size * 0.13;
      ctx.strokeStyle = "#dfe6f5";
      for (const s of strokes) drawPath(s);
      // Completed strokes and partial current stroke
      ctx.strokeStyle = done ? "#ffd60a" : colors.primary;
      ctx.lineWidth = size * 0.12;
      for (let i = 0; i < si; i++) drawPath(strokes[i]);
      if (!done && si < strokes.length) drawPath(strokes[si], pi);
      if (!done && si < strokes.length) {
        const s = strokes[si];
        // Dotted guide for the remaining part
        ctx.setLineDash([size * 0.03, size * 0.04]);
        ctx.lineWidth = size * 0.02;
        ctx.strokeStyle = "#9aa3ba";
        ctx.beginPath();
        for (let i = pi; i < s.length; i++) { const [x, y] = P(s[i]); if (i === pi) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.setLineDash([]);
        // Start dot with stroke number
        const [sx, sy] = P(s[0]);
        ctx.fillStyle = "#2ec27e";
        ctx.beginPath(); ctx.arc(sx, sy, size * 0.05, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${size * 0.055}px "Baloo 2", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(si + 1), sx, sy);
        // Moving guide dot (arrow) along the remaining path
        const seg = Math.max(1, s.length - 1 - pi);
        const gt = pi + ((guideT % 1) * seg);
        const a = s[Math.floor(gt)] || s[s.length - 1];
        const b = s[Math.min(s.length - 1, Math.floor(gt) + 1)];
        const f = gt - Math.floor(gt);
        const gx = (a[0] + (b[0] - a[0]) * f) * size;
        const gy = (a[1] + (b[1] - a[1]) * f) * size;
        ctx.fillStyle = "rgba(61,143,214,0.9)";
        ctx.beginPath(); ctx.arc(gx, gy, size * 0.035, 0, Math.PI * 2); ctx.fill();
      }
      if (done) {
        ctx.fillStyle = "#1b8f5a";
        ctx.font = `800 ${size * 0.12}px "Baloo 2", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("★ " + L.upper + " ★", size / 2, size * 0.5 + size * 0.04);
      }
    }

    const loop = () => { guideT += 0.012; render(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    function near(x, y, pt, tol) {
      const [px, py] = P(pt);
      return Math.hypot(px - x, py - y) < tol;
    }

    function advance(x, y) {
      if (done) return;
      const s = strokes[si];
      const tol = size * 0.16;
      // Allow skipping ahead a few points for fast fingers.
      for (let look = 1; look <= 4; look++) {
        const j = pi + look;
        if (j < s.length && near(x, y, s[j], tol)) { pi = j; }
      }
      if (pi >= s.length - 1) {
        si += 1;
        pi = 0;
        sfx("coin");
        if (si >= strokes.length) finish();
      }
    }

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    canvas.onpointerdown = (e) => {
      if (done) return;
      canvas.setPointerCapture(e.pointerId);
      drawing = true;
      const [x, y] = pos(e);
      // Must begin near the start of the current stroke (or continue where left off).
      const s = strokes[si];
      if (pi === 0 && !near(x, y, s[0], size * 0.2)) return;
      advance(x, y);
    };
    canvas.onpointermove = (e) => { if (drawing && !done) { const [x, y] = pos(e); advance(x, y); } };
    canvas.onpointerup = () => { drawing = false; };
    canvas.onpointercancel = () => { drawing = false; };

    D.panel.querySelector("#hear").onclick = async () => { sfx("tap"); await letterName(L.l); await saySound(L.clip); };
    D.panel.querySelector("#show").onclick = async () => {
      if (demo || done) return;
      sfx("tap");
      demo = true;
      const s = strokes[si];
      for (let i = pi; i < s.length && !done; i++) { pi = i; await wait(45); }
      // Let the child do the final bit themselves.
      pi = Math.max(0, s.length - 3);
      demo = null;
    };

    async function finish() {
      done = true;
      render();
      sfx("touchdown");
      const c = D.center();
      D.fx.burst(c.x, c.y, "touchdown", 60);
      for (const p of D.field.state.players) if (p.team === "home") p.anim = "cheer";
      await letterName(L.l);
      await praise();
      await wait(900);
      for (const p of D.field.state.players) p.anim = "idle";
      cancelAnimationFrame(raf);
      resolve({ correct: true, tries: 1 });
    }

    (async () => {
      await say(`Let's draw the letter`, { rate: 1 });
      await letterName(L.l);
      await say(`Start at the green dot and follow the blue dot.`, { rate: 1 });
    })();
  });
}

/* ---------- LINEUP (beginning sounds) ---------- */

export function lineup(D, L, learned) {
  const mine = pick(STARTERS[L.l]);
  const others = shuffle(learned.filter((x) => x !== L.l && STARTERS[x])).slice(0, 2);
  while (others.length < 2) { const d = pick(LETTERS).l; if (d !== L.l && !others.includes(d)) others.push(d); }
  const options = shuffle([{ ...toOpt(mine), correct: true }, ...others.map((o) => ({ ...toOpt(pick(STARTERS[o])), correct: false }))]);
  return choiceRound(D, {
    title: "STARTING LINEUP",
    prompt: `Which one starts with the sound ${L.upper} makes?`,
    visual: `<div class="pic-board ear-board sound-tag"><b>${L.upper}</b></div>`,
    options,
    speakPrompt: async () => { await say("Which one starts with", { rate: 1 }); await saySound(L.clip); },
    speakOption: async (o) => { await say(o.word, { rate: 0.95 }); },
    onCorrect: async (o) => { await saySound(L.clip); await say(`${o.word}!`, { rate: 0.95, pitch: 1.1 }); },
  });
}
const toOpt = ([word, pic]) => ({ text: pic, word, big: true, label: word });

/* ---------- RHYME ---------- */

export function rhyme(D) {
  const set = pick(RHYMES);
  const [target, ...rest] = shuffle([...set]);
  const answer = rest[0];
  const otherSets = shuffle(RHYMES.filter((s) => s !== set)).slice(0, 2).map((s) => pick(s));
  const options = shuffle([{ ...toOpt(answer), correct: true }, ...otherSets.map((w) => ({ ...toOpt(w), correct: false }))]);
  return choiceRound(D, {
    title: "RHYME TIME",
    prompt: `Which one rhymes with ${target[0]}?`,
    visual: `<div class="rhyme-target"><span>${target[1]}</span><b>${esc(target[0])}</b></div>`,
    options,
    speakPrompt: async () => { await say(`Which one rhymes with ${target[0]}?`, { rate: 1 }); },
    speakOption: async (o) => { await say(o.word, { rate: 0.95 }); },
    onCorrect: async (o) => { await say(`${target[0]}, ${o.word}! They rhyme!`, { rate: 0.95, pitch: 1.1 }); },
  });
}

/* ---------- CLAP THE SYLLABLES ---------- */

export function clap(D, entry) {
  const [word, n, pic] = entry;
  const split = SYLLABLE_SPLIT[word] || word;
  const choices = n === 1 ? [1, 2, 3] : n >= 4 ? [2, 3, 4] : [n - 1, n, n + 1];
  const options = choices.map((k) => ({ html: `<span class="drum">🥁</span><span class="dots">${"●".repeat(k)}</span>`, text: String(k), label: `${k} parts`, correct: k === n, k }));
  return choiceRound(D, {
    title: "CLAP IT OUT",
    prompt: `How many parts in "${word}"? Clap along!`,
    visual: `<div class="rhyme-target clap-target"><span>${pic}</span><b>${esc(word)}</b></div>`,
    options,
    speakPrompt: async () => {
      await sayWord(word);
      await wait(200);
      const el = D.panel.querySelector(".clap-target");
      for (let i = 0; i < n; i++) {
        if (el) { el.classList.add("beat"); setTimeout(() => el.classList.remove("beat"), 250); }
        sfx("snap");
        await wait(380);
      }
      await say(split, { rate: 0.8 });
    },
    speakOption: async (o) => { for (let i = 0; i < o.k; i++) { sfx("snap"); await wait(220); } },
    onCorrect: async () => { await say(`${n} ${n === 1 ? "part" : "parts"}! ${split}.`, { rate: 0.9, pitch: 1.1 }); },
  });
}

/* ---------- ALPHABET KICKOFF ---------- */

const NOTES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0];

function note(i) {
  const c = audioContext();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.value = NOTES[i % NOTES.length] * (i >= NOTES.length ? 2 : 1);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(g);
  g.connect(sfxDestination());
  o.start(t);
  o.stop(t + 0.55);
}

export function alphabet(D, letters) {
  return new Promise((resolve) => {
    const order = [...letters].sort();
    const shown = shuffle([...order]);
    let next = 0;
    let wrong = 0;
    let busy = false;
    D.panel.innerHTML = `
      <div class="play-head"><div class="play-title">${ICON.play} ALPHABET KICKOFF</div><div class="prompt" id="abc-prompt">Tap the letters in ABC order! Start with ${order[0].toUpperCase()}.</div></div>
      <div class="abc-line" id="abc-line">${order.map((l) => `<span class="abc-slot" data-l="${l}"></span>`).join("")}</div>
      <div class="opt-row rookie-opts abc-opts" id="opts">
        ${shown.map((l) => `<button class="opt opt-letter jersey" data-l="${l}" type="button">${l.toUpperCase()}</button>`).join("")}
      </div>
      <div class="controls"><button class="btn icon-btn" id="hear" type="button" aria-label="Which letter is next?">${ICON.ear}</button></div>
    `;
    const ask = async () => { await say(`Tap the letter`, { rate: 1 }); await letterName(order[next]); };
    D.panel.querySelector("#hear").onclick = () => { sfx("tap"); ask(); };
    D.panel.querySelectorAll(".opt").forEach((btn) => {
      btn.onclick = async () => {
        if (busy) return;
        const l = btn.dataset.l;
        if (l === order[next]) {
          busy = true;
          btn.classList.add("good");
          btn.disabled = true;
          note(order.indexOf(l) + ("abcdefghijklmnopqrstuvwxyz".indexOf(order[0]) % 5));
          D.panel.querySelector(`.abc-slot[data-l="${l}"]`).textContent = l.toUpperCase();
          await letterName(l);
          next += 1;
          if (next >= order.length) {
            sfx("touchdown");
            const c = D.center();
            D.fx.burst(c.x, c.y, "touchdown", 60);
            await say("You know your ABCs!", { rate: 1, pitch: 1.15 });
            resolve({ correct: wrong === 0, tries: wrong + 1 });
            return;
          }
          D.panel.querySelector("#abc-prompt").textContent = `Great! Now tap ${order[next].toUpperCase()}.`;
          busy = false;
        } else {
          wrong += 1;
          btn.classList.add("bad");
          btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake");
          sfx("wrong");
          setTimeout(() => btn.classList.remove("bad"), 500);
          if (wrong >= 2) D.panel.querySelector(`.opt[data-l="${order[next]}"]`).classList.add("glow");
          ask();
        }
      };
    });
    (async () => { await say("Tap the letters in A B C order!", { rate: 1 }); await ask(); })();
  });
}

export { coach };
