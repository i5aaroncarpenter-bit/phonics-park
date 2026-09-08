import { esc, ICON, helmetSVG, footballSVG, muteButton, el } from "../ui.js";
import { teamColors, helmetStyle, buddyFor, BUDDIES, listProfiles, isRookie } from "../save.js";
import { createField } from "../field.js";
import { sfx } from "../audio.js";
import { say } from "../speech.js";
import { rankBadge } from "../rewards.js";

export function renderTitle(app, { save, giftReady, onPlay, onCamp, onLocker, onTrophies, onClipboard, onStickers, onGift, onSwitchProfile, onNewProfile, onToggleMute }) {
  const colors = teamColors(save);
  const buddy = buddyFor(save);
  const rookie = isRookie(save);
  const profiles = listProfiles();
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
          <button class="buddy-btn" id="buddy" type="button" aria-label="${esc(buddy.name)}">${buddy.emoji}</button>
          <div class="card-helmet">${helmetSVG({ primary: colors.primary, secondary: colors.secondary, style: helmetStyle(save), size: 96, number: save.number })}</div>
          <div class="player-fields">
            <label for="kid-name">Star player</label>
            <input id="kid-name" type="text" maxlength="14" value="${esc(save.name)}" autocomplete="off" autocapitalize="words" />
            <div class="team-line">${rankBadge(save)} · ${esc(save.team.name)} #${save.number}</div>
          </div>
        </div>
        <div class="title-actions">
          <div class="row">
            <button class="btn btn-go btn-huge" id="play-btn" type="button">${ICON.play} PLAY</button>
            ${giftReady ? `<button class="btn btn-gift btn-huge" id="gift-btn" type="button">🎁 Daily gift!</button>` : ""}
          </div>
          <div class="row">
            ${rookie ? `<button class="btn btn-soft" id="stickers-btn" type="button">🎟️ Stickers</button>` : `<button class="btn btn-camp" id="camp-btn" type="button">🏋️ Camp</button>`}
            <button class="btn btn-soft" id="locker-btn" type="button">🧢 Locker</button>
            <button class="btn btn-soft" id="trophy-btn" type="button">${ICON.trophy} Trophies</button>
            <button class="btn btn-soft" id="clip-btn" type="button">${ICON.clipboard} Coach</button>
          </div>
        </div>
        <div class="profile-row" id="profiles">
          ${profiles.map((p) => `<button class="profile-chip ${p.active ? "on" : ""}" data-id="${p.id}" type="button" title="${esc(p.name)}"><span>${(BUDDIES.find((b) => b.id === p.buddy) || BUDDIES[0]).emoji}</span>${esc(p.name)}</button>`).join("")}
          <button class="profile-chip add" id="add-profile" type="button">＋ Add player</button>
        </div>
        <p class="credits">${rookie ? "Little League · ages 3–5" : "Big League · ages 6+"} · ${save.coins} coins · ${save.stickers.length} stickers</p>
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
  const getName = () => (nameEl.value || save.name || "Player").trim().slice(0, 14) || "Player";

  const TRICKS = ["does a backflip!", "spikes the ball!", "does the touchdown dance!", "says hi!", "gives you a high five!"];
  app.querySelector("#buddy").onclick = (e) => {
    sfx("cheer");
    e.currentTarget.classList.remove("bounce"); void e.currentTarget.offsetWidth; e.currentTarget.classList.add("bounce");
    say(`${buddy.name} ${TRICKS[Math.floor(Math.random() * TRICKS.length)]}`, { rate: 1, pitch: 1.15 });
    for (const p of field.state.players) if (p.team === "home") p.anim = "flip";
    setTimeout(() => { for (const p of field.state.players) p.anim = "idle"; }, 1600);
  };

  app.querySelector("#play-btn").onclick = () => { sfx("whistle"); onPlay({ name: getName() }); };
  const gift = app.querySelector("#gift-btn");
  if (gift) gift.onclick = () => { sfx("coins"); onGift({ name: getName() }); };
  const camp = app.querySelector("#camp-btn");
  if (camp) camp.onclick = () => { sfx("whistle"); onCamp({ name: getName() }); };
  const stk = app.querySelector("#stickers-btn");
  if (stk) stk.onclick = () => { sfx("tap"); onStickers({ name: getName() }); };
  app.querySelector("#locker-btn").onclick = () => { sfx("tap"); onLocker({ name: getName() }); };
  app.querySelector("#trophy-btn").onclick = () => { sfx("tap"); onTrophies({ name: getName() }); };
  app.querySelector("#clip-btn").onclick = () => { sfx("tap"); onClipboard({ name: getName() }); };
  app.querySelectorAll(".profile-chip[data-id]").forEach((b) => {
    b.onclick = () => { if (b.classList.contains("on")) return; sfx("tap"); onSwitchProfile(b.dataset.id); };
  });
  app.querySelector("#add-profile").onclick = () => { sfx("tap"); newProfileDialog(app, onNewProfile); };

  app._cleanup = () => {
    clearInterval(pan);
    clearInterval(cheer);
    field.destroy();
  };
}

/** Create-a-player dialog: name, age band and buddy. */
export function newProfileDialog(app, onCreate, { first = false } = {}) {
  let buddy = BUDDIES[Math.floor(Math.random() * BUDDIES.length)].id;
  let mode = "rookie";
  const dlg = el(`
    <div class="modal">
      <div class="modal-card new-profile">
        ${first ? "" : `<button class="btn icon-btn close" id="close" type="button" aria-label="Close">✕</button>`}
        <h3>${first ? "Who's playing?" : "Add a player"}</h3>
        <label class="field big-field"><span>Name</span><input id="np-name" type="text" maxlength="14" placeholder="Type a name" autocomplete="off" autocapitalize="words" /></label>
        <p class="muted">How old is your player?</p>
        <div class="row mode-row">
          <button class="mode-pick on" data-mode="rookie" type="button"><span>🐣</span><b>3–5</b><small>Little League: letters, sounds, rhymes</small></button>
          <button class="mode-pick" data-mode="pro" type="button"><span>🏈</span><b>6+</b><small>Big League: blend words, read sentences</small></button>
        </div>
        <p class="muted">Pick a buddy</p>
        <div class="buddy-grid">${BUDDIES.map((b) => `<button class="buddy-pick ${b.id === buddy ? "on" : ""}" data-id="${b.id}" type="button" aria-label="${esc(b.name)}">${b.emoji}</button>`).join("")}</div>
        <div class="row"><button class="btn btn-go btn-huge" id="create" type="button">${ICON.play} Let's play!</button></div>
      </div>
    </div>`);
  app.appendChild(dlg);
  const close = dlg.querySelector("#close");
  if (close) close.onclick = () => { sfx("tap"); dlg.remove(); };
  dlg.querySelectorAll(".mode-pick").forEach((b) => { b.onclick = () => { mode = b.dataset.mode; dlg.querySelectorAll(".mode-pick").forEach((x) => x.classList.toggle("on", x === b)); sfx("tap"); }; });
  dlg.querySelectorAll(".buddy-pick").forEach((b) => {
    b.onclick = () => {
      buddy = b.dataset.id;
      dlg.querySelectorAll(".buddy-pick").forEach((x) => x.classList.toggle("on", x === b));
      sfx("tap");
      const bd = BUDDIES.find((x) => x.id === buddy);
      say(`${bd.name}!`, { rate: 1, pitch: 1.15 });
    };
  });
  dlg.querySelector("#create").onclick = () => {
    const name = (dlg.querySelector("#np-name").value || "").trim().slice(0, 14) || (mode === "rookie" ? "Rookie" : "Player");
    sfx("whistle");
    dlg.remove();
    onCreate({ name, mode, buddy });
  };
  setTimeout(() => dlg.querySelector("#np-name").focus(), 50);
}
