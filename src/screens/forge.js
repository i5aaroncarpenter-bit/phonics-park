/**
 * The Forge — where a verse is hammered into a sword through five stages:
 * Hear It → Fallen Stones → Mend the Shield → Speed Sword → Test the Blade.
 * Also runs Sharpen sessions (spaced review of mastered verses).
 */

import { el, button, topbar, coinPill, modal, toast, askPin } from "../ui.js";
import { verseText, tokenize, allVerses } from "../data/verses.js";
import { STAGE_REWARDS } from "../data/progress.js";
import { heroStats } from "../data/gear.js";
import { speak, stopSpeaking } from "../speech.js";
import { sfx, startMusic } from "../audio.js";
import * as hear from "../stages/hear.js";
import * as order from "../stages/order.js";
import * as fill from "../stages/fill.js";
import * as speed from "../stages/speed.js";
import * as recite from "../stages/recite.js";
import { completeStage, completeSharpen, recordRecite, valor, verseState, checkBadges, bumpOrder, currentSharpness, STAGE_COUNT } from "../engine/progress.js";
import { showReward, newlyUnlocked } from "./reward.js";

const STAGES = [hear, order, fill, speed, recite];
const STAGE_ICONS = ["👂", "🧱", "🛡️", "⚡", "🗡️"];

function decoyPool(settings, verse) {
  return allVerses(settings)
    .filter((v) => v.id !== verse.id)
    .flatMap((v) => tokenize(verseText(v, settings)));
}

export function renderForge(app, ctx) {
  const { save, profile, verse, mode = "learn", onDone, onBack } = ctx;
  const settings = save.settings;
  const text = verseText(verse, settings);
  const words = tokenize(text);
  const state = verseState(profile, verse.id);
  let stageIndex = mode === "learn" ? Math.min(state.mastered ? 0 : state.stage, STAGE_COUNT - 1) : 0;
  if (ctx.startStage !== undefined) stageIndex = ctx.startStage;
  let alive = true;

  const wrap = el("div", { class: "screen forge" });
  const header = topbar({
    title: mode === "sharpen" ? "Sharpen the Sword" : "The Forge",
    sub: verse.ref,
    onBack: () => quit(),
    right: [coinPill(profile)],
  });
  const steps = el("div", { class: "forge-steps" });
  const body = el("div", { class: "forge-body" });
  wrap.append(header, steps, body);
  app.replaceChildren(wrap);
  startMusic("camp");

  function drawSteps() {
    steps.replaceChildren();
    if (mode === "sharpen") {
      steps.append(el("div", { class: "sharpen-banner" }, el("span", { text: "✨ Sharpen: a quick review keeps your sword sharp" })));
      return;
    }
    STAGE_REWARDS.forEach((s, i) => {
      const done = i < stageIndex || state.mastered;
      steps.append(
        el("div", { class: `step ${i === stageIndex ? "current" : ""} ${done ? "done" : ""}` }, el("span", { class: "step-ico", text: STAGE_ICONS[i] }), el("span", { class: "step-name", text: s.name })),
      );
    });
  }

  async function quit() {
    stopSpeaking();
    if (mode === "learn" && !state.mastered) {
      const r = await modal({ title: "Leave the Forge?", body: "Your finished stages are saved. Come back any time to keep hammering.", buttons: [{ id: "stay", label: "Keep training", cls: "btn btn-gold" }, { id: "leave", label: "Leave", cls: "btn" }] });
      if (r !== "leave") return;
    }
    alive = false;
    onBack();
  }

  const stageCtx = {
    verse,
    text,
    words,
    ref: verse.ref,
    settings,
    decoyPool: decoyPool(settings, verse),
    bonusSeconds: heroStats(profile).speed,
    speak: (t, opts) => speak(t, opts),
    stopSpeaking,
    listened: () => {
      if (bumpOrder(profile, "listen")) toast("Order complete: listened to a verse!", "good");
      ctx.persist();
    },
  };

  async function runLearn() {
    while (alive && stageIndex < STAGE_COUNT) {
      drawSteps();
      body.replaceChildren();
      const stage = STAGES[stageIndex];
      const res = await stage.play(body, stageCtx);
      if (!alive) return;
      if (!res.ok) {
        if (res.retry) continue;
        return;
      }
      const prevValor = valor(profile);
      const out = completeStage(profile, verse.id, stageIndex, { perfect: res.perfect });
      if (bumpOrder(profile, "learn")) toast("Order progress: Forge stage!", "good");
      if (out.mastered && bumpOrder(profile, "master")) toast("Order complete: mastered a verse!", "good");
      const badges = checkBadges(profile, settings);
      const unlocked = out.mastered ? newlyUnlocked(prevValor, valor(profile)) : [];
      ctx.persist();
      const isLast = stageIndex === STAGE_COUNT - 1;
      const extra = [];
      if (out.mastered) extra.push({ id: "recite", label: "🗣️ Recite to your Captain (+30)", cls: "btn btn-primary" });
      const choice = await showReward({
        title: out.mastered ? "VERSE MASTERED!" : `${STAGE_REWARDS[stageIndex].name} complete!`,
        subtitle: out.mastered ? `${verse.ref} is hidden in your heart.` : out.firstTime ? undefined : "Practice pays a little less, but every swing counts.",
        shekels: out.shekels,
        xp: out.xp,
        perfect: res.perfect && STAGE_REWARDS[stageIndex].perfect,
        mastered: out.mastered,
        valor: out.valor,
        rankUp: out.rankUp,
        badges,
        unlocked,
        extraButtons: extra,
        continueLabel: isLast ? "Back to the Scrolls ➜" : "Next stage ➜",
      });
      if (choice === "recite") await reciteFlow();
      stageIndex += 1;
      if (isLast) {
        onDone();
        return;
      }
    }
  }

  async function reciteFlow() {
    const ok = await askPin(settings, "Captain's approval");
    if (!ok) return;
    const r = await modal({
      title: "Recite aloud",
      body: el("div", {}, el("p", { text: `Captain, listen while ${profile.name} recites ${verse.ref} from memory:` }), el("p", { class: "quote", text: text })),
      buttons: [{ id: "no", label: "Not yet", cls: "btn" }, { id: "yes", label: "I heard it! ✔", cls: "btn btn-gold" }],
    });
    if (r !== "yes") return;
    const g = recordRecite(profile, verse.id);
    if (!g) return;
    const badges = checkBadges(profile, settings);
    ctx.persist();
    await showReward({ title: "Spoken aloud!", subtitle: "The sword is at full shine: 5 stars.", shekels: g.shekels, xp: g.xp, rankUp: g.rankUp, badges, sharpness: 5 });
  }

  async function runSharpen() {
    drawSteps();
    body.replaceChildren();
    const before = currentSharpness(profile, verse.id);
    const pickStage = before <= 2 ? fill : Math.random() < 0.5 ? fill : speed;
    const res = pickStage === fill
      ? await fill.play(body, stageCtx, { ratio: 0.5, title: "Sharpen: Mend the Shield", hint: "Half the words are missing. Put them back!" })
      : await speed.play(body, stageCtx, { seconds: 5, title: "Sharpen: Speed Sword" });
    if (!alive) return;
    const out = completeSharpen(profile, verse.id, { perfect: res.perfect });
    if (bumpOrder(profile, "sharpen")) toast("Order progress: sword sharpened!", "good");
    const badges = checkBadges(profile, settings);
    ctx.persist();
    sfx("clang");
    await showReward({ title: "Sword sharpened!", subtitle: verse.ref, shekels: out.shekels, xp: out.xp, perfect: res.perfect, sharpness: out.sharpness, rankUp: out.rankUp, badges, continueLabel: "Back ➜" });
    onDone();
  }

  if (mode === "sharpen") runSharpen();
  else runLearn();

  return () => {
    alive = false;
    stopSpeaking();
  };
}
