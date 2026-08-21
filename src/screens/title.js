export function renderTitle(app, { save, onPlay, onToggleMute }) {
  app.innerHTML = `
    <section class="screen park-bg title-screen">
      <div class="bunting">${"<i></i>".repeat(13)}</div>
      <div class="logo-lockup">
        <h1>Phonics Park</h1>
        <p class="tagline">Sound it out. Swing for the fences.</p>
      </div>
      <div class="player-card">
        <div class="jersey" aria-hidden="true">
          <div class="jersey-head"></div>
          <div class="jersey-body"><div class="jersey-num" id="jersey-face">${save.jersey}</div></div>
        </div>
        <div class="player-fields">
          <label for="kid-name">Player</label>
          <input id="kid-name" type="text" maxlength="16" value="${esc(save.name)}" autocomplete="off" />
          <label>Jersey</label>
          <div class="jersey-row">
            <button class="btn icon-btn" id="j-minus" type="button" aria-label="Lower number">−</button>
            <input id="jersey" type="number" min="1" max="99" value="${save.jersey}" />
            <button class="btn icon-btn" id="j-plus" type="button" aria-label="Raise number">+</button>
          </div>
        </div>
      </div>
      <div class="title-actions">
        <button class="btn icon-btn" id="mute-btn" type="button" aria-label="Mute">${save.mute ? "🔇" : "🔊"}</button>
        <button class="btn btn-go" id="play-btn" type="button">Play Ball!</button>
      </div>
      <p class="credits">Made for Ezekiel</p>
    </section>
  `;

  const nameEl = app.querySelector("#kid-name");
  const jerseyEl = app.querySelector("#jersey");
  const face = app.querySelector("#jersey-face");
  const muteBtn = app.querySelector("#mute-btn");

  function clampJersey(n) {
    n = parseInt(n, 10);
    if (Number.isNaN(n)) n = 21;
    return Math.min(99, Math.max(1, n));
  }

  function syncJersey(n) {
    const v = clampJersey(n);
    jerseyEl.value = v;
    face.textContent = v;
    return v;
  }

  jerseyEl.addEventListener("change", () => syncJersey(jerseyEl.value));
  app.querySelector("#j-minus").onclick = () => syncJersey(clampJersey(jerseyEl.value) - 1);
  app.querySelector("#j-plus").onclick = () => syncJersey(clampJersey(jerseyEl.value) + 1);

  muteBtn.onclick = () => {
    const next = !save.mute;
    onToggleMute(next);
    muteBtn.textContent = next ? "🔇" : "🔊";
  };

  app.querySelector("#play-btn").onclick = () => {
    onPlay({
      name: (nameEl.value || "Ezekiel").trim().slice(0, 16) || "Ezekiel",
      jersey: clampJersey(jerseyEl.value),
    });
  };
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
