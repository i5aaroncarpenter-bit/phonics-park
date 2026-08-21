import { LEVELS, decoysFor, shuffle, pickInning } from "../curriculum.js";
import { heatForNextLevel } from "../save.js";
import { playPhoneme, playWord, sfx } from "../audio.js";
import { createFX, drawParkBackdrop } from "../fx.js";

export const HIT = {
  homer: { label: "HOME RUN!", runs: 4, points: 40 },
  triple: { label: "TRIPLE!", runs: 3, points: 30 },
  double: { label: "DOUBLE!", runs: 2, points: 20 },
  single: { label: "SINGLE!", runs: 1, points: 10 },
};

export function hearCurrent() {}

export function playAtBat(app, ctx) {
  return runInning(app, ctx, "atbat", presentAtBat);
}

function presentAtBat(play, item, engine) {
  return new Promise((resolve) => {
    const { level, heat, fx, audioSpeak, showTutorial, callout, first } = engine;
    let selected = [];
    let busy = false;
    let fouls = 0;
    const limit = Math.max(2800, Math.round((level.baseMs || 8000) / Math.max(1, heat)));
    const tiles = shuffle([...item.graphemes, ...decoysFor(item, level, heat)]);
    const show = level.id === 1 ? item.word : item.word;

    play.innerHTML = `
      <div class="prompt" id="prompt">${first ? "Tap the sounds in order, then Blend!" : "Hear it. Tap the sounds. Blend."}</div>
      <div class="word-board${engine.hide ? " hidden-word" : ""}" id="board">${engine.hide ? "• • •" : show}</div>
      <div class="slot-row" id="slots">${item.graphemes.map(() => `<div class="slot"></div>`).join("")}</div>
      <div class="timer-bar"><i id="bar"></i></div>
      <div class="tile-row" id="tiles">
        ${tiles.map((g, i) => `<button class="sound-tile${first && g === item.graphemes[0] ? " pulse" : ""}" data-g="${g}" data-i="${i}" type="button">${g}</button>`).join("")}
      </div>
      <div class="controls">
        <button class="btn icon-btn" id="hear" type="button" aria-label="Hear it">🔊</button>
        <button class="btn" id="clear" type="button">Clear</button>
        <button class="btn btn-go" id="blend" type="button">Blend</button>
      </div>
    `;

    const speak = () => {
      if (item.graphemes.length === 1) playPhoneme(item.graphemes[0]);
      else playWord(item.word, item.graphemes, item.kind);
    };
    audioSpeak.fn = speak;

    function paintSlots() {
      play.querySelectorAll(".slot").forEach((s, i) => {
        s.textContent = selected[i] || "";
        s.style.borderStyle = selected[i] ? "solid" : "dashed";
      });
    }

    function resetTiles() {
      selected = [];
      paintSlots();
      play.querySelectorAll(".sound-tile").forEach((t) => t.classList.remove("used", "good"));
    }

    const clock = startClock(play.querySelector("#bar"), limit, () => {
      if (busy) return;
      busy = true;
      sfx("umpire");
      callout("OUT!");
      fx.burst(play.clientWidth / 2, 80, "miss");
      resolve({ correct: false, hits: 0, runs: 0, points: 0, quality: "out" });
    });

    play.querySelector("#hear").onclick = () => speak();
    play.querySelector("#clear").onclick = () => {
      sfx("");
      resetTiles();
    };
    play.querySelectorAll(".sound-tile").forEach((btn) => {
      btn.onclick = () => {
        if (busy || btn.classList.contains("used")) return;
        const g = btn.dataset.g;
        playPhoneme(g);
        const expect = item.graphemes[selected.length];
        if (g === expect) {
          selected.push(g);
          btn.classList.add("used", "good");
          paintSlots();
          play.querySelectorAll(".sound-tile").forEach((t) => t.classList.remove("pulse"));
        } else {
          btn.classList.add("bad");
          sfx("miss");
          setTimeout(() => btn.classList.remove("bad"), 360);
        }
      };
    });

    play.querySelector("#blend").onclick = () => {
      if (busy) return;
      const ok = selected.join("|") === item.graphemes.join("|");
      if (!ok) {
        fouls += 1;
        sfx("miss");
        sfx("umpire");
        callout("FOUL BALL!");
        fx.burst(play.clientWidth / 2, play.clientHeight * 0.35, "miss");
        fx.cameraShake(5);
        resetTiles();
        speak();
        if (fouls >= 3) {
          clock.stop();
          busy = true;
          callout("OUT!");
          resolve({ correct: false, hits: 0, runs: 0, points: 0, quality: "out" });
        }
        return;
      }
      busy = true;
      clock.stop();
      const elapsed = clock.elapsed();
      const quality = gradeHit(elapsed, limit);
      const hit = HIT[quality];
      playWord(item.word, item.graphemes, item.kind);
      setTimeout(() => {
        sfx("bat");
        if (quality === "homer") {
          sfx("cheer");
          sfx("organ");
          fx.cameraShake(16);
        } else {
          sfx("cheer");
        }
        callout(hit.label);
        fx.burst(play.clientWidth / 2, play.clientHeight * 0.3, quality === "homer" ? "homer" : "hit");
        fx.pop(hit.label + " +" + hit.points, play.clientWidth / 2, play.clientHeight * 0.2, "big");
        resolve({ correct: true, hits: 1, runs: hit.runs, points: hit.points, quality });
      }, 220);
    };

    const start = () => speak();
    if (first && showTutorial) {
      clock.stop();
      showTutorial("Tap the sounds you hear, then hit Blend to swing!", () => {
        const c2 = startClock(play.querySelector("#bar"), limit, () => {
          if (busy) return;
          busy = true;
          sfx("umpire");
          callout("OUT!");
          resolve({ correct: false, hits: 0, runs: 0, points: 0, quality: "out" });
        });
        clock.elapsed = c2.elapsed;
        clock.stop = c2.stop;
        start();
      });
    } else {
      start();
    }
  });
}

export function runInning(app, { save, persist, mode, levelId, onDone, onQuit }, _mode, present) {
  const level = LEVELS[levelId - 1];
  const heat = heatForNextLevel(save, mode, levelId);
  const items = pickInning(level, heat);
  const stats = {
    index: 0,
    correct: 0,
    atBats: items.length,
    hits: 0,
    runs: 0,
    points: 0,
    streak: 0,
    bestStreak: 0,
    clearMs: 0,
    startMs: Date.now(),
  };

  app.innerHTML = `
    <section class="screen park-bg game-screen">
      <div class="hud">
        <div class="scorebug">
          <div><small>R</small><b id="hud-runs">0</b></div>
          <div><small>H</small><b id="hud-hits">0</b></div>
          <div><small>Inn</small><b>${level.id}</b></div>
          <div><small>AB</small><b id="hud-ab">1/${items.length}</b></div>
          <div><small>Streak</small><b id="hud-streak">0</b></div>
        </div>
        <div>${heat > 1 ? `<span class="heat-chip">+${Math.round((heat - 1) * 100)}% heat</span>` : `<span class="prompt" style="padding:4px 10px">${level.inning}</span>`}</div>
        <div class="hud-actions">
          <button class="btn icon-btn" id="mute-btn" type="button" aria-label="Mute">${save.mute ? "🔇" : "🔊"}</button>
          <button class="btn icon-btn" id="quit" type="button" aria-label="Park">⌂</button>
        </div>
      </div>
      <div class="field-wrap" id="field">
        <canvas class="field-canvas" id="field-art"></canvas>
        <div class="play-area" id="play"></div>
      </div>
    </section>
  `;

  const field = app.querySelector("#field");
  const play = app.querySelector("#play");
  const fx = createFX(field);
  const art = app.querySelector("#field-art");
  const paint = () => drawParkBackdrop(art, Date.now());
  paint();
  const ro = new ResizeObserver(paint);
  ro.observe(art);
  let raf = 0;
  const loop = () => { paint(); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);

  const audioSpeak = { fn: () => {} };

  function callout(text) {
    field.querySelectorAll(".callout").forEach((n) => n.remove());
    if (!text) return;
    const el = document.createElement("div");
    el.className = "callout";
    el.textContent = text;
    field.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function showTutorial(text, onOk) {
    if (field.querySelector(".tutorial")) return;
    const wrap = document.createElement("div");
    wrap.className = "tutorial";
    wrap.innerHTML = `<div class="tutorial-card"><p>${text}</p><button class="btn btn-go" type="button">Got it!</button></div>`;
    wrap.querySelector("button").onclick = () => {
      sfx("");
      wrap.remove();
      save.seenTutorial = true;
      persist();
      onOk();
    };
    field.appendChild(wrap);
  }

  function paintHud() {
    app.querySelector("#hud-runs").textContent = stats.runs;
    app.querySelector("#hud-hits").textContent = stats.hits;
    app.querySelector("#hud-ab").textContent = Math.min(stats.index + 1, items.length) + "/" + items.length;
    app.querySelector("#hud-streak").textContent = stats.streak;
  }

  const engine = {
    level, heat, fx, audioSpeak, callout,
    showTutorial: mode === "atbat" && !save.seenTutorial && levelId === 1 ? showTutorial : null,
    first: mode === "atbat" && !save.seenTutorial && levelId === 1,
  };

  let alive = true;
  function next() {
    if (!alive) return;
    if (stats.index >= items.length) {
      stats.clearMs = Date.now() - stats.startMs;
      cleanup();
      onDone(stats);
      return;
    }
    paintHud();
    play.innerHTML = '<div class="prompt">NOW UP</div><div class="word-board">' + (stats.index + 1) + " / " + items.length + '</div>';
    const first = engine.first && stats.index === 0;
    engine.first = first;
    engine.hide = heat >= 1.12 || (level.id >= 2 && stats.correct >= 2);
    setTimeout(() => present(play, items[stats.index], engine).then((res) => {
      if (!alive) return;
      stats.index += 1;
      if (res.correct) {
        stats.correct += 1;
        stats.streak += 1;
        stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
      } else {
        stats.streak = 0;
      }
      stats.hits += res.hits || 0;
      stats.runs += res.runs || 0;
      stats.points += res.points || 0;
      paintHud();
      setTimeout(next, 650);
    }), 800);
  }

  function cleanup() {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    fx.destroy();
  }

  app.querySelector("#quit").onclick = () => { cleanup(); onQuit(); };
  const muteBtn = app.querySelector("#mute-btn");
  muteBtn.onclick = () => {
    save.mute = !save.mute;
    persist();
    import("../audio.js").then((a) => {
      a.setMuted(save.mute);
      muteBtn.textContent = save.mute ? "🔇" : "🔊";
    });
  };

  app._cleanup = cleanup;
  next();
}

function deal(level) {
  const bag = shuffle([...level.items]);
  const out = [];
  while (out.length < level.atBats) {
    if (!bag.length) bag.push(...shuffle([...level.items]));
    out.push(bag.pop());
  }
  return out;
}

export function gradeHit(elapsed, limit) {
  const r = elapsed / limit;
  if (r < 0.28) return "homer";
  if (r < 0.48) return "triple";
  if (r < 0.7) return "double";
  return "single";
}

export function startClock(bar, ms, onExpire) {
  const t0 = performance.now();
  let dead = false;
  let raf = 0;
  const tick = (now) => {
    if (dead) return;
    const u = Math.min(1, (now - t0) / ms);
    if (bar) bar.style.transform = `scaleX(${1 - u})`;
    if (u >= 1) {
      dead = true;
      onExpire();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return {
    elapsed: () => performance.now() - t0,
    stop() { dead = true; cancelAnimationFrame(raf); },
  };
}
