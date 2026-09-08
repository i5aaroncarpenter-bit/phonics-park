/** Shared pieces for the Forge mini-games and battle questions. */

import { el, shuffle, pick } from "../ui.js";
import { normalizeWord, isContentWord } from "../data/verses.js";

/** Word tile used everywhere. */
export function tile(word, cls = "") {
  return el("button", { class: `tile ${cls}`, type: "button", text: word });
}

export function shakeNode(node) {
  node.classList.remove("shake");
  void node.offsetWidth;
  node.classList.add("shake");
}

export function popNode(node) {
  node.classList.remove("pop");
  void node.offsetWidth;
  node.classList.add("pop");
}

/** Words drawn from other verses that are not in this verse; for decoys. */
export function decoysFor(words, pool, n, { similar = true } = {}) {
  const have = new Set(words.map(normalizeWord));
  const candidates = pool.filter((w) => {
    const nw = normalizeWord(w);
    return nw.length > 1 && !have.has(nw) && /^[a-z']+$/i.test(w.replace(/[.,;:!?"”“’']/g, ""));
  });
  const uniq = [...new Map(candidates.map((w) => [normalizeWord(w), w.replace(/[.,;:!?"”“’]+$/g, "")])).values()];
  const target = similar ? words.map((w) => normalizeWord(w).length).reduce((a, b) => a + b, 0) / Math.max(1, words.length) : 5;
  const sorted = shuffle(uniq).sort((a, b) => Math.abs(a.length - target) - Math.abs(b.length - target)).slice(0, Math.max(n * 3, 12));
  return shuffle(sorted).slice(0, n);
}

/** Choose ~35% of positions to blank, favoring content words, spaced apart. */
export function chooseBlanks(words, ratio = 0.35, { min = 2, max = 9 } = {}) {
  const n = Math.max(Math.min(min, words.length - 1), Math.min(max, Math.round(words.length * ratio)));
  const content = words.map((w, i) => ({ w, i })).filter((x) => isContentWord(x.w));
  const source = content.length >= n ? content : words.map((w, i) => ({ w, i }));
  const seen = new Set();
  const cands = shuffle(source).filter((x) => {
    const k = normalizeWord(x.w);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const chosen = [];
  for (const c of cands) {
    if (chosen.length >= n) break;
    if (chosen.some((j) => Math.abs(j - c.i) <= 1) && cands.length > n * 2) continue;
    chosen.push(c.i);
  }
  for (const c of cands) {
    if (chosen.length >= n) break;
    if (!chosen.includes(c.i)) chosen.push(c.i);
  }
  return chosen.sort((a, b) => a - b);
}

/** Three answer choices for "what word comes next" style questions. */
export function choicesFor(correct, words, pool, n = 3) {
  const nc = normalizeWord(correct);
  const inVerse = [...new Set(words.filter((w) => normalizeWord(w) !== nc && normalizeWord(w).length > 1).map((w) => w.replace(/[.,;:!?"”“’]+$/g, "")))];
  let others = shuffle(inVerse).slice(0, n - 1);
  if (others.length < n - 1) others = others.concat(decoysFor(words, pool, n - 1 - others.length));
  const clean = correct.replace(/[.,;:!?"”“’]+$/g, "").replace(/^["“‘']+/, "");
  const opts = shuffle([clean, ...others.map((o) => o.replace(/^["“‘']+/, ""))]);
  return { options: opts, answer: clean };
}

/** Animated countdown bar. */
export function timerBar(seconds, onExpire) {
  const wrap = el("div", { class: "timer" });
  const fill = el("div", { class: "timer-fill" });
  wrap.append(fill);
  let raf = 0;
  let start = 0;
  let total = seconds * 1000;
  let running = false;
  let paused = 0;
  function frame(now) {
    if (!running) return;
    const elapsed = now - start;
    const left = Math.max(0, 1 - elapsed / total);
    fill.style.transform = `scaleX(${left})`;
    wrap.classList.toggle("urgent", left < 0.3);
    if (left <= 0) {
      running = false;
      onExpire && onExpire();
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  return {
    el: wrap,
    start(sec = seconds) {
      total = sec * 1000;
      start = performance.now();
      running = true;
      fill.style.transform = "scaleX(1)";
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    pause() {
      if (!running) return;
      paused = performance.now();
      running = false;
      cancelAnimationFrame(raf);
    },
    resume() {
      if (running || !paused) return;
      start += performance.now() - paused;
      paused = 0;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    remaining() {
      return running ? Math.max(0, total - (performance.now() - start)) / 1000 : 0;
    },
  };
}

/** Verse rendered as spans, one per word, for highlighting. */
export function verseWords(words, cls = "verse-words") {
  const wrap = el("div", { class: cls });
  const spans = words.map((w) => el("span", { class: "vw", text: w }));
  spans.forEach((s) => wrap.append(s, " "));
  return { el: wrap, spans };
}

export function encourage() {
  return pick(["Well done, warrior!", "The word is in your heart!", "Mighty!", "Sharp as iron!", "Stand firm!", "Be strong and courageous!", "Your Captain is proud!", "That is how mighty men train!"]);
}

export function encourageMiss() {
  return pick(["Almost! Try again.", "Not that one. Look closely.", "Keep going, warrior.", "Steady. You know this."]);
}

export function stripPunct(w) {
  return String(w).replace(/^["“‘'(]+/, "").replace(/[.,;:!?"”“’')]+$/g, "");
}
