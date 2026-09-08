/**
 * Shared frame for Training Camp drills: HUD (score, combo, clock/rounds),
 * stadium canvas + FX, a play panel, coach captions and the result card.
 */

import { teamColors, helmetStyle } from "../save.js";
import { createField } from "../field.js";
import { createFX } from "../fx.js";
import { sfx, startMusic, stopMusic, crowd, crowdOff, musicVolume } from "../audio.js";
import { coach, stopSpeech, onCaption } from "../speech.js";
import { ICON, esc, muteButton, el, starsHTML } from "../ui.js";

export function createDrill(app, { save, drill, onToggleMute, onQuit, los = 30 }) {
  const colors = teamColors(save);
  app.innerHTML = `
    <section class="screen match drill drill-${drill.id}" style="--home:${colors.primary};--home2:${colors.secondary};--away:#6c757d;--away2:#ffffff">
      <header class="hud camp-hud">
        <div class="drill-title"><span class="drill-emoji">${drill.emoji}</span><b>${esc(drill.title)}</b></div>
        <div class="hud-mid">
          <div class="qtr" id="score-label">SCORE</div>
          <div class="score-big" id="score">0</div>
        </div>
        <div class="drill-meta">
          <div class="combo" id="combo" hidden>🔥 ×1</div>
          <div class="round-chip" id="round"></div>
        </div>
        <div class="hud-actions" id="hud-actions">
          <button class="btn icon-btn" id="quit" type="button" aria-label="Leave drill">${ICON.home}</button>
        </div>
      </header>
      <div class="field-wrap" id="field">
        <canvas class="stadium" id="stadium"></canvas>
        <div class="drill-clock" id="clock" hidden><i id="clock-fill"></i><span id="clock-text"></span></div>
        <div class="coin-chip"><span class="coin-ico">${ICON.coin}</span><b id="coins">0</b></div>
        <div class="coach-bubble" id="coach" hidden><span class="coach-face">🧢</span><span id="coach-text"></span></div>
      </div>
      <div class="play-panel drill-panel" id="panel"></div>
    </section>
  `;

  const fieldWrap = app.querySelector("#field");
  const panel = app.querySelector("#panel");
  const fx = createFX(fieldWrap);
  const field = createField(app.querySelector("#stadium"), {
    home: { primary: colors.primary, secondary: colors.secondary, helmet: helmetStyle(save), number: save.number, name: save.team.name },
    away: { primary: "#6c757d", secondary: "#ffffff", name: "CAMP" },
    sky: drill.sky || "day",
    celebration: save.team.celebration,
    onSfx: (n) => sfx(n),
  });
  field.huddle(los);
  app.querySelector("#hud-actions").prepend(muteButton(save, onToggleMute));

  const S = { score: 0, combo: 0, best: 0, coins: 0, correct: 0, total: 0, alive: true, startMs: Date.now() };

  let captionTimer = 0;
  onCaption((text, kind) => {
    const b = app.querySelector("#coach");
    if (!b) return;
    b.hidden = false;
    b.classList.toggle("cue", kind === "cue");
    app.querySelector("#coach-text").textContent = text;
    clearTimeout(captionTimer);
    captionTimer = setTimeout(() => { b.hidden = true; }, kind === "cue" ? 1500 : Math.min(9000, 1800 + text.length * 60));
  });

  function center() {
    const r = fieldWrap.getBoundingClientRect();
    return { x: r.width / 2, y: r.height * 0.45, w: r.width, h: r.height };
  }

  function paint() {
    app.querySelector("#score").textContent = S.score;
    app.querySelector("#coins").textContent = S.coins;
    const c = app.querySelector("#combo");
    c.hidden = S.combo < 2;
    c.textContent = `🔥 ×${Math.min(5, S.combo)}`;
  }

  /** Register a correct answer: score with combo multiplier, coins, fx. */
  function hit(points = 10, label) {
    S.correct += 1;
    S.total += 1;
    S.combo += 1;
    S.best = Math.max(S.best, S.combo);
    const mult = Math.min(5, Math.max(1, S.combo));
    const gained = points * mult;
    S.score += gained;
    const coins = Math.max(1, Math.round(gained / 5));
    S.coins += coins;
    save.coins += coins;
    const c = center();
    fx.burst(c.x, c.y, mult >= 3 ? "big" : "good");
    fx.pop(`+${gained}`, c.x + (Math.random() - 0.5) * 60, c.y - 30, mult >= 3 ? "big" : "");
    if (label) fx.callout(label, mult >= 3 ? "big" : "good", 900);
    if (S.combo === 3) { sfx("fire"); fx.callout("ON FIRE!", "fire", 1000); }
    else sfx(mult >= 3 ? "coins" : "coin");
    paint();
    return gained;
  }

  function miss(label = "TACKLED") {
    S.total += 1;
    S.combo = 0;
    sfx("wrong");
    fx.callout(label, "miss", 900);
    fx.cameraShake(5);
    paint();
  }

  function setRound(text) {
    app.querySelector("#round").textContent = text;
  }

  function setScoreLabel(text) {
    app.querySelector("#score-label").textContent = text;
  }

  /* Countdown clock shown over the field. */
  let clockRaf = 0;
  function startCountdown(ms, onEnd) {
    const wrap = app.querySelector("#clock");
    const fill = app.querySelector("#clock-fill");
    const text = app.querySelector("#clock-text");
    wrap.hidden = false;
    const t0 = performance.now();
    let paused = 0;
    let pauseAt = 0;
    let done = false;
    const tick = (now) => {
      if (!S.alive || done) return;
      const e = now - t0 - paused - (pauseAt ? now - pauseAt : 0);
      const left = Math.max(0, ms - e);
      fill.style.transform = `scaleX(${left / ms})`;
      fill.classList.toggle("low", left < ms * 0.25);
      text.textContent = `${Math.ceil(left / 1000)}s`;
      if (left <= 0) { done = true; sfx("buzzer"); onEnd(); return; }
      clockRaf = requestAnimationFrame(tick);
    };
    clockRaf = requestAnimationFrame(tick);
    return {
      pause() { if (!pauseAt) pauseAt = performance.now(); },
      resume() { if (pauseAt) { paused += performance.now() - pauseAt; pauseAt = 0; } },
      stop() { done = true; cancelAnimationFrame(clockRaf); },
      left() { const now = performance.now(); return Math.max(0, ms - (now - t0 - paused - (pauseAt ? now - pauseAt : 0))); },
    };
  }

  async function intro() {
    crowd(0.4);
    startMusic("game");
    musicVolume(0.1);
    fx.callout(drill.title.toUpperCase(), "td", 1400);
    sfx("whistle", { long: true });
    if (drill.coach) await coach(drill.coach);
  }

  /** Save the drill's best and show the result card. */
  function finish({ stars, summary, extra = "" }, { onReplay, onCamp }) {
    if (!S.alive) return;
    stopSpeech();
    crowdOff();
    const rec = save.camp[drill.id] || { best: 0, stars: 0, plays: 0 };
    const isBest = S.score > rec.best;
    rec.best = Math.max(rec.best, S.score);
    rec.stars = Math.max(rec.stars, stars);
    rec.plays += 1;
    save.camp[drill.id] = rec;
    save.totals.plays += S.total;
    save.totals.correct += S.correct;
    startMusic(stars >= 2 ? "victory" : "menu");
    if (stars >= 2) { sfx("win"); fx.rain(2500); } else sfx("cheer");
    const card = el(`
      <div class="modal drill-result">
        <div class="modal-card">
          <h3>${stars >= 3 ? "ALL-PRO!" : stars >= 2 ? "GREAT DRILL!" : stars >= 1 ? "GOOD WORK!" : "KEEP PRACTICING!"}</h3>
          <div class="stars-big" id="stars">${starsHTML(0)}</div>
          <div class="result-stats">
            <div><b>${S.score}</b><span>score${isBest ? " · NEW BEST" : ""}</span></div>
            <div><b>${S.correct}/${S.total}</b><span>right</span></div>
            <div><b>${S.best}</b><span>best combo</span></div>
            <div><b>${ICON.coin} +${S.coins}</b><span>coins</span></div>
          </div>
          <p class="muted">${esc(summary || "")}</p>
          ${extra}
          <div class="row">
            <button class="btn" id="to-camp" type="button">${ICON.home} Camp</button>
            <button class="btn btn-go" id="replay" type="button">${ICON.replay} Again</button>
          </div>
        </div>
      </div>`);
    app.appendChild(card);
    let shown = 0;
    const pop = () => {
      if (shown >= stars) return;
      shown += 1;
      card.querySelector("#stars").innerHTML = starsHTML(shown);
      card.querySelectorAll("i.on")[shown - 1]?.classList.add("pop");
      sfx("star");
      setTimeout(pop, 400);
    };
    setTimeout(pop, 500);
    card.querySelector("#to-camp").onclick = () => { sfx("tap"); cleanup(); onCamp(); };
    card.querySelector("#replay").onclick = () => { sfx("whistle"); cleanup(); onReplay(); };
  }

  function cleanup() {
    S.alive = false;
    cancelAnimationFrame(clockRaf);
    clearTimeout(captionTimer);
    onCaption(null);
    stopSpeech();
    crowdOff();
    stopMusic();
    musicVolume(0.16);
    field.destroy();
    fx.destroy();
  }

  app.querySelector("#quit").onclick = () => {
    const dlg = el(`<div class="modal"><div class="modal-card">
      <h3>Leave the drill?</h3>
      <div class="row"><button class="btn" id="stay" type="button">Keep going</button><button class="btn btn-danger" id="leave" type="button">Leave</button></div>
    </div></div>`);
    dlg.querySelector("#stay").onclick = () => { sfx("tap"); dlg.remove(); };
    dlg.querySelector("#leave").onclick = () => { sfx("tap"); cleanup(); onQuit(); };
    app.appendChild(dlg);
  };
  app._cleanup = cleanup;

  return { S, panel, fieldWrap, field, fx, hit, miss, paint, setRound, setScoreLabel, startCountdown, intro, finish, cleanup, center, alive: () => S.alive };
}

export function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
