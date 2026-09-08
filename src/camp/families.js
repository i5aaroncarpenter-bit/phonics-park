/**
 * WORD FAMILY HUDDLE — onset + rime. The rime (-at) stays; four defenders
 * hold first sounds. Two make real words, two make nonsense. Tap a real
 * one to build the word and run it in; tap a fake and you're tackled.
 */

import { createDrill, wait } from "./shell.js";
import { familyRounds, familyWord, campLevel } from "./data.js";
import { esc, ICON } from "../ui.js";
import { saySound, sayWord, coach, cue, stopSpeech, stretchWord } from "../speech.js";
import { sfx } from "../audio.js";
import { clockFor, shakeEl } from "../plays/common.js";
import { recordMastery } from "../save.js";

export function runWordFamilies(app, { save, persist, drill, onToggleMute, onQuit, onReplay, onCamp }) {
  const level = campLevel(save);
  const rounds = familyRounds(8, level);
  const D = createDrill(app, { save, drill, onToggleMute, onQuit, los: 30 });
  let yard = 25;
  const built = [];

  /** Sound out the rime, e.g. "a ... t" (magic-e rimes say the long vowel). */
  async function sayRime(f) {
    const pseudo = { word: "x" + f.rime, g: ["x", ...f.g], kind: f.kind || "word" };
    for (const g of f.g) await saySound(g, pseudo);
  }

  function playRound(r, idx) {
    return new Promise((resolve) => {
      const f = r.family;
      if (window.__pbDebug) window.__pbRound = r;
      let found = 0;
      let wrong = 0;
      let busy = false;
      let done = false;
      D.field.huddle(yard);
      D.setRound(`Huddle ${idx + 1} of ${rounds.length} · the -${f.rime} family`);
      D.panel.innerHTML = `
        <div class="play-head">
          <div class="play-title">${ICON.play} WORD FAMILY HUDDLE</div>
          <div class="prompt">Tap a first sound that makes a REAL word!</div>
        </div>
        <div class="family-board">
          <div class="onset-slot" id="onset">?</div>
          <div class="word-board rime-board">${esc(f.rime)}</div>
          <div class="family-pic" id="fpic"></div>
        </div>
        <div class="timer-bar"><i id="bar"></i></div>
        <div class="opt-row defenders four" id="opts">
          ${r.onsets.map((o, i) => `<button class="opt opt-def" data-i="${i}" type="button">${esc(o.o)}</button>`).join("")}
        </div>
        <div class="family-built" id="built"><small>Words found:</small> <span id="built-list">${built.slice(-6).map((w) => `<b>${esc(w)}</b>`).join(" ")}</span></div>
        <div class="controls"><button class="btn icon-btn" id="hear" type="button" aria-label="Hear the family">${ICON.ear}</button></div>
      `;
      const onsetEl = D.panel.querySelector("#onset");
      const picEl = D.panel.querySelector("#fpic");
      const finish = () => { if (done) return; done = true; clock.stop(); resolve(); };
      const clock = clockFor(D.panel, { limitMs: 16000, fx: D.fx }, async () => {
        if (done) return;
        busy = true;
        sfx("whistle");
        D.panel.querySelectorAll(".opt").forEach((b) => { const o = r.onsets[Number(b.dataset.i)]; if (o.real && !b.disabled) b.classList.add("good", "reveal"); b.disabled = true; });
        const missedReal = r.onsets.filter((o, i) => o.real && !D.panel.querySelector(`.opt[data-i="${i}"]`).classList.contains("used"));
        for (const o of missedReal) await sayWord(familyWord(f, o.o));
        finish();
      });
      clock.pause();
      D.panel.querySelector("#hear").onclick = () => { if (!busy) { sfx("tap"); sayRime(f); } };

      D.panel.querySelectorAll(".opt").forEach((btn) => {
        btn.onclick = async () => {
          if (busy || done || btn.disabled) return;
          busy = true;
          stopSpeech();
          const o = r.onsets[Number(btn.dataset.i)];
          const item = familyWord(f, o.o);
          onsetEl.textContent = o.o;
          onsetEl.classList.add("filled");
          picEl.textContent = item.pic || "";
          btn.disabled = true;
          btn.classList.add("used");
          clock.pause();
          if (o.real) {
            btn.classList.add("good");
            sfx("catch");
            found += 1;
            built.push(item.word);
            D.panel.querySelector("#built-list").innerHTML = built.slice(-6).map((w) => `<b>${esc(w)}</b>`).join(" ");
            recordMastery(save, [item.word.toLowerCase(), o.o, f.rime], true);
            await stretchWord(item);
            D.panel.classList.add("dim");
            const gain = wrong ? 8 : 14;
            const td = yard + gain >= 100;
            await D.field.animRush({ gain: td ? 100 - yard + 3 : gain, tackled: false });
            if (td) { yard = 25; D.hit(20, "TOUCHDOWN!"); D.fx.rain(1800); }
            else { yard += gain; D.hit(10, `${item.word.toUpperCase()}!`); }
            D.panel.classList.remove("dim");
            D.field.huddle(yard);
            if (found >= 2) { finish(); return; }
          } else {
            btn.classList.add("bad");
            shakeEl(btn);
            wrong += 1;
            recordMastery(save, [f.rime], false);
            await sayWord(item.word);
            await coach(`${item.word}? That's not a real word.`);
            D.panel.classList.add("dim");
            await D.field.animRush({ gain: 0, tackled: true });
            D.miss("NOT A WORD");
            D.panel.classList.remove("dim");
            D.field.huddle(yard);
            if (wrong >= 2) { finish(); return; }
          }
          onsetEl.textContent = "?";
          onsetEl.classList.remove("filled");
          picEl.textContent = "";
          busy = false;
          clock.resume();
        };
      });

      (async () => {
        await cue(idx === 0 ? "Huddle up!" : `The ${f.rime} family!`);
        if (!done) await sayRime(f);
        clock.resume();
      })();
    });
  }

  async function run() {
    await D.intro();
    if (!save.tutorials["drill:families"]) {
      save.tutorials["drill:families"] = true;
      persist();
      await coach("Word families end the same way. Cat, hat, bat — all in the at family! Change the first sound to make a new word.");
    }
    for (let i = 0; i < rounds.length && D.alive(); i++) {
      await playRound(rounds[i], i);
      persist();
      await wait(400);
    }
    if (!D.alive()) return;
    const acc = D.S.correct / Math.max(1, D.S.total);
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0;
    D.finish({ stars, summary: `You built ${built.length} real words: ${built.slice(0, 10).join(", ")}.` }, { onReplay, onCamp });
  }
  run();
}
