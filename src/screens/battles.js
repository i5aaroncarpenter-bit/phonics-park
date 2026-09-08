/** The Campaign map — choose a battle. */

import { el, button, topbar, coinPill, valorPill, toast } from "../ui.js";
import { BATTLES, ARENA } from "../data/battles.js";
import { getVerse } from "../data/verses.js";
import { gearById, heroStats } from "../data/gear.js";
import { valor, battleUnlocked, arenaUnlocked, isMastered } from "../engine/progress.js";
import { sfx, startMusic } from "../audio.js";

export function renderBattles(app, ctx) {
  const { save, profile } = ctx;
  const settings = save.settings;
  const v = valor(profile);
  const stats = heroStats(profile);
  startMusic("camp");

  const wrap = el("div", { class: "screen battles" });
  wrap.append(topbar({ title: "The Campaign", sub: `Power ${stats.power} · Valor ${v}`, onBack: ctx.onBack, right: [valorPill(v), coinPill(profile)] }));
  wrap.append(el("p", { class: "small muted center", text: "Every attack is a verse question. The more verses you master, the more battles you unlock." }));

  const list = el("div", { class: "battle-list" });
  BATTLES.forEach((b, i) => {
    const unlocked = battleUnlocked(profile, b);
    const rec = profile.battles[b.id];
    const won = (rec?.won || 0) > 0;
    const kv = getVerse(b.keyVerse, settings);
    const cryReady = kv && isMastered(profile, kv.id);
    const drop = b.drop ? gearById.get(b.drop) : null;
    const need = b.enemies.reduce((a, e) => a + e.hp, 0) / 4 + b.enemies[b.enemies.length - 1].atk * 3;
    const danger = stats.power >= need ? "" : stats.power >= need * 0.7 ? "risky" : "dangerous";

    const card = el("div", { class: `battle-card ${unlocked ? "" : "locked"} ${won ? "won" : ""} ${b.boss ? "boss" : ""}` });
    card.append(el("div", { class: "battle-num", text: b.boss ? "👑" : String(i + 1) }));
    const info = el("div", { class: "battle-info" });
    info.append(el("b", { class: "battle-name", text: b.name }));
    info.append(el("div", { class: "small muted", text: `${b.place} · ${b.ref}` }));
    if (unlocked) {
      const meta = el("div", { class: "battle-meta" });
      meta.append(el("span", { class: "chip", text: `${b.enemies.length} ${b.enemies.length === 1 ? "foe" : "foes"}` }));
      meta.append(el("span", { class: `chip ${cryReady ? "good" : ""}`, text: cryReady ? `⚡ Battle Cry ready` : `Battle verse: ${kv?.ref || "?"}` }));
      if (drop) meta.append(el("span", { class: `chip ${profile.owned.includes(drop.id) ? "good" : "gold"}`, text: `${profile.owned.includes(drop.id) ? "✔" : "🎁"} ${drop.name}` }));
      meta.append(el("span", { class: "chip", text: `🪙 ${won ? Math.round(b.shekels / 2) : b.shekels}` }));
      if (danger) meta.append(el("span", { class: `chip ${danger}`, text: danger === "risky" ? "⚠ Risky" : "☠ Dangerous" }));
      if (won) meta.append(el("span", { class: "chip good", text: `Won ×${rec.won}` }));
      info.append(meta);
    } else {
      info.append(el("div", { class: "lock-line", text: `🔒 Master ${b.valor - v} more verse${b.valor - v === 1 ? "" : "s"} (Valor ${b.valor})` }));
    }
    card.append(info);
    const act = el("div", { class: "battle-act" });
    if (unlocked) act.append(button(won ? "Fight again" : "To arms!", () => { sfx("drum"); ctx.onFight(b); }, `btn ${won ? "" : "btn-gold"}`));
    else act.append(button("📜 Scrolls", () => ctx.onScrolls(), "btn"));
    card.append(act);
    list.append(card);
  });

  // Arena
  const arenaOpen = arenaUnlocked(profile);
  const arena = el("div", { class: `battle-card arena ${arenaOpen ? "" : "locked"}` });
  arena.append(el("div", { class: "battle-num", text: "🏟️" }));
  arena.append(el("div", { class: "battle-info" }, el("b", { class: "battle-name", text: ARENA.name }), el("div", { class: "small muted", text: ARENA.description }), el("div", { class: "small", text: arenaOpen ? `Best wave: ${profile.arenaBest}` : "🔒 Defeat Goliath to enter" })));
  arena.append(el("div", { class: "battle-act" }, arenaOpen ? button("Enter", () => { sfx("drum"); ctx.onArena(); }, "btn btn-primary") : null));
  list.append(arena);

  wrap.append(list);
  app.replaceChildren(wrap);
}
