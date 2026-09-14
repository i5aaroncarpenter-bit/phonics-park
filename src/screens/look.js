/**
 * Look editor shared by warrior creation and the Tailor's Mirror in camp:
 * boy or girl, skin, hair color and style, tunic color.
 */

import { el, button, modal, toast } from "../ui.js";
import { heroSVG } from "../hero.js";
import { LOOKS } from "../save.js";
import { sfx } from "../audio.js";

const STYLE_LABELS = { short: "Short", curly: "Curly", long: "Long", braids: "Braids", ponytail: "Ponytail", bun: "Bun" };

/**
 * Build the editor for `profile.look` (edited in place). Returns the form
 * element plus a `redraw` hook. Pass `nameInput` to place a name field
 * under the preview.
 */
export function lookEditor(profile, { nameInput = null, size = 220 } = {}) {
  const preview = el("div", { class: "create-preview" });
  const redraw = () => preview.replaceChildren(heroSVG(profile, { size }));
  redraw();

  const bodyRow = el("div", { class: "body-pick" });
  const bodyButtons = LOOKS.body.map((b) => {
    const btn = button(b === "girl" ? "👧 Girl" : "🧒 Boy", () => {
      if (profile.look.body === b) return;
      profile.look.body = b;
      // Give a sensible default hair style when switching, but never override a deliberate pick later.
      if (b === "girl" && profile.look.hairStyle === "short") profile.look.hairStyle = "long";
      if (b === "boy" && profile.look.hairStyle === "long") profile.look.hairStyle = "short";
      bodyButtons.forEach((x) => x.classList.toggle("btn-gold", x.dataset.body === profile.look.body));
      sfx("tap");
      syncStyles();
      redraw();
    }, `btn body-btn ${profile.look.body === b ? "btn-gold" : ""}`);
    btn.dataset.body = b;
    return btn;
  });
  bodyRow.append(...bodyButtons);

  let styleGroup = null;
  const swatchRow = (label, key, values, isStyle = false) => {
    const row = el("div", { class: "swatch-row" }, el("span", { class: "swatch-label", text: label }));
    const group = el("div", { class: "swatches" });
    for (const v of values) {
      const s = el("button", { class: `swatch ${profile.look[key] === v ? "on" : ""}`, type: "button", title: v, dataset: { value: v }, style: isStyle ? {} : { background: v }, text: isStyle ? STYLE_LABELS[v] || v : "" });
      s.addEventListener("click", () => {
        profile.look[key] = v;
        group.querySelectorAll(".swatch").forEach((x) => x.classList.remove("on"));
        s.classList.add("on");
        sfx("tap");
        redraw();
      });
      group.append(s);
    }
    row.append(group);
    if (isStyle) styleGroup = group;
    return row;
  };
  function syncStyles() {
    if (!styleGroup) return;
    styleGroup.querySelectorAll(".swatch").forEach((x) => x.classList.toggle("on", x.dataset.value === profile.look.hairStyle));
  }

  const form = el(
    "div",
    { class: "create-form" },
    preview,
    nameInput,
    bodyRow,
    swatchRow("Skin", "skin", LOOKS.skin),
    swatchRow("Hair", "hair", LOOKS.hair),
    swatchRow("Style", "hairStyle", LOOKS.hairStyle, true),
    swatchRow("Tunic", "tunic", LOOKS.tunic),
  );
  return { el: form, redraw };
}

/** The Tailor's Mirror: change an existing warrior's look. Resolves true when saved. */
export async function openMirror(profile, persist) {
  const before = { ...profile.look };
  const editor = lookEditor(profile, { size: 200 });
  sfx("page");
  const r = await modal({
    title: "🪞 The Tailor's Mirror",
    body: el("div", {}, el("p", { class: "small muted center", text: "A new look for the same brave heart. Your gear and progress stay exactly as they are." }), editor.el),
    buttons: [{ id: "cancel", label: "Keep the old look", cls: "btn" }, { id: "ok", label: "Wear it!", cls: "btn btn-gold" }],
    cls: "modal-wide",
  });
  if (r !== "ok") {
    profile.look = before;
    return false;
  }
  persist();
  sfx("unlock");
  toast("Looking mighty!", "good");
  return true;
}
