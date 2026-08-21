export function createFX(root) {
  const canvas = document.createElement("canvas");
  canvas.className = "fx-canvas";
  canvas.setAttribute("aria-hidden", "true");
  root.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  let particles = [];
  let shake = 0;
  let raf = 0;
  let w = 0;
  let h = 0;

  function resize() {
    const r = root.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();

  function loop() {
    raf = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, w, h);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g || 0.12;
      p.vx *= 0.99;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      if (p.shape === "star") {
        drawStar(p.x, p.y, p.r, 5);
      } else if (p.shape === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        p.rot = (p.rot || 0) + 0.12;
        ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (shake > 0) {
      shake *= 0.86;
      if (shake < 0.4) shake = 0;
      root.style.setProperty("--shake-x", (Math.random() * 2 - 1) * shake + "px");
      root.style.setProperty("--shake-y", (Math.random() * 2 - 1) * shake + "px");
    } else {
      root.style.setProperty("--shake-x", "0px");
      root.style.setProperty("--shake-y", "0px");
    }
  }

  function drawStar(x, y, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n - Math.PI / 2;
      const rad = i % 2 ? r * 0.4 : r;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  raf = requestAnimationFrame(loop);

  function burst(x, y, kind = "hit") {
    const pal =
      kind === "homer"
        ? ["#ffd166", "#ef476f", "#06d6a0", "#fff", "#118ab2"]
        : kind === "out"
          ? ["#ffd166", "#ffffff", "#2a9d8f"]
          : kind === "miss"
            ? ["#adb5bd", "#868e96"]
            : ["#ffd166", "#f4a261", "#fff", "#e76f51"];
    const n = kind === "homer" ? 48 : kind === "miss" ? 10 : 26;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * (kind === "homer" ? 7 : 4);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.5,
        r: 2 + Math.random() * 5,
        color: pal[i % pal.length],
        life: 32 + Math.random() * 28,
        max: 50,
        g: 0.14,
        shape: kind === "homer" ? (i % 3 === 0 ? "star" : "confetti") : i % 4 === 0 ? "star" : "dot",
        rot: Math.random() * 4,
      });
    }
  }

  function pop(text, x, y, cls = "") {
    const el = document.createElement("div");
    el.className = "score-pop " + cls;
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    root.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  function cameraShake(amt = 10) {
    shake = Math.max(shake, amt);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.remove();
  }

  return { burst, pop, cameraShake, destroy, canvas };
}

export function drawParkBackdrop(canvas, t = 0) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  sky.addColorStop(0, "#4a9ad4");
  sky.addColorStop(0.6, "#8ec8ea");
  sky.addColorStop(1, "#cfe8c4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // sun
  ctx.fillStyle = "#ffe08a";
  ctx.beginPath();
  ctx.arc(w * 0.86, h * 0.1, 28, 0, Math.PI * 2);
  ctx.fill();

  // stadium stands
  ctx.fillStyle = "#2d4a6f";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.38);
  ctx.quadraticCurveTo(w * 0.5, h * 0.22, w, h * 0.38);
  ctx.lineTo(w, h * 0.48);
  ctx.quadraticCurveTo(w * 0.5, h * 0.34, 0, h * 0.48);
  ctx.closePath();
  ctx.fill();

  // crowd dots
  for (let i = 0; i < 80; i++) {
    const cx = (i * 47 + (t * 0.02 + i * 13)) % w;
    const cy = h * 0.3 + ((i * 17) % 40);
    ctx.fillStyle = ["#c0392b", "#f4c430", "#1b3358", "#fff4d6", "#2a9d8f"][i % 5];
    ctx.fillRect(cx, cy, 4, 5);
  }

  // grass
  const grass = ctx.createLinearGradient(0, h * 0.42, 0, h);
  grass.addColorStop(0, "#4cae4c");
  grass.addColorStop(1, "#2f7a32");
  ctx.fillStyle = grass;
  ctx.fillRect(0, h * 0.42, w, h);

  // mow stripes
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 ? "#fff" : "#000";
    ctx.fillRect(0, h * 0.42 + i * (h * 0.045), w, h * 0.022);
  }
  ctx.restore();

  // dirt diamond
  const cx = w * 0.5;
  const cy = h * 0.72;
  const dw = Math.min(w * 0.55, 280);
  const dh = Math.min(h * 0.38, 200);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.fillStyle = "#c9a05a";
  ctx.beginPath();
  ctx.moveTo(0, -dh * 0.55);
  ctx.lineTo(dw * 0.5, 0);
  ctx.lineTo(0, dh * 0.5);
  ctx.lineTo(-dw * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#f4e4c1";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // bases
  const bases = [
    [cx, cy - dh * 0.42],
    [cx + dw * 0.38, cy - 4],
    [cx, cy + dh * 0.28],
    [cx - dw * 0.38, cy - 4],
  ];
  bases.forEach(([bx, by], i) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = i === 2 ? "#f4e4c1" : "#fff";
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = "#8a6a32";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  });

  // mound
  ctx.fillStyle = "#b88948";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 8, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}
