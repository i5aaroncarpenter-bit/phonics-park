/**
 * SOUND CATCH — sound hunting under pressure. Punted words fly across the
 * stadium for 60 seconds. Tap the ones that contain the target sound to
 * catch them; let the others drop. Wrong catches are fumbles.
 */

import { createDrill, wait } from "./shell.js";
import { catchSet, campLevel } from "./data.js";
import { esc, ICON } from "../ui.js";
import { saySound, sayWord, coach, stopSpeech } from "../speech.js";
import { sfx } from "../audio.js";
import { recordMastery } from "../save.js";
import { prettyGrapheme } from "../curriculum.js";

const GAME_MS = 60000;

export function runSoundCatch(app, { save, persist, drill, onToggleMute, onQuit, onReplay, onCamp }) {
  const level = campLevel(save);
  const set = catchSet(level);
  const D = createDrill(app, { save, drill, onToggleMute, onQuit, los: 50 });
  D.field.state.showLines = false;
  for (const p of D.field.state.players) p.anim = "idle";
  let running = false;
  let launchTimer = 0;
  let yesIdx = 0;
  let noIdx = 0;
  let launched = 0;
  let caught = 0;
  let fumbles = 0;
  let dropped = 0;
  const live = new Set();

  D.setScoreLabel("SCORE");
  D.setRound("60 seconds");
  const t = prettyGrapheme(set.target);
  D.panel.innerHTML = `
    <div class="play-head">
      <div class="play-title">${ICON.play} SOUND CATCH</div>
      <div class="prompt">Catch the words with <b>${esc(t)}</b>. Let the others drop!</div>
    </div>
    <div class="catch-target">
      <div class="target-chip big"><small>catch</small><b>${esc(t)}</b></div>
      <button class="btn icon-btn" id="hear" type="button" aria-label="Hear the sound">${ICON.ear}</button>
    </div>
    <div class="catch-stats"><span>🙌 <b id="c-caught">0</b> caught</span><span>💥 <b id="c-fumbles">0</b> fumbles</span><span>⬇️ <b id="c-dropped">0</b> missed</span></div>
    <p class="muted catch-hint">Tap a football to catch it. Words fly faster as you go!</p>
  `;
  D.panel.querySelector("#hear").onclick = () => { sfx("tap"); saySound(set.target); };

  function stat() {
    D.panel.querySelector("#c-caught").textContent = caught;
    D.panel.querySelector("#c-fumbles").textContent = fumbles;
    D.panel.querySelector("#c-dropped").textContent = dropped;
  }

  function nextWord() {
    const wantYes = Math.random() < 0.5;
    if (wantYes && set.yes.length) { const w = set.yes[yesIdx++ % set.yes.length]; return { item: w, yes: true }; }
    const w = set.no[noIdx++ % set.no.length];
    return { item: w, yes: false };
  }

  function launch() {
    if (!running || !D.alive()) return;
    const { item, yes } = nextWord();
    launched += 1;
    const c = D.center();
    const el = document.createElement("button");
    el.type = "button";
    el.className = "punt";
    el.innerHTML = `<span class="punt-ball">🏈</span><span class="punt-word">${esc(item.word)}</span>`;
    D.fieldWrap.appendChild(el);
    const dur = Math.max(2200, 3600 - launched * 60);
    const fromLeft = Math.random() < 0.5;
    const x0 = fromLeft ? -120 : c.w + 120;
    const x1 = fromLeft ? c.w + 120 : -120;
    const baseY = c.h * (0.55 + Math.random() * 0.3);
    const peak = c.h * (0.25 + Math.random() * 0.2);
    const t0 = performance.now();
    let alive = true;
    const rec = { el, item, yes, done: false };
    live.add(rec);
    const step = (now) => {
      if (!alive || !D.alive()) return;
      const u = Math.min(1, (now - t0) / dur);
      const x = x0 + (x1 - x0) * u;
      const y = baseY - Math.sin(u * Math.PI) * (baseY - peak);
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.style.setProperty("--spin", `${(fromLeft ? 1 : -1) * u * 720}deg`);
      if (u >= 1) {
        alive = false;
        live.delete(rec);
        el.remove();
        if (!rec.done && yes) {
          dropped += 1;
          D.S.combo = 0;
          D.paint();
          stat();
        }
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    el.onclick = () => {
      if (rec.done || !running) return;
      rec.done = true;
      alive = false;
      live.delete(rec);
      stopSpeech();
      recordMastery(save, [set.target, item.word.toLowerCase()], yes);
      const r = el.getBoundingClientRect();
      const f = D.fieldWrap.getBoundingClientRect();
      const px = r.left - f.left + r.width / 2;
      const py = r.top - f.top + r.height / 2;
      if (yes) {
        caught += 1;
        el.classList.add("caught");
        sfx("catch");
        sayWord(item);
        D.fx.burst(px, py, "good", 18);
        D.hit(10, null);
        D.fx.pop("CATCH!", px, py - 30, "big");
      } else {
        fumbles += 1;
        el.classList.add("fumble");
        sfx("tackle");
        sayWord(item);
        D.S.score = Math.max(0, D.S.score - 5);
        D.miss("FUMBLE!");
        D.fx.burst(px, py, "miss", 12);
      }
      stat();
      setTimeout(() => el.remove(), 500);
    };
    launchTimer = setTimeout(launch, Math.max(900, 1900 - launched * 45));
  }

  async function run() {
    await D.intro();
    if (!save.tutorials["drill:catch"]) {
      save.tutorials["drill:catch"] = true;
      persist();
      await coach("Look for the target sound inside each word. If it's there, catch it! If not, let it drop.");
    }
    await coach(`Catch every word with ${set.target.replace("_", " ")}!`);
    await saySound(set.target);
    running = true;
    const clock = D.startCountdown(GAME_MS, async () => {
      running = false;
      clearTimeout(launchTimer);
      for (const rec of live) rec.el.remove();
      live.clear();
      await wait(600);
      if (!D.alive()) return;
      const stars = D.S.score >= 150 ? 3 : D.S.score >= 90 ? 2 : D.S.score >= 40 ? 1 : 0;
      persist();
      D.finish({ stars, summary: `${caught} catches, ${fumbles} fumbles, ${dropped} missed. Target sound: ${set.target.replace("_", "－")}.` }, { onReplay, onCamp });
    });
    void clock;
    launch();
  }
  run();
}
