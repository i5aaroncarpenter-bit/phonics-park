/**
 * Progress engine: verse mastery, sword sharpness (spaced review), rewards,
 * ranks, badges, streaks and Today's Orders. Pure functions over the
 * profile; screens call these and then persist.
 */

import { allVerses, allScrolls } from "../data/verses.js";
import { BATTLES } from "../data/battles.js";
import { RELIC_SET, SLOTS } from "../data/gear.js";
import {
  STAGE_REWARDS, MASTERY_BONUS, RECITE_BONUS, SHARPEN_REWARD, ORDERS_CHEST,
  SPOKEN_BONUS, GAUNTLET, DUEL,
  REVIEW_INTERVALS, rankFor, rankTitle, badgeById,
} from "../data/progress.js";
import { today, daysBetween } from "../save.js";

export const STAGE_COUNT = 5;

export function verseState(profile, verseId) {
  if (!profile.verses[verseId]) {
    profile.verses[verseId] = { stage: 0, mastered: false, masteredAt: 0, lastReview: "", reviews: 0, sharpness: 0, recited: false, perfect: false };
  }
  return profile.verses[verseId];
}

export function isMastered(profile, verseId) {
  return !!profile.verses[verseId]?.mastered;
}

export function masteredIds(profile) {
  return Object.keys(profile.verses).filter((id) => profile.verses[id].mastered);
}

export function valor(profile) {
  return masteredIds(profile).length;
}

/** Sharpness (0-5 stars) decays with days since the last review. */
export function currentSharpness(profile, verseId) {
  const v = profile.verses[verseId];
  if (!v || !v.mastered) return 0;
  if (!v.lastReview) return v.sharpness;
  const days = daysBetween(v.lastReview, today());
  const interval = REVIEW_INTERVALS[Math.min(v.reviews, REVIEW_INTERVALS.length - 1)];
  const lost = Math.floor(days / interval);
  return Math.max(1, v.sharpness - lost);
}

/** Mastered verses due for review: dull, or not yet reviewed today and below full shine. */
export function dullVerses(profile, settings) {
  const t = today();
  return allVerses(settings)
    .filter((v) => isMastered(profile, v.id))
    .map((v) => ({ verse: v, sharpness: currentSharpness(profile, v.id), reviewedToday: profile.verses[v.id].lastReview === t }))
    .filter((x) => x.sharpness <= 2 || (!x.reviewedToday && x.sharpness <= 3))
    .sort((a, b) => a.sharpness - b.sharpness);
}

/* ---------- rewards ---------- */

export function grant(profile, { shekels = 0, xp = 0 }) {
  const before = rankFor(profile.xp);
  profile.shekels += shekels;
  profile.xp += xp;
  profile.stats.shekelsEarned += Math.max(0, shekels);
  const after = rankFor(profile.xp);
  return { shekels, xp, rankUp: after.id !== before.id ? { ...after, name: rankTitle(after, profile) } : null };
}

/** Called when a Forge stage is completed. Returns what was earned. */
export function completeStage(profile, verseId, stageIndex, { perfect = false } = {}) {
  const v = verseState(profile, verseId);
  const r = STAGE_REWARDS[stageIndex];
  const firstTime = v.stage <= stageIndex && !v.mastered;
  let shekels = r.shekels;
  let xp = r.xp;
  if (perfect && r.perfect) shekels += r.perfect;
  if (!firstTime) {
    shekels = Math.round(shekels * 0.4);
    xp = Math.round(xp * 0.4);
  }
  profile.stats.stagesDone += 1;
  const out = { shekels, xp, perfect, firstTime, mastered: false, badges: [] };
  if (firstTime) v.stage = Math.max(v.stage, stageIndex + 1);

  if (stageIndex === STAGE_COUNT - 1 && !v.mastered) {
    v.mastered = true;
    v.masteredAt = Date.now();
    v.sharpness = 3;
    v.reviews = 0;
    v.lastReview = today();
    shekels += MASTERY_BONUS.shekels;
    xp += MASTERY_BONUS.xp;
    out.mastered = true;
    out.valor = valor(profile);
  }
  if (stageIndex === STAGE_COUNT - 1 && perfect) {
    v.perfect = true;
    profile.stats.perfectBlades += 1;
  }
  const g = grant(profile, { shekels, xp });
  out.shekels = shekels;
  out.xp = xp;
  out.rankUp = g.rankUp;
  return out;
}

export function recordRecite(profile, verseId) {
  const v = verseState(profile, verseId);
  if (v.recited) return null;
  v.recited = true;
  v.sharpness = 5;
  v.lastReview = today();
  profile.stats.recited += 1;
  return grant(profile, RECITE_BONUS);
}

export function completeSharpen(profile, verseId, { perfect = false } = {}) {
  const v = verseState(profile, verseId);
  const wasSharp = currentSharpness(profile, verseId);
  v.sharpness = Math.min(5, wasSharp + 1);
  v.reviews += 1;
  v.lastReview = today();
  profile.stats.sharpenDone += 1;
  const shekels = SHARPEN_REWARD.shekels + (perfect ? SHARPEN_REWARD.perfect : 0);
  const g = grant(profile, { shekels, xp: SHARPEN_REWARD.xp });
  return { ...g, sharpness: v.sharpness };
}

/**
 * Speak the Sword: `pct` is the share of verse words heard (0-1). Word-perfect
 * (>= 0.85) polishes the sword to 5 stars and pays the full bonus once per day
 * per verse; a near miss pays a little. Returns null when nothing is owed.
 */
export function recordSpoken(profile, verseId, pct) {
  const v = verseState(profile, verseId);
  const t = today();
  const perfect = pct >= 0.85;
  const near = !perfect && pct >= 0.6;
  if (!perfect && !near) return null;
  if (v.spokenOn === t) return { shekels: 0, xp: 0, rankUp: null, perfect, repeat: true, sharpness: currentSharpness(profile, verseId) };
  v.spokenOn = t;
  if (perfect) {
    v.spoken = (v.spoken || 0) + 1;
    profile.stats.spoken += 1;
    if (v.mastered) {
      v.sharpness = 5;
      v.lastReview = t;
    }
    return { ...grant(profile, { shekels: SPOKEN_BONUS.shekels, xp: SPOKEN_BONUS.xp }), perfect: true, repeat: false, sharpness: v.mastered ? 5 : 0 };
  }
  return { ...grant(profile, { shekels: SPOKEN_BONUS.near, xp: Math.round(SPOKEN_BONUS.near) }), perfect: false, repeat: false, sharpness: currentSharpness(profile, verseId) };
}

export function gauntletUnlocked(profile) {
  return valor(profile) >= GAUNTLET.minValor;
}

/** The Gauntlet is over: pay per correct answer, plus a bonus for a new best. */
export function recordGauntlet(profile, { correct = 0, bestStreak = 0 } = {}) {
  profile.stats.gauntletRuns += 1;
  const prevBest = profile.stats.gauntletBest || 0;
  const newBest = correct > prevBest;
  if (newBest) profile.stats.gauntletBest = correct;
  let shekels = correct * GAUNTLET.perCorrect;
  if (bestStreak >= 5) shekels += GAUNTLET.streakBonus;
  if (newBest && prevBest > 0) shekels += GAUNTLET.newBest;
  const g = grant(profile, { shekels, xp: correct * GAUNTLET.xpPerCorrect });
  return { ...g, newBest, prevBest };
}

/** A Sibling Duel ended. `result` is "win" | "lose" | "draw". */
export function recordDuel(profile, result) {
  profile.stats.duelsPlayed += 1;
  if (result === "win") profile.stats.duelWins += 1;
  return grant(profile, DUEL[result] || DUEL.draw);
}

export function recordBattleWin(profile, battle, { turns = 0 } = {}) {
  const rec = profile.battles[battle.id] || { won: 0, bestTurns: 0 };
  const first = rec.won === 0;
  rec.won += 1;
  if (!rec.bestTurns || turns < rec.bestTurns) rec.bestTurns = turns;
  profile.battles[battle.id] = rec;
  profile.stats.battlesWon += 1;
  const shekels = first ? battle.shekels : Math.round(battle.shekels * 0.5);
  const xp = first ? battle.xp : Math.round(battle.xp * 0.5);
  const g = grant(profile, { shekels, xp });
  let drop = null;
  if (first && battle.drop && !profile.owned.includes(battle.drop)) {
    profile.owned.push(battle.drop);
    drop = battle.drop;
  }
  return { ...g, first, drop };
}

/* ---------- unlocks ---------- */

export function battleUnlocked(profile, battle) {
  return valor(profile) >= battle.valor;
}

export function nextLockedBattle(profile) {
  return BATTLES.find((b) => !battleUnlocked(profile, b)) || null;
}

export function arenaUnlocked(profile) {
  return (profile.battles.goliath?.won || 0) > 0;
}

/* ---------- streaks & daily orders ---------- */

export function touchStreak(profile) {
  const t = today();
  const s = profile.streak;
  if (s.last === t) return { changed: false, count: s.count };
  if (s.last && daysBetween(s.last, t) === 1) s.count += 1;
  else s.count = 1;
  s.last = t;
  profile.lastPlayed = Date.now();
  return { changed: true, count: s.count };
}

const ORDER_TEMPLATES = [
  { id: "learn", text: "Complete 3 Forge stages", target: 3, icon: "🔥" },
  { id: "master", text: "Master a new verse", target: 1, icon: "🗡️" },
  { id: "sharpen", text: "Sharpen 2 swords", target: 2, icon: "✨" },
  { id: "battle", text: "Win a battle or arena wave", target: 1, icon: "⚔️" },
  { id: "listen", text: "Listen to a verse read aloud", target: 1, icon: "👂" },
  { id: "gauntlet", text: "Run the Gauntlet (needs 3 mastered verses)", target: 1, icon: "⏱️" },
];

export function ensureOrders(profile) {
  const t = today();
  if (profile.orders.date === t && profile.orders.tasks.length) return profile.orders;
  const avail = ORDER_TEMPLATES.filter((x) => x.id !== "gauntlet" || gauntletUnlocked(profile));
  const day = Number(t.replace(/-/g, "")) % avail.length;
  const picks = [avail[day], avail[(day + 1) % avail.length], avail[(day + 3) % avail.length]];
  const seen = new Set();
  profile.orders = {
    date: t,
    claimed: false,
    completedCount: profile.orders.completedCount || 0,
    tasks: picks.filter((p) => !seen.has(p.id) && seen.add(p.id)).map((p) => ({ ...p, progress: 0 })),
  };
  return profile.orders;
}

/** Advance a daily order. kind: learn | master | sharpen | battle | listen */
export function bumpOrder(profile, kind, n = 1) {
  const o = ensureOrders(profile);
  const t = o.tasks.find((x) => x.id === kind);
  if (!t || t.progress >= t.target) return false;
  t.progress = Math.min(t.target, t.progress + n);
  return t.progress >= t.target;
}

export function ordersComplete(profile) {
  const o = ensureOrders(profile);
  return o.tasks.length > 0 && o.tasks.every((t) => t.progress >= t.target);
}

export function claimOrders(profile) {
  const o = ensureOrders(profile);
  if (o.claimed || !ordersComplete(profile)) return null;
  o.claimed = true;
  o.completedCount += 1;
  return grant(profile, ORDERS_CHEST);
}

/* ---------- badges ---------- */

export function checkBadges(profile, settings) {
  const earned = [];
  const has = (id) => profile.badges.includes(id);
  const give = (id) => {
    if (!has(id) && badgeById.has(id)) {
      profile.badges.push(id);
      earned.push(badgeById.get(id));
    }
  };
  const n = valor(profile);
  if (n >= 1) give("first_verse");
  if (n >= 5) give("five_verses");
  if (n >= 10) give("ten_verses");
  if (n >= 20) give("twenty_verses");
  if (n >= 30) give("thirty_verses");
  if (n >= 50) give("fifty_verses");
  if (allScrolls(settings).some((s) => s.verses.length >= 3 && s.verses.every((v) => isMastered(profile, v.id)))) give("scroll_done");
  if (profile.stats.perfectBlades >= 1) give("perfect_blade");
  if (profile.stats.recited >= 1) give("recite");
  if (profile.stats.recited >= 10) give("recite_ten");
  if ((profile.battles.lion?.won || 0) > 0) give("lion_slayer");
  if ((profile.battles.goliath?.won || 0) > 0) give("giant_slayer");
  if (BATTLES.every((b) => (profile.battles[b.id]?.won || 0) > 0)) give("campaign");
  if (RELIC_SET.every((id) => profile.owned.includes(id))) give("whole_armor");
  if (profile.streak.count >= 3) give("streak3");
  if (profile.streak.count >= 7) give("streak7");
  if (profile.streak.count >= 30) give("streak30");
  if (Object.values(profile.verses).some((v) => v.mastered && v.sharpness >= 5)) give("sharp_five");
  if (profile.arenaBest >= 10) give("arena10");
  if (profile.shekels >= 1000) give("rich");
  if (SLOTS.filter((s) => s.id !== "cloak").every((s) => profile.equipped[s.id] && profile.equipped[s.id] !== "staff")) give("geared");
  if (profile.orders.completedCount >= 7) give("orders7");
  if (profile.stats.spoken >= 1) give("spoken");
  if (profile.stats.spoken >= 10) give("spoken10");
  if (profile.stats.gauntletBest >= 15) give("gauntlet15");
  if (profile.stats.gauntletBest >= 30) give("gauntlet30");
  if (profile.stats.duelWins >= 1) give("duel_win");
  if (profile.stats.duelWins >= 5) give("duel5");
  return earned;
}

/** Everything a child might see summarized: progress per scroll. */
export function scrollProgress(profile, scroll) {
  const total = scroll.verses.length;
  const mastered = scroll.verses.filter((v) => isMastered(profile, v.id)).length;
  const started = scroll.verses.filter((v) => (profile.verses[v.id]?.stage || 0) > 0 && !isMastered(profile, v.id)).length;
  return { total, mastered, started };
}
