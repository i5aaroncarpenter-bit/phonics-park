/**
 * Stage 5 — TEST THE BLADE. Build the whole verse from a word bank with no
 * hints, then name the reference. Pass it and the verse is mastered.
 */

import { el, button, shuffle, floatText } from "../ui.js";
import { normalizeWord, allVerses } from "../data/verses.js";
import { tile, shakeNode, popNode, decoysFor, stripPunct } from "./common.js";
import { sfx } from "../audio.js";
import { sparks, confetti, burst } from "../fx.js";

export function play(root, ctx) {
  return new Promise((resolve) => {
    const { words, ref, decoyPool, settings } = ctx;
    const started = performance.now();
    const allowed = Math.max(2, Math.floor(words.length / 7));
    let next = 0;
    let mistakes = 0;
    let wrongHere = 0;

    const head = el("div", { class: "stage-head" }, el("h2", { text: "Test the Blade" }), el("p", { class: "stage-hint", text: `Build the whole verse from memory. You may slip ${allowed} time${allowed === 1 ? "" : "s"}.` }));
    const card = el("div", { class: "verse-card blade-card" });
    const line = el("div", { class: "verse-words blade-words" });
    const slots = words.map((w) => {
      const s = el("span", { class: "blank" });
      s.style.minWidth = Math.max(2, stripPunct(w).length * 0.6) + "ch";
      return s;
    });
    slots.forEach((s) => line.append(s, " "));
    card.append(line, el("div", { class: "verse-ref muted", text: "?" }));
    const meter = el("div", { class: "slips", text: `Slips: 0 / ${allowed}` });

    const decoys = decoysFor(words, decoyPool, Math.min(4, 2 + Math.floor(words.length / 10)));
    const tray = el("div", { class: "tray bank" });
    const tiles = shuffle([...words.map((w) => stripPunct(w)), ...decoys]).map((w) => {
      const t = tile(w, "word");
      t.addEventListener("click", () => onTap(t));
      return t;
    });
    tiles.forEach((t) => tray.append(t));
    const controls = el("div", { class: "stage-controls" });
    root.append(head, card, meter, tray, controls);

    function onTap(t) {
      if (t.classList.contains("used")) return;
      if (normalizeWord(t.textContent) === normalizeWord(words[next])) {
        t.classList.add("used");
        slots[next].textContent = words[next];
        slots[next].classList.add("filled");
        popNode(slots[next]);
        sfx("tap");
        tiles.forEach((x) => x.classList.remove("hint"));
        next += 1;
        wrongHere = 0;
        if (next >= words.length) askReference();
      } else {
        mistakes += 1;
        wrongHere += 1;
        shakeNode(t);
        sfx("bad");
        meter.textContent = `Slips: ${mistakes} / ${allowed}`;
        meter.classList.toggle("over", mistakes > allowed);
        if (wrongHere >= 3) {
          const correct = tiles.find((x) => !x.classList.contains("used") && normalizeWord(x.textContent) === normalizeWord(words[next]));
          if (correct) correct.classList.add("hint");
        }
      }
    }

    function askReference() {
      sfx("good");
      sparks(card, 12);
      head.querySelector("h2").textContent = "Where is it written?";
      head.querySelector("p").textContent = "Every mighty man knows where his sword came from. Tap the reference.";
      const others = shuffle(allVerses(settings).filter((v) => v.ref !== ref).map((v) => v.ref)).slice(0, 2);
      const opts = shuffle([ref, ...others]);
      tray.replaceChildren(
        ...opts.map((r) =>
          button(r, (e) => {
            const b = e.currentTarget;
            if (r === ref) {
              b.classList.add("right");
              card.querySelector(".verse-ref").textContent = ref;
              card.querySelector(".verse-ref").classList.remove("muted");
              setTimeout(finish, 500);
            } else {
              mistakes += 1;
              b.classList.add("wrong");
              b.disabled = true;
              shakeNode(b);
              sfx("bad");
              meter.textContent = `Slips: ${mistakes} / ${allowed}`;
              meter.classList.toggle("over", mistakes > allowed);
            }
          }, "btn choice ref-choice"),
        ),
      );
    }

    function finish() {
      const ok = mistakes <= allowed;
      const perfect = mistakes === 0;
      card.classList.add("complete");
      if (ok) {
        sfx("victory");
        confetti(120);
        burst(card, { n: 40 });
        floatText(card, perfect ? "FLAWLESS!" : "MASTERED!", "gold");
        ctx.speak(ctx.text);
        head.querySelector("h2").textContent = perfect ? "A Flawless Blade!" : "The Blade Holds!";
        head.querySelector("p").textContent = "This verse is now hidden in your heart. Your Valor grows.";
        tray.replaceChildren();
        controls.replaceChildren(button("Claim your reward ➜", () => resolve({ ok: true, mistakes, perfect, ms: performance.now() - started }), "btn btn-gold btn-big"));
      } else {
        sfx("defeat");
        head.querySelector("h2").textContent = "Almost, warrior.";
        head.querySelector("p").textContent = `You slipped ${mistakes} times. Read it once more, then test the blade again.`;
        tray.replaceChildren(el("p", { class: "result-line", text: ctx.text }));
        controls.replaceChildren(
          button("🔊 Hear it", () => ctx.speak(ctx.text), "btn btn-primary"),
          button("Try again", () => resolve({ ok: false, retry: true, mistakes, perfect: false, ms: performance.now() - started }), "btn btn-gold btn-big"),
        );
      }
    }
  });
}
