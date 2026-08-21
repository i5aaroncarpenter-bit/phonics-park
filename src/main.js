import { loadSave, persist as persistSave } from "./save.js";
import { getLevel } from "./curriculum.js";
import { setMuted, unlock, startMusic, stopMusic, sfx } from "./audio.js";
import { renderTitle } from "./screens/title.js";
import { renderPark } from "./screens/park.js";
import { renderLevels } from "./screens/levels.js";
import { renderRecap } from "./screens/recap.js";
import { playAtBat } from "./modes/atbat.js";
import { playDefense } from "./modes/defense.js";
import { playPitching } from "./modes/pitching.js";

const app = document.getElementById("app");
const save = loadSave();
setMuted(!!save.mute);

const PLAY = { atbat: playAtBat, defense: playDefense, pitching: playPitching };

function persist() {
  persistSave(save);
}

function cleanup() {
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
  else startMusic();
}

function goTitle() {
  cleanup();
  renderTitle(app, {
    save,
    onPlay({ name, jersey }) {
      save.name = name;
      save.jersey = jersey;
      persist();
      unlock();
      sfx("organ");
      if (!save.mute) startMusic();
      goPark();
    },
    onToggleMute: muteTo,
  });
}

function goPark() {
  cleanup();
  if (!save.mute) startMusic();
  renderPark(app, {
    save,
    onPickMode(mode) {
      goLevels(mode);
    },
    onBack: goTitle,
    onToggleMute: muteTo,
  });
}

function goLevels(mode) {
  cleanup();
  renderLevels(app, {
    save,
    mode,
    onPickLevel(levelId) {
      goPlay(mode, levelId);
    },
    onBack: goPark,
    onToggleMute: muteTo,
  });
}

function goPlay(mode, levelId) {
  cleanup();
  stopMusic();
  unlock();
  const play = PLAY[mode] || playAtBat;
  play(app, {
    save,
    persist,
    mode,
    levelId,
    onQuit() {
      goPark();
    },
    onDone(stats) {
      finishInning(mode, levelId, stats);
    },
  });
}

function finishInning(mode, levelId, stats) {
  const level = getLevel(levelId);
  const passed = stats.correct / stats.atBats >= (level.passRate || 0.8);
  stats.passed = passed;
  save.totalRuns = (save.totalRuns || 0) + (stats.runs || 0);
  const session = (stats.points || 0) + (stats.runs || 0) * 5;
  if (session > (save.highScore || 0)) save.highScore = session;
  if (passed) {
    save.passed[mode][String(levelId)] = true;
    save.lastClearMs[mode][String(levelId)] = stats.clearMs;
    save.levelReached[mode] = Math.max(save.levelReached[mode] || 1, Math.min(6, levelId + 1));
    sfx("cheer");
    sfx("organ");
  } else {
    sfx("umpire");
  }
  persist();
  cleanup();
  renderRecap(app, {
    save,
    mode,
    level,
    stats,
    onAgain() { goPlay(mode, levelId); },
    onPark: goPark,
    onNext() { goPlay(mode, Math.min(6, levelId + 1)); },
  });
}

window.addEventListener("pointerdown", () => { unlock(); if (!save.mute) startMusic(); }, { once: true });
goTitle();
