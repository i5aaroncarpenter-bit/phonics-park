/**
 * READ ZONE — sentence comprehension. Read a short decodable sentence
 * (tap any word to hear it), then tap the picture that matches.
 */

import { ICON } from "../ui.js";
import { say, sayWord, coach, cue, stopSpeech } from "../speech.js";
import { sfx } from "../audio.js";
import { startClock, optionButtons, markCorrect, shakeEl, wait, sentenceChips } from "./common.js";
import { ALL_WORDS } from "../curriculum.js";

export function presentReadZone(panel, spec, ctx) {
  return new Promise((resolve) => {
    const { sentence, options } = spec;
    let busy = false;
    let done = false;
    let helpUsed = 0;

    panel.innerHTML = `
      <div class="play-head">
        <div class="play-title">${ICON.play} READ ZONE</div>
        <div class="prompt">${spec.retry ? "Try this one again! " : ""}Read the sentence. Tap the matching picture!</div>
      </div>
      <div class="sentence" id="sentence">${sentenceChips(sentence.text)}</div>
      <div class="timer-bar"><i id="bar"></i></div>
      <div class="opt-row" id="opts">${optionButtons(options)}</div>
      <div class="controls">
        <button class="btn" id="read-it" type="button">${ICON.ear} Read it to me</button>
      </div>
    `;

    const opts = panel.querySelector("#opts");

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
      await say(sentence.text, { rate: 0.9 });
      await wait(500);
    }

    panel.querySelectorAll(".word-chip").forEach((chip) => {
      chip.onclick = () => {
        if (busy) return;
        const wd = chip.dataset.w;
        const item = ALL_WORDS.find((x) => x.word.toLowerCase() === wd.toLowerCase());
        chip.classList.add("glow");
        setTimeout(() => chip.classList.remove("glow"), 600);
        helpUsed += 1;
        sayWord(item || wd);
      };
    });

    panel.querySelector("#read-it").onclick = () => {
      if (busy) return;
      sfx("tap");
      helpUsed += 3;
      say(sentence.text, { rate: 0.88 });
    };

    opts.querySelectorAll(".opt").forEach((btn) => {
      btn.onclick = async () => {
        if (busy || done) return;
        const o = options[Number(btn.dataset.i)];
        busy = true;
        stopSpeech();
        if (o.correct) {
          const elapsed = clock.elapsed();
          clock.stop();
          btn.classList.add("good");
          sfx("catch");
          say(sentence.text, { rate: 0.95 });
          await wait(300);
          finish({ correct: true, elapsed: helpUsed >= 3 ? Math.max(elapsed, ctx.limitMs * 0.6) : elapsed, helpUsed });
        } else {
          btn.classList.add("bad");
          shakeEl(btn);
          sfx("wrong");
          sfx("whistle");
          await wait(350);
          await reveal();
          finish({ correct: false, elapsed: clock.elapsed(), helpUsed });
        }
      };
    });

    (async () => {
      clock.pause();
      if (ctx.first) await coach("Welcome to the Read Zone! Read the sentence yourself. Tap any word if you need help. Then tap the picture that matches.");
      else await cue(spec.retry ? "Second chance!" : "Read zone!");
      clock.resume();
    })();
  });
}
