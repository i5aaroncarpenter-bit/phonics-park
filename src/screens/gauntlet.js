/**
 * The Gauntlet — sixty seconds, every mastered verse in the bag, as many
 * questions as you can answer. Beat your best. Rapid mixed review is the
 * fastest way to keep old swords sharp.
 */

import { el, button, topbar, coinPill, modal, fmt } from "../ui.js";
import { GAUNTLET } from "../data/progress.js";
import { makeQuestion } from "../engine/questions.js";
import { valor, recordGauntlet, checkBadges, bumpOrder, gauntletUnlocked } from "../engine/progress.js";
import { askCard } from "../stages/quiz.js";
import { showReward } from "./reward.js";
import { sfx, startMusic } from "../audio.js";
import { confetti, sparks } from "../fx.js";

export function renderGauntlet(app, ctx) {
  const { save, profile, onDone } = ctx;
  const settings = save.settings;
  let alive = true;
  let running = false;
  let correct = 0;
  let asked = 0;
  let streak = 0;
  let bestStreak = 0;
  let endAt = 0;
  let lastVerse = null;
  let raf = 0;

  const wrap = el("div", { class: "screen gauntlet" });
  const header = topbar({ title: "The Gauntlet", sub: `Best: ${profile.stats.gauntletBest || 0}`, onBack: () => quit(), right: [coinPill(profile)] });
  const hud = el("div", { class: "gauntlet-hud" });
  const clock = el("div", { class: "g-clock", text: `${GAUNTLET.seconds}` });
  const scoreEl = el("div", { class: "g-score" }, el("b", { text: "0" }), el("span", { class: "small", text: "right" }));
  const streakEl = el("div", { class: "g-streak", text: "" });
  hud.append(clock, scoreEl, streakEl);
  const qbox = el("div", { class: "qbox gauntlet-qbox" });
  wrap.append(header, hud, qbox);
  app.replaceChildren(wrap);
  startMusic("battle");

  if (!gauntletUnlocked(profile)) {
    qbox.append(el("div", { class: "handoff" }, el("h3", { text: "The Gauntlet is barred" }), el("p", { text: `Master ${GAUNTLET.minValor - valor(profile)} more verse${GAUNTLET.minValor - valor(profile) === 1 ? "" : "s"} so there is enough to ask about.` }), button("Back ➜", () => onDone(), "btn btn-gold")));
    return () => { alive = false; };
  }

  qbox.append(
    el("div", { class: "handoff" },
      el("h3", { text: "Ready, warrior?" }),
      el("p", { text: `${GAUNTLET.seconds} seconds. Questions from all ${valor(profile)} of your mastered verses. Every right answer pays ${GAUNTLET.perCorrect} shekels; a new best pays ${GAUNTLET.newBest} more.` }),
      el("p", { class: "small muted", text: "Wrong answers cost you 3 seconds. Five in a row earns a streak bonus." }),
      button("Run the Gauntlet ⏱️", () => start(), "btn btn-gold btn-big")),
  );

  function quit() {
    if (!running) { alive = false; return onDone(); }
    modal({ title: "Leave the Gauntlet?", body: "This run will not count.", buttons: [{ id: "stay", label: "Keep going", cls: "btn btn-gold" }, { id: "leave", label: "Leave", cls: "btn" }] }).then((r) => {
      if (r !== "leave") return;
      alive = false;
      running = false;
      cancelAnimationFrame(raf);
      onDone();
    });
  }

  function tick() {
    if (!running) return;
    const left = Math.max(0, endAt - performance.now());
    clock.textContent = String(Math.ceil(left / 1000));
    clock.classList.toggle("urgent", left < 10000);
    if (left <= 0) return finish();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    sfx("drum");
    running = true;
    endAt = performance.now() + GAUNTLET.seconds * 1000;
    tick();
    next();
  }

  async function next() {
    if (!running || !alive) return;
    const q = makeQuestion(profile, settings, { avoid: lastVerse });
    lastVerse = q.verse.id;
    asked += 1;
    const res = await askCard(qbox, q, { seconds: Math.max(2, Math.min(10, (endAt - performance.now()) / 1000)) });
    if (!running || !alive) return;
    if (res.ok) {
      correct += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      scoreEl.querySelector("b").textContent = String(correct);
      sparks(scoreEl, 6);
      streakEl.textContent = streak >= 3 ? `🔥 ${streak} in a row` : "";
      if (streak === 5) sfx("crit");
    } else {
      streak = 0;
      streakEl.textContent = "";
      endAt -= 3000;
      clock.classList.add("hit");
      setTimeout(() => clock.classList.remove("hit"), 400);
    }
    next();
  }

  async function finish() {
    running = false;
    cancelAnimationFrame(raf);
    clock.textContent = "0";
    const out = recordGauntlet(profile, { correct, bestStreak });
    if (bumpOrder(profile, "gauntlet")) sfx("good");
    const badges = checkBadges(profile, settings);
    ctx.persist();
    header.querySelector(".topbar-right").replaceChildren(coinPill(profile));
    sfx(out.newBest ? "victory" : "fanfare");
    if (out.newBest) confetti(120);
    qbox.replaceChildren(
      el("div", { class: "duel-result" },
        el("h2", { class: "reward-title", text: out.newBest ? "NEW BEST!" : "Time!" }),
        el("div", { class: "g-final", text: `${correct}` }),
        el("p", { text: `${correct} of ${asked} right · best streak ${bestStreak}${out.prevBest ? ` · previous best ${out.prevBest}` : ""}` }),
        el("p", { class: "gold", text: `+${fmt(out.shekels)} 🪙 · +${out.xp} XP` }),
        el("div", { class: "row center" },
          button("Run again ⏱️", () => renderGauntlet(app, ctx), "btn btn-gold"),
          button("Back to camp ➜", () => onDone(), "btn")),
      ),
    );
    if (out.rankUp || badges.length) await showReward({ title: "Well run!", shekels: 0, xp: 0, rankUp: out.rankUp, badges });
  }

  return () => {
    alive = false;
    running = false;
    cancelAnimationFrame(raf);
  };
}
