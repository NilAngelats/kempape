export type ActionTier = "common" | "rare" | "epic" | "legendary";

export type GameActionDefinition = {
  id: string;
  name: string;
  tier: ActionTier;
  hpCost: number;
  xpPercentage: number;
  coinReward: number;
  cooldownMinutes?: number;
  dailyCap?: number;
  festivalCap?: number;
  requiresUniquePerson?: boolean;
  requiresUniqueGroup?: boolean;
  requiresUniqueItem?: boolean;
  isExtremeChallenge?: boolean;
  enabledByDefault?: boolean;
};

export const ACTIONS: readonly GameActionDefinition[] = [
  { id: "smoke_cigarette", name: "Smoke a Cigarette", tier: "common", hpCost: 6, xpPercentage: 0.15, coinReward: 10, cooldownMinutes: 10 },
  { id: "drink_beer", name: "Drink a Beer", tier: "common", hpCost: 10, xpPercentage: 0.15, coinReward: 10, cooldownMinutes: 10 },
  { id: "strong_mixed_drink", name: "Drink a Strong Mixed Drink", tier: "rare", hpCost: 14, xpPercentage: 0.35, coinReward: 25, cooldownMinutes: 10 },
  { id: "take_shot", name: "Take a Shot", tier: "rare", hpCost: 18, xpPercentage: 0.35, coinReward: 25, cooldownMinutes: 10 },
  { id: "jagermeister_shot", name: "Take a Jägermeister Shot", tier: "epic", hpCost: 24, xpPercentage: 0.60, coinReward: 50, cooldownMinutes: 10 },
  { id: "smoke_joint", name: "Smoke a Joint", tier: "epic", hpCost: 30, xpPercentage: 0.60, coinReward: 50, cooldownMinutes: 10 },
  { id: "finish_drink", name: "Finish Your Drink", tier: "legendary", hpCost: 37, xpPercentage: 0.90, coinReward: 100, cooldownMinutes: 10 },
  {
    id: "extreme_festival_challenge",
    name: "Extreme Festival Challenge",
    tier: "legendary",
    hpCost: 60,
    xpPercentage: 1.50,
    coinReward: 150,
    dailyCap: 1,
    isExtremeChallenge: true,
    enabledByDefault: false,
  },

  { id: "pushups_20", name: "20 Push-ups", tier: "common", hpCost: 0, xpPercentage: 0.15, coinReward: 10, cooldownMinutes: 60, dailyCap: 5 },
  { id: "squats_40", name: "40 Squats", tier: "common", hpCost: 0, xpPercentage: 0.15, coinReward: 10, cooldownMinutes: 60, dailyCap: 5 },
  { id: "cold_shower", name: "Cold Shower", tier: "common", hpCost: 0, xpPercentage: 0.15, coinReward: 10, cooldownMinutes: 240, dailyCap: 2 },
  { id: "paid_shower", name: "Pay for a Shower", tier: "rare", hpCost: 0, xpPercentage: 0.35, coinReward: 25, dailyCap: 1 },

  { id: "find_known_person", name: "Find Someone You Know", tier: "common", hpCost: 0, xpPercentage: 0.15, coinReward: 10, requiresUniquePerson: true },
  { id: "talk_stranger_20", name: "Talk to a Stranger for 20+ Minutes", tier: "rare", hpCost: 0, xpPercentage: 0.35, coinReward: 25, dailyCap: 2, requiresUniquePerson: true },
  { id: "find_catalans", name: "Find Catalan People", tier: "rare", hpCost: 0, xpPercentage: 0.35, coinReward: 25, dailyCap: 1, requiresUniqueGroup: true },
  { id: "make_out", name: "Make Out With Someone", tier: "epic", hpCost: 0, xpPercentage: 0.60, coinReward: 50, dailyCap: 1, requiresUniquePerson: true },
  { id: "have_sex", name: "Have Sex With Someone", tier: "legendary", hpCost: 0, xpPercentage: 0.90, coinReward: 100, festivalCap: 1, requiresUniquePerson: true },
  { id: "tattoo", name: "Get a Permanent Tattoo", tier: "legendary", hpCost: 0, xpPercentage: 0.90, coinReward: 100, festivalCap: 1 },
  { id: "group_photo", name: "Take a Group Photo With Another Festival Group", tier: "rare", hpCost: 0, xpPercentage: 0.35, coinReward: 25, dailyCap: 1, requiresUniqueGroup: true },
  { id: "language_phrase", name: "Learn and Test a Phrase in Another Language", tier: "rare", hpCost: 0, xpPercentage: 0.35, coinReward: 25, dailyCap: 1, requiresUniquePerson: true },
  { id: "lead_toast", name: "Lead a Toast With Another Festival Group", tier: "rare", hpCost: 0, xpPercentage: 0.35, coinReward: 25, dailyCap: 1, requiresUniqueGroup: true },
  { id: "receive_item", name: "Receive an Item From Another Person", tier: "epic", hpCost: 0, xpPercentage: 0.60, coinReward: 50, dailyCap: 1, requiresUniqueItem: true },
] as const;
