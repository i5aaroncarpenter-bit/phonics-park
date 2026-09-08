/**
 * Little League (ages 3–5) content: the alphabet with letter names, sounds,
 * keywords and tracing strokes; rhyme sets; syllable words; the eight
 * Little League games; stickers and praise.
 */

import { KEYWORDS } from "../curriculum.js";

const deg = Math.PI / 180;
/** Sample an arc (angles in degrees, canvas orientation) into points. */
function arc(cx, cy, r, a0, a1, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * (i / n)) * deg;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}
/** A right-bulging half circle from (x, y0) down to (x, y1). */
const bump = (x, y0, y1) => arc(x, (y0 + y1) / 2, (y1 - y0) / 2, -90, 90);

/** Uppercase stroke paths in a unit box: each stroke is a polyline. */
const STROKES = {
  A: [[[0.5, 0.05], [0.1, 0.95]], [[0.5, 0.05], [0.9, 0.95]], [[0.25, 0.62], [0.75, 0.62]]],
  B: [[[0.2, 0.05], [0.2, 0.95]], [[0.2, 0.05], ...bump(0.45, 0.05, 0.5)], [[0.2, 0.5], ...bump(0.5, 0.5, 0.95)]],
  C: [arc(0.55, 0.5, 0.42, -50, -310)],
  D: [[[0.2, 0.05], [0.2, 0.95]], [[0.2, 0.05], ...arc(0.2, 0.5, 0.45, -90, 90)]],
  E: [[[0.85, 0.05], [0.2, 0.05], [0.2, 0.95], [0.85, 0.95]], [[0.2, 0.5], [0.75, 0.5]]],
  F: [[[0.85, 0.05], [0.2, 0.05], [0.2, 0.95]], [[0.2, 0.5], [0.75, 0.5]]],
  G: [[...arc(0.5, 0.5, 0.42, -40, -320), [0.92, 0.5], [0.6, 0.5]]],
  H: [[[0.2, 0.05], [0.2, 0.95]], [[0.8, 0.05], [0.8, 0.95]], [[0.2, 0.5], [0.8, 0.5]]],
  I: [[[0.25, 0.05], [0.75, 0.05]], [[0.5, 0.05], [0.5, 0.95]], [[0.25, 0.95], [0.75, 0.95]]],
  J: [[[0.6, 0.05], [0.6, 0.7], ...arc(0.4, 0.7, 0.2, 0, 180)]],
  K: [[[0.2, 0.05], [0.2, 0.95]], [[0.8, 0.05], [0.2, 0.55]], [[0.35, 0.45], [0.8, 0.95]]],
  L: [[[0.25, 0.05], [0.25, 0.95], [0.85, 0.95]]],
  M: [[[0.15, 0.95], [0.15, 0.05], [0.5, 0.6], [0.85, 0.05], [0.85, 0.95]]],
  N: [[[0.2, 0.95], [0.2, 0.05], [0.8, 0.95], [0.8, 0.05]]],
  O: [arc(0.5, 0.5, 0.42, -90, -450, 24)],
  P: [[[0.2, 0.05], [0.2, 0.95]], [[0.2, 0.05], ...bump(0.5, 0.05, 0.5)]],
  Q: [arc(0.5, 0.48, 0.4, -90, -450, 24), [[0.6, 0.65], [0.9, 0.95]]],
  R: [[[0.2, 0.05], [0.2, 0.95]], [[0.2, 0.05], ...bump(0.5, 0.05, 0.5)], [[0.35, 0.5], [0.85, 0.95]]],
  S: [[...arc(0.5, 0.28, 0.22, -30, -270), ...arc(0.5, 0.72, 0.22, -90, 150)]],
  T: [[[0.15, 0.05], [0.85, 0.05]], [[0.5, 0.05], [0.5, 0.95]]],
  U: [[[0.2, 0.05], [0.2, 0.6], ...arc(0.5, 0.6, 0.3, 180, 0), [0.8, 0.05]]],
  V: [[[0.15, 0.05], [0.5, 0.95], [0.85, 0.05]]],
  W: [[[0.1, 0.05], [0.3, 0.95], [0.5, 0.3], [0.7, 0.95], [0.9, 0.05]]],
  X: [[[0.15, 0.05], [0.85, 0.95]], [[0.85, 0.05], [0.15, 0.95]]],
  Y: [[[0.15, 0.05], [0.5, 0.5]], [[0.85, 0.05], [0.5, 0.5], [0.5, 0.95]]],
  Z: [[[0.15, 0.05], [0.85, 0.05], [0.15, 0.95], [0.85, 0.95]]],
};

const CLIP = { c: "k", q: "qu" };

export const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("").map((l) => ({
  l, upper: l.toUpperCase(), clip: CLIP[l] || l,
  word: KEYWORDS[l][0], pic: KEYWORDS[l][1], strokes: STROKES[l.toUpperCase()],
}));

export const letter = (l) => LETTERS.find((x) => x.l === l);

/** Picture words for "which one starts with /m/?" — several per letter. */
export const STARTERS = {
  a: [["apple", "🍎"], ["ant", "🐜"], ["alligator", "🐊"]], b: [["ball", "⚽"], ["bear", "🐻"], ["banana", "🍌"], ["bus", "🚌"]],
  c: [["cat", "🐱"], ["car", "🚗"], ["cake", "🎂"], ["cow", "🐄"]], d: [["dog", "🐶"], ["duck", "🦆"], ["drum", "🥁"], ["dinosaur", "🦖"]],
  e: [["egg", "🥚"], ["elephant", "🐘"], ["elbow", "💪"]], f: [["fish", "🐟"], ["frog", "🐸"], ["fox", "🦊"], ["football", "🏈"]],
  g: [["goat", "🐐"], ["grapes", "🍇"], ["gift", "🎁"], ["guitar", "🎸"]], h: [["hat", "🎩"], ["horse", "🐴"], ["hamburger", "🍔"], ["house", "🏠"]],
  i: [["igloo", "🧊"], ["insect", "🐛"], ["ink", "🖋️"]], j: [["jet", "✈️"], ["jam", "🍓"], ["jacket", "🧥"], ["juice", "🧃"]],
  k: [["kite", "🪁"], ["key", "🔑"], ["kangaroo", "🦘"], ["king", "🤴"]], l: [["lion", "🦁"], ["lemon", "🍋"], ["leaf", "🍃"], ["lock", "🔒"]],
  m: [["moon", "🌙"], ["monkey", "🐵"], ["milk", "🥛"], ["mouse", "🐭"]], n: [["nest", "🐣"], ["nose", "👃"], ["nut", "🌰"], ["net", "🥅"]],
  o: [["octopus", "🐙"], ["otter", "🦦"], ["ox", "🐂"]], p: [["pig", "🐷"], ["pizza", "🍕"], ["penguin", "🐧"], ["pumpkin", "🎃"]],
  q: [["queen", "👸"], ["quilt", "🛏️"], ["question", "❓"]], r: [["rocket", "🚀"], ["rabbit", "🐰"], ["rainbow", "🌈"], ["robot", "🤖"]],
  s: [["sun", "☀️"], ["snake", "🐍"], ["sock", "🧦"], ["star", "⭐"]], t: [["tiger", "🐯"], ["turtle", "🐢"], ["train", "🚆"], ["tooth", "🦷"]],
  u: [["umbrella", "☂️"], ["up", "⬆️"], ["under", "⬇️"]], v: [["van", "🚐"], ["violin", "🎻"], ["volcano", "🌋"], ["vest", "🦺"]],
  w: [["web", "🕸️"], ["whale", "🐋"], ["watermelon", "🍉"], ["worm", "🪱"]], x: [["box", "📦"], ["fox", "🦊"], ["six", "6️⃣"]],
  y: [["yo-yo", "🪀"], ["yarn", "🧶"], ["yak", "🐃"]], z: [["zebra", "🦓"], ["zipper", "🤐"], ["zoo", "🦁"]],
};

/** Rhyme families with pictures. */
export const RHYMES = [
  [["cat", "🐱"], ["hat", "🎩"], ["bat", "🦇"], ["rat", "🐀"]],
  [["dog", "🐶"], ["log", "🪵"], ["frog", "🐸"]],
  [["sun", "☀️"], ["bun", "🥐"], ["run", "🏃"]],
  [["pig", "🐷"], ["wig", "💇"], ["fig", "🍈"]],
  [["hen", "🐔"], ["pen", "🖊️"], ["ten", "🔟"]],
  [["bug", "🐛"], ["mug", "☕"], ["hug", "🤗"], ["rug", "🟫"]],
  [["cake", "🎂"], ["lake", "🏞️"], ["snake", "🐍"]],
  [["bee", "🐝"], ["tree", "🌳"], ["knee", "🦵"]],
  [["boat", "⛵"], ["goat", "🐐"], ["coat", "🧥"]],
  [["star", "⭐"], ["car", "🚗"], ["guitar", "🎸"]],
  [["moon", "🌙"], ["spoon", "🥄"], ["balloon", "🎈"]],
  [["fish", "🐟"], ["dish", "🍽️"]],
  [["sock", "🧦"], ["rock", "🪨"], ["lock", "🔒"], ["clock", "⏰"]],
  [["king", "🤴"], ["ring", "💍"], ["wing", "🐦"]],
  [["snail", "🐌"], ["mail", "📬"], ["nail", "💅"]],
  [["fox", "🦊"], ["box", "📦"], ["socks", "🧦"]],
  [["bed", "🛏️"], ["red", "🟥"], ["bread", "🍞"]],
  [["mop", "🧹"], ["top", "🔝"], ["hop", "🐇"]],
  [["bell", "🔔"], ["shell", "🐚"], ["well", "🪣"]],
  [["train", "🚆"], ["rain", "🌧️"], ["chain", "⛓️"]],
];

/** Words with syllable counts for clap-along. */
export const SYLLABLES = [
  ["cat", 1, "🐱"], ["dog", 1, "🐶"], ["sun", 1, "☀️"], ["ball", 1, "⚽"], ["fish", 1, "🐟"], ["star", 1, "⭐"],
  ["football", 2, "🏈"], ["pizza", 2, "🍕"], ["rainbow", 2, "🌈"], ["apple", 2, "🍎"], ["rocket", 2, "🚀"], ["tiger", 2, "🐯"],
  ["robot", 2, "🤖"], ["monkey", 2, "🐵"], ["cookie", 2, "🍪"], ["helmet", 2, "⛑️"], ["penguin", 2, "🐧"], ["spider", 2, "🕷️"],
  ["banana", 3, "🍌"], ["elephant", 3, "🐘"], ["butterfly", 3, "🦋"], ["dinosaur", 3, "🦖"], ["umbrella", 3, "☂️"], ["octopus", 3, "🐙"],
  ["hamburger", 3, "🍔"], ["kangaroo", 3, "🦘"], ["strawberry", 3, "🍓"], ["bicycle", 3, "🚲"], ["watermelon", 4, "🍉"], ["helicopter", 4, "🚁"],
];

/** Spoken syllable splits for the clap-along model. */
export const SYLLABLE_SPLIT = {
  football: "foot. ball", pizza: "peet. za", rainbow: "rain. bow", apple: "ap. pull", rocket: "rock. et", tiger: "tie. ger",
  robot: "row. bot", monkey: "mun. key", cookie: "cook. ee", helmet: "hel. met", penguin: "pen. gwin", spider: "spy. der",
  banana: "ba. na. na", elephant: "el. e. fant", butterfly: "but. ter. fly", dinosaur: "die. no. sore", umbrella: "um. brel. la",
  octopus: "ok. toe. puss", hamburger: "ham. bur. ger", kangaroo: "kang. ga. roo", strawberry: "straw. ber. ry", bicycle: "by. sick. ul",
  watermelon: "wa. ter. mel. on", helicopter: "hel. i. cop. ter",
};

export const ROOKIE_STAGES = [
  { id: 1, title: "A B C D", letters: ["a", "b", "c", "d"], mascot: "🐣", color: "#ffb703", blurb: "Meet your first four letters!" },
  { id: 2, title: "E F G H", letters: ["e", "f", "g", "h"], mascot: "🐥", color: "#8ecae6", blurb: "Four more letters and their sounds." },
  { id: 3, title: "I J K L", letters: ["i", "j", "k", "l"], mascot: "🐤", color: "#b5e48c", blurb: "New letters, plus rhyme time!" },
  { id: 4, title: "M N O P", letters: ["m", "n", "o", "p"], mascot: "🐔", color: "#ffafcc", blurb: "Halfway through the alphabet!" },
  { id: 5, title: "Q R S T", letters: ["q", "r", "s", "t"], mascot: "🦆", color: "#cdb4db", blurb: "Letters, rhymes and clapping words." },
  { id: 6, title: "U V W X", letters: ["u", "v", "w", "x"], mascot: "🦢", color: "#a2d2ff", blurb: "Almost there!" },
  { id: 7, title: "Y Z Party", letters: ["y", "z"], mascot: "🦉", color: "#ffd6a5", blurb: "The last two letters — and the whole alphabet!" },
  { id: 8, title: "Sound Stars", letters: [], mascot: "🌟", color: "#ffd60a", blurb: "First sounds, rhymes and clapping — you're a reader in training!" },
];

/** Stickers earned from mystery boxes. Each is also a word to hear. */
export const STICKERS = [
  ...[["cat", "🐱"], ["dog", "🐶"], ["pig", "🐷"], ["frog", "🐸"], ["fox", "🦊"], ["bee", "🐝"], ["duck", "🦆"], ["lion", "🦁"], ["bear", "🐻"], ["owl", "🦉"], ["shark", "🦈"], ["whale", "🐋"]].map(([w, e]) => ({ w, e, pack: "Animals" })),
  ...[["apple", "🍎"], ["cake", "🎂"], ["pizza", "🍕"], ["taco", "🌮"], ["corn", "🌽"], ["grapes", "🍇"], ["egg", "🥚"], ["milk", "🥛"], ["cookie", "🍪"], ["donut", "🍩"]].map(([w, e]) => ({ w, e, pack: "Snacks" })),
  ...[["car", "🚗"], ["bus", "🚌"], ["jet", "✈️"], ["boat", "⛵"], ["train", "🚆"], ["truck", "🚚"], ["bike", "🚲"], ["rocket", "🚀"], ["tractor", "🚜"]].map(([w, e]) => ({ w, e, pack: "Go Go Go" })),
  ...[["football", "🏈"], ["helmet", "⛑️"], ["trophy", "🏆"], ["medal", "🏅"], ["whistle", "📣"], ["flag", "🚩"], ["star", "⭐"], ["crown", "👑"], ["fire", "🔥"]].map(([w, e]) => ({ w, e, pack: "Game Day" })),
  ...[["moon", "🌙"], ["sun", "☀️"], ["rainbow", "🌈"], ["cloud", "☁️"], ["snow", "⛄"], ["comet", "☄️"], ["planet", "🪐"], ["robot", "🤖"], ["alien", "👽"]].map(([w, e]) => ({ w, e, pack: "Space" })),
  ...[["dino", "🦖"], ["dragon", "🐉"], ["unicorn", "🦄"], ["wizard", "🧙"], ["gem", "💎"], ["castle", "🏰"], ["ghost", "👻"], ["magic", "✨"]].map(([w, e]) => ({ w, e, pack: "Magic" })),
];

export const PRAISE = [
  "Awesome!", "You did it!", "Superstar!", "Way to go!", "Amazing!", "You rock!", "High five!", "So smart!", "Wow!",
  "Perfect!", "Touchdown-worthy!", "Nailed it!", "Fantastic!", "You're a champion!", "Brilliant!", "Great job!",
];

export const ENCOURAGE = [
  "Almost! Try again.", "Good try! Listen once more.", "Not that one — you can do it!", "So close! One more time.",
];

export const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
};
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
