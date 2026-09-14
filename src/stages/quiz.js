/**
 * One timed multiple-choice question card, shared by the Gauntlet and the
 * Sibling Duel. Same shape as the battle question box so it feels familiar.
 */

import { el, button } from "../ui.js";
import { isCorrect } from "../engine/questions.js";
import { timerBar } from "./common.js";
import { sfx } from "../audio.js";
import { sparks, screenShake } from "../fx.js";

/**
 * Render `q` into `box` and resolve with { ok, fast, timedOut, remaining }.
 * `seconds` is the time allowed; `label` is an optional badge above the prompt.
 */
export function askCard(box, q, { seconds = 8, label = "" } = {}) {
  return new Promise((resolve) => {
    let locked = false;
    box.replaceChildren();
    if (label) box.append(el("div", { class: "q-label", text: label }));
    box.append(el("div", { class: "q-head" }, el("span", { class: "q-prompt", text: q.prompt }), el("span", { class: "q-ref", text: q.kind === "ref" || q.kind === "first" ? "" : q.ref })));
    if (q.promptWords.length) {
      const line = el("div", { class: "q-words" });
      for (const w of q.promptWords) {
        if (w.hidden) line.append(el("span", { class: `qw hidden ${w.target ? "target" : ""}`, text: w.target ? "?" : "•" }), " ");
        else if (w.blank) line.append(el("span", { class: "qw blank", text: "____" }), " ");
        else line.append(el("span", { class: "qw", text: w.text }), " ");
      }
      box.append(line);
    }
    const timer = timerBar(seconds, () => answer(null));
    box.append(timer.el);
    const choices = el("div", { class: "choices" });
    for (const o of q.options) choices.append(button(o, () => answer(o), "btn choice"));
    box.append(choices);
    timer.start(seconds);

    function answer(choice) {
      if (locked) return;
      locked = true;
      const remaining = timer.remaining();
      timer.stop();
      const ok = choice !== null && isCorrect(q, choice);
      for (const b of choices.querySelectorAll(".choice")) {
        b.disabled = true;
        if (isCorrect(q, b.textContent)) b.classList.add("right");
        else if (choice !== null && b.textContent === choice) b.classList.add("wrong");
      }
      if (ok) {
        sfx("slash");
        sparks(box, 8);
      } else {
        sfx("bad");
        screenShake(4);
      }
      setTimeout(() => resolve({ ok, fast: remaining > seconds * 0.55, timedOut: choice === null, remaining }), ok ? 320 : 800);
    }
  });
}
