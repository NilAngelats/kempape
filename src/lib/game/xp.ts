import { GAME_CONSTANTS } from "@/lib/game/config";

/** Total XP at the start of levels 1..40. Mirrored by migration 0002. */
export const LEVEL_XP_THRESHOLDS = [
  0, 100, 210, 330, 460, 610, 770, 950, 1140, 1350,
  1590, 1850, 2140, 2450, 2800, 3180, 3600, 4060, 4570, 5130,
  5740, 6410, 7150, 7960, 8860, 9840, 10920, 12110, 13420, 14860,
  16450, 18190, 20110, 22220, 24540, 27090, 29900, 32990, 36390, 40130,
] as const;

export const BASE_LEVEL_XP = 100;
export const XP_GROWTH_RATE = 1.1;
export const MAX_LEVEL_THRESHOLD = LEVEL_XP_THRESHOLDS[39];
export const MAX_LEVEL_RANKING_XP_BASIS = 4110;

function integer(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError("Value must be finite");
  return Math.floor(value);
}

export function clampTotalXp(totalXp: number): number {
  return Math.min(MAX_LEVEL_THRESHOLD, Math.max(0, integer(totalXp)));
}

export const normalizeTotalXpAfterGain = clampTotalXp;

export function getTotalXpRequiredForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > GAME_CONSTANTS.maxLevel) throw new RangeError("Level must be between 1 and 40");
  return LEVEL_XP_THRESHOLDS[level - 1];
}

export const totalXpRequiredToReachLevel = getTotalXpRequiredForLevel;

export function getXpNeededForNextLevel(level: number): number | null {
  if (!Number.isInteger(level) || level < 1 || level > GAME_CONSTANTS.maxLevel) throw new RangeError("Level must be between 1 and 40");
  return level === GAME_CONSTANTS.maxLevel ? null : LEVEL_XP_THRESHOLDS[level] - LEVEL_XP_THRESHOLDS[level - 1];
}

export const xpNeededForNextLevel = getXpNeededForNextLevel;
export const xpRewardBasisForLevel = getXpNeededForNextLevel;

export function getLevelFromTotalXp(totalXp: number): number {
  const xp = clampTotalXp(totalXp);
  let low = 0, high = LEVEL_XP_THRESHOLDS.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (LEVEL_XP_THRESHOLDS[middle] <= xp) low = middle + 1;
    else high = middle - 1;
  }
  return high + 1;
}

export function getXpIntoCurrentLevel(totalXp: number): number {
  const xp = clampTotalXp(totalXp);
  const level = getLevelFromTotalXp(xp);
  return level === 40 ? 0 : xp - getTotalXpRequiredForLevel(level);
}

export type XpProgress = { level: number; xpIntoCurrentLevel: number; xpNeededForNextLevel: number | null; percentage: number; isMaxLevel: boolean };
export function getXpProgress(totalXp: number): XpProgress {
  const level = getLevelFromTotalXp(totalXp);
  const needed = getXpNeededForNextLevel(level);
  const into = getXpIntoCurrentLevel(totalXp);
  return { level, xpIntoCurrentLevel: into, xpNeededForNextLevel: needed, percentage: needed === null ? 100 : Math.min(100, (into / needed) * 100), isMaxLevel: level === 40 };
}

export function getLevelBandMultiplier(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 40) throw new RangeError("Level must be between 1 and 40");
  if (level <= 10) return 1;
  if (level <= 20) return 0.8;
  if (level <= 30) return 0.65;
  return 0.5;
}

export const XP_REWARD_PERCENTAGES = { commonAction: .15, rareAction: .35, epicAction: .6, legendaryAction: .9, extremeChallenge: 1.5, easyQuest: .8, mediumQuest: 1.4, hardQuest: 2.3 } as const;
export function calculatePercentageXpReward(level: number, percentage: number): number {
  if (!Number.isFinite(percentage) || percentage < 0) throw new RangeError("Percentage must be non-negative");
  const needed = getXpNeededForNextLevel(level);
  return needed === null ? 0 : Math.ceil(needed * percentage * getLevelBandMultiplier(level));
}

export function getMaxHpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 40) throw new RangeError("Level must be between 1 and 40");
  return GAME_CONSTANTS.baseMaxHp + (level - 1) * GAME_CONSTANTS.hpPerLevel;
}

export function getLevelDamageMultiplier(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 40) throw new RangeError("Level must be between 1 and 40");
  return 1 + (level - 1) * .04;
}
export function scaleBaseDamageByLevel(baseDamage: number, level: number): number {
  if (!Number.isInteger(baseDamage) || baseDamage < 0) throw new RangeError("Base damage must be a non-negative integer");
  return Math.ceil(baseDamage * getLevelDamageMultiplier(level));
}

export function getDeathXpPenaltyRate(level: number): number {
  if (level < 1 || level > 40) throw new RangeError("Level must be between 1 and 40");
  if (level <= 10) return .05;
  if (level <= 20) return .06;
  if (level <= 30) return .07;
  return .08;
}
export const getDeathPenaltyRate = getDeathXpPenaltyRate;
export function calculateDeathXpLoss(totalXp: number, level: number): number { return Math.ceil(clampTotalXp(totalXp) * getDeathXpPenaltyRate(level)); }
