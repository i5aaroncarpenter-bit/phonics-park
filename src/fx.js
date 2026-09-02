/** Particle bursts, floating score pops, big callouts and camera shake. */

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
  let alive = true;

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
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, w, h);
    if (!particles.length && shake === 0) return;
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx *= 0.985;
      p.rot += p.spin;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.4)));
      ctx.fillStyle = p.color;
      if (p.shape === "star") drawStar(p.x, p.y, p.r, p.rot);
      else if (p.shape === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.abs(Math.sin(p.rot * 1.7)) * 0.8 + 0.2);
        ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        ctx.restore();
      } else if (p.shape === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + (p.max - p.life) / 6), 0, Math.PI * 2);
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
      if (shake < 0.4) shake = 0;
      root.style.setProperty("--shake-x", (Math.random() * 2 - 1) * shake + "px");
      root.style.setProperty("--shake-y", (Math.random() * 2 - 1) * shake + "px");
    } else {
      root.style.setProperty("--shake-x", "0px");
      root.style.setProperty("--shake-y", "0px");
    }
  }

  function drawStar(x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 ? r * 0.45 : r;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  raf = requestAnimationFrame(loop);

  const PALETTE = {
    touchdown: ["#ffd166", "#ef476f", "#06d6a0", "#ffffff", "#118ab2", "#ff9f1c"],
    big: ["#ffd166", "#ffffff", "#ff9f1c", "#06d6a0"],
    good: ["#ffd166", "#ffffff", "#8ecae6"],
    miss: ["#adb5bd", "#dee2e6"],
    coin: ["#ffd60a", "#ffc300", "#fff3b0"],
    kick: ["#ffffff", "#ffd166"],
  };

  function burst(x, y, kind = "good", count) {
    const pal = PALETTE[kind] || PALETTE.good;
    const n = count || (kind === "touchdown" ? 90 : kind === "big" ? 40 : kind === "miss" ? 10 : 24);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * (kind === "touchdown" ? 9 : kind === "big" ? 6 : 4);
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (kind === "touchdown" ? 4 : 1.5),
        r: 2.5 + Math.random() * (kind === "touchdown" ? 6 : 4),
        color: pal[i % pal.length],
        life: 40 + Math.random() * 40,
        max: 80,
        g: kind === "miss" ? 0.25 : 0.14,
        shape: kind === "touchdown" ? (i % 3 === 0 ? "star" : "confetti") : kind === "coin" ? "dot" : i % 4 === 0 ? "star" : i % 5 === 0 ? "ring" : "dot",
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  /** Confetti rain from the top of the screen. */
  function rain(ms = 2500) {
    const t0 = performance.now();
    const pal = PALETTE.touchdown;
    const tick = () => {
      if (!alive || performance.now() - t0 > ms) return;
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: Math.random() * w, y: -10,
          vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2.5,
          r: 4 + Math.random() * 5, color: pal[Math.floor(Math.random() * pal.length)],
          life: 140, max: 140, g: 0.03, shape: "confetti", rot: Math.random() * 6, spin: (Math.random() - 0.5) * 0.25,
        });
      }
      setTimeout(tick, 60);
    };
    tick();
  }

  function pop(text, x, y, cls = "") {
    const el = document.createElement("div");
    el.className = "score-pop " + cls;
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    root.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  function callout(text, cls = "", ms = 1300) {
    root.querySelectorAll(".callout").forEach((n) => n.remove());
    if (!text) return;
    const el = document.createElement("div");
    el.className = "callout " + cls;
    el.innerHTML = `<span>${text}</span>`;
    root.appendChild(el);
    setTimeout(() => el.classList.add("out"), ms - 250);
    setTimeout(() => el.remove(), ms);
  }

  function cameraShake(amt = 10) {
    shake = Math.max(shake, amt);
  }

  function destroy() {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.remove();
  }

  return { burst, rain, pop, callout, cameraShake, destroy, canvas };
}
