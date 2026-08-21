import { decoysFor, defensePrompt, defenseTarget, shuffle } from "../curriculum.js";
import { playPhoneme, playWord, sfx } from "../audio.js";
import { runInning, startClock, gradeHit, HIT } from "./atbat.js";

export function playDefense(app, ctx) {
  return runInning(app, ctx, "defense", presentDefense);
}

export function hearCurrent() {}

function presentDefense(play, item, engine) {
  return new Promise((resolve) => {
    const { level, heat, fx, audioSpeak, callout } = engine;
    const target = defenseTarget(item, level);
    const wordTiles = target === item.word && item.graphemes.length > 1;
    const extra = (level.decoys || 2) + (heat >= 1.1 ? 1 : 0);
    let choices;
    if (wordTiles) {
      const others = shuffle(level.items.filter((it) => it.word !== item.word).map((it) => it.word));
      choices = shuffle([item.word, ...others.slice(0, extra)]);
    } else {
      choices = shuffle([target, ...decoysFor(item, level, heat)]);
    }
    const hide = engine.hide;
    const limit = Math.max(2800, Math.round((level.baseMs || 8000) / Math.max(1, heat)));
    let busy = false;
    let misses = 0;

    play.innerHTML = `
      <div class="prompt">${defensePrompt(level)}</div>
      <div class="word-board ${hide ? "hidden-word" : ""}" id="ball">${hide ? "?" : target}</div>
      <div class="timer-bar"><i id="bar"></i></div>
      <div class="fielders" id="tiles">
        ${choices.map((c) => `<button class="btn fielder sound-tile" data-g="${c}" type="button">${c}</button>`).join("")}
      </div>
    `;

    const speak = () => {
      if (wordTiles) playWord(item.word, item.graphemes, item.kind);
      else playPhoneme(target);
    };
    audioSpeak.fn = speak;

    const ball = document.createElement("div");
    ball.className = "fly-ball";
    ball.style.left = "48%";
    ball.style.top = "68%";
    play.appendChild(ball);
    requestAnimationFrame(() => {
      ball.style.transition = "left " + limit + "ms linear, top " + Math.round(limit * 0.5) + "ms ease-out";
      ball.style.left = 16 + Math.random() * 60 + "%";
      ball.style.top = "8%";
    });

    const finish = (ok) => {
      if (busy) return;
      busy = true;
      clock.stop();
      const elapsed = clock.elapsed();
      if (ok) {
        const quality = gradeHit(elapsed, limit);
        const hit = HIT[quality];
        sfx("glove");
        if (quality === "homer") { sfx("cheer"); sfx("organ"); fx.cameraShake(14); }
        else sfx("cheer");
        callout(quality === "homer" ? "GREAT CATCH!" : "OUT!");
        fx.burst(play.clientWidth / 2, 90, quality === "homer" ? "homer" : "out");
        fx.pop((hit.label) + " +" + hit.points, play.clientWidth / 2, 70, quality === "homer" ? "big" : "");
        resolve({ correct: true, hits: 1, runs: hit.runs, points: hit.points, quality });
      } else {
        sfx("miss");
        callout("Dropped it!");
        fx.burst(play.clientWidth / 2, 90, "miss");
        resolve({ correct: false, hits: 0, runs: 0, points: 0, quality: "out" });
      }
    };

    const clock = startClock(play.querySelector("#bar"), limit, () => finish(false));

    play.querySelectorAll("[data-g]").forEach((btn) => {
      btn.onclick = () => {
        if (busy) return;
        const g = btn.dataset.g;
        if (wordTiles) playWord(g);
        else playPhoneme(g);
        if (g === target) {
          btn.classList.add("good");
          finish(true);
        } else {
          misses += 1;
          btn.classList.add("bad");
          sfx("miss");
          setTimeout(() => btn.classList.remove("bad"), 320);
          if (misses > 2) finish(false);
        }
      };
    });

    speak();
  });
}
