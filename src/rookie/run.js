/**
 * Runs one Little League game: a sequence of gentle rounds for the stage's
 * letters, with the field celebrating every success, then a mystery box.
 */

import { createDrill, wait } from "../camp/shell.js";
import { ROOKIE_STAGES, LETTERS, SYLLABLES, letter, shuffle, pick } from "./data.js";
import { parade, trace, lineup, rhyme, clap, alphabet } from "./games.js";
import { coach } from "../speech.js";
import { sfx } from "../audio.js";
import { recordMastery, buddyFor } from "../save.js";
import { openMysteryBox, awardXp } from "../rewards.js";

function learnedLetters(stage) {
  return ROOKIE_STAGES.filter((s) => s.id <= stage.id).flatMap((s) => s.letters);
}

/** Build the round list for a stage. */
function plan(stage) {
  const rounds = [];
  const learned = learnedLetters(stage);
  const review = learned.filter((l) => !stage.letters.includes(l));
  for (const l of stage.letters) {
    rounds.push({ type: "parade", l });
    rounds.push({ type: "trace", l });
    if (stage.id >= 2) rounds.push({ type: "lineup", l });
  }
  if (stage.id >= 3) rounds.push({ type: "rhyme" });
  if (stage.id >= 5) rounds.push({ type: "clap", entry: pick(SYLLABLES.filter((s) => s[1] <= (stage.id >= 7 ? 4 : 3))) });
  if (stage.id === 8) {
    const ls = shuffle([...learned]).slice(0, 6);
    for (const l of ls) rounds.push({ type: "lineup", l });
    rounds.push({ type: "rhyme" }, { type: "rhyme" });
    rounds.push({ type: "clap", entry: pick(SYLLABLES) }, { type: "clap", entry: pick(SYLLABLES) });
    rounds.push({ type: "alphabet", letters: shuffle([...LETTERS.map((x) => x.l)]).slice(0, 8) });
  } else {
    const abc = [...stage.letters, ...shuffle([...review]).slice(0, Math.max(0, 6 - stage.letters.length))];
    rounds.push({ type: "alphabet", letters: abc });
  }
  return rounds;
}

export function runLittleLeague(app, { save, persist, stageId, onToggleMute, onQuit, onReplay, onDone }) {
  const stage = ROOKIE_STAGES.find((s) => s.id === Number(stageId)) || ROOKIE_STAGES[0];
  const rounds = plan(stage);
  const learned = learnedLetters(stage);
  const buddy = buddyFor(save);
  const drill = { id: "league" + stage.id, title: stage.title, emoji: stage.mascot, sky: stage.id % 3 === 0 ? "sunset" : stage.id % 3 === 1 ? "day" : "night", coach: "" };
  const D = createDrill(app, { save, drill, onToggleMute, onQuit, los: 25 });
  D.setScoreLabel("STARS");
  let yard = 25;
  let firstTries = 0;

  async function celebrateOnField(big) {
    D.panel.classList.add("dim");
    D.panel.innerHTML = `<div class="between-rounds">${buddy.emoji}</div>`;
    const gain = big ? 100 - yard + 3 : 14;
    const td = yard + gain >= 100 || big;
    await D.field.animRush({ gain, tackled: false });
    if (td) { yard = 25; D.fx.rain(1500); }
    else yard += gain;
    D.panel.classList.remove("dim");
  }

  async function run() {
    await D.intro();
    if (!save.tutorials["league:" + stage.id]) {
      save.tutorials["league:" + stage.id] = true;
      persist();
      await coach(stage.id === 1
        ? `Hi ${save.name}! I'm ${buddy.name}. Let's meet some letters and play football!`
        : `${stage.blurb} Let's go, ${save.name}!`);
    }
    for (let i = 0; i < rounds.length && D.alive(); i++) {
      const r = rounds[i];
      D.setRound(`${i + 1} of ${rounds.length}`);
      D.field.huddle(yard);
      let res;
      if (r.type === "parade") res = await parade(D, letter(r.l), learned);
      else if (r.type === "trace") res = await trace(D, letter(r.l), save);
      else if (r.type === "lineup") res = await lineup(D, letter(r.l), learned);
      else if (r.type === "rhyme") res = await rhyme(D);
      else if (r.type === "clap") res = await clap(D, r.entry);
      else res = await alphabet(D, r.letters);
      if (!D.alive()) return;
      D.panel.classList.add("dim");
      if (r.l) {
        recordMastery(save, [r.l], res.correct);
        const rec = save.rookie.letters[r.l] || { seen: 0, right: 0 };
        rec.seen += 1;
        if (res.correct) rec.right += 1;
        save.rookie.letters[r.l] = rec;
      }
      if (res.correct) firstTries += 1;
      D.hit(res.correct ? 10 : 5, null);
      await celebrateOnField(r.type === "alphabet" || r.type === "trace");
      persist();
      await wait(250);
    }
    if (!D.alive()) return;
    const ratio = firstTries / rounds.length;
    const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    const prev = save.rookie.stars[stage.id] || 0;
    save.rookie.stars[stage.id] = Math.max(prev, stars);
    if (stage.id >= (save.rookie.unlocked || 1) && stage.id < ROOKIE_STAGES.length) save.rookie.unlocked = stage.id + 1;
    save.totals.games = (save.totals.games || 0) + 1;
    persist();
    D.finish({ stars, summary: `You met ${stage.letters.length ? stage.letters.map((l) => l.toUpperCase()).join(", ") : "lots of sounds"} today!` }, {
      onReplay,
      onCamp: async () => {
        openMysteryBox(app, save, {
          coins: 20 + stars * 10,
          onDone: async () => { await awardXp(app, save, 40 + firstTries * 5); persist(); onDone(); },
        });
      },
    });
    // Relabel the result buttons for little players.
    const card = app.querySelector(".drill-result");
    if (card) {
      card.querySelector("#to-camp").innerHTML = "🎁 Open my box!";
      card.querySelector("#to-camp").classList.add("btn-go");
      card.querySelector("#replay").classList.remove("btn-go");
    }
    sfx("trophy");
  }
  run();
}
