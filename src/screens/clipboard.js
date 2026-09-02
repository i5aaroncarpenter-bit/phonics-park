/**
 * Coach's Clipboard — the grown-up corner. Shows which sounds and words are
 * strong or need work, lets you pick the voice, and resets progress.
 */

import { weakKeys, strongKeys, resetSave } from "../save.js";
import { KEYWORDS, ALL_WORDS, STAGES } from "../curriculum.js";
import { esc, ICON, muteButton, el } from "../ui.js";
import { sfx } from "../audio.js";
import { listVoices, currentVoiceName, setVoiceByName, setSpeechRate, say, sayWord, saySound, speechAvailable } from "../speech.js";

export function renderClipboard(app, { save, persist, onBack, onReset, onToggleMute }) {
  const weak = weakKeys(save, 10);
  const strong = strongKeys(save, 12);
  const voices = listVoices();
  const t = save.totals;
  const stage = STAGES.find((s) => s.id === save.unlocked) || STAGES[STAGES.length - 1];
  const label = (k) => (KEYWORDS[k] ? `${k} <small>${KEYWORDS[k][1]}</small>` : esc(k));

  app.innerHTML = `
    <section class="screen clip-screen">
      <header class="topbar">
        <button class="btn icon-btn" id="back" type="button" aria-label="Back">${ICON.back}</button>
        <h2>Coach's Clipboard</h2>
        <div class="topbar-right"><span id="mute-slot"></span></div>
      </header>
      <div class="clip-body">
        <div class="clip-card">
          <h3>Progress report for ${esc(save.name)}</h3>
          <p class="muted">Working on: <b>Game ${stage.id} · ${esc(stage.title)}</b> — ${esc(stage.blurb)}</p>
          <div class="stat-grid small">
            <div class="stat"><b>${t.games || 0}</b><span>games</span></div>
            <div class="stat"><b>${t.words}</b><span>words read</span></div>
            <div class="stat"><b>${t.plays ? Math.round((t.correct / t.plays) * 100) : 0}%</b><span>accuracy</span></div>
            <div class="stat"><b>${Object.keys(save.mastery).length}</b><span>sounds & words seen</span></div>
          </div>
        </div>
        <div class="clip-card">
          <h3>Needs practice <small class="muted">(tap to hear)</small></h3>
          ${weak.length ? `<div class="mastery-list">${weak.map((k) => `<button class="mastery ${k.acc < 0.5 ? "red" : "amber"}" data-k="${esc(k.key)}" type="button"><span>${label(k.key)}</span><i style="width:${Math.round(k.acc * 100)}%"></i><small>${Math.round(k.acc * 100)}% of ${k.seen}</small></button>`).join("")}</div>`
            : `<p class="muted">Nothing yet — play a few games and tricky sounds will show up here. The game automatically drills these more often.</p>`}
        </div>
        <div class="clip-card">
          <h3>Mastered</h3>
          ${strong.length ? `<div class="mastery-list">${strong.map((k) => `<button class="mastery green" data-k="${esc(k.key)}" type="button"><span>${label(k.key)}</span><i style="width:${Math.round(k.acc * 100)}%"></i><small>${Math.round(k.acc * 100)}% of ${k.seen}</small></button>`).join("")}</div>`
            : `<p class="muted">Sounds and words answered correctly 85%+ of the time will appear here.</p>`}
        </div>
        <div class="clip-card">
          <h3>Voice</h3>
          ${speechAvailable() ? `
            <label class="field"><span>Voice</span>
              <select id="voice">${voices.map((v) => `<option value="${esc(v.name)}" ${v.name === currentVoiceName() ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select>
            </label>
            <label class="field"><span>Speed</span>
              <input id="rate" type="range" min="0.7" max="1.15" step="0.05" value="${save.voiceRate || 0.92}" />
            </label>
            <button class="btn" id="test-voice" type="button">${ICON.ear} Test voice</button>
            <p class="muted">Tip: on Chrome, "Google US English" sounds the most natural. On iPad, "Samantha" works well.</p>`
            : `<p class="muted">This browser has no speech voices. Words are approximated with a built-in synth — Chrome, Safari or Edge will sound much better.</p>`}
        </div>
        <div class="clip-card">
          <h3>How Phonics Bowl teaches reading</h3>
          <ul class="how">
            <li><b>Systematic phonics:</b> 12 games move from single letter sounds → CVC words → digraphs → blends → sight words → magic e → vowel teams → r-controlled vowels.</li>
            <li><b>Blending & segmenting:</b> Pass plays build words sound by sound; Field Goals isolate one missing sound.</li>
            <li><b>Real decoding:</b> Read & Rush and the Read Zone show print with no audio — the child must read it.</li>
            <li><b>Adaptive:</b> Missed sounds come back sooner and more often. Wrong answers are always followed by a modeled, sound-by-sound correction.</li>
            <li><b>Speed with accuracy:</b> Faster correct answers earn bigger plays, building automaticity — but the game only requires accuracy to win.</li>
          </ul>
        </div>
        <div class="clip-card danger">
          <h3>Reset</h3>
          <p class="muted">Erase all progress, coins and unlocks and start a new season.</p>
          <button class="btn btn-danger" id="reset" type="button">Reset everything</button>
        </div>
      </div>
    </section>
  `;

  app.querySelector("#mute-slot").appendChild(muteButton(save, onToggleMute));
  app.querySelector("#back").onclick = () => { sfx("tap"); onBack(); };
  app.querySelectorAll(".mastery").forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.k;
      const item = ALL_WORDS.find((x) => x.word.toLowerCase() === k);
      if (item) sayWord(item, { slow: true });
      else if (k.length <= 3 || k.includes("_")) saySound(k);
      else say(k);
    };
  });
  const voiceSel = app.querySelector("#voice");
  if (voiceSel) {
    voiceSel.onchange = () => { setVoiceByName(voiceSel.value); save.voiceName = voiceSel.value; persist(); say("Hi! I'm your coach. Let's play Phonics Bowl!"); };
    app.querySelector("#rate").oninput = (e) => { save.voiceRate = Number(e.target.value); setSpeechRate(save.voiceRate); persist(); };
    app.querySelector("#test-voice").onclick = () => { sfx("tap"); say(`Hi ${save.name}! The cat sat on the mat. Ready to play?`); };
  }
  app.querySelector("#reset").onclick = () => {
    const dlg = el(`<div class="modal"><div class="modal-card">
      <h3>Reset everything?</h3><p>All progress, coins, helmets and trophies will be erased.</p>
      <div class="row"><button class="btn" id="no" type="button">Cancel</button><button class="btn btn-danger" id="yes" type="button">Yes, reset</button></div>
    </div></div>`);
    dlg.querySelector("#no").onclick = () => dlg.remove();
    dlg.querySelector("#yes").onclick = () => { resetSave(); dlg.remove(); onReset(); };
    app.appendChild(dlg);
  };
}
