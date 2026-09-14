/** Tiny DOM helpers and shared widgets. */

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "dataset") Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  append(node, children);
  return node;
}

export function append(node, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function button(label, onClick, cls = "btn") {
  return el("button", { class: cls, type: "button", onClick }, label);
}

export function icon(glyph, cls = "ico") {
  return el("span", { class: cls, "aria-hidden": "true" }, glyph);
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function fmt(n) {
  return Number(n || 0).toLocaleString("en-US");
}

/** Top bar shared by most screens. */
export function topbar({ title, onBack, right = [], sub = "" }) {
  return el(
    "header",
    { class: "topbar" },
    onBack ? button("‹", onBack, "btn btn-back") : el("span", { class: "btn-back-spacer" }),
    el("div", { class: "topbar-title" }, el("h1", { text: title }), sub ? el("div", { class: "topbar-sub", text: sub }) : null),
    el("div", { class: "topbar-right" }, ...right),
  );
}

export function coinPill(profile) {
  return el("span", { class: "pill coin" }, icon("🪙"), el("b", { text: fmt(profile.shekels) }));
}

export function valorPill(n) {
  return el("span", { class: "pill valor", title: "Valor: verses mastered" }, icon("⚔️"), el("b", { text: fmt(n) }));
}

export function stars(n, max = 5) {
  const wrap = el("span", { class: "stars", "aria-label": `${n} of ${max} stars` });
  for (let i = 0; i < max; i++) wrap.append(el("span", { class: i < n ? "star on" : "star" }, "★"));
  return wrap;
}

export function progressBar(value, max, cls = "") {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return el("div", { class: `bar ${cls}` }, el("div", { class: "bar-fill", style: { width: pct + "%" } }));
}

/**
 * Modal dialog. Returns a promise resolving with the id of the pressed
 * button. `buttons` is [{ id, label, cls }].
 */
export function modal({ title, body, buttons = [{ id: "ok", label: "OK" }], cls = "" }) {
  return new Promise((resolve) => {
    const overlay = el("div", { class: "modal-overlay" });
    const box = el("div", { class: `modal ${cls}`, role: "dialog", "aria-modal": "true" });
    if (title) box.append(el("h2", { class: "modal-title", text: title }));
    if (body) box.append(typeof body === "string" ? el("p", { class: "modal-body", text: body }) : el("div", { class: "modal-body" }, body));
    const row = el("div", { class: "modal-buttons" });
    for (const b of buttons) {
      row.append(
        button(b.label, () => {
          overlay.remove();
          resolve(b.id);
        }, b.cls || "btn btn-primary"),
      );
    }
    box.append(row);
    overlay.append(box);
    document.body.append(overlay);
    requestAnimationFrame(() => overlay.classList.add("show"));
  });
}

/** Toast that floats up and fades. */
export function toast(text, cls = "") {
  let host = document.querySelector(".toast-host");
  if (!host) {
    host = el("div", { class: "toast-host" });
    document.body.append(host);
  }
  const t = el("div", { class: `toast ${cls}`, text });
  host.append(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 400);
  }, 2200);
}

/** Floating "+12" style number over an element. */
export function floatText(anchor, text, cls = "") {
  const r = anchor.getBoundingClientRect();
  const f = el("div", { class: `float-text ${cls}`, text });
  f.style.left = r.left + r.width / 2 + "px";
  f.style.top = r.top + "px";
  document.body.append(f);
  setTimeout(() => f.remove(), 1200);
}

export function speakButton(onClick) {
  return button("🔊", onClick, "btn btn-icon btn-speak");
}

/** Numeric PIN prompt. Resolves true when the pin matches (or none is set). */
export async function askPin(settings, purpose = "Captain's Tent") {
  if (!settings.pin) return true;
  const input = el("input", { class: "input pin-input", type: "password", inputmode: "numeric", maxlength: "6", placeholder: "PIN", autocomplete: "off" });
  const res = await modal({ title: purpose, body: el("div", {}, el("p", { text: "Ask your Captain to enter the PIN." }), input), buttons: [{ id: "cancel", label: "Back", cls: "btn" }, { id: "ok", label: "Enter" }] });
  if (res !== "ok") return false;
  if (input.value === settings.pin) return true;
  toast("That PIN is not right.", "bad");
  return false;
}
