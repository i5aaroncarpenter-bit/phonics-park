#!/usr/bin/env node
/**
 * Builds the isolated phoneme clips in assets/sounds/ from phoneme strings
 * using espeak-ng + the MBROLA us1 diphone voice, then trims, stretches,
 * normalizes and encodes them with ffmpeg.
 *
 *   sudo apt-get install espeak-ng mbrola mbrola-us1 ffmpeg
 *   node tools/build-sounds.mjs
 *
 * Phoneme mnemonics are espeak-ng's en-US set (see `espeak-ng -v en-us -x word`).
 * Kinds:
 *   cont   continuant — stretched to ~0.55 s so the child hears "sssss"
 *   stop   plosive — synthesized with a schwa, then cut short so it is "b'" not "buh"
 *   vowel  held ~0.42 s
 *   blend  two consonants + schwa, cut after the second consonant
 *   end    final blend, left as synthesized
 */

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/sounds");
const TMP = "/tmp/phonics-sounds";
const VOICE = process.env.VOICE || "mb-us1";

const CLIPS = {
  // continuants
  m: ["m", "cont"], n: ["n", "cont"], s: ["s", "cont"], f: ["f", "cont"], l: ["l@", "stop", 0.3], r: ["r", "cont"],
  v: ["v", "cont"], z: ["z", "cont"], sh: ["S", "cont"], th: ["T", "cont"], th2: ["D", "cont"], ng: ["N", "cont"],
  h: ["h", "cont", 0.3], w: ["w@", "stop", 0.2], y: ["j@", "stop", 0.2],
  // stops / affricates
  b: ["b@", "stop"], d: ["d@", "stop"], g: ["g@", "stop"], p: ["p@", "stop"], t: ["t@", "stop"], k: ["k@", "stop"],
  j: ["dZ@", "stop", 0.22], ch: ["tS@", "stop", 0.22], qu: ["kw@", "stop", 0.24], x: ["ks", "end"], nk: ["Nk", "end"],
  // vowels
  a: ["a", "vowel"], e: ["E", "vowel"], i: ["I", "vowel"], o: ["0", "vowel"], u: ["V", "vowel"],
  ay: ["eI", "vowel"], ee: ["i:", "vowel"], eye: ["aI", "vowel"], oh: ["oU", "vowel"], yoo: ["ju:", "vowel"],
  oo: ["u:", "vowel"], uu: ["U", "vowel"], ar: ["A@", "vowel"], or: ["O@", "vowel"], er: ["3:", "vowel"],
  oy: ["OI", "vowel"], ow: ["aU", "vowel"],
  // beginning blends
  st: ["st@", "blend"], sl: ["sl@", "blend"], tr: ["tr@", "blend"], bl: ["bl@", "blend"], fl: ["fl@", "blend"],
  gr: ["gr@", "blend"], sp: ["sp@", "blend"], cl: ["kl@", "blend"], dr: ["dr@", "blend"], sn: ["sn@", "blend"],
  sw: ["sw@", "blend"], cr: ["kr@", "blend"], fr: ["fr@", "blend"], pl: ["pl@", "blend"], br: ["br@", "blend"],
  gl: ["gl@", "blend"], sm: ["sm@", "blend"], pr: ["pr@", "blend"],
  // ending blends
  mp: ["mp", "end"], nd: ["nd", "end"], nt: ["nt", "end"], sk: ["sk", "end"], lk: ["lk", "end"], ft: ["ft", "end"], lt: ["lt", "end"],
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function duration(file) {
  return Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]));
}

function meanVolume(file) {
  const res = spawnSync("ffmpeg", ["-i", file, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
  const m = /mean_volume: ([-0-9.]+)/.exec(res.stderr + res.stdout);
  return m ? Number(m[1]) : -20;
}

const TARGET = { cont: 0.55, stop: 0.17, vowel: 0.42, blend: 0.36, end: 0.34 };

let total = 0;
for (const [name, [phones, kind, override]] of Object.entries(CLIPS)) {
  const raw = `${TMP}/${name}.raw.wav`;
  const trimmed = `${TMP}/${name}.trim.wav`;
  const shaped = `${TMP}/${name}.shaped.wav`;
  const loud = `${TMP}/${name}.loud.wav`;
  run("espeak-ng", ["-v", VOICE, "-s", "110", "-p", "62", "-w", raw, `[[${phones}]]`]);
  // Normalize first so quiet phonemes (l, th, f) survive silence trimming.
  const pre = -19 - meanVolume(raw);
  run("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-af", `volume=${Math.min(40, pre).toFixed(1)}dB,alimiter=limit=0.95`, loud]);
  run("ffmpeg", ["-y", "-loglevel", "error", "-i", loud, "-af",
    "silenceremove=start_periods=1:start_threshold=-40dB:stop_periods=1:stop_threshold=-40dB:stop_duration=0.08:detection=peak", trimmed]);
  let d = duration(trimmed);
  if (!Number.isFinite(d) || d < 0.03) { run("cp", [loud, trimmed]); d = duration(trimmed); }
  const target = override || TARGET[kind];
  let filter;
  if (kind === "cont" || kind === "vowel") {
    // Lengthen with atempo (each stage limited to 0.5..2.0).
    let factor = Math.min(1, Math.max(0.125, d / target));
    const stages = [];
    while (factor < 0.5) { stages.push("atempo=0.5"); factor /= 0.5; }
    stages.push(`atempo=${factor.toFixed(3)}`);
    filter = `${stages.join(",")},atrim=0:${target},afade=t=in:d=0.012,afade=t=out:st=${(target - 0.05).toFixed(3)}:d=0.05`;
  } else if (kind === "stop" || kind === "blend") {
    // Cut the schwa short so the consonant dominates.
    const end = Math.min(d, target);
    filter = `atrim=0:${target},afade=t=in:d=0.005,afade=t=out:st=${Math.max(0.02, end - 0.06).toFixed(3)}:d=0.06`;
  } else {
    filter = `afade=t=in:d=0.008,afade=t=out:st=${Math.max(0.05, d - 0.04).toFixed(3)}:d=0.04`;
  }
  run("ffmpeg", ["-y", "-loglevel", "error", "-i", trimmed, "-af", filter, shaped]);
  const gain = -19 - meanVolume(shaped);
  const out = `${OUT}/${name}.mp3`;
  run("ffmpeg", ["-y", "-loglevel", "error", "-i", shaped, "-af", `volume=${gain.toFixed(1)}dB,alimiter=limit=0.95`,
    "-ar", "22050", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "5", out]);
  const size = statSync(out).size;
  total += size;
  console.log(`${name.padEnd(5)} [[${phones}]]`.padEnd(20), `${duration(out).toFixed(2)}s`, `${(size / 1024).toFixed(1)}KB`);
}
console.log(`\n${Object.keys(CLIPS).length} clips, ${(total / 1024).toFixed(0)} KB total → ${OUT}`);
