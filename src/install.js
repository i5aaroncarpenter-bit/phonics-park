/**
 * Install-to-home-screen plumbing: registers the service worker and keeps
 * the browser's install prompt so a button in the game can trigger it.
 */

let deferred = null;
const listeners = new Set();

export function initInstall() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => { /* offline play is a bonus, not a requirement */ });
    });
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

function notify() {
  for (const cb of listeners) cb(canInstall());
}

export function onInstallChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
}

export function canInstall() {
  return !!deferred && !isStandalone();
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Show the browser's install prompt. Resolves true when accepted. */
export async function promptInstall() {
  if (!deferred) return false;
  const ev = deferred;
  deferred = null;
  notify();
  try {
    ev.prompt();
    const { outcome } = await ev.userChoice;
    return outcome === "accepted";
  } catch {
    return false;
  }
}
