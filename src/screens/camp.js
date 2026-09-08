/** Training Camp hub — pick a drill. */

import { DRILLS } from "../camp/data.js";
import { esc, ICON, muteButton, starsHTML } from "../ui.js";
import { sfx } from "../audio.js";
import { coach } from "../speech.js";

export function renderCamp(app, { save, onDrill, onBack, onToggleMute }) {
  const unlocked = Math.max(1, save.unlocked || 1);
  const totalStars = DRILLS.reduce((a, d) => a + ((save.camp[d.id] || {}).stars || 0), 0);
  app.innerHTML = `
    <section class="screen camp-screen">
      <header class="topbar">
        <button class="btn icon-btn" id="back" type="button" aria-label="Back">${ICON.back}</button>
        <h2>🏋️ Training Camp</h2>
        <div class="topbar-right">
          <span class="chip">${ICON.coin} ${save.coins}</span>
          <span class="chip">${ICON.star} ${totalStars}/${DRILLS.length * 3}</span>
          <span id="mute-slot"></span>
        </div>
      </header>
      <p class="camp-intro">Quick drills on the building blocks of reading: vowel sounds, sound twins, word families and more. Earn coins and stars — no scoreboard pressure.</p>
      <div class="camp-grid">
        ${DRILLS.map((d) => {
          const rec = save.camp[d.id] || { best: 0, stars: 0, plays: 0 };
          const locked = d.minStage > unlocked;
          return `<button class="drill-card ${locked ? "locked" : ""}" data-id="${d.id}" type="button" ${locked ? "disabled" : ""}>
            <span class="drill-card-emoji">${d.emoji}</span>
            <span class="drill-card-body">
              <b>${esc(d.title)}</b>
              <small>${esc(d.blurb)}</small>
              <span class="drill-card-meta">${locked ? `${ICON.lock} Unlocks after Game ${d.minStage - 1}` : rec.plays ? `${starsHTML(rec.stars)} Best ${rec.best}` : `${starsHTML(0)} New!`}</span>
            </span>
            <span class="btn ${locked ? "" : "btn-go"}">${locked ? ICON.lock : ICON.play}</span>
          </button>`;
        }).join("")}
      </div>
    </section>
  `;
  app.querySelector("#mute-slot").appendChild(muteButton(save, onToggleMute));
  app.querySelector("#back").onclick = () => { sfx("tap"); onBack(); };
  app.querySelectorAll(".drill-card:not(.locked)").forEach((b) => {
    b.onclick = () => { sfx("whistle"); onDrill(b.dataset.id); };
  });
  if (!save.tutorials["camp:hub"]) {
    save.tutorials["camp:hub"] = true;
    coach("Welcome to Training Camp! Pick a drill. Vowel Kicks is a great place to start.");
  }
}
