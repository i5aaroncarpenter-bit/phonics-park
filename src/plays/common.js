/** Shared helpers for the mini-games: countdown clock, option grids, reveals. */

import { esc } from "../ui.js";
import { KEYWORDS } from "../curriculum.js";
import { sfx } from "../audio.js";

/**
 * Animated time bar. When the bar empties the play enters a "hurry up"
 * grace period (still answerable, graded as the slowest tier); onExpire
 * fires only after the grace period also runs out.
 */
export function startClock(bar, ms, onExpire, { graceMs = Math.round(ms * 0.9), onHurry } = {}) {
  const t0 = performance.now();
  let dead = false;
  let hurried = false;
  let raf = 0;
  let paused = 0;
  let pauseAt = 0;
  const elapsedAt = (now) => now - t0 - paused - (pauseAt ? now - pauseAt : 0);
  const tick = (now) => {
    if (dead) return;
    const e = elapsedAt(now);
    const u = Math.min(1, e / ms);
    if (u >= 1 && !hurried) {
      hurried = true;
      if (bar) bar.classList.add("hurry");
      onHurry && onHurry();
    }
    if (bar) {
      bar.style.transform = hurried ? `scaleX(${Math.max(0, 1 - (e - ms) / graceMs)})` : `scaleX(${1 - u})`;
      bar.classList.toggle("low", !hurried && u > 0.72);
    }
    if (e >= ms + graceMs) {
      dead = true;
      onExpire && onExpire();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return {
    elapsed: () => elapsedAt(performance.now()),
    stop() { dead = true; cancelAnimationFrame(raf); },
    pause() { if (!pauseAt) pauseAt = performance.now(); },
    resume() { if (pauseAt) { paused += performance.now() - pauseAt; pauseAt = 0; } },
  };
}

/** The standard play clock: bar in #bar, "HURRY!" callout when time is short. */
export function clockFor(panel, ctx, onExpire) {
  return startClock(panel.querySelector("#bar"), ctx.limitMs, onExpire, {
    onHurry: () => {
      sfx("whistle");
      if (ctx.fx) ctx.fx.callout("HURRY!", "fire", 900);
    },
  });
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
