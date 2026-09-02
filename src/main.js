import { loadSave, persist as persistSave, awardTrophy } from "./save.js";
import { STAGES, buildCampStage } from "./curriculum.js";
import { setMuted, unlock, startMusic, stopMusic, sfx } from "./audio.js";
import { initSpeech, setSpeechRate, stopSpeech } from "./speech.js";
import { renderTitle } from "./screens/title.js";
import { renderSeason } from "./screens/season.js";
import { renderLocker } from "./screens/locker.js";
import { renderTrophies } from "./screens/trophies.js";
import { renderClipboard } from "./screens/clipboard.js";
import { renderResult } from "./screens/result.js";
import { playMatch } from "./screens/match.js";

const app = document.getElementById("app");
window.__pbDebug = /[?&]debug/.test(location.search);
let save = loadSave();
setMuted(!!save.mute);
setSpeechRate(save.voiceRate || 0.92);
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
  }
}

function goTitle() {
  cleanup();
  if (!save.mute) startMusic("menu");
  renderTitle(app, {
    save,
    onPlay({ name }) { saveName(name); unlock(); goSeason(); },
    onLocker({ name }) { saveName(name); goLocker(); },
    onTrophies({ name }) { saveName(name); goTrophies(); },
    onClipboard({ name }) { saveName(name); goClipboard(); },
    onToggleMute: muteTo,
  });
}

function goSeason() {
  cleanup();
  if (!save.mute) startMusic("menu");
  renderSeason(app, {
    save,
    onPlayStage(id) { goPlay(id); },
    onCamp() { goPlay(buildCampStage(save)); },
    onBack: goTitle,
    onToggleMute: muteTo,
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
    persist();
    cleanup();
    renderResult(app, {
      save, stats, newTrophies,
      onAgain() { goPlay(buildCampStage(save)); },
      onNext: goSeason,
      onSeason: goSeason,
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
  renderResult(app, {
    save, stats, newTrophies,
    onAgain() { goPlay(id); },
    onNext() { goPlay(Math.min(STAGES.length, id + 1)); },
    onSeason: goSeason,
  });
}

window.addEventListener("pointerdown", () => { unlock(); if (!save.mute && !app.querySelector(".match")) startMusic("menu"); }, { once: true });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") sfx("tap"); });
goTitle();
