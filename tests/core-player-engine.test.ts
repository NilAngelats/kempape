import {describe,expect,it} from "vitest";
import {LEVEL_XP_THRESHOLDS,MAX_LEVEL_THRESHOLD,calculateDeathXpLoss,calculatePercentageXpReward,clampTotalXp,getDeathXpPenaltyRate,getLevelBandMultiplier,getLevelDamageMultiplier,getLevelFromTotalXp,getMaxHpForLevel,getTotalXpRequiredForLevel,getXpIntoCurrentLevel,getXpNeededForNextLevel,getXpProgress,scaleBaseDamageByLevel} from "@/lib/game/xp";
import {applyXpTransition,calculateClampedHealing,fullHealPlayer,getLevelCoinReward,getMilestoneChestCredits,healPlayer} from "@/lib/game/player-engine";

describe("canonical XP curve",()=>{
  it("contains every exact threshold and resolves its level",()=>{expect(LEVEL_XP_THRESHOLDS).toHaveLength(40);LEVEL_XP_THRESHOLDS.forEach((xp,index)=>{expect(getTotalXpRequiredForLevel(index+1)).toBe(xp);expect(getLevelFromTotalXp(xp)).toBe(index+1);if(index>0)expect(getLevelFromTotalXp(xp-1)).toBe(index);});});
  it("clamps both ends and has no Level 41",()=>{expect(clampTotalXp(-4)).toBe(0);expect(clampTotalXp(99999)).toBe(MAX_LEVEL_THRESHOLD);expect(getLevelFromTotalXp(99999)).toBe(40);expect(getXpNeededForNextLevel(40)).toBeNull();expect(getXpProgress(40130)).toMatchObject({percentage:100,isMaxLevel:true,xpIntoCurrentLevel:0});});
  it("reports progress within levels",()=>{expect(getXpIntoCurrentLevel(150)).toBe(50);expect(getXpNeededForNextLevel(1)).toBe(100);});
  it("uses band boundaries and ceiling rewards",()=>{expect([10,11,20,21,30,31].map(getLevelBandMultiplier)).toEqual([1,.8,.8,.65,.65,.5]);expect(calculatePercentageXpReward(1,.15)).toBe(15);expect(calculatePercentageXpReward(11,.15)).toBe(32);expect(calculatePercentageXpReward(40,1.5)).toBe(0);});
});

describe("HP, damage and death primitives",()=>{
  it("derives representative max HP",()=>{expect([1,10,20,30,40].map(getMaxHpForLevel)).toEqual([100,145,195,245,295]);});
  it("heals and caps",()=>{expect(calculateClampedHealing(90,100,20)).toBe(10);expect(healPlayer(90,100,20)).toEqual({currentHp:100,hpRestored:10});expect(fullHealPlayer(20,100)).toEqual({currentHp:100,hpRestored:80});expect(()=>healPlayer(90,100,-1)).toThrow();});
  it("applies level-up HP and level-down clamp",()=>{expect(applyXpTransition(330,50,440)).toMatchObject({newLevel:7,currentHp:65,levelsGained:3});expect(applyXpTransition(460,120,-200)).toMatchObject({newLevel:3,maxHp:110,currentHp:110,levelsLost:2});});
  it("scales damage and death loss canonically",()=>{expect([1,10,20,30,40].map(getLevelDamageMultiplier)).toEqual([1,1.3599999999999999,1.76,2.16,2.56]);expect(scaleBaseDamageByLevel(100,10)).toBe(136);expect([10,11,21,31].map(getDeathXpPenaltyRate)).toEqual([.05,.06,.07,.08]);expect(calculateDeathXpLoss(101,1)).toBe(6);});
});

describe("one-time reward definitions",()=>{
  it("uses 5 normally and 15 total at milestones",()=>{expect(getLevelCoinReward(2)).toBe(5);expect(getLevelCoinReward(5)).toBe(15);expect(getLevelCoinReward(1)).toBe(0);});
  it("matches every milestone credit mapping",()=>{expect([5,10,15,20,25,30,35,40].map(getMilestoneChestCredits)).toEqual([{small:1,medium:0,big:0},{small:0,medium:1,big:0},{small:2,medium:0,big:0},{small:0,medium:0,big:1},{small:1,medium:1,big:0},{small:0,medium:2,big:0},{small:0,medium:1,big:1},{small:0,medium:0,big:2}]);});
});
