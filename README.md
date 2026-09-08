# Phonics Bowl

**Read it. Run it. Score!** A web-based football game that teaches reading and phonics to early readers (ages 5–8). No install, no accounts, no binary assets — one static page.

## Play

```
npm start          # serves on http://localhost:8080
```

Any static host works too (Railway config is included). Sound requires one tap on the page first (browser autoplay rules).

## The season

Twelve games, each against a new team, each teaching one phonics skill in order:

| Game | Skill | Opponent |
| --- | --- | --- |
| 1 Kickoff Camp | letter sounds s a t p i n m d | Muddy Pigs |
| 2 Letter Blitz | g o c k e u r h b f l | Rocket Robots |
| 3 First Downs | CVC words with short a / i | Dino Dozers |
| 4 Vowel Valley | CVC words, all five vowels | Jelly Jets |
| 5 Digraph Dash | sh ch th ck wh | Sneaky Sharks |
| 6 Blend Bowl | beginning blends (st, tr, bl, fl…) | Blizzard Bears |
| 7 End Zone Blends | ending blends (mp, nd, st, lk…) | Thunder Turtles |
| 8 Sight Word Sprint | high-frequency words + first sentences | Lightning Llamas |
| 9 Magic E Mania | a_e i_e o_e u_e | Wizard Wolves |
| 10 Vowel Team Tailgate | ai ay ee ea oa ow oo | Pirate Parrots |
| 11 Bossy R Rumble | ar or er ir ur | Cyber Cats |
| 12 The Phonics Bowl | championship — everything mixed | Golden Gorillas |

Win a game (outscore the opponent) to unlock the next one. Stars are earned for accuracy.

## Training Camp

Six no-pressure drills on the building blocks of reading, each with its own best score, stars and coins:

| Drill | Teaches | How it plays |
| --- | --- | --- |
| Vowel Kicks | short vowel sounds, then long vowels | hear the vowel (or see a word with its vowel missing) and kick through the matching upright; streaks push the kick back |
| Sound Twins | sound ↔ picture and alternate spellings (ai/ay, ee/ea, c/k…) | helmet memory match; flipping a helmet plays its sound |
| Word Family Huddle | onset + rime blending, real vs. nonsense words | the rime stays (-at); tap a first sound that makes a real word to run it in |
| Sound Catch | finding a target sound inside printed words | 60 seconds of punted words flying across the stadium; catch the ones with the sound |
| Blend Blitz | fluent blending | 90-second no-huddle pass plays with a combo multiplier |
| Coach's Drill | the child's weakest sounds | a short game built from mastery data |

## The plays

- **Pass Play** — hear the word, tap its sounds in order, THROW to blend. Faster = longer pass.
- **Rush** — hear a sound or word and tap the right defender. *Read & Rush* shows a printed word with no audio: the child must read it and pick the picture.
- **Field Goal** — the word has one sound missing (c _ t). Kick the right sound through the uprights.
- **Defense** — tackle the word that contains the target sound (sh, ai, magic e…) or the exact sight word you hear.
- **Read Zone** — read a short decodable sentence (tap any word to hear it) and pick the matching picture.

Every correct play gains yards; 100 yards is a touchdown. Every miss lets the opponent drive. Missed items come back later in the same game, and the adaptive picker keeps drilling the sounds the child gets wrong most.

## Grown-ups

**Coach's Clipboard** (from the title screen) shows which sounds are strong or need practice, has a Sound Lab to hear every sound tile, lets you choose the voice, speed and letter-sound style, and can reset progress. Progress is stored in the browser (localStorage).

Add `?debug` to the URL to expose the current play spec on `window.__pbSpec` for automated testing.

## Tech

Vanilla ES modules, Canvas 2D for the stadium, Web Audio for all sound effects and music, Web Speech API for whole words, sentences and the coach (with a synth fallback).

**Letter sounds are recorded phoneme clips** (`assets/sounds/*.mp3`, 68 clips: consonants, short and long vowels, digraphs, r-controlled vowels, beginning and ending blends) so tiles always say the sound and never the letter name, regardless of the browser's voice. They are generated from phoneme strings with espeak-ng + the MBROLA us1 diphone voice by `tools/build-sounds.mjs` (`sudo apt-get install espeak-ng mbrola mbrola-us1 ffmpeg`, then `node tools/build-sounds.mjs`).

Node ≥ 18 for the tiny static server.
