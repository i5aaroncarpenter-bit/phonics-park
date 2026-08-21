import { drawParkBackdrop } from "../fx.js";

export function renderPark(app, { save, onPickMode, onBack, onToggleMute }) {
  app.innerHTML = `
    <section class="screen park-bg park-screen">
      <div class="topbar">
        <button class="btn icon-btn" id="back" type="button" aria-label="Title">←</button>
        <h2>${esc(save.name)} #${save.jersey}</h2>
        <div class="hi-score">HI ${save.highScore || 0}</div>
        <button class="btn icon-btn" id="mute-btn" type="button" aria-label="Mute">${save.mute ? "🔇" : "🔊"}</button>
      </div>
      <div class="diamond-wrap">
        <canvas class="diamond-art" id="park-art"></canvas>
        <div class="stations">
          <button class="btn station station-atbat" data-mode="atbat" type="button">
            <strong>At Bat</strong>
            <span>Tap sounds. Blend. Swing.</span>
          </button>
          <button class="btn station station-defense" data-mode="defense" type="button">
            <strong>Defense</strong>
            <span>Catch the matching sound.</span>
          </button>
          <button class="btn station station-pitch" data-mode="pitching" type="button">
            <strong>Pitching</strong>
            <span>Throw the right sound.</span>
          </button>
        </div>
      </div>
    </section>
  `;

  const canvas = app.querySelector("#park-art");
  const paint = () => drawParkBackdrop(canvas, Date.now());
  paint();
  const ro = new ResizeObserver(paint);
  ro.observe(canvas);
  let anim = requestAnimationFrame(function loop() {
    paint();
    anim = requestAnimationFrame(loop);
  });
  app._cleanup = () => {
    cancelAnimationFrame(anim);
    ro.disconnect();
  };

  app.querySelector("#back").onclick = () => onBack();
  const muteBtn = app.querySelector("#mute-btn");
  muteBtn.onclick = () => {
    const next = !save.mute;
    onToggleMute(next);
    muteBtn.textContent = next ? "🔇" : "🔊";
  };
  app.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.onclick = () => onPickMode(btn.dataset.mode);
  });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
