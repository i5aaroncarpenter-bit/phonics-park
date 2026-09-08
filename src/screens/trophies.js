import { TROPHIES } from "../save.js";
import { STAGES } from "../curriculum.js";
import { esc, ICON, muteButton, starsHTML } from "../ui.js";
import { sfx } from "../audio.js";
import { say } from "../speech.js";

export function renderTrophies(app, { save, onBack, onToggleMute }) {
  const t = save.totals;
  const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
  app.innerHTML = `
    <section class="screen trophy-screen">
      <header class="topbar">
        <button class="btn icon-btn" id="back" type="button" aria-label="Back">${ICON.back}</button>
        <h2>Trophy Room</h2>
        <div class="topbar-right"><span class="chip">${ICON.star} ${totalStars}/${STAGES.length * 3}</span><span id="mute-slot"></span></div>
      </header>
      <div class="trophy-body">
        <div class="stat-grid">
          <div class="stat"><b>${t.touchdowns}</b><span>Touchdowns</span></div>
          <div class="stat"><b>${t.words}</b><span>Words read</span></div>
          <div class="stat"><b>${t.yards}</b><span>Yards</span></div>
          <div class="stat"><b>${Object.values(save.wins).filter(Boolean).length}</b><span>Wins</span></div>
          <div class="stat"><b>${t.plays ? Math.round((t.correct / t.plays) * 100) : 0}%</b><span>Accuracy</span></div>
          <div class="stat"><b>${save.coins}</b><span>Coins</span></div>
        </div>
        <h3>Trophies</h3>
        <div class="trophy-grid">
          ${TROPHIES.map((tr) => {
            const got = save.trophies.includes(tr.id);
            return `<button class="trophy ${got ? "got" : ""}" type="button" data-id="${tr.id}">
              <span class="t-emoji">${got ? tr.emoji : "🔒"}</span>
              <b>${esc(tr.name)}</b>
              <small>${esc(tr.how)}</small>
            </button>`;
          }).join("")}
        </div>
        <h3>Season stars</h3>
        <div class="star-list">
          ${STAGES.map((st) => `<div class="star-row ${st.id <= save.unlocked ? "" : "locked"}"><span>${st.opponent.mascot}</span><b>${esc(st.title)}</b>${st.id <= save.unlocked ? starsHTML(save.stars[st.id] || 0) : `<span class="lock">${ICON.lock}</span>`}</div>`).join("")}
        </div>
      </div>
    </section>
  `;
  app.querySelector("#mute-slot").appendChild(muteButton(save, onToggleMute));
  app.querySelector("#back").onclick = () => { sfx("tap"); onBack(); };
  app.querySelectorAll(".trophy").forEach((b) => {
    b.onclick = () => {
      const tr = TROPHIES.find((x) => x.id === b.dataset.id);
      sfx("tap");
      say(save.trophies.includes(tr.id) ? `${tr.name}! ${tr.how}` : `Locked. ${tr.how}`);
    };
  });
}
