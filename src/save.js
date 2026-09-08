/**
 * Phonics Bowl save data — profile, season progress, coins, unlocks and
 * per-sound mastery (used by the adaptive item picker).
 */

const KEY = "phonics-bowl-v1";
const PROFILES_KEY = "phonics-bowl-profiles";

/** Buddy mascots a child picks when their profile is created. */
export const BUDDIES = [
  { id: "pup", emoji: "🐶", name: "Blitz the Pup" }, { id: "cat", emoji: "🐱", name: "Whiskers" },
  { id: "frog", emoji: "🐸", name: "Hopper" }, { id: "dino", emoji: "🦖", name: "Rexy" },
  { id: "unicorn", emoji: "🦄", name: "Sparkle" }, { id: "panda", emoji: "🐼", name: "Bamboo" },
  { id: "penguin", emoji: "🐧", name: "Waddles" }, { id: "fox", emoji: "🦊", name: "Zoom" },
  { id: "monkey", emoji: "🐵", name: "Bananas" }, { id: "robot", emoji: "🤖", name: "Beep" },
];

export const RANKS = [
  { xp: 0, name: "Rookie", emoji: "🌱" }, { xp: 150, name: "Starter", emoji: "⭐" }, { xp: 450, name: "Star Player", emoji: "🌟" },
  { xp: 900, name: "All-Pro", emoji: "🏅" }, { xp: 1600, name: "MVP", emoji: "🏆" }, { xp: 2600, name: "Hall of Famer", emoji: "👑" },
  { xp: 4000, name: "Legend", emoji: "🐐" },
];

export function rankFor(xp) {
  let r = RANKS[0];
  for (const x of RANKS) if (xp >= x.xp) r = x;
  const next = RANKS[RANKS.indexOf(r) + 1] || null;
  return { ...r, next, progress: next ? (xp - r.xp) / (next.xp - r.xp) : 1 };
}

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
  camp: {},
  mode: "pro",
  buddy: "pup",
  xp: 0,
  stickers: [],
  daily: { last: "", streak: 0, claimed: "" },
  rookie: { unlocked: 1, stars: {}, letters: {} },
  totals: { plays: 0, correct: 0, touchdowns: 0, yards: 0, games: 0, words: 0, streak: 0 },
  lastPlayed: 0,
};

/* ---------- profiles (several children on one device) ---------- */

function readProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { active: "", list: [] };
}

function writeProfiles(p) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

function keyFor(id) {
  return id ? `${KEY}:${id}` : KEY;
}

export function listProfiles() {
  const p = readProfiles();
  return p.list.map((x) => ({ ...x, active: x.id === p.active }));
}

export function activeProfileId() {
  return readProfiles().active || "";
}

export function setActiveProfile(id) {
  const p = readProfiles();
  p.active = id;
  writeProfiles(p);
}

export function createProfile({ name, mode = "pro", buddy = "pup" }) {
  const p = readProfiles();
  const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  p.list.push({ id, name, mode, buddy });
  p.active = id;
  writeProfiles(p);
  const s = structuredClone(DEFAULT);
  s.name = name;
  s.mode = mode;
  s.buddy = buddy;
  persist(s);
  return s;
}

export function updateProfileMeta(save) {
  const p = readProfiles();
  const rec = p.list.find((x) => x.id === p.active);
  if (rec) { rec.name = save.name; rec.mode = save.mode; rec.buddy = save.buddy; writeProfiles(p); }
}

export function deleteProfile(id) {
  const p = readProfiles();
  p.list = p.list.filter((x) => x.id !== id);
  if (p.active === id) p.active = p.list[0] ? p.list[0].id : "";
  writeProfiles(p);
  try { localStorage.removeItem(keyFor(id)); } catch { /* ignore */ }
}

export function loadSave() {
  try {
    const profiles = readProfiles();
    // First run with an existing single-player save: adopt it as the first profile.
    if (!profiles.list.length && localStorage.getItem(KEY)) {
      const legacy = JSON.parse(localStorage.getItem(KEY));
      const id = "p-legacy";
      writeProfiles({ active: id, list: [{ id, name: legacy.name || "Player", mode: legacy.mode || "pro", buddy: legacy.buddy || "pup" }] });
      localStorage.setItem(keyFor(id), localStorage.getItem(KEY));
      localStorage.removeItem(KEY);
    }
    const raw = localStorage.getItem(keyFor(readProfiles().active));
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
    s.camp = { ...(parsed.camp || {}) };
    s.daily = { ...DEFAULT.daily, ...(parsed.daily || {}) };
    s.rookie = { ...structuredClone(DEFAULT.rookie), ...(parsed.rookie || {}) };
    s.rookie.stars = { ...(s.rookie.stars || {}) };
    s.rookie.letters = { ...(s.rookie.letters || {}) };
    s.stickers = [...(parsed.stickers || [])];
    s.trophies = [...(parsed.trophies || [])];
    return s;
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function persist(state) {
  try {
    state.lastPlayed = Date.now();
    localStorage.setItem(keyFor(readProfiles().active), JSON.stringify(state));
  } catch {
    /* private mode / quota — game still plays */
  }
}

/** Erase the active profile's progress (keeps the profile itself). */
export function resetSave() {
  const p = readProfiles();
  const rec = p.list.find((x) => x.id === p.active);
  try { localStorage.removeItem(keyFor(p.active)); } catch { /* ignore */ }
  const s = structuredClone(DEFAULT);
  if (rec) { s.name = rec.name; s.mode = rec.mode; s.buddy = rec.buddy; }
  return s;
}

export function buddyFor(save) {
  return BUDDIES.find((b) => b.id === save.buddy) || BUDDIES[0];
}

export function isRookie(save) {
  return save.mode === "rookie";
}

/** Add experience; returns the new rank if the player just ranked up. */
export function addXp(save, amount) {
  const before = rankFor(save.xp).name;
  save.xp += Math.max(0, Math.round(amount));
  const after = rankFor(save.xp);
  return after.name !== before ? after : null;
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Update the daily streak; returns true when a new day's gift is available. */
export function touchDaily(save) {
  const today = todayKey();
  if (save.daily.last === today) return save.daily.claimed !== today;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yesterday = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
  save.daily.streak = save.daily.last === yesterday ? (save.daily.streak || 0) + 1 : 1;
  save.daily.last = today;
  return true;
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
