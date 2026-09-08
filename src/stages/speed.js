/**
 * Stage 4 — SPEED SWORD. The verse appears one word at a time. Before each
 * quizzed word, three choices flash up: tap the right one before the timer
 * runs out. Chains of correct answers build a combo.
 */

import { el, button, floatText } from "../ui.js";
import { normalizeWord } from "../data/verses.js";
import { choicesFor, timerBar, encourage, stripPunct } from "./common.js";
import { sfx } from "../audio.js";
import { sparks, burst, screenShake } from "../fx.js";

export function play(root, ctx, { seconds = 6, maxQuestions = 14, title = "Speed Sword" } = {}) {
  return new Promise((resolve) => {
    const { words, ref, decoyPool } = ctx;
    const started = performance.now();
    let mistakes = 0;
    let combo = 0;
    let bestCombo = 0;
    let i = 0;
    let locked = false;

    // Which positions get quizzed: every word for short verses, spaced out for long ones.
    const positions = [];
    const candidates = words.map((_, k) => k).slice(1);
    if (candidates.length <= maxQuestions) positions.push(...candidates);
    else {
      const step = candidates.length / maxQuestions;
      for (let q = 0; q < maxQuestions; q++) positions.push(candidates[Math.floor(q * step + step / 2)]);
    }
    const quiz = new Set(positions);

    const head = el("div", { class: "stage-head" }, el("h2", { text: title }), el("p", { class: "stage-hint", text: "Which word comes next? Tap it fast!" }));
    const comboEl = el("div", { class: "combo" });
    const card = el("div", { class: "verse-card speed-card" });
    const line = el("div", { class: "verse-words speed-words" });
    const spans = words.map((w) => el("span", { class: "vw hidden", text: w }));
    spans.forEach((s) => line.append(s, " "));
    card.append(line, el("div", { class: "verse-ref", text: ref }));
    const timer = timerBar(seconds, () => onAnswer(null));
    const choices = el("div", { class: "choices" });
    root.append(head, comboEl, card, timer.el, choices);

    function reveal(k, cls = "") {
      spans[k].classList.remove("hidden");
      spans[k].classList.add("shown", cls);
      spans[k].scrollIntoView({ block: "nearest" });
    }

    function step() {
      if (i >= words.length) return finish();
      if (i === 0 || !quiz.has(i)) {
        reveal(i);
        i += 1;
        setTimeout(step, i <= 1 ? 350 : 220);
        return;
      }
      ask();
    }

    function ask() {
      locked = false;
      const { options, answer } = choicesFor(words[i], words, decoyPool);
      choices.replaceChildren(
        ...options.map((o) => {
          const b = button(o, () => onAnswer(o), "btn choice");
          b.dataset.answer = normalizeWord(o) === normalizeWord(answer) ? "1" : "";
          return b;
        }),
      );
      spans[i].classList.add("cursor");
      timer.start(seconds + (ctx.bonusSeconds || 0));
    }

    function onAnswer(choice) {
      if (locked) return;
      locked = true;
      timer.stop();
      spans[i].classList.remove("cursor");
      const correct = choice !== null && normalizeWord(choice) === normalizeWord(stripPunct(words[i]));
      const btns = [...choices.querySelectorAll(".choice")];
      for (const b of btns) {
        b.disabled = true;
        if (b.dataset.answer) b.classList.add("right");
        else if (choice !== null && normalizeWord(b.textContent) === normalizeWord(choice)) b.classList.add("wrong");
      }
      if (correct) {
        combo += 1;
        bestCombo = Math.max(bestCombo, combo);
        reveal(i, "good");
        sfx(combo >= 3 ? "crit" : "slash");
        sparks(spans[i], combo >= 3 ? 14 : 6);
        comboEl.textContent = combo >= 2 ? `🔥 ${combo} combo!` : "";
        comboEl.classList.toggle("hot", combo >= 3);
      } else {
        mistakes += 1;
        combo = 0;
        comboEl.textContent = "";
        comboEl.classList.remove("hot");
        reveal(i, "missed");
        sfx("bad");
        screenShake(5);
      }
      i += 1;
      setTimeout(() => {
        choices.replaceChildren();
        step();
      }, correct ? 380 : 900);
    }

    function finish() {
      timer.stop();
      card.classList.add("complete");
      sfx("fanfare");
      burst(card, { n: 30 });
      floatText(card, encourage(), "gold");
      ctx.speak(ctx.text);
      const perfect = mistakes === 0;
      const asked = positions.length;
      choices.replaceChildren(
        el("p", { class: "result-line", text: perfect ? `Flawless! ${asked} for ${asked}. Best combo: ${bestCombo}.` : `${asked - mistakes} of ${asked} right. Best combo: ${bestCombo}.` }),
        button("Continue ➜", () => resolve({ ok: true, mistakes, perfect, ms: performance.now() - started, bestCombo }), "btn btn-gold btn-big"),
      );
    }

    setTimeout(step, 400);
  });
}
