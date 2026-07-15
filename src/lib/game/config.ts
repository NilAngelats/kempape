export const FESTIVAL_CONFIG = {
  id: "kempape-2026",
  name: "Kempape 2026",
  timeZone: "Europe/Berlin",
  startsAt: "2026-07-16T11:30:00+02:00",
  endsAt: "2026-07-20T03:00:00+02:00",
  chaosResolutionEndsAt: "2026-07-20T03:15:00+02:00",

  cycleBoundaries: [
    {
      key: "cycle-1",
      startsAt: "2026-07-16T11:30:00+02:00",
      endsAt: "2026-07-17T00:00:00+02:00",
    },
    {
      key: "cycle-2",
      startsAt: "2026-07-17T00:00:00+02:00",
      endsAt: "2026-07-18T00:00:00+02:00",
    },
    {
      key: "cycle-3",
      startsAt: "2026-07-18T00:00:00+02:00",
      endsAt: "2026-07-19T00:00:00+02:00",
    },
    {
      key: "cycle-4",
      startsAt: "2026-07-19T00:00:00+02:00",
      endsAt: "2026-07-20T03:00:00+02:00",
    },
  ],

  finalMidnightAt: "2026-07-20T00:00:00+02:00",
  finalMidnightRules: {
    healNonHospitalizedPlayers: true,
    createNewDailyQuestCycle: false,
    grantDailyWheelSpin: false,
    resetPhoenix: false,
    resetDailyActionLimits: false,
    resetExtremeChallenge: false,
  },

  startingPlayerState: {
    level: 1,
    totalXp: 0,
    currentHp: 100,
    coins: 50,
    pendingFortuneSpins: 0,
    freeChestCredits: {
      small: 0,
      medium: 0,
      big: 0,
    },
  },

  maxPlayers: 6,

  xpAfterMaxLevel: "cap" as const,
} as const;

export const GAME_CONSTANTS = {
  maxLevel: 40,
  baseMaxHp: 100,
  hpPerLevel: 5,
  equipmentCooldownMinutes: 15,
  actionSubmissionExpiryMinutes: 120,
  hospitalBaseMinutes: 60,
  hospitalExitHpRate: 0.75,
  dischargePillReductionMinutes: 20,
  maxConsumableQuantity: 10,
  maxChaosCardQuantity: 10,
} as const;
