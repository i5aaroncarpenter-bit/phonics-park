/**
 * SOUND TWINS — pairs. Twelve helmets face down. Flip two; if they make the
 * same sound (a letter and its picture, or two spellings of one sound) they
 * are twins and stay face up.
 */

import { createDrill, wait } from "./shell.js";
import { twinPairs, campLevel } from "./data.js";
import { esc, ICON, helmetSVG } from "../ui.js";
import { teamColors, helmetStyle, recordMastery } from "../save.js";
import { saySound, sayWord, coach, say, stopSpeech } from "../speech.js";
import { sfx } from "../audio.js";
import { shuffle } from "../curriculum.js";

const EMOJI_RE = /\p{Extended_Pictographic}/u;

export function runSoundTwins(app, { save, persist, drill, onToggleMute, onQuit, onReplay, onCamp }) {
  const level = campLevel(save);
  const pairs = twinPairs(level);
  const D = createDrill(app, { save, drill, onToggleMute, onQuit, los: 50 });
  const colors = teamColors(save);
  const cards = shuffle(pairs.flatMap((p, i) => [
    { id: i, face: p.a, pair: p, kind: "grapheme" },
    { id: i, face: p.b, pair: p, kind: EMOJI_RE.test(p.b) ? "picture" : "grapheme" },
  ]));
  if (window.__pbDebug) window.__pbCards = cards.map((c) => c.id);
  let open = [];
  let busy = false;
  let matched = 0;
  let wrongFlips = 0;
  const t0 = Date.now();

  D.setScoreLabel("SCORE");
  D.setRound(`0 of ${pairs.length} twins`);
  D.panel.innerHTML = `
    <div class="play-head">
      <div class="play-title">${ICON.play} SOUND TWINS</div>
      <div class="prompt">Flip two helmets. Same sound = twins!</div>
    </div>
    <div class="twin-grid" id="grid">
      ${cards.map((c, i) => `
        <button class="twin-card" data-i="${i}" type="button" aria-label="Helmet ${i + 1}">
          <span class="twin-inner">
            <span class="twin-front">${helmetSVG({ primary: colors.primary, secondary: colors.secondary, style: helmetStyle(save), size: 72 })}</span>
            <span class="twin-back ${c.kind}">${esc(c.face.replace("_", "－"))}</span>
          </span>
        </button>`).join("")}
    </div>
  `;

  const grid = D.panel.querySelector("#grid");

  async function speakCard(c) {
    if (c.kind === "picture") await sayWord(c.pair.word || "");
    else await saySound(c.face.replace("－", "_"));
  }

  grid.querySelectorAll(".twin-card").forEach((btn) => {
    btn.onclick = async () => {
      if (busy || btn.classList.contains("flipped")) return;
      const c = cards[Number(btn.dataset.i)];
      btn.classList.add("flipped");
      sfx("tap");
      stopSpeech();
      speakCard(c);
      open.push({ btn, c });
      if (open.length < 2) return;
      busy = true;
      const [x, y] = open;
      open = [];
      await wait(700);
      if (x.c.id === y.c.id) {
        matched += 1;
        x.btn.classList.add("won");
        y.btn.classList.add("won");
        recordMastery(save, [x.c.pair.say], true);
        D.hit(15, "TWINS!");
        D.field.setHype(0.9);
        for (const p of D.field.state.players) if (p.team === "home") p.anim = "cheer";
        setTimeout(() => { for (const p of D.field.state.players) p.anim = "idle"; }, 1400);
        D.setRound(`${matched} of ${pairs.length} twins`);
        if (x.c.pair.kind === "spelling" && x.c.pair.note) await coach(x.c.pair.note);
        else if (x.c.pair.word) await say(`${x.c.pair.a.replace("_", " ")} — like in ${x.c.pair.word}!`, { rate: 0.95 });
        if (matched === pairs.length) { busy = false; return end(); }
      } else {
        wrongFlips += 1;
        recordMastery(save, [x.c.pair.say, y.c.pair.say], false);
        x.btn.classList.add("nope");
        y.btn.classList.add("nope");
        D.miss("NOT TWINS");
        await wait(500);
        x.btn.classList.remove("flipped", "nope");
        y.btn.classList.remove("flipped", "nope");
      }
      busy = false;
    };
  });

  function end() {
    const secs = Math.round((Date.now() - t0) / 1000);
    const timeBonus = Math.max(0, 60 - secs) * 2;
    if (timeBonus) { D.S.score += timeBonus; D.paint(); }
    const stars = wrongFlips <= 4 ? 3 : wrongFlips <= 9 ? 2 : 1;
    persist();
    D.finish({ stars, summary: `All ${pairs.length} twins found in ${secs}s with ${wrongFlips} wrong flips.${timeBonus ? ` Speed bonus +${timeBonus}!` : ""}` }, { onReplay, onCamp });
  }

  (async () => {
    await D.intro();
    if (!save.tutorials["drill:twins"]) {
      save.tutorials["drill:twins"] = true;
      persist();
      await coach("Some sounds have twins. A letter and its picture are twins. Two spellings that make the same sound are twins too!");
    }
  })();
}
