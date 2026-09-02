/**
 * Phonics Bowl save data — profile, season progress, coins, unlocks and
 * per-sound mastery (used by the adaptive item picker).
 */

const KEY = "phonics-bowl-v1";

export const HELMETS = [
  { id: "classic", name: "Classic", cost: 0, style: "solid" },
  { id: "stripe", name: "Racing Stripe", cost: 60, style: "stripe" },
  { id: "bolt", name: "Thunder Bolt", cost: 120, style: "bolt" },
  { id: "star", name: "All-Star", cost: 180, style: "star" },
  { id: "flame", name: "Flame", cost: 260, style: "flame" },
  { id: "chrome", name: "Chrome", cost: 340, style: "chrome" },
  { id: "galaxy", name: "Galaxy", cost: 450, style: "galaxy" },
  { id: "gold", name: "Golden", cost: 600, style: "gold" },
];

export const TEAM_COLORS = [
  { id: "rocket", name: "Rocket Red", primary: "#d7263d", secondary: "#ffd166" },
  { id: "ocean", name: "Ocean Blue", primary: "#1d6fd8", secondary: "#ffffff" },
  { id: "lime", name: "Lime Lightning", primary: "#3ec300", secondary: "#1b1b1b" },
  { id: "purple", name: "Purple Thunder", primary: "#7b2cbf", secondary: "#ffd60a" },
  { id: "orange", name: "Orange Crush", primary: "#ff7b00", secondary: "#1b3358" },
  { id: "teal", name: "Teal Tide", primary: "#0fa3b1", secondary: "#f9f7f3" },
  { id: "black", name: "Midnight", primary: "#222831", secondary: "#00e5ff" },
  { id: "pink", name: "Pink Blitz", primary: "#ff4fa3", secondary: "#ffffff" },
];

export const TEAM_NAMES = [
  "Rockets", "Sharks", "Dragons", "Lions", "Comets", "Wolves", "Jets", "Tigers",
  "Ninjas", "Robots", "Hawks", "Bears", "Blaze", "Storm", "Knights", "Cheetahs",
];

export const CELEBRATIONS = [
  { id: "spike", name: "Spike It", cost: 0, emoji: "🏈" },
  { id: "dance", name: "Dance Party", cost: 90, emoji: "🕺" },
  { id: "flip", name: "Backflip", cost: 150, emoji: "🤸" },
  { id: "fireworks", name: "Fireworks", cost: 240, emoji: "🎆" },
  { id: "dino", name: "Dino Stomp", cost: 320, emoji: "🦖" },
];

const DEFAULT = {
  v: 1,
  name: "Ezekiel",
  number: 7,
  team: { name: "Rockets", colors: "rocket", helmet: "classic", celebration: "spike" },
  mute: false,
  voiceRate: 0.92,
  coins: 0,
  unlocked: 1,
  stars: {},
  best: {},
  wins: {},
  trophies: [],
  owned: { helmets: ["classic"], celebrations: ["spike"] },
  mastery: {},
  tutorials: {},
  totals: { plays: 0, correct: 0, touchdowns: 0, yards: 0, games: 0, words: 0, streak: 0 },
  lastPlayed: 0,
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw);
    const s = structuredClone(DEFAULT);
    Object.assign(s, parsed);
    s.team = { ...DEFAULT.team, ...(parsed.team || {}) };
    s.owned = {
      helmets: [...new Set(["classic", ...((parsed.owned && parsed.owned.helmets) || [])])],
      celebrations: [...new Set(["spike", ...((parsed.owned && parsed.owned.celebrations) || [])])],
    };
    s.totals = { ...DEFAULT.totals, ...(parsed.totals || {}) };
    s.stars = { ...(parsed.stars || {}) };
    s.best = { ...(parsed.best || {}) };
    s.wins = { ...(parsed.wins || {}) };
    s.mastery = { ...(parsed.mastery || {}) };
    s.tutorials = { ...(parsed.tutorials || {}) };
    s.trophies = [...(parsed.trophies || [])];
    return s;
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function persist(state) {
  try {
    state.lastPlayed = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — game still plays */
  }
}

export function resetSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return structuredClone(DEFAULT);
}

export function teamColors(save) {
  return TEAM_COLORS.find((c) => c.id === save.team.colors) || TEAM_COLORS[0];
}

export function helmetStyle(save) {
  return (HELMETS.find((h) => h.id === save.team.helmet) || HELMETS[0]).style;
}

/** Record one answer against every key (grapheme or word) it exercised. */
export function recordMastery(save, keys, correct) {
  for (const k of keys) {
    if (!k) continue;
    const m = save.mastery[k] || { seen: 0, right: 0, wrong: 0, streak: 0 };
    m.seen += 1;
    if (correct) {
      m.right += 1;
      m.streak += 1;
    } else {
      m.wrong += 1;
      m.streak = 0;
    }
    m.last = Date.now();
    save.mastery[k] = m;
  }
}

/** 0..1 confidence that a key is known; unknown keys default to 0.5. */
export function masteryScore(save, key) {
  const m = save.mastery[key];
  if (!m || !m.seen) return 0.5;
  const acc = m.right / m.seen;
  const bonus = Math.min(0.15, m.streak * 0.03);
  return Math.max(0, Math.min(1, acc * 0.85 + bonus));
}

export function weakKeys(save, limit = 6) {
  return Object.entries(save.mastery)
    .filter(([, m]) => m.seen >= 2)
    .map(([k, m]) => ({ key: k, acc: m.right / m.seen, seen: m.seen, wrong: m.wrong }))
    .filter((x) => x.acc < 0.75)
    .sort((a, b) => a.acc - b.acc || b.wrong - a.wrong)
    .slice(0, limit);
}

export function strongKeys(save, limit = 8) {
  return Object.entries(save.mastery)
    .filter(([, m]) => m.seen >= 3)
    .map(([k, m]) => ({ key: k, acc: m.right / m.seen, seen: m.seen }))
    .filter((x) => x.acc >= 0.85)
    .sort((a, b) => b.acc - a.acc || b.seen - a.seen)
    .slice(0, limit);
}

export const TROPHIES = [
  { id: "first-win", name: "First Win", emoji: "🏆", how: "Win your first game." },
  { id: "hat-trick", name: "Hat Trick", emoji: "🎩", how: "Score 3 touchdowns in one game." },
  { id: "perfect", name: "Perfect Game", emoji: "💯", how: "Get every play right in a game." },
  { id: "on-fire", name: "On Fire", emoji: "🔥", how: "Get 6 plays right in a row." },
  { id: "speedster", name: "Speedster", emoji: "⚡", how: "Make 5 big plays in one game." },
  { id: "century", name: "100 Words", emoji: "📚", how: "Read 100 words." },
  { id: "half-season", name: "Halfway Hero", emoji: "🌟", how: "Win 6 games." },
  { id: "champion", name: "Bowl Champion", emoji: "🏅", how: "Win the Phonics Bowl." },
  { id: "rich", name: "Coin Collector", emoji: "🪙", how: "Earn 500 coins." },
  { id: "kicker", name: "Golden Boot", emoji: "🥾", how: "Make 10 field goals." },
];

export function awardTrophy(save, id) {
  if (save.trophies.includes(id)) return false;
  save.trophies.push(id);
  return true;
}
