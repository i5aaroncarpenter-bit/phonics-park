/** The Camp — home base. Hero, rank, Today's Orders, and doors to everything. */

import { el, button, topbar, coinPill, valorPill, progressBar, fmt, toast } from "../ui.js";
import { heroSVG } from "../hero.js";
import { heroStats } from "../data/gear.js";
import { rankFor, nextRank } from "../data/progress.js";
import { BATTLES } from "../data/battles.js";
import { allVerses, getVerse } from "../data/verses.js";
import { valor, dullVerses, ensureOrders, ordersComplete, claimOrders, nextLockedBattle, battleUnlocked, checkBadges, isMastered } from "../engine/progress.js";
import { showReward } from "./reward.js";
import { sfx, startMusic } from "../audio.js";

export function renderCamp(app, ctx) {
  const { save, profile } = ctx;
  const settings = save.settings;
  startMusic("camp");
  const rank = rankFor(profile.xp);
  const next = nextRank(profile.xp);
  const stats = heroStats(profile);
  const v = valor(profile);
  const dull = dullVerses(profile, settings);
  const orders = ensureOrders(profile);

  const wrap = el("div", { class: "screen camp" });
  wrap.append(
    topbar({
      title: "The Camp",
      sub: `Welcome back, ${profile.name}`,
      onBack: ctx.onTitle,
      right: [valorPill(v), coinPill(profile)],
    }),
  );

  // Hero panel
  const hero = el("div", { class: "camp-hero" });
  hero.append(el("div", { class: "hero-stage" }, heroSVG(profile, { size: 250 })));
  const info = el("div", { class: "hero-info" });
  info.append(el("div", { class: "hero-name", text: profile.name }));
  info.append(el("div", { class: "hero-rank", text: `${rank.icon} ${rank.name}` }));
  if (next) {
    info.append(progressBar(profile.xp - rank.xp, next.xp - rank.xp, "xp"));
    info.append(el("div", { class: "small muted", text: `${fmt(next.xp - profile.xp)} XP to ${next.name}` }));
  } else info.append(el("div", { class: "small gold", text: "Highest rank achieved!" }));
  info.append(
    el(
      "div",
      { class: "stat-grid" },
      stat("⚔️", "Attack", stats.atk),
      stat("❤️", "Life", stats.hp),
      stat("🛡️", "Block", stats.block + "%"),
      stat("⛑️", "Armor", stats.armor),
      stat("💥", "Mighty", stats.crit + "%"),
      stat("👟", "Speed", "+" + stats.speed + "s"),
    ),
  );
  info.append(el("div", { class: "power", text: `Power ${stats.power}` }));
  if (profile.streak.count > 1) info.append(el("div", { class: "streak", text: `🔥 ${profile.streak.count} days of valor in a row` }));
  hero.append(info);
  wrap.append(hero);

  // Continue training suggestion
  const inProgress = allVerses(settings).find((x) => (profile.verses[x.id]?.stage || 0) > 0 && !isMastered(profile, x.id));
  const nextBattle = BATTLES.find((b) => battleUnlocked(profile, b) && !(profile.battles[b.id]?.won > 0));
  const locked = nextLockedBattle(profile);

  const doors = el("div", { class: "doors" });
  doors.append(
    door("📜", "The Scrolls", inProgress ? `Continue: ${inProgress.ref}` : "Learn a new verse", () => ctx.onScrolls(), "door-scrolls"),
    door("✨", "Sharpen", dull.length ? `${dull.length} sword${dull.length === 1 ? " needs" : "s need"} sharpening` : v ? "All swords are sharp" : "Master a verse first", () => (dull.length ? ctx.onSharpen(dull[0].verse) : ctx.onScrolls()), `door-sharpen ${dull.length ? "attention" : ""}`),
    door("⚔️", "Battle", nextBattle ? `Ready: ${nextBattle.name}` : locked ? `Master ${locked.valor - v} more verse${locked.valor - v === 1 ? "" : "s"} to unlock ${locked.name}` : "All giants have fallen!", () => ctx.onBattles(), `door-battle ${nextBattle ? "attention" : ""}`),
    door("🛠️", "The Armory", `${fmt(profile.shekels)} shekels to spend`, () => ctx.onArmory(), "door-armory"),
    door("🏛️", "Hall of Valor", `${profile.badges.length} badges earned`, () => ctx.onHall(), "door-hall"),
    door("⛺", "Captain's Tent", "For parents", () => ctx.onTent(), "door-tent"),
  );
  wrap.append(doors);

  // Today's orders
  const panel = el("div", { class: "orders" });
  panel.append(el("h3", { text: "📋 Today's Orders" }));
  const list = el("ul", { class: "orders-list" });
  for (const t of orders.tasks) {
    const done = t.progress >= t.target;
    list.append(el("li", { class: done ? "done" : "" }, el("span", { class: "ord-ico", text: done ? "✅" : t.icon }), el("span", { class: "ord-text", text: t.text }), el("span", { class: "ord-prog", text: `${t.progress}/${t.target}` })));
  }
  panel.append(list);
  const claim = button(orders.claimed ? "Chest claimed ✔" : "Open the chest (+40 🪙)", async () => {
    const g = claimOrders(profile);
    if (!g) return;
    const badges = checkBadges(profile, settings);
    ctx.persist();
    sfx("unlock");
    await showReward({ title: "Orders complete!", subtitle: "A faithful soldier gets a full chest.", shekels: g.shekels, xp: g.xp, rankUp: g.rankUp, badges });
    ctx.refresh();
  }, "btn btn-gold");
  claim.disabled = orders.claimed || !ordersComplete(profile);
  panel.append(claim);
  wrap.append(panel);

  // Battle verse tip
  if (nextBattle) {
    const kv = getVerse(nextBattle.keyVerse, settings);
    if (kv && !isMastered(profile, kv.id)) {
      wrap.append(el("div", { class: "tip" }, el("b", { text: "Captain's tip: " }), `Master ${kv.ref} before ${nextBattle.name} to unlock the Battle Cry.`));
    }
  }

  app.replaceChildren(wrap);

  function stat(ico, label, value) {
    return el("div", { class: "stat" }, el("span", { class: "stat-ico", text: ico }), el("span", { class: "stat-val", text: String(value) }), el("span", { class: "stat-label", text: label }));
  }
  function door(ico, title, sub, onClick, cls = "") {
    return el("button", { class: `door ${cls}`, type: "button", onClick: () => { sfx("page"); onClick(); } }, el("span", { class: "door-ico", text: ico }), el("span", { class: "door-title", text: title }), el("span", { class: "door-sub", text: sub }));
  }
}
