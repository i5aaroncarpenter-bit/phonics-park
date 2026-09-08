/**
 * The Captain's Tent — for parents. Settings, translation, PIN, progress
 * reports, recite approvals, custom verses, and warrior management.
 */

import { el, button, topbar, modal, toast, fmt } from "../ui.js";
import { allVerses, verseText, TRANSLATIONS, SCROLLS, getVerse } from "../data/verses.js";
import { rankFor } from "../data/progress.js";
import { valor, currentSharpness, isMastered, recordRecite, checkBadges, grant } from "../engine/progress.js";
import { exportSave, importSave, persist as persistRaw } from "../save.js";
import { setSpeechEnabled, speechAvailable } from "../speech.js";
import { setMusic, setSfx, sfx } from "../audio.js";

export function renderTent(app, ctx) {
  const { save } = ctx;
  const settings = save.settings;
  let tab = ctx.tab || "settings";

  const wrap = el("div", { class: "screen tent" });
  wrap.append(topbar({ title: "Captain's Tent", sub: "For parents and teachers", onBack: ctx.onBack }));
  const tabs = el("div", { class: "tent-tabs" });
  const body = el("div", { class: "tent-body" });
  wrap.append(tabs, body);
  app.replaceChildren(wrap);
  draw();

  function draw() {
    tabs.replaceChildren(
      ...[["settings", "⚙️ Settings"], ["report", "📊 Progress"], ["recite", "🗣️ Recite"], ["scribe", "✍️ Scribe"], ["warriors", "👥 Warriors"]].map(([id, label]) =>
        button(label, () => { tab = id; sfx("tap"); draw(); }, `tab ${tab === id ? "on" : ""}`),
      ),
    );
    body.replaceChildren();
    ({ settings: drawSettings, report: drawReport, recite: drawRecite, scribe: drawScribe, warriors: drawWarriors })[tab]();
  }

  /* ---------- settings ---------- */
  function drawSettings() {
    const sec = (title) => el("h3", { class: "section-title", text: title });
    body.append(sec("Bible translation"));
    body.append(el("p", { class: "small muted", text: "Both are public domain. The WEB shows \"the LORD\" for the divine name. Use the Scribe tab to type verses from your family's own Bible." }));
    const tRow = el("div", { class: "choice-row" });
    for (const t of Object.values(TRANSLATIONS)) {
      tRow.append(button(`${t.name} · ${t.long}`, () => { settings.translation = t.id; ctx.persist(); toast(`Now using the ${t.name}.`, "good"); draw(); }, `btn ${settings.translation === t.id ? "btn-gold" : ""}`));
    }
    body.append(tRow);

    body.append(sec("Sound"));
    body.append(
      el("div", { class: "choice-row" },
        toggle("Read verses aloud", settings.tts, (v) => { settings.tts = v; setSpeechEnabled(v); }, speechAvailable() ? "" : "This browser has no speech voices."),
        toggle("Music", settings.music, (v) => { settings.music = v; setMusic(v); }),
        toggle("Sound effects", settings.sfx, (v) => { settings.sfx = v; setSfx(v); })),
    );

    body.append(sec("Captain's PIN"));
    body.append(el("p", { class: "small muted", text: "A PIN keeps children out of the Tent and makes recite approvals honest. Leave blank for no PIN." }));
    const pin = el("input", { class: "input", type: "password", inputmode: "numeric", maxlength: "6", placeholder: settings.pin ? "PIN is set" : "No PIN", autocomplete: "off" });
    body.append(el("div", { class: "row" }, pin, button("Save PIN", () => { settings.pin = pin.value.replace(/\D/g, "").slice(0, 6); ctx.persist(); toast(settings.pin ? "PIN saved." : "PIN removed.", "good"); pin.value = ""; }, "btn btn-primary")));

    body.append(sec("Backup"));
    body.append(
      el("div", { class: "row wrap" },
        button("Copy save to clipboard", async () => {
          try { await navigator.clipboard.writeText(exportSave(save)); toast("Save copied. Paste it somewhere safe.", "good"); } catch { toast("Clipboard blocked. Try the download.", "bad"); }
        }, "btn"),
        button("Download save file", () => {
          const a = el("a", { href: URL.createObjectURL(new Blob([exportSave(save)], { type: "application/json" })), download: "mighty-men-save.json" });
          a.click();
        }, "btn"),
        button("Restore from pasted save", async () => {
          const ta = el("textarea", { class: "input", rows: "5", placeholder: "Paste save text here" });
          const r = await modal({ title: "Restore save", body: ta, buttons: [{ id: "cancel", label: "Cancel", cls: "btn" }, { id: "ok", label: "Restore", cls: "btn btn-gold" }] });
          if (r !== "ok") return;
          try {
            const data = importSave(ta.value);
            persistRaw(data);
            toast("Restored! Reloading...", "good");
            setTimeout(() => location.reload(), 600);
          } catch (e) {
            toast("That did not look like a save file.", "bad");
          }
        }, "btn")),
    );

    body.append(sec("How the game teaches"));
    body.append(
      el("ul", { class: "how" },
        el("li", { text: "The Forge takes every verse through 5 stages: hear it, rebuild it, fill the gaps, race the next word, then recite it from a word bank and name the reference." }),
        el("li", { text: "Mastered verses become swords with 1-5 stars of sharpness. Stars fade over days (1, 2, 4, 7, 14, 30) unless the child Sharpens, which is spaced repetition in disguise." }),
        el("li", { text: "Battles are turn-based and every attack is a quick question from mastered verses, so fighting is review." }),
        el("li", { text: "Recite approvals (this tent or after mastery) reward saying the verse aloud to a real person." })),
    );
  }

  function toggle(label, on, set, note = "") {
    const b = button(`${on ? "✅" : "⬜"} ${label}`, () => { set(!on); ctx.persist(); draw(); }, "btn");
    return el("div", { class: "toggle" }, b, note ? el("div", { class: "small muted", text: note }) : null);
  }

  /* ---------- progress report ---------- */
  function drawReport() {
    if (!save.profiles.length) return body.append(el("p", { text: "No warriors yet." }));
    for (const p of save.profiles) {
      const r = rankFor(p.xp);
      const card = el("div", { class: "report-card" });
      card.append(el("h3", { text: `${p.name} · ${r.icon} ${r.name}` }));
      card.append(el("div", { class: "small muted", text: `Valor ${valor(p)} · ${fmt(p.shekels)} shekels · ${p.stats.battlesWon} battles won · ${p.streak.count}-day streak · last played ${p.lastPlayed ? new Date(p.lastPlayed).toLocaleDateString() : "never"}` }));
      const mastered = allVerses(settings).filter((v) => isMastered(p, v.id));
      const learning = allVerses(settings).filter((v) => (p.verses[v.id]?.stage || 0) > 0 && !isMastered(p, v.id));
      const dull = mastered.filter((v) => currentSharpness(p, v.id) <= 2);
      if (dull.length) card.append(el("p", { class: "warn", text: `Needs review soon: ${dull.map((v) => v.ref).join(", ")}` }));
      if (learning.length) card.append(el("p", { text: `In the Forge: ${learning.map((v) => `${v.ref} (stage ${p.verses[v.id].stage + 1}/5)`).join(", ")}` }));
      card.append(el("p", { text: mastered.length ? `Mastered (${mastered.length}): ${mastered.map((v) => `${v.ref} ${"★".repeat(currentSharpness(p, v.id))}`).join(" · ")}` : "No verses mastered yet." }));
      const gift = button("🎁 Captain's Gift: +25 shekels", () => {
        grant(p, { shekels: 25, xp: 0 });
        ctx.persist();
        sfx("coins");
        toast(`${p.name} received 25 shekels.`, "good");
        draw();
      }, "btn");
      card.append(el("div", { class: "row" }, gift, el("span", { class: "small muted", text: "Reward real-life obedience, kindness, or a verse said at dinner." })));
      body.append(card);
    }
  }

  /* ---------- recite approvals ---------- */
  function drawRecite() {
    body.append(el("p", { class: "small muted", text: "Listen to your warrior say a mastered verse from memory, then tap \"Heard it\". Each verse pays 30 shekels once and sets the sword to 5 stars." }));
    for (const p of save.profiles) {
      const pending = allVerses(settings).filter((v) => isMastered(p, v.id) && !p.verses[v.id].recited);
      const card = el("div", { class: "report-card" });
      card.append(el("h3", { text: p.name }));
      if (!pending.length) card.append(el("p", { class: "small muted", text: "Nothing waiting. Master more verses!" }));
      for (const v of pending) {
        card.append(
          el("div", { class: "recite-row" },
            el("div", {}, el("b", { text: v.ref }), el("div", { class: "small", text: verseText(v, settings) })),
            button("Heard it ✔", () => {
              recordRecite(p, v.id);
              checkBadges(p, settings);
              ctx.persist();
              sfx("fanfare");
              toast(`${p.name} recited ${v.ref}! +30 shekels`, "good");
              draw();
            }, "btn btn-gold")),
        );
      }
      body.append(card);
    }
  }

  /* ---------- scribe: custom verses and overrides ---------- */
  function drawScribe() {
    body.append(el("h3", { class: "section-title", text: "Add a verse from your own Bible" }));
    body.append(el("p", { class: "small muted", text: "Custom verses appear in \"Our Family's Scroll\" and work in every stage and battle." }));
    const ref = el("input", { class: "input", type: "text", placeholder: "Reference, e.g. Psalm 100:1" });
    const text = el("textarea", { class: "input", rows: "3", placeholder: "Verse text" });
    body.append(el("div", { class: "col" }, ref, text, button("Add to Our Family's Scroll", () => {
      const r = ref.value.trim();
      const t = text.value.trim().replace(/\s+/g, " ");
      if (!r || t.split(" ").length < 2) return toast("Enter a reference and at least two words.", "bad");
      settings.customVerses.push({ id: "c" + Math.random().toString(36).slice(2, 8), ref: r, text: t });
      ctx.persist();
      ref.value = "";
      text.value = "";
      sfx("page");
      toast("Verse added!", "good");
      draw();
    }, "btn btn-gold")));

    if (settings.customVerses.length) {
      body.append(el("h3", { class: "section-title", text: "Our Family's Scroll" }));
      for (const v of settings.customVerses) {
        body.append(el("div", { class: "recite-row" }, el("div", {}, el("b", { text: v.ref }), el("div", { class: "small", text: v.text })), button("Remove", async () => {
          const r = await modal({ title: `Remove ${v.ref}?`, body: "Progress on this verse will be lost.", buttons: [{ id: "no", label: "Keep", cls: "btn" }, { id: "yes", label: "Remove", cls: "btn btn-danger" }] });
          if (r !== "yes") return;
          settings.customVerses = settings.customVerses.filter((x) => x.id !== v.id);
          ctx.persist();
          draw();
        }, "btn")));
      }
    }

    body.append(el("h3", { class: "section-title", text: "Edit a built-in verse" }));
    body.append(el("p", { class: "small muted", text: "Type the wording from the translation your family memorizes. Leave blank to use the built-in text." }));
    const sel = el("select", { class: "input" });
    for (const s of SCROLLS) {
      const og = el("optgroup", { label: s.name });
      for (const v of s.verses) og.append(el("option", { value: v.id, text: `${v.ref}${settings.overrides[v.id] ? " (edited)" : ""}` }));
      sel.append(og);
    }
    const ta = el("textarea", { class: "input", rows: "3" });
    const load = () => { ta.value = settings.overrides[sel.value] || ""; ta.placeholder = verseText(getVerse(sel.value), { ...settings, overrides: {} }); };
    sel.addEventListener("change", load);
    load();
    body.append(el("div", { class: "col" }, sel, ta, el("div", { class: "row" },
      button("Save wording", () => {
        const t = ta.value.trim().replace(/\s+/g, " ");
        if (t) settings.overrides[sel.value] = t;
        else delete settings.overrides[sel.value];
        ctx.persist();
        toast(t ? "Wording saved." : "Using built-in text.", "good");
        draw();
      }, "btn btn-gold"))));
  }

  /* ---------- warriors ---------- */
  function drawWarriors() {
    for (const p of save.profiles) {
      const row = el("div", { class: "recite-row" });
      row.append(el("div", {}, el("b", { text: p.name }), el("div", { class: "small muted", text: `Valor ${valor(p)} · ${fmt(p.shekels)} shekels · created ${new Date(p.createdAt).toLocaleDateString()}` })));
      const acts = el("div", { class: "row" });
      acts.append(button("Rename", async () => {
        const inp = el("input", { class: "input", type: "text", maxlength: "16", value: p.name });
        const r = await modal({ title: "Rename warrior", body: inp, buttons: [{ id: "cancel", label: "Cancel", cls: "btn" }, { id: "ok", label: "Save", cls: "btn btn-gold" }] });
        if (r === "ok" && inp.value.trim()) { p.name = inp.value.trim().slice(0, 16); ctx.persist(); draw(); }
      }, "btn"));
      acts.append(button("Delete", async () => {
        const r = await modal({ title: `Delete ${p.name}?`, body: "All of this warrior's progress, shekels and gear will be gone forever.", buttons: [{ id: "no", label: "Keep", cls: "btn" }, { id: "yes", label: "Delete forever", cls: "btn btn-danger" }] });
        if (r !== "yes") return;
        save.profiles = save.profiles.filter((x) => x.id !== p.id);
        if (save.active === p.id) save.active = null;
        ctx.persist();
        toast(`${p.name} was removed.`, "good");
        draw();
      }, "btn btn-danger"));
      row.append(acts);
      body.append(row);
    }
    if (!save.profiles.length) body.append(el("p", { text: "No warriors yet. Create one from the title screen." }));
  }
}
