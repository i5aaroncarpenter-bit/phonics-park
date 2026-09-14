/**
 * The Campaign — twelve classic Bible battles told through David and his
 * mighty men (1 Samuel 17, 30; 2 Samuel 21, 23; 1 Chronicles 11, 20).
 *
 * Each battle needs a certain Valor (number of verses mastered) to unlock,
 * has a Battle Verse that powers a once-per-fight Battle Cry, and drops a
 * relic the first time it is won.
 */

const E = (id, name, kind, hp, atk, extra = {}) => ({ id, name, kind, hp, atk, ...extra });

export const BATTLES = [
  {
    id: "lion",
    name: "The Lion in the Night",
    place: "The hills near Bethlehem",
    ref: "1 Samuel 17:34-35",
    valor: 1,
    keyVerse: "ps23_1",
    drop: null,
    shekels: 45,
    xp: 60,
    enemies: [E("lion", "Lion", "lion", 40, 6, { special: "pounce", taunts: ["The lion circles the flock...", "It growls low in the dark.", "It crouches to spring!"] })],
    intro: "Young David is guarding his father's sheep. A lion creeps out of the dark and snatches a lamb from the flock. Will you chase it down?",
    story: "David told King Saul: \"Your servant was keeping his father's sheep, and when a lion or a bear came and took a lamb out of the flock, I went out after him, struck him, and rescued it out of his mouth.\" (1 Samuel 17:34-35). God trained David for great battles through small ones.",
  },
  {
    id: "bear",
    name: "The Bear in the Hills",
    place: "The pastures of Judah",
    ref: "1 Samuel 17:36-37",
    valor: 2,
    keyVerse: "ps27_1",
    drop: "sling",
    shekels: 60,
    xp: 80,
    enemies: [E("bear", "Bear", "bear", 65, 8, { special: "crush", taunts: ["The bear rears up on its hind legs!", "It swipes with massive paws.", "It roars, shaking the trees."] })],
    intro: "A bear has come for the flock. It is bigger and stronger than the lion. David remembers who delivered him last time.",
    story: "\"Your servant struck both the lion and the bear. The LORD who delivered me out of the paw of the lion and out of the paw of the bear, he will deliver me out of the hand of this Philistine.\" (1 Samuel 17:36-37). Remembering past victories gives courage for new ones.",
  },
  {
    id: "goliath",
    name: "Goliath of Gath",
    place: "The Valley of Elah",
    ref: "1 Samuel 17",
    valor: 4,
    boss: true,
    keyVerse: "1sa17_47",
    drop: "goliath_sword",
    shekels: 120,
    xp: 160,
    enemies: [E("goliath", "Goliath", "giant", 130, 11, { special: "roar", size: 1.35, taunts: ["\"Am I a dog, that you come at me with sticks?\"", "\"Come to me, and I will give your flesh to the birds!\"", "Goliath roars, and the ground shakes!", "\"Choose a man and let him come down to me!\""] })],
    intro: "For forty days the giant of Gath has mocked the armies of Israel. Nine feet tall, bronze armor, a spear like a weaver's beam. Every soldier is afraid. But you come in the name of the LORD of Armies.",
    story: "David ran toward the giant, put a stone in his sling, and struck Goliath in the forehead. The champion fell face down on the ground. David said, \"The battle is the LORD's.\" (1 Samuel 17:47-49). Then he took Goliath's own sword. The Philistines fled and Israel gave a great shout!",
  },
  {
    id: "ziklag",
    name: "Raiders of Ziklag",
    place: "The Negev desert",
    ref: "1 Samuel 30",
    valor: 6,
    keyVerse: "ps46_1",
    drop: "cloak_red",
    shekels: 110,
    xp: 150,
    enemies: [
      E("raider1", "Amalekite Raider", "raider", 45, 8, { taunts: ["A raider leaps from behind a dune!"] }),
      E("raider2", "Amalekite Archer", "raider", 45, 9, { taunts: ["Arrows whistle past your ear!"] }),
      E("raider3", "Raider Chief", "captain", 70, 10, { special: "rally", taunts: ["\"You will never catch us!\"", "The chief calls his men to fight harder."] }),
    ],
    intro: "While David and his men were away, Amalekite raiders burned the town of Ziklag and carried off every family. The men wept until they had no strength left. Then David asked the LORD, and the LORD said: pursue. You will surely overtake them, and you will rescue everyone.",
    story: "David and his men pursued the raiders and fought them from twilight until the evening of the next day. Not one was missing, small or great, sons or daughters. David recovered all. (1 Samuel 30:17-19). When everything seems lost, God is still a very present help.",
  },
  {
    id: "pasdammim",
    name: "Eleazar Stands Alone",
    place: "Pas Dammim, the barley field",
    ref: "2 Samuel 23:9-10; 1 Chronicles 11:12-14",
    valor: 8,
    keyVerse: "ps144_1",
    drop: "truth_belt",
    shekels: 140,
    xp: 190,
    enemies: [
      E("phil1", "Philistine Soldier", "soldier", 50, 9, { taunts: ["A Philistine soldier charges with a spear!"] }),
      E("phil2", "Philistine Soldier", "soldier", 55, 10, { taunts: ["Another soldier steps over the fallen."] }),
      E("phil3", "Philistine Soldier", "soldier", 60, 10, { taunts: ["They keep coming!"] }),
      E("phil4", "Philistine Captain", "captain", 80, 12, { special: "rally", taunts: ["\"Push them back! Take the field!\"", "The captain raises his shield and roars."] }),
    ],
    intro: "The Philistines have gathered in a barley field at Pas Dammim, and the men of Israel have fled. Eleazar son of Dodo stands his ground. Wave after wave comes at him. His hand grips the sword so long it freezes to the hilt.",
    story: "Eleazar stood and struck the Philistines until his hand was weary and clung to the sword; and the LORD worked a great victory that day. The people returned after him only to take the plunder. (2 Samuel 23:10). One faithful man and the LORD are a majority.",
  },
  {
    id: "lentils",
    name: "Shammah's Field of Lentils",
    place: "A lentil field at Lehi",
    ref: "2 Samuel 23:11-12",
    valor: 11,
    keyVerse: "deu31_6",
    drop: "peace_shoes",
    shekels: 150,
    xp: 200,
    enemies: [
      E("troop", "Philistine Troop", "soldier", 70, 11, { taunts: ["A troop of Philistines storms the field."] }),
      E("champion", "Philistine Champion", "captain", 110, 13, { special: "roar", size: 1.15, taunts: ["\"This field is ours, Israelite!\"", "The champion swings a great bronze axe."] }),
    ],
    intro: "The Philistines have gathered into a troop in a field full of lentils. Everyone else ran away. Shammah son of Agee did not. It is only a bean field, but it belongs to God's people, and Shammah will not give it up.",
    story: "Shammah stood in the middle of the field, defended it, and struck the Philistines; and the LORD worked a great victory. (2 Samuel 23:12). Faithfulness in small things is how God makes mighty men.",
  },
  {
    id: "well",
    name: "The Well of Bethlehem",
    place: "The gate of Bethlehem",
    ref: "2 Samuel 23:15-17",
    valor: 14,
    keyVerse: "jos1_9",
    drop: "righteous_plate",
    shekels: 170,
    xp: 220,
    enemies: [
      E("gate1", "Gate Guard", "soldier", 75, 12, { taunts: ["A guard blocks the gate with a spear."] }),
      E("gate2", "Gate Guard", "soldier", 75, 12, { taunts: ["Another guard rushes from the tower."] }),
      E("garrison", "Garrison Commander", "captain", 120, 14, { special: "rally", taunts: ["\"No one drinks from our well!\"", "The commander calls for reinforcements."] }),
    ],
    intro: "David is hiding in the cave of Adullam. A Philistine garrison holds Bethlehem, his hometown. He sighs, \"Oh, that someone would give me water from the well by the gate of Bethlehem!\" Three of his mighty men look at each other and quietly pick up their swords.",
    story: "The Three broke through the army of the Philistines, drew water out of the well of Bethlehem, and brought it to David. But he would not drink it. He poured it out to the LORD, saying, \"Shall I drink the blood of the men who risked their lives?\" (2 Samuel 23:16-17). Great love makes men brave.",
  },
  {
    id: "snowlion",
    name: "Benaiah and the Lion in the Pit",
    place: "A snowy pit in Moab",
    ref: "2 Samuel 23:20",
    valor: 17,
    boss: true,
    keyVerse: "isa41_10",
    drop: "faith_shield",
    shekels: 200,
    xp: 260,
    enemies: [E("pitlion", "Lion of the Pit", "lion", 170, 14, { special: "pounce", size: 1.25, taunts: ["The snow muffles a deep growl...", "Yellow eyes glow in the dark of the pit.", "The lion leaps with claws out!"] })],
    intro: "Snow is falling. A lion has fallen into a deep pit, and it is trapped and furious. Most men would walk away. Benaiah son of Jehoiada climbs down into the pit.",
    story: "Benaiah went down and killed a lion in the middle of a pit on a snowy day. (2 Samuel 23:20). He also struck down two lion-like men of Moab. For his courage David made him captain of his bodyguard. Courage is not the absence of fear; it is trusting God in the pit.",
  },
  {
    id: "egyptian",
    name: "Benaiah and the Egyptian Giant",
    place: "The battlefield",
    ref: "2 Samuel 23:21; 1 Chronicles 11:23",
    valor: 20,
    keyVerse: "ps18_2",
    drop: "benaiah_spear",
    shekels: 220,
    xp: 280,
    enemies: [E("egyptian", "Egyptian Giant", "egyptian", 190, 15, { special: "spear", size: 1.3, taunts: ["The Egyptian hefts a spear like a weaver's beam!", "He towers over you, seven and a half feet tall.", "\"You bring only a staff, little one?\""] })],
    intro: "An Egyptian of enormous size stands before you with a spear like a weaver's beam. Benaiah has only a staff in his hand. He does not turn back.",
    story: "Benaiah went down to the Egyptian with a staff, snatched the spear out of the Egyptian's hand, and killed him with his own spear. (1 Chronicles 11:23). The weapon of the enemy became the trophy of the faithful.",
  },
  {
    id: "ishbi",
    name: "Abishai Rescues the King",
    place: "The war with the Philistines",
    ref: "2 Samuel 21:15-17",
    valor: 24,
    boss: true,
    keyVerse: "pro18_10",
    drop: "salvation_helm",
    shekels: 250,
    xp: 320,
    enemies: [E("ishbi", "Ishbi-benob", "giant", 230, 17, { special: "crush", size: 1.4, taunts: ["\"Today I kill the king of Israel!\"", "His bronze spear weighs three hundred shekels.", "Ishbi-benob raises his new sword high!", "The giant pounds his chest and bellows."] })],
    intro: "King David has grown weary in battle. Ishbi-benob, a giant of the sons of Rapha with a bronze spear of three hundred shekels, sees his chance and moves in to kill the king. Abishai son of Zeruiah sees it too.",
    story: "Abishai came to David's help, struck the Philistine, and killed him. Then David's men swore, \"You shall not go out to battle with us anymore, so that you don't quench the lamp of Israel.\" (2 Samuel 21:17). Mighty men protect the ones God has placed over them.",
  },
  {
    id: "gath",
    name: "The Giants of Gath",
    place: "Gob and Gath",
    ref: "2 Samuel 21:18-19; 1 Chronicles 20:4-5",
    valor: 28,
    keyVerse: "eph6_12",
    drop: "cloak_purple",
    shekels: 280,
    xp: 360,
    enemies: [
      E("saph", "Saph the Giant", "giant", 160, 16, { special: "crush", size: 1.25, taunts: ["Saph swings a club the size of a tree!", "\"Rapha's sons do not fall!\""] }),
      E("lahmi", "Lahmi, Goliath's Brother", "giant", 200, 18, { special: "roar", size: 1.35, taunts: ["\"You killed my brother. Now you face ME.\"", "Lahmi's spear is like a weaver's beam.", "He roars for Goliath!"] }),
    ],
    intro: "The sons of Rapha, the giants of Gath, keep coming. Sibbecai the Hushathite killed Saph. Elhanan killed Lahmi, the brother of Goliath. One at a time, the mighty men are cutting down every giant.",
    story: "There was again war with the Philistines at Gob. Sibbecai the Hushathite killed Saph, of the sons of the giant. And Elhanan killed Lahmi the brother of Goliath, whose spear shaft was like a weaver's beam. (1 Chronicles 20:4-5). Giants fall when God's people stand together.",
  },
  {
    id: "sixfingers",
    name: "The Six-Fingered Giant",
    place: "The gates of Gath",
    ref: "2 Samuel 21:20-22",
    valor: 33,
    boss: true,
    final: true,
    keyVerse: "eph6_11",
    drop: "spirit_sword",
    shekels: 400,
    xp: 500,
    enemies: [E("sixfinger", "The Six-Fingered Giant", "giant", 320, 20, { special: "crush", size: 1.5, taunts: ["Six fingers on each hand. Six toes on each foot.", "\"I am the last of the giants, and I will be the last thing you see!\"", "He defies Israel and the God of Israel!", "The giant's blow cracks the stone beneath you!", "\"Where is your God now, little warrior?\""] })],
    intro: "One giant remains. He has six fingers on each hand and six toes on each foot, twenty-four in all, and he defies Israel. Jonathan son of Shimea, David's nephew, steps forward. Put on the whole armor of God. This is the last giant.",
    story: "Jonathan the son of Shimea, David's brother, killed him. These four were born to the giant in Gath, and they fell by the hand of David and by the hand of his servants. (2 Samuel 21:21-22). Every giant that defies God falls. You are now counted among the Mighty Men of Valor!",
  },
];

export const battleById = new Map(BATTLES.map((b) => [b.id, b]));

export const ARENA = {
  id: "arena",
  name: "Arena of the Thirty",
  unlockAfter: "goliath",
  description: "Endless waves of Philistines. Each wave is tougher and pays more shekels. How far can you go?",
};

const ARENA_POOL = [
  ["Philistine Scout", "soldier", 40, 7],
  ["Philistine Soldier", "soldier", 55, 9],
  ["Moabite Raider", "raider", 50, 9],
  ["Ammonite Spearman", "soldier", 60, 10],
  ["Philistine Captain", "captain", 80, 11, "rally"],
  ["Desert Lion", "lion", 70, 10, "pounce"],
  ["Mountain Bear", "bear", 85, 11, "crush"],
  ["Son of Rapha", "giant", 120, 13, "crush", 1.25],
];

export function arenaWave(n) {
  const scale = 1 + (n - 1) * 0.14;
  const pick = ARENA_POOL[Math.min(ARENA_POOL.length - 1, Math.floor((n - 1) / 1.5) + (n % 2))] || ARENA_POOL[0];
  const [name, kind, hp, atk, special, size] = pick;
  return {
    id: `arena_${n}`,
    name: `${name} (Wave ${n})`,
    kind,
    hp: Math.round(hp * scale),
    atk: Math.round(atk * (1 + (n - 1) * 0.08)),
    special: special || null,
    size: size || 1,
    taunts: ["The crowd of the Thirty cheers you on!", "Another challenger steps into the ring.", "\"Show us what the word of God can do!\""],
  };
}

export function arenaReward(n) {
  return { shekels: 15 + n * 6, xp: 10 + n * 4 };
}

export const SPECIALS = {
  pounce: { name: "Pounce", text: "Every third blow does double damage." },
  roar: { name: "Roar", text: "Every third turn steals 2 seconds from your timer." },
  crush: { name: "Crush", text: "Blows smash straight through your armor." },
  rally: { name: "Rally", text: "Heals once when badly wounded." },
  spear: { name: "Spear Throw", text: "The first blow is extra heavy." },
};
