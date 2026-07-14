import { FESTIVAL_CONFIG, GAME_CONSTANTS } from "@/lib/game/config";

export const BASE_LEVEL_XP = 100;
export const XP_GROWTH_RATE = 1.1;

function roundToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function xpNeededForNextLevel(level: number): number | null {
  if (level >= GAME_CONSTANTS.maxLevel) return null;

  return roundToNearestTen(
    BASE_LEVEL_XP * Math.pow(XP_GROWTH_RATE, level - 1),
  );
}

/**
 * Virtual reward basis used only when XP continues for ranking at Level 40.
 * It follows the same curve formula for Level 40 even though Level 41 does
 * not exist. This equals 4,110 XP with the approved curve.
 */
export const MAX_LEVEL_RANKING_XP_BASIS = roundToNearestTen(
  BASE_LEVEL_XP * Math.pow(XP_GROWTH_RATE, GAME_CONSTANTS.maxLevel - 1),
);

export function xpRewardBasisForLevel(level: number): number | null {
  const normalRequirement = xpNeededForNextLevel(level);
  if (normalRequirement !== null) return normalRequirement;

  if (FESTIVAL_CONFIG.xpAfterMaxLevel === "continue_for_ranking") {
    return MAX_LEVEL_RANKING_XP_BASIS;
  }

  return null;
}

export function totalXpRequiredToReachLevel(level: number): number {
  if (level <= 1) return 0;

  let total = 0;
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    total += xpNeededForNextLevel(currentLevel) ?? 0;
  }
  return total;
}

export const MAX_LEVEL_THRESHOLD =
  totalXpRequiredToReachLevel(GAME_CONSTANTS.maxLevel);

export function getLevelFromTotalXp(totalXp: number): number {
  const safeXp = Math.max(0, Math.floor(totalXp));

  for (let level = GAME_CONSTANTS.maxLevel; level >= 1; level -= 1) {
    if (safeXp >= totalXpRequiredToReachLevel(level)) {
      return level;
    }
  }

  return 1;
}

export function getMaxHpForLevel(level: number): number {
  return (
    GAME_CONSTANTS.baseMaxHp
    + (Math.max(level, 1) - 1) * GAME_CONSTANTS.hpPerLevel
  );
}

export function normalizeTotalXpAfterGain(totalXp: number): number {
  const safeXp = Math.max(0, Math.floor(totalXp));

  if (FESTIVAL_CONFIG.xpAfterMaxLevel === "cap") {
    return Math.min(safeXp, MAX_LEVEL_THRESHOLD);
  }

  return safeXp;
}

export function getDeathPenaltyRate(level: number): number {
  if (level <= 10) return 0.05;
  if (level <= 20) return 0.06;
  if (level <= 30) return 0.07;
  return 0.08;
}

export function calculateDeathXpLoss(
  currentTotalXp: number,
  currentLevel: number,
): number {
  return Math.ceil(
    Math.max(0, currentTotalXp) * getDeathPenaltyRate(currentLevel),
  );
}
