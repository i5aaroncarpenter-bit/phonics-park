/** Shared helpers for the mini-games: countdown clock, option grids, reveals. */

import { esc } from "../ui.js";
import { KEYWORDS } from "../curriculum.js";

/** Animated time bar. Calls onExpire once when time runs out. */
export function startClock(bar, ms, onExpire) {
  const t0 = performance.now();
  let dead = false;
  let raf = 0;
  let paused = 0;
  let pauseAt = 0;
  const tick = (now) => {
    if (dead) return;
    const u = Math.min(1, (now - t0 - paused) / ms);
    if (bar) {
      bar.style.transform = `scaleX(${1 - u})`;
      bar.classList.toggle("low", u > 0.72);
    }
    if (u >= 1) {
      dead = true;
      onExpire && onExpire();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return {
    elapsed: () => performance.now() - t0 - paused,
    stop() { dead = true; cancelAnimationFrame(raf); },
    pause() { if (!pauseAt) pauseAt = performance.now(); },
    resume() { if (pauseAt) { paused += performance.now() - pauseAt; pauseAt = 0; } },
  };
}

/** Render a row of big tappable option buttons. */
export function optionButtons(options, { cls = "", hints = false } = {}) {
  return options
    .map((o, i) => {
      const label = esc(o.label);
      const hint = hints && !o.big && KEYWORDS[String(o.label).toLowerCase()] ? `<small class="kw">${KEYWORDS[String(o.label).toLowerCase()][1]}</small>` : "";
      return `<button class="opt ${cls} ${o.big ? "opt-big" : ""}" data-i="${i}" type="button" aria-label="${esc(o.word || o.label)}"><span class="opt-label">${label}</span>${hint}</button>`;
    })
    .join("");
}

export function markCorrect(container, options) {
  container.querySelectorAll(".opt").forEach((b) => {
    const o = options[Number(b.dataset.i)];
    if (o && o.correct) b.classList.add("good", "reveal");
    b.disabled = true;
  });
}

export function shakeEl(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

export function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Split a sentence into tappable word chips. */
export function sentenceChips(text) {
  return text
    .split(" ")
    .map((wd) => `<button class="word-chip" type="button" data-w="${esc(wd.replace(/[^a-zA-Z']/g, ""))}">${esc(wd)}</button>`)
    .join(" ");
}
