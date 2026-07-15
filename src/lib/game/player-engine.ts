import { getLevelFromTotalXp, getMaxHpForLevel } from "@/lib/game/xp";

export type ChestCredits = { small: number; medium: number; big: number };
export const EMPTY_CHEST_CREDITS: ChestCredits = { small: 0, medium: 0, big: 0 };
export const MILESTONE_CHEST_CREDITS: Readonly<Record<number, ChestCredits>> = {
  5:{small:1,medium:0,big:0},10:{small:0,medium:1,big:0},15:{small:2,medium:0,big:0},20:{small:0,medium:0,big:1},
  25:{small:1,medium:1,big:0},30:{small:0,medium:2,big:0},35:{small:0,medium:1,big:1},40:{small:0,medium:0,big:2},
};
export function getLevelCoinReward(level:number):number { if(!Number.isInteger(level)||level<2||level>40) return 0; return level%5===0?15:5; }
export function getMilestoneChestCredits(level:number):ChestCredits { return {...(MILESTONE_CHEST_CREDITS[level]??EMPTY_CHEST_CREDITS)}; }
export function calculateClampedHealing(currentHp:number,maxHp:number,healing:number):number {
  if (![currentHp,maxHp,healing].every(Number.isInteger) || currentHp<0 || maxHp<0 || currentHp>maxHp || healing<0) throw new RangeError("HP and healing must be valid integers");
  return Math.min(healing,maxHp-currentHp);
}
export function healPlayer(currentHp:number,maxHp:number,healing:number){const restored=calculateClampedHealing(currentHp,maxHp,healing);return {currentHp:currentHp+restored,hpRestored:restored};}
export function fullHealPlayer(currentHp:number,maxHp:number){return healPlayer(currentHp,maxHp,maxHp-currentHp);}
export function applyXpTransition(totalXp:number,currentHp:number,xpDelta:number){
  if(!Number.isInteger(xpDelta))throw new RangeError("XP delta must be an integer");
  const previousLevel=getLevelFromTotalXp(totalXp),newTotalXp=Math.max(0,Math.min(40130,totalXp+xpDelta)),newLevel=getLevelFromTotalXp(newTotalXp),maxHp=getMaxHpForLevel(newLevel);
  return {newTotalXp,newLevel,maxHp,currentHp:Math.min(maxHp,currentHp+Math.max(0,newLevel-previousLevel)*5),levelsGained:Math.max(0,newLevel-previousLevel),levelsLost:Math.max(0,previousLevel-newLevel)};
}
