/** Phonics Park curriculum — L1–L6. Graphemes are kid-facing tiles. */

export const LEVELS = [
  {
    id: 1,
    name: "Letter Sounds",
    inning: "1st Inning",
    blurb: "Hear a letter. Tap its sound.",
    focus: "letter",
    atBats: 10,
    passRate: 0.8,
    baseMs: 10000,
    decoys: 2,
    items: [
      { word: "m", graphemes: ["m"], kind: "letter", hint: "mmm like yum" },
      { word: "s", graphemes: ["s"], kind: "letter", hint: "ssss like a snake" },
      { word: "a", graphemes: ["a"], kind: "letter", hint: "aaa like apple" },
      { word: "t", graphemes: ["t"], kind: "letter", hint: "t like tap" },
      { word: "p", graphemes: ["p"], kind: "letter", hint: "p like pop" },
      { word: "n", graphemes: ["n"], kind: "letter", hint: "nnn like nose" },
      { word: "i", graphemes: ["i"], kind: "letter", hint: "iii like icky" },
      { word: "d", graphemes: ["d"], kind: "letter", hint: "d like dog" },
      { word: "o", graphemes: ["o"], kind: "letter", hint: "ooo like octopus" },
      { word: "c", graphemes: ["c"], kind: "letter", hint: "c like cat (k)" },
      { word: "g", graphemes: ["g"], kind: "letter", hint: "g like go" },
    ],
  },
  {
    id: 2,
    name: "CVC Words",
    inning: "2nd Inning",
    blurb: "Tap the sounds. Blend the word.",
    focus: "cvc",
    atBats: 10,
    passRate: 0.8,
    baseMs: 8000,
    decoys: 3,
    items: [
      { word: "cat", graphemes: ["c", "a", "t"], kind: "cvc" },
      { word: "sit", graphemes: ["s", "i", "t"], kind: "cvc" },
      { word: "mop", graphemes: ["m", "o", "p"], kind: "cvc" },
      { word: "pin", graphemes: ["p", "i", "n"], kind: "cvc" },
      { word: "dog", graphemes: ["d", "o", "g"], kind: "cvc" },
      { word: "map", graphemes: ["m", "a", "p"], kind: "cvc" },
      { word: "pot", graphemes: ["p", "o", "t"], kind: "cvc" },
      { word: "tin", graphemes: ["t", "i", "n"], kind: "cvc" },
      { word: "cap", graphemes: ["c", "a", "p"], kind: "cvc" },
      { word: "man", graphemes: ["m", "a", "n"], kind: "cvc" },
      { word: "sad", graphemes: ["s", "a", "d"], kind: "cvc" },
      { word: "top", graphemes: ["t", "o", "p"], kind: "cvc" },
      { word: "mat", graphemes: ["m", "a", "t"], kind: "cvc" },
      { word: "sat", graphemes: ["s", "a", "t"], kind: "cvc" },
      { word: "tap", graphemes: ["t", "a", "p"], kind: "cvc" },
      { word: "nap", graphemes: ["n", "a", "p"], kind: "cvc" },
      { word: "pit", graphemes: ["p", "i", "t"], kind: "cvc" },
      { word: "dip", graphemes: ["d", "i", "p"], kind: "cvc" },
      { word: "sip", graphemes: ["s", "i", "p"], kind: "cvc" },
      { word: "pad", graphemes: ["p", "a", "d"], kind: "cvc" },
      { word: "dad", graphemes: ["d", "a", "d"], kind: "cvc" },
      { word: "pop", graphemes: ["p", "o", "p"], kind: "cvc" },
      { word: "cot", graphemes: ["c", "o", "t"], kind: "cvc" },
      { word: "not", graphemes: ["n", "o", "t"], kind: "cvc" },
      { word: "nod", graphemes: ["n", "o", "d"], kind: "cvc" },
      { word: "did", graphemes: ["d", "i", "d"], kind: "cvc" },
      { word: "tip", graphemes: ["t", "i", "p"], kind: "cvc" },
      { word: "tan", graphemes: ["t", "a", "n"], kind: "cvc" },
      { word: "pan", graphemes: ["p", "a", "n"], kind: "cvc" },
      { word: "can", graphemes: ["c", "a", "n"], kind: "cvc" },
      { word: "tag", graphemes: ["t", "a", "g"], kind: "cvc" },
      { word: "dig", graphemes: ["d", "i", "g"], kind: "cvc" },
      { word: "gap", graphemes: ["g", "a", "p"], kind: "cvc" },
      { word: "got", graphemes: ["g", "o", "t"], kind: "cvc" },
      { word: "dot", graphemes: ["d", "o", "t"], kind: "cvc" },
      { word: "pod", graphemes: ["p", "o", "d"], kind: "cvc" },
      { word: "nag", graphemes: ["n", "a", "g"], kind: "cvc" },
      { word: "dim", graphemes: ["d", "i", "m"], kind: "cvc" },
      { word: "cog", graphemes: ["c", "o", "g"], kind: "cvc" },
    ],
  },
  {
    id: 3,
    name: "Beginning Blends",
    inning: "3rd Inning",
    blurb: "st, sl, tr, bl — two letters, one slide.",
    focus: "blend",
    atBats: 10,
    passRate: 0.8,
    baseMs: 7500,
    decoys: 3,
    items: [
      { word: "stop", graphemes: ["st", "o", "p"], kind: "blend", pitch: "st" },
      { word: "slip", graphemes: ["sl", "i", "p"], kind: "blend", pitch: "sl" },
      { word: "trip", graphemes: ["tr", "i", "p"], kind: "blend", pitch: "tr" },
      { word: "blot", graphemes: ["bl", "o", "t"], kind: "blend", pitch: "bl" },
      { word: "slam", graphemes: ["sl", "a", "m"], kind: "blend", pitch: "sl" },
      { word: "trap", graphemes: ["tr", "a", "p"], kind: "blend", pitch: "tr" },
      { word: "blip", graphemes: ["bl", "i", "p"], kind: "blend", pitch: "bl" },
      { word: "stag", graphemes: ["st", "a", "g"], kind: "blend", pitch: "st" },
      { word: "slim", graphemes: ["sl", "i", "m"], kind: "blend", pitch: "sl" },
      { word: "trot", graphemes: ["tr", "o", "t"], kind: "blend", pitch: "tr" },
      { word: "blob", graphemes: ["bl", "o", "b"], kind: "blend", pitch: "bl" },
      { word: "stan", graphemes: ["st", "a", "n"], kind: "blend", pitch: "st" },
      { word: "slot", graphemes: ["sl", "o", "t"], kind: "blend", pitch: "sl" },
      { word: "trim", graphemes: ["tr", "i", "m"], kind: "blend", pitch: "tr" },
      { word: "slap", graphemes: ["sl", "a", "p"], kind: "blend", pitch: "sl" },
      { word: "tram", graphemes: ["tr", "a", "m"], kind: "blend", pitch: "tr" },
      { word: "stem", graphemes: ["st", "e", "m"], kind: "blend", pitch: "st" },
      { word: "slid", graphemes: ["sl", "i", "d"], kind: "blend", pitch: "sl" },
    ],
  },
  {
    id: 4,
    name: "Digraphs",
    inning: "4th Inning",
    blurb: "sh, ch, th, ck — two letters, one sound.",
    focus: "digraph",
    atBats: 8,
    passRate: 0.8,
    baseMs: 7000,
    decoys: 3,
    items: [
      { word: "ship", graphemes: ["sh", "i", "p"], kind: "digraph", pitch: "sh" },
      { word: "chop", graphemes: ["ch", "o", "p"], kind: "digraph", pitch: "ch" },
      { word: "thin", graphemes: ["th", "i", "n"], kind: "digraph", pitch: "th" },
      { word: "sock", graphemes: ["s", "o", "ck"], kind: "digraph", pitch: "ck" },
      { word: "shop", graphemes: ["sh", "o", "p"], kind: "digraph", pitch: "sh" },
      { word: "chat", graphemes: ["ch", "a", "t"], kind: "digraph", pitch: "ch" },
      { word: "that", graphemes: ["th", "a", "t"], kind: "digraph", pitch: "th" },
      { word: "pack", graphemes: ["p", "a", "ck"], kind: "digraph", pitch: "ck" },
      { word: "sick", graphemes: ["s", "i", "ck"], kind: "digraph", pitch: "ck" },
      { word: "chip", graphemes: ["ch", "i", "p"], kind: "digraph", pitch: "ch" },
      { word: "math", graphemes: ["m", "a", "th"], kind: "digraph", pitch: "th" },
      { word: "cash", graphemes: ["c", "a", "sh"], kind: "digraph", pitch: "sh" },
    ],
  },
  {
    id: 5,
    name: "Silent E",
    inning: "5th Inning",
    blurb: "The sneaky e makes the vowel say its name.",
    focus: "silent-e",
    atBats: 8,
    passRate: 0.8,
    baseMs: 7000,
    decoys: 3,
    items: [
      { word: "cape", graphemes: ["c", "a", "p", "e"], kind: "silent-e", pitch: "a" },
      { word: "bike", graphemes: ["b", "i", "k", "e"], kind: "silent-e", pitch: "i" },
      { word: "hope", graphemes: ["h", "o", "p", "e"], kind: "silent-e", pitch: "o" },
      { word: "tape", graphemes: ["t", "a", "p", "e"], kind: "silent-e", pitch: "a" },
      { word: "made", graphemes: ["m", "a", "d", "e"], kind: "silent-e", pitch: "a" },
      { word: "pine", graphemes: ["p", "i", "n", "e"], kind: "silent-e", pitch: "i" },
      { word: "cone", graphemes: ["c", "o", "n", "e"], kind: "silent-e", pitch: "o" },
      { word: "game", graphemes: ["g", "a", "m", "e"], kind: "silent-e", pitch: "a" },
      { word: "note", graphemes: ["n", "o", "t", "e"], kind: "silent-e", pitch: "o" },
      { word: "ride", graphemes: ["r", "i", "d", "e"], kind: "silent-e", pitch: "i" },
      { word: "cake", graphemes: ["c", "a", "k", "e"], kind: "silent-e", pitch: "a" },
      { word: "bone", graphemes: ["b", "o", "n", "e"], kind: "silent-e", pitch: "o" },
    ],
  },
  {
    id: 6,
    name: "Vowel Teams",
    inning: "6th Inning",
    blurb: "ai, oa, ee — two vowels, one team.",
    focus: "team",
    atBats: 8,
    passRate: 0.8,
    baseMs: 6500,
    decoys: 4,
    items: [
      { word: "rain", graphemes: ["r", "ai", "n"], kind: "team", pitch: "ai" },
      { word: "boat", graphemes: ["b", "oa", "t"], kind: "team", pitch: "oa" },
      { word: "tree", graphemes: ["tr", "ee"], kind: "team", pitch: "ee" },
      { word: "sail", graphemes: ["s", "ai", "l"], kind: "team", pitch: "ai" },
      { word: "coat", graphemes: ["c", "oa", "t"], kind: "team", pitch: "oa" },
      { word: "see", graphemes: ["s", "ee"], kind: "team", pitch: "ee" },
      { word: "mail", graphemes: ["m", "ai", "l"], kind: "team", pitch: "ai" },
      { word: "goat", graphemes: ["g", "oa", "t"], kind: "team", pitch: "oa" },
      { word: "bee", graphemes: ["b", "ee"], kind: "team", pitch: "ee" },
      { word: "road", graphemes: ["r", "oa", "d"], kind: "team", pitch: "oa" },
      { word: "soap", graphemes: ["s", "oa", "p"], kind: "team", pitch: "oa" },
      { word: "feet", graphemes: ["f", "ee", "t"], kind: "team", pitch: "ee" },
      { word: "meet", graphemes: ["m", "ee", "t"], kind: "team", pitch: "ee" },
      { word: "pain", graphemes: ["p", "ai", "n"], kind: "team", pitch: "ai" },
    ],
  },
];

const L1_SOUNDS = ["m", "s", "a", "t", "p", "n", "i", "d", "o", "c", "g"];
const EXTRA_DECOYS = ["b", "k", "e", "l", "r", "h", "f", "sh", "ch", "th", "st", "sl", "tr", "bl", "ck", "ai", "oa", "ee"];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === Number(id));
}

export function poolForLevel(level) {
  const set = new Set();
  for (const item of level.items) {
    for (const g of item.graphemes) set.add(g);
  }
  if (level.id === 1) L1_SOUNDS.forEach((s) => set.add(s));
  return [...set];
}

export function pickInning(level, heat = 1) {
  const n = Math.min(12, Math.max(8, level.atBats));
  const bag = [...level.items];
  shuffle(bag);
  const picks = [];
  while (picks.length < n) {
    if (!bag.length) bag.push(...shuffle([...level.items]));
    picks.push(bag.pop());
  }
  return picks;
}

export function decoysFor(item, level, heat = 1) {
  const extra = heat >= 1.1 ? 1 : 0;
  const count = (level.decoys || 2) + extra;
  const used = new Set(item.graphemes);
  const pool = [
    ...poolForLevel(level).filter((g) => !used.has(g)),
    ...EXTRA_DECOYS.filter((g) => !used.has(g)),
  ];
  shuffle(pool);
  const out = [];
  for (const g of pool) {
    if (out.length >= count) break;
    if (!out.includes(g)) out.push(g);
  }
  return out;
}

export function pitchTarget(item, level) {
  if (item.pitch) return item.pitch;
  if (level.focus === "letter") return item.graphemes[0];
  if (level.focus === "cvc") return item.graphemes[0];
  if (level.focus === "silent-e") return item.graphemes[1];
  return item.graphemes[0];
}

export function pitchPrompt(level) {
  if (level.focus === "letter") return "Pitch the matching sound!";
  if (level.focus === "cvc") return "Pitch the beginning sound!";
  if (level.focus === "blend") return "Pitch the beginning blend!";
  if (level.focus === "digraph") return "Pitch the special sound!";
  if (level.focus === "silent-e") return "Pitch the long vowel!";
  if (level.focus === "team") return "Pitch the vowel team!";
  return "Pitch the right sound!";
}

export function defenseTarget(item, level) {
  if (level.focus === "letter") return item.graphemes[0];
  if (level.focus === "blend" || level.focus === "digraph" || level.focus === "team") {
    return item.pitch || item.graphemes[0];
  }
  return item.word;
}

export function defensePrompt(level) {
  if (level.focus === "letter") return "Catch the matching letter!";
  if (level.focus === "cvc") return "Catch the word you hear!";
  return "Catch the matching sound!";
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const MODE_META = {
  atbat: {
    id: "atbat",
    title: "At Bat",
    verb: "Swing",
    blurb: "Tap the sounds. Blend. Swing for the fences.",
    icon: "bat",
  },
  defense: {
    id: "defense",
    title: "Defense",
    verb: "Field",
    blurb: "A sound is hit to the field. Catch the match.",
    icon: "glove",
  },
  pitching: {
    id: "pitching",
    title: "Pitching",
    verb: "Pitch",
    blurb: "Aim the right sound at the word. Throw a strike.",
    icon: "ball",
  },
};
