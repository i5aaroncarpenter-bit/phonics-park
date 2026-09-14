/**
 * Scoring for Speak the Sword: how much of the verse did the microphone hear?
 * Aligns the transcript to the verse (longest common subsequence) so a
 * skipped or repeated word costs one word, not the whole verse.
 */

import { normalizeWord } from "../data/verses.js";

const NUMBER_WORDS = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10" };

function norm(w) {
  const n = normalizeWord(w).replace(/'/g, "");
  return NUMBER_WORDS[n] || n;
}

function close(a, b) {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  // One edit apart (insert/delete/substitute) covers most mis-hearings ("Loves" / "Love").
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Returns { pct, hit: boolean[] (per verse word), heard: number, total: number }.
 */
export function scoreSpoken(verseWords, transcript) {
  const v = verseWords.map(norm).filter(Boolean);
  const h = String(transcript || "").split(/\s+/).map(norm).filter(Boolean);
  const total = v.length;
  if (!total) return { pct: 0, hit: [], heard: 0, total: 0 };
  if (!h.length) return { pct: 0, hit: v.map(() => false), heard: 0, total };
  // LCS table.
  const n = v.length;
  const m = h.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = close(v[i], h[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  // Walk back to mark which verse words were matched.
  const hit = new Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (close(v[i], h[j])) { hit[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const heard = dp[0][0];
  return { pct: heard / total, hit, heard, total };
}
