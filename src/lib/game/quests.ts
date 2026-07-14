export const DAILY_QUESTS = [
  { id: "easy_accepted_5", difficulty: "easy", acceptedActions: 5, xpPercentage: 0.80, coinReward: 15 },
  { id: "easy_validations_10", difficulty: "easy", successfulValidations: 10, xpPercentage: 0.80, coinReward: 15 },
  { id: "easy_variety_5", difficulty: "easy", distinctActions: 5, xpPercentage: 0.80, coinReward: 15 },
  { id: "medium_accepted_10", difficulty: "medium", acceptedActions: 10, xpPercentage: 1.40, coinReward: 30 },
  { id: "medium_validations_15", difficulty: "medium", successfulValidations: 15, xpPercentage: 1.40, coinReward: 30 },
  {
    id: "hard_daily_mastery",
    difficulty: "hard",
    acceptedActions: 15,
    successfulValidations: 20,
    distinctActions: 7,
    xpPercentage: 2.30,
    coinReward: 95,
  },
] as const;

/**
 * When multiple quests complete in one transaction, process them in this
 * exact order. Each reward uses the player's level after the previous reward.
 */
export const DAILY_QUEST_REWARD_ORDER =
  DAILY_QUESTS.map((quest) => quest.id);
