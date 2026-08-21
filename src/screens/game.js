import { getLevel, pickInning } from "../curriculum.js";
import { heatForNextLevel, heatLabel, persist } from "../save.js";
import { HIT_RUNS, renderPlayChrome, updateHud, showNextUp } from "../playkit.js";
import { playAtBat, hearCurrent as hearAtBat } from "../modes/atbat.js";
import { playDefense, hearCurrent as hearDefense } from "../modes/defense.js";
import { playPitching, hearCurrent as hearPitching } from "../modes/pitching.js";

const PLAY = { atbat: playAtBat, defense: playDefense, pitching: playPitching };
const HEAR = { atbat: hearAtBat, defense: hearDefense, pitching: hearPitching };

export async function renderGame(root, { save, mode, levelId, onDone, onQuit, onToggleMute }) {
  const level = getLevel(levelId);
  const heat = heatForNextLevel(save, mode, levelId) || 1;
  const items = pickInning(level, heat);
  const scaffolding = heat >= 1.12 ? "hide" : heat >= 1.08 ? "less" : "full";
  const hud = { runs: 0, hits: 0, inningNo: 1, atBats: items.length, streak: 0, bestStreak: 0, correct: 0 };
  const chrome = renderPlayChrome(root, {
    save,
    level,
    hud,
    onQuit,
    onMute() {
      onToggleMute(!save.mute);
      const b = root.querySelector("#mute");
      if (b) b.textContent = save.mute ? "🔇" : "🔊";
    },
    onHear: () => HEAR[mode](),
  });
  if (heat > 1) {
    const chip = document.createElement("div");
    chip.className = "heat-pill";
    chip.textContent = heatLabel(heat);
    chip.style.margin = "0 auto 6px";
    root.querySelector(".hud").after(chip);
  }
  let cancelled = false;
  root._cleanup = () => { cancelled = true; };
  const started = Date.now();
  for (let i = 0; i < items.length; i++) {
    if (cancelled) return;
    hud.inningNo = i + 1;
    updateHud(root, hud);
    await showNextUp(chrome.stage, save.name + " #" + save.jersey);
    if (cancelled) return;
    const tutorial = mode === "atbat" && !save.seenTutorial && i === 0;
    const result = await PLAY[mode]({
      stage: chrome.stage,
      tiles: chrome.tiles,
      extra: chrome.extra,
      bar: chrome.bar,
      item: items[i],
      level,
      heat,
      scaffolding,
      tutorial,
    });
    if (tutorial) { save.seenTutorial = true; persist(save); }
    if (cancelled) return;
    if (result.correct) {
      hud.correct += 1;
      hud.streak += 1;
      hud.bestStreak = Math.max(hud.bestStreak, hud.streak);
      const runs = HIT_RUNS[result.quality] || 0;
      hud.runs += runs;
      if (runs) hud.hits += 1;
    } else {
      hud.streak = 0;
    }
    updateHud(root, hud);
  }
  const clearMs = Date.now() - started;
  const passed = hud.correct / items.length >= (level.passRate || 0.8);
  if (passed) {
    save.lastClearMs[mode][String(levelId)] = clearMs;
    save.passed[mode][String(levelId)] = true;
    save.levelReached[mode] = Math.max(save.levelReached[mode] || 1, Math.min(6, levelId + 1));
  }
  save.totalRuns += hud.runs;
  const session = hud.runs * 10 + hud.correct * 5 + hud.bestStreak * 2;
  if (session > save.highScore) save.highScore = session;
  persist(save);
  onDone({ stats: { atBats: items.length, correct: hud.correct, runs: hud.runs, hits: hud.hits, bestStreak: hud.bestStreak, clearMs, points: session }, passed });
}
