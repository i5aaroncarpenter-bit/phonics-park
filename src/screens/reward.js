/** The reward pop-up shown after stages, sharpening and battles. */

import { el, button, fmt } from "../ui.js";
import { sfx } from "../audio.js";
import { coins, confetti } from "../fx.js";
import { gearById } from "../data/gear.js";
import { BATTLES } from "../data/battles.js";

/**
 * items: { shekels, xp, perfect, mastered, valor, rankUp, badges:[], drop, unlocked:[battle], sharpness, title, subtitle }
 * Resolves when the child taps continue.
 */
export function showReward(items) {
  return new Promise((resolve) => {
    const overlay = el("div", { class: "modal-overlay reward-overlay" });
    const box = el("div", { class: "modal reward" });
    box.append(el("h2", { class: "reward-title", text: items.title || "Well done!" }));
    if (items.subtitle) box.append(el("p", { class: "reward-sub", text: items.subtitle }));

    const rows = el("div", { class: "reward-rows" });
    const coinRow = el("div", { class: "reward-row coin-row" }, el("span", { class: "big-ico", text: "🪙" }), el("b", { text: `+${fmt(items.shekels || 0)} shekels` }));
    rows.append(coinRow);
    rows.append(el("div", { class: "reward-row" }, el("span", { class: "big-ico", text: "⭐" }), el("b", { text: `+${fmt(items.xp || 0)} XP` })));
    if (items.perfect) rows.append(el("div", { class: "reward-row perfect" }, el("span", { class: "big-ico", text: "✨" }), el("b", { text: "Perfect bonus!" })));
    if (items.mastered) rows.append(el("div", { class: "reward-row mastered" }, el("span", { class: "big-ico", text: "⚔️" }), el("b", { text: `Verse mastered! Valor is now ${items.valor}` })));
    if (items.sharpness) rows.append(el("div", { class: "reward-row" }, el("span", { class: "big-ico", text: "✨" }), el("b", { text: `Sword sharpened to ${items.sharpness} star${items.sharpness === 1 ? "" : "s"}` })));
    if (items.drop) {
      const g = gearById.get(items.drop);
      if (g) rows.append(el("div", { class: "reward-row drop" }, el("span", { class: "big-ico", text: "🎁" }), el("div", {}, el("b", { text: `Relic won: ${g.name}` }), el("div", { class: "small", text: g.flavor }))));
    }
    if (items.rankUp) rows.append(el("div", { class: "reward-row rank" }, el("span", { class: "big-ico", text: items.rankUp.icon }), el("b", { text: `Promoted to ${items.rankUp.name}!` })));
    for (const b of items.badges || []) rows.append(el("div", { class: "reward-row badge" }, el("span", { class: "big-ico", text: b.icon }), el("div", {}, el("b", { text: `Badge: ${b.name}` }), el("div", { class: "small", text: b.desc }))));
    for (const bt of items.unlocked || []) rows.append(el("div", { class: "reward-row unlock" }, el("span", { class: "big-ico", text: "🔓" }), el("b", { text: `Battle unlocked: ${bt.name}` })));
    box.append(rows);

    const extra = el("div", { class: "reward-extra" });
    box.append(extra);
    if (items.extraButtons) for (const b of items.extraButtons) extra.append(button(b.label, () => { overlay.remove(); resolve(b.id); }, b.cls || "btn"));

    box.append(button(items.continueLabel || "Continue ➜", () => { overlay.remove(); resolve("continue"); }, "btn btn-gold btn-big"));
    overlay.append(box);
    document.body.append(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add("show");
      sfx(items.mastered || items.drop ? "victory" : "coins");
      coins(coinRow, Math.min(24, 6 + Math.round((items.shekels || 0) / 6)));
      if (items.mastered || items.rankUp || items.drop) confetti(80);
      if (items.rankUp) setTimeout(() => sfx("levelup"), 700);
    });
  });
}

/** Battles that just became available thanks to new valor. */
export function newlyUnlocked(prevValor, valor) {
  return BATTLES.filter((b) => b.valor > prevValor && b.valor <= valor);
}
