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
};

export const EQUIPMENT_DEFINITIONS: readonly EquipmentDefinition[] = (
  Object.entries(setNames) as [Rarity, readonly string[]][]
).flatMap(([rarity, sets]) =>
  sets.flatMap((setKey) =>
    slots.map((slot) => ({
      id: `${rarity}_${setKey}_${slot}`,
      name: `${rarity[0].toUpperCase()}${rarity.slice(1)} ${setKey[0].toUpperCase()}${setKey.slice(1)} ${slot[0].toUpperCase()}${slot.slice(1)}`,
      rarity,
      slot,
      setKey,
      globalCopyLimit:
        rarity === "epic" ? 4 : rarity === "legendary" ? 1 : null,
    })),
  ),
);
