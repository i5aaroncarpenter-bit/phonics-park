import { HELMETS, TEAM_COLORS, TEAM_NAMES, CELEBRATIONS, teamColors, helmetStyle } from "../save.js";
import { esc, ICON, helmetSVG, muteButton, toast } from "../ui.js";
import { sfx } from "../audio.js";
import { say } from "../speech.js";

export function renderLocker(app, { save, persist, onBack, onToggleMute }) {
  function draw() {
    const colors = teamColors(save);
    app.innerHTML = `
      <section class="screen locker-screen">
        <header class="topbar">
          <button class="btn icon-btn" id="back" type="button" aria-label="Back">${ICON.back}</button>
          <h2>Locker Room</h2>
          <div class="topbar-right"><span class="chip">${ICON.coin} <b id="coins">${save.coins}</b></span><span id="mute-slot"></span></div>
        </header>
        <div class="locker-body">
          <div class="locker-preview">
            ${helmetSVG({ primary: colors.primary, secondary: colors.secondary, style: helmetStyle(save), size: 170, number: save.number })}
            <div class="jersey-preview" style="--p:${colors.primary};--s:${colors.secondary}">
              <span class="jersey-name">${esc(save.name).toUpperCase()}</span>
              <span class="jersey-num">${save.number}</span>
            </div>
            <div class="team-name-big">${esc(save.team.name)}</div>
          </div>
          <div class="locker-options">
            <h3>Jersey number</h3>
            <div class="row">
              <button class="btn icon-btn" id="num-minus" type="button" aria-label="Lower number">−</button>
              <span class="num-display">${save.number}</span>
              <button class="btn icon-btn" id="num-plus" type="button" aria-label="Raise number">+</button>
            </div>
            <h3>Team name</h3>
            <div class="chip-grid">${TEAM_NAMES.map((n) => `<button class="pick ${save.team.name === n ? "on" : ""}" data-name="${esc(n)}" type="button">${esc(n)}</button>`).join("")}</div>
            <h3>Team colors</h3>
            <div class="swatch-grid">${TEAM_COLORS.map((c) => `<button class="swatch ${save.team.colors === c.id ? "on" : ""}" data-color="${c.id}" type="button" aria-label="${esc(c.name)}" style="--p:${c.primary};--s:${c.secondary}"><i></i></button>`).join("")}</div>
            <h3>Helmets</h3>
            <div class="shop-grid">${HELMETS.map((h) => {
              const owned = save.owned.helmets.includes(h.id);
              const on = save.team.helmet === h.id;
              return `<button class="shop-item ${on ? "on" : ""} ${owned ? "owned" : ""}" data-helmet="${h.id}" type="button">
                ${helmetSVG({ primary: colors.primary, secondary: colors.secondary, style: h.style, size: 64 })}
                <span>${esc(h.name)}</span>
                ${owned ? (on ? `<small class="tag">${ICON.check} Wearing</small>` : `<small class="tag">Owned</small>`) : `<small class="price">${ICON.coin} ${h.cost}</small>`}
              </button>`;
            }).join("")}</div>
            <h3>Touchdown celebration</h3>
            <div class="shop-grid">${CELEBRATIONS.map((c) => {
              const owned = save.owned.celebrations.includes(c.id);
              const on = save.team.celebration === c.id;
              return `<button class="shop-item ${on ? "on" : ""} ${owned ? "owned" : ""}" data-celeb="${c.id}" type="button">
                <span class="celeb-emoji">${c.emoji}</span><span>${esc(c.name)}</span>
                ${owned ? (on ? `<small class="tag">${ICON.check} Picked</small>` : `<small class="tag">Owned</small>`) : `<small class="price">${ICON.coin} ${c.cost}</small>`}
              </button>`;
            }).join("")}</div>
          </div>
        </div>
      </section>
    `;

    app.querySelector("#mute-slot").appendChild(muteButton(save, onToggleMute));
    app.querySelector("#back").onclick = () => { sfx("tap"); onBack(); };
    app.querySelector("#num-minus").onclick = () => { save.number = save.number <= 1 ? 99 : save.number - 1; sfx("tap"); persist(); draw(); };
    app.querySelector("#num-plus").onclick = () => { save.number = save.number >= 99 ? 1 : save.number + 1; sfx("tap"); persist(); draw(); };
    app.querySelectorAll(".pick").forEach((b) => { b.onclick = () => { save.team.name = b.dataset.name; sfx("tap"); say(b.dataset.name); persist(); draw(); }; });
    app.querySelectorAll(".swatch").forEach((b) => { b.onclick = () => { save.team.colors = b.dataset.color; sfx("tap"); persist(); draw(); }; });
    app.querySelectorAll("[data-helmet]").forEach((b) => {
      b.onclick = () => {
        const h = HELMETS.find((x) => x.id === b.dataset.helmet);
        if (save.owned.helmets.includes(h.id)) { save.team.helmet = h.id; sfx("tap"); }
        else if (save.coins >= h.cost) { save.coins -= h.cost; save.owned.helmets.push(h.id); save.team.helmet = h.id; sfx("coins"); say(`You got the ${h.name} helmet!`); }
        else {
          sfx("wrong");
          b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
          toast(`Need ${h.cost - save.coins} more coins — win games to earn coins!`, "warn");
          say(`You need ${h.cost - save.coins} more coins. Win games to earn coins!`);
          return;
        }
        persist(); draw();
      };
    });
    app.querySelectorAll("[data-celeb]").forEach((b) => {
      b.onclick = () => {
        const c = CELEBRATIONS.find((x) => x.id === b.dataset.celeb);
        if (save.owned.celebrations.includes(c.id)) { save.team.celebration = c.id; sfx("tap"); }
        else if (save.coins >= c.cost) { save.coins -= c.cost; save.owned.celebrations.push(c.id); save.team.celebration = c.id; sfx("coins"); say(`${c.name} unlocked!`); }
        else {
          sfx("wrong");
          b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
          toast(`Need ${c.cost - save.coins} more coins — win games to earn coins!`, "warn");
          say(`You need ${c.cost - save.coins} more coins.`);
          return;
        }
        persist(); draw();
      };
    });
  }
  draw();
}
