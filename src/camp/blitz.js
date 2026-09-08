/**
 * BLEND BLITZ — the two-minute drill. Blend as many words as you can in
 * 90 seconds. Each word is a pass play; speed builds the combo.
 */

import { createDrill, wait } from "./shell.js";
import { blitzWords, campLevel } from "./data.js";
import { presentPass } from "../plays/pass.js";
import { shuffle, gradeYards } from "../curriculum.js";
import { coach } from "../speech.js";
import { recordMastery } from "../save.js";

const GAME_MS = 90000;
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export function runBlendBlitz(app, { save, persist, drill, onToggleMute, onQuit, onReplay, onCamp }) {
  const level = campLevel(save);
  const words = blitzWords(level);
  const D = createDrill(app, { save, drill, onToggleMute, onQuit, los: 25 });
  let yard = 25;
  let idx = 0;
  let timeUp = false;
  let blended = 0;
  let clock;

  function specFor(item) {
    const used = new Set(item.g.map((g) => g.toLowerCase()));
    const own = new Set(words.flatMap((w) => w.g.map((g) => g.toLowerCase())));
    const decoys = [...shuffle([...own].filter((g) => !used.has(g))), ...shuffle(LETTERS.filter((g) => !used.has(g)))].slice(0, 3);
    return { type: "pass", item, tiles: shuffle([...item.g, ...decoys]), keys: [], answer: item.word, limitMs: 14000 };
  }

  async function run() {
    await D.intro();
    if (!save.tutorials["drill:blitz"]) {
      save.tutorials["drill:blitz"] = true;
      persist();
      await coach("No huddle! Tap the sounds, throw the word, and keep going until the clock hits zero.");
    }
    D.setScoreLabel("SCORE");
    clock = D.startCountdown(GAME_MS, () => { timeUp = true; });
    while (!timeUp && D.alive()) {
      const item = words[idx++ % words.length];
      D.field.huddle(yard);
      D.setRound(`${blended} words blended`);
      const spec = specFor(item);
      if (level >= 5 && blended >= 3 && blended % 3 === 0) spec.hideWord = true;
      const res = await presentPass(D.panel, spec, { save, fx: D.fx, first: false, hints: level <= 4, limitMs: spec.limitMs });
      if (!D.alive()) return;
      recordMastery(save, [...item.g.map((g) => g.toLowerCase()), item.word.toLowerCase()], res.correct);
      D.panel.classList.add("dim");
      if (res.correct) {
        blended += 1;
        const grade = (res.attempts || 1) > 1 ? { yards: 7, tier: "ok", label: "COMPLETE!" } : gradeYards(res.elapsed, spec.limitMs);
        const td = yard + grade.yards >= 100;
        await D.field.animPass({ gain: td ? 100 - yard + 3 : grade.yards, complete: true });
        if (td) { yard = 25; D.hit(20, "TOUCHDOWN!"); D.fx.rain(1800); }
        else { yard += grade.yards; D.hit(grade.tier === "big" ? 15 : 10, grade.label); }
      } else {
        await D.field.animPass({ gain: 8, complete: false });
        D.miss("INCOMPLETE");
      }
      D.panel.classList.remove("dim");
      persist();
      await wait(300);
    }
    if (!D.alive()) return;
    clock.stop();
    const stars = blended >= 8 ? 3 : blended >= 5 ? 2 : blended >= 3 ? 1 : 0;
    D.finish({ stars, summary: `${blended} words blended before the clock ran out.` }, { onReplay, onCamp });
  }
  run();
}
