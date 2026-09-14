/**
 * Stage 2 — FALLEN STONES. The verse has crumbled into stones. Tap them in
 * the right order to rebuild the wall. Long verses are split into phrases.
 */

import { el, button, shuffle, floatText } from "../ui.js";
import { chunkWords, normalizeWord } from "../data/verses.js";
import { tile, shakeNode, popNode, encourage } from "./common.js";
import { sfx } from "../audio.js";
import { sparks, burst } from "../fx.js";

export function play(root, ctx) {
  return new Promise((resolve) => {
    const { words, ref } = ctx;
    const started = performance.now();
    const chunks = chunkWords(words, words.length > 24 ? 4 : 3);
    const keys = chunks.map((c) => c.map(normalizeWord).join(" "));
    let next = 0;
    let mistakes = 0;
    let wrongHere = 0;

    const head = el("div", { class: "stage-head" }, el("h2", { text: "Fallen Stones" }), el("p", { class: "stage-hint", text: "The wall has fallen! Tap the stones in order to rebuild the verse." }));
    const wall = el("div", { class: "wall" });
    const slots = chunks.map((c, i) => el("div", { class: "slot", dataset: { i } }, el("span", { class: "slot-num", text: i + 1 })));
    slots.forEach((s) => wall.append(s));
    const refEl = el("div", { class: "verse-ref", text: ref });
    const tray = el("div", { class: "tray" });
    const order = shuffle(chunks.map((_, i) => i));
    // Make sure the tray never accidentally starts in perfect order.
    if (chunks.length > 2 && order.every((v, i) => v === i)) order.reverse();
    const tiles = order.map((i) => {
      const t = tile(chunks[i].join(" "), "stone");
      t.dataset.key = keys[i];
      t.addEventListener("click", () => onTap(t));
      return t;
    });
    tiles.forEach((t) => tray.append(t));
    const hearBtn = button("🔊", () => ctx.speak(ctx.text), "btn btn-icon btn-speak");
    root.append(head, el("div", { class: "wall-wrap" }, wall, refEl), tray, el("div", { class: "stage-controls" }, hearBtn));

    function onTap(t) {
      if (t.classList.contains("placed")) return;
      if (t.dataset.key === keys[next]) {
        t.classList.add("placed");
        const slot = slots[next];
        slot.replaceChildren(el("span", { class: "slot-text", text: chunks[next].join(" ") }));
        slot.classList.add("filled");
        popNode(slot);
        sfx("clang");
        sparks(slot, 6);
        tiles.forEach((x) => x.classList.remove("hint"));
        next += 1;
        wrongHere = 0;
        t.style.visibility = "hidden";
        if (next >= chunks.length) finish();
      } else {
        mistakes += 1;
        wrongHere += 1;
        shakeNode(t);
        sfx("bad");
        if (wrongHere >= 2) {
          const correct = tiles.find((x) => x.dataset.key === keys[next] && !x.classList.contains("placed"));
          if (correct) correct.classList.add("hint");
        }
      }
    }

    async function finish() {
      sfx("fanfare");
      burst(wall, { n: 30 });
      floatText(wall, encourage(), "gold");
      wall.classList.add("complete");
      ctx.speak(ctx.text);
      const perfect = mistakes === 0;
      const msg = perfect ? "Perfect! Not a single stone out of place." : `Rebuilt! ${mistakes} stone${mistakes === 1 ? "" : "s"} slipped.`;
      tray.replaceChildren(el("p", { class: "result-line", text: msg }));
      root.querySelector(".stage-controls").replaceChildren(
        button("Continue ➜", () => resolve({ ok: true, mistakes, perfect, ms: performance.now() - started }), "btn btn-gold btn-big"),
      );
    }
  });
}
