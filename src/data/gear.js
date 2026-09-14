/**
 * The Armory. Every slot maps to a piece of the Armor of God (Ephesians 6).
 *
 * Stats used in battle:
 *   atk   — sword damage per correct answer
 *   block — % chance the shield stops an enemy blow completely
 *   armor — flat damage removed from every enemy blow (helmet)
 *   hp    — extra max life (breastplate)
 *   crit  — % chance a hit is a Mighty Blow (double damage) (belt)
 *   speed — extra seconds on the answer timer, plus dodge% = speed * 3 (shoes)
 *
 * tier 1-4 are bought with shekels. tier 5 "relics" are only won in battle.
 */

export const SLOTS = [
  { id: "sword", name: "Sword", armorOf: "Sword of the Spirit", icon: "🗡️", stat: "atk", statName: "Attack" },
  { id: "shield", name: "Shield", armorOf: "Shield of Faith", icon: "🛡️", stat: "block", statName: "Block %" },
  { id: "helmet", name: "Helmet", armorOf: "Helmet of Salvation", icon: "⛑️", stat: "armor", statName: "Armor" },
  { id: "breastplate", name: "Breastplate", armorOf: "Breastplate of Righteousness", icon: "🦺", stat: "hp", statName: "Life" },
  { id: "belt", name: "Belt", armorOf: "Belt of Truth", icon: "🪢", stat: "crit", statName: "Mighty Blow %" },
  { id: "sandals", name: "Sandals", armorOf: "Shoes of the Gospel of Peace", icon: "🥾", stat: "speed", statName: "Speed" },
  { id: "cloak", name: "Cloak", armorOf: "Colors of your house", icon: "🧣", stat: null, statName: "Style" },
];

export const TIER_NAMES = ["", "Leather", "Bronze", "Iron", "Captain's", "Relic"];
export const TIER_COLORS = {
  1: { main: "#8b5a2b", dark: "#5e3a17", light: "#b8804a" },
  2: { main: "#c07a3a", dark: "#7d4a1d", light: "#e3a86a" },
  3: { main: "#8d949c", dark: "#565b62", light: "#c5cbd2" },
  4: { main: "#d4a83a", dark: "#8f6a12", light: "#f5d97a" },
  5: { main: "#f2e6b8", dark: "#b9952a", light: "#ffffff" },
};

const G = (id, slot, tier, name, cost, stats, flavor, extra = {}) => ({ id, slot, tier, name, cost, stats, flavor, ...extra });

export const GEAR = [
  // Swords
  G("staff", "sword", 0, "Shepherd's Staff", 0, { atk: 0 }, "Every mighty man starts as a shepherd."),
  G("sword1", "sword", 1, "Wooden Training Sword", 50, { atk: 5 }, "Light, quick, and it still stings."),
  G("sword2", "sword", 2, "Bronze Short Sword", 160, { atk: 11 }, "Forged in the fires of Hebron."),
  G("sword3", "sword", 3, "Iron Sword", 380, { atk: 18 }, "Iron was rare in Israel. This one is yours."),
  G("sword4", "sword", 4, "Captain's Longsword", 750, { atk: 27 }, "Carried by leaders of the Thirty."),
  G("sling", "sword", 2, "Shepherd's Sling", 0, { atk: 13 }, "Five smooth stones. One was enough.", { relic: true }),
  G("goliath_sword", "sword", 3, "Goliath's Sword", 0, { atk: 22 }, "Taken from the giant himself in the Valley of Elah.", { relic: true }),
  G("benaiah_spear", "sword", 4, "Benaiah's Spear", 0, { atk: 31 }, "Snatched from the Egyptian's own hand.", { relic: true }),
  G("spirit_sword", "sword", 5, "Sword of the Spirit", 0, { atk: 42 }, "\"...which is the word of God.\" Ephesians 6:17", { relic: true }),

  // Shields
  G("shield1", "shield", 1, "Wicker Buckler", 50, { block: 8 }, "Better than nothing. Barely."),
  G("shield2", "shield", 2, "Leather Shield", 150, { block: 14 }, "Stretched hide over a wooden frame."),
  G("shield3", "shield", 3, "Bronze Round Shield", 360, { block: 20 }, "Polished to blind the enemy at sunrise."),
  G("shield4", "shield", 4, "Iron Tower Shield", 720, { block: 27 }, "Stand behind it and nothing gets through."),
  G("faith_shield", "shield", 5, "Shield of Faith", 0, { block: 36 }, "Quenches every fiery dart. Ephesians 6:16", { relic: true }),

  // Helmets
  G("helm1", "helmet", 1, "Leather Cap", 45, { armor: 2 }, "Keeps the sun off, and a little more."),
  G("helm2", "helmet", 2, "Bronze Helm", 150, { armor: 4 }, "Rings like a bell when struck."),
  G("helm3", "helmet", 3, "Iron Helm", 350, { armor: 7 }, "Heavy, but your head stays on."),
  G("helm4", "helmet", 4, "Captain's Crested Helm", 700, { armor: 10 }, "A red plume marks a leader of men."),
  G("salvation_helm", "helmet", 5, "Helmet of Salvation", 0, { armor: 14 }, "Guards the mind with the good news. Ephesians 6:17", { relic: true }),

  // Breastplates
  G("plate1", "breastplate", 1, "Padded Tunic", 55, { hp: 15 }, "Quilted linen. Warm and tough."),
  G("plate2", "breastplate", 2, "Leather Cuirass", 170, { hp: 30 }, "Boiled leather, shaped to the chest."),
  G("plate3", "breastplate", 3, "Bronze Scale Mail", 390, { hp: 50 }, "Hundreds of scales, like a fish of war."),
  G("plate4", "breastplate", 4, "Iron Plate", 760, { hp: 75 }, "The armor of a king's champion."),
  G("righteous_plate", "breastplate", 5, "Breastplate of Righteousness", 0, { hp: 110 }, "A clean heart is the strongest armor. Ephesians 6:14", { relic: true }),

  // Belts
  G("belt1", "belt", 1, "Rope Belt", 40, { crit: 4 }, "Cinch your tunic. Ready to run."),
  G("belt2", "belt", 2, "Leather Belt", 120, { crit: 8 }, "Holds your sword and your courage."),
  G("belt3", "belt", 3, "Studded War Belt", 300, { crit: 13 }, "Bronze studs, tight buckle."),
  G("belt4", "belt", 4, "Warrior's Girdle", 600, { crit: 18 }, "Worn by men who never flinch."),
  G("truth_belt", "belt", 5, "Belt of Truth", 0, { crit: 25 }, "Truth cuts deep. Ephesians 6:14", { relic: true }),

  // Sandals
  G("sandal1", "sandals", 1, "Traveler's Sandals", 40, { speed: 1 }, "Made for the hills of Judah."),
  G("sandal2", "sandals", 2, "Marching Sandals", 120, { speed: 2 }, "Thirty miles a day, no blisters."),
  G("sandal3", "sandals", 3, "Bronze Greaves", 300, { speed: 3 }, "Shin plates for the front line."),
  G("sandal4", "sandals", 4, "Swift Greaves", 600, { speed: 4 }, "\"He makes my feet like the feet of deer.\""),
  G("peace_shoes", "sandals", 5, "Shoes of the Gospel of Peace", 0, { speed: 5 }, "Feet ready to carry good news. Ephesians 6:15", { relic: true }),

  // Cloaks (cosmetic)
  G("cloak_red", "cloak", 1, "Crimson Cloak", 80, {}, "The color of courage.", { color: "#b3261e" }),
  G("cloak_blue", "cloak", 1, "Sky Blue Cloak", 80, {}, "The color of the heavens.", { color: "#2a6fd6" }),
  G("cloak_green", "cloak", 1, "Forest Cloak", 80, {}, "For shepherds and scouts.", { color: "#2f8a4a" }),
  G("cloak_purple", "cloak", 4, "Royal Purple Cloak", 350, {}, "Purple dye cost more than gold.", { color: "#6a2c9e" }),
  G("cloak_gold", "cloak", 5, "Cloak of the Three", 0, {}, "Only the Three ever wore this.", { relic: true, color: "#e0b040" }),
];

export const gearById = new Map(GEAR.map((g) => [g.id, g]));

export const RELIC_SET = ["truth_belt", "righteous_plate", "peace_shoes", "faith_shield", "salvation_helm", "spirit_sword"];

export const BASE_STATS = { hp: 100, atk: 10, block: 0, armor: 0, crit: 5, speed: 0 };

export function heroStats(profile) {
  const out = { ...BASE_STATS };
  for (const slot of SLOTS) {
    const g = gearById.get(profile?.equipped?.[slot.id]);
    if (!g) continue;
    for (const [k, v] of Object.entries(g.stats || {})) out[k] = (out[k] || 0) + v;
  }
  out.power = Math.round(out.atk * 2 + out.hp / 5 + out.block + out.armor * 1.5 + out.crit + out.speed * 3);
  return out;
}

export function tierName(g) {
  if (!g) return "";
  if (g.relic) return "Relic";
  return TIER_NAMES[g.tier] || "";
}
