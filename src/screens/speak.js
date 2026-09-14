/**
 * Speak the Sword — say a mastered verse out loud from memory while the
 * device listens. The words stay hidden until they are heard, so this is a
 * true recitation, not reading. Word-perfect polishes the sword to 5 stars.
 * Browsers without speech recognition are sent to the Captain's recite flow.
 */

import { el, button, topbar, coinPill, modal } from "../ui.js";
import { verseText, tokenize } from "../data/verses.js";
import { recognitionAvailable, startListening, speak, stopSpeaking } from "../speech.js";
import { scoreSpoken } from "../engine/spoken.js";
import { recordSpoken, checkBadges, verseState } from "../engine/progress.js";
import { showReward } from "./reward.js";
import { sfx, startMusic } from "../audio.js";
import { confetti, burst, sparks } from "../fx.js";
import { today } from "../save.js";

export function renderSpeak(app, ctx) {
  const { save, profile, verse, onDone } = ctx;
  const settings = save.settings;
  const text = verseText(verse, settings);
  const words = tokenize(text);
  let session = null;
  let alive = true;

  const wrap = el("div", { class: "screen speak" });
  const header = topbar({ title: "Speak the Sword", sub: verse.ref, onBack: () => leave(), right: [coinPill(profile)] });
  const head = el("div", { class: "stage-head" }, el("h2", { text: "Say it out loud" }), el("p", { class: "stage-hint", text: "Tap the microphone, then recite the whole verse from memory. Words light up as they are heard." }));
  const card = el("div", { class: "verse-card speak-card" });
  const line = el("div", { class: "verse-words speak-words" });
  const spans = words.map((w) => el("span", { class: "vw veiled", text: w }));
  spans.forEach((s) => line.append(s, " "));
  card.append(line, el("div", { class: "verse-ref", text: verse.ref }));
  const heardEl = el("div", { class: "heard", text: "" });
  const controls = el("div", { class: "stage-controls speak-controls" });
  const mic = button("🎤 Start", () => toggle(), "btn btn-gold btn-big btn-mic");
  const hear = button("🔊 Hear it first", () => { ctx.listened && ctx.listened(); speak(text); }, "btn");
  controls.append(mic, hear);
  wrap.append(header, head, card, heardEl, controls);
  app.replaceChildren(wrap);
  startMusic("camp");

  const alreadyToday = verseState(profile, verse.id).spokenOn === today();
  if (alreadyToday) head.append(el("p", { class: "small muted", text: "You already spoke this one today — practice is free, the bonus returns tomorrow." }));

  if (!recognitionAvailable()) {
    mic.disabled = true;
    controls.replaceChildren(
      el("p", { class: "result-line", text: "This browser cannot listen. Use Chrome, Edge or Safari for Speak the Sword — or recite to your Captain in the Tent." }),
      button("Back ➜", () => onDone(), "btn btn-gold"),
    );
  }

  function paint(transcript) {
    const { hit } = scoreSpoken(words, transcript);
    spans.forEach((s, i) => {
      s.classList.toggle("veiled", !hit[i]);
      s.classList.toggle("lit", !!hit[i]);
    });
    heardEl.textContent = transcript ? `“${transcript}”` : "";
  }

  async function toggle() {
    if (session) return session.stop();
    stopSpeaking();
    sfx("tap");
    spans.forEach((s) => { s.classList.add("veiled"); s.classList.remove("lit"); });
    heardEl.textContent = "Listening…";
    mic.textContent = "⏹ I'm done";
    mic.classList.add("listening");
    hear.disabled = true;
    session = startListening({ onUpdate: (t) => alive && paint(t) });
    const { transcript, error } = await session.done;
    session = null;
    if (!alive) return;
    mic.classList.remove("listening");
    hear.disabled = false;
    mic.textContent = "🎤 Try again";
    if (error === "not-allowed" || error === "service-not-allowed") {
      heardEl.textContent = "";
      await modal({ title: "Microphone blocked", body: "Allow the microphone for this site in your browser settings, then try again. You can also recite to your Captain in the Tent.", buttons: [{ id: "ok", label: "OK", cls: "btn btn-gold" }] });
      return;
    }
    finish(transcript);
  }

  async function finish(transcript) {
    const score = scoreSpoken(words, transcript);
    paint(transcript);
    // Reveal everything so the child can see what was missed.
    spans.forEach((s, i) => { s.classList.remove("veiled"); if (!score.hit[i]) s.classList.add("missed"); });
    const out = recordSpoken(profile, verse.id, score.pct);
    const badges = out ? checkBadges(profile, settings) : [];
    ctx.persist();
    header.querySelector(".topbar-right").replaceChildren(coinPill(profile));
    const pctText = `${score.heard} of ${score.total} words heard`;
    if (out && out.perfect) {
      sfx("victory");
      confetti(120);
      burst(card, { n: 40 });
      head.querySelector("h2").textContent = "Word-perfect!";
      head.querySelector("p").textContent = pctText + ". The verse is truly in your heart.";
      if (!out.repeat) await showReward({ title: "Spoken from the heart!", subtitle: `${verse.ref} · ${pctText}`, shekels: out.shekels, xp: out.xp, sharpness: out.sharpness || undefined, rankUp: out.rankUp, badges, continueLabel: "Back ➜" });
      if (alive) onDone();
      return;
    }
    if (out) {
      sfx("good");
      sparks(card, 12);
      head.querySelector("h2").textContent = "So close!";
      head.querySelector("p").textContent = `${pctText}. Say it once more, all the way through, for the full bonus.`;
      if (!out.repeat && out.shekels) heardEl.textContent = `+${out.shekels} 🪙 for a brave try`;
    } else {
      sfx("bad");
      head.querySelector("h2").textContent = transcript ? "Not yet, warrior." : "I didn't hear anything.";
      head.querySelector("p").textContent = transcript ? `${pctText}. Listen to it once, then try again.` : "Speak clearly and a little louder, close to the device.";
    }
    controls.replaceChildren(mic, hear, button("Back ➜", () => onDone(), "btn"));
  }

  function leave() {
    alive = false;
    if (session) session.stop();
    stopSpeaking();
    onDone();
  }

  return () => {
    alive = false;
    if (session) session.stop();
    stopSpeaking();
  };
}
