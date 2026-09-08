/**
 * Training Camp data — phonics fundamentals as drill content: vowel sounds,
 * sound twins (pairs), word families (onset + rime), and sound-hunting sets.
 */

import { STAGES, ALL_WORDS, KEYWORDS, shuffle, pick, magicKey } from "../curriculum.js";

export const DRILLS = [
  { id: "vowels", title: "Vowel Kicks", emoji: "🥅", sky: "day", minStage: 1,
    blurb: "Hear the vowel, kick it through the right upright. Short vowels, then long vowels.",
    coach: "Vowel Kicks! Every word has a vowel. Listen to the sound, then kick the ball through the matching upright!" },
  { id: "twins", title: "Sound Twins", emoji: "🪖", sky: "sunset", minStage: 1,
    blurb: "Flip the helmets and match each sound with its twin: a picture, or another spelling of the same sound.",
    coach: "Sound Twins! Flip two helmets. If they make the same sound, they're twins and you keep them!" },
  { id: "families", title: "Word Family Huddle", emoji: "🏃", sky: "day", minStage: 2,
    blurb: "Build word families like cat, hat, bat. Real words break the tackle — fake words get stopped!",
    coach: "Word Family Huddle! The end of the word stays the same. Tap a first sound that makes a REAL word to run it in!" },
  { id: "catch", title: "Sound Catch", emoji: "🙌", sky: "night", minStage: 2,
    blurb: "Punts fly across the field. Catch only the words that have the target sound!",
    coach: "Sound Catch! Words are flying at you. Catch the ones with the target sound — let the others drop!" },
  { id: "blitz", title: "Blend Blitz", emoji: "⚡", sky: "sunset", minStage: 3,
    blurb: "Two-minute drill! Blend as many words as you can before the clock hits zero.",
    coach: "Blend Blitz! Tap the sounds, throw the word. How many can you blend before the clock runs out?" },
  { id: "coach", title: "Coach's Drill", emoji: "📋", sky: "day", minStage: 1,
    blurb: "A short game built from the sounds and words you've missed most.",
    coach: "" },
];

export const SHORT_VOWELS = [
  { g: "a", clip: "a", word: "apple", pic: "🍎" },
  { g: "e", clip: "e", word: "egg", pic: "🥚" },
  { g: "i", clip: "i", word: "igloo", pic: "🧊" },
  { g: "o", clip: "o", word: "octopus", pic: "🐙" },
  { g: "u", clip: "u", word: "umbrella", pic: "☂️" },
];

export const LONG_VOWELS = [
  { g: "a", clip: "long-a", word: "cake", pic: "🎂" },
  { g: "e", clip: "long-e", word: "bee", pic: "🐝" },
  { g: "i", clip: "long-i", word: "bike", pic: "🚲" },
  { g: "o", clip: "long-o", word: "boat", pic: "⛵" },
  { g: "u", clip: "long-u", word: "cube", pic: "🧊" },
];

const CVC_WITH_PIC = ALL_WORDS.filter((w) => w.kind === "word" && w.pic && w.g.length === 3 && "aeiou".includes(w.g[1]));
const LONG_WITH_PIC = ALL_WORDS.filter((w) => w.pic && (w.kind === "magic-e" || (w.kind === "team" && w.g.some((g) => ["ai", "ay", "ee", "ea", "oa", "ow"].includes(g)))));

function longVowelOf(item) {
  const mk = magicKey(item);
  if (mk) return mk[0];
  const g = item.g.find((x) => ["ai", "ay", "ee", "ea", "oa", "ow"].includes(x));
  return g ? { ai: "a", ay: "a", ee: "e", ea: "e", oa: "o", ow: "o" }[g] : null;
}

/**
 * Vowel Kicks rounds. Types:
 *  sound  – hear a short vowel, pick the letter
 *  word   – picture + spoken CVC word, pick the vowel in the middle
 *  long   – hear a long vowel ("says its name"), pick the letter
 *  longword – picture + word with a long vowel, pick the vowel
 */
export function vowelRounds(n = 15, level = 1) {
  const rounds = [];
  const seq = [];
  for (let i = 0; i < n; i++) {
    const u = i / n;
    if (level >= 2 && u > 0.7) seq.push(i % 2 ? "longword" : "long");
    else if (u > 0.35) seq.push("word");
    else seq.push("sound");
  }
  let lastG = "";
  for (const type of seq) {
    if (type === "sound" || type === "long") {
      const set = type === "sound" ? SHORT_VOWELS : LONG_VOWELS;
      let v = pick(set);
      if (v.g === lastG) v = pick(set);
      lastG = v.g;
      rounds.push({ type, answer: v.g, clip: v.clip, hint: v });
    } else if (type === "word") {
      let w = pick(CVC_WITH_PIC);
      if (w.g[1] === lastG) w = pick(CVC_WITH_PIC);
      lastG = w.g[1];
      rounds.push({ type, answer: w.g[1], clip: w.g[1], item: w });
    } else {
      let w = pick(LONG_WITH_PIC);
      let v = longVowelOf(w);
      if (!v || v === lastG) { w = pick(LONG_WITH_PIC); v = longVowelOf(w) || "a"; }
      lastG = v;
      rounds.push({ type, answer: v, clip: `long-${v}`, item: w });
    }
  }
  return rounds;
}

/* ---------- Sound Twins ---------- */

const KEYWORD_PAIRS = ["s", "m", "t", "p", "n", "d", "b", "f", "l", "r", "h", "j", "w", "z", "sh", "ch", "th", "ck", "st", "tr", "bl", "fl", "gr", "sn", "dr", "ar", "or", "ee", "oa", "ai"]
  .map((g) => ({ a: g, b: KEYWORDS[g][1], say: g, word: KEYWORDS[g][0], kind: "keyword" }));

const SPELLING_TWINS = [
  { a: "ai", b: "ay", say: "ai", kind: "spelling", note: "ai and ay both say the long a sound" },
  { a: "ee", b: "ea", say: "ee", kind: "spelling", note: "ee and ea both say the long e sound" },
  { a: "oa", b: "ow", say: "oa", kind: "spelling", note: "oa and ow can both say the long o sound" },
  { a: "er", b: "ir", say: "er", kind: "spelling", note: "er and ir both say er" },
  { a: "ur", b: "er", say: "ur", kind: "spelling", note: "ur and er both say er" },
  { a: "c", b: "k", say: "c", kind: "spelling", note: "c and k both say kuh" },
  { a: "ck", b: "k", say: "ck", kind: "spelling", note: "ck and k both say kuh" },
  { a: "a_e", b: "ai", say: "a_e", kind: "spelling", note: "magic e and ai both say the long a sound" },
  { a: "i_e", b: "igh", say: "i_e", kind: "spelling", note: "magic e and igh both say the long i sound" },
  { a: "o_e", b: "oa", say: "o_e", kind: "spelling", note: "magic e and oa both say the long o sound" },
];

/** Six pairs for a game, harder pairs unlocking with season progress. */
export function twinPairs(level = 1) {
  const easy = KEYWORD_PAIRS.filter((p) => p.a.length === 1);
  const mid = KEYWORD_PAIRS.filter((p) => p.a.length === 2);
  const take = (list, n, out) => {
    for (const p of shuffle([...list])) {
      if (out.length >= n) break;
      const faces = new Set(out.flatMap((q) => [q.a, q.b]));
      if (!faces.has(p.a) && !faces.has(p.b)) out.push(p);
    }
    return out;
  };
  const out = [];
  if (level <= 2) take(easy, 6, out);
  else if (level <= 6) { take(easy, 3, out); take(mid, 6, out); }
  else { take(mid, 3, out); take(SPELLING_TWINS, 6, out); }
  return shuffle(out);
}

/* ---------- Word Family Huddle ---------- */

export const FAMILIES = [
  { rime: "at", g: ["a", "t"], real: ["c", "h", "b", "m", "r", "s", "f", "p"], fake: ["z", "j", "w", "y"], pics: { cat: "🐱", hat: "🎩", bat: "🦇", mat: "🧘", rat: "🐀" } },
  { rime: "an", g: ["a", "n"], real: ["c", "f", "m", "p", "r", "t", "v"], fake: ["j", "z", "w", "l"], pics: { can: "🥫", fan: "💨", man: "👨", pan: "🍳", van: "🚐" } },
  { rime: "ap", g: ["a", "p"], real: ["c", "m", "n", "t", "l", "g", "z", "s"], fake: ["d", "w", "v", "y"], pics: { cap: "🧢", map: "🗺️", nap: "😴", tap: "🚰" } },
  { rime: "ig", g: ["i", "g"], real: ["b", "d", "f", "p", "w", "j"], fake: ["m", "n", "s", "z"], pics: { pig: "🐷", fig: "🍈", wig: "💇" } },
  { rime: "in", g: ["i", "n"], real: ["b", "f", "p", "t", "w"], fake: ["j", "z", "l", "v"], pics: { bin: "🗑️", fin: "🐟", pin: "📌", win: "🏆" } },
  { rime: "op", g: ["o", "p"], real: ["h", "m", "p", "t", "c"], fake: ["j", "z", "w", "v"], pics: { hop: "🐇", mop: "🧹", pop: "🎈", top: "🔝", cop: "👮" } },
  { rime: "ot", g: ["o", "t"], real: ["h", "p", "d", "c", "g", "l", "n"], fake: ["z", "j", "w", "v"], pics: { hot: "🥵", pot: "🍲", dot: "⚫", cot: "🛏️" } },
  { rime: "ug", g: ["u", "g"], real: ["b", "h", "j", "m", "r", "t", "d"], fake: ["z", "w", "v", "s"], pics: { bug: "🐛", hug: "🤗", jug: "🏺", mug: "☕", rug: "🟫" } },
  { rime: "un", g: ["u", "n"], real: ["b", "f", "r", "s"], fake: ["j", "z", "w", "v"], pics: { bun: "🥐", fun: "🎉", run: "🏃", sun: "☀️" } },
  { rime: "et", g: ["e", "t"], real: ["j", "n", "p", "w", "v", "g"], fake: ["z", "d", "k", "r"], pics: { jet: "✈️", net: "🥅", pet: "🐶", wet: "💧", vet: "👩‍⚕️" } },
  { rime: "ake", g: ["a", "k", "e"], kind: "magic-e", real: ["b", "c", "l", "m", "r", "t", "w"], fake: ["z", "j", "v", "g"], pics: { bake: "🧁", cake: "🎂", lake: "🏞️", rake: "🍂" }, minStage: 9 },
  { rime: "ide", g: ["i", "d", "e"], kind: "magic-e", real: ["h", "r", "s", "t", "w"], fake: ["z", "j", "v", "m"], pics: { hide: "🙈", ride: "🎢", side: "↔️", tide: "🌊" }, minStage: 9 },
  { rime: "ail", g: ["ai", "l"], kind: "team", real: ["m", "n", "p", "r", "s", "t"], fake: ["z", "v", "d", "g"], pics: { mail: "📬", nail: "💅", pail: "🪣", sail: "⛵", tail: "🐕" }, minStage: 10 },
  { rime: "eat", g: ["ea", "t"], kind: "team", real: ["b", "h", "m", "n", "s"], fake: ["z", "j", "v", "d"], pics: { heat: "🔥", meat: "🍖", seat: "💺", neat: "✨" }, minStage: 10 },
  { rime: "ing", g: ["i", "ng"], kind: "endblend", real: ["k", "r", "s", "w"], fake: ["j", "z", "v", "m"], pics: { king: "🤴", ring: "💍", sing: "🎤", wing: "🐦" }, minStage: 7 },
  { rime: "ock", g: ["o", "ck"], kind: "digraph", real: ["d", "l", "r", "s"], fake: ["z", "j", "v", "g"], pics: { dock: "⚓", lock: "🔒", rock: "🪨", sock: "🧦" }, minStage: 5 },
];

/** Rounds for the huddle: each has a rime and 4 onsets (2 real, 2 fake). */
export function familyRounds(n = 8, level = 1) {
  const pool = FAMILIES.filter((f) => !f.minStage || f.minStage <= level);
  const fams = shuffle([...pool]).slice(0, n);
  while (fams.length < n) fams.push(pick(pool));
  return fams.map((f) => {
    const real = shuffle([...f.real]).slice(0, 2);
    const fake = shuffle([...f.fake]).slice(0, 2);
    const onsets = shuffle([...real.map((o) => ({ o, real: true })), ...fake.map((o) => ({ o, real: false }))]);
    return { family: f, onsets, real, fake };
  });
}

export function familyWord(f, onset) {
  return { word: onset + f.rime, g: [onset, ...f.g], kind: f.kind || "word", pic: (f.pics || {})[onset + f.rime] || null };
}

/* ---------- Sound Catch ---------- */

const WORD_STAGES = STAGES.filter((s) => s.focus !== "letters" && s.focus !== "sight");

/** Target sound + words that do / don't contain it, scaled to season progress. */
export function catchSet(level = 1) {
  const has = (x, t) => (t.includes("_") ? magicKey(x) === t : x.g.map((g) => g.toLowerCase()).includes(t));
  let targets;
  if (level < 5) targets = ["a", "i", "o", "e", "u"];
  else targets = [...new Set(WORD_STAGES.filter((s) => s.id <= level).flatMap((s) => s.targets || []))];
  const words = WORD_STAGES.filter((s) => s.id <= Math.max(4, level)).flatMap((s) => s.words);
  const seen = new Set();
  const uniq = words.filter((w) => { const k = w.word.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  for (let tries = 0; tries < 20; tries++) {
    const t = pick(targets);
    const yes = uniq.filter((w) => has(w, t));
    const no = uniq.filter((w) => !has(w, t));
    if (yes.length >= 6 && no.length >= 6) return { target: t, yes: shuffle(yes), no: shuffle(no) };
  }
  const t = "a";
  return { target: t, yes: uniq.filter((w) => has(w, t)), no: uniq.filter((w) => !has(w, t)) };
}

/* ---------- Blend Blitz ---------- */

export function blitzWords(level = 1) {
  const stages = WORD_STAGES.filter((s) => s.id <= Math.max(3, level));
  const words = stages.flatMap((s) => s.words).filter((w) => w.g.length >= 3 && w.g.length <= 4);
  const seen = new Set();
  return shuffle(words.filter((w) => { const k = w.word.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }));
}

/** Stage-based difficulty level for camp drills. */
export function campLevel(save) {
  return Math.max(1, save.unlocked || 1);
}
