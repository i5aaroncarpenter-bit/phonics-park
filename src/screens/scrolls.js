/** The Scrolls — the verse library. Pick a scroll, then a verse to forge or sharpen. */

import { el, button, topbar, coinPill, valorPill, stars, progressBar } from "../ui.js";
import { allScrolls, verseText } from "../data/verses.js";
import { STAGE_REWARDS } from "../data/progress.js";
import { scrollProgress, isMastered, currentSharpness, valor, STAGE_COUNT } from "../engine/progress.js";
import { speak, stopSpeaking, recognitionAvailable } from "../speech.js";
import { sfx } from "../audio.js";
import { today } from "../save.js";

export function renderScrolls(app, ctx) {
  const { save, profile } = ctx;
  const settings = save.settings;
  const scrolls = allScrolls(settings);
  let openId = ctx.openScroll || null;

  const wrap = el("div", { class: "screen scrolls" });
  wrap.append(topbar({ title: "The Scrolls", sub: "Choose a verse to forge", onBack: ctx.onBack, right: [valorPill(valor(profile)), coinPill(profile)] }));
  const list = el("div", { class: "scroll-list" });
  wrap.append(list);
  app.replaceChildren(wrap);
  draw();

  function draw() {
    list.replaceChildren();
    for (const s of scrolls) {
      const prog = scrollProgress(profile, s);
      const open = openId === s.id;
      const card = el("div", { class: `scroll-card ${open ? "open" : ""} ${prog.mastered === prog.total ? "complete" : ""}` });
      const head = el(
        "button",
        { class: "scroll-head", type: "button", onClick: () => { sfx("page"); openId = open ? null : s.id; draw(); } },
        el("span", { class: "scroll-ico", text: s.icon }),
        el("div", { class: "scroll-text" }, el("b", { text: s.name }), el("div", { class: "small muted", text: s.subtitle })),
        el("div", { class: "scroll-prog" }, el("span", { class: "small", text: `${prog.mastered}/${prog.total}` }), progressBar(prog.mastered, prog.total, "gold-bar")),
      );
      card.append(head);
      if (open) {
        const verses = el("div", { class: "verse-list" });
        for (const v of s.verses) verses.append(verseRow(v));
        card.append(verses);
      }
      list.append(card);
    }
  }

  function verseRow(v) {
    const st = profile.verses[v.id] || { stage: 0 };
    const mastered = isMastered(profile, v.id);
    const sharp = mastered ? currentSharpness(profile, v.id) : 0;
    const text = verseText(v, settings);
    const row = el("div", { class: `verse-row ${mastered ? "mastered" : st.stage > 0 ? "started" : ""}` });
    const top = el("div", { class: "verse-row-top" });
    top.append(el("b", { class: "verse-row-ref", text: v.ref }));
    if (mastered) top.append(stars(sharp));
    else top.append(el("span", { class: "small muted", text: st.stage > 0 ? `Stage ${st.stage + 1} of ${STAGE_COUNT}: ${STAGE_REWARDS[Math.min(st.stage, STAGE_COUNT - 1)].name}` : "New" }));
    row.append(top);
    row.append(el("p", { class: "verse-row-text", text }));
    const actions = el("div", { class: "verse-row-actions" });
    actions.append(button("🔊", () => speak(text), "btn btn-icon btn-speak"));
    if (mastered) {
      actions.append(button(sharp <= 3 ? "✨ Sharpen (+8 🪙)" : "✨ Polish", () => { stopSpeaking(); ctx.onSharpen(v); }, `btn ${sharp <= 3 ? "btn-gold" : ""}`));
      if (recognitionAvailable()) actions.append(button(st.spokenOn === today() ? "🎤 Speak it" : "🎤 Speak it (+20 🪙)", () => { stopSpeaking(); ctx.onSpeak(v); }, "btn btn-mic-small"));
      actions.append(button("Practice again", () => { stopSpeaking(); ctx.onForge(v, 0); }, "btn"));
    } else {
      actions.append(button(st.stage > 0 ? "🔥 Continue forging" : "🔥 Forge this verse", () => { stopSpeaking(); ctx.onForge(v); }, "btn btn-gold"));
    }
    row.append(actions);
    return row;
  }

  return () => stopSpeaking();
}
