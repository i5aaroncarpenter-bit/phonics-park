import { MODE_META } from "../curriculum.js";
import { heatFromClearMs, heatLabel } from "../save.js";

export function renderRecap(app, { save, mode, level, stats, onAgain, onPark, onNext }) {
  const meta = MODE_META[mode];
  const rate = stats.atBats ? stats.correct / stats.atBats : 0;
  const passed = rate >= (level.passRate || 0.8);
  const nextHeat = passed ? heatFromClearMs(stats.clearMs) : 1;
  const canNext = passed && level.id < 6;

  app.innerHTML = `
    <section class="screen park-bg recap-screen">
      <div class="recap-card">
        <h2>${passed ? "Inning over — you passed!" : "Nice try, slugger!"}</h2>
        <p style="margin:6px 0 0;font-weight:800">${meta.title} · ${level.inning} · ${level.name}</p>
        <div class="stat-row">
          <div><b>${stats.correct}/${stats.atBats}</b>correct</div>
          <div><b>${stats.hits}</b>hits</div>
          <div><b>${stats.runs}</b>runs</div>
          <div><b>${stats.points || 0}</b>pts</div>
        </div>
        <p class="next-up">${
          passed
            ? canNext
              ? `Next up: L${level.id + 1} unlocked!`
              : "Championship park — you cleared the card!"
            : "No shame — take another at-bat."
        }</p>
        ${passed && nextHeat > 1 ? `<div class="heat-chip">${heatLabel(nextHeat)} waiting on L${Math.min(6, level.id + 1)}</div>` : ""}
        <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap">
          ${canNext ? `<button class="btn btn-go" id="next" type="button">Next inning</button>` : ""}
          <button class="btn ${canNext ? "btn-navy" : "btn-go"}" id="again" type="button">${passed ? "Play again" : "Try again"}</button>
          <button class="btn btn-ghost" id="park" type="button">Park map</button>
        </div>
        <p class="credits" style="color:var(--navy);margin-top:16px">${esc(save.name)} #${save.jersey} · Made for Ezekiel</p>
      </div>
    </section>
  `;

  app.querySelector("#park").onclick = () => onPark();
  app.querySelector("#again").onclick = () => onAgain();
  const next = app.querySelector("#next");
  if (next) next.onclick = () => onNext();
}

function esc(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
