/** Little League map (ages 3–5): eight big, friendly game cards. */

import { ROOKIE_STAGES, LETTERS } from "../rookie/data.js";
import { esc, ICON, muteButton, starsHTML } from "../ui.js";
import { sfx } from "../audio.js";
import { say } from "../speech.js";
import { buddyFor } from "../save.js";
import { rankBadge } from "../rewards.js";

export function renderLeague(app, { save, onPlayStage, onStickers, onBigLeague, onBack, onToggleMute }) {
  const unlocked = save.rookie.unlocked || 1;
  const buddy = buddyFor(save);
  const known = new Set(ROOKIE_STAGES.filter((s) => s.id < unlocked).flatMap((s) => s.letters));
  app.innerHTML = `
    <section class="screen league-screen">
      <header class="topbar">
        <button class="btn icon-btn" id="back" type="button" aria-label="Back">${ICON.back}</button>
        <h2>${buddy.emoji} Little League</h2>
        <div class="topbar-right">
          ${rankBadge(save)}
          <button class="btn btn-soft" id="stickers" type="button">🎟️ Stickers <b>${save.stickers.length}</b></button>
          <span id="mute-slot"></span>
        </div>
      </header>
      <div class="abc-progress" aria-label="Letters learned">
        ${LETTERS.map((l) => `<span class="${known.has(l.l) ? "known" : ""}">${l.upper}</span>`).join("")}
      </div>
      <div class="league-scroll">
        <div class="league-grid">
          ${ROOKIE_STAGES.map((st) => {
            const locked = st.id > unlocked;
            const stars = save.rookie.stars[st.id] || 0;
            return `<button class="league-card ${locked ? "locked" : ""} ${st.id === unlocked ? "next" : ""}" data-id="${st.id}" type="button" ${locked ? "disabled" : ""} style="--c:${st.color}">
              <span class="league-mascot">${st.mascot}</span>
              <b>${esc(st.title)}</b>
              <span class="league-letters">${st.letters.length ? st.letters.map((l) => l.toUpperCase()).join(" ") : "★ ★ ★"}</span>
              ${locked ? `<span class="lock">${ICON.lock}</span>` : starsHTML(stars)}
            </button>`;
          }).join("")}
        </div>
        <button class="big-league-link" id="big" type="button">🏈 Big League (ages 6+) →</button>
      </div>
    </section>
  `;
  app.querySelector("#mute-slot").appendChild(muteButton(save, onToggleMute));
  app.querySelector("#back").onclick = () => { sfx("tap"); onBack(); };
  app.querySelector("#stickers").onclick = () => { sfx("tap"); onStickers(); };
  app.querySelector("#big").onclick = () => { sfx("tap"); onBigLeague(); };
  app.querySelectorAll(".league-card:not(.locked)").forEach((b) => {
    b.onclick = () => {
      const st = ROOKIE_STAGES.find((s) => s.id === Number(b.dataset.id));
      sfx("whistle");
      say(st.title, { rate: 1, pitch: 1.1 });
      onPlayStage(st.id);
    };
  });
  app.querySelectorAll(".abc-progress span").forEach((s) => {
    s.onclick = () => { sfx("tap"); say(s.textContent, { rate: 0.9, pitch: 1.1 }); };
  });
  if (!save.tutorials["league:hub"]) {
    save.tutorials["league:hub"] = true;
    say(`Welcome to the Little League, ${save.name}! Tap the ${ROOKIE_STAGES[0].mascot === "🐣" ? "chick" : "first"} card to start!`, { rate: 1, pitch: 1.1 });
  }
}
