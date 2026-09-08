/**
 * Reward moments: mystery boxes (stickers + coins), daily gifts, rank-ups.
 */

import { el, esc, ICON } from "./ui.js";
import { createFX } from "./fx.js";
import { sfx } from "./audio.js";
import { say, sayWord } from "./speech.js";
import { STICKERS, pick } from "./rookie/data.js";
import { rankFor, addXp, todayKey, buddyFor } from "./save.js";
import { ALL_WORDS } from "./curriculum.js";

export function unownedStickers(save) {
  return STICKERS.filter((s) => !save.stickers.includes(s.w));
}

/** Give a random new sticker; returns it (or null when the book is full). */
export function grantSticker(save) {
  const left = unownedStickers(save);
  if (!left.length) return null;
  const s = pick(left);
  save.stickers.push(s.w);
  return s;
}

export function speakSticker(s) {
  const item = ALL_WORDS.find((x) => x.word.toLowerCase() === s.w);
  return item ? sayWord(item) : say(s.w, { rate: 0.95 });
}

/**
 * A mystery box the child taps open. Contents: a sticker (if any remain) and
 * coins. Resolves when dismissed.
 */
export function openMysteryBox(app, save, { title = "You earned a Mystery Box!", coins = 30, onDone }) {
  const buddy = buddyFor(save);
  const dlg = el(`
    <div class="modal reward-modal">
      <div class="reward-card">
        <h3>${esc(title)}</h3>
        <button class="mystery-box" id="box" type="button" aria-label="Open the mystery box">🎁</button>
        <p class="reward-hint" id="hint">Tap the box to open it!</p>
        <div class="reward-contents" id="contents" hidden></div>
        <button class="btn btn-go btn-huge" id="ok" type="button" hidden>${ICON.check} Yay!</button>
      </div>
    </div>`);
  app.appendChild(dlg);
  const fx = createFX(dlg);
  sfx("drumroll");
  say(`${buddy.name} found a mystery box! Tap it to open!`, { rate: 1, pitch: 1.1 });
  let opened = false;
  dlg.querySelector("#box").onclick = async () => {
    if (opened) return;
    opened = true;
    const box = dlg.querySelector("#box");
    box.classList.add("open");
    sfx("touchdown");
    const r = dlg.getBoundingClientRect();
    fx.burst(r.width / 2, r.height * 0.4, "touchdown", 90);
    fx.rain(2000);
    const sticker = grantSticker(save);
    save.coins += coins;
    const contents = dlg.querySelector("#contents");
    contents.hidden = false;
    dlg.querySelector("#hint").hidden = true;
    contents.innerHTML = `
      ${sticker ? `<button class="sticker-reveal" id="stk" type="button"><span>${sticker.e}</span><b>${esc(sticker.w)}</b><small>new sticker!</small></button>` : `<div class="sticker-reveal"><span>🌟</span><b>Bonus!</b><small>sticker book complete</small></div>`}
      <div class="coin-reveal">${ICON.coin} <b>+${coins}</b> coins</div>
    `;
    if (sticker) { dlg.querySelector("#stk").onclick = () => { sfx("tap"); speakSticker(sticker); }; }
    await say(sticker ? `A sticker! ${sticker.w}! And ${coins} coins!` : `${coins} coins!`, { rate: 1, pitch: 1.15 });
    dlg.querySelector("#ok").hidden = false;
  };
  dlg.querySelector("#ok").onclick = () => { sfx("tap"); fx.destroy(); dlg.remove(); onDone && onDone(); };
}

/** Daily gift with streak bonus. */
export function openDailyGift(app, save, onDone) {
  const streak = Math.max(1, save.daily.streak || 1);
  save.daily.claimed = todayKey();
  openMysteryBox(app, save, {
    title: streak > 1 ? `Day ${streak} in a row! Daily gift` : "Your daily gift!",
    coins: Math.min(150, 25 * streak),
    onDone,
  });
}

/** Add XP and, on a rank-up, show the celebration. Resolves when done. */
export function awardXp(app, save, amount) {
  return new Promise((resolve) => {
    const up = addXp(save, amount);
    if (!up) { resolve(null); return; }
    const dlg = el(`
      <div class="modal reward-modal">
        <div class="reward-card rank-card">
          <small>RANK UP!</small>
          <span class="rank-emoji">${up.emoji}</span>
          <h3>${esc(up.name)}</h3>
          <p class="reward-hint">You're getting so good at reading!</p>
          <button class="btn btn-go btn-huge" id="ok" type="button">${ICON.check} Awesome</button>
        </div>
      </div>`);
    app.appendChild(dlg);
    const fx = createFX(dlg);
    sfx("win");
    const r = dlg.getBoundingClientRect();
    fx.burst(r.width / 2, r.height * 0.35, "touchdown", 90);
    fx.rain(2500);
    say(`Rank up! You are now a ${up.name}!`, { rate: 1, pitch: 1.15 });
    dlg.querySelector("#ok").onclick = () => { sfx("tap"); fx.destroy(); dlg.remove(); resolve(up); };
  });
}

export function rankBadge(save) {
  const r = rankFor(save.xp);
  return `<span class="rank-badge" title="${esc(r.name)}"><span>${r.emoji}</span><b>${esc(r.name)}</b><i style="width:${Math.round(r.progress * 100)}%"></i></span>`;
}
