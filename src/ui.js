/** Small DOM helpers and inline SVG art shared by every screen. */

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const ICON = {
  speaker: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  muted: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 5M21 9l-5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" fill="currentColor"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>`,
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.2 6.7.8-5 4.6 1.4 6.7L12 17.4l-6 3.4 1.4-6.7-5-4.6 6.7-.8z" fill="currentColor"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#ffd60a" stroke="#e0a106" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="#b07d00" font-family="Baloo 2, Nunito, sans-serif">¢</text></svg>`,
  trophy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v5a5 5 0 0 1-10 0V3z" fill="#ffd60a"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="#e0a106" stroke-width="2" fill="none"/><path d="M10 14h4v3h2v3H8v-3h2z" fill="#e0a106"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>`,
  replay: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.3 4" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M5 3v6h6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10a6 6 0 0 1 12 0c0 3-2 3.5-2.5 6-.4 2-1.8 3-3.5 3" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M9.5 10a2.5 2.5 0 0 1 5 0c0 1.5-1 2-1.5 3" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
  clipboard: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2" fill="currentColor"/><rect x="9" y="2" width="6" height="4" rx="1" fill="#ffd60a"/><path d="M8 11h8M8 15h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.5 4 2-1.6-2-3.4-2.4.8a7 7 0 0 0-1.7-1L16 4.4h-4l-.4 2.4a7 7 0 0 0-1.7 1l-2.4-.8-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-.8a7 7 0 0 0 1.7 1l.4 2.4h4l.4-2.4a7 7 0 0 0 1.7-1l2.4.8 2-3.4-2-1.6a7 7 0 0 0 0-2z" fill="currentColor"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 7" stroke="currentColor" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/** A football, drawn as SVG. */
export function footballSVG(size = 48) {
  return `<svg class="football" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="fb" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#b3682c"/><stop offset="1" stop-color="#7a3d12"/></linearGradient></defs>
    <ellipse cx="32" cy="32" rx="30" ry="18" transform="rotate(-30 32 32)" fill="url(#fb)"/>
    <path d="M14 46 Q32 30 50 18" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M24 34l4 4M29 30l4 4M34 26l4 4M39 22l4 4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <path d="M6 44 Q12 50 20 54" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>
    <path d="M44 10 Q52 14 58 20" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>
  </svg>`;
}

/** Team helmet, side view, with decal style. */
export function helmetSVG({ primary, secondary, style = "solid", size = 96, number }) {
  const id = "h" + Math.random().toString(36).slice(2, 8);
  let shell = primary;
  let defs = "";
  if (style === "chrome") { defs += `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8f9fa"/><stop offset=".5" stop-color="#adb5bd"/><stop offset="1" stop-color="#e9ecef"/></linearGradient>`; shell = `url(#${id}g)`; }
  if (style === "gold") { defs += `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".5" stop-color="#e0a106"/><stop offset="1" stop-color="#ffd60a"/></linearGradient>`; shell = `url(#${id}g)`; }
  if (style === "galaxy") { defs += `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#240046"/><stop offset="1" stop-color="#5a189a"/></linearGradient>`; shell = `url(#${id}g)`; }
  let decal = "";
  if (style === "stripe") decal = `<path d="M46 8 Q50 40 48 62" stroke="${secondary}" stroke-width="9" fill="none"/>`;
  if (style === "bolt") decal = `<path d="M36 18h18l-8 14h12l-22 26 6-18H30z" fill="${secondary}"/>`;
  if (style === "star") decal = `<path d="M46 16l6 12 13 2-9.5 9 2.5 13-12-6.5-12 6.5 2.5-13L27 30l13-2z" fill="${secondary}"/>`;
  if (style === "flame") decal = `<path d="M8 60 Q20 30 34 42 Q40 20 56 36 Q66 46 74 60z" fill="#ff9f1c"/><path d="M14 60 Q26 40 36 50 Q42 36 52 46 Q60 52 66 60z" fill="#ffd60a"/>`;
  if (style === "galaxy") decal = `<g fill="#fff"><circle cx="30" cy="24" r="1.6"/><circle cx="52" cy="18" r="1.2"/><circle cx="44" cy="40" r="1.8"/><circle cx="24" cy="46" r="1.1"/><circle cx="62" cy="34" r="1.4"/></g>`;
  return `<svg class="helmet" width="${size}" height="${size}" viewBox="0 0 96 96" aria-hidden="true">
    <defs>${defs}<clipPath id="${id}c"><path d="M10 52 C10 24 28 8 50 8 C74 8 88 26 88 48 L88 60 C88 66 82 70 76 70 L64 70 L60 82 L34 82 L32 66 C20 66 10 62 10 52z"/></clipPath></defs>
    <path d="M10 52 C10 24 28 8 50 8 C74 8 88 26 88 48 L88 60 C88 66 82 70 76 70 L64 70 L60 82 L34 82 L32 66 C20 66 10 62 10 52z" fill="${shell}"/>
    <g clip-path="url(#${id}c)">${decal}</g>
    <path d="M22 24 Q40 12 62 16" stroke="rgba(255,255,255,.4)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M60 46 h26 M60 58 h26 M64 70 v-24" stroke="#cfd8dc" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="74" cy="52" rx="10" ry="12" fill="#f2c49b" opacity=".95"/>
    <circle cx="77" cy="49" r="1.8" fill="#222"/>
    <path d="M60 46 h28 M60 58 h28 M66 40 v32" stroke="#cfd8dc" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${number != null ? `<text x="40" y="84" font-size="14" font-weight="800" fill="${secondary}" font-family="Baloo 2, Nunito, sans-serif" text-anchor="middle">${esc(number)}</text>` : ""}
  </svg>`;
}

/** A tiny team badge for opponents. */
export function mascotBadge(opp, size = 64) {
  return `<span class="mascot" style="--p:${opp.primary};--s:${opp.secondary};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.55)}px" aria-hidden="true">${opp.mascot}</span>`;
}

export function starsHTML(n, max = 3) {
  let out = '<span class="stars" aria-label="' + n + ' of ' + max + ' stars">';
  for (let i = 0; i < max; i++) out += `<i class="${i < n ? "on" : ""}">${ICON.star}</i>`;
  return out + "</span>";
}

export function muteButton(save, onToggle) {
  const btn = el(`<button class="btn icon-btn" type="button" aria-label="Sound on or off">${save.mute ? ICON.muted : ICON.speaker}</button>`);
  btn.onclick = () => {
    const next = !save.mute;
    onToggle(next);
    btn.innerHTML = next ? ICON.muted : ICON.speaker;
  };
  return btn;
}

/** Render a sound tile's keyword picture (used in early stages as a hint). */
export function keywordHint(g, KEYWORDS) {
  const k = KEYWORDS[g.toLowerCase()];
  return k ? `<small class="kw">${k[1]}</small>` : "";
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
