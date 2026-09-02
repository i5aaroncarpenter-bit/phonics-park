/**
 * Phonics Bowl curriculum — a 12-game season that walks a beginning reader
 * from single letter sounds to reading full sentences.
 *
 *   1  Kickoff Camp        letter sounds s a t p i n m d
 *   2  Letter Blitz        letter sounds g o c k e u r h b f l  (+ set 1)
 *   3  First Downs         CVC words, short a and i
 *   4  Vowel Valley        CVC words, all five short vowels
 *   5  Digraph Dash        sh ch th ck wh
 *   6  Blend Bowl          beginning blends st sl tr bl fl gr sp cl dr sn sw
 *   7  End Zone Blends     ending blends mp nd st nt sk lk ft + ll ss
 *   8  Sight Word Sprint   high-frequency words + first sentences
 *   9  Magic E Mania       a_e i_e o_e u_e
 *  10  Vowel Team Tailgate ai ay ee ea oa ow oo
 *  11  Bossy R Rumble      ar or er ir ur
 *  12  The Phonics Bowl    championship mix of everything
 */

import { masteryScore } from "./save.js";

/** Keyword pictures for every sound tile: [word, emoji]. */
export const KEYWORDS = {
  a: ["apple", "🍎"], b: ["ball", "⚽"], c: ["cat", "🐱"], d: ["dog", "🐶"], e: ["egg", "🥚"],
  f: ["fish", "🐟"], g: ["goat", "🐐"], h: ["hat", "🎩"], i: ["igloo", "🧊"], j: ["jet", "✈️"],
  k: ["kite", "🪁"], l: ["lion", "🦁"], m: ["moon", "🌙"], n: ["nest", "🐣"], o: ["octopus", "🐙"],
  p: ["pig", "🐷"], q: ["queen", "👸"], r: ["rocket", "🚀"], s: ["sun", "☀️"], t: ["tiger", "🐯"],
  u: ["umbrella", "☂️"], v: ["van", "🚐"], w: ["web", "🕸️"], x: ["box", "📦"], y: ["yo-yo", "🪀"],
  z: ["zebra", "🦓"],
  sh: ["ship", "🚢"], ch: ["chick", "🐥"], th: ["thumb", "👍"], ck: ["duck", "🦆"], wh: ["whale", "🐋"],
  ng: ["ring", "💍"], qu: ["queen", "👸"],
  st: ["star", "⭐"], sl: ["sled", "🛷"], tr: ["truck", "🚚"], bl: ["block", "🧱"], fl: ["flag", "🚩"],
  gr: ["grapes", "🍇"], sp: ["spoon", "🥄"], cl: ["clock", "⏰"], dr: ["drum", "🥁"], sn: ["snake", "🐍"],
  sw: ["swim", "🏊"], cr: ["crab", "🦀"], fr: ["frog", "🐸"], pl: ["plane", "✈️"], br: ["bread", "🍞"],
  mp: ["jump", "🦘"], nd: ["hand", "🖐️"], nt: ["tent", "⛺"], sk: ["mask", "🎭"], lk: ["milk", "🥛"],
  ft: ["gift", "🎁"], ll: ["bell", "🔔"], ss: ["kiss", "💋"], ff: ["puff", "💨"], lt: ["belt", "🧷"],
  ai: ["rain", "🌧️"], ay: ["hay", "🌾"], ee: ["bee", "🐝"], ea: ["leaf", "🍃"], oa: ["boat", "⛵"],
  ow: ["snow", "⛄"], oo: ["moon", "🌙"], ie: ["pie", "🥧"], igh: ["light", "💡"],
  ar: ["car", "🚗"], or: ["corn", "🌽"], er: ["ladder", "🪜"], ir: ["bird", "🐦"], ur: ["turtle", "🐢"],
  "a_e": ["cake", "🎂"], "i_e": ["bike", "🚲"], "o_e": ["bone", "🦴"], "u_e": ["cube", "🧊"],
};

/** Sight words the reader is expected to recognise on sight. */
export const SIGHT_WORDS = [
  "the", "a", "I", "is", "to", "and", "you", "said", "was", "he", "she", "we", "me", "my", "of",
  "for", "go", "no", "so", "do", "have", "like", "see", "they", "are", "come", "here", "look",
  "one", "two", "play", "on", "in", "it", "at", "can", "up", "am", "be", "has", "put", "your",
];

const w = (word, g, pic, kind) => ({ word, g, pic: pic || null, kind: kind || "word" });
const sight = (word) => ({ word, g: [word], pic: null, kind: "sight", sight: true });

/* ---------- WORD BANKS ---------- */

const CVC_AI = [
  w("cat", ["c", "a", "t"], "🐱"), w("sit", ["s", "i", "t"], "🪑"), w("pin", ["p", "i", "n"], "📌"),
  w("map", ["m", "a", "p"], "🗺️"), w("tin", ["t", "i", "n"], "🥫"), w("cap", ["c", "a", "p"], "🧢"),
  w("man", ["m", "a", "n"], "👨"), w("sad", ["s", "a", "d"], "😢"), w("mat", ["m", "a", "t"], "🧘"),
  w("sat", ["s", "a", "t"]), w("tap", ["t", "a", "p"], "🚰"), w("nap", ["n", "a", "p"], "😴"),
  w("pit", ["p", "i", "t"]), w("dip", ["d", "i", "p"]), w("sip", ["s", "i", "p"], "🥤"),
  w("pad", ["p", "a", "d"]), w("dad", ["d", "a", "d"], "👨‍👦"), w("did", ["d", "i", "d"]),
  w("tip", ["t", "i", "p"]), w("tan", ["t", "a", "n"]), w("pan", ["p", "a", "n"], "🍳"),
  w("can", ["c", "a", "n"], "🥫"), w("ant", ["a", "n", "t"], "🐜"), w("pat", ["p", "a", "t"]),
  w("nit", ["n", "i", "t"]), w("mad", ["m", "a", "d"], "😠"), w("dim", ["d", "i", "m"]),
  w("sap", ["s", "a", "p"]), w("tam", ["t", "a", "m"]), w("Sam", ["S", "a", "m"], "🧒"),
];

const CVC_ALL = [
  ...CVC_AI.slice(0, 18),
  w("dog", ["d", "o", "g"], "🐶"), w("mop", ["m", "o", "p"], "🧹"), w("pot", ["p", "o", "t"], "🍲"),
  w("top", ["t", "o", "p"], "🔝"), w("hot", ["h", "o", "t"], "🥵"), w("log", ["l", "o", "g"], "🪵"),
  w("fox", ["f", "o", "x"], "🦊"), w("box", ["b", "o", "x"], "📦"), w("cot", ["c", "o", "t"], "🛏️"),
  w("rod", ["r", "o", "d"], "🎣"), w("hop", ["h", "o", "p"], "🐇"),
  w("bed", ["b", "e", "d"], "🛏️"), w("hen", ["h", "e", "n"], "🐔"), w("egg", ["e", "g", "g"], "🥚"),
  w("red", ["r", "e", "d"], "🟥"), w("leg", ["l", "e", "g"], "🦵"), w("net", ["n", "e", "t"], "🥅"),
  w("pen", ["p", "e", "n"], "🖊️"), w("ten", ["t", "e", "n"], "🔟"), w("web", ["w", "e", "b"], "🕸️"),
  w("jet", ["j", "e", "t"], "✈️"), w("wet", ["w", "e", "t"], "💧"), w("gem", ["g", "e", "m"], "💎"),
  w("bug", ["b", "u", "g"], "🐛"), w("cup", ["c", "u", "p"], "☕"), w("sun", ["s", "u", "n"], "☀️"),
  w("bus", ["b", "u", "s"], "🚌"), w("tub", ["t", "u", "b"], "🛁"), w("nut", ["n", "u", "t"], "🌰"),
  w("hug", ["h", "u", "g"], "🤗"), w("run", ["r", "u", "n"], "🏃"), w("mud", ["m", "u", "d"], "🟤"),
  w("pup", ["p", "u", "p"], "🐶"), w("gum", ["g", "u", "m"], "🍬"), w("rug", ["r", "u", "g"], "🟫"),
  w("hat", ["h", "a", "t"], "🎩"), w("bat", ["b", "a", "t"], "🦇"), w("rat", ["r", "a", "t"], "🐀"),
  w("bag", ["b", "a", "g"], "👜"), w("fan", ["f", "a", "n"], "💨"), w("ham", ["h", "a", "m"], "🍖"),
  w("pig", ["p", "i", "g"], "🐷"), w("lip", ["l", "i", "p"], "👄"), w("fin", ["f", "i", "n"], "🐟"),
  w("kid", ["k", "i", "d"], "🧒"), w("big", ["b", "i", "g"]), w("six", ["s", "i", "x"], "6️⃣"),
  w("lid", ["l", "i", "d"]), w("wig", ["w", "i", "g"]), w("zip", ["z", "i", "p"], "🤐"),
];

const DIGRAPHS = [
  w("ship", ["sh", "i", "p"], "🚢", "digraph"), w("shop", ["sh", "o", "p"], "🏪", "digraph"),
  w("fish", ["f", "i", "sh"], "🐟", "digraph"), w("shell", ["sh", "e", "ll"], "🐚", "digraph"),
  w("dish", ["d", "i", "sh"], "🍽️", "digraph"), w("shut", ["sh", "u", "t"], "🚪", "digraph"),
  w("chip", ["ch", "i", "p"], "🍟", "digraph"), w("chop", ["ch", "o", "p"], "🔪", "digraph"),
  w("chin", ["ch", "i", "n"], "🙂", "digraph"), w("chat", ["ch", "a", "t"], "💬", "digraph"),
  w("rich", ["r", "i", "ch"], "💰", "digraph"), w("much", ["m", "u", "ch"], null, "digraph"),
  w("thin", ["th", "i", "n"], "📏", "digraph"), w("that", ["th", "a", "t"], null, "digraph"),
  w("this", ["th", "i", "s"], null, "digraph"), w("bath", ["b", "a", "th"], "🛁", "digraph"),
  w("math", ["m", "a", "th"], "➕", "digraph"), w("moth", ["m", "o", "th"], "🦋", "digraph"),
  w("duck", ["d", "u", "ck"], "🦆", "digraph"), w("sock", ["s", "o", "ck"], "🧦", "digraph"),
  w("kick", ["k", "i", "ck"], "🦵", "digraph"), w("rock", ["r", "o", "ck"], "🪨", "digraph"),
  w("lock", ["l", "o", "ck"], "🔒", "digraph"), w("pack", ["p", "a", "ck"], "🎒", "digraph"),
  w("neck", ["n", "e", "ck"], "🦒", "digraph"), w("back", ["b", "a", "ck"], "🔙", "digraph"),
  w("whip", ["wh", "i", "p"], null, "digraph"), w("when", ["wh", "e", "n"], null, "digraph"),
  w("which", ["wh", "i", "ch"], null, "digraph"), w("wham", ["wh", "a", "m"], "💥", "digraph"),
];

const BLENDS = [
  w("stop", ["st", "o", "p"], "🛑", "blend"), w("star", ["st", "ar"], "⭐", "blend"),
  w("step", ["st", "e", "p"], "🪜", "blend"), w("stick", ["st", "i", "ck"], "🥢", "blend"),
  w("slip", ["sl", "i", "p"], "🧊", "blend"), w("sled", ["sl", "e", "d"], "🛷", "blend"),
  w("slam", ["sl", "a", "m"], "💥", "blend"), w("slug", ["sl", "u", "g"], "🐌", "blend"),
  w("trip", ["tr", "i", "p"], "🧳", "blend"), w("truck", ["tr", "u", "ck"], "🚚", "blend"),
  w("trap", ["tr", "a", "p"], "🪤", "blend"), w("trash", ["tr", "a", "sh"], "🗑️", "blend"),
  w("blob", ["bl", "o", "b"], "🟢", "blend"), w("block", ["bl", "o", "ck"], "🧱", "blend"),
  w("black", ["bl", "a", "ck"], "⬛", "blend"), w("blush", ["bl", "u", "sh"], "😊", "blend"),
  w("flag", ["fl", "a", "g"], "🚩", "blend"), w("flip", ["fl", "i", "p"], "🤸", "blend"),
  w("flat", ["fl", "a", "t"], "🫓", "blend"), w("flash", ["fl", "a", "sh"], "⚡", "blend"),
  w("grab", ["gr", "a", "b"], "✊", "blend"), w("grin", ["gr", "i", "n"], "😁", "blend"),
  w("grass", ["gr", "a", "ss"], "🌿", "blend"), w("grip", ["gr", "i", "p"], "🤜", "blend"),
  w("spin", ["sp", "i", "n"], "🌀", "blend"), w("spot", ["sp", "o", "t"], "🔴", "blend"),
  w("spill", ["sp", "i", "ll"], "💧", "blend"), w("spud", ["sp", "u", "d"], "🥔", "blend"),
  w("clap", ["cl", "a", "p"], "👏", "blend"), w("clock", ["cl", "o", "ck"], "⏰", "blend"),
  w("club", ["cl", "u", "b"], "🏒", "blend"), w("cliff", ["cl", "i", "ff"], "🏔️", "blend"),
  w("drum", ["dr", "u", "m"], "🥁", "blend"), w("drip", ["dr", "i", "p"], "💧", "blend"),
  w("dress", ["dr", "e", "ss"], "👗", "blend"), w("drop", ["dr", "o", "p"], "💧", "blend"),
  w("snap", ["sn", "a", "p"], "👌", "blend"), w("snack", ["sn", "a", "ck"], "🍪", "blend"),
  w("snug", ["sn", "u", "g"], "🛌", "blend"), w("swim", ["sw", "i", "m"], "🏊", "blend"),
  w("swish", ["sw", "i", "sh"], "🏀", "blend"), w("frog", ["fr", "o", "g"], "🐸", "blend"),
  w("crab", ["cr", "a", "b"], "🦀", "blend"), w("plum", ["pl", "u", "m"], "🍑", "blend"),
];

const END_BLENDS = [
  w("jump", ["j", "u", "mp"], "🦘", "endblend"), w("camp", ["c", "a", "mp"], "⛺", "endblend"),
  w("lamp", ["l", "a", "mp"], "🪔", "endblend"), w("stamp", ["st", "a", "mp"], "📬", "endblend"),
  w("hand", ["h", "a", "nd"], "🖐️", "endblend"), w("sand", ["s", "a", "nd"], "🏖️", "endblend"),
  w("band", ["b", "a", "nd"], "🎺", "endblend"), w("pond", ["p", "o", "nd"], "🏞️", "endblend"),
  w("nest", ["n", "e", "st"], "🐣", "endblend"), w("vest", ["v", "e", "st"], "🦺", "endblend"),
  w("fist", ["f", "i", "st"], "✊", "endblend"), w("list", ["l", "i", "st"], "📝", "endblend"),
  w("tent", ["t", "e", "nt"], "⛺", "endblend"), w("ant", ["a", "nt"], "🐜", "endblend"),
  w("hunt", ["h", "u", "nt"], "🔍", "endblend"), w("plant", ["pl", "a", "nt"], "🌱", "endblend"),
  w("mask", ["m", "a", "sk"], "🎭", "endblend"), w("desk", ["d", "e", "sk"], "🪑", "endblend"),
  w("milk", ["m", "i", "lk"], "🥛", "endblend"), w("gift", ["g", "i", "ft"], "🎁", "endblend"),
  w("raft", ["r", "a", "ft"], "🛶", "endblend"), w("belt", ["b", "e", "lt"], "🧷", "endblend"),
  w("bell", ["b", "e", "ll"], "🔔", "endblend"), w("hill", ["h", "i", "ll"], "⛰️", "endblend"),
  w("doll", ["d", "o", "ll"], "🪆", "endblend"), w("kiss", ["k", "i", "ss"], "💋", "endblend"),
  w("dress", ["dr", "e", "ss"], "👗", "endblend"), w("puff", ["p", "u", "ff"], "💨", "endblend"),
  w("wink", ["w", "i", "nk"], "😉", "endblend"), w("pink", ["p", "i", "nk"], "🌸", "endblend"),
  w("king", ["k", "i", "ng"], "🤴", "endblend"), w("ring", ["r", "i", "ng"], "💍", "endblend"),
];

const MAGIC_E = [
  w("cake", ["c", "a", "k", "e"], "🎂", "magic-e"), w("gate", ["g", "a", "t", "e"], "🚧", "magic-e"),
  w("cape", ["c", "a", "p", "e"], "🦸", "magic-e"), w("game", ["g", "a", "m", "e"], "🎮", "magic-e"),
  w("lake", ["l", "a", "k", "e"], "🏞️", "magic-e"), w("plane", ["pl", "a", "n", "e"], "✈️", "magic-e"),
  w("snake", ["sn", "a", "k", "e"], "🐍", "magic-e"), w("wave", ["w", "a", "v", "e"], "🌊", "magic-e"),
  w("bike", ["b", "i", "k", "e"], "🚲", "magic-e"), w("kite", ["k", "i", "t", "e"], "🪁", "magic-e"),
  w("nine", ["n", "i", "n", "e"], "9️⃣", "magic-e"), w("time", ["t", "i", "m", "e"], "⏰", "magic-e"),
  w("ride", ["r", "i", "d", "e"], "🎢", "magic-e"), w("smile", ["sm", "i", "l", "e"], "😄", "magic-e"),
  w("bone", ["b", "o", "n", "e"], "🦴", "magic-e"), w("rose", ["r", "o", "s", "e"], "🌹", "magic-e"),
  w("nose", ["n", "o", "s", "e"], "👃", "magic-e"), w("home", ["h", "o", "m", "e"], "🏠", "magic-e"),
  w("cone", ["c", "o", "n", "e"], "🍦", "magic-e"), w("rope", ["r", "o", "p", "e"], "🪢", "magic-e"),
  w("stone", ["st", "o", "n", "e"], "🪨", "magic-e"), w("globe", ["gl", "o", "b", "e"], "🌍", "magic-e"),
  w("cube", ["c", "u", "b", "e"], "🧊", "magic-e"), w("flute", ["fl", "u", "t", "e"], "🎶", "magic-e"),
  w("mule", ["m", "u", "l", "e"], "🐴", "magic-e"), w("tune", ["t", "u", "n", "e"], "🎵", "magic-e"),
  w("cute", ["c", "u", "t", "e"], "🥰", "magic-e"), w("whale", ["wh", "a", "l", "e"], "🐋", "magic-e"),
];

const VOWEL_TEAMS = [
  w("rain", ["r", "ai", "n"], "🌧️", "team"), w("snail", ["sn", "ai", "l"], "🐌", "team"),
  w("train", ["tr", "ai", "n"], "🚆", "team"), w("mail", ["m", "ai", "l"], "📬", "team"),
  w("paint", ["p", "ai", "nt"], "🎨", "team"), w("chain", ["ch", "ai", "n"], "⛓️", "team"),
  w("hay", ["h", "ay"], "🌾", "team"), w("play", ["pl", "ay"], "🎲", "team"),
  w("day", ["d", "ay"], "🌅", "team"), w("tray", ["tr", "ay"], "🍽️", "team"),
  w("bee", ["b", "ee"], "🐝", "team"), w("tree", ["tr", "ee"], "🌳", "team"),
  w("feet", ["f", "ee", "t"], "👣", "team"), w("green", ["gr", "ee", "n"], "🟩", "team"),
  w("sheep", ["sh", "ee", "p"], "🐑", "team"), w("sleep", ["sl", "ee", "p"], "😴", "team"),
  w("leaf", ["l", "ea", "f"], "🍃", "team"), w("sea", ["s", "ea"], "🌊", "team"),
  w("peach", ["p", "ea", "ch"], "🍑", "team"), w("beach", ["b", "ea", "ch"], "🏖️", "team"),
  w("eat", ["ea", "t"], "🍽️", "team"), w("team", ["t", "ea", "m"], "🏈", "team"),
  w("boat", ["b", "oa", "t"], "⛵", "team"), w("goat", ["g", "oa", "t"], "🐐", "team"),
  w("coat", ["c", "oa", "t"], "🧥", "team"), w("road", ["r", "oa", "d"], "🛣️", "team"),
  w("soap", ["s", "oa", "p"], "🧼", "team"), w("toast", ["t", "oa", "st"], "🍞", "team"),
  w("snow", ["sn", "ow"], "⛄", "team"), w("bow", ["b", "ow"], "🎀", "team"),
  w("glow", ["gl", "ow"], "✨", "team"), w("yellow", ["y", "e", "ll", "ow"], "🟨", "team"),
  w("moon", ["m", "oo", "n"], "🌙", "team"), w("boot", ["b", "oo", "t"], "👢", "team"),
  w("food", ["f", "oo", "d"], "🍕", "team"), w("zoo", ["z", "oo"], "🦁", "team"),
  w("spoon", ["sp", "oo", "n"], "🥄", "team"), w("pool", ["p", "oo", "l"], "🏊", "team"),
];

const BOSSY_R = [
  w("car", ["c", "ar"], "🚗", "r-vowel"), w("star", ["st", "ar"], "⭐", "r-vowel"),
  w("barn", ["b", "ar", "n"], "🏚️", "r-vowel"), w("shark", ["sh", "ar", "k"], "🦈", "r-vowel"),
  w("farm", ["f", "ar", "m"], "🚜", "r-vowel"), w("park", ["p", "ar", "k"], "🌳", "r-vowel"),
  w("cart", ["c", "ar", "t"], "🛒", "r-vowel"), w("arm", ["ar", "m"], "💪", "r-vowel"),
  w("corn", ["c", "or", "n"], "🌽", "r-vowel"), w("fork", ["f", "or", "k"], "🍴", "r-vowel"),
  w("horse", ["h", "or", "s", "e"], "🐴", "r-vowel"), w("storm", ["st", "or", "m"], "⛈️", "r-vowel"),
  w("torch", ["t", "or", "ch"], "🔦", "r-vowel"), w("fort", ["f", "or", "t"], "🏰", "r-vowel"),
  w("sport", ["sp", "or", "t"], "🏈", "r-vowel"), w("north", ["n", "or", "th"], "🧭", "r-vowel"),
  w("bird", ["b", "ir", "d"], "🐦", "r-vowel"), w("girl", ["g", "ir", "l"], "👧", "r-vowel"),
  w("shirt", ["sh", "ir", "t"], "👕", "r-vowel"), w("dirt", ["d", "ir", "t"], "🟤", "r-vowel"),
  w("first", ["f", "ir", "st"], "🥇", "r-vowel"), w("third", ["th", "ir", "d"], "🥉", "r-vowel"),
  w("turtle", ["t", "ur", "t", "l", "e"], "🐢", "r-vowel"), w("purse", ["p", "ur", "s", "e"], "👛", "r-vowel"),
  w("surf", ["s", "ur", "f"], "🏄", "r-vowel"), w("burn", ["b", "ur", "n"], "🔥", "r-vowel"),
  w("nurse", ["n", "ur", "s", "e"], "👩‍⚕️", "r-vowel"), w("turn", ["t", "ur", "n"], "↩️", "r-vowel"),
  w("her", ["h", "er"], "👩", "r-vowel"), w("fern", ["f", "er", "n"], "🌿", "r-vowel"),
  w("ladder", ["l", "a", "dd", "er"], "🪜", "r-vowel"), w("hammer", ["h", "a", "mm", "er"], "🔨", "r-vowel"),
  w("letter", ["l", "e", "tt", "er"], "✉️", "r-vowel"), w("winter", ["w", "i", "nt", "er"], "❄️", "r-vowel"),
];

const SIGHT = SIGHT_WORDS.map(sight);

/* ---------- SENTENCES (read zone) ---------- */

const s = (text, pic, stage) => ({ text, pic, stage });

export const SENTENCES = [
  s("The cat is on the bed.", "🐱", 8), s("I see a big red bus.", "🚌", 8),
  s("The dog can run and jump.", "🐶", 8), s("A frog sat on a log.", "🐸", 8),
  s("The fish is in the net.", "🐟", 8), s("Look at the ship!", "🚢", 8),
  s("We like to swim.", "🏊", 8), s("The duck is wet.", "🦆", 8),
  s("She has a red hat.", "🎩", 8), s("He can kick the ball.", "⚽", 8),
  s("The sun is hot.", "☀️", 8), s("Can you see the flag?", "🚩", 8),
  s("The pig is in the mud.", "🐷", 8), s("I have a drum.", "🥁", 8),
  s("The crab is on the sand.", "🦀", 8), s("Stop the truck!", "🚚", 8),
  s("The hen has an egg.", "🥚", 8), s("My cup is on the desk.", "☕", 8),
  s("The bug is on the leg.", "🐛", 8), s("We can clap and sing.", "👏", 8),
  s("Mike rides a bike.", "🚲", 9), s("I like cake.", "🎂", 9),
  s("The dog has a bone.", "🦴", 9), s("Jake has a kite.", "🪁", 9),
  s("We made a snake.", "🐍", 9), s("The rose is red.", "🌹", 9),
  s("It is time to go home.", "🏠", 9), s("The whale is huge.", "🐋", 9),
  s("Dave has a cute pup.", "🐶", 9), s("Kate can play a flute.", "🎶", 9),
  s("The plane is in the sky.", "✈️", 9), s("I ride the wave.", "🌊", 9),
  s("The bee is on the leaf.", "🐝", 10), s("The goat eats hay.", "🐐", 10),
  s("It will rain today.", "🌧️", 10), s("The boat is on the sea.", "⛵", 10),
  s("I see the moon.", "🌙", 10), s("We play in the snow.", "⛄", 10),
  s("The tree is green.", "🌳", 10), s("Eat the peach.", "🍑", 10),
  s("The train is fast.", "🚆", 10), s("My coat is blue.", "🧥", 10),
  s("The sheep is asleep.", "🐑", 10), s("Put the spoon in the food.", "🥄", 10),
  s("The car is red.", "🚗", 11), s("The bird sings.", "🐦", 11),
  s("Corn is yummy.", "🌽", 11), s("A star is far.", "⭐", 11),
  s("The horse runs fast.", "🐴", 11), s("Turn on the torch.", "🔦", 11),
  s("The shark has sharp teeth.", "🦈", 11), s("The farm has a pig.", "🐷", 11),
  s("Her purse is purple.", "👛", 11), s("The fork is on the dish.", "🍴", 11),
  s("The turtle is slow.", "🐢", 11), s("The girl has a shirt.", "👕", 11),
  s("The frog jumped on the boat.", "🐸", 12), s("I can throw the football far.", "🏈", 12),
  s("The black cat sleeps in the sun.", "🐱", 12), s("We ate cake at the park.", "🎂", 12),
  s("The green snake hides in the grass.", "🐍", 12), s("A big shark swims in the sea.", "🦈", 12),
  s("The bird sits in the tree.", "🐦", 12), s("My team can win the game!", "🏆", 12),
  s("The train goes up the hill.", "🚆", 12), s("Put the cup on the shelf.", "☕", 12),
  s("The kids play in the rain.", "🌧️", 12), s("The duck swims in the pond.", "🦆", 12),
];

/* ---------- OPPONENTS ---------- */

const OPP = (name, mascot, primary, secondary) => ({ name, mascot, primary, secondary });

/* ---------- STAGES ---------- */

export const STAGES = [
  {
    id: 1, title: "Kickoff Camp", focus: "letters",
    blurb: "Learn your first letter sounds: s, a, t, p, i, n, m, d.",
    coach: "Every letter makes a sound. Hear the sound, tap the letter!",
    opponent: OPP("Muddy Pigs", "🐷", "#8d5524", "#f4d7b0"), sky: "day",
    letters: ["s", "a", "t", "p", "i", "n", "m", "d"], plays: ["soundid", "initial", "defense-letter"],
    count: 10, baseMs: 9000, words: CVC_AI,
  },
  {
    id: 2, title: "Letter Blitz", focus: "letters",
    blurb: "More sounds: g, o, c, k, e, u, r, h, b, f, l.",
    coach: "New sounds! Listen close and pick the right letter.",
    opponent: OPP("Rocket Robots", "🤖", "#5a6b7d", "#ff5e5b"), sky: "day",
    letters: ["g", "o", "c", "k", "e", "u", "r", "h", "b", "f", "l"],
    review: ["s", "a", "t", "p", "i", "n", "m", "d"], plays: ["soundid", "initial", "defense-letter"],
    count: 12, baseMs: 8500, words: CVC_ALL,
  },
  {
    id: 3, title: "First Downs", focus: "cvc",
    blurb: "Blend three sounds into real words like cat and sit.",
    coach: "Tap the sounds in order, then THROW to blend the word!",
    opponent: OPP("Dino Dozers", "🦖", "#2e8b57", "#ffe066"), sky: "sunset",
    words: CVC_AI, plays: ["pass", "rush", "kick"], count: 12, baseMs: 9000, decoys: 3,
  },
  {
    id: 4, title: "Vowel Valley", focus: "cvc",
    blurb: "All five short vowels: a e i o u.",
    coach: "Every word has a vowel. Listen for a, e, i, o, u in the middle.",
    opponent: OPP("Jelly Jets", "✈️", "#1d6fd8", "#c8f4ff"), sky: "day",
    words: CVC_ALL, plays: ["pass", "rush", "kick", "rush-read"], count: 12, baseMs: 8500, decoys: 3,
  },
  {
    id: 5, title: "Digraph Dash", focus: "digraph",
    blurb: "Two letters, one sound: sh, ch, th, ck, wh.",
    coach: "sh, ch, th, ck — two letters that team up to make ONE sound.",
    opponent: OPP("Sneaky Sharks", "🦈", "#0b7285", "#e3fafc"), sky: "night",
    words: DIGRAPHS, targets: ["sh", "ch", "th", "ck", "wh"], review: CVC_ALL,
    plays: ["pass", "rush", "kick", "defense", "rush-read"], count: 12, baseMs: 8500, decoys: 3,
  },
  {
    id: 6, title: "Blend Bowl", focus: "blend",
    blurb: "Beginning blends: st, sl, tr, bl, fl, gr, sp, cl, dr, sn, sw.",
    coach: "Blends slide two sounds together fast: s-t, st!",
    opponent: OPP("Blizzard Bears", "🐻‍❄️", "#3d5a80", "#e0fbfc"), sky: "day",
    words: BLENDS, targets: ["st", "sl", "tr", "bl", "fl", "gr", "sp", "cl", "dr", "sn", "sw"], review: DIGRAPHS,
    plays: ["pass", "rush", "kick", "defense", "rush-read"], count: 12, baseMs: 8500, decoys: 3,
  },
  {
    id: 7, title: "End Zone Blends", focus: "endblend",
    blurb: "Blends at the END of words: jump, hand, nest, milk.",
    coach: "Listen for the blend at the end of the word — like the mp in jump.",
    opponent: OPP("Thunder Turtles", "🐢", "#6a994e", "#f2e8cf"), sky: "sunset",
    words: END_BLENDS, targets: ["mp", "nd", "st", "nt", "sk", "lk", "ft", "ll", "ss", "ng", "nk"], review: BLENDS,
    plays: ["pass", "rush", "kick", "defense", "rush-read"], count: 12, baseMs: 8500, decoys: 3,
  },
  {
    id: 8, title: "Sight Word Sprint", focus: "sight",
    blurb: "Speedy words you just KNOW: the, said, you, was...",
    coach: "Sight words are too fast to sound out — you just know them like a friend's face!",
    opponent: OPP("Lightning Llamas", "🦙", "#ffb703", "#023047"), sky: "day",
    words: SIGHT, review: [...CVC_ALL, ...DIGRAPHS, ...BLENDS], plays: ["rush", "defense-sight", "readzone", "rush"],
    count: 12, baseMs: 7500, decoys: 3,
  },
  {
    id: 9, title: "Magic E Mania", focus: "magic-e",
    blurb: "A silent e at the end makes the vowel say its name.",
    coach: "Magic e is silent, but it makes the vowel say its NAME: cap becomes cape!",
    opponent: OPP("Wizard Wolves", "🐺", "#5f0f40", "#fb8b24"), sky: "night",
    words: MAGIC_E, targets: ["a_e", "i_e", "o_e", "u_e"], review: [...CVC_ALL, ...BLENDS],
    plays: ["pass", "rush", "kick", "defense", "readzone", "rush-read"], count: 13, baseMs: 9000, decoys: 3,
  },
  {
    id: 10, title: "Vowel Team Tailgate", focus: "team",
    blurb: "Vowel teams: ai, ay, ee, ea, oa, ow, oo.",
    coach: "When two vowels go walking, the first one does the talking!",
    opponent: OPP("Pirate Parrots", "🦜", "#d62828", "#fcbf49"), sky: "sunset",
    words: VOWEL_TEAMS, targets: ["ai", "ay", "ee", "ea", "oa", "ow", "oo"], review: MAGIC_E,
    plays: ["pass", "rush", "kick", "defense", "readzone", "rush-read"], count: 13, baseMs: 9000, decoys: 3,
  },
  {
    id: 11, title: "Bossy R Rumble", focus: "r-vowel",
    blurb: "Bossy r changes the vowel: ar, or, er, ir, ur.",
    coach: "Bossy r pushes the vowel around: car, corn, bird, turtle!",
    opponent: OPP("Cyber Cats", "🐱", "#00b4d8", "#03045e"), sky: "night",
    words: BOSSY_R, targets: ["ar", "or", "er", "ir", "ur"], review: VOWEL_TEAMS,
    plays: ["pass", "rush", "kick", "defense", "readzone", "rush-read"], count: 13, baseMs: 9000, decoys: 3,
  },
  {
    id: 12, title: "The Phonics Bowl", focus: "mix",
    blurb: "The championship! Every sound, every skill, one big game.",
    coach: "This is it — the Phonics Bowl! Use everything you know. You've got this!",
    opponent: OPP("Golden Gorillas", "🦍", "#c9a227", "#1b1b1b"), sky: "night", championship: true,
    words: [...DIGRAPHS, ...BLENDS, ...END_BLENDS, ...MAGIC_E, ...VOWEL_TEAMS, ...BOSSY_R],
    targets: ["sh", "ch", "th", "st", "tr", "a_e", "i_e", "ai", "ee", "oa", "ar", "or"], review: SIGHT,
    plays: ["pass", "rush", "kick", "defense", "readzone", "rush-read"], count: 14, baseMs: 8000, decoys: 4,
  },
];

export const ALL_WORDS = [...CVC_ALL, ...DIGRAPHS, ...BLENDS, ...END_BLENDS, ...MAGIC_E, ...VOWEL_TEAMS, ...BOSSY_R];

export function getStage(id) {
  return STAGES.find((st) => st.id === Number(id)) || STAGES[0];
}

/* ---------- helpers ---------- */

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Keys a word exercises for mastery tracking: its graphemes plus the word itself. */
export function keysFor(item) {
  if (!item) return [];
  if (item.sight) return [item.word];
  return [...new Set([...(item.g || []).map((g) => g.toLowerCase()), item.word.toLowerCase()])];
}

/** Long-vowel label for a magic-e word, e.g. cake -> a_e. */
export function magicKey(item) {
  if (item.kind !== "magic-e") return null;
  const v = item.g.find((g) => "aiou".includes(g));
  return v ? `${v}_e` : null;
}

function weightFor(item, save) {
  const keys = keysFor(item);
  if (!keys.length) return 1;
  const avg = keys.reduce((a, k) => a + masteryScore(save, k), 0) / keys.length;
  return 0.6 + (1 - avg) * 2.4;
}

/** Weighted sample without replacement. */
export function weightedSample(pool, n, save) {
  const bag = pool.map((item) => ({ item, wgt: weightFor(item, save) }));
  const out = [];
  while (out.length < n && bag.length) {
    const total = bag.reduce((a, b) => a + b.wgt, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < bag.length; idx++) {
      r -= bag[idx].wgt;
      if (r <= 0) break;
    }
    idx = Math.min(idx, bag.length - 1);
    out.push(bag[idx].item);
    bag.splice(idx, 1);
  }
  return out;
}

const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function letterPool(stage) {
  return [...new Set([...(stage.letters || []), ...(stage.review || []).filter((x) => typeof x === "string")])];
}

function similarWords(target, pool, n) {
  const cands = pool.filter((x) => x.word.toLowerCase() !== target.word.toLowerCase());
  const score = (x) => {
    let sc = 0;
    if (x.word.length === target.word.length) sc += 3;
    const a = target.word.toLowerCase();
    const b = x.word.toLowerCase();
    if (a[0] === b[0]) sc += 2;
    if (a[a.length - 1] === b[b.length - 1]) sc += 2;
    for (const ch of new Set(b)) if (a.includes(ch)) sc += 0.5;
    return sc + Math.random() * 2;
  };
  return cands
    .map((x) => ({ x, sc: score(x) }))
    .sort((p, q) => q.sc - p.sc)
    .slice(0, n)
    .map((p) => p.x);
}

function uniqueByWord(list) {
  const seen = new Set();
  return list.filter((x) => {
    const k = x.word.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function withPics(list) {
  return list.filter((x) => x.pic);
}

function uniquePics(list, exceptPic, n) {
  const seen = new Set([exceptPic]);
  const out = [];
  for (const x of shuffle([...list])) {
    if (!x.pic || seen.has(x.pic)) continue;
    seen.add(x.pic);
    out.push(x);
    if (out.length >= n) break;
  }
  return out;
}

function decoyGraphemes(item, stage, n) {
  const used = new Set(item.g.map((g) => g.toLowerCase()));
  const own = new Set();
  for (const wd of stage.words || []) for (const g of wd.g) own.add(g.toLowerCase());
  for (const t of stage.targets || []) if (!t.includes("_")) own.add(t);
  const pool = shuffle([...own].filter((g) => !used.has(g)));
  const extra = shuffle(ALL_LETTERS.filter((g) => !used.has(g) && !own.has(g)));
  return [...pool, ...extra].slice(0, n);
}

/* ---------- play builders ---------- */

function buildSoundId(stage, save, target) {
  const letters = letterPool(stage);
  const t = target || pick(stage.letters);
  const decoys = shuffle(letters.filter((l) => l !== t)).slice(0, stage.id === 1 ? 2 : 3);
  return {
    type: "rush", variant: "sound",
    prompt: { speakSound: t, label: "Hear the sound. Tap the letter!" },
    options: shuffle([t, ...decoys]).map((l) => ({ label: l, correct: l === t })),
    keys: [t], answer: t,
  };
}

function buildInitial(stage, save) {
  const letters = letterPool(stage);
  const cands = withPics((stage.words || CVC_ALL)).filter((x) => letters.includes(x.g[0].toLowerCase()));
  const item = weightedSample(cands.length ? cands : withPics(CVC_ALL), 1, save)[0];
  const t = item.g[0].toLowerCase();
  const decoys = shuffle(letters.filter((l) => l !== t)).slice(0, stage.id === 1 ? 2 : 3);
  return {
    type: "rush", variant: "initial", item,
    prompt: { speakWord: item, pic: item.pic, label: `Which sound starts "${item.word}"?` },
    options: shuffle([t, ...decoys]).map((l) => ({ label: l, correct: l === t })),
    keys: [t], answer: t,
  };
}

function buildDefenseLetter(stage, save) {
  const letters = letterPool(stage);
  const t = pick(stage.letters);
  const decoys = shuffle(letters.filter((l) => l !== t)).slice(0, 2);
  return {
    type: "defense", variant: "letter",
    prompt: { speakSound: t, label: "Tackle the letter that makes this sound!" },
    options: shuffle([t, ...decoys]).map((l) => ({ label: l, correct: l === t })),
    keys: [t], answer: t,
  };
}

function buildPass(stage, save, item) {
  const it = item || weightedSample(stage.words, 1, save)[0];
  const decoys = decoyGraphemes(it, stage, stage.decoys || 3);
  return {
    type: "pass", item: it,
    tiles: shuffle([...it.g, ...decoys]),
    keys: keysFor(it), answer: it.word,
  };
}

function buildRush(stage, save, variant) {
  const pool = uniqueByWord(stage.words);
  const item = weightedSample(pool, 1, save)[0];
  const decoyPool = uniqueByWord([...pool, ...((stage.review || []).filter((x) => typeof x === "object"))]);
  if (variant === "read" && item.pic) {
    // Read the word silently, tap the matching picture.
    const others = uniquePics(decoyPool, item.pic, 2);
    return {
      type: "rush", variant: "read", item,
      prompt: { showWord: item.word, label: "Read the word. Tap the picture!" },
      options: shuffle([item, ...others]).map((x) => ({ label: x.pic, word: x.word, big: true, correct: x === item })),
      keys: keysFor(item), answer: item.word,
    };
  }
  if (variant === "pic" && item.pic) {
    const others = similarWords(item, decoyPool, 2);
    return {
      type: "rush", variant: "pic", item,
      prompt: { pic: item.pic, speakWord: item, label: "Which word is this?" },
      options: shuffle([item, ...others]).map((x) => ({ label: x.word, correct: x === item })),
      keys: keysFor(item), answer: item.word,
    };
  }
  const others = similarWords(item, decoyPool, stage.id >= 8 ? 3 : 2);
  return {
    type: "rush", variant: "hear", item,
    prompt: { speakWord: item, label: "Hear the word. Tap it!" },
    options: shuffle([item, ...others]).map((x) => ({ label: x.word, correct: x === item })),
    keys: keysFor(item), answer: item.word,
  };
}

function buildKick(stage, save) {
  const pool = stage.words.filter((x) => x.g.length >= 3 && !x.sight);
  const item = weightedSample(pool, 1, save)[0];
  let idx;
  if (stage.focus === "magic-e") {
    idx = item.g.findIndex((g) => "aiou".includes(g));
  } else if (stage.targets && stage.targets.length) {
    idx = item.g.findIndex((g) => stage.targets.includes(g.toLowerCase()));
    if (idx < 0) idx = Math.floor(Math.random() * item.g.length);
  } else {
    idx = Math.random() < 0.6 ? 1 : Math.random() < 0.5 ? 0 : item.g.length - 1;
  }
  const t = item.g[idx];
  const decoys = decoyGraphemes({ g: [t] }, stage, 3).filter((d) => d.toLowerCase() !== t.toLowerCase()).slice(0, 3);
  // Prefer confusable vowels when the blank is a vowel.
  if ("aeiou".includes(t.toLowerCase()) && t.length === 1) {
    const vowels = shuffle("aeiou".split("").filter((v) => v !== t.toLowerCase())).slice(0, 3);
    decoys.splice(0, decoys.length, ...vowels);
  }
  return {
    type: "kick", item, blank: idx,
    options: shuffle([t, ...decoys]).map((g) => ({ label: g, correct: g === t })),
    keys: [t.toLowerCase(), item.word.toLowerCase()], answer: t,
  };
}

function buildDefense(stage, save) {
  const targets = stage.targets || [];
  const t = pick(targets);
  const isMagic = t.includes("_");
  const has = (x) => (isMagic ? magicKey(x) === t : x.g.map((g) => g.toLowerCase()).includes(t));
  const yes = stage.words.filter(has);
  const no = uniqueByWord([...stage.words, ...((stage.review || []).filter((x) => typeof x === "object"))]).filter((x) => !has(x));
  if (!yes.length || no.length < 2) return buildRush(stage, save, "hear");
  const item = weightedSample(yes, 1, save)[0];
  const others = shuffle(no).slice(0, 2);
  const label = isMagic ? `Tackle the word with magic e and long ${t[0]}!` : `Tackle the word with "${t}"!`;
  return {
    type: "defense", variant: "grapheme", item, target: t,
    prompt: { speakSound: isMagic ? `long-${t[0]}` : t, label, showTarget: t.replace("_", "－") },
    options: shuffle([item, ...others]).map((x) => ({ label: x.word, correct: x === item })),
    keys: [t, item.word.toLowerCase()], answer: item.word,
  };
}

function buildDefenseSight(stage, save) {
  const item = weightedSample(stage.words, 1, save)[0];
  const others = similarWords(item, stage.words, 2);
  return {
    type: "defense", variant: "sight", item,
    prompt: { speakWord: item, label: `Tackle the word "${item.word}"!` },
    options: shuffle([item, ...others]).map((x) => ({ label: x.word, correct: x === item })),
    keys: [item.word], answer: item.word,
  };
}

function buildReadZone(stage, save, used) {
  const maxStage = stage.id;
  const pool = SENTENCES.filter((x) => x.stage <= maxStage && x.stage >= Math.max(8, maxStage - 2) && !used.has(x.text));
  const sent = pick(pool.length ? pool : SENTENCES.filter((x) => x.stage <= maxStage));
  used.add(sent.text);
  const decoyPics = shuffle([...new Set(SENTENCES.map((x) => x.pic).filter((p) => p !== sent.pic))]).slice(0, 2);
  return {
    type: "readzone", sentence: sent,
    options: shuffle([sent.pic, ...decoyPics]).map((p) => ({ label: p, big: true, correct: p === sent.pic })),
    keys: sent.text.replace(/[^a-zA-Z ]/g, "").toLowerCase().split(" ").filter((x) => x.length > 2),
    answer: sent.pic,
  };
}

/**
 * Build the sequence of plays for one game. Play types rotate through the
 * stage's list; items are sampled with weight toward weak sounds.
 */
export function buildGamePlan(stage, save, heat = 1) {
  const n = stage.count + (heat > 1 ? 1 : 0);
  const types = [...stage.plays];
  const plan = [];
  const usedSentences = new Set();
  const usedWords = new Set();
  let i = 0;
  let guard = 0;
  while (plan.length < n && guard < n * 6) {
    guard += 1;
    const type = types[i % types.length];
    i += 1;
    let spec;
    switch (type) {
      case "soundid": spec = buildSoundId(stage, save); break;
      case "initial": spec = buildInitial(stage, save); break;
      case "defense-letter": spec = buildDefenseLetter(stage, save); break;
      case "pass": spec = buildPass(stage, save); break;
      case "rush": spec = buildRush(stage, save, Math.random() < 0.3 && stage.id >= 4 ? "pic" : "hear"); break;
      case "rush-read": spec = buildRush(stage, save, "read"); break;
      case "kick": spec = buildKick(stage, save); break;
      case "defense": spec = buildDefense(stage, save); break;
      case "defense-sight": spec = buildDefenseSight(stage, save); break;
      case "readzone": spec = buildReadZone(stage, save, usedSentences); break;
      default: spec = buildRush(stage, save, "hear");
    }
    const key = spec.item ? spec.item.word + ":" + spec.type : spec.answer + ":" + spec.type + ":" + spec.variant;
    if (usedWords.has(key) && guard < n * 4) continue;
    usedWords.add(key);
    spec.stageId = stage.id;
    spec.limitMs = Math.round((stage.baseMs || 8500) * (spec.type === "readzone" ? 2.2 : spec.type === "pass" ? 1.4 : 1) / heat);
    plan.push(spec);
  }
  // Championship and later games open with an easy confidence play.
  return plan;
}

/** A play spec built specifically to re-drill a missed item later in the game. */
export function retrySpec(spec, stage, save) {
  if (spec.type === "pass" && spec.item) return { ...buildPass(stage, save, spec.item), retry: true, limitMs: spec.limitMs * 1.2 };
  if (spec.type === "rush" && spec.variant === "sound") return { ...buildSoundId(stage, save, spec.answer), retry: true, limitMs: spec.limitMs * 1.2 };
  return { ...spec, retry: true, limitMs: Math.round(spec.limitMs * 1.2), options: shuffle([...spec.options]) };
}

/** Speed → yards. Faster correct answers are bigger plays. */
export function gradeYards(elapsedMs, limitMs) {
  const r = elapsedMs / limitMs;
  if (r < 0.32) return { yards: 30, tier: "big", label: "BIG PLAY!" };
  if (r < 0.55) return { yards: 18, tier: "great", label: "GREAT PLAY!" };
  if (r < 0.8) return { yards: 11, tier: "good", label: "FIRST DOWN!" };
  return { yards: 7, tier: "ok", label: "NICE GAIN!" };
}

export function prettyGrapheme(g) {
  return g.replace("_", "－");
}
