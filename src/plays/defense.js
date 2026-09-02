/**
 * DEFENSE — sound hunting. The opponent's players run with words (or
 * letters). Tackle the one that contains the target sound, or the exact
 * sight word you hear.
 *
 * variants: letter (hear sound → letter), grapheme (find word containing
 *           target), sight (hear word → word among lookalikes)
 */

import { esc, ICON } from "../ui.js";
import { sayWord, saySound, coach, stopSpeech } from "../speech.js";
import { sfx } from "../audio.js";
import { startClock, optionButtons, markCorrect, shakeEl, wait } from "./common.js";

export function presentDefense(panel, spec, ctx) {
  return new Promise((resolve) => {
    const { options, prompt, variant } = spec;
    let busy = false;
    let done = false;

    const target = prompt.showTarget
      ? `<div class="target-chip"><small>find</small><b>${esc(prompt.showTarget)}</b></div>`
      : `<div class="pic-board ear-board">${ICON.ear}</div>`;

    panel.innerHTML = `
      <div class="play-head">
        <div class="play-title">${ICON.play} DEFENSE</div>
        <div class="prompt">${spec.retry ? "Try this one again! " : ""}${esc(prompt.label)}</div>
      </div>
      ${target}
      <div class="timer-bar"><i id="bar"></i></div>
      <div class="opt-row defenders" id="opts">${optionButtons(options, { cls: "opt-def", hints: ctx.hints && variant === "letter" })}</div>
      <div class="controls">
        <button class="btn icon-btn" id="hear" type="button" aria-label="Hear it again">${ICON.ear}</button>
        ${variant === "grapheme" ? `<button class="btn" id="hear-all" type="button">Hear the words</button>` : ""}
      </div>
    `;

    const opts = panel.querySelector("#opts");

    const speakPrompt = async () => {
      if (prompt.speakWord) await sayWord(prompt.speakWord);
      else if (prompt.speakSound) await saySound(prompt.speakSound);
    };

    const finish = (res) => {
      if (done) return;
      done = true;
      clock.stop();
      resolve(res);
    };

    const clock = startClock(panel.querySelector("#bar"), ctx.limitMs, async () => {
      if (busy || done) return;
      busy = true;
      sfx("whistle");
      await reveal();
      finish({ correct: false, elapsed: ctx.limitMs, timedOut: true });
    });

    async function reveal() {
      markCorrect(opts, options);
      const right = options.find((o) => o.correct);
      if (variant === "letter") await saySound(right.label);
      else {
        if (spec.target && !spec.target.includes("_")) await saySound(spec.target);
        await sayWord(spec.item || right.label);
      }
      await wait(600);
    }

    panel.querySelector("#hear").onclick = () => { if (!busy) { sfx("tap"); speakPrompt(); } };
    const hearAll = panel.querySelector("#hear-all");
    if (hearAll) {
      hearAll.onclick = async () => {
        if (busy) return;
        sfx("tap");
        clock.pause();
        const btns = [...opts.querySelectorAll(".opt")];
        for (const b of btns) {
          if (done) break;
          b.classList.add("glow");
          await sayWord(options[Number(b.dataset.i)].label);
          b.classList.remove("glow");
        }
        clock.resume();
      };
    }

    opts.querySelectorAll(".opt").forEach((btn) => {
      btn.onclick = async () => {
        if (busy || done) return;
        const o = options[Number(btn.dataset.i)];
        busy = true;
        stopSpeech();
        if (o.correct) {
          const elapsed = clock.elapsed();
          clock.stop();
          btn.classList.add("good", "tackled");
          sfx("tackle");
          if (variant === "letter") saySound(o.label);
          else sayWord(o.label);
          await wait(320);
          finish({ correct: true, elapsed });
        } else {
          btn.classList.add("bad");
          shakeEl(btn);
          sfx("wrong");
          sfx("whistle");
          await wait(350);
          await reveal();
          finish({ correct: false, elapsed: clock.elapsed() });
        }
      };
    });

    (async () => {
      if (ctx.first) {
        clock.pause();
        const lines = {
          letter: "You're on defense! Listen to the sound and tackle the letter that makes it.",
          grapheme: "You're on defense! Find the word that has the special sound inside it, and tackle it!",
          sight: "You're on defense! Listen to the word and tackle the exact word you hear.",
        };
        await coach(lines[variant] || lines.grapheme);
        clock.resume();
      }
      if (!done) speakPrompt();
    })();
  });
}
