export const HOSPITAL_SET_REDUCTIONS = {
  helmet: 4,
  boots: 4,
  legs: 8,
  armor: 12,
  fullSetBonus: 2,
} as const;

export const REGENERATION_RULES = {
  intervalMinutes: 60,
  pauseDuringHospital: true,
  /**
   * A pause preserves unfinished progress and resumes it after discharge.
   * Unequipping still discards unfinished progress.
   */
  resumeIncompleteIntervalAfterHospital: true,
} as const;

export const PHOENIX_RULES = {
  helmetChance: 0.10,
  bootsChance: 0.10,
  legsChance: 0.25,
  armorChance: 0.50,
  fullSetBonus: 0.05,
  successfulSavesPerFestivalCycle: 1,
} as const;
