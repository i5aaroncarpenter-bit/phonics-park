const KEY = "phonics-park-v1";

const DEFAULT = {
  name: "Ezekiel",
  jersey: 21,
  mute: false,
  highScore: 0,
  seenTutorial: false,
  levelReached: { atbat: 1, defense: 1, pitching: 1 },
  lastClearMs: { atbat: {}, defense: {}, pitching: {} },
  passed: { atbat: {}, defense: {}, pitching: {} },
  totalRuns: 0,
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT),
      ...parsed,
      levelReached: { ...DEFAULT.levelReached, ...(parsed.levelReached || {}) },
      lastClearMs: {
        atbat: { ...(parsed.lastClearMs?.atbat || {}) },
        defense: { ...(parsed.lastClearMs?.defense || {}) },
        pitching: { ...(parsed.lastClearMs?.pitching || {}) },
      },
      passed: {
        atbat: { ...(parsed.passed?.atbat || {}) },
        defense: { ...(parsed.passed?.defense || {}) },
        pitching: { ...(parsed.passed?.pitching || {}) },
      },
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function persist(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — game still plays */
  }
}

export function patchSave(state, partial) {
  Object.assign(state, partial);
  persist(state);
  return state;
}

/** Map prior clear time to 1.05 (slow) … 1.15 (fast). */
export function heatFromClearMs(lastClearMs) {
  if (!lastClearMs || lastClearMs <= 0) return 1;
  const slow = 140000;
  const fast = 35000;
  const t = Math.min(slow, Math.max(fast, lastClearMs));
  const u = (slow - t) / (slow - fast);
  return Math.round((1.05 + u * 0.1) * 1000) / 1000;
}

export function heatLabel(heat) {
  if (!heat || heat <= 1) return "";
  const pct = Math.round((heat - 1) * 100);
  return `+${pct}% heat`;
}

export function heatForNextLevel(save, mode, nextLevelId) {
  const prior = nextLevelId - 1;
  const ms = save.lastClearMs?.[mode]?.[String(prior)];
  return heatFromClearMs(ms);
}
