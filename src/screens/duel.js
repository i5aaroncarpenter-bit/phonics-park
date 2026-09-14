/**
 * Sibling Duel — two warriors, one device. They take turns answering
 * questions drawn from the verses each of them has mastered, so a younger
 * child is never quizzed on a verse only the older one knows. Points for
 * right answers, extra for quick ones. "Iron sharpens iron" (Proverbs 27:17).
 */

import { el, button, topbar, modal, fmt } from "../ui.js";
import { heroSVG } from "../hero.js";
import { heroStats } from "../data/gear.js";
import { DUEL } from "../data/progress.js";
import { makeQuestion } from "../engine/questions.js";
import { valor, recordDuel, checkBadges, bumpOrder } from "../engine/progress.js";
import { askCard } from "../stages/quiz.js";
import { showReward } from "./reward.js";
import { sfx, startMusic } from "../audio.js";
import { confetti, burst } from "../fx.js";

export function renderDuel(app, ctx) {
  const { save, profile, rival, onDone } = ctx;
  const settings = save.settings;
  const players = [profile, rival];
  const score = [0, 0];
  const answered = [0, 0];
  let round = 0;
  let turn = 0;
  let alive = true;
  let lastVerse = [null, null];

  const wrap = el("div", { class: "screen duel" });
  const header = topbar({ title: "Sibling Duel", sub: "Iron sharpens iron", onBack: () => quit() });
  wrap.append(header);
  const arena = el("div", { class: "duel-arena" });
  const sides = players.map((p, i) => el("div", { class: `duel-side ${i === 1 ? "rival" : ""}` }, el("div", { class: "duel-fig" }, heroSVG(p, { size: 130 })), el("b", { class: "duel-name", text: p.name }), el("div", { class: "duel-score", text: "0" })));
  arena.append(sides[0], el("div", { class: "duel-vs", text: "VS" }), sides[1]);
  const status = el("div", { class: "duel-status" });
  const qbox = el("div", { class: "qbox duel-qbox" });
  wrap.append(arena, status, qbox);
  app.replaceChildren(wrap);
  startMusic("battle");

  function quit() {
    if (!alive) return;
    modal({ title: "Stop the duel?", body: "No shekels are paid for a duel left unfinished.", buttons: [{ id: "stay", label: "Keep dueling", cls: "btn btn-gold" }, { id: "leave", label: "Stop", cls: "btn" }] }).then((r) => {
      if (r !== "leave") return;
      alive = false;
      onDone();
    });
  }

  function updateBoard() {
    players.forEach((p, i) => {
      sides[i].querySelector(".duel-score").textContent = String(score[i]);
      sides[i].classList.toggle("active", i === turn && round < DUEL.rounds);
    });
  }

  async function handoff(i) {
    const p = players[i];
    updateBoard();
    status.textContent = `Round ${round + 1} of ${DUEL.rounds}`;
    qbox.replaceChildren(
      el("div", { class: "handoff" },
        heroSVG(p, { size: 110 }),
        el("h3", { text: `${p.name}, your turn!` }),
        el("p", { class: "small muted", text: `Pass the device to ${p.name}. Tap when ready.` }),
        button("I'm ready ⚔️", () => { sfx("drum"); ask(i); }, "btn btn-gold btn-big")),
    );
  }

  async function ask(i) {
    const p = players[i];
    const q = makeQuestion(p, settings, { avoid: lastVerse[i] });
    lastVerse[i] = q.verse.id;
    const seconds = 8 + heroStats(p).speed;
    const res = await askCard(qbox, q, { seconds, label: `${p.name} answers` });
    if (!alive) return;
    answered[i] += 1;
    if (res.ok) {
      const pts = 10 + Math.round((res.remaining / seconds) * 5);
      score[i] += pts;
      burst(sides[i], { n: 14 });
      status.textContent = `${p.name}: +${pts}${res.fast ? " (quick!)" : ""}`;
    } else status.textContent = res.timedOut ? `${p.name} ran out of time.` : `${p.name} missed that one.`;
    updateBoard();
    // Alternate turns; a round is complete once both have answered.
    if (answered[0] === answered[1]) round += 1;
    turn = 1 - turn;
    if (round >= DUEL.rounds) return finish();
    setTimeout(() => alive && handoff(turn), 700);
  }

  async function finish() {
    updateBoard();
    const [a, b] = score;
    const result = a === b ? "draw" : a > b ? [0, 1] : [1, 0];
    const gains = [];
    if (result === "draw") {
      gains.push(recordDuel(players[0], "draw"), recordDuel(players[1], "draw"));
    } else {
      const [w, l] = result;
      gains[w] = recordDuel(players[w], "win");
      gains[l] = recordDuel(players[l], "lose");
      sides[w].classList.add("winner");
    }
    for (const p of players) if (bumpOrder(p, "battle")) status.textContent = "Order progress: battle!";
    const badges = players.map((p) => checkBadges(p, settings));
    ctx.persist();
    sfx("victory");
    confetti(100);
    const winner = result === "draw" ? null : players[result[0]];
    qbox.replaceChildren(
      el("div", { class: "duel-result" },
        el("h2", { class: "reward-title", text: winner ? `${winner.name} wins!` : "A draw!" }),
        el("p", { text: winner ? `${a} to ${b}. ${players[result[1]].name} fought well and still earns shekels.` : `${a} to ${b}. Two sharp swords.` }),
        el("div", { class: "duel-payout" },
          ...players.map((p, i) => el("div", { class: "duel-pay" }, heroSVG(p, { size: 70 }), el("b", { text: p.name }), el("span", { class: "gold", text: `+${fmt(gains[i].shekels)} 🪙 · +${gains[i].xp} XP` }), ...badges[i].map((bd) => el("span", { class: "small", text: `🎖️ ${bd.name}` })))),
        ),
        el("p", { class: "small muted", text: "\"Iron sharpens iron; so a man sharpens his friend's countenance.\" — Proverbs 27:17" }),
        button("Back to camp ➜", () => onDone(), "btn btn-gold btn-big")),
    );
    for (let i = 0; i < 2; i++) if (gains[i].rankUp) await showReward({ title: `${players[i].name} promoted!`, shekels: 0, xp: 0, rankUp: gains[i].rankUp, badges: [] });
  }

  // Coin toss: the challenger goes second so the guest gets first swing.
  turn = 1;
  handoff(turn);

  return () => {
    alive = false;
  };
}

/** Pick an opponent. Resolves the rival profile or null. */
export async function chooseRival(save, profile) {
  const rivals = save.profiles.filter((p) => p.id !== profile.id);
  if (!rivals.length) {
    await modal({ title: "No one to duel yet", body: "Create a second warrior on the title screen — a brother, sister, or friend — and challenge them here.", buttons: [{ id: "ok", label: "OK", cls: "btn btn-gold" }] });
    return null;
  }
  if (valor(profile) < 1) {
    await modal({ title: "Master a verse first", body: "Duel questions come from the verses each warrior has mastered. Forge at least one sword before you challenge anyone.", buttons: [{ id: "ok", label: "OK", cls: "btn btn-gold" }] });
    return null;
  }
  return new Promise((resolve) => {
    const list = el("div", { class: "rival-list" });
    let overlayDone = false;
    const finish = (r) => {
      if (overlayDone) return;
      overlayDone = true;
      document.querySelector(".modal-overlay")?.remove();
      resolve(r);
    };
    for (const r of rivals) {
      const ready = valor(r) >= 1;
      const card = button("", () => { if (ready) finish(r); }, `rival-card ${ready ? "" : "locked"}`);
      card.append(heroSVG(r, { size: 80 }), el("div", { class: "rival-info" }, el("b", { text: r.name }), el("div", { class: "small muted", text: ready ? `⚔️ ${valor(r)} verses · 🤺 ${r.stats.duelWins} duel wins` : "Needs to master a verse first" })));
      list.append(card);
    }
    modal({ title: "🤺 Who do you challenge?", body: el("div", {}, el("p", { class: "small muted", text: `${DUEL.rounds} rounds each. Everyone is asked about their own verses. Winner +${DUEL.win.shekels} 🪙, the other +${DUEL.lose.shekels} 🪙.` }), list), buttons: [{ id: "cancel", label: "Not now", cls: "btn" }] }).then(() => finish(null));
  });
}
