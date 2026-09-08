/** Canvas particle layer: coins, sparks, confetti, screen shake. */

let layer = null;
let ctx = null;
let particles = [];
let raf = 0;
let w = 0;
let h = 0;
let shake = 0;

export function initFX() {
  if (layer) return;
  layer = document.createElement("canvas");
  layer.className = "fx-canvas";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);
  ctx = layer.getContext("2d");
  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    layer.width = w * dpr;
    layer.height = h * dpr;
    layer.style.width = w + "px";
    layer.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener("resize", resize);
  resize();
  loop();
}

function loop() {
  raf = requestAnimationFrame(loop);
  if (!particles.length && shake === 0) {
    ctx.clearRect(0, 0, w, h);
    return;
  }
  ctx.clearRect(0, 0, w, h);
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) {
    p.life -= 1;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g ?? 0.15;
    p.vx *= 0.985;
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.5)));
    ctx.fillStyle = p.color;
    if (p.shape === "coin") {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r, p.r * Math.abs(Math.cos(p.life / 4)), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8a5a00";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (p.shape === "star") {
      star(p.x, p.y, p.r);
    } else if (p.shape === "confetti") {
      ctx.save();
      ctx.translate(p.x, p.y);
      p.rot = (p.rot || 0) + 0.15;
      ctx.rotate(p.rot);
      ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
      ctx.restore();
    } else if (p.shape === "spark") {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  if (shake > 0) {
    shake *= 0.85;
    if (shake < 0.5) shake = 0;
    document.documentElement.style.setProperty("--shake-x", (Math.random() * 2 - 1) * shake + "px");
    document.documentElement.style.setProperty("--shake-y", (Math.random() * 2 - 1) * shake + "px");
  } else {
    document.documentElement.style.setProperty("--shake-x", "0px");
    document.documentElement.style.setProperty("--shake-y", "0px");
  }
}

function star(x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function center(node) {
  if (!node) return { x: w / 2, y: h / 2 };
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function burst(node, { n = 18, colors = ["#ffd54a", "#ff9f1a", "#fff3b0"], shape = "circle", speed = 5, life = 45 } = {}) {
  if (!ctx) return;
  const { x, y } = center(node);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.5 + Math.random());
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, r: 3 + Math.random() * 4, color: colors[i % colors.length], shape, life, max: life });
  }
}

export function coins(node, n = 12) {
  if (!ctx) return;
  const { x, y } = center(node);
  for (let i = 0; i < n; i++) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 7, vy: -6 - Math.random() * 5, r: 5 + Math.random() * 3, color: "#ffd54a", shape: "coin", life: 60, max: 60, g: 0.28 });
  }
}

export function sparks(node, n = 14) {
  burst(node, { n, colors: ["#fff6c2", "#ffd54a", "#ff8a3a"], shape: "spark", speed: 9, life: 22 });
}

export function confetti(n = 90) {
  if (!ctx) return;
  const colors = ["#ffd54a", "#ff6b6b", "#4ecdc4", "#a06cd5", "#59c36a", "#ffffff"];
  for (let i = 0; i < n; i++) {
    particles.push({ x: Math.random() * w, y: -10 - Math.random() * h * 0.3, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, r: 4 + Math.random() * 4, color: colors[i % colors.length], shape: "confetti", life: 140, max: 140, g: 0.03 });
  }
}

export function starsBurst(node, n = 12) {
  burst(node, { n, colors: ["#fff3b0", "#ffd54a", "#ffffff"], shape: "star", speed: 6, life: 50 });
}

export function screenShake(amount = 8) {
  shake = Math.max(shake, amount);
}

export function stopFX() {
  particles = [];
  cancelAnimationFrame(raf);
}
