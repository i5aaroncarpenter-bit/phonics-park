/** Mighty Men — entry point and screen router. */

import { loadSave, persist as persistSave, activeProfile } from "./save.js";
import { initFX } from "./fx.js";
import { unlock, setMusic, setSfx, startMusic } from "./audio.js";
import { initSpeech, setSpeechEnabled, stopSpeaking } from "./speech.js";
import { initInstall } from "./install.js";
import { touchStreak, ensureOrders, checkBadges, bumpOrder } from "./engine/progress.js";
import { toast, askPin } from "./ui.js";
import { renderTitle } from "./screens/title.js";
import { renderCamp } from "./screens/camp.js";
import { renderScrolls } from "./screens/scrolls.js";
import { renderForge } from "./screens/forge.js";
import { renderArmory } from "./screens/armory.js";
import { renderHall } from "./screens/hall.js";
import { renderTent } from "./screens/tent.js";
import { renderBattles } from "./screens/battles.js";
import { renderBattle } from "./screens/battle.js";
import { renderDuel, chooseRival } from "./screens/duel.js";
import { renderGauntlet } from "./screens/gauntlet.js";
import { renderSpeak } from "./screens/speak.js";

const app = document.getElementById("app");
const save = loadSave();
let cleanup = null;
let lastScroll = null;

initFX();
initSpeech();
initInstall();
setSpeechEnabled(save.settings.tts);
setMusic(save.settings.music);
setSfx(save.settings.sfx);
document.addEventListener("pointerdown", () => unlock(), { once: true, capture: true });

function persist() {
  persistSave(save);
}

function show(renderFn) {
  if (typeof cleanup === "function") {
    try { cleanup(); } catch { /* ignore */ }
  }
  cleanup = null;
  stopSpeaking();
  window.scrollTo(0, 0);
  const r = renderFn();
  if (typeof r === "function") cleanup = r;
}

function profileCtx(extra = {}) {
  const profile = activeProfile(save);
  return { save, profile, persist, ...extra };
}

function goTitle() {
  show(() =>
    renderTitle(app, {
      save,
      persist,
      onChoose(p) {
        save.active = p.id;
        const s = touchStreak(p);
        ensureOrders(p);
        const badges = checkBadges(p, save.settings);
        persist();
        if (s.changed && s.count > 1) toast(`🔥 ${s.count} days of valor in a row!`, "good");
        for (const b of badges) toast(`Badge earned: ${b.name}`, "good");
        goCamp();
      },
      onTent: () => goTent(goTitle),
    }),
  );
}

function goCamp() {
  const profile = activeProfile(save);
  if (!profile) return goTitle();
  show(() =>
    renderCamp(app, profileCtx({
      onTitle: goTitle,
      onScrolls: () => goScrolls(),
      onSharpen: (verse) => goForge(verse, { mode: "sharpen", back: goCamp }),
      onBattles: goBattles,
      onArmory: () => goArmory(),
      onHall: goHall,
      onTent: () => goTent(goCamp),
      onGauntlet: goGauntlet,
      onDuel: goDuel,
      refresh: goCamp,
    })),
  );
}

function goGauntlet() {
  show(() => renderGauntlet(app, profileCtx({ onDone: goCamp })));
}

async function goDuel() {
  const profile = activeProfile(save);
  const rival = await chooseRival(save, profile);
  if (!rival) return;
  show(() => renderDuel(app, profileCtx({ rival, onDone: goCamp })));
}

function goSpeak(verse, back) {
  show(() =>
    renderSpeak(app, profileCtx({
      verse,
      onDone: back,
      listened: () => {
        const p = activeProfile(save);
        if (p && bumpOrder(p, "listen")) toast("Order complete: listened to a verse!", "good");
        persist();
      },
    })),
  );
}

function goScrolls(openScroll = lastScroll) {
  show(() =>
    renderScrolls(app, profileCtx({
      openScroll,
      onBack: goCamp,
      onForge: (verse, startStage) => {
        lastScroll = verse.scroll;
        goForge(verse, { mode: "learn", startStage, back: () => goScrolls(verse.scroll) });
      },
      onSharpen: (verse) => {
        lastScroll = verse.scroll;
        goForge(verse, { mode: "sharpen", back: () => goScrolls(verse.scroll) });
      },
      onSpeak: (verse) => {
        lastScroll = verse.scroll;
        goSpeak(verse, () => goScrolls(verse.scroll));
      },
    })),
  );
}

function goForge(verse, { mode, startStage, back }) {
  show(() =>
    renderForge(app, profileCtx({
      verse,
      mode,
      startStage,
      onDone: back,
      onBack: back,
      onSpeak: (v) => goSpeak(v, back),
    })),
  );
}

function goArmory(slot) {
  show(() => renderArmory(app, profileCtx({ slot, onBack: goCamp })));
}

function goHall() {
  show(() => renderHall(app, profileCtx({ onBack: goCamp })));
}

async function goTent(back) {
  const ok = await askPin(save.settings, "Captain's Tent");
  if (!ok) return;
  show(() => renderTent(app, { save, persist, onBack: back }));
}

function goBattles() {
  show(() =>
    renderBattles(app, profileCtx({
      onBack: goCamp,
      onScrolls: () => goScrolls(),
      onFight: (battle) => goBattle(battle),
      onArena: () => goBattle(null, true),
    })),
  );
}

function goBattle(battle, arena = false) {
  show(() => renderBattle(app, profileCtx({ battle, arena, onDone: goBattles })));
}

// Keep the camp fresh when the day rolls over while the tab is open.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const p = activeProfile(save);
    if (p) {
      ensureOrders(p);
      persist();
    }
  }
});

goTitle();
startMusic("camp");
