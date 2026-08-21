import { LEVELS, MODE_META } from "../curriculum.js";
import { heatForNextLevel, heatLabel } from "../save.js";

export function renderLevels(app, { save, mode, onPickLevel, onBack, onToggleMute }) {
  const meta = MODE_META[mode];
  const reached = save.levelReached[mode] || 1;
  app.innerHTML = `
    <section class="screen park-bg park-screen">
      <div class="topbar">
        <button class="btn icon-btn" id="back" type="button" aria-label="Park">←</button>
        <h2>${meta.title}</h2>
        <button class="btn icon-btn" id="mute-btn" type="button" aria-label="Mute">${save.mute ? "🔇" : "🔊"}</button>
      </div>
      <p class="prompt" style="align-self:center;margin:10px 0">${meta.blurb}</p>
      <div class="level-sheet" id="sheet">
        <h3>Pick an inning</h3>
        <div class="level-grid">
          ${LEVELS.map((lv) => {
            const locked = lv.id > reached;
            const heat = heatForNextLevel(save, mode, lv.id);
            const badge = !locked && heat > 1 ? `<span class="heat-badge">${heatLabel(heat)}</span>` : "";
            const passed = save.passed[mode]?.[String(lv.id)];
            return `
              <button class="btn level-card ${locked ? "locked" : ""}" data-lv="${lv.id}" ${locked ? "disabled" : ""} type="button">
                ${locked ? '<span class="lock-ico">🔒</span>' : ""}
                <span class="inn">${lv.inning}${passed ? " ★" : ""}</span>
                <strong>L${lv.id} ${lv.name}</strong>
                <span>${lv.blurb}</span>
                ${badge}
              </button>`;
          }).join("")}
        </div>
      </div>
    </section>
  `;
  app.querySelector("#back").onclick = () => onBack();
  const muteBtn = app.querySelector("#mute-btn");
  muteBtn.onclick = () => {
    const next = !save.mute;
    onToggleMute(next);
    muteBtn.textContent = next ? "🔇" : "🔊";
  };
  app.querySelectorAll("[data-lv]").forEach((b) => {
    b.onclick = () => onPickLevel(Number(b.dataset.lv));
  });
}
