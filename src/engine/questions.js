/**
 * Battle questions. Every swing of the sword is a quick check on a verse the
 * child has mastered, so fighting doubles as spaced review.
 */

import { allVerses, verseText, tokenize, normalizeWord, isContentWord } from "../data/verses.js";
import { isMastered } from "./progress.js";
import { shuffle, pick } from "../ui.js";
import { choicesFor, stripPunct } from "../stages/common.js";

export function questionPool(profile, settings) {
  const all = allVerses(settings);
  // Only ask about verses the child actually knows. Pad with in-progress
  // verses only when nothing is mastered yet (e.g. the Arena via a restored save).
  let pool = all.filter((v) => isMastered(profile, v.id));
  if (!pool.length) pool = all.filter((v) => (profile.verses[v.id]?.stage || 0) >= 2);
  if (!pool.length) pool = all.slice(0, 3);
  return pool;
}

function decoyWords(settings, verse) {
  return allVerses(settings).filter((v) => v.id !== verse.id).flatMap((v) => tokenize(verseText(v, settings)));
}

/**
 * Build one question. Returns:
 *   { kind, verse, promptWords: [{text, hidden}], prompt, options, answer, ref }
 * `forceVerse` targets a specific verse (used by the Battle Cry).
 */
export function makeQuestion(profile, settings, { forceVerse = null, avoid = null } = {}) {
  let pool = questionPool(profile, settings);
  if (avoid && pool.length > 1) pool = pool.filter((v) => v.id !== avoid);
  const verse = forceVerse || pick(pool);
  const text = verseText(verse, settings);
  const words = tokenize(text);
  const kinds = ["next", "blank", "blank"];
  if (words.length >= 4) kinds.push("first");
  if (pool.length >= 3) kinds.push("ref");
  const kind = pick(kinds);

  if (kind === "ref") {
    const others = shuffle(allVerses(settings).filter((v) => v.id !== verse.id).map((v) => v.ref)).slice(0, 2);
    return { kind, verse, ref: verse.ref, prompt: "Where is this written?", promptWords: words.map((w) => ({ text: w })), options: shuffle([verse.ref, ...others]), answer: verse.ref };
  }
  if (kind === "first") {
    const opener = words.slice(0, 3).map(stripPunct).join(" ");
    const others = shuffle(allVerses(settings).filter((v) => v.id !== verse.id))
      .map((v) => tokenize(verseText(v, settings)).slice(0, 3).map(stripPunct).join(" "))
      .filter((o) => o.toLowerCase() !== opener.toLowerCase())
      .slice(0, 2);
    return { kind, verse, ref: verse.ref, prompt: `How does ${verse.ref} begin?`, promptWords: [], options: shuffle([opener, ...others]), answer: opener };
  }
  if (kind === "next") {
    const idx = 1 + Math.floor(Math.random() * Math.max(1, Math.min(words.length - 1, 10)));
    const { options, answer } = choicesFor(words[idx], words, decoyWords(settings, verse));
    return { kind, verse, ref: verse.ref, prompt: "What word comes next?", promptWords: words.map((w, i) => ({ text: w, hidden: i >= idx, target: i === idx })), options, answer };
  }
  // blank
  const content = words.map((w, i) => ({ w, i })).filter((x) => isContentWord(x.w));
  const target = (content.length ? pick(content) : { w: words[0], i: 0 }).i;
  const { options, answer } = choicesFor(words[target], words, decoyWords(settings, verse));
  return { kind, verse, ref: verse.ref, prompt: "Which word is missing?", promptWords: words.map((w, i) => ({ text: w, blank: i === target })), options, answer };
}

export function isCorrect(q, choice) {
  if (q.kind === "ref" || q.kind === "first") return String(choice).toLowerCase() === String(q.answer).toLowerCase();
  return normalizeWord(choice) === normalizeWord(q.answer);
}
