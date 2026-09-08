/** The Armory — spend shekels on gear and outfit the warrior. */

import { el, button, topbar, coinPill, fmt, toast, modal } from "../ui.js";
import { heroSVG } from "../hero.js";
import { GEAR, SLOTS, gearById, heroStats, tierName } from "../data/gear.js";
import { checkBadges } from "../engine/progress.js";
import { BATTLES } from "../data/battles.js";
import { sfx } from "../audio.js";
import { coins, sparks, burst } from "../fx.js";

export function renderArmory(app, ctx) {
  const { save, profile } = ctx;
  let slotId = ctx.slot || "sword";

  const wrap = el("div", { class: "screen armory" });
  const bar = topbar({ title: "The Armory", sub: "Outfit your warrior", onBack: ctx.onBack, right: [coinPill(profile)] });
  wrap.append(bar);
  const stage = el("div", { class: "armory-stage" });
  const tabs = el("div", { class: "slot-tabs" });
  const grid = el("div", { class: "gear-grid" });
  wrap.append(stage, tabs, grid);
  app.replaceChildren(wrap);
  draw();

  function draw() {
    const stats = heroStats(profile);
    stage.replaceChildren(
      el("div", { class: "hero-stage" }, heroSVG(profile, { size: 240 })),
      el(
        "div",
        { class: "armory-stats" },
        el("div", { class: "power", text: `Power ${stats.power}` }),
        statLine("⚔️ Attack", stats.atk),
        statLine("❤️ Life", stats.hp),
        statLine("🛡️ Block", stats.block + "%"),
        statLine("⛑️ Armor", stats.armor),
        statLine("💥 Mighty Blow", stats.crit + "%"),
        statLine("👟 Speed", "+" + stats.speed + "s"),
      ),
    );
    bar.querySelector(".topbar-right").replaceChildren(coinPill(profile));
    tabs.replaceChildren(
      ...SLOTS.map((s) =>
        el("button", { class: `slot-tab ${s.id === slotId ? "on" : ""}`, type: "button", onClick: () => { slotId = s.id; sfx("tap"); draw(); } }, el("span", { text: s.icon }), el("span", { class: "slot-tab-name", text: s.name })),
      ),
    );
    const slot = SLOTS.find((s) => s.id === slotId);
    grid.replaceChildren(el("div", { class: "slot-title" }, el("b", { text: slot.armorOf }), el("span", { class: "small muted", text: ` · ${slot.statName}` })));
    const items = GEAR.filter((g) => g.slot === slotId && g.id !== "staff").sort((a, b) => (a.relic ? 1 : 0) - (b.relic ? 1 : 0) || a.tier - b.tier || a.cost - b.cost);
    for (const g of items) grid.append(gearCard(g));
  }

  function statLine(label, value) {
    return el("div", { class: "stat-line" }, el("span", { text: label }), el("b", { text: String(value) }));
  }

  function gearCard(g) {
    const owned = profile.owned.includes(g.id);
    const equipped = profile.equipped[g.slot] === g.id;
    const canAfford = profile.shekels >= g.cost;
    const card = el("div", { class: `gear-card tier-${g.relic ? "relic" : g.tier} ${owned ? "owned" : ""} ${equipped ? "equipped" : ""}` });
    card.append(el("div", { class: "gear-tier", text: g.relic ? "✦ Relic" : tierName(g) }));
    card.append(el("b", { class: "gear-name", text: g.name }));
    const statText = Object.entries(g.stats || {}).map(([k, v]) => `+${v}${k === "block" || k === "crit" ? "%" : k === "speed" ? "s" : ""} ${statName(k)}`).join(", ");
    card.append(el("div", { class: "gear-stats", text: statText || "Looks magnificent" }));
    card.append(el("p", { class: "gear-flavor", text: g.flavor }));
    const act = el("div", { class: "gear-actions" });
    if (equipped) act.append(el("span", { class: "badge-equipped", text: "Equipped ✔" }));
    else if (owned) act.append(button("Equip", () => equip(g, card), "btn btn-primary"));
    else if (g.relic) {
      const from = BATTLES.find((b) => b.drop === g.id);
      act.append(el("span", { class: "small muted", text: from ? `🔒 Win: ${from.name}` : "🔒 Won in battle" }));
    }
    else {
      const b = button(`Buy · 🪙 ${fmt(g.cost)}`, () => buy(g, card), `btn ${canAfford ? "btn-gold" : ""}`);
      b.disabled = !canAfford;
      act.append(b);
      if (!canAfford) act.append(el("div", { class: "small muted", text: `Need ${fmt(g.cost - profile.shekels)} more` }));
    }
    card.append(act);
    return card;
  }

  async function buy(g, card) {
    if (profile.shekels < g.cost) return;
    const r = await modal({ title: `Buy ${g.name}?`, body: `${fmt(g.cost)} shekels. ${g.flavor}`, buttons: [{ id: "no", label: "Not now", cls: "btn" }, { id: "yes", label: `Buy for 🪙 ${fmt(g.cost)}`, cls: "btn btn-gold" }] });
    if (r !== "yes") return;
    profile.shekels -= g.cost;
    profile.owned.push(g.id);
    profile.equipped[g.slot] = g.id;
    sfx("coins");
    coins(card, 14);
    const badges = checkBadges(profile, save.settings);
    ctx.persist();
    toast(`${g.name} is yours!`, "good");
    for (const b of badges) toast(`Badge earned: ${b.name}`, "good");
    draw();
    sparks(stage, 20);
  }

  function equip(g, card) {
    profile.equipped[g.slot] = g.id;
    sfx("clang");
    burst(card, { n: 12, colors: ["#fff", "#ffd54a"] });
    const badges = checkBadges(profile, save.settings);
    ctx.persist();
    for (const b of badges) toast(`Badge earned: ${b.name}`, "good");
    draw();
  }
}

function statName(k) {
  return { atk: "Attack", block: "Block", armor: "Armor", hp: "Life", crit: "Mighty Blow", speed: "Speed" }[k] || k;
}

export { gearById };
