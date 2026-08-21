import { sfx } from "./audio.js";

export function qualityFrom(elapsed, limit, misses) {
  if (elapsed >= limit) return "out";
  const ratio = elapsed / limit;
  if (misses > 0) return "single";
  if (ratio < 0.32) return "homer";
  if (ratio < 0.5) return "triple";
  if (ratio < 0.72) return "double";
  return "single";
}

export const HIT_RUNS = { homer: 4, triple: 3, double: 2, single: 1, out: 0 };
export const HIT_NAME = {
  homer: "HOME RUN!",
  triple: "TRIPLE!",
  double: "DOUBLE!",
  single: "SINGLE!",
  out: "OUT!",
};

export function timerMs(level, heat) {
  const h = heat && heat > 1 ? heat : 1;
  return Math.max(2800, Math.round((level.baseMs || 8000) / h));
}

export function startTimer(bar, limit, onExpire) {
  const start = performance.now();
  let dead = false;
  const tick = () => {
    if (dead) return;
    const used = performance.now() - start;
    const left = Math.max(0, 1 - used / limit);
    if (bar) bar.style.transform = `scaleX(${left})`;
    if (used >= limit) {
      dead = true;
      onExpire();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return {
    elapsed: () => performance.now() - start,
    stop() { dead = true; },
  };
}

export function callout(host, text) {
  const el = document.createElement("div");
  el.className = "callout";
  el.textContent = text;
  host.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

export function particles(host, kind) {
  const colors = kind === "homer"
    ? ["#e8b923", "#fff8e7", "#c0392b", "#5c9b4a"]
    : ["#fff8e7", "#e8b923", "#c4a35a"];
  const rect = host.getBoundingClientRect();
  for (let i = 0; i < (kind === "homer" ? 22 : 12); i++) {
    const p = document.createElement("i");
    p.className = "particle";
    p.style.left = `${rect.width * 0.5}px`;
    p.style.top = `${rect.height * 0.4}px`;
    p.style.background = colors[i % colors.length];
    const ang = (Math.PI * 2 * i) / 12;
    const dist = 60 + Math.random() * 90;
    p.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(ang) * dist}px`);
    host.appendChild(p);
    setTimeout(() => p.remove(), 720);
  }
}

export function shakeIfHomer(kind) {
  if (kind !== "homer") return;
  const app = document.getElementById("app");
  if (!app) return;
  app.classList.remove("shake");
  void app.offsetWidth;
  app.classList.add("shake");
  setTimeout(() => app.classList.remove("shake"), 560);
}

export function celebrate(host, kind, label) {
  callout(host, label || HIT_NAME[kind] || "HIT!");
  if (kind !== "out") particles(host, kind);
  shakeIfHomer(kind);
  if (kind === "homer") {
    sfx("bat");
    sfx("cheer");
    sfx("organ");
  } else if (kind === "out") {
    sfx("umpire");
  } else {
    sfx("bat");
    sfx("cheer");
  }
}

export function shuffleCopy(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function tileButton(label, onTap) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tile";
  btn.textContent = label;
  btn.addEventListener("click", () => onTap(btn, label));
  return btn;
}

export function renderPlayChrome(root, { save, level, hud, onQuit, onMute, onHear }) {
  root.innerHTML = `
    <div class="park-bg" aria-hidden="true"></div>
    <section class="screen">
      <div class="topbar">
        <button class="btn ghost" id="quit" type="button">Park</button>
        <h2>${level.inning}</h2>
        <button class="btn icon-btn ghost" id="mute" type="button">${save.mute ? "🔇" : "🔊"}</button>
      </div>
      <div class="hud" id="hud">
        <div class="stat"><b id="hud-runs">${hud.runs}</b><span>Runs</span></div>
        <div class="stat"><b id="hud-hits">${hud.hits}</b><span>Hits</span></div>
        <div class="stat"><b id="hud-inn">${hud.inningNo}/${hud.atBats}</b><span>At-bat</span></div>
        <div class="stat"><b id="hud-streak">${hud.streak}</b><span>Streak</span></div>
      </div>
      <div class="play-wrap">
        <div class="timer"><i id="timer-bar"></i></div>
        <div class="diamond">
          <div class="dirt-path" aria-hidden="true"></div>
          <div class="play-stage" id="stage"></div>
        </div>
        <div class="row blend-row">
          <button class="btn navy" id="hear" type="button">Hear it</button>
          <div id="extra-actions" class="grow"></div>
        </div>
        <div class="tiles" id="tiles"></div>
      </div>
    </section>
  `;
  root.querySelector("#quit").addEventListener("click", onQuit);
  root.querySelector("#mute").addEventListener("click", onMute);
  root.querySelector("#hear").addEventListener("click", onHear);
  return {
    stage: root.querySelector("#stage"),
    tiles: root.querySelector("#tiles"),
    extra: root.querySelector("#extra-actions"),
    bar: root.querySelector("#timer-bar"),
    hear: root.querySelector("#hear"),
  };
}

export function updateHud(root, hud) {
  const r = root.querySelector("#hud-runs");
  const h = root.querySelector("#hud-hits");
  const i = root.querySelector("#hud-inn");
  const s = root.querySelector("#hud-streak");
  if (r) r.textContent = hud.runs;
  if (h) h.textContent = hud.hits;
  if (i) i.textContent = `${hud.inningNo}/${hud.atBats}`;
  if (s) s.textContent = hud.streak;
}

export function showNextUp(stage, label) {
  return new Promise((resolve) => {
    const el = document.createElement("div");
    el.className = "next-up";
    el.innerHTML = `<div class="now">NOW UP</div><div class="who">${label}</div>`;
    stage.appendChild(el);
    setTimeout(() => {
      el.remove();
      resolve();
    }, 1500);
  });
}

export function showTutorial(stage, html, onDone) {
  const el = document.createElement("div");
  el.className = "tutorial";
  el.innerHTML = `<div class="panel">${html}<button class="btn primary" type="button" id="tut-ok">Got it!</button></div>`;
  stage.appendChild(el);
  el.querySelector("#tut-ok").addEventListener("click", () => {
    el.remove();
    onDone();
  });
}
