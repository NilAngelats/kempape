export const DAILY_WHEEL_CONFIG = {
  slices: [
    { id: "small_coins", weight: 22 },
    { id: "big_coins", weight: 10 },
    { id: "regular_consumable", weight: 20 },
    { id: "premium_consumable", weight: 8 },
    { id: "regular_chaos_card", weight: 13 },
    { id: "premium_chaos_card", weight: 5 },
    { id: "regular_equipment", weight: 12 },
    { id: "premium_equipment", weight: 5 },
    { id: "small_punishment", weight: 4 },
    { id: "big_punishment", weight: 1 },
  ],
  smallCoins: { min: 20, max: 40 },
  bigCoins: { min: 50, max: 100 },
  smallPunishment: {
    maxHpDamageRate: 0.10,
    physicalAction: "drink_one_beer_or_agreed_substitute",
  },
  bigPunishment: {
    maxHpDamageRate: 0.25,
    physicalAction: "take_one_jagermeister_shot_or_agreed_substitute",
  },
  normalDailySpins: 1,
} as const;
