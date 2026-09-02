/**
 * FIELD GOAL — fill the missing sound. The word is shown with one sound
 * missing (c _ t). Hear the word, kick the right sound through the uprights.
 */

import { esc, ICON } from "../ui.js";
import { sayWord, saySound, coach, cue, stopSpeech, stretchWord } from "../speech.js";
import { sfx } from "../audio.js";
import { clockFor, optionButtons, markCorrect, shakeEl, wait } from "./common.js";

export function presentKick(panel, spec, ctx) {
  return new Promise((resolve) => {
    const { item, blank, options } = spec;
    let busy = false;
    let done = false;
    let attempts = 0;

    const wordHTML = (fill) => item.g
      .map((g, i) => (i === blank ? `<span class="blank ${fill ? "filled" : ""}">${fill ? esc(fill) : "_"}</span>` : `<span>${esc(g)}</span>`))
      .join("");

    panel.innerHTML = `
      <div class="play-head">
        <div class="play-title">${ICON.play} FIELD GOAL</div>
        <div class="prompt">${spec.retry ? "Try this one again! " : ""}Which sound is missing? Kick it in!</div>
      </div>
      <div class="kick-board">
        ${item.pic ? `<div class="pic-small">${item.pic}</div>` : ""}
        <div class="word-board gap-word" id="board">${wordHTML()}</div>
      </div>
      <div class="timer-bar"><i id="bar"></i></div>
      <div class="opt-row ${options.length > 3 ? "four" : ""}" id="opts">${optionButtons(options, { cls: "opt-tile" })}</div>
      <div class="controls">
        <button class="btn icon-btn" id="hear" type="button" aria-label="Hear the word">${ICON.ear}</button>
        <button class="btn" id="stretch" type="button">Stretch it</button>
      </div>
    `;

    const opts = panel.querySelector("#opts");
    const board = panel.querySelector("#board");

    const finish = (res) => {
      if (done) return;
      done = true;
      clock.stop();
      resolve(res);
    };

    const clock = clockFor(panel, ctx, async () => {
      if (busy || done) return;
      busy = true;
      sfx("whistle");
      await reveal();
      finish({ correct: false, elapsed: ctx.limitMs, timedOut: true });
    });

    async function reveal() {
      markCorrect(opts, options);
      board.innerHTML = wordHTML(item.g[blank]);
      board.querySelector(".blank").classList.add("good");
      await saySound(item.g[blank], item);
      await sayWord(item);
      await wait(500);
    }

    panel.querySelector("#hear").onclick = () => { if (!busy) { sfx("tap"); sayWord(item); } };
    panel.querySelector("#stretch").onclick = () => { if (!busy) { sfx("tap"); stretchWord(item); } };

    opts.querySelectorAll(".opt").forEach((btn) => {
      btn.onclick = async () => {
        if (busy || done) return;
        const o = options[Number(btn.dataset.i)];
        busy = true;
        attempts += 1;
        stopSpeech();
        if (o.correct) {
          const elapsed = clock.elapsed();
          clock.stop();
          btn.classList.add("good");
          board.innerHTML = wordHTML(o.label);
          board.querySelector(".blank").classList.add("good");
          sfx("kick");
          sayWord(item);
          await wait(350);
          finish({ correct: true, elapsed, attempts });
          return;
        }
        btn.classList.add("bad");
        shakeEl(btn);
        sfx("wrong");
        board.innerHTML = wordHTML(o.label);
        board.querySelector(".blank").classList.add("bad");
        if (attempts >= 2) {
          sfx("whistle");
          await wait(300);
          await reveal();
          finish({ correct: false, elapsed: clock.elapsed(), attempts });
          return;
        }
        clock.pause();
        await wait(300);
        // Say the wrong word they built, then the real word, to make the contrast audible.
        await coach("Hmm, that makes a different word. Listen again.");
        board.innerHTML = wordHTML();
        await stretchWord(item);
        btn.disabled = true;
        busy = false;
        clock.resume();
      };
    });

    (async () => {
      clock.pause();
      if (ctx.first) await coach("One sound is missing from the word. Listen, then kick the right sound into the gap!");
      else await cue(spec.retry ? "Second chance!" : "Field goal!");
      if (!done) await sayWord(item);
      clock.resume();
    })();
  });
}
