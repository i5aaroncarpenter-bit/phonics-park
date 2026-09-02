/**
 * The stadium. A canvas renderer that draws the crowd, the gridiron, chunky
 * cartoon players and the ball, plus promise-based play animations
 * (pass, rush, kick, defense, touchdown) that the mini-games trigger.
 *
 * Coordinates: x is in yards (0..100 between goal lines, end zones at
 * -10..0 and 100..110). lane is -1 (far sideline) .. +1 (near sideline).
 * The home team always drives to the right, toward 100.
 */

const TAU = Math.PI * 2;
const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

export function createField(canvas, opts) {
  const ctx = canvas.getContext("2d");
  const home = { primary: "#d7263d", secondary: "#ffd166", helmet: "classic", number: 7, name: "ROCKETS", ...opts.home };
  const away = { primary: "#333", secondary: "#fff", name: "VISITORS", ...opts.away };
  let sky = opts.sky || "day";

  const S = {
    w: 1, h: 1, dpr: 1,
    cam: 25, camTarget: 25,
    los: 25, firstDown: 35, showLines: true,
    players: [], ball: { x: 25, lane: 0, z: 0, visible: false, rot: 0, spin: 0 },
    hype: 0.2, t: 0, alive: true,
    flashMsg: null,
  };
  const tweens = new Set();
  let raf = 0;
  let last = performance.now();

  /* ---------- layout ---------- */

  function resize() {
    const r = canvas.getBoundingClientRect();
    S.w = Math.max(1, r.width);
    S.h = Math.max(1, r.height);
    S.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = S.w * S.dpr;
    canvas.height = S.h * S.dpr;
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const viewYards = () => clamp(S.w / 18, 26, 46);
  const ppy = () => S.w / viewYards();
  const fieldTop = () => S.h * 0.40;
  const fieldBottom = () => S.h * 0.985;
  const laneY = (lane) => lerp(fieldTop() + (fieldBottom() - fieldTop()) * 0.2, fieldBottom() - 12, (lane + 1) / 2);
  const scaleAt = (lane) => clamp(S.h / 420, 0.7, 1.15) * (0.78 + 0.34 * (lane + 1) / 2);
  const xOf = (yard) => S.w / 2 + (yard - S.cam) * ppy();

  /* ---------- tweens ---------- */

  function tween(ms, fn, ease = easeInOut) {
    return new Promise((resolve) => {
      const tw = { t0: performance.now(), ms, fn, ease, resolve };
      tweens.add(tw);
    });
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function stepTweens(now) {
    for (const tw of [...tweens]) {
      const u = clamp((now - tw.t0) / tw.ms, 0, 1);
      try { tw.fn(tw.ease(u), u); } catch { /* ignore */ }
      if (u >= 1) {
        tweens.delete(tw);
        tw.resolve();
      }
    }
  }

  /* ---------- entities ---------- */

  function mk(team, x, lane, extra = {}) {
    return {
      team, x, lane, anim: "idle", phase: Math.random() * TAU, facing: team === "home" ? 1 : -1,
      hasBall: false, visible: true, number: extra.number ?? (10 + Math.floor(Math.random() * 80)), role: extra.role || "line", ...extra,
    };
  }

  function formation(los, offenseIsHome = true) {
    const O = offenseIsHome ? "home" : "away";
    const D = offenseIsHome ? "away" : "home";
    const dir = offenseIsHome ? 1 : -1;
    const p = [];
    for (let i = 0; i < 4; i++) p.push(mk(O, los - 0.6 * dir, -0.48 + i * 0.32, { anim: "stance", role: "line" }));
    p.push(mk(O, los - 2.4 * dir, 0, { role: "qb", number: offenseIsHome ? home.number : 12, anim: "stance", star: offenseIsHome }));
    p.push(mk(O, los - 4.2 * dir, 0.32, { role: "rb", anim: "stance" }));
    p.push(mk(O, los - 0.8 * dir, -0.9, { role: "wr", anim: "stance" }));
    p.push(mk(O, los - 0.8 * dir, 0.9, { role: "wr2", anim: "stance" }));
    for (let i = 0; i < 3; i++) p.push(mk(D, los + 0.9 * dir, -0.34 + i * 0.34, { anim: "stance", role: "dline" }));
    p.push(mk(D, los + 4 * dir, -0.35, { role: "lb", anim: "stance" }));
    p.push(mk(D, los + 4 * dir, 0.35, { role: "lb2", anim: "stance" }));
    p.push(mk(D, los + 9 * dir, -0.75, { role: "cb", anim: "idle" }));
    p.push(mk(D, los + 9 * dir, 0.75, { role: "cb2", anim: "idle" }));
    p.push(mk(D, los + 14 * dir, 0, { role: "s", anim: "idle" }));
    S.players = p;
    S.ball.visible = true;
    S.ball.z = 0;
    S.ball.x = los - 0.3 * dir;
    S.ball.lane = 0;
    return p;
  }
  const byRole = (r) => S.players.find((p) => p.role === r);

  function setLOS(yard, first = yard + 10) {
    S.los = clamp(yard, 0, 100);
    S.firstDown = clamp(first, 0, 100);
    S.camTarget = clamp(yard + 6, 8, 96);
  }

  /* ---------- play animations ---------- */

  async function huddle(los) {
    setLOS(los);
    formation(los, true);
    S.cam = S.camTarget;
  }

  async function snap() {
    const qb = byRole("qb");
    for (const p of S.players) if (p.anim === "stance") p.anim = "idle";
    S.ball.x = qb.x;
    qb.hasBall = true;
    S.players.filter((p) => p.role === "line" || p.role === "dline").forEach((p) => { p.anim = "block"; });
  }

  async function animPass({ gain = 10, complete = true }) {
    const qb = byRole("qb");
    const wr = byRole(gain > 20 ? "wr" : "wr2");
    const cb = byRole(wr.role === "wr" ? "cb" : "cb2");
    const s = byRole("s");
    await snap();
    const qb0 = qb.x;
    const wr0 = wr.x;
    const wrLane0 = wr.lane;
    const targetX = S.los + Math.max(4, Math.min(gain, 28)) * 0.75;
    const targetLane = wrLane0 * 0.55;
    wr.anim = "run";
    cb.anim = "run";
    await tween(560, (u) => {
      qb.x = qb0 - 3 * u;
      qb.anim = u > 0.7 ? "throw" : "run";
      qb.facing = 1;
      wr.x = lerp(wr0, targetX * 0.7 + wr0 * 0.3, u);
      wr.lane = lerp(wrLane0, targetLane, u * 0.6);
      cb.x = lerp(cb.x, wr.x + 2.5, 0.08);
      cb.lane = lerp(cb.lane, wr.lane, 0.1);
      S.camTarget = clamp(lerp(S.los + 6, targetX * 0.6 + S.los * 0.4, u), 8, 96);
    });
    // Throw.
    qb.hasBall = false;
    S.ball.visible = true;
    S.ball.z = 0;
    const bx0 = qb.x + 0.8;
    const bl0 = qb.lane;
    const endX = complete ? targetX : targetX + 5;
    const endLane = complete ? targetLane : targetLane - 0.45;
    S.ball.spin = 0.35;
    if (opts.onSfx) opts.onSfx("throw");
    await tween(complete ? 820 : 900, (u, raw) => {
      S.ball.x = lerp(bx0, endX, raw);
      S.ball.lane = lerp(bl0, endLane, raw);
      S.ball.z = Math.sin(raw * Math.PI) * (2.2 + gain / 12);
      wr.x = lerp(wr.x, complete ? endX : endX - 1.5, 0.12);
      wr.lane = lerp(wr.lane, complete ? endLane : endLane + 0.3, 0.12);
      cb.x = lerp(cb.x, wr.x + (complete ? 2 : 0.6), 0.1);
      cb.lane = lerp(cb.lane, wr.lane, 0.1);
      qb.anim = "idle";
      S.camTarget = clamp(S.ball.x + 3, 8, 96);
    }, (u) => u);
    if (!complete) {
      wr.anim = "dive";
      S.ball.spin = 0.2;
      if (opts.onSfx) opts.onSfx("catch");
      await tween(500, (u) => {
        S.ball.x += 0.08;
        S.ball.z = Math.max(0, Math.abs(Math.sin(u * Math.PI * 2)) * 0.6 * (1 - u));
        S.ball.rot += 0.2;
      });
      cb.anim = "cheer";
      await wait(400);
      return;
    }
    // Catch and run.
    if (opts.onSfx) opts.onSfx("catch");
    wr.hasBall = true;
    S.ball.visible = false;
    const finalX = Math.min(S.los + gain, 100.5);
    const startX = wr.x;
    const startLane = wr.lane;
    const td = S.los + gain >= 100;
    wr.anim = "run";
    cb.anim = "run";
    s.anim = "run";
    await tween(Math.max(380, (finalX - startX) * 70), (u) => {
      wr.x = lerp(startX, finalX, u);
      wr.lane = lerp(startLane, startLane * 0.4, u);
      cb.x = lerp(cb.x, wr.x - 1.6, 0.14);
      cb.lane = lerp(cb.lane, wr.lane + 0.15, 0.14);
      s.x = lerp(s.x, wr.x + 1.2, 0.08);
      s.lane = lerp(s.lane, wr.lane - 0.2, 0.08);
      S.camTarget = clamp(wr.x + 4, 8, 96);
    }, easeOut);
    if (!td) {
      wr.anim = "tackled";
      cb.anim = "tackle";
      s.anim = "tackle";
      s.x = wr.x + 0.6;
      if (opts.onSfx) opts.onSfx("tackle");
      await wait(350);
    } else {
      await celebrate(wr);
    }
  }

  async function animRush({ gain = 8, tackled = false }) {
    const qb = byRole("qb");
    const rb = byRole("rb");
    const lbs = S.players.filter((p) => p.role === "lb" || p.role === "lb2" || p.role === "s");
    await snap();
    const qb0 = qb.x;
    const rb0 = rb.x;
    const rbLane0 = rb.lane;
    rb.anim = "run";
    await tween(420, (u) => {
      qb.x = qb0 - 1.5 * u;
      qb.anim = "run";
      rb.x = lerp(rb0, qb.x - 0.2, u);
      rb.lane = lerp(rbLane0, 0.05, u);
    });
    qb.hasBall = false;
    rb.hasBall = true;
    qb.anim = "idle";
    if (opts.onSfx) opts.onSfx("hike");
    if (tackled) {
      const dl = S.players.filter((p) => p.role === "dline");
      const hit = dl[1];
      const start = rb.x;
      await tween(420, (u) => {
        rb.x = lerp(start, S.los - 0.6, u);
        hit.x = lerp(hit.x, rb.x + 0.6, 0.3);
        hit.lane = lerp(hit.lane, rb.lane, 0.3);
        hit.anim = "run";
        for (const l of lbs) { l.anim = "run"; l.x = lerp(l.x, rb.x + 1.5, 0.15); l.lane = lerp(l.lane, rb.lane, 0.12); }
      });
      rb.anim = "tackled";
      hit.anim = "tackle";
      if (opts.onSfx) opts.onSfx("tackle");
      await wait(420);
      return;
    }
    const finalX = Math.min(S.los + gain, 100.5);
    const start = rb.x;
    const td = S.los + gain >= 100;
    for (const l of lbs) l.anim = "run";
    if (opts.onSfx) opts.onSfx("run");
    await tween(Math.max(700, (finalX - start) * 85), (u) => {
      rb.x = lerp(start, finalX, u);
      rb.lane = 0.05 + Math.sin(u * Math.PI * 2.5) * 0.45 * (1 - u * 0.5);
      lbs.forEach((l, i) => {
        l.x = lerp(l.x, rb.x - 1.2 - i * 0.6, 0.1);
        l.lane = lerp(l.lane, rb.lane + (i - 1) * 0.35, 0.09);
      });
      S.camTarget = clamp(rb.x + 4, 8, 96);
    }, easeOut);
    if (!td) {
      rb.anim = "tackled";
      lbs[0].anim = "tackle";
      lbs[0].x = rb.x + 0.5;
      lbs[0].lane = rb.lane;
      if (opts.onSfx) opts.onSfx("tackle");
      await wait(350);
    } else {
      await celebrate(rb);
    }
  }

  async function animKick({ good = true }) {
    // Field goal from the line of scrimmage toward the uprights at 110.
    const k = byRole("rb");
    const holder = byRole("qb");
    k.role = "k";
    k.x = S.los - 8.5;
    k.lane = 0.25;
    holder.x = S.los - 7;
    holder.lane = 0;
    holder.anim = "kneel";
    holder.hasBall = false;
    S.ball.x = S.los - 7;
    S.ball.lane = 0;
    S.ball.z = 0;
    S.ball.visible = true;
    S.ball.rot = -Math.PI / 2;
    S.camTarget = clamp(S.los - 2, 8, 96);
    await wait(250);
    const k0 = k.x;
    k.anim = "run";
    await tween(380, (u) => {
      k.x = lerp(k0, S.los - 7.4, u);
      k.lane = lerp(0.25, 0.08, u);
    });
    k.anim = "kick";
    if (opts.onSfx) opts.onSfx("kick");
    const bx0 = S.ball.x;
    const dist = 110 - bx0;
    const endX = good ? 112 : 111;
    const endLane = good ? (Math.random() - 0.5) * 0.3 : (Math.random() < 0.5 ? -1.1 : 1.1);
    S.ball.spin = 0.45;
    await tween(1500, (u, raw) => {
      S.ball.x = lerp(bx0, endX, raw);
      S.ball.lane = lerp(0, endLane, raw);
      S.ball.z = Math.sin(raw * Math.PI) * (good ? 9 : 5.5) + (good ? 0 : -raw * 1.5);
      S.camTarget = clamp(S.ball.x - 4, 8, 104);
      if (raw > 0.3) k.anim = "idle";
    }, (u) => u);
    if (good && opts.onSfx) opts.onSfx("post");
    await wait(300);
    S.ball.visible = false;
    if (good) await celebrate(k);
  }

  async function animDefense({ sack = true, gain = 10 }) {
    // The opponent has the ball, driving left. A sack/turnover flips it back.
    const los = S.los;
    formation(los + 2, false);
    S.camTarget = clamp(los + 2, 8, 96);
    S.cam = S.camTarget;
    await wait(200);
    const qb = byRole("qb");
    const blitz = byRole("lb");
    const wr = byRole("wr");
    S.ball.x = qb.x;
    qb.hasBall = true;
    for (const p of S.players) if (p.anim === "stance") p.anim = "block";
    blitz.anim = "run";
    qb.anim = "run";
    const q0 = qb.x;
    await tween(500, (u) => {
      qb.x = q0 + 2.5 * u;
      blitz.x = lerp(blitz.x, qb.x - 0.7, 0.18);
      blitz.lane = lerp(blitz.lane, qb.lane, 0.2);
    });
    if (sack) {
      qb.anim = "tackled";
      blitz.anim = "tackle";
      if (opts.onSfx) opts.onSfx("tackle");
      // Fumble! Home recovers and runs it back.
      qb.hasBall = false;
      S.ball.visible = true;
      S.ball.x = qb.x - 0.5;
      S.ball.lane = qb.lane;
      await tween(500, (u) => {
        S.ball.x = qb.x - 0.5 - u * 2;
        S.ball.z = Math.abs(Math.sin(u * Math.PI * 2)) * 0.8 * (1 - u);
        S.ball.rot += 0.25;
      });
      const ret = byRole("lb2");
      ret.anim = "run";
      ret.facing = 1;
      await tween(400, (u) => {
        ret.x = lerp(ret.x, S.ball.x, u);
        ret.lane = lerp(ret.lane, S.ball.lane, u);
      });
      ret.hasBall = true;
      S.ball.visible = false;
      if (opts.onSfx) opts.onSfx("catch");
      const start = ret.x;
      const finalX = Math.min(los + gain, 100.5);
      const td = los + gain >= 100;
      for (const p of S.players) if (p.team === "away" && p.anim !== "tackled") { p.anim = "run"; p.facing = 1; }
      await tween(Math.max(600, (finalX - start) * 80), (u) => {
        ret.x = lerp(start, finalX, u);
        ret.lane = lerp(ret.lane, 0.2, u * 0.5);
        for (const p of S.players) if (p.team === "away" && p.anim === "run") { p.x = lerp(p.x, ret.x - 2, 0.06); }
        S.camTarget = clamp(ret.x + 4, 8, 96);
      }, easeOut);
      if (td) await celebrate(ret);
      else { ret.anim = "tackled"; await wait(300); }
    } else {
      // Opponent completes a pass.
      qb.anim = "throw";
      wr.anim = "run";
      const w0 = wr.x;
      S.ball.visible = true;
      qb.hasBall = false;
      if (opts.onSfx) opts.onSfx("throw");
      await tween(700, (u, raw) => {
        S.ball.x = lerp(qb.x, w0 - 8, raw);
        S.ball.lane = lerp(qb.lane, wr.lane, raw);
        S.ball.z = Math.sin(raw * Math.PI) * 3;
        wr.x = lerp(w0, w0 - 8, raw);
        S.camTarget = clamp(S.ball.x, 8, 96);
      }, (u) => u);
      wr.hasBall = true;
      S.ball.visible = false;
      if (opts.onSfx) opts.onSfx("catch");
      await tween(400, (u) => { wr.x -= 0.08; });
      wr.anim = "cheer";
      await wait(300);
    }
  }

  async function celebrate(p) {
    if (opts.onSfx) opts.onSfx("touchdown");
    S.hype = 1;
    for (const q of S.players) if (q.team === p.team && q.anim !== "tackled") q.anim = "cheer";
    for (const q of S.players) if (q.team !== p.team) q.anim = "idle";
    p.anim = "cheer";
    await tween(1500, (u) => { S.camTarget = clamp(p.x, 8, 100); });
  }

  async function spikeBall(p) {
    await wait(100);
  }

  function setHype(v) { S.hype = clamp(v, 0, 1); }

  /* ---------- drawing ---------- */

  const CROWD = [];
  for (let i = 0; i < 260; i++) CROWD.push({ x: Math.random(), row: Math.floor(Math.random() * 5), c: i % 7, ph: Math.random() * TAU });
  const STARS = [];
  for (let i = 0; i < 60; i++) STARS.push({ x: Math.random(), y: Math.random() * 0.3, r: Math.random() * 1.4 + 0.3, ph: Math.random() * TAU });
  const CLOUDS = [];
  for (let i = 0; i < 5; i++) CLOUDS.push({ x: Math.random(), y: 0.04 + Math.random() * 0.12, s: 0.6 + Math.random() * 0.8, v: 0.004 + Math.random() * 0.006 });

  function drawSky() {
    const { w, h } = S;
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.42);
    if (sky === "night") { g.addColorStop(0, "#0b1a3a"); g.addColorStop(1, "#1f3b73"); }
    else if (sky === "sunset") { g.addColorStop(0, "#3b2a6b"); g.addColorStop(0.5, "#ff7e5f"); g.addColorStop(1, "#feb47b"); }
    else { g.addColorStop(0, "#3d8fd6"); g.addColorStop(1, "#a7dcf5"); }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h * 0.45);
    if (sky === "night") {
      for (const st of STARS) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(S.t * 2 + st.ph);
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(st.x * w, st.y * h, st.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      if (sky === "day") {
        ctx.fillStyle = "#ffe08a";
        ctx.beginPath(); ctx.arc(w * 0.84, h * 0.07, 22, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = "#ffd27f";
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.19, 34, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const c of CLOUDS) {
        c.x = (c.x + c.v * 0.016) % 1.2;
        const cx = c.x * w - w * 0.1;
        const cy = c.y * h;
        for (const [dx, dy, r] of [[0, 0, 16], [14, -6, 13], [28, 0, 15], [12, 6, 12]]) {
          ctx.beginPath(); ctx.arc(cx + dx * c.s, cy + dy * c.s, r * c.s, 0, TAU); ctx.fill();
        }
      }
    }
  }

  function drawStands() {
    const { w, h } = S;
    const top = h * 0.14;
    const bottom = fieldTop();
    // Light towers
    for (const fx of [0.08, 0.92]) {
      ctx.fillStyle = "#6c757d";
      ctx.fillRect(w * fx - 3, top - h * 0.1, 6, h * 0.12);
      ctx.fillStyle = sky === "night" ? "#fff8d6" : "#dfe3e6";
      ctx.fillRect(w * fx - 22, top - h * 0.12, 44, 12);
      if (sky === "night") {
        const g = ctx.createRadialGradient(w * fx, top - h * 0.11, 4, w * fx, top - h * 0.11, 130);
        g.addColorStop(0, "rgba(255,248,214,0.55)");
        g.addColorStop(1, "rgba(255,248,214,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(w * fx, top - h * 0.11, 130, 0, TAU); ctx.fill();
      }
    }
    // Stand structure
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, "#2d3a4f");
    g.addColorStop(1, "#1b2533");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, top + 10);
    ctx.quadraticCurveTo(w / 2, top - 22, w, top + 10);
    ctx.lineTo(w, bottom);
    ctx.lineTo(0, bottom);
    ctx.closePath();
    ctx.fill();
    // Rows of seats
    const rows = 5;
    const pal = ["#e63946", "#f1c453", "#457b9d", "#f4f1de", "#2a9d8f", "#ff9f1c", "#a8dadc"];
    for (const c of CROWD) {
      const ry = top + 14 + c.row * ((bottom - top - 30) / rows);
      const bob = Math.sin(S.t * (4 + S.hype * 6) + c.ph + c.x * 6) * (1.5 + S.hype * 6);
      const x = c.x * w;
      const y = ry + (S.hype > 0.5 ? -Math.abs(bob) : bob * 0.4);
      ctx.fillStyle = pal[c.c];
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x - 3, y + 3, 6, 5);
    }
    // Wall + banner
    ctx.fillStyle = home.primary;
    ctx.fillRect(0, bottom - 16, w, 16);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(0, bottom - 16, w, 4);
    ctx.fillStyle = home.secondary;
    ctx.font = `800 11px "Baloo 2", "Nunito", sans-serif`;
    ctx.textAlign = "center";
    const msg = S.hype > 0.6 ? "TOUCHDOWN!  ★  TOUCHDOWN!  ★  TOUCHDOWN!" : `GO ${home.name.toUpperCase()}!  ★  PHONICS BOWL  ★  GO ${home.name.toUpperCase()}!`;
    ctx.fillText(msg, w / 2, bottom - 4);
  }

  function drawField() {
    const { w } = S;
    const top = fieldTop();
    const bottom = fieldBottom();
    const P = ppy();
    // Grass base
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, "#3f9a3f");
    g.addColorStop(1, "#2f7d32");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, w, bottom - top);
    // Mow stripes each 5 yards
    const startYard = Math.floor((S.cam - viewYards() / 2) / 5) * 5 - 5;
    for (let y = startYard; y < S.cam + viewYards() / 2 + 5; y += 5) {
      if ((y / 5) % 2 === 0) continue;
      const x0 = xOf(y);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x0, top, 5 * P, bottom - top);
    }
    // End zones
    for (const [a, b, col, name, textCol] of [[-10, 0, away.primary, away.name, away.secondary], [100, 110, home.primary, home.name, home.secondary]]) {
      const x0 = xOf(a);
      const x1 = xOf(b);
      if (x1 < 0 || x0 > w) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x0, top, x1 - x0, bottom - top);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < 6; i++) ctx.fillRect(x0 + (i * 2 + 1) * (x1 - x0) / 12, top, (x1 - x0) / 12, bottom - top);
      ctx.save();
      ctx.translate((x0 + x1) / 2, (top + bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = textCol;
      ctx.font = `800 ${Math.min(30, (bottom - top) * 0.13)}px "Baloo 2", "Nunito", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name.toUpperCase(), 0, 0);
      ctx.restore();
    }
    // Sidelines
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, top, w, 4);
    ctx.fillRect(0, bottom - 4, w, 4);
    // Yard lines
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    for (let y = Math.max(0, Math.floor((S.cam - viewYards() / 2) / 5) * 5); y <= Math.min(100, S.cam + viewYards() / 2 + 5); y += 5) {
      const x = xOf(y);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
      if (y % 10 === 0 && y > 0 && y < 100) {
        const num = y <= 50 ? y : 100 - y;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = `800 ${Math.max(12, P * 1.6)}px "Baloo 2", "Nunito", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(num), x, top + (bottom - top) * 0.2);
        ctx.fillText(String(num), x, bottom - (bottom - top) * 0.2);
      }
    }
    // Hash marks
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let y = Math.max(0, Math.floor(S.cam - viewYards() / 2)); y <= Math.min(100, S.cam + viewYards() / 2 + 1); y++) {
      const x = xOf(y);
      ctx.fillRect(x - 0.5, top + (bottom - top) * 0.38, 1, 6);
      ctx.fillRect(x - 0.5, bottom - (bottom - top) * 0.38 - 6, 1, 6);
    }
    // Goal lines bolder
    ctx.fillStyle = "#fff";
    ctx.fillRect(xOf(0) - 1.5, top, 3, bottom - top);
    ctx.fillRect(xOf(100) - 1.5, top, 3, bottom - top);
    // Broadcast lines
    if (S.showLines) {
      ctx.fillStyle = "rgba(0,90,255,0.55)";
      ctx.fillRect(xOf(S.los) - 1.5, top, 3, bottom - top);
      ctx.fillStyle = "rgba(255,220,0,0.7)";
      ctx.fillRect(xOf(S.firstDown) - 1.5, top, 3, bottom - top);
    }
    // Goal posts (at back of end zones)
    for (const yard of [-10, 110]) {
      const x = xOf(yard);
      if (x < -40 || x > w + 40) continue;
      const cy = laneY(0);
      const s = scaleAt(0);
      ctx.strokeStyle = "#ffd60a";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, cy + 2); ctx.lineTo(x, cy - 44 * s);
      ctx.moveTo(x - 26 * s, cy - 44 * s); ctx.lineTo(x + 26 * s, cy - 44 * s);
      ctx.moveTo(x - 26 * s, cy - 44 * s); ctx.lineTo(x - 26 * s, cy - 92 * s);
      ctx.moveTo(x + 26 * s, cy - 44 * s); ctx.lineTo(x + 26 * s, cy - 92 * s);
      ctx.stroke();
      ctx.fillStyle = "#ffd60a";
      ctx.beginPath(); ctx.ellipse(x, cy + 3, 12 * s, 4 * s, 0, 0, TAU); ctx.fill();
    }
  }

  function drawHelmet(x, y, r, team, facing, style) {
    const primary = team.primary;
    const secondary = team.secondary;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    // Shell
    let fill = primary;
    if (style === "chrome") {
      const g = ctx.createLinearGradient(-r, -r, r, r);
      g.addColorStop(0, "#f8f9fa"); g.addColorStop(0.5, "#adb5bd"); g.addColorStop(1, "#dee2e6");
      fill = g;
    } else if (style === "gold") {
      const g = ctx.createLinearGradient(-r, -r, r, r);
      g.addColorStop(0, "#ffe680"); g.addColorStop(0.5, "#e0a106"); g.addColorStop(1, "#ffd60a");
      fill = g;
    } else if (style === "galaxy") {
      const g = ctx.createLinearGradient(-r, -r, r, r);
      g.addColorStop(0, "#240046"); g.addColorStop(1, "#5a189a");
      fill = g;
    }
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI * 0.95, Math.PI * 2.1);
    ctx.lineTo(r * 0.55, r * 0.7);
    ctx.lineTo(-r * 0.9, r * 0.7);
    ctx.closePath();
    ctx.fill();
    // Style decal
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    if (style === "stripe") { ctx.fillStyle = secondary; ctx.fillRect(-r * 0.18, -r, r * 0.36, r * 1.3); }
    if (style === "bolt") {
      ctx.fillStyle = secondary;
      ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.5); ctx.lineTo(r * 0.1, -r * 0.5); ctx.lineTo(-r * 0.1, -r * 0.05); ctx.lineTo(r * 0.4, -r * 0.05); ctx.lineTo(-r * 0.2, r * 0.6); ctx.lineTo(0, r * 0.05); ctx.lineTo(-r * 0.4, r * 0.05); ctx.closePath(); ctx.fill();
    }
    if (style === "star") {
      ctx.fillStyle = secondary;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2; const rad = i % 2 ? r * 0.22 : r * 0.5; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad - r * 0.05); }
      ctx.closePath(); ctx.fill();
    }
    if (style === "flame") {
      ctx.fillStyle = "#ff9f1c";
      ctx.beginPath(); ctx.moveTo(-r, r * 0.4); ctx.quadraticCurveTo(-r * 0.3, -r * 0.6, r * 0.2, r * 0.1); ctx.quadraticCurveTo(r * 0.5, -r * 0.3, r, r * 0.4); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffd60a";
      ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.6); ctx.quadraticCurveTo(-r * 0.1, -r * 0.1, r * 0.3, r * 0.35); ctx.lineTo(r * 0.6, r); ctx.lineTo(-r * 0.7, r); ctx.closePath(); ctx.fill();
    }
    if (style === "galaxy") {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 2.1) * r * 0.6, Math.sin(i * 1.7) * r * 0.6, 1.1, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    // Shine
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.45, r * 0.42, r * 0.2, -0.5, 0, TAU); ctx.fill();
    // Face + mask
    ctx.fillStyle = "#f2c49b";
    ctx.beginPath(); ctx.ellipse(r * 0.62, r * 0.25, r * 0.36, r * 0.42, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath(); ctx.arc(r * 0.7, r * 0.15, r * 0.08, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#cfd8dc";
    ctx.lineWidth = Math.max(1.2, r * 0.14);
    ctx.beginPath();
    ctx.moveTo(r * 0.25, r * 0.28); ctx.lineTo(r * 1.15, r * 0.28);
    ctx.moveTo(r * 0.3, r * 0.6); ctx.lineTo(r * 1.1, r * 0.6);
    ctx.moveTo(r * 1.15, r * 0.05); ctx.lineTo(r * 1.15, r * 0.75);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer(p) {
    const s = scaleAt(p.lane);
    const cx = xOf(p.x);
    let cy = laneY(p.lane);
    if (cx < -60 || cx > S.w + 60) return;
    const team = p.team === "home" ? home : away;
    const t = S.t * 10 + p.phase;
    let legA = 0;
    let bob = Math.sin(t * 0.4) * 0.6;
    let lean = 0;
    let armL = 0.6;
    let armR = -0.6;
    if (p.anim === "run") { legA = Math.sin(t) * 0.9; bob = Math.abs(Math.sin(t)) * 2.5; lean = 0.18; armL = Math.sin(t) * 0.9; armR = -Math.sin(t) * 0.9; }
    if (p.anim === "stance" || p.anim === "kneel") { bob = 6 * s; lean = 0.25; armL = 1.3; armR = 1.3; }
    if (p.anim === "block") { bob = 3; lean = 0.32; armL = -1.4; armR = -1.4; legA = Math.sin(t * 1.5) * 0.3; }
    if (p.anim === "throw") { armR = -2.3; armL = -0.6; lean = -0.1; }
    if (p.anim === "cheer") { bob = -Math.abs(Math.sin(t * 0.8)) * 10; armL = -2.6; armR = -2.6; legA = Math.sin(t * 0.8) * 0.4; }
    if (p.anim === "tackle") { lean = 0.55; armL = -1.5; armR = -1.5; bob = 5; }
    if (p.anim === "kick") { legA = -1.6; armL = 0.8; armR = -1.3; lean = -0.15; }
    if (p.anim === "dive") { lean = 1.0; bob = 8; armL = -2.2; armR = -2.2; }
    cy -= bob * 0.3;
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.ellipse(cx, laneY(p.lane) + 2, 13 * s, 4.5 * s, 0, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(cx, cy);
    if (p.anim === "tackled") {
      ctx.rotate(p.facing * 1.35);
      ctx.translate(0, 16 * s);
    } else {
      ctx.rotate(lean * p.facing);
    }
    ctx.scale(s, s);
    const f = p.facing;
    // Legs
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-4, -16); ctx.lineTo(-4 + Math.sin(legA) * 8 * f, -1);
    ctx.moveTo(4, -16); ctx.lineTo(4 - Math.sin(legA) * 8 * f, -1);
    ctx.stroke();
    // Shoes
    ctx.fillStyle = "#1b1b1b";
    ctx.beginPath(); ctx.ellipse(-4 + Math.sin(legA) * 8 * f + f * 2, 0, 5, 2.6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4 - Math.sin(legA) * 8 * f + f * 2, 0, 5, 2.6, 0, 0, TAU); ctx.fill();
    // Body
    ctx.fillStyle = team.primary;
    roundRect(-11, -36, 22, 22, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    roundRect(-11, -22, 22, 8, 4);
    ctx.fill();
    // Shoulder pads
    ctx.fillStyle = team.primary;
    ctx.beginPath(); ctx.ellipse(0, -35, 15, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath(); ctx.ellipse(0, -36, 15, 3.5, 0, 0, TAU); ctx.fill();
    // Number
    ctx.fillStyle = team.secondary;
    ctx.font = `800 11px "Baloo 2", "Nunito", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(p.number), 0, -25);
    // Arms
    ctx.strokeStyle = team.primary;
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-12, -32); ctx.lineTo(-12 + Math.sin(armL) * 9 * f, -32 + Math.cos(armL) * 9);
    ctx.moveTo(12, -32); ctx.lineTo(12 + Math.sin(armR) * 9 * f, -32 + Math.cos(armR) * 9);
    ctx.stroke();
    ctx.fillStyle = "#f2c49b";
    ctx.beginPath(); ctx.arc(-12 + Math.sin(armL) * 9 * f, -32 + Math.cos(armL) * 9, 3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(12 + Math.sin(armR) * 9 * f, -32 + Math.cos(armR) * 9, 3, 0, TAU); ctx.fill();
    // Ball in hand
    if (p.hasBall) drawBallShape(8 * f, -30, 6, 0.4 * f);
    // Helmet
    drawHelmet(0, -47, 10.5, team, f, p.team === "home" ? home.helmet : "solid");
    if (p.star) {
      ctx.fillStyle = "#ffd60a";
      ctx.font = "800 9px sans-serif";
      ctx.fillText("★", 0, -60);
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBallShape(x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "#8b4a1c";
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.5, r, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(1, r * 0.22);
    ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke();
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.35, -r * 0.3); ctx.lineTo(i * r * 0.35, r * 0.3); ctx.stroke(); }
    ctx.restore();
  }

  function drawBall() {
    const b = S.ball;
    if (!b.visible) return;
    const s = scaleAt(b.lane);
    const x = xOf(b.x);
    const gy = laneY(b.lane);
    const y = gy - b.z * ppy() * 0.9 - 6 * s;
    b.rot += b.spin;
    ctx.fillStyle = `rgba(0,0,0,${0.3 / (1 + b.z * 0.4)})`;
    ctx.beginPath(); ctx.ellipse(x, gy + 2, 8 * s / (1 + b.z * 0.1), 3 * s, 0, 0, TAU); ctx.fill();
    drawBallShape(x, y, 6.5 * s * (1 + b.z * 0.05), b.rot);
  }

  function render(now) {
    if (!S.alive) return;
    raf = requestAnimationFrame(render);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    S.t += dt;
    stepTweens(now);
    S.cam = lerp(S.cam, S.camTarget, 1 - Math.pow(0.001, dt));
    S.hype = lerp(S.hype, 0.15, 1 - Math.pow(0.5, dt));
    const { w, h } = S;
    ctx.clearRect(0, 0, w, h);
    drawSky();
    drawStands();
    drawField();
    const sorted = [...S.players].filter((p) => p.visible).sort((a, b) => a.lane - b.lane);
    for (const p of sorted) drawPlayer(p);
    drawBall();
    // Vignette
    const v = ctx.createRadialGradient(w / 2, h * 0.6, h * 0.3, w / 2, h * 0.6, Math.max(w, h) * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
  raf = requestAnimationFrame(render);

  function destroy() {
    S.alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    tweens.clear();
  }

  function setSky(s) { sky = s; }

  return {
    huddle, animPass, animRush, animKick, animDefense, celebrate, setLOS, setHype, setSky, destroy, spikeBall,
    get state() { return S; },
    screenPos(yard, lane = 0) {
      const r = canvas.getBoundingClientRect();
      return { x: xOf(yard), y: laneY(lane) - 30, w: r.width, h: r.height };
    },
  };
}
