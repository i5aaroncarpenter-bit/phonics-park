import { STAGES, KEYWORDS } from "../curriculum.js";
import { esc, ICON, mascotBadge, starsHTML, muteButton, el } from "../ui.js";
import { sfx } from "../audio.js";
import { coach } from "../speech.js";

export function renderSeason(app, { save, onPlayStage, onCamp, onBack, onToggleMute }) {
  const wins = Object.values(save.wins).filter(Boolean).length;
  app.innerHTML = `
    <section class="screen season-screen">
      <header class="topbar">
        <button class="btn icon-btn" id="back" type="button" aria-label="Back">${ICON.back}</button>
        <h2>Season Schedule</h2>
        <div class="topbar-right">
          <span class="chip">${ICON.coin} ${save.coins}</span>
          <span class="chip">${ICON.trophy} ${wins}/${STAGES.length}</span>
          <span id="mute-slot"></span>
        </div>
      </header>
      <div class="season-scroll">
        <button class="camp-card" id="camp" type="button">
          <span class="camp-emoji">🏋️</span>
          <span class="camp-text"><b>Training Camp</b><small>A quick practice drill on the sounds that trick you most. Earn coins, no pressure.</small></span>
          <span class="btn btn-soft">Practice</span>
        </button>
        <div class="season-path">
          ${STAGES.map((st, i) => {
            const unlocked = st.id <= save.unlocked;
            const stars = save.stars[st.id] || 0;
            const won = !!save.wins[st.id];
            return `
              <button class="game-node ${unlocked ? "" : "locked"} ${won ? "won" : ""} ${st.id === save.unlocked ? "next" : ""} ${st.championship ? "champ" : ""}" data-id="${st.id}" type="button" ${unlocked ? "" : "disabled"} style="--p:${st.opponent.primary};--s:${st.opponent.secondary}">
                <span class="week">${st.championship ? "FINAL" : "Game " + st.id}</span>
                ${mascotBadge(st.opponent, 72)}
                <span class="node-title">${esc(st.title)}</span>
                <span class="node-opp">vs ${esc(st.opponent.name)}</span>
                ${unlocked ? starsHTML(stars) : `<span class="lock">${ICON.lock}</span>`}
                ${st.id === save.unlocked && !won ? `<span class="next-tag">NEXT UP</span>` : ""}
              </button>
              ${i < STAGES.length - 1 ? `<span class="path-link ${st.id < save.unlocked ? "done" : ""}"></span>` : ""}
            `;
          }).join("")}
        </div>
      </div>
    </section>
  `;

  app.querySelector("#mute-slot").appendChild(muteButton(save, onToggleMute));
  app.querySelector("#back").onclick = () => { sfx("tap"); onBack(); };
  app.querySelector("#camp").onclick = () => { sfx("whistle"); onCamp(); };

  app.querySelectorAll(".game-node:not(.locked)").forEach((node) => {
    node.onclick = () => {
      sfx("tap");
      openStage(Number(node.dataset.id));
    };
  });

  // Scroll the next game into view.
  requestAnimationFrame(() => {
    const next = app.querySelector(".game-node.next") || app.querySelector(".game-node.champ");
    if (next) next.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  });

  function openStage(id) {
    const st = STAGES.find((x) => x.id === id);
    const skills = (st.letters || st.targets || []).slice(0, 12);
    const stars = save.stars[st.id] || 0;
    const best = save.best[st.id];
    const dlg = el(`
      <div class="modal">
        <div class="modal-card stage-card" style="--p:${st.opponent.primary};--s:${st.opponent.secondary}">
          <button class="btn icon-btn close" id="close" type="button" aria-label="Close">✕</button>
          <div class="stage-hero">
            ${mascotBadge(st.opponent, 84)}
            <div>
              <small>${st.championship ? "CHAMPIONSHIP" : "Game " + st.id} · vs ${esc(st.opponent.name)}</small>
              <h3>${esc(st.title)}</h3>
              ${starsHTML(stars)}
            </div>
          </div>
          <p class="blurb">${esc(st.blurb)}</p>
          ${skills.length ? `<div class="skill-row">${skills.map((g) => `<span class="skill-tile">${esc(g.replace("_", "－"))}${KEYWORDS[g] ? `<small>${KEYWORDS[g][1]}</small>` : ""}</span>`).join("")}</div>` : ""}
          <div class="play-types">${st.plays.map((p) => `<span class="ptype">${PLAY_LABEL[p] || p}</span>`).join("")}</div>
          ${best ? `<p class="best">Best score: ${best.home}–${best.away}</p>` : ""}
          <div class="row">
            <button class="btn btn-go btn-huge" id="go" type="button">${ICON.play} ${save.wins[st.id] ? "Play again" : "Kickoff!"}</button>
          </div>
        </div>
      </div>
    `);
    dlg.querySelector("#close").onclick = () => { sfx("tap"); dlg.remove(); };
    dlg.onclick = (e) => { if (e.target === dlg) dlg.remove(); };
    dlg.querySelector("#go").onclick = () => { sfx("whistle"); dlg.remove(); onPlayStage(st.id); };
    app.appendChild(dlg);
    coach(`${st.title}. ${st.blurb}`);
  }
}

const PLAY_LABEL = {
  soundid: "Sound Rush", initial: "First Sound", "defense-letter": "Defense", pass: "Pass Play", rush: "Rush",
  "rush-read": "Read & Rush", kick: "Field Goal", defense: "Defense", "defense-sight": "Defense", readzone: "Read Zone",
};
