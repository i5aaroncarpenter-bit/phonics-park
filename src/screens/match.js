/**
 * The match engine. Runs one game against a stage's opponent: builds the
 * play plan, hands each play to a mini-game, animates the result on the
 * field, keeps score, and reports stats when the clock hits zero.
 */

import { getStage, buildGamePlan, retrySpec, gradeYards } from "../curriculum.js";
import { recordMastery, teamColors, helmetStyle } from "../save.js";
import { createField } from "../field.js";
import { createFX } from "../fx.js";
import { sfx, startMusic, stopMusic, crowd, crowdOff } from "../audio.js";
import { coach, announce, stopSpeech, onCaption } from "../speech.js";
import { ICON, esc, mascotBadge, muteButton, el } from "../ui.js";
import { presentPass } from "../plays/pass.js";
import { presentRush } from "../plays/rush.js";
import { presentKick } from "../plays/kick.js";
import { presentDefense } from "../plays/defense.js";
import { presentReadZone } from "../plays/readzone.js";

const PRESENT = { pass: presentPass, rush: presentRush, kick: presentKick, defense: presentDefense, readzone: presentReadZone };
const START_YARD = 25;
const OPP_GAIN = 34;

export function playMatch(app, { save, persist, stageId, heat = 1, onDone, onQuit, onToggleMute }) {
  const stage = typeof stageId === "object" ? stageId : getStage(stageId);
  const colors = teamColors(save);
  const plan = buildGamePlan(stage, save, heat);
  const queue = [...plan];
  const total = plan.length;

  const G = {
    yard: START_YARD, home: 0, away: 0, oppMeter: 0, playNo: 0, correct: 0, plays: 0,
    streak: 0, bestStreak: 0, touchdowns: 0, fieldGoals: 0, bigPlays: 0, yards: 0, coins: 0,
    missed: [], words: 0, passCorrect: 0, retries: {}, startMs: Date.now(), alive: true, overtime: false, total,
  };

  app.innerHTML = `
    <section class="screen match" style="--home:${colors.primary};--home2:${colors.secondary};--away:${stage.opponent.primary};--away2:${stage.opponent.secondary}">
      <header class="hud">
        <div class="score home">
          <span class="team-dot home-dot"></span>
          <b class="name">${esc(save.team.name)}</b>
          <span class="pts" id="home-pts">0</span>
        </div>
        <div class="hud-mid">
          <div class="qtr" id="qtr">${stage.championship ? "BOWL" : stage.camp ? "CAMP" : "Q1"}</div>
          <div class="play-count" id="playcount">Play 1 of ${total}</div>
        </div>
        <div class="score away">
          <span class="pts" id="away-pts">0</span>
          <b class="name">${esc(stage.opponent.name)}</b>
          ${mascotBadge(stage.opponent, 30)}
        </div>
        <div class="hud-actions" id="hud-actions">
          <button class="btn icon-btn" id="quit" type="button" aria-label="Leave game">${ICON.home}</button>
        </div>
      </header>
      <div class="field-wrap" id="field">
        <canvas class="stadium" id="stadium"></canvas>
        <div class="drive-meter" title="Opponent drive">
          <div class="drive-track"><i id="drive-fill"></i><span class="drive-mascot" id="drive-mascot">${stage.opponent.mascot}</span></div>
          <small>${esc(stage.opponent.name)} drive</small>
        </div>
        <div class="yard-chip" id="yard-chip">${100 - START_YARD} yards to touchdown</div>
        <div class="coin-chip"><span class="coin-ico">${ICON.coin}</span><b id="coins">0</b></div>
        <div class="streak-badge" id="streak" hidden>🔥 ON FIRE</div>
        <div class="coach-bubble" id="coach" hidden><span class="coach-face">🧢</span><span id="coach-text"></span></div>
      </div>
      <div class="play-panel" id="panel"></div>
    </section>
  `;

  const fieldWrap = app.querySelector("#field");
  const panel = app.querySelector("#panel");
  const canvas = app.querySelector("#stadium");
  const fx = createFX(fieldWrap);
  const field = createField(canvas, {
    home: { primary: colors.primary, secondary: colors.secondary, helmet: helmetStyle(save), number: save.number, name: save.team.name },
    away: { primary: stage.opponent.primary, secondary: stage.opponent.secondary, name: stage.opponent.name },
    sky: stage.sky,
    celebration: save.team.celebration,
    onSfx: (n) => sfx(n),
    onStomp: () => { fx.cameraShake(12); sfx("tackle"); },
    onCelebrate: (style) => {
      if (style === "fireworks") {
        const r = fieldWrap.getBoundingClientRect();
        for (let i = 0; i < 5; i++) setTimeout(() => { fx.burst(r.width * (0.2 + Math.random() * 0.6), r.height * (0.15 + Math.random() * 0.3), "touchdown", 50); sfx("kick"); }, 200 + i * 320);
      }
    },
  });
  app.querySelector("#hud-actions").prepend(muteButton(save, onToggleMute));

  let captionTimer = 0;
  onCaption((text, kind) => {
    const b = app.querySelector("#coach");
    if (!b) return;
    b.hidden = false;
    b.classList.toggle("cue", kind === "cue");
    app.querySelector("#coach-text").textContent = text;
    clearTimeout(captionTimer);
    captionTimer = setTimeout(() => { b.hidden = true; }, kind === "cue" ? 1600 : Math.min(9000, 1800 + text.length * 60));
  });

  function hud() {
    app.querySelector("#home-pts").textContent = G.home;
    app.querySelector("#away-pts").textContent = G.away;
    app.querySelector("#playcount").textContent = G.overtime ? "OVERTIME" : `Play ${Math.min(G.playNo + 1, G.total)} of ${G.total}`;
    if (!stage.championship && !stage.camp) app.querySelector("#qtr").textContent = G.overtime ? "OT" : `Q${Math.min(4, Math.floor((G.playNo / G.total) * 4) + 1)}`;
    app.querySelector("#drive-fill").style.width = `${Math.min(100, G.oppMeter)}%`;
    app.querySelector("#drive-mascot").style.left = `${Math.min(100, G.oppMeter)}%`;
    app.querySelector("#yard-chip").textContent = G.yard >= 85 ? `RED ZONE! ${100 - G.yard} yards to go` : `${100 - G.yard} yards to touchdown`;
    app.querySelector("#coins").textContent = G.coins;
    const sb = app.querySelector("#streak");
    sb.hidden = G.streak < 3;
    if (G.streak >= 3) sb.textContent = `🔥 ON FIRE ×${G.streak}`;
  }

  function centerOf() {
    const r = fieldWrap.getBoundingClientRect();
    return { x: r.width / 2, y: r.height * 0.45 };
  }

  function pop(text, cls = "") {
    const c = centerOf();
    fx.pop(text, c.x + (Math.random() - 0.5) * 80, c.y - 20, cls);
  }

  function addCoins(n, why) {
    if (n <= 0) return;
    G.coins += n;
    save.coins += n;
    sfx(n >= 20 ? "coins" : "coin");
    const c = centerOf();
    fx.burst(c.x + 120, c.y - 40, "coin", 10);
    fx.pop(`+${n}`, c.x + 120, c.y - 60, "coin-pop");
  }

  async function touchdown() {
    G.home += 7;
    G.touchdowns += 1;
    save.totals.touchdowns += 1;
    field.setHype(1);
    fx.callout("TOUCHDOWN!", "td", 2200);
    fx.rain(2400);
    const c = centerOf();
    fx.burst(c.x, c.y, "touchdown");
    fx.cameraShake(14);
    announce(`Touchdown, ${save.name}!`);
    addCoins(20, "td");
    hud();
    await wait(1900);
    G.yard = START_YARD;
  }

  async function opponentScores() {
    G.away += 7;
    G.oppMeter -= 100;
    sfx("aww");
    fx.callout(`${stage.opponent.name.toUpperCase()} SCORE`, "opp", 1500);
    hud();
    await wait(1200);
  }

  /** Animate the field for one play result. */
  async function animate(spec, res, gain) {
    const yardBefore = G.yard;
    if (spec.type === "kick") {
      await field.animKick({ good: res.correct });
      return;
    }
    if (spec.type === "defense") {
      await field.animDefense({ sack: res.correct, gain });
      return;
    }
    if (spec.type === "pass") {
      await field.animPass({ gain, complete: res.correct });
      return;
    }
    await field.animRush({ gain, tackled: !res.correct });
    void yardBefore;
  }

  function ctxFor(spec) {
    const tKey = spec.type + ":" + (spec.variant || "");
    const first = !save.tutorials[tKey];
    if (first) { save.tutorials[tKey] = true; persist(); }
    return {
      save, fx, first,
      hints: stage.id <= 4,
      limitMs: spec.limitMs,
    };
  }

  async function runPlay(spec) {
    if (!G.alive) return;
    hud();
    if (spec.type === "pass" && stage.id >= 5 && G.passCorrect >= 2 && G.passCorrect % 2 === 0) spec.hideWord = true;
    await field.huddle(G.yard, spec.type !== "defense");
    field.setHype(0.2);
    const present = PRESENT[spec.type] || presentRush;
    if (window.__pbDebug) { window.__pbSpec = spec; window.__pbSpecN = (window.__pbSpecN || 0) + 1; }
    const res = await present(panel, spec, ctxFor(spec));
    if (!G.alive) return;

    G.plays += 1;
    save.totals.plays += 1;
    recordMastery(save, spec.keys || [], res.correct);
    if (spec.item || spec.sentence) { G.words += 1; save.totals.words += 1; }

    if (res.correct) {
      G.correct += 1;
      save.totals.correct += 1;
      G.streak += 1;
      G.bestStreak = Math.max(G.bestStreak, G.streak);
      const grade = (res.attempts || 1) > 1 ? { yards: 7, tier: "ok", label: "NICE GAIN!" } : gradeYards(res.elapsed, spec.limitMs);
      const onFire = G.streak >= 3;
      if (grade.tier === "big") G.bigPlays += 1;
      panel.classList.add("dim");
      if (spec.type === "kick") {
        G.fieldGoals += 1;
        save.totals.fieldGoals = (save.totals.fieldGoals || 0) + 1;
        await animate(spec, res, 0);
        G.home += 3;
        fx.callout("FIELD GOAL!", "fg", 1500);
        sfx("firstdown");
        addCoins(onFire ? 30 : 15);
        hud();
        await wait(900);
      } else {
        let gain = grade.yards + (onFire ? 5 : 0);
        if (G.streak === 3) { sfx("fire"); fx.callout("ON FIRE!", "fire", 1200); await wait(700); }
        const willScore = G.yard + gain >= 100;
        await animate(spec, res, willScore ? 100 - G.yard + 3 : gain);
        if (willScore) {
          G.yards += 100 - G.yard;
          save.totals.yards += 100 - G.yard;
          await touchdown();
        } else {
          G.yard += gain;
          G.yards += gain;
          save.totals.yards += gain;
          fx.callout(grade.label, grade.tier, 1100);
          pop(`+${gain} yds`, grade.tier === "big" ? "big" : "");
          const c = centerOf();
          fx.burst(c.x, c.y, grade.tier === "big" ? "big" : "good");
          if (grade.tier === "big") { sfx("cheer", { big: true }); fx.cameraShake(6); } else sfx("cheer");
          addCoins((grade.tier === "big" ? 15 : 10) * (onFire ? 2 : 1));
          hud();
          await wait(800);
        }
      }
      if (spec.type === "pass") G.passCorrect += 1;
    } else {
      G.streak = 0;
      if (spec.item) G.missed.push(spec.item.word);
      else if (spec.answer) G.missed.push(spec.answer);
      panel.classList.add("dim");
      await animate(spec, res, 0);
      fx.callout(spec.type === "pass" ? "INCOMPLETE" : spec.type === "kick" ? "NO GOOD" : spec.type === "defense" ? "THEY GOT AWAY" : "TACKLED", "miss", 1100);
      sfx("aww");
      G.oppMeter += OPP_GAIN;
      hud();
      await wait(700);
      if (G.oppMeter >= 100) await opponentScores();
      // Re-drill the missed item a little later in the game.
      const key = spec.item ? spec.item.word : spec.answer;
      if (!G.overtime && (G.retries[key] || 0) < 1) {
        G.retries[key] = (G.retries[key] || 0) + 1;
        queue.splice(Math.min(2, queue.length), 0, retrySpec(spec, stage, save));
        G.total += 1;
      }
    }
    panel.classList.remove("dim");
    persist();
  }

  async function intro() {
    hud();
    await field.huddle(G.yard);
    fx.callout("KICKOFF!", "td", 1400);
    sfx("whistle", { long: true });
    crowd(0.5);
    startMusic("game");
    const firstTime = !save.tutorials["stage:" + stage.id] || stage.camp;
    if (firstTime) {
      save.tutorials["stage:" + stage.id] = true;
      persist();
      await coach(stage.coach);
    } else {
      await coach(stage.championship ? "It's the Phonics Bowl! Let's go!" : `Game time against the ${stage.opponent.name}. Let's play!`);
    }
  }

  async function overtimePlay() {
    G.overtime = true;
    hud();
    fx.callout("OVERTIME!", "fire", 1600);
    sfx("drumroll");
    await coach("It's tied! One more play decides the game. You can do it!");
    const spec = retrySpec(plan[Math.floor(Math.random() * plan.length)], stage, save);
    spec.retry = false;
    spec.limitMs = Math.round(spec.limitMs * 1.15);
    const before = G.home;
    await runPlay(spec);
    if (G.home === before && G.alive) {
      // A correct overtime play that did not score still wins the game.
      if (G.streak > 0) { G.home += 3; fx.callout("GAME WINNER!", "fg", 1500); sfx("firstdown"); hud(); await wait(900); }
      else { G.away += 3; hud(); }
    }
  }

  async function run() {
    await intro();
    while (queue.length && G.alive) {
      const spec = queue.shift();
      await runPlay(spec);
      G.playNo += 1;
    }
    if (!G.alive) return;
    if (G.home === G.away) await overtimePlay();
    if (!G.alive) return;
    sfx("buzzer");
    fx.callout("FINAL", "td", 1400);
    await wait(1200);
    finish();
  }

  function finish() {
    const won = G.home > G.away;
    const acc = G.plays ? G.correct / G.plays : 0;
    const stars = won ? (acc >= 0.92 ? 3 : acc >= 0.75 ? 2 : 1) : 0;
    const stats = {
      stageId: stage.id, stage, won, stars, acc, home: G.home, away: G.away, plays: G.plays, correct: G.correct,
      touchdowns: G.touchdowns, fieldGoals: G.fieldGoals, bigPlays: G.bigPlays, bestStreak: G.bestStreak,
      yards: G.yards, coins: G.coins, words: G.words, missed: [...new Set(G.missed)],
      perfect: G.plays > 0 && G.correct === G.plays, ms: Date.now() - G.startMs,
    };
    cleanup();
    onDone(stats);
  }

  function cleanup() {
    G.alive = false;
    onCaption(null);
    clearTimeout(captionTimer);
    stopSpeech();
    crowdOff();
    stopMusic();
    field.destroy();
    fx.destroy();
  }

  app.querySelector("#quit").onclick = () => {
    const dlg = el(`<div class="modal"><div class="modal-card">
      <h3>Leave the game?</h3><p>Your progress in this game won't be saved.</p>
      <div class="row"><button class="btn" id="stay" type="button">Keep playing</button><button class="btn btn-danger" id="leave" type="button">Leave</button></div>
    </div></div>`);
    dlg.querySelector("#stay").onclick = () => { sfx("tap"); dlg.remove(); };
    dlg.querySelector("#leave").onclick = () => { sfx("tap"); cleanup(); onQuit(); };
    app.appendChild(dlg);
  };

  app._cleanup = cleanup;
  run();
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
