import { getStage, STAGES, ALL_WORDS } from "../curriculum.js";
import { TROPHIES } from "../save.js";
import { esc, ICON, mascotBadge, starsHTML } from "../ui.js";
import { sfx, startMusic } from "../audio.js";
import { announce, sayWord, coach } from "../speech.js";
import { createFX } from "../fx.js";

export function renderResult(app, { save, stats, newTrophies = [], onAgain, onNext, onSeason }) {
  const stage = getStage(stats.stageId);
  const hasNext = stage.id < STAGES.length;
  const canNext = stats.won && hasNext && save.unlocked > stage.id;

  app.innerHTML = `
    <section class="screen result-screen ${stats.won ? "won" : "lost"}" id="result">
      <div class="result-card">
        <div class="result-head">
          <h2>${stats.won ? (stage.championship ? "PHONICS BOWL CHAMPION!" : "YOU WIN!") : "GOOD GAME"}</h2>
          <p>${stats.won ? "The crowd goes wild!" : `The ${esc(stage.opponent.name)} got you this time. Try again — you'll get them!`}</p>
        </div>
        <div class="final-score">
          <div class="side home"><b>${esc(save.team.name)}</b><span class="big-num">${stats.home}</span></div>
          <div class="vs">FINAL</div>
          <div class="side away"><b>${esc(stage.opponent.name)}</b><span class="big-num">${stats.away}</span>${mascotBadge(stage.opponent, 40)}</div>
        </div>
        <div class="stars-big" id="stars">${starsHTML(0)}</div>
        <div class="result-stats">
          <div><b>${stats.correct}/${stats.plays}</b><span>plays right</span></div>
          <div><b>${stats.touchdowns}</b><span>touchdowns</span></div>
          <div><b>${stats.bigPlays}</b><span>big plays</span></div>
          <div><b>${stats.bestStreak}</b><span>best streak</span></div>
          <div><b>${ICON.coin} +${stats.coins}</b><span>coins</span></div>
        </div>
        ${newTrophies.length ? `<div class="new-trophies">${newTrophies.map((id) => { const t = TROPHIES.find((x) => x.id === id); return `<span class="new-trophy">${t.emoji} ${esc(t.name)}</span>`; }).join("")}</div>` : ""}
        ${stats.missed.length ? `<div class="missed"><h4>Words to practice — tap to hear</h4><div class="missed-list">${stats.missed.slice(0, 8).map((w) => `<button class="word-chip" type="button" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div></div>` : `<p class="perfect-line">${stats.perfect ? "PERFECT GAME! Every play was right!" : "Great reading!"}</p>`}
        <div class="row result-actions">
          <button class="btn" id="season" type="button">${ICON.home} Season</button>
          <button class="btn" id="again" type="button">${ICON.replay} Play again</button>
          ${canNext ? `<button class="btn btn-go" id="next" type="button">Next game ${ICON.play}</button>` : ""}
        </div>
      </div>
    </section>
  `;

  const root = app.querySelector("#result");
  const fx = createFX(root);
  startMusic(stats.won ? "victory" : "menu");

  if (stats.won) {
    sfx("win");
    fx.rain(3000);
    announce(stage.championship ? `${save.name} is the Phonics Bowl champion!` : `${save.name} wins!`);
  } else {
    sfx("lose");
    coach(`Good game, ${save.name}. Practice those words and try again!`);
  }

  // Stars pop in one by one.
  const starEl = app.querySelector("#stars");
  let shown = 0;
  const popStar = () => {
    if (shown >= stats.stars) return;
    shown += 1;
    starEl.innerHTML = starsHTML(shown);
    starEl.querySelectorAll("i.on")[shown - 1]?.classList.add("pop");
    sfx("star");
    const r = root.getBoundingClientRect();
    fx.burst(r.width / 2 + (shown - 2) * 60, r.height * 0.42, "big", 20);
    setTimeout(popStar, 450);
  };
  setTimeout(popStar, 700);

  if (newTrophies.length) setTimeout(() => sfx("trophy"), 1400);

  app.querySelectorAll(".missed .word-chip").forEach((b) => {
    b.onclick = () => {
      const item = ALL_WORDS.find((x) => x.word.toLowerCase() === b.dataset.w.toLowerCase());
      b.classList.add("glow");
      setTimeout(() => b.classList.remove("glow"), 600);
      sayWord(item || b.dataset.w, { slow: true });
    };
  });

  app.querySelector("#season").onclick = () => { sfx("tap"); onSeason(); };
  app.querySelector("#again").onclick = () => { sfx("whistle"); onAgain(); };
  const next = app.querySelector("#next");
  if (next) next.onclick = () => { sfx("whistle"); onNext(); };

  app._cleanup = () => fx.destroy();
}
