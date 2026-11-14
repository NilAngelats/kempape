export type Rarity = "common" | "rare" | "epic" | "legendary";
export type EquipmentSlot = "helmet" | "armor" | "legs" | "boots";

export const CONSUMABLES = [
  { id: "small_health_potion", name: "Small Health Potion", rarity: "common", maxQuantity: 10 },
  { id: "xp_candy", name: "XP Candy", rarity: "common", maxQuantity: 10 },
  { id: "big_health_potion", name: "Big Health Potion", rarity: "rare", maxQuantity: 10 },
  { id: "fortune_ticket", name: "Fortune Ticket", rarity: "rare", maxQuantity: 10 },
  { id: "experience_potion", name: "Experience Potion", rarity: "epic", maxQuantity: 10 },
  { id: "discharge_pill", name: "Discharge Pill", rarity: "epic", maxQuantity: 10 },
  { id: "golden_hourglass", name: "Golden Hourglass", rarity: "legendary", maxQuantity: 10 },
] as const;

export const CHAOS_CARDS = [
  { id: "smoke_cigarette", name: "Smoke a Cigarette", rarity: "common", baseDamage: 6, maxQuantity: 10 },
  { id: "double_sip", name: "Double Sip", rarity: "common", baseDamage: 8, maxQuantity: 10 },
  { id: "big_sip", name: "Big Sip", rarity: "rare", baseDamage: 14, maxQuantity: 10 },
  { id: "shot", name: "Shot", rarity: "rare", baseDamage: 18, maxQuantity: 10 },
  { id: "jagermeister_shot", name: "Jägermeister Shot", rarity: "epic", baseDamage: 24, maxQuantity: 10 },
  { id: "mirror", name: "Mirror", rarity: "epic", baseDamage: 32, maxQuantity: 10, selfDamageDivisor: 5 },
  { id: "finish_your_drink", name: "Finish Your Drink", rarity: "legendary", baseDamage: 37, maxQuantity: 10 },
] as const;

const slots: readonly EquipmentSlot[] = ["helmet", "armor", "legs", "boots"];

const setNames = {
  common: ["regeneration", "damage", "dodge", "potion"],
  rare: ["regeneration", "damage", "protection", "hospital"],
  epic: ["regeneration", "damage", "gold", "chest"],
  legendary: ["regeneration", "damage", "thorns", "phoenix"],
} as const;

export type EquipmentDefinition = {
  id: string;
  name: string;
  rarity: Rarity;
  slot: EquipmentSlot;
  setKey: string;
  globalCopyLimit: number | null;
  effectKind: "regeneration"|"damage"|"dodge"|"potion"|"protection"|"hospital"|"gold"|"chest"|"thorns"|"phoenix";
  effectValue: number;
  fullSetBonus: number;
  intervalSeconds: number | null;
  imageKey: string;
};

const pieceValues:Record<string,Record<EquipmentSlot,number>>={
  common_regeneration:{helmet:1,boots:1,legs:1,armor:2},rare_regeneration:{helmet:1,boots:1,legs:2,armor:3},epic_regeneration:{helmet:2,boots:2,legs:3,armor:4},legendary_regeneration:{helmet:3,boots:3,legs:4,armor:6},
  common_damage:{helmet:100,boots:100,legs:100,armor:200},rare_damage:{helmet:100,boots:100,legs:200,armor:300},epic_damage:{helmet:200,boots:200,legs:300,armor:500},legendary_damage:{helmet:300,boots:300,legs:500,armor:800},
  common_dodge:{helmet:100,boots:100,legs:200,armor:300},common_potion:{helmet:100,boots:100,legs:300,armor:500},rare_protection:{helmet:200,boots:200,legs:400,armor:600},rare_hospital:{helmet:4,boots:4,legs:8,armor:12},
  epic_gold:{helmet:1,boots:1,legs:2,armor:3},epic_chest:{helmet:200,boots:200,legs:600,armor:1000},legendary_thorns:{helmet:200,boots:200,legs:400,armor:600},legendary_phoenix:{helmet:1000,boots:1000,legs:2500,armor:5000},
};
const fullBonuses:Record<string,number>={common_regeneration:1,rare_regeneration:2,epic_regeneration:3,legendary_regeneration:4,common_damage:0,rare_damage:300,epic_damage:300,legendary_damage:600,common_dodge:300,common_potion:500,rare_protection:600,rare_hospital:2,epic_gold:1,epic_chest:500,legendary_thorns:600,legendary_phoenix:500};

export const EQUIPMENT_DEFINITIONS: readonly EquipmentDefinition[] = (
  Object.entries(setNames) as [Rarity, readonly string[]][]
).flatMap(([rarity, sets]) =>
  sets.flatMap((setKey) =>
    slots.map((slot) => {const identity=`${rarity}_${setKey}`;return ({
      id: `${rarity}_${setKey}_${slot}`,
      name: `${rarity[0].toUpperCase()}${rarity.slice(1)} ${setKey[0].toUpperCase()}${setKey.slice(1)} ${slot[0].toUpperCase()}${slot.slice(1)}`,
      rarity,
      slot,
      setKey:identity,
      globalCopyLimit:
        rarity === "epic" ? 4 : rarity === "legendary" ? 1 : null,
      effectKind:setKey as EquipmentDefinition["effectKind"],effectValue:pieceValues[identity][slot],fullSetBonus:fullBonuses[identity],intervalSeconds:setKey==="regeneration"?3600:setKey==="gold"?7200:null,imageKey:`${rarity}_${setKey}_${slot}`,
    })}),
  ),
);

export const EQUIPMENT_EFFECT_UNITS={regeneration:"hp",damage:"basis_points",dodge:"basis_points",potion:"basis_points",protection:"basis_points",hospital:"minutes",gold:"coins",chest:"basis_points",thorns:"basis_points",phoenix:"basis_points"}as const;
