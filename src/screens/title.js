/** Title screen: the Roll of the Mighty (choose a warrior) and warrior creation. */

import { el, button, fmt, modal, toast } from "../ui.js";
import { heroSVG } from "../hero.js";
import { newProfile, LOOKS } from "../save.js";
import { rankFor } from "../data/progress.js";
import { valor } from "../engine/progress.js";
import { sfx } from "../audio.js";

export function renderTitle(app, ctx) {
  const { save } = ctx;
  const wrap = el("div", { class: "screen title" });
  const logo = el("div", { class: "logo" }, el("div", { class: "logo-top", text: "David's" }), el("h1", { class: "logo-main", text: "MIGHTY MEN" }), el("div", { class: "logo-sub", text: "Warriors of the Word" }));
  const verse = el("p", { class: "title-verse", text: "\"Be strong and courageous.\" — Joshua 1:9" });
  wrap.append(logo, verse);

  const roll = el("div", { class: "roll" });
  wrap.append(el("h2", { class: "roll-title", text: save.profiles.length ? "The Roll of the Mighty" : "Who will answer the call?" }));
  const sorted = save.profiles.slice().sort((a, b) => valor(b) - valor(a) || b.xp - a.xp);
  sorted.forEach((p, i) => {
    const rank = rankFor(p.xp);
    const card = el(
      "button",
      { class: "roll-card", type: "button", onClick: () => { sfx("drum"); ctx.onChoose(p); } },
      el("div", { class: "roll-pos", text: i === 0 && sorted.length > 1 ? "👑" : `#${i + 1}` }),
      heroSVG(p, { size: 120 }),
      el("div", { class: "roll-info" }, el("b", { class: "roll-name", text: p.name }), el("div", { class: "roll-rank", text: `${rank.icon} ${rank.name}` }), el("div", { class: "roll-stats", text: `⚔️ ${valor(p)} verses · 🪙 ${fmt(p.shekels)}` })),
    );
    roll.append(card);
  });
  wrap.append(roll);

  const actions = el("div", { class: "title-actions" });
  actions.append(button("＋ New Warrior", () => createFlow(), "btn btn-gold btn-big"));
  actions.append(button("⛺ Captain's Tent", () => ctx.onTent(), "btn"));
  wrap.append(actions);
  wrap.append(el("p", { class: "title-foot", text: "Memorize God's word · Earn shekels · Forge your armor · Fight the giants" }));
  app.replaceChildren(wrap);

  function createFlow() {
    sfx("page");
    const draft = newProfile("", {});
    const preview = el("div", { class: "create-preview" });
    const nameInput = el("input", { class: "input name-input", type: "text", maxlength: "16", placeholder: "Warrior's name", autocomplete: "off" });
    const redraw = () => preview.replaceChildren(heroSVG(draft, { size: 220 }));
    redraw();

    const swatchRow = (label, key, values, isStyle = false) => {
      const row = el("div", { class: "swatch-row" }, el("span", { class: "swatch-label", text: label }));
      const group = el("div", { class: "swatches" });
      for (const v of values) {
        const s = el("button", { class: `swatch ${draft.look[key] === v ? "on" : ""}`, type: "button", title: v, style: isStyle ? {} : { background: v }, text: isStyle ? v : "" });
        s.addEventListener("click", () => {
          draft.look[key] = v;
          group.querySelectorAll(".swatch").forEach((x) => x.classList.remove("on"));
          s.classList.add("on");
          sfx("tap");
          redraw();
        });
        group.append(s);
      }
      row.append(group);
      return row;
    };

    const form = el(
      "div",
      { class: "create-form" },
      preview,
      nameInput,
      swatchRow("Skin", "skin", LOOKS.skin),
      swatchRow("Hair", "hair", LOOKS.hair),
      swatchRow("Style", "hairStyle", LOOKS.hairStyle, true),
      swatchRow("Tunic", "tunic", LOOKS.tunic),
    );
    modal({ title: "Join the Mighty Men", body: form, buttons: [{ id: "cancel", label: "Back", cls: "btn" }, { id: "ok", label: "Answer the call!", cls: "btn btn-gold" }], cls: "modal-wide" }).then((r) => {
      if (r !== "ok") return;
      const name = nameInput.value.trim();
      if (!name) {
        toast("Every warrior needs a name.", "bad");
        return createFlow();
      }
      draft.name = name;
      save.profiles.push(draft);
      save.active = draft.id;
      ctx.persist();
      sfx("fanfare");
      ctx.onChoose(draft);
    });
    setTimeout(() => nameInput.focus(), 100);
  }
}
