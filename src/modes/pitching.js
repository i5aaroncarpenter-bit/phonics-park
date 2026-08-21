import { decoysFor, pitchPrompt, pitchTarget, shuffle } from "../curriculum.js";
import { playPhoneme, playWord, sfx } from "../audio.js";
import { runInning } from "./atbat.js";

export function playPitching(app, ctx) {
  return runInning(app, ctx, "pitching", presentPitch);
}

function presentPitch(play, item, engine) {
  return new Promise((resolve) => {
    const { level, heat, fx, audioSpeak, callout } = engine;
    let busy = false;
    let misses = 0;
    const limit = Math.max(2800, Math.round((level.baseMs || 8000) / Math.max(1, heat)));
    const target = pitchTarget(item, level);
    const extra = heat >= 1.1 ? 1 : 0;
    const opts = shuffle([target, ...decoysFor({ graphemes: [target], word: item.word }, level, heat)]).slice(0, 4 + extra);

    play.innerHTML = `
      <div class="prompt">${pitchPrompt(level)}</div>
      <div class="pitch-target" id="mitt">${item.word}</div>
      <div class="timer-bar"><i id="bar"></i></div>
      <div class="tile-row">
        ${opts.map((g) => '<button class="sound-tile" data-g="' + g + '" type="button">' + g + "</button>").join("")}
      </div>
      <div class="controls">
        <button class="btn icon-btn" id="hear" type="button" aria-label="Hear word">Hear</button>
      </div>
    `;

    const speak = () => {
      if (level.id === 1) playPhoneme(item.graphemes[0]);
      else playWord(item.word, item.graphemes, item.kind);
    };
    audioSpeak.fn = speak;

    const clock = startClock(play.querySelector("#bar"), limit, () => done(false, "BALL!"));

    function done(ok, call) {
      if (busy) return;
      busy = true;
      clock.stop();
      callout(call);
      if (ok) {
        sfx("strike");
        sfx("cheer");
        fx.burst(play.clientWidth / 2, 90, "hit");
        fx.pop("STRIKE! +12", play.clientWidth / 2, 70, "big");
        const elapsed = clock.elapsed();
        const r = elapsed / limit;
        const quality = r < 0.28 ? "homer" : r < 0.48 ? "triple" : r < 0.7 ? "double" : "single";
        const runs = quality === "homer" ? 4 : quality === "triple" ? 3 : quality === "double" ? 2 : 1;
        if (quality === "homer") { sfx("organ"); fx.cameraShake(12); }
        resolve({ correct: true, hits: 1, runs, points: 12 + runs * 4, quality });
      } else {
        sfx("miss");
        sfx("umpire");
        fx.burst(play.clientWidth / 2, 90, "miss");
        resolve({ correct: false, hits: 0, runs: 0, points: 0, quality: "ball" });
      }
    }

    play.querySelector("#hear").onclick = () => speak();
    play.querySelectorAll("[data-g]").forEach((btn) => {
      btn.onclick = () => onThrow(btn);
    });

    function onThrow(btn) {
      if (busy) return;
      const g = btn.dataset.g;
      playPhoneme(g);
      setTimeout(() => {
        if (g === target) {
          btn.classList.add("good");
          done(true, "STRIKE!");
        } else {
          misses += 1;
          btn.classList.add("bad");
          sfx("miss");
          callout("BALL!");
          if (misses >= 2) done(false, "WALK!");
          else busy = false;
        }
      }, 280);
    }

    speak();
  });
}

function startClock(bar, ms, onExpire) {
  const t0 = performance.now();
  let dead = false;
  let raf = 0;
  const tick = (now) => {
    if (dead) return;
    const u = Math.min(1, (now - t0) / ms);
    if (bar) bar.style.transform = "scaleX(" + (1 - u) + ")";
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
