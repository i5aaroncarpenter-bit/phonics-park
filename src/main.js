import { loadSave, persist as persistSave, awardTrophy, listProfiles, createProfile, setActiveProfile, updateProfileMeta, isRookie, touchDaily } from "./save.js";
import { STAGES, buildCampStage } from "./curriculum.js";
import { setMuted, unlock, startMusic, stopMusic, sfx } from "./audio.js";
import { initSpeech, setSpeechRate, setSoundStyle, stopSpeech, preloadSounds } from "./speech.js";
import { renderTitle } from "./screens/title.js";
import { renderSeason } from "./screens/season.js";
import { renderLocker } from "./screens/locker.js";
import { renderTrophies } from "./screens/trophies.js";
import { renderClipboard } from "./screens/clipboard.js";
import { renderResult } from "./screens/result.js";
import { playMatch } from "./screens/match.js";
import { renderCamp } from "./screens/camp.js";
import { renderLeague } from "./screens/league.js";
import { renderStickers } from "./screens/stickers.js";
import { newProfileDialog } from "./screens/title.js";
import { runLittleLeague } from "./rookie/run.js";
import { openDailyGift, openMysteryBox, awardXp } from "./rewards.js";
import { DRILLS } from "./camp/data.js";
import { runVowelKicks } from "./camp/vowels.js";
import { runSoundTwins } from "./camp/twins.js";
import { runWordFamilies } from "./camp/families.js";
import { runSoundCatch } from "./camp/catch.js";
import { runBlendBlitz } from "./camp/blitz.js";

const DRILL_RUNNERS = { vowels: runVowelKicks, twins: runSoundTwins, families: runWordFamilies, catch: runSoundCatch, blitz: runBlendBlitz };

const app = document.getElementById("app");
window.__pbDebug = /[?&]debug/.test(location.search);
let save = loadSave();
setMuted(!!save.mute);
setSpeechRate(save.voiceRate || 0.92);
setSoundStyle(save.soundStyle || "pure");
initSpeech(save.voiceName);

function persist() {
  persistSave(save);
}

function cleanup() {
  stopSpeech();
  if (typeof app._cleanup === "function") {
    try { app._cleanup(); } catch { /* ignore */ }
    app._cleanup = null;
  }
}

function muteTo(next) {
  save.mute = !!next;
  setMuted(save.mute);
  persist();
  if (save.mute) stopMusic();
  else startMusic("menu");
}

function saveName(name) {
  if (name && name !== save.name) {
    save.name = name;
    persist();
    updateProfileMeta(save);
  }
}

function applySettings() {
  setMuted(!!save.mute);
  setSpeechRate(save.voiceRate || 0.92);
  setSoundStyle(save.soundStyle || "pure");
}

function goTitle() {
  cleanup();
  if (!save.mute) startMusic("menu");
  const giftReady = touchDaily(save);
  persist();
  renderTitle(app, {
    save, giftReady,
    onPlay({ name }) { saveName(name); unlock(); if (isRookie(save)) goLeague(); else goSeason(); },
    onCamp({ name }) { saveName(name); unlock(); goCamp(); },
    onStickers({ name }) { saveName(name); goStickers(goTitle); },
    onGift({ name }) { saveName(name); unlock(); openDailyGift(app, save, () => { persist(); goTitle(); }); },
    onLocker({ name }) { saveName(name); goLocker(); },
    onTrophies({ name }) { saveName(name); goTrophies(); },
    onClipboard({ name }) { saveName(name); goClipboard(); },
    onSwitchProfile(id) { persist(); setActiveProfile(id); save = loadSave(); applySettings(); goTitle(); },
    onNewProfile(info) { persist(); save = createProfile(info); applySettings(); goTitle(); },
    onToggleMute: muteTo,
  });
}

function goLeague() {
  cleanup();
  if (!save.mute) startMusic("menu");
  renderLeague(app, {
    save,
    onPlayStage(id) { goLittle(id); },
    onStickers() { goStickers(goLeague); },
    onBigLeague: goSeason,
    onBack: goTitle,
    onToggleMute: muteTo,
  });
}

function goLittle(stageId) {
  cleanup();
  stopMusic();
  unlock();
  runLittleLeague(app, {
    save, persist, stageId,
    onToggleMute: muteTo,
    onQuit: goLeague,
    onReplay() { goLittle(stageId); },
    onDone() { persist(); updateProfileMeta(save); goLeague(); },
  });
}

function goStickers(back) {
  cleanup();
  if (!save.mute) startMusic("menu");
  renderStickers(app, { save, onBack: back || goTitle, onToggleMute: muteTo });
}

function goSeason() {
  cleanup();
  if (!save.mute) startMusic("menu");
  renderSeason(app, {
    save,
    onPlayStage(id) { goPlay(id); },
    onCamp: goCamp,
    onBack: goTitle,
    onToggleMute: muteTo,
  });
}

function goCamp() {
  cleanup();
  if (!save.mute) startMusic("menu");
  renderCamp(app, { save, onDrill: goDrill, onBack: goSeason, onToggleMute: muteTo });
}

function goDrill(id) {
  cleanup();
  stopMusic();
  unlock();
  if (id === "coach") { goPlay(buildCampStage(save)); return; }
  const drill = DRILLS.find((d) => d.id === id);
  const run = DRILL_RUNNERS[id];
  if (!drill || !run) { goCamp(); return; }
  run(app, {
    save, persist, drill,
    onToggleMute: muteTo,
    onQuit: goCamp,
    onReplay() { goDrill(id); },
    onCamp() { persist(); goCamp(); },
  });
}

function goLocker() {
  cleanup();
  renderLocker(app, { save, persist, onBack: goTitle, onToggleMute: muteTo });
}

function goTrophies() {
  cleanup();
  renderTrophies(app, { save, onBack: goTitle, onToggleMute: muteTo });
}

function goClipboard() {
  cleanup();
  renderClipboard(app, {
    save, persist,
    onBack: goTitle,
    onReset() { save = loadSave(); setMuted(!!save.mute); goTitle(); },
    onToggleMute: muteTo,
  });
}

function goPlay(stageId) {
  cleanup();
  stopMusic();
  unlock();
  const heat = typeof stageId !== "object" && save.wins[stageId] ? 1.12 : 1;
  playMatch(app, {
    save, persist, stageId, heat,
    onQuit: goSeason,
    onDone(stats) { finishGame(stats); },
    onToggleMute: muteTo,
  });
}

function finishGame(stats) {
  const id = stats.stageId;
  save.totals.games = (save.totals.games || 0) + 1;
  const newTrophies = [];
  const give = (tid) => { if (awardTrophy(save, tid)) newTrophies.push(tid); };

  if (stats.stage && stats.stage.camp) {
    if (save.totals.words >= 100) give("century");
    const rec = save.camp.coach || { best: 0, stars: 0, plays: 0 };
    const stars = stats.acc >= 0.9 ? 3 : stats.acc >= 0.7 ? 2 : stats.acc >= 0.5 ? 1 : 0;
    save.camp.coach = { best: Math.max(rec.best, stats.correct * 10), stars: Math.max(rec.stars, stars), plays: rec.plays + 1 };
    persist();
    cleanup();
    renderResult(app, {
      save, stats, newTrophies,
      onAgain() { goPlay(buildCampStage(save)); },
      onNext: goCamp,
      onSeason: goCamp,
    });
    return;
  }

  if (stats.won) {
    save.wins[id] = true;
    if (id >= save.unlocked && id < STAGES.length) save.unlocked = id + 1;
    save.coins += 50;
    stats.coins += 50;
    give("first-win");
    if (stats.stars === 3) { save.coins += 30; stats.coins += 30; }
    if (id === STAGES.length) give("champion");
  }
  save.stars[id] = Math.max(save.stars[id] || 0, stats.stars);
  const prev = save.best[id];
  if (!prev || stats.home - stats.away > prev.home - prev.away) save.best[id] = { home: stats.home, away: stats.away };
  save.totals.streak = Math.max(save.totals.streak || 0, stats.bestStreak);

  if (stats.touchdowns >= 3) give("hat-trick");
  if (stats.perfect && stats.plays >= 8) give("perfect");
  if (stats.bestStreak >= 6) give("on-fire");
  if (stats.bigPlays >= 5) give("speedster");
  if (save.totals.words >= 100) give("century");
  if (Object.values(save.wins).filter(Boolean).length >= 6) give("half-season");
  if (save.coins >= 500) give("rich");
  if ((save.totals.fieldGoals || 0) >= 10) give("kicker");
  persist();

  cleanup();
  const afterResult = (next) => async () => {
    if (stats.won) {
      openMysteryBox(app, save, { coins: 20 + stats.stars * 10, onDone: async () => { await awardXp(app, save, 40 + stats.correct * 5); persist(); next(); } });
    } else {
      await awardXp(app, save, stats.correct * 5);
      persist();
      next();
    }
  };
  renderResult(app, {
    save, stats, newTrophies,
    onAgain: afterResult(() => goPlay(id)),
    onNext: afterResult(() => goPlay(Math.min(STAGES.length, id + 1))),
    onSeason: afterResult(goSeason),
  });
}

window.addEventListener("pointerdown", () => { unlock(); preloadSounds(); if (!save.mute && !app.querySelector(".match")) startMusic("menu"); }, { once: true });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") sfx("tap"); });
if (!listProfiles().length) {
  goTitle();
  newProfileDialog(app, (info) => { save = createProfile(info); applySettings(); goTitle(); }, { first: true });
} else {
  goTitle();
}
