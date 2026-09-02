/**
 * PASS PLAY — blending. Hear the word, tap its sounds in order into the
 * slots, then THROW. A wrong throw earns a sound-by-sound teaching replay
 * and one more try before the pass is ruled incomplete.
 */

import { esc, ICON } from "../ui.js";
import { KEYWORDS } from "../curriculum.js";
import { sayWord, saySound, stretchWord, coach, cue, stopSpeech } from "../speech.js";
import { sfx } from "../audio.js";
import { clockFor, shakeEl, wait } from "./common.js";

export function presentPass(panel, spec, ctx) {
  return new Promise((resolve) => {
    const { item, tiles } = spec;
    let selected = [];
    let busy = false;
    let attempts = 0;
    let done = false;
    const showWord = !spec.hideWord;

    panel.innerHTML = `
      <div class="play-head">
        <div class="play-title">${ICON.play} PASS PLAY</div>
        <div class="prompt">${spec.retry ? "Try this one again! " : ""}Tap the sounds in order, then THROW!</div>
      </div>
      <div class="word-board ${showWord ? "" : "hidden-word"}" id="board">${showWord ? esc(item.word) : "? ? ?"}</div>
      <div class="slot-row" id="slots">${item.g.map(() => `<div class="slot"></div>`).join("")}</div>
      <div class="timer-bar"><i id="bar"></i></div>
      <div class="tile-row" id="tiles">
        ${tiles.map((g, i) => `<button class="tile" data-g="${esc(g)}" data-i="${i}" type="button">
            <span>${esc(g)}</span>${ctx.hints && KEYWORDS[g.toLowerCase()] ? `<small class="kw">${KEYWORDS[g.toLowerCase()][1]}</small>` : ""}
          </button>`).join("")}
      </div>
      <div class="controls">
        <button class="btn icon-btn" id="hear" type="button" aria-label="Hear the word">${ICON.ear}</button>
        <button class="btn" id="stretch" type="button">Stretch it</button>
        <button class="btn" id="clear" type="button">Clear</button>
        <button class="btn btn-go" id="throw" type="button" disabled>THROW!</button>
      </div>
    `;

    const slots = panel.querySelector("#slots");
    const tilesEl = panel.querySelector("#tiles");
    const throwBtn = panel.querySelector("#throw");

    const paint = () => {
      slots.querySelectorAll(".slot").forEach((s, i) => {
        s.textContent = selected[i] || "";
        s.classList.toggle("filled", !!selected[i]);
      });
      throwBtn.disabled = selected.length !== item.g.length;
      throwBtn.classList.toggle("ready", selected.length === item.g.length);
    };

    const clearTiles = () => {
      selected = [];
      tilesEl.querySelectorAll(".tile").forEach((t) => t.classList.remove("used", "good", "bad", "glow"));
      paint();
    };

    const finish = (res) => {
      if (done) return;
      done = true;
      clock.stop();
      resolve(res);
    };

    const clock = clockFor(panel, ctx, () => {
      if (busy || done) return;
      busy = true;
      sfx("whistle");
      reveal().then(() => finish({ correct: false, elapsed: ctx.limitMs, timedOut: true }));
    });

    async function reveal() {
      clearTiles();
      const btns = [...tilesEl.querySelectorAll(".tile")];
      const usedIdx = new Set();
      for (let i = 0; i < item.g.length; i++) {
        const b = btns.find((x) => x.dataset.g === item.g[i] && !usedIdx.has(x.dataset.i));
        if (b) { usedIdx.add(b.dataset.i); b.classList.add("good", "glow"); }
        selected.push(item.g[i]);
        paint();
        await saySound(item.g[i], item);
        await wait(120);
      }
      await sayWord(item);
      panel.querySelector("#board").textContent = item.word;
      panel.querySelector("#board").classList.remove("hidden-word");
      await wait(500);
    }

    panel.querySelector("#hear").onclick = () => { if (!busy) { sfx("tap"); sayWord(item); } };
    panel.querySelector("#stretch").onclick = () => { if (!busy) { sfx("tap"); stretchWord(item); } };
    panel.querySelector("#clear").onclick = () => { if (!busy) { sfx("tap"); clearTiles(); } };

    tilesEl.querySelectorAll(".tile").forEach((btn) => {
      btn.onclick = () => {
        if (busy || done || btn.classList.contains("used")) return;
        if (selected.length >= item.g.length) return;
        const g = btn.dataset.g;
        saySound(g, item);
        selected.push(g);
        btn.classList.add("used");
        paint();
        if (selected.length === item.g.length) sfx("tap");
      };
    });

    throwBtn.onclick = async () => {
      if (busy || done || selected.length !== item.g.length) return;
      const ok = selected.join("|") === item.g.join("|");
      attempts += 1;
      if (ok) {
        busy = true;
        const elapsed = clock.elapsed();
        clock.stop();
        stopSpeech();
        sfx("throw");
        panel.querySelector("#board").textContent = item.word;
        panel.querySelector("#board").classList.remove("hidden-word");
        slots.querySelectorAll(".slot").forEach((s) => s.classList.add("good"));
        sayWord(item);
        await wait(350);
        finish({ correct: true, elapsed, attempts });
        return;
      }
      // Wrong order.
      busy = true;
      sfx("wrong");
      shakeEl(slots);
      slots.querySelectorAll(".slot").forEach((s) => s.classList.add("bad"));
      if (attempts >= 2) {
        sfx("whistle");
        await reveal();
        finish({ correct: false, elapsed: clock.elapsed(), attempts });
        return;
      }
      clock.pause();
      await wait(450);
      slots.querySelectorAll(".slot").forEach((s) => s.classList.remove("bad"));
      await coach("Not quite. Listen to each sound.");
      // Teaching replay: light up the correct tiles in order.
      clearTiles();
      const btns = [...tilesEl.querySelectorAll(".tile")];
      const usedIdx = new Set();
      for (let i = 0; i < item.g.length; i++) {
        const b = btns.find((x) => x.dataset.g === item.g[i] && !usedIdx.has(x.dataset.i));
        if (b) { usedIdx.add(b.dataset.i); b.classList.add("glow"); }
        await saySound(item.g[i], item);
        await wait(160);
        if (b) b.classList.remove("glow");
      }
      await sayWord(item);
      clearTiles();
      busy = false;
      clock.resume();
    };

    // Kick off: say the word (and, the very first time, a longer coach line).
    (async () => {
      clock.pause();
      if (ctx.first) await coach("Listen to the word. Tap each sound you hear, in order. Then hit THROW to blend it!");
      else await cue(spec.retry ? "Second chance!" : "Pass play!");
      if (!done) await sayWord(item);
      clock.resume();
    })();
  });
}
