/**
 * Stage 3 — MEND THE SHIELD. Words have been knocked out of the verse.
 * Drag them back (tap word, tap gap) to make the shield whole.
 */

import { el, button, shuffle, floatText } from "../ui.js";
import { normalizeWord } from "../data/verses.js";
import { tile, shakeNode, popNode, chooseBlanks, decoysFor, encourage, stripPunct } from "./common.js";
import { sfx } from "../audio.js";
import { sparks, burst } from "../fx.js";

export function play(root, ctx, { ratio = 0.35, title = "Mend the Shield", hint = "Some words were knocked out! Tap a word, then tap where it belongs." } = {}) {
  return new Promise((resolve) => {
    const { words, ref, decoyPool } = ctx;
    const started = performance.now();
    const blanks = chooseBlanks(words, ratio);
    const blankSet = new Set(blanks);
    let mistakes = 0;
    let selectedTile = null;
    let checks = 0;

    const head = el("div", { class: "stage-head" }, el("h2", { text: title }), el("p", { class: "stage-hint", text: hint }));
    const card = el("div", { class: "verse-card shield-card" });
    const line = el("div", { class: "verse-words fill-words" });
    const gaps = new Map();
    words.forEach((w, i) => {
      if (blankSet.has(i)) {
        const g = el("button", { class: "gap", type: "button", dataset: { i } }, el("span", { class: "gap-text", text: "" }));
        g.addEventListener("click", () => onGap(g));
        gaps.set(i, g);
        line.append(g, " ");
      } else line.append(el("span", { class: "vw", text: w }), " ");
    });
    card.append(line, el("div", { class: "verse-ref", text: ref }));

    const missing = blanks.map((i) => stripPunct(words[i]));
    const decoys = decoysFor(words, decoyPool, Math.min(3, Math.max(2, Math.round(blanks.length / 2))));
    const tray = el("div", { class: "tray" });
    const tiles = shuffle([...missing, ...decoys]).map((w) => {
      const t = tile(w, "word");
      t.addEventListener("click", () => onTile(t));
      return t;
    });
    tiles.forEach((t) => tray.append(t));

    const controls = el("div", { class: "stage-controls" }, button("🔊", () => ctx.speak(ctx.text), "btn btn-icon btn-speak"));
    root.append(head, card, tray, controls);

    function firstEmptyGap() {
      for (const i of blanks) if (!gaps.get(i).dataset.word) return gaps.get(i);
      return null;
    }

    function onTile(t) {
      if (t.classList.contains("used")) return;
      sfx("tap");
      if (selectedTile === t) {
        t.classList.remove("selected");
        selectedTile = null;
        return;
      }
      tiles.forEach((x) => x.classList.remove("selected"));
      t.classList.add("selected");
      selectedTile = t;
      // Convenience for little hands: a selected word jumps into the next empty gap.
      const g = firstEmptyGap();
      if (g) place(t, g);
    }

    function onGap(g) {
      if (g.dataset.word) {
        // return the word to the tray
        const t = tiles.find((x) => x.dataset.gap === g.dataset.i);
        if (t) {
          t.classList.remove("used");
          delete t.dataset.gap;
        }
        delete g.dataset.word;
        g.classList.remove("filled", "wrong");
        g.querySelector(".gap-text").textContent = "";
        sfx("tap");
        return;
      }
      if (selectedTile) place(selectedTile, g);
    }

    function place(t, g) {
      g.dataset.word = t.textContent;
      g.classList.add("filled");
      g.querySelector(".gap-text").textContent = t.textContent;
      t.classList.add("used");
      t.classList.remove("selected");
      t.dataset.gap = g.dataset.i;
      selectedTile = null;
      popNode(g);
      if (!firstEmptyGap()) setTimeout(check, 250);
    }

    function check() {
      checks += 1;
      let wrong = 0;
      for (const i of blanks) {
        const g = gaps.get(i);
        if (normalizeWord(g.dataset.word) === normalizeWord(words[i])) {
          g.classList.add("right");
        } else {
          wrong += 1;
          g.classList.add("wrong");
          shakeNode(g);
        }
      }
      if (!wrong) return finish();
      mistakes += wrong;
      sfx("bad");
      setTimeout(() => {
        for (const i of blanks) {
          const g = gaps.get(i);
          if (!g.classList.contains("wrong")) continue;
          const t = tiles.find((x) => x.dataset.gap === g.dataset.i);
          if (t) {
            t.classList.remove("used");
            delete t.dataset.gap;
          }
          delete g.dataset.word;
          g.classList.remove("filled", "wrong");
          g.querySelector(".gap-text").textContent = "";
          if (checks >= 2) {
            const correct = tiles.find((x) => !x.classList.contains("used") && normalizeWord(x.textContent) === normalizeWord(words[i]));
            if (correct) correct.classList.add("hint");
          }
        }
      }, 700);
    }

    function finish() {
      words.forEach((w, i) => {
        const g = gaps.get(i);
        if (g) g.querySelector(".gap-text").textContent = w;
      });
      card.classList.add("complete");
      sfx("fanfare");
      burst(card, { n: 28, colors: ["#8fd3ff", "#ffffff", "#ffd54a"] });
      sparks(card, 16);
      floatText(card, encourage(), "gold");
      ctx.speak(ctx.text);
      const perfect = mistakes === 0;
      tray.replaceChildren(el("p", { class: "result-line", text: perfect ? "Perfect! The shield is whole." : `Mended! ${mistakes} word${mistakes === 1 ? "" : "s"} needed a second try.` }));
      controls.replaceChildren(button("Continue ➜", () => resolve({ ok: true, mistakes, perfect, ms: performance.now() - started }), "btn btn-gold btn-big"));
    }
  });
}
