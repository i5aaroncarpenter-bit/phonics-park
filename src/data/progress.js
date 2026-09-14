/** Ranks (by XP), badges (Hall of Valor), and the shekel economy. */

export const RANKS = [
  { id: "shepherd", name: "Shepherd Boy", nameF: "Shepherd Girl", xp: 0, icon: "🐑" },
  { id: "recruit", name: "Recruit", xp: 120, icon: "🪖" },
  { id: "shieldbearer", name: "Shield-bearer", xp: 320, icon: "🛡️" },
  { id: "soldier", name: "Soldier", xp: 650, icon: "⚔️" },
  { id: "armorbearer", name: "Armor-bearer", xp: 1100, icon: "🦺" },
  { id: "captain50", name: "Captain of Fifty", xp: 1700, icon: "🚩" },
  { id: "captain100", name: "Captain of a Hundred", xp: 2500, icon: "🏳️" },
  { id: "thirty", name: "One of the Thirty", xp: 3500, icon: "🌟" },
  { id: "three", name: "One of the Three", xp: 4800, icon: "💫" },
  { id: "mighty", name: "Mighty Man of Valor", nameF: "Mighty Woman of Valor", xp: 6500, icon: "👑" },
];

export function rankFor(xp) {
  let r = RANKS[0];
  for (const k of RANKS) if (xp >= k.xp) r = k;
  return r;
}

/** Rank title as the child should read it (a few ranks have a girl's form). */
export function rankTitle(rank, profile) {
  return profile?.look?.body === "girl" && rank.nameF ? rank.nameF : rank.name;
}

export function nextRank(xp) {
  return RANKS.find((k) => k.xp > xp) || null;
}

/** Shekels and XP handed out by the Forge, per stage index (0-4). */
export const STAGE_REWARDS = [
  { name: "Hear It", shekels: 5, xp: 8 },
  { name: "Fallen Stones", shekels: 8, xp: 10, perfect: 4 },
  { name: "Mend the Shield", shekels: 10, xp: 12, perfect: 5 },
  { name: "Speed Sword", shekels: 12, xp: 14, perfect: 6 },
  { name: "Test the Blade", shekels: 20, xp: 20, perfect: 10 },
];
export const MASTERY_BONUS = { shekels: 25, xp: 50 };
export const RECITE_BONUS = { shekels: 30, xp: 40 };
export const SHARPEN_REWARD = { shekels: 8, xp: 10, perfect: 4 };
export const ORDERS_CHEST = { shekels: 40, xp: 30 };
/** Speak the Sword: word-perfect recitation heard by the device microphone. */
export const SPOKEN_BONUS = { shekels: 20, xp: 25, near: 8 };
/** The Gauntlet: 60 seconds of rapid-fire questions on mastered verses. */
export const GAUNTLET = { seconds: 60, perCorrect: 2, xpPerCorrect: 2, newBest: 20, streakBonus: 5, minValor: 3 };
/** Sibling Duel: two warriors, one device, best score wins. */
export const DUEL = { rounds: 5, win: { shekels: 40, xp: 30 }, lose: { shekels: 15, xp: 15 }, draw: { shekels: 25, xp: 20 } };

export const BADGES = [
  { id: "first_verse", name: "First Blood", desc: "Master your first verse", icon: "🗡️" },
  { id: "five_verses", name: "Squad Leader", desc: "Master 5 verses", icon: "🖐️" },
  { id: "ten_verses", name: "The Ten", desc: "Master 10 verses", icon: "🔟" },
  { id: "twenty_verses", name: "Twenty Strong", desc: "Master 20 verses", icon: "💪" },
  { id: "thirty_verses", name: "The Thirty", desc: "Master 30 verses", icon: "🌟" },
  { id: "fifty_verses", name: "Legend of Israel", desc: "Master 50 verses", icon: "🏛️" },
  { id: "scroll_done", name: "Scroll Keeper", desc: "Master every verse in a scroll", icon: "📜" },
  { id: "perfect_blade", name: "Flawless Blade", desc: "Pass Test the Blade with zero mistakes", icon: "✨" },
  { id: "recite", name: "Spoken Aloud", desc: "Recite a verse to your Captain", icon: "🗣️" },
  { id: "recite_ten", name: "Herald", desc: "Recite 10 verses aloud", icon: "📣" },
  { id: "lion_slayer", name: "Lion Slayer", desc: "Win The Lion in the Night", icon: "🦁" },
  { id: "giant_slayer", name: "Giant Slayer", desc: "Defeat Goliath", icon: "🪨" },
  { id: "campaign", name: "Mighty Man of Valor", desc: "Win every campaign battle", icon: "👑" },
  { id: "whole_armor", name: "Whole Armor of God", desc: "Collect all six relics of Ephesians 6", icon: "🏆" },
  { id: "streak3", name: "Three Days of Valor", desc: "Play 3 days in a row", icon: "🔥" },
  { id: "streak7", name: "Week of Valor", desc: "Play 7 days in a row", icon: "🔥" },
  { id: "streak30", name: "Month of Valor", desc: "Play 30 days in a row", icon: "☀️" },
  { id: "sharp_five", name: "Razor Edge", desc: "Polish a verse to 5 stars", icon: "⭐" },
  { id: "arena10", name: "Arena Champion", desc: "Reach wave 10 in the Arena", icon: "🏟️" },
  { id: "rich", name: "Treasury of Ophir", desc: "Hold 1,000 shekels at once", icon: "🪙" },
  { id: "geared", name: "Fully Armed", desc: "Equip every slot with bought or won gear", icon: "🦺" },
  { id: "orders7", name: "Faithful Soldier", desc: "Complete Today's Orders 7 times", icon: "📋" },
  { id: "spoken", name: "Voice of Valor", desc: "Say a verse aloud word-perfect (Speak the Sword)", icon: "🎤" },
  { id: "spoken10", name: "Loud and Clear", desc: "Speak 10 verses aloud word-perfect", icon: "📯" },
  { id: "gauntlet15", name: "Iron Endurance", desc: "Answer 15 in one Gauntlet run", icon: "⏱️" },
  { id: "gauntlet30", name: "Unbroken", desc: "Answer 30 in one Gauntlet run", icon: "🏃" },
  { id: "duel_win", name: "Iron Sharpens Iron", desc: "Win a Sibling Duel (Proverbs 27:17)", icon: "🤺" },
  { id: "duel5", name: "Champion of the Camp", desc: "Win 5 Sibling Duels", icon: "🥇" },
];

export const badgeById = new Map(BADGES.map((b) => [b.id, b]));

/** Days until a sharp verse loses a star, by how many times it has been reviewed. */
export const REVIEW_INTERVALS = [1, 2, 4, 7, 14, 30, 60];
