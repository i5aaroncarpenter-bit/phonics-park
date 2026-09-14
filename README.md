# Mighty Men — Warriors of the Word

A Bible verse memory game for children, built around David and his mighty men
(1 Samuel 17, 30; 2 Samuel 21, 23; 1 Chronicles 11, 20). Memorize God's word,
earn shekels, forge your armor, and fight the giants of Gath.

**Play it now: [mightymen.surge.sh](https://mightymen.surge.sh)**

No build step. Plain HTML/CSS/JS modules served by `server.mjs`.

```
npm start          # http://localhost:8080
npm run deploy     # publishes to https://mightymen.surge.sh (needs the Surge login)
```

Any static host works too (the Railway config is included). Sound and read-aloud
start after the first tap on the page (browser autoplay rules).

## How it plays

1. **Answer the call** — each child creates a warrior: **boy or girl**, name,
   skin, hair color and style (short, curly, long, braids, ponytail, bun),
   tunic. Girls wear a longer tunic and headband and rise from Shepherd Girl to
   Mighty Woman of Valor. Looks can be changed any time at the **Tailor's
   Mirror** in camp without touching progress or gear. Siblings share a device
   and compete on the Roll of the Mighty.
2. **The Scrolls** — 106 verses in 12 themed scrolls, from short starters
   (*The Shepherd's Sling*) through each piece of the Armor of God to epic
   passages (*The Whole Armor of God*). Two public-domain translations ship in
   the game: WEB (modern English, default) and KJV. Parents can add verses from
   their own Bible or edit any verse's wording.
3. **The Forge** — every verse is hammered through five stages, each a mini-game
   that pays shekels and XP:
   - **Hear It** — read aloud with words lighting up, then tap-along echo.
   - **Fallen Stones** — rebuild the verse from scrambled phrases.
   - **Mend the Shield** — put the knocked-out words back.
   - **Speed Sword** — timed "what comes next?" with combos.
   - **Test the Blade** — build the whole verse from a word bank (no hints) and
     name the reference. Pass it and the verse is **mastered** (+1 Valor).
4. **Sharpen** — mastered verses are swords with 1–5 stars. Stars fade on a
   spaced schedule (1, 2, 4, 7, 14, 30 days); a quick review re-sharpens them.
   Reciting a verse aloud to a parent sets it to 5 stars and pays a bonus.
   **Speak the Sword** does the same with the device microphone: the words stay
   hidden while the child recites, light up as they are heard, and 85% of the
   verse heard counts as word-perfect (+20 shekels once per verse per day, sword
   polished to 5 stars). Works in Chrome, Edge and Safari; other browsers are
   pointed to the Captain's recite approval.
5. **The Armory** — six slots that mirror Ephesians 6 (sword, shield, helmet,
   breastplate, belt, sandals) plus cloaks. Four buyable tiers per slot; relics
   (Belt of Truth, Shield of Faith, Sword of the Spirit...) are only won in
   battle. Gear is drawn on the warrior and changes the combat math.
6. **The Campaign** — twelve battles unlock as Valor grows: the lion and the
   bear, Goliath, the raiders of Ziklag, Eleazar at Pas Dammim, Shammah's lentil
   field, the well of Bethlehem, Benaiah's lion in the pit and the Egyptian
   giant, Ishbi-benob, Saph and Lahmi, and the six-fingered giant of Gath.
   Combat is turn-based and **every attack is a verse question**, so fighting
   is review. Each battle has a key verse that powers a once-per-fight Battle
   Cry. Victory tells what really happened, with the reference.
   The endless **Arena of the Thirty** opens after Goliath falls.
7. **The Gauntlet** — once three verses are mastered: sixty seconds of
   rapid-fire questions drawn from *every* mastered verse. Two shekels per
   right answer, a bonus for a new best, three seconds lost per miss. The best
   score sits on the leaderboard.
8. **Sibling Duel** — two warriors, one device, five rounds each. Every child
   is only asked about verses *they* have mastered, so a five-year-old can duel
   a ten-year-old fairly. Points for right answers, extra for quick ones;
   winner +40 shekels, the other +15. "Iron sharpens iron" (Proverbs 27:17).
9. **Keep coming back** — Today's Orders (three daily quests and a chest),
   day streaks, ten ranks from Shepherd Boy/Girl to Mighty Man/Woman of Valor,
   28 badges in the Hall of Valor.
10. **Install it** — the game is a PWA: add it to a phone or tablet home screen
    (the Tent has a button and instructions) and it opens full screen and plays
    offline after the first visit.

## Captain's Tent (parents)

Protected by an optional PIN. Choose the translation, toggle read-aloud, music
and sound effects, see each child's progress and which verses need review,
approve recitations, add custom verses or edit wording, give a Captain's Gift of
shekels for real-life obedience, back up or restore the save, and manage
warriors.

## Stats and combat

| Slot | Armor of God | Stat |
| --- | --- | --- |
| Sword | Sword of the Spirit | Attack (damage per correct answer) |
| Shield | Shield of Faith | Block % (stops a blow entirely) |
| Helmet | Helmet of Salvation | Armor (flat damage reduction) |
| Breastplate | Breastplate of Righteousness | Life |
| Belt | Belt of Truth | Mighty Blow % (double damage) |
| Sandals | Shoes of the Gospel of Peace | Speed (extra seconds, dodge) |

Correct answer: strike (fast answers +25%, every third in a row +50%).
Wrong or too slow: your swing misses and the enemy hits harder. Enemies have
specials: Pounce, Roar, Crush, Rally, Spear Throw.

## Layout

```
index.html            entry
server.mjs            static server (Railway: node server.mjs)
tools/deploy-surge.sh publish to surge.sh
src/main.js           router
src/data/verses.js    scrolls and verses (WEB + KJV), text helpers
src/data/gear.js      armory catalog and hero stats
src/data/battles.js   campaign, enemies, arena scaling
src/data/progress.js  ranks, rewards, badges, review intervals
src/engine/           progress (mastery, sharpness, orders, badges), questions
src/stages/           the five Forge mini-games
src/screens/          title, camp, look (creation + mirror), scrolls, forge, speak, gauntlet, duel,
                      armory, battles, battle, hall, tent, reward
src/hero.js           SVG warrior and enemy rendering
src/audio.js          WebAudio sound effects and music
src/speech.js         Web Speech API read-aloud and microphone recognition
src/engine/spoken.js  scoring for Speak the Sword (verse/transcript alignment)
src/install.js        service worker registration and install prompt
manifest.json, sw.js  PWA manifest and offline cache; icons/ app icons
src/fx.js             particles, coins, confetti, screen shake
src/save.js           localStorage save with per-child profiles
```

Saves live in the browser's localStorage under `mightymen.save.v1`; use the
Tent's backup buttons to move a save between devices.
