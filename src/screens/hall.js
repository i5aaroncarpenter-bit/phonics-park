/** Hall of Valor — badges, relics collected, and the family leaderboard. */

import { el, topbar, coinPill, valorPill, fmt } from "../ui.js";
import { heroSVG } from "../hero.js";
import { BADGES, rankFor, rankTitle } from "../data/progress.js";
import { RELIC_SET, gearById } from "../data/gear.js";
import { BATTLES } from "../data/battles.js";
import { valor } from "../engine/progress.js";

export function renderHall(app, ctx) {
  const { save, profile } = ctx;
  const wrap = el("div", { class: "screen hall" });
  wrap.append(topbar({ title: "Hall of Valor", sub: "Deeds worth remembering", onBack: ctx.onBack, right: [valorPill(valor(profile)), coinPill(profile)] }));

  // Family leaderboard
  wrap.append(el("h3", { class: "section-title", text: "🏅 The Roll of the Mighty" }));
  const board = el("div", { class: "board" });
  const sorted = save.profiles.slice().sort((a, b) => valor(b) - valor(a) || b.xp - a.xp);
  sorted.forEach((p, i) => {
    const r = rankFor(p.xp);
    board.append(
      el("div", { class: `board-row ${p.id === profile.id ? "me" : ""}` }, el("span", { class: "board-pos", text: i === 0 ? "👑" : `#${i + 1}` }), heroSVG(p, { size: 64 }), el("div", { class: "board-info" }, el("b", { text: p.name }), el("div", { class: "small muted", text: `${r.icon} ${rankTitle(r, p)}` })),
        el("div", { class: "board-nums" }, num(valor(p), "verses"), num(p.stats.battlesWon, "battles"), num(p.stats.duelWins || 0, "duels"), num(p.stats.gauntletBest || 0, "gauntlet"), num(`🔥${p.streak.count}`, "streak"))),
    );
  });
  wrap.append(board);

  // Relics
  wrap.append(el("h3", { class: "section-title", text: "🏆 The Whole Armor of God" }));
  const relics = el("div", { class: "relic-row" });
  for (const id of RELIC_SET) {
    const g = gearById.get(id);
    const have = profile.owned.includes(id);
    const from = BATTLES.find((b) => b.drop === id);
    relics.append(el("div", { class: `relic ${have ? "have" : ""}` }, el("div", { class: "relic-ico", text: have ? "✦" : "🔒" }), el("b", { text: g.name }), el("div", { class: "small muted", text: have ? "Collected" : `Win: ${from?.name || "?"}` })));
  }
  wrap.append(relics);

  // Badges
  wrap.append(el("h3", { class: "section-title", text: `🎖️ Badges · ${profile.badges.length}/${BADGES.length}` }));
  const grid = el("div", { class: "badge-grid" });
  for (const b of BADGES) {
    const have = profile.badges.includes(b.id);
    grid.append(el("div", { class: `badge-card ${have ? "have" : ""}` }, el("div", { class: "badge-ico", text: have ? b.icon : "🔒" }), el("b", { text: b.name }), el("div", { class: "small muted", text: b.desc })));
  }
  wrap.append(grid);

  // Lifetime stats
  const s = profile.stats;
  wrap.append(el("h3", { class: "section-title", text: "📈 Campaign Record" }));
  wrap.append(
    el("div", { class: "record" },
      rec("Forge stages", s.stagesDone), rec("Swords sharpened", s.sharpenDone), rec("Battles won", s.battlesWon),
      rec("Flawless blades", s.perfectBlades), rec("Recited aloud", s.recited), rec("Shekels earned", fmt(s.shekelsEarned)),
      rec("Best arena wave", profile.arenaBest), rec("Orders completed", profile.orders.completedCount || 0),
      rec("Spoken word-perfect", s.spoken || 0), rec("Best Gauntlet", s.gauntletBest || 0), rec("Duels won", `${s.duelWins || 0} / ${s.duelsPlayed || 0}`)),
  );
  app.replaceChildren(wrap);

  function num(val, label) {
    return el("div", { class: "board-num" }, el("b", { text: String(val) }), el("div", { class: "small muted", text: label }));
  }
  function rec(label, val) {
    return el("div", { class: "rec" }, el("b", { text: String(val) }), el("span", { class: "small muted", text: label }));
  }
}
