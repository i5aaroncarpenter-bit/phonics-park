/** Sticker Book — every sticker is a word to hear (and sound out when decodable). */

import { STICKERS } from "../rookie/data.js";
import { esc, ICON, muteButton } from "../ui.js";
import { sfx } from "../audio.js";
import { say, stretchWord } from "../speech.js";
import { ALL_WORDS } from "../curriculum.js";
import { speakSticker } from "../rewards.js";

export function renderStickers(app, { save, onBack, onToggleMute }) {
  const packs = [...new Set(STICKERS.map((s) => s.pack))];
  app.innerHTML = `
    <section class="screen sticker-screen">
      <header class="topbar">
        <button class="btn icon-btn" id="back" type="button" aria-label="Back">${ICON.back}</button>
        <h2>🎟️ Sticker Book</h2>
        <div class="topbar-right"><span class="chip">${save.stickers.length}/${STICKERS.length}</span><span id="mute-slot"></span></div>
      </header>
      <div class="sticker-scroll">
        ${packs.map((p) => `
          <h3 class="pack-title">${esc(p)} <small>${STICKERS.filter((s) => s.pack === p && save.stickers.includes(s.w)).length}/${STICKERS.filter((s) => s.pack === p).length}</small></h3>
          <div class="sticker-grid">
            ${STICKERS.filter((s) => s.pack === p).map((s) => {
              const got = save.stickers.includes(s.w);
              return `<button class="sticker ${got ? "got" : ""}" data-w="${esc(s.w)}" type="button" aria-label="${esc(s.w)}"><span>${got ? s.e : "❔"}</span><b>${got ? esc(s.w) : "?"}</b></button>`;
            }).join("")}
          </div>`).join("")}
        <p class="muted center">Win games and open mystery boxes to collect them all!</p>
      </div>
    </section>
  `;
  app.querySelector("#mute-slot").appendChild(muteButton(save, onToggleMute));
  app.querySelector("#back").onclick = () => { sfx("tap"); onBack(); };
  app.querySelectorAll(".sticker").forEach((b) => {
    b.onclick = () => {
      const s = STICKERS.find((x) => x.w === b.dataset.w);
      b.classList.add("bounce");
      setTimeout(() => b.classList.remove("bounce"), 700);
      if (!save.stickers.includes(s.w)) { sfx("wrong"); say("Not yet! Keep playing to find this one.", { rate: 1 }); return; }
      sfx("tap");
      const item = ALL_WORDS.find((x) => x.word.toLowerCase() === s.w);
      if (item) stretchWord(item); else speakSticker(s);
    };
  });
}
