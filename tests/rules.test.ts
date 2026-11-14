import { describe, expect, it } from "vitest";
import { FESTIVAL_CONFIG } from "@/lib/game/config";
import { getFestivalCycleKey } from "@/lib/game/time";
import {
  MAX_LEVEL_RANKING_XP_BASIS,
  MAX_LEVEL_THRESHOLD,
  totalXpRequiredToReachLevel,
  xpNeededForNextLevel,
  xpRewardBasisForLevel,
  normalizeTotalXpAfterGain,
} from "@/lib/game/xp";
import { ACTIONS } from "@/lib/game/actions";
import { EQUIPMENT_DEFINITIONS } from "@/lib/game/items";
import { ECONOMY_CONFIG } from "@/lib/game/economy";
import { CHEST_CONFIG } from "@/lib/game/chests";
import { DAILY_WHEEL_CONFIG } from "@/lib/game/wheel";
import {
  HOSPITAL_SET_REDUCTIONS,
} from "@/lib/game/equipment-effects";
import { DAILY_QUESTS } from "@/lib/game/quests";

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

describe("festival timing", () => {
  it("has exactly four gameplay cycles", () => {
    expect(FESTIVAL_CONFIG.cycleBoundaries).toHaveLength(4);
  });

  it("keeps July 20 at 00:00 inside cycle 4", () => {
    expect(
      getFestivalCycleKey(new Date("2026-07-20T00:00:00+02:00")),
    ).toBe("cycle-4");
  });

  it("ends gameplay exactly at 03:00", () => {
    expect(
      getFestivalCycleKey(new Date("2026-07-20T03:00:00+02:00")),
    ).toBeNull();
  });
});

describe("XP curve", () => {
  it("matches the approved thresholds", () => {
    expect(xpNeededForNextLevel(1)).toBe(100);
    expect(xpNeededForNextLevel(10)).toBe(240);
    expect(totalXpRequiredToReachLevel(20)).toBe(5130);
    expect(totalXpRequiredToReachLevel(35)).toBe(24540);
    expect(MAX_LEVEL_THRESHOLD).toBe(40130);
  });

  it("caps rewards and XP at Level 40", () => {
    expect(MAX_LEVEL_RANKING_XP_BASIS).toBe(4110);
    expect(xpRewardBasisForLevel(40)).toBeNull();
    expect(normalizeTotalXpAfterGain(50_000)).toBe(40_130);
  });
});

describe("definition integrity", () => {
  it("contains 22 unique actions", () => {
    expect(ACTIONS).toHaveLength(22);
    expect(new Set(ACTIONS.map((action) => action.id)).size).toBe(22);
  });

  it("contains 64 unique equipment definitions", () => {
    expect(EQUIPMENT_DEFINITIONS).toHaveLength(64);
    expect(
      new Set(EQUIPMENT_DEFINITIONS.map((item) => item.id)).size,
    ).toBe(64);
  });
});

describe("economy", () => {
  it("generates 8 coins per completed two-hour interval with the full Gold Set", () => {
    const gold = ECONOMY_CONFIG.gold;
    expect(
      gold.helmet
        + gold.boots
        + gold.legs
        + gold.armor
        + gold.fullSetBonus,
    ).toBe(8);
  });

  it("grants 200 Daily Quest coins per cycle", () => {
    expect(
      DAILY_QUESTS.reduce(
        (total, quest) => total + quest.coinReward,
        0,
      ),
    ).toBe(200);
  });

  it("uses the approved overflow values", () => {
    expect(ECONOMY_CONFIG.chestOverflow.perReward).toEqual({
      small: 12,
      medium: 17,
      big: 33,
    });
  });
});

describe("probabilities", () => {
  it("wheel weights sum to 100", () => {
    expect(
      sum(DAILY_WHEEL_CONFIG.slices.map((slice) => slice.weight)),
    ).toBe(100);
  });

  it("all chest probability groups sum correctly", () => {
    expect(sum(Object.values(CHEST_CONFIG.small.premium.rarityWeights))).toBe(100);
    expect(sum(Object.values(CHEST_CONFIG.medium.regular.rewardTypeWeights))).toBe(100);
    expect(sum(Object.values(CHEST_CONFIG.medium.regular.consumableRarityWeights))).toBe(100);
    expect(sum(Object.values(CHEST_CONFIG.medium.premium.categoryWeights))).toBe(100);
    expect(sum(Object.values(CHEST_CONFIG.medium.premium.rarityWeights))).toBe(100);
    expect(sum(Object.values(CHEST_CONFIG.big.regular.rewardTypeWeights))).toBe(100);
    expect(sum(Object.values(CHEST_CONFIG.big.regular.consumableRarityWeights))).toBe(100);
    expect(sum(Object.values(CHEST_CONFIG.big.premium.categoryWeights))).toBe(100);
    expect(sum(Object.values(CHEST_CONFIG.big.premium.rarityWeights))).toBe(100);
  });
});

describe("Hospital balance", () => {
  it("reduces a 60-minute stay to 30 minutes with the full set", () => {
    const reduction = sum(Object.values(HOSPITAL_SET_REDUCTIONS));
    expect(reduction).toBe(30);
    expect(60 - reduction).toBe(30);
  });

  it("allows a 10-minute best case with one Discharge Pill", () => {
    const reduction = sum(Object.values(HOSPITAL_SET_REDUCTIONS));
    expect(60 - reduction - 20).toBe(10);
  });
});
