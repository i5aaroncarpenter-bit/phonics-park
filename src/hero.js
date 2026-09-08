/**
 * SVG paper-doll rendering for the child's warrior and for enemies.
 * Gear is drawn as layers colored by tier so every purchase is visible.
 */

import { gearById, TIER_COLORS } from "./data/gear.js";

const NS = "http://www.w3.org/2000/svg";

function tierColors(g) {
  if (!g) return TIER_COLORS[1];
  return TIER_COLORS[g.relic ? 5 : Math.max(1, g.tier)] || TIER_COLORS[1];
}

function svgEl(tag, attrs = {}, ...kids) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) n.setAttribute(k, v);
  for (const k of kids) if (k) n.append(k);
  return n;
}

const P = (d, fill, extra = {}) => svgEl("path", { d, fill, ...extra });
const C = (cx, cy, r, fill, extra = {}) => svgEl("circle", { cx, cy, r, fill, ...extra });
const R = (x, y, w, h, fill, extra = {}) => svgEl("rect", { x, y, width: w, height: h, fill, ...extra });
const L = (x1, y1, x2, y2, stroke, width, extra = {}) => svgEl("line", { x1, y1, x2, y2, stroke, "stroke-width": width, "stroke-linecap": "round", ...extra });

let gradSeq = 0;

function relicGlow(svg, id) {
  const defs = svgEl("defs");
  const g = svgEl("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" });
  g.append(svgEl("stop", { offset: "0", "stop-color": "#fffbe6" }));
  g.append(svgEl("stop", { offset: "0.5", "stop-color": "#ffd76a" }));
  g.append(svgEl("stop", { offset: "1", "stop-color": "#e0a520" }));
  defs.append(g);
  const f = svgEl("filter", { id: id + "f", x: "-30%", y: "-30%", width: "160%", height: "160%" });
  f.append(svgEl("feGaussianBlur", { stdDeviation: "3", result: "b" }));
  const m = svgEl("feMerge");
  m.append(svgEl("feMergeNode", { in: "b" }));
  m.append(svgEl("feMergeNode", { in: "SourceGraphic" }));
  f.append(m);
  defs.append(f);
  svg.append(defs);
}

function fillFor(g, gid) {
  if (g?.relic && g.tier >= 5) return `url(#${gid})`;
  return tierColors(g).main;
}

/**
 * Build the warrior. `profile.look` sets skin/hair/tunic; `profile.equipped`
 * sets gear. Options: size (px height), pose: "idle" | "attack" | "hurt" | "victory".
 */
export function heroSVG(profile, { size = 260, pose = "idle", cls = "" } = {}) {
  const look = profile.look || {};
  const eq = profile.equipped || {};
  const skin = look.skin || "#e0a880";
  const hair = look.hair || "#5a3a1e";
  const tunic = look.tunic || "#7a4b2a";
  const skinDark = shade(skin, -25);

  const svg = svgEl("svg", { viewBox: "0 0 200 280", width: size * (200 / 280), height: size, class: `hero-svg pose-${pose} ${cls}` });
  const gid = "relic" + gradSeq++;
  relicGlow(svg, gid);

  const sword = gearById.get(eq.sword);
  const shield = gearById.get(eq.shield);
  const helmet = gearById.get(eq.helmet);
  const plate = gearById.get(eq.breastplate);
  const belt = gearById.get(eq.belt);
  const sandals = gearById.get(eq.sandals);
  const cloak = gearById.get(eq.cloak);

  const root = svgEl("g", { class: "hero-root" });
  svg.append(root);

  // shadow
  root.append(svgEl("ellipse", { cx: 100, cy: 266, rx: 52, ry: 8, fill: "rgba(0,0,0,.25)" }));

  // cloak
  if (cloak) {
    root.append(P("M66 100 Q60 170 48 238 L152 238 Q140 170 134 100 Z", cloak.color || "#b3261e", { class: "cloak" }));
    root.append(P("M66 100 Q60 170 48 238 L70 238 Q80 170 84 104 Z", shade(cloak.color || "#b3261e", -25)));
  }

  // legs
  root.append(R(80, 182, 17, 68, skin, { rx: 7 }));
  root.append(R(103, 182, 17, 68, skin, { rx: 7 }));
  // sandals or greaves
  if (sandals) {
    const c = tierColors(sandals);
    const f = fillFor(sandals, gid);
    if (sandals.tier >= 3) {
      root.append(R(78, 212, 21, 40, f, { rx: 5, stroke: c.dark, "stroke-width": 1.5 }));
      root.append(R(101, 212, 21, 40, f, { rx: 5, stroke: c.dark, "stroke-width": 1.5 }));
    }
    root.append(R(76, 250, 25, 12, c.main, { rx: 4 }));
    root.append(R(99, 250, 25, 12, c.main, { rx: 4 }));
    root.append(L(88, 250, 88, 226, c.dark, 2.5));
    root.append(L(111, 250, 111, 226, c.dark, 2.5));
  } else {
    root.append(R(78, 254, 21, 9, "#6b4a2a", { rx: 3 }));
    root.append(R(101, 254, 21, 9, "#6b4a2a", { rx: 3 }));
  }

  // torso / tunic
  root.append(P("M70 96 L130 96 L136 160 L138 196 L62 196 L64 160 Z", tunic));
  root.append(P("M70 96 L100 96 L100 196 L62 196 L64 160 Z", shade(tunic, -18), { opacity: 0.35 }));
  root.append(P("M62 196 L138 196 L134 184 L66 184 Z", shade(tunic, -30)));

  // breastplate
  if (plate) {
    const c = tierColors(plate);
    const f = fillFor(plate, gid);
    root.append(P("M72 98 L128 98 L132 150 Q100 166 68 150 Z", f, { stroke: c.dark, "stroke-width": 2 }));
    root.append(P("M100 102 L100 158", "none", { stroke: c.dark, "stroke-width": 2 }));
    root.append(P("M84 112 Q100 124 116 112", "none", { stroke: c.dark, "stroke-width": 2 }));
    root.append(P("M84 132 Q100 144 116 132", "none", { stroke: c.dark, "stroke-width": 2 }));
    if (plate.tier >= 3) {
      root.append(C(78, 104, 3.5, c.light));
      root.append(C(122, 104, 3.5, c.light));
    }
    if (plate.relic) root.append(P("M100 108 L104 120 L116 120 L106 128 L110 140 L100 132 L90 140 L94 128 L84 120 L96 120 Z", "#fff6c2", { opacity: 0.9 }));
  } else {
    root.append(P("M88 96 L100 118 L112 96 Z", skin));
  }

  // belt
  if (belt) {
    const c = tierColors(belt);
    root.append(R(64, 154, 72, 12, fillFor(belt, gid), { rx: 3, stroke: c.dark, "stroke-width": 1.5 }));
    root.append(R(93, 152, 14, 16, c.light, { rx: 3, stroke: c.dark, "stroke-width": 1.5 }));
  } else {
    root.append(R(64, 156, 72, 6, shade(tunic, -35), { rx: 2 }));
  }

  // arms (behind weapons)
  const armLeft = svgEl("g", { class: "arm-left" });
  armLeft.append(L(74, 104, 50, 150, skin, 16));
  armLeft.append(L(74, 104, 62, 126, tunic, 18));
  root.append(armLeft);
  const armRight = svgEl("g", { class: "arm-right" });
  armRight.append(L(126, 104, 152, 152, skin, 16));
  armRight.append(L(126, 104, 138, 126, tunic, 18));
  root.append(armRight);

  // shield on left hand
  if (shield) {
    const c = tierColors(shield);
    const f = fillFor(shield, gid);
    const sg = svgEl("g", { class: "shield" });
    if (shield.tier >= 4 && !shield.relic) {
      sg.append(P("M22 112 L76 112 L76 176 Q49 196 22 176 Z", f, { stroke: c.dark, "stroke-width": 3 }));
      sg.append(R(30, 120, 38, 50, "none", { stroke: c.dark, "stroke-width": 2 }));
    } else {
      sg.append(C(48, 150, 32, f, { stroke: c.dark, "stroke-width": 3 }));
      sg.append(C(48, 150, 22, "none", { stroke: c.dark, "stroke-width": 2 }));
      sg.append(C(48, 150, 7, c.light, { stroke: c.dark, "stroke-width": 2 }));
    }
    if (shield.relic) sg.append(P("M48 130 L52 143 L66 143 L55 151 L59 164 L48 156 L37 164 L41 151 L30 143 L44 143 Z", "#fff6c2", { opacity: 0.9, filter: `url(#${gid}f)` }));
    root.append(sg);
  } else {
    root.append(C(50, 152, 9, skin));
  }

  // sword in right hand
  const sg = svgEl("g", { class: "weapon" });
  if (sword && sword.id === "staff") {
    sg.append(L(152, 60, 152, 200, "#8b5a2b", 7));
    sg.append(P("M152 60 Q166 46 170 60 Q166 70 152 66 Z", "#8b5a2b"));
  } else if (sword && sword.id === "sling") {
    sg.append(L(152, 150, 140, 90, "#8b5a2b", 3));
    sg.append(L(152, 150, 166, 90, "#8b5a2b", 3));
    sg.append(P("M138 84 Q152 96 168 84 Q152 76 138 84 Z", "#5e3a17"));
    sg.append(C(153, 86, 4, "#9aa"));
  } else if (sword && sword.id === "benaiah_spear") {
    const c = tierColors(sword);
    sg.append(L(152, 40, 152, 215, "#8b5a2b", 6));
    sg.append(P("M152 12 L164 46 L152 40 L140 46 Z", c.main, { stroke: c.dark, "stroke-width": 1.5 }));
  } else if (sword) {
    const c = tierColors(sword);
    const bladeFill = sword.relic && sword.tier >= 5 ? `url(#${gid})` : sword.tier === 1 ? "#a97c50" : c.light;
    const len = 60 + Math.min(4, sword.tier) * 10;
    sg.append(P(`M146 158 L146 ${158 - len} L152 ${146 - len} L158 ${158 - len} L158 158 Z`, bladeFill, { stroke: c.dark, "stroke-width": 1.5, filter: sword.relic ? `url(#${gid}f)` : null }));
    sg.append(L(152, 158, 152, 158 - len + 8, "rgba(255,255,255,.6)", 1.5));
    sg.append(R(136, 156, 32, 7, c.main, { rx: 3, stroke: c.dark, "stroke-width": 1.5 }));
    sg.append(R(148, 163, 8, 22, "#4a2c14", { rx: 3 }));
    sg.append(C(152, 189, 5, c.main, { stroke: c.dark, "stroke-width": 1.5 }));
  }
  root.append(sg);
  root.append(C(152, 154, 9, skin));

  // head
  root.append(R(92, 84, 16, 14, skinDark, { rx: 4 }));
  root.append(C(100, 62, 27, skin));
  // hair
  const style = look.hairStyle || "short";
  if (style === "long") root.append(P("M72 62 Q70 30 100 30 Q130 30 128 62 L132 100 L120 96 L118 66 L82 66 L80 96 L68 100 Z", hair));
  else if (style === "curly") {
    root.append(P("M72 62 Q66 28 100 28 Q134 28 128 62 Q124 46 100 44 Q76 46 72 62 Z", hair));
    for (const [x, y] of [[74, 44], [86, 34], [100, 30], [114, 34], [126, 44], [70, 58], [130, 58]]) root.append(C(x, y, 8, hair));
  } else if (style === "braids") {
    root.append(P("M72 62 Q70 30 100 30 Q130 30 128 62 Q124 46 100 44 Q76 46 72 62 Z", hair));
    root.append(L(76, 60, 70, 108, hair, 8));
    root.append(L(124, 60, 130, 108, hair, 8));
    root.append(C(70, 110, 5, hair));
    root.append(C(130, 110, 5, hair));
  } else root.append(P("M72 62 Q70 30 100 30 Q130 30 128 62 Q124 46 100 44 Q76 46 72 62 Z", hair));

  // face
  const face = svgEl("g", { class: "face" });
  face.append(C(90, 62, 3, "#241a12"));
  face.append(C(110, 62, 3, "#241a12"));
  face.append(C(91, 61, 1, "#fff"));
  face.append(C(111, 61, 1, "#fff"));
  if (pose === "hurt") face.append(P("M92 78 Q100 72 108 78", "none", { stroke: "#7a3b2b", "stroke-width": 2.5, "stroke-linecap": "round" }));
  else face.append(P("M90 74 Q100 84 110 74", "none", { stroke: "#7a3b2b", "stroke-width": 2.5, "stroke-linecap": "round" }));
  face.append(P("M84 54 Q90 50 96 54", "none", { stroke: hair, "stroke-width": 2.5, "stroke-linecap": "round" }));
  face.append(P("M104 54 Q110 50 116 54", "none", { stroke: hair, "stroke-width": 2.5, "stroke-linecap": "round" }));
  root.append(face);

  // helmet
  if (helmet) {
    const c = tierColors(helmet);
    const f = fillFor(helmet, gid);
    root.append(P("M70 62 Q70 28 100 28 Q130 28 130 62 L130 70 L122 70 L122 56 L78 56 L78 70 L70 70 Z", f, { stroke: c.dark, "stroke-width": 2 }));
    if (helmet.tier >= 2) {
      root.append(P("M78 56 L78 84 L86 84 L88 60 Z", f, { stroke: c.dark, "stroke-width": 1.5 }));
      root.append(P("M122 56 L122 84 L114 84 L112 60 Z", f, { stroke: c.dark, "stroke-width": 1.5 }));
    }
    if (helmet.tier >= 3) root.append(P("M96 40 L104 40 L102 54 L98 54 Z", c.light));
    if (helmet.tier >= 4 && !helmet.relic) {
      root.append(P("M92 30 Q100 6 108 30 L110 36 Q100 26 90 36 Z", "#c0392b"));
      root.append(P("M88 34 Q100 12 112 34", "none", { stroke: "#c0392b", "stroke-width": 8, "stroke-linecap": "round" }));
    }
    if (helmet.relic) root.append(P("M100 30 L103 38 L112 38 L105 43 L108 52 L100 47 L92 52 L95 43 L88 38 L97 38 Z", "#fff6c2", { opacity: 0.95, filter: `url(#${gid}f)` }));
  }

  return svg;
}

/** Enemy drawings. Animals use big emoji; people/giants are SVG. */
export function enemyView(enemy, { size = 240 } = {}) {
  const wrap = document.createElement("div");
  wrap.className = `enemy-figure kind-${enemy.kind}`;
  const scale = enemy.size || 1;
  if (enemy.kind === "lion" || enemy.kind === "bear") {
    const em = document.createElement("div");
    em.className = "enemy-emoji";
    em.textContent = enemy.kind === "lion" ? "🦁" : "🐻";
    em.style.fontSize = Math.round(size * 0.55 * scale) + "px";
    wrap.append(em);
    return wrap;
  }
  const palette = {
    soldier: { skin: "#d9a074", armor: "#8d949c", cloth: "#6b3f2a", trim: "#565b62" },
    raider: { skin: "#c68b5b", armor: "#7a5a3a", cloth: "#3d3d3d", trim: "#2a2a2a" },
    captain: { skin: "#d9a074", armor: "#c07a3a", cloth: "#7a1f1f", trim: "#7d4a1d" },
    giant: { skin: "#b8845a", armor: "#b87333", cloth: "#4a2c1a", trim: "#5e3a17" },
    egyptian: { skin: "#a86b3f", armor: "#d4a83a", cloth: "#f2e6c8", trim: "#8f6a12" },
  }[enemy.kind] || { skin: "#d9a074", armor: "#8d949c", cloth: "#6b3f2a", trim: "#565b62" };

  const svg = svgEl("svg", { viewBox: "0 0 200 280", width: size * (200 / 280) * scale, height: size * scale, class: "enemy-svg" });
  const g = svgEl("g", { class: "enemy-root" });
  svg.append(g);
  g.append(svgEl("ellipse", { cx: 100, cy: 266, rx: 56, ry: 8, fill: "rgba(0,0,0,.3)" }));
  // legs
  g.append(R(76, 180, 20, 72, palette.skin, { rx: 8 }));
  g.append(R(104, 180, 20, 72, palette.skin, { rx: 8 }));
  g.append(R(72, 248, 28, 14, palette.trim, { rx: 4 }));
  g.append(R(100, 248, 28, 14, palette.trim, { rx: 4 }));
  // body
  g.append(P("M64 94 L136 94 L142 168 L144 196 L56 196 L58 168 Z", palette.cloth));
  g.append(P("M68 96 L132 96 L136 150 Q100 168 64 150 Z", palette.armor, { stroke: palette.trim, "stroke-width": 2 }));
  if (enemy.kind === "giant" || enemy.kind === "egyptian") {
    g.append(P("M100 100 L100 160", "none", { stroke: palette.trim, "stroke-width": 3 }));
    g.append(P("M76 112 Q100 128 124 112", "none", { stroke: palette.trim, "stroke-width": 3 }));
  }
  g.append(R(58, 156, 84, 12, palette.trim, { rx: 3 }));
  // arms
  g.append(L(70, 104, 42, 152, palette.skin, 18));
  g.append(L(130, 104, 158, 152, palette.skin, 18));
  // weapon: spear or sword or club
  const w = svgEl("g", { class: "enemy-weapon" });
  if (enemy.kind === "giant") {
    w.append(L(158, 150, 176, 60, "#5e3a17", 10));
    w.append(C(178, 52, 18, "#6b4a2a", { stroke: "#3a2410", "stroke-width": 3 }));
  } else if (enemy.kind === "egyptian") {
    w.append(L(158, 200, 158, 30, "#8b5a2b", 6));
    w.append(P("M158 4 L170 40 L158 34 L146 40 Z", "#c0c8d0", { stroke: "#565b62", "stroke-width": 1.5 }));
  } else if (enemy.kind === "raider") {
    w.append(P("M158 150 Q186 100 160 60 Q178 106 158 150 Z", "#c5cbd2", { stroke: "#565b62", "stroke-width": 1.5 }));
    w.append(R(150, 148, 16, 6, "#5e3a17", { rx: 2 }));
  } else {
    w.append(L(158, 200, 158, 40, "#8b5a2b", 5));
    w.append(P("M158 18 L166 44 L158 40 L150 44 Z", "#c5cbd2", { stroke: "#565b62", "stroke-width": 1.5 }));
  }
  g.append(w);
  g.append(C(158, 154, 10, palette.skin));
  // shield on the other hand for soldiers/captains
  if (enemy.kind === "soldier" || enemy.kind === "captain") {
    g.append(C(42, 150, 30, palette.armor, { stroke: palette.trim, "stroke-width": 3 }));
    g.append(C(42, 150, 8, palette.trim));
  } else g.append(C(42, 154, 10, palette.skin));
  // head
  g.append(R(90, 82, 20, 16, shade(palette.skin, -25), { rx: 4 }));
  g.append(C(100, 60, 28, palette.skin));
  // helmet
  if (enemy.kind === "egyptian") {
    g.append(P("M70 60 L70 38 Q100 20 130 38 L130 60 L120 56 L80 56 Z", "#2a5f9e", { stroke: "#f2c94c", "stroke-width": 2 }));
    g.append(R(70, 58, 60, 6, "#f2c94c"));
  } else if (enemy.kind === "raider") {
    g.append(P("M72 60 Q72 30 100 30 Q128 30 128 60 L128 72 Q100 60 72 72 Z", "#3d3d3d"));
  } else {
    g.append(P("M70 60 Q70 26 100 26 Q130 26 130 60 L130 70 L120 70 L120 54 L80 54 L80 70 L70 70 Z", palette.armor, { stroke: palette.trim, "stroke-width": 2 }));
    g.append(P("M80 54 L80 84 L88 84 L90 58 Z", palette.armor, { stroke: palette.trim, "stroke-width": 1.5 }));
    g.append(P("M120 54 L120 84 L112 84 L110 58 Z", palette.armor, { stroke: palette.trim, "stroke-width": 1.5 }));
    if (enemy.kind === "captain" || enemy.kind === "giant") g.append(P("M88 32 Q100 8 112 32", "none", { stroke: enemy.kind === "giant" ? "#3a3a3a" : "#c0392b", "stroke-width": 9, "stroke-linecap": "round" }));
  }
  // angry face
  g.append(C(90, 62, 3.5, "#1d1410"));
  g.append(C(110, 62, 3.5, "#1d1410"));
  g.append(P("M84 52 L96 57", "none", { stroke: "#1d1410", "stroke-width": 3, "stroke-linecap": "round" }));
  g.append(P("M116 52 L104 57", "none", { stroke: "#1d1410", "stroke-width": 3, "stroke-linecap": "round" }));
  g.append(P("M90 78 Q100 72 110 78", "none", { stroke: "#5a2a1a", "stroke-width": 3, "stroke-linecap": "round" }));
  if (enemy.kind === "giant") g.append(P("M84 84 Q100 96 116 84 L116 92 Q100 104 84 92 Z", shade(palette.skin, -40)));
  wrap.append(svg);
  return wrap;
}

export function shade(hex, amt) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const f = (s) => Math.max(0, Math.min(255, parseInt(s, 16) + amt)).toString(16).padStart(2, "0");
  return `#${f(m[1])}${f(m[2])}${f(m[3])}`;
}
