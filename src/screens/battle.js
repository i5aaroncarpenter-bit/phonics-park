/**
 * The Battle. Turn-based: answer a verse question to strike; miss and the
 * enemy gets a free swing. Gear changes the math, the Battle Cry is powered
 * by the battle's own verse, and the story of what really happened is told
 * at the end.
 */

import { el, button, progressBar, modal, toast, pick } from "../ui.js";
import { heroSVG, enemyView } from "../hero.js";
import { heroStats } from "../data/gear.js";
import { SPECIALS, ARENA, arenaWave, arenaReward } from "../data/battles.js";

const ARENA_TITLE = ARENA.name;
import { getVerse, verseText } from "../data/verses.js";
import { isMastered, recordBattleWin, checkBadges, bumpOrder, grant } from "../engine/progress.js";
import { makeQuestion, isCorrect } from "../engine/questions.js";
import { timerBar } from "../stages/common.js";
import { showReward } from "./reward.js";
import { sfx, startMusic } from "../audio.js";
import { sparks, burst, screenShake, confetti, starsBurst } from "../fx.js";
import { speak, stopSpeaking } from "../speech.js";

export function renderBattle(app, ctx) {
  const { save, profile, battle, arena = false } = ctx;
  const settings = save.settings;
  const stats = heroStats(profile);
  const keyVerse = battle ? getVerse(battle.keyVerse, settings) : null;
  const cryReady = !!(keyVerse && isMastered(profile, keyVerse.id));
  let alive = true;

  const state = {
    hp: stats.hp,
    maxHp: stats.hp,
    enemyIndex: 0,
    enemy: null,
    enemyHp: 0,
    enemyAttacks: 0,
    combo: 0,
    turns: 0,
    cryUsed: false,
    roarPenalty: 0,
    rallied: false,
    wave: 1,
    arenaShekels: 0,
    arenaXp: 0,
    lastVerse: null,
  };

  const wrap = el("div", { class: "screen battle" });
  app.replaceChildren(wrap);

  function enemies() {
    return arena ? [arenaWave(state.wave)] : battle.enemies;
  }

  /* ---------- intro ---------- */
  function intro() {
    stopSpeaking();
    startMusic("camp");
    const first = enemies()[0];
    const card = el("div", { class: "battle-intro" });
    card.append(el("div", { class: "intro-kicker", text: arena ? "The Arena" : battle.boss ? "Boss Battle" : "Campaign" }));
    card.append(el("h1", { text: arena ? `Wave ${state.wave}` : battle.name }));
    if (!arena) card.append(el("div", { class: "small muted", text: `${battle.place} · ${battle.ref}` }));
    card.append(el("div", { class: "intro-figures" }, el("div", { class: "hero-stage" }, heroSVG(profile, { size: 200 })), el("div", { class: "vs", text: "VS" }), enemyView(first, { size: 200 })));
    card.append(el("p", { class: "intro-story", text: arena ? `${first.name} enters the ring. The Thirty are watching.` : battle.intro }));
    const foes = el("div", { class: "foes" });
    for (const e of enemies()) foes.append(el("span", { class: "chip", text: `${e.name} · ❤️${e.hp} ⚔️${e.atk}${e.special ? ` · ${SPECIALS[e.special].name}` : ""}` }));
    card.append(foes);
    if (!arena && keyVerse) {
      card.append(el("div", { class: `cry-note ${cryReady ? "ready" : ""}` }, cryReady ? `⚡ Battle Cry ready: "${verseText(keyVerse, settings)}" — ${keyVerse.ref}` : `Master ${keyVerse.ref} to unlock this battle's Battle Cry.`));
    }
    card.append(el("div", { class: "row center" }, button("Retreat", () => leave(), "btn"), button("⚔️ To arms!", () => fight(), "btn btn-gold btn-big")));
    wrap.replaceChildren(card);
  }

  /* ---------- arena view ---------- */
  let ui = {};
  function fight() {
    startMusic("battle");
    state.enemy = enemies()[state.enemyIndex];
    state.enemyHp = state.enemy.hp;
    state.enemyAttacks = 0;
    state.rallied = false;
    state.combo = 0;

    const field = el("div", { class: `field kind-${state.enemy.kind}` });
    const bar = el(
      "div",
      { class: "field-bar" },
      button("‹ Retreat", async () => {
        const r = await modal({ title: "Retreat?", body: arena ? `You keep the ${state.arenaShekels} shekels won so far.` : "No reward for a battle left unfinished. Retreat and train?", buttons: [{ id: "stay", label: "Keep fighting", cls: "btn btn-gold" }, { id: "go", label: "Retreat", cls: "btn" }] });
        if (r === "go") leave();
      }, "btn btn-small"),
      el("span", { class: "field-title", text: arena ? `${ARENA_TITLE} · Wave ${state.wave}` : battle.name }),
      el("span", { class: "chip small", text: `Turn ${state.turns + 1}` }),
    );
    const top = el("div", { class: "field-top" });
    const enemyBox = el("div", { class: "fighter enemy" });
    const enemyBar = progressBar(state.enemyHp, state.enemy.hp, "hp enemy-hp");
    enemyBox.append(el("div", { class: "fighter-name" }, el("b", { text: state.enemy.name }), state.enemy.special ? el("span", { class: "chip small", title: SPECIALS[state.enemy.special].text, text: SPECIALS[state.enemy.special].name }) : null), enemyBar, el("div", { class: "hp-text", text: `${state.enemyHp} / ${state.enemy.hp}` }));
    const enemyFig = enemyView(state.enemy, { size: 210 });
    enemyBox.append(enemyFig);
    top.append(enemyBox);
    const heroBox = el("div", { class: "fighter hero" });
    const heroFig = el("div", { class: "hero-stage" }, heroSVG(profile, { size: 200 }));
    const heroBar = progressBar(state.hp, state.maxHp, "hp hero-hp");
    heroBox.append(heroFig, el("div", { class: "fighter-name" }, el("b", { text: profile.name }), el("span", { class: "chip small", text: `⚔️${stats.atk}` })), heroBar, el("div", { class: "hp-text", text: `${state.hp} / ${state.maxHp}` }));
    top.append(heroBox);
    const log = el("div", { class: "battle-log", text: pick(state.enemy.taunts || ["The enemy approaches!"]) });
    const combo = el("div", { class: "combo" });
    const qbox = el("div", { class: "qbox" });
    field.append(bar, top, log, combo, qbox);
    wrap.replaceChildren(field);
    ui = { field, bar, enemyBox, enemyBar, enemyFig, heroBox, heroFig, heroBar, log, combo, qbox };
    refreshBars();
    setTimeout(turn, 700);
  }

  function refreshBars() {
    ui.enemyBar.querySelector(".bar-fill").style.width = Math.max(0, (state.enemyHp / state.enemy.hp) * 100) + "%";
    ui.enemyBox.querySelector(".hp-text").textContent = `${Math.max(0, state.enemyHp)} / ${state.enemy.hp}`;
    ui.heroBar.querySelector(".bar-fill").style.width = Math.max(0, (state.hp / state.maxHp) * 100) + "%";
    ui.heroBox.querySelector(".hp-text").textContent = `${Math.max(0, state.hp)} / ${state.maxHp}`;
    ui.heroBar.classList.toggle("low", state.hp / state.maxHp < 0.3);
  }

  function say(text, cls = "") {
    ui.log.textContent = text;
    ui.log.className = `battle-log ${cls}`;
  }

  /* ---------- a turn ---------- */
  function turn() {
    if (!alive) return;
    state.turns += 1;
    const chip = ui.bar?.querySelector(".chip");
    if (chip) chip.textContent = `Turn ${state.turns}`;
    const q = makeQuestion(profile, settings, { avoid: state.lastVerse });
    state.lastVerse = q.verse.id;
    askQuestion(q, { seconds: Math.max(4, 8 + stats.speed - state.roarPenalty), cry: false });
    state.roarPenalty = 0;
  }

  function askQuestion(q, { seconds, cry }) {
    let locked = false;
    const box = ui.qbox;
    box.replaceChildren();
    const head = el("div", { class: "q-head" }, el("span", { class: "q-prompt", text: cry ? "⚡ BATTLE CRY! " + q.prompt : q.prompt }), el("span", { class: "q-ref", text: q.kind === "ref" || q.kind === "first" ? "" : q.ref }));
    box.append(head);
    if (q.promptWords.length) {
      const line = el("div", { class: "q-words" });
      for (const w of q.promptWords) {
        if (w.hidden) line.append(el("span", { class: `qw hidden ${w.target ? "target" : ""}`, text: w.target ? "?" : "•" }), " ");
        else if (w.blank) line.append(el("span", { class: "qw blank", text: "____" }), " ");
        else line.append(el("span", { class: "qw", text: w.text }), " ");
      }
      box.append(line);
    }
    const timer = timerBar(seconds, () => answer(null));
    box.append(timer.el);
    const choices = el("div", { class: "choices" });
    for (const o of q.options) choices.append(button(o, () => answer(o), "btn choice"));
    box.append(choices);
    if (!cry && cryReady && !state.cryUsed) {
      box.append(button(`⚡ Battle Cry: ${keyVerse.ref}`, () => { if (locked) return; locked = true; timer.stop(); battleCry(); }, "btn btn-cry"));
    }
    timer.start(seconds);

    function answer(choice) {
      if (locked) return;
      locked = true;
      timer.stop();
      const fast = timer.remaining() > seconds * 0.55;
      const ok = choice !== null && isCorrect(q, choice);
      for (const b of choices.querySelectorAll(".choice")) {
        b.disabled = true;
        if (isCorrect(q, b.textContent)) b.classList.add("right");
        else if (choice !== null && b.textContent === choice) b.classList.add("wrong");
      }
      setTimeout(() => (cry ? resolveCry(ok) : resolveAttack(ok, fast, choice === null)), ok ? 350 : 900);
    }
  }

  function resolveAttack(ok, fast, timedOut) {
    if (!alive) return;
    if (ok) {
      state.combo += 1;
      let dmg = stats.atk;
      let notes = [];
      if (fast) { dmg *= 1.25; notes.push("quick strike"); }
      const crit = Math.random() * 100 < stats.crit;
      if (crit) { dmg *= 2; notes.push("MIGHTY BLOW"); }
      if (state.combo > 0 && state.combo % 3 === 0) { dmg *= 1.5; notes.push(`${state.combo} combo!`); }
      dmg = Math.max(1, Math.round(dmg));
      state.enemyHp -= dmg;
      ui.heroFig.classList.remove("attack");
      void ui.heroFig.offsetWidth;
      ui.heroFig.classList.add("attack");
      ui.enemyFig.classList.remove("hit");
      void ui.enemyFig.offsetWidth;
      ui.enemyFig.classList.add("hit");
      sfx(crit ? "crit" : "slash");
      sparks(ui.enemyFig, crit ? 26 : 12);
      if (crit) screenShake(10);
      floatDamage(ui.enemyFig, `-${dmg}`, crit ? "crit" : "");
      ui.combo.textContent = state.combo >= 2 ? `🔥 ${state.combo} in a row` : "";
      say(`You strike for ${dmg}${notes.length ? " · " + notes.join(" · ") : ""}!`, "good");
      refreshBars();
      if (state.enemyHp <= 0) return setTimeout(enemyDown, 700);
      setTimeout(() => enemyTurn(false), 900);
    } else {
      state.combo = 0;
      ui.combo.textContent = "";
      sfx("whoosh");
      say(timedOut ? "Too slow! Your swing misses." : "Your swing misses!", "bad");
      setTimeout(() => enemyTurn(true), 800);
    }
  }

  function enemyTurn(playerMissed) {
    if (!alive) return;
    const e = state.enemy;
    state.enemyAttacks += 1;
    // Rally: heal once when badly hurt
    if (e.special === "rally" && !state.rallied && state.enemyHp < e.hp * 0.3) {
      state.rallied = true;
      state.enemyHp = Math.min(e.hp, state.enemyHp + Math.round(e.hp * 0.25));
      refreshBars();
      say(`${e.name} rallies and recovers!`, "warn");
      sfx("roar");
      return setTimeout(turn, 1100);
    }
    if (e.special === "roar" && state.enemyAttacks % 3 === 0) {
      state.roarPenalty = 2;
      say(`${e.name} ROARS! Your next answer must be faster.`, "warn");
      sfx("roar");
      screenShake(8);
      return setTimeout(turn, 1200);
    }
    let dmg = e.atk;
    if (playerMissed) dmg *= 1.4;
    if (e.special === "pounce" && state.enemyAttacks % 3 === 0) dmg *= 2;
    if (e.special === "spear" && state.enemyAttacks === 1) dmg *= 1.5;
    const dodge = Math.random() * 100 < stats.speed * 3;
    const block = !dodge && Math.random() * 100 < stats.block;
    ui.enemyFig.classList.remove("attack");
    void ui.enemyFig.offsetWidth;
    ui.enemyFig.classList.add("attack");
    if (dodge) {
      sfx("whoosh");
      say(`${e.name} attacks, but you step aside!`, "good");
    } else if (block) {
      sfx("block");
      sparks(ui.heroFig, 10);
      say(`${e.name} attacks — your shield holds!`, "good");
    } else {
      if (e.special !== "crush") dmg -= stats.armor;
      dmg = Math.max(1, Math.round(dmg));
      state.hp -= dmg;
      sfx("hurt");
      screenShake(6);
      ui.heroFig.classList.remove("hit");
      void ui.heroFig.offsetWidth;
      ui.heroFig.classList.add("hit");
      floatDamage(ui.heroFig, `-${dmg}`, "hurt");
      say(`${e.name} hits you for ${dmg}${e.special === "crush" ? " (crushing through armor)" : ""}${e.special === "pounce" && state.enemyAttacks % 3 === 0 ? " — POUNCE!" : ""}`, "bad");
    }
    refreshBars();
    if (state.hp <= 0) return setTimeout(defeat, 800);
    setTimeout(turn, 1000);
  }

  function battleCry() {
    state.cryUsed = true;
    sfx("fanfare");
    say(`"${verseText(keyVerse, settings)}"`, "cry");
    speak(verseText(keyVerse, settings));
    const q = makeQuestion(profile, settings, { forceVerse: keyVerse });
    setTimeout(() => askQuestion(q, { seconds: 10 + stats.speed, cry: true }), 900);
  }

  function resolveCry(ok) {
    if (!alive) return;
    if (ok) {
      const dmg = Math.round(stats.atk * 3);
      state.enemyHp -= dmg;
      state.hp = Math.min(state.maxHp, state.hp + 20);
      sfx("crit");
      screenShake(14);
      burst(ui.enemyFig, { n: 40, colors: ["#fff", "#ffd54a", "#ff8a3a"] });
      starsBurst(ui.heroFig, 16);
      floatDamage(ui.enemyFig, `-${dmg}`, "crit");
      say(`THE BATTLE IS THE LORD'S! ${dmg} damage and you are strengthened (+20).`, "cry");
      refreshBars();
      if (state.enemyHp <= 0) return setTimeout(enemyDown, 800);
      setTimeout(turn, 1200);
    } else {
      say("The cry falters. Steady yourself and strike again.", "bad");
      setTimeout(turn, 900);
    }
  }

  function floatDamage(anchor, text, cls) {
    const r = anchor.getBoundingClientRect();
    const f = el("div", { class: `float-text dmg ${cls}`, text });
    f.style.left = r.left + r.width / 2 + "px";
    f.style.top = r.top + r.height * 0.3 + "px";
    document.body.append(f);
    setTimeout(() => f.remove(), 1100);
  }

  /* ---------- outcomes ---------- */
  async function enemyDown() {
    if (!alive) return;
    ui.enemyFig.classList.add("down");
    sfx("victory");
    burst(ui.enemyFig, { n: 36 });
    say(`${state.enemy.name} falls!`, "good");
    if (arena) return setTimeout(arenaWaveWon, 900);
    state.enemyIndex += 1;
    if (state.enemyIndex < battle.enemies.length) {
      say(`${state.enemy.name} falls! Another steps forward...`, "good");
      return setTimeout(fight, 1400);
    }
    setTimeout(victory, 1000);
  }

  async function victory() {
    stopSpeaking();
    startMusic("camp");
    const out = recordBattleWin(profile, battle, { turns: state.turns });
    if (bumpOrder(profile, "battle")) toast("Order complete: battle won!", "good");
    const badges = checkBadges(profile, settings);
    ctx.persist();
    confetti(140);
    await modal({
      title: `Victory! ${battle.name}`,
      body: el("div", { class: "story" }, el("div", { class: "story-kicker", text: "What really happened" }), el("p", { text: battle.story }), el("div", { class: "small muted", text: battle.ref })),
      buttons: [{ id: "ok", label: "Claim the spoils ➜", cls: "btn btn-gold" }],
      cls: "modal-wide",
    });
    await showReward({
      title: out.first ? "The giant has fallen!" : "Victory once more!",
      subtitle: out.first ? undefined : "Rematches pay half, but the practice is priceless.",
      shekels: out.shekels,
      xp: out.xp,
      drop: out.drop,
      rankUp: out.rankUp,
      badges,
      continueLabel: battle.final && out.first ? "Take your place among the Mighty ➜" : "Back to the Campaign ➜",
    });
    if (battle.final && out.first) {
      await modal({ title: "Mighty Man of Valor", body: `${profile.name}, you have fought every battle and hidden ${Object.values(profile.verses).filter((v) => v.mastered).length} verses in your heart. "Be strong and courageous" — the LORD your God is with you wherever you go. The Arena awaits, and there are always more scrolls to master.`, buttons: [{ id: "ok", label: "Amen!", cls: "btn btn-gold" }] });
    }
    alive = false;
    ctx.onDone();
  }

  async function arenaWaveWon() {
    const r = arenaReward(state.wave);
    const g = grant(profile, r);
    state.arenaShekels += r.shekels;
    state.arenaXp += r.xp;
    if (state.wave > profile.arenaBest) profile.arenaBest = state.wave;
    if (bumpOrder(profile, "battle")) toast("Order complete: arena wave won!", "good");
    const badges = checkBadges(profile, settings);
    ctx.persist();
    if (g.rankUp) toast(`Promoted to ${g.rankUp.name}!`, "good");
    for (const b of badges) toast(`Badge: ${b.name}`, "good");
    state.hp = Math.min(state.maxHp, state.hp + Math.round(state.maxHp * 0.3));
    const res = await modal({
      title: `Wave ${state.wave} cleared!`,
      body: `+${r.shekels} shekels, +${r.xp} XP. You recover some strength (❤️ ${state.hp}/${state.maxHp}). Total this run: ${state.arenaShekels} shekels.`,
      buttons: [{ id: "leave", label: "Leave with winnings", cls: "btn" }, { id: "next", label: `Wave ${state.wave + 1} ➜`, cls: "btn btn-gold" }],
    });
    if (res === "next") {
      state.wave += 1;
      state.enemyIndex = 0;
      fight();
    } else leave();
  }

  async function defeat() {
    stopSpeaking();
    startMusic("camp");
    sfx("defeat");
    ui.heroFig.classList.add("down");
    await modal({
      title: arena ? `Fallen at wave ${state.wave}` : "Retreat and train",
      body: arena
        ? `You keep the ${state.arenaShekels} shekels you won. Sharpen your swords and return stronger.`
        : `${state.enemy.name} was too strong this time. No mighty man wins every fight. Master more verses to grow your Valor, buy better armor, and come back for ${battle.name}!`,
      buttons: [{ id: "ok", label: "Back to camp", cls: "btn btn-gold" }],
    });
    ctx.persist();
    leave();
  }

  function leave() {
    alive = false;
    stopSpeaking();
    startMusic("camp");
    ctx.onDone();
  }

  intro();
  return () => {
    alive = false;
    stopSpeaking();
  };
}
