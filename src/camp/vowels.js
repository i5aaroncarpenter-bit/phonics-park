/**
 * VOWEL KICKS — vowel sounds. Five uprights labelled a e i o u. Hear a
 * vowel (or see a word with its vowel missing) and kick through the right
 * one. Streaks push the kick back to longer distances.
 */

import { createDrill, wait } from "./shell.js";
import { vowelRounds, campLevel } from "./data.js";
import { esc, ICON } from "../ui.js";
import { saySound, sayWord, coach, cue, stopSpeech } from "../speech.js";
import { sfx } from "../audio.js";
import { clockFor, shakeEl } from "../plays/common.js";
import { recordMastery } from "../save.js";

const VOWELS = ["a", "e", "i", "o", "u"];
const DISTANCES = [72, 65, 58, 52, 46, 40, 35, 30];

export function runVowelKicks(app, { save, persist, drill, onToggleMute, onQuit, onReplay, onCamp }) {
  const level = campLevel(save);
  const rounds = vowelRounds(15, level >= 9 ? 2 : 1);
  const D = createDrill(app, { save, drill, onToggleMute, onQuit, los: DISTANCES[0] });
  let streak = 0;

  function wordWithBlank(item, answer) {
    return item.g.map((g) => (g.toLowerCase() === answer ? `<span class="blank">_</span>` : `<span>${esc(g)}</span>`)).join("");
  }

  function promptFor(r) {
    if (r.type === "sound") return { label: "Which vowel makes this sound?", visual: `<div class="pic-board ear-board">${ICON.ear}</div>` };
    if (r.type === "long") return { label: "Which vowel says its NAME?", visual: `<div class="pic-board ear-board long-tag">${ICON.ear}<small>long</small></div>` };
    if (r.type === "word") return { label: `Which vowel is in "${r.item.word}"?`, visual: `<div class="kick-board">${r.item.pic ? `<div class="pic-small">${r.item.pic}</div>` : ""}<div class="word-board gap-word">${wordWithBlank(r.item, r.answer)}</div></div>` };
    return { label: `Which vowel says its name in "${r.item.word}"?`, visual: `<div class="kick-board">${r.item.pic ? `<div class="pic-small">${r.item.pic}</div>` : ""}<div class="word-board gap-word">${wordWithBlank(r.item, r.answer)}</div></div>` };
  }

  async function speakPrompt(r) {
    if (r.type === "sound" || r.type === "long") await saySound(r.clip);
    else await sayWord(r.item);
  }

  function playRound(r, idx) {
    return new Promise((resolve) => {
      if (window.__pbDebug) window.__pbRound = r;
      const p = promptFor(r);
      const los = DISTANCES[Math.min(DISTANCES.length - 1, streak)];
      D.field.huddle(los);
      D.setRound(`Kick ${idx + 1} of ${rounds.length} · from the ${los <= 50 ? los : 100 - los}`);
      D.panel.innerHTML = `
        <div class="play-head">
          <div class="play-title">${ICON.play} VOWEL KICK</div>
          <div class="prompt">${esc(p.label)}</div>
        </div>
        ${p.visual}
        <div class="timer-bar"><i id="bar"></i></div>
        <div class="uprights" id="uprights">
          ${VOWELS.map((v) => `<button class="upright ${r.type.startsWith("long") ? "long" : ""}" data-v="${v}" type="button"><span class="post"></span><b>${v}</b><span class="post"></span></button>`).join("")}
        </div>
        <div class="controls"><button class="btn icon-btn" id="hear" type="button" aria-label="Hear it again">${ICON.ear}</button></div>
      `;
      let busy = false;
      let done = false;
      const finish = (ok) => { if (done) return; done = true; clock.stop(); resolve(ok); };
      const reveal = async () => {
        const btn = D.panel.querySelector(`.upright[data-v="${r.answer}"]`);
        if (btn) btn.classList.add("good");
        D.panel.querySelectorAll(".upright").forEach((b) => { b.disabled = true; });
        await saySound(r.clip);
        if (r.item) await sayWord(r.item);
      };
      const clock = clockFor(D.panel, { limitMs: 11000, fx: D.fx }, async () => {
        if (busy || done) return;
        busy = true;
        sfx("whistle");
        await reveal();
        finish(false);
      });
      clock.pause();
      D.panel.querySelector("#hear").onclick = () => { if (!busy) { sfx("tap"); speakPrompt(r); } };
      D.panel.querySelectorAll(".upright").forEach((btn) => {
        btn.onclick = async () => {
          if (busy || done) return;
          busy = true;
          stopSpeech();
          const ok = btn.dataset.v === r.answer;
          if (ok) {
            btn.classList.add("good");
            clock.stop();
            saySound(r.clip);
            await wait(200);
            finish(true);
          } else {
            btn.classList.add("bad");
            shakeEl(btn);
            sfx("wrong");
            await wait(300);
            await reveal();
            finish(false);
          }
        };
      });
      (async () => {
        await cue(idx === 0 ? "First kick!" : r.type === "long" || r.type === "longword" ? "Long vowel!" : "Kick it!");
        if (!done) await speakPrompt(r);
        clock.resume();
      })();
    });
  }

  async function run() {
    await D.intro();
    if (!save.tutorials["drill:vowels"]) {
      save.tutorials["drill:vowels"] = true;
      persist();
      await coach("a, e, i, o, u. Short vowels make short sounds. Later, long vowels say their name!");
    }
    for (let i = 0; i < rounds.length && D.alive(); i++) {
      const r = rounds[i];
      const ok = await playRound(r, i);
      if (!D.alive()) return;
      recordMastery(save, [r.type.startsWith("long") ? `long-${r.answer}` : r.answer], ok);
      D.panel.classList.add("dim");
      if (ok) {
        streak += 1;
        const bonus = Math.min(DISTANCES.length - 1, streak - 1) * 2;
        await D.field.animKick({ good: true });
        D.hit(10 + bonus, streak >= 3 ? "BOOMING KICK!" : "IT'S GOOD!");
        sfx("cheer", { big: streak >= 3 });
      } else {
        streak = 0;
        await D.field.animKick({ good: false });
        D.miss("NO GOOD");
      }
      D.panel.classList.remove("dim");
      persist();
      await wait(600);
    }
    if (!D.alive()) return;
    const acc = D.S.correct / Math.max(1, D.S.total);
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0;
    D.finish({ stars, summary: `${D.S.correct} of ${rounds.length} kicks were good.` }, { onReplay, onCamp });
  }
  run();
}
