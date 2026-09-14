/**
 * Stage 1 — HEAR IT. The verse is read aloud with words lighting up, then
 * the child "echoes" it by tapping each word in order as they say it.
 */

import { el, button, floatText } from "../ui.js";
import { sameWord } from "../data/verses.js";
import { verseWords, shakeNode, popNode, encourage } from "./common.js";
import { sfx } from "../audio.js";
import { sparks } from "../fx.js";

export function play(root, ctx) {
  return new Promise((resolve) => {
    const { words, text, ref } = ctx;
    const started = performance.now();
    let phase = "listen";
    let next = 0;

    const head = el("div", { class: "stage-head" }, el("h2", { text: "Hear It" }), el("p", { class: "stage-hint", text: "Listen closely. Then tap each word as you read it out loud." }));
    const card = el("div", { class: "verse-card big" });
    const vw = verseWords(words);
    card.append(vw.el, el("div", { class: "verse-ref", text: ref }));
    const controls = el("div", { class: "stage-controls" });
    const hearBtn = button("🔊 Hear it", () => read(), "btn btn-primary btn-big");
    const echoBtn = button("🗣️ I'll read it!", () => startEcho(), "btn btn-gold btn-big");
    echoBtn.disabled = true;
    controls.append(hearBtn, echoBtn);
    root.append(head, card, controls);

    async function read() {
      hearBtn.disabled = true;
      vw.spans.forEach((s) => s.classList.remove("lit", "done"));
      await ctx.speak(text, {
        onWord: (i) => {
          vw.spans.forEach((s, j) => s.classList.toggle("lit", j === i));
        },
      });
      vw.spans.forEach((s) => s.classList.remove("lit"));
      hearBtn.disabled = false;
      echoBtn.disabled = false;
      ctx.listened && ctx.listened();
    }

    function startEcho() {
      phase = "echo";
      ctx.stopSpeaking();
      head.querySelector("p").textContent = "Say each word out loud and tap it. Start at the beginning!";
      echoBtn.disabled = true;
      hearBtn.disabled = true;
      vw.spans.forEach((s, i) => {
        s.classList.add("tappable");
        s.addEventListener("click", () => onTap(i, s));
      });
      vw.spans[0].classList.add("next");
    }

    function onTap(i, span) {
      if (phase !== "echo" || span.classList.contains("done")) return;
      if (i === next || sameWord(words[i], words[next])) {
        const target = vw.spans[next];
        target.classList.add("done");
        target.classList.remove("next");
        popNode(target);
        sfx("tap");
        next += 1;
        if (next >= words.length) finish();
        else vw.spans[next].classList.add("next");
      } else {
        shakeNode(span);
        sfx("bad");
      }
    }

    async function finish() {
      phase = "done";
      sfx("good");
      sparks(card);
      floatText(card, encourage(), "gold");
      controls.replaceChildren(button("Continue ➜", () => resolve({ ok: true, mistakes: 0, perfect: true, ms: performance.now() - started }), "btn btn-gold btn-big"));
    }

    // Auto read on entry (a tap already happened to get here, so audio is unlocked).
    setTimeout(read, 350);
  });
}
