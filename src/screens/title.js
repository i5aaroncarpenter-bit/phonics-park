import { esc, ICON, helmetSVG, footballSVG, muteButton } from "../ui.js";
import { teamColors, helmetStyle } from "../save.js";
import { createField } from "../field.js";
import { sfx } from "../audio.js";

export function renderTitle(app, { save, onPlay, onLocker, onTrophies, onClipboard, onToggleMute }) {
  const colors = teamColors(save);
  app.innerHTML = `
    <section class="screen title-screen">
      <canvas class="bg-stadium" id="bg"></canvas>
      <div class="title-overlay">
        <div class="logo-lockup">
          <div class="logo-ball">${footballSVG(64)}</div>
          <h1><span>PHONICS</span><span>BOWL</span></h1>
          <p class="tagline">Read it. Run it. Score!</p>
        </div>
        <div class="player-card">
          <div class="card-helmet">${helmetSVG({ primary: colors.primary, secondary: colors.secondary, style: helmetStyle(save), size: 110, number: save.number })}</div>
          <div class="player-fields">
            <label for="kid-name">Star player</label>
            <input id="kid-name" type="text" maxlength="14" value="${esc(save.name)}" autocomplete="off" autocapitalize="words" />
            <div class="team-line">${esc(save.team.name)} · #${save.number}</div>
          </div>
        </div>
        <div class="title-actions">
          <button class="btn btn-go btn-huge" id="play-btn" type="button">${ICON.play} PLAY</button>
          <div class="row">
            <button class="btn btn-soft" id="locker-btn" type="button">🧢 Locker</button>
            <button class="btn btn-soft" id="trophy-btn" type="button">${ICON.trophy} Trophies</button>
            <button class="btn btn-soft" id="clip-btn" type="button">${ICON.clipboard} Coach</button>
          </div>
        </div>
        <p class="credits">Made for ${esc(save.name)} · ${save.coins} coins · ${Object.values(save.wins).filter(Boolean).length} wins</p>
      </div>
      <div class="corner-actions" id="corner"></div>
    </section>
  `;

  const bg = app.querySelector("#bg");
  const field = createField(bg, {
    home: { primary: colors.primary, secondary: colors.secondary, helmet: helmetStyle(save), number: save.number, name: save.team.name },
    away: { primary: "#3a3a3a", secondary: "#fff", name: "VISITORS" },
    sky: new Date().getHours() >= 19 || new Date().getHours() < 6 ? "night" : "day",
  });
  field.huddle(48);
  field.state.showLines = false;
  for (const p of field.state.players) p.anim = "idle";
  let dir = 1;
  const pan = setInterval(() => {
    const s = field.state;
    if (s.camTarget > 60) dir = -1;
    if (s.camTarget < 36) dir = 1;
    s.camTarget += dir * 0.6;
  }, 120);
  const cheer = setInterval(() => {
    for (const p of field.state.players) p.anim = p.team === "home" ? "cheer" : "idle";
    field.setHype(0.9);
    setTimeout(() => { for (const p of field.state.players) p.anim = "idle"; }, 1800);
  }, 7000);

  app.querySelector("#corner").appendChild(muteButton(save, onToggleMute));
  const nameEl = app.querySelector("#kid-name");
  const getName = () => (nameEl.value || "Ezekiel").trim().slice(0, 14) || "Ezekiel";

  app.querySelector("#play-btn").onclick = () => { sfx("whistle"); onPlay({ name: getName() }); };
  app.querySelector("#locker-btn").onclick = () => { sfx("tap"); onLocker({ name: getName() }); };
  app.querySelector("#trophy-btn").onclick = () => { sfx("tap"); onTrophies({ name: getName() }); };
  app.querySelector("#clip-btn").onclick = () => { sfx("tap"); onClipboard({ name: getName() }); };

  app._cleanup = () => {
    clearInterval(pan);
    clearInterval(cheer);
    field.destroy();
  };
}
