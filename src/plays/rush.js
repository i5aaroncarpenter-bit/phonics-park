/**
 * RUSH PLAY — quick recognition. A prompt (a sound, a spoken word, a
 * printed word or a picture) and 3–4 defenders holding answers. Tap the
 * right one to break the tackle.
 *
 * variants: sound (hear sound → letter), initial (picture → first sound),
 *           hear (hear word → word), read (read word → picture),
 *           pic (picture → word)
 */

import { esc, ICON } from "../ui.js";
import { sayWord, saySound, coach, cue, stopSpeech, stretchWord } from "../speech.js";
import { sfx } from "../audio.js";
import { clockFor, optionButtons, markCorrect, shakeEl, wait } from "./common.js";

const TITLE = { sound: "SOUND RUSH", initial: "FIRST SOUND RUSH", hear: "RUSH PLAY", read: "READ & RUSH", pic: "PICTURE RUSH" };

export function presentRush(panel, spec, ctx) {
  return new Promise((resolve) => {
    const { options, prompt, variant } = spec;
    let busy = false;
    let done = false;

    const promptVisual = prompt.showWord
      ? `<div class="word-board read-me">${esc(prompt.showWord)}</div>`
      : prompt.pic
        ? `<div class="pic-board">${prompt.pic}</div>`
        : `<div class="pic-board ear-board">${ICON.ear}</div>`;

    panel.innerHTML = `
      <div class="play-head">
        <div class="play-title">${ICON.play} ${TITLE[variant] || "RUSH PLAY"}</div>
        <div class="prompt">${spec.retry ? "Try this one again! " : ""}${esc(prompt.label)}</div>
      </div>
      ${promptVisual}
      <div class="timer-bar"><i id="bar"></i></div>
      <div class="opt-row ${options.length > 3 ? "four" : ""}" id="opts">${optionButtons(options, { hints: ctx.hints && (variant === "sound" || variant === "initial") })}</div>
      <div class="controls">
        <button class="btn icon-btn" id="hear" type="button" aria-label="Hear it again">${ICON.ear}</button>
        ${variant === "read" ? `<button class="btn" id="sound-out" type="button">Sound it out</button>` : ""}
      </div>
    `;

    const opts = panel.querySelector("#opts");

    const speakPrompt = async () => {
      if (prompt.speakSound) await saySound(prompt.speakSound);
      else if (prompt.speakWord) await sayWord(prompt.speakWord);
      else if (prompt.showWord && variant === "read") { /* silent: the child reads */ }
    };

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
      const right = options.find((o) => o.correct);
      if (variant === "sound") await saySound(right.label);
      else if (variant === "initial") { await saySound(right.label); await sayWord(spec.item); }
      else if (variant === "read") await sayWord(spec.item);
      else await sayWord(right.word || right.label);
      await wait(600);
    }

    panel.querySelector("#hear").onclick = () => {
      if (busy) return;
      sfx("tap");
      if (variant === "read") sayWord(spec.item);
      else speakPrompt();
    };
    const so = panel.querySelector("#sound-out");
    if (so) so.onclick = () => { if (!busy) { sfx("tap"); stretchWord(spec.item); } };

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
          if (variant === "sound") saySound(o.label);
          else if (variant === "read") sayWord(spec.item);
          else if (variant !== "initial") sayWord(o.word || o.label);
          await wait(300);
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
      clock.pause();
      if (ctx.first) {
        const lines = {
          sound: "Listen to the sound, then tap the letter that makes it.",
          initial: "Look at the picture. Which sound does the word START with?",
          hear: "Listen to the word, then tap the word you hear to break the tackle!",
          read: "Read the word all by yourself, then tap the picture that matches.",
          pic: "Look at the picture. Tap the word that names it.",
        };
        await coach(lines[variant] || lines.hear);
      } else {
        const cues = { sound: "Sound rush!", initial: "First sound!", hear: "Rush play!", read: "Read and rush!", pic: "Picture rush!" };
        await cue(spec.retry ? "Second chance!" : cues[variant] || "Rush!");
      }
      if (!done) await speakPrompt();
      clock.resume();
    })();
  });
}
