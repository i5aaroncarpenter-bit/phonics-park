/**
 * Save data lives in localStorage. One save holds family settings plus a
 * profile per child so siblings can share a device and compete on the
 * Roll of the Mighty.
 */

const KEY = "mightymen.save.v1";

export const LOOKS = {
  body: ["boy", "girl"],
  skin: ["#f4c9a5", "#e0a880", "#c68b5b", "#9c6440", "#6b4128"],
  hair: ["#2b1b12", "#5a3a1e", "#a0642c", "#d9a441", "#8a8a8a", "#c33b2b"],
  hairStyle: ["short", "curly", "long", "braids", "ponytail", "bun"],
  tunic: ["#7a4b2a", "#2f5d8a", "#5a7f3a", "#8a3a3a", "#6a4a8a", "#3a7f7a", "#b04a7a"],
};

export function isGirl(profile) {
  return profile?.look?.body === "girl";
}

export function defaultSettings() {
  return {
    translation: "web",
    tts: true,
    music: true,
    sfx: true,
    pin: "",
    customVerses: [],
    overrides: {},
  };
}

export function newProfile(name, look = {}) {
  return {
    id: "p" + Math.random().toString(36).slice(2, 9),
    name: String(name || "Warrior").slice(0, 16),
    look: {
      body: look.body ?? "boy",
      skin: look.skin ?? LOOKS.skin[1],
      hair: look.hair ?? LOOKS.hair[1],
      hairStyle: look.hairStyle ?? (look.body === "girl" ? "long" : "short"),
      tunic: look.tunic ?? LOOKS.tunic[0],
    },
    createdAt: Date.now(),
    shekels: 0,
    xp: 0,
    equipped: { sword: "staff", shield: null, helmet: null, breastplate: null, belt: null, sandals: null, cloak: null },
    owned: ["staff"],
    verses: {},
    battles: {},
    arenaBest: 0,
    badges: [],
    streak: { last: "", count: 0 },
    orders: { date: "", tasks: [], claimed: false, completedCount: 0 },
    stats: { stagesDone: 0, sharpenDone: 0, battlesWon: 0, perfectBlades: 0, recited: 0, shekelsEarned: 0, spoken: 0, duelsPlayed: 0, duelWins: 0, gauntletRuns: 0, gauntletBest: 0 },
    lastPlayed: 0,
  };
}

export function loadSave() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    data = null;
  }
  if (!data || typeof data !== "object") data = { version: 1, settings: defaultSettings(), profiles: [], active: null };
  data.settings = { ...defaultSettings(), ...(data.settings || {}) };
  data.profiles = Array.isArray(data.profiles) ? data.profiles : [];
  for (const p of data.profiles) hydrateProfile(p);
  return data;
}

function hydrateProfile(p) {
  const fresh = newProfile(p.name, p.look);
  for (const k of Object.keys(fresh)) if (p[k] === undefined) p[k] = fresh[k];
  p.look = { ...fresh.look, ...(p.look || {}) };
  p.stats = { ...fresh.stats, ...(p.stats || {}) };
  p.equipped = { ...fresh.equipped, ...(p.equipped || {}) };
  p.orders = { ...fresh.orders, ...(p.orders || {}) };
  p.streak = { ...fresh.streak, ...(p.streak || {}) };
  if (!p.owned.includes("staff")) p.owned.push("staff");
}

export function persist(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage full or blocked; play on */
  }
}

export function activeProfile(save) {
  return save.profiles.find((p) => p.id === save.active) || null;
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(a, b) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / 86400000);
}

export function exportSave(save) {
  return JSON.stringify(save);
}

export function importSave(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.profiles)) throw new Error("Not a Mighty Men save file");
  return data;
}

export function wipe() {
  localStorage.removeItem(KEY);
}
