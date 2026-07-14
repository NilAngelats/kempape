export const CHEST_CONFIG = {
  small: {
    price: 25,
    baseRewardSlotCount: 1,
    premium: {
      categoryWeights: {
        equipment: 1,
        consumable: 1,
        chaosCard: 1,
      },
      rarityWeights: {
        common: 79,
        rare: 18,
        epic: 2.8,
        legendary: 0.2,
      },
    },
  },
  medium: {
    price: 70,
    baseRewardSlotCount: 2,
    regular: {
      rewardTypeWeights: { coins: 50, consumable: 50 },
      coinRange: { min: 15, max: 30 },
      consumableRarityWeights: {
        common: 55,
        rare: 30,
        epic: 10,
        legendary: 5,
      },
    },
    premium: {
      categoryWeights: {
        equipment: 50,
        consumable: 10,
        chaosCard: 40,
      },
      rarityWeights: {
        common: 50,
        rare: 37,
        epic: 12,
        legendary: 1,
      },
    },
  },
  big: {
    price: 200,
    baseRewardSlotCount: 3,
    regular: {
      rewardTypeWeights: { coins: 50, consumable: 50 },
      coinRange: { min: 20, max: 45 },
      consumableRarityWeights: {
        common: 30,
        rare: 35,
        epic: 20,
        legendary: 15,
      },
    },
    premium: {
      categoryWeights: {
        equipment: 50,
        consumable: 10,
        chaosCard: 40,
      },
      rarityWeights: {
        common: 20,
        rare: 45,
        epic: 30,
        legendary: 5,
      },
      independentSlotCount: 2,
    },
  },
  chestSet: {
    helmet: 0.02,
    boots: 0.02,
    legs: 0.06,
    armor: 0.10,
    fullSetBonus: 0.05,
    maximumChance: 0.25,
    maximumBonusRewardsPerOpening: 1,
  },
} as const;
