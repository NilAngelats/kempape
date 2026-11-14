export const ECONOMY_CONFIG = {
  startingCoins: 50,
  chestPrices: {
    small: 25,
    medium: 70,
    big: 200,
  },
  actionCoinRewards: {
    common: 10,
    rare: 25,
    epic: 50,
    legendary: 100,
    extremeChallenge: 150,
  },
  dailyQuestCoinRewards: {
    easy: 15,
    medium: 30,
    hard: 95,
  },
  dailyQuestCounts: {
    easy: 3,
    medium: 2,
    hard: 1,
  },
  levelRewards: {
    normal: 5,
    milestone: 15,
  },
  gold: {
    intervalMinutes: 120,
    helmet: 1,
    boots: 1,
    legs: 2,
    armor: 3,
    fullSetBonus: 1,
  },
  chestOverflow: {
    perReward: {
      small: 12,
      medium: 17,
      big: 33,
    },
    maximumPerOpening: {
      small: 12,
      medium: 35,
      big: 100,
    },
  },
  wheelOverflow: {
    common: 10,
    rare: 20,
    epic: 40,
    legendary: 80,
  },
} as const;
