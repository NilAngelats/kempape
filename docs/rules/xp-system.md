# Kempape — Level & XP System Handoff

## Purpose

This document defines the first version of the **Level & XP system** for Kempape.

The goal is to create a progression system that feels fast and rewarding during the first levels, but gradually becomes more difficult as players approach the maximum level.

Kempape is designed for a 4-day festival. The maximum level is 40, which means the ideal rhythm is roughly 10 levels per day, but not in a perfectly linear way.

Early levels should be easy and exciting. Late levels should require more effort, but level 40 must still be reachable by active players before the end of the festival.

---

## Core Rules

| Rule                |            Value |
| ------------------- | ---------------: |
| Starting level      |                1 |
| Maximum level       |               40 |
| Starting XP         |                0 |
| XP after level 40   | Continues for ranking |
| Level down possible |              Yes |
| XP loss on death    |              Yes |

All players start at level 1 with 0 XP.

The player’s level is always calculated from their total XP.

If a player loses XP and their remaining XP goes below the threshold required for their current level, their level is recalculated and they can level down.

## Level 40 Ranking XP

Level 40 is the maximum displayed level.

After reaching Level 40:

* `currentLevel` remains 40.
* Max HP remains 295.
* No additional level-up coins are granted.
* No additional milestone Chests are granted.
* No additional Max HP is granted.
* Total XP continues increasing for ranking.
* Actions and Daily Quests continue granting XP.
* XP consumables cannot be used at Level 40.
* Death XP penalties still apply to current total XP.
* A death penalty may reduce total XP below the Level 40 threshold and cause a level down.

For percentage-based XP rewards at Level 40, use the virtual next-level requirement:

```text
virtualLevel40XpRequirement = 4,110 XP
```

This is the rounded result of the existing XP curve for a theoretical Level 40 to Level 41 step.

Apply the Level 31–40 band multiplier:

```text
0.50
```

Total XP is therefore uncapped even though displayed level, HP progression, and level rewards are capped.

---

## XP Curve

Each level requires more XP than the previous one.

Recommended formula:

```text
XP needed for next level = 100 × 1.10^(current level - 1)
```

The result should be rounded to clean numbers. Round each level requirement to the nearest multiple of 10.

This curve keeps the progression smooth. It is not too aggressive, so level 40 remains achievable during the festival.

Example progression:

| Level | XP needed for next level | Total XP needed to reach this level |
| ----: | -----------------------: | ----------------------------------: |
|     1 |                      100 |                                   0 |
|     2 |                      110 |                                 100 |
|     5 |                      150 |                                 460 |
|    10 |                      240 |                               1,350 |
|    15 |                      380 |                               2,800 |
|    20 |                      610 |                               5,130 |
|    25 |                      980 |                               8,860 |
|    30 |                    1,590 |                              14,860 |
|    35 |                    2,550 |                              24,540 |
|    39 |                    3,740 |                              36,390 |
|    40 |                Max level |                              40,130 |

The exact numbers can be adjusted later during balance testing, but the structure should remain the same.

---

## Reward Philosophy

XP rewards should not be fixed numbers.

Avoid this type of system:

```text
Easy quest = 50 XP
Medium quest = 150 XP
Hard quest = 300 XP
```

Fixed rewards become useless in late levels.

Instead, XP rewards should be calculated as a percentage of the XP needed for the player’s next level.

Base formula:

```text
XP reward = XP needed for next level × reward percentage × level band multiplier
```

There is no day multiplier.

The game should not automatically give more XP on Day 2, Day 3, or Day 4. Difficulty should be based on the player’s current level band, not on the festival day.

---

## Level Band Multipliers

To make early levels faster and late levels harder, each level range has a multiplier.

| Level range | Intended feeling                         | Multiplier |
| ----------- | ---------------------------------------- | ---------: |
| Level 1–10  | Very fast progression / tutorial feeling |      ×1.00 |
| Level 11–20 | Still fast, but less explosive           |      ×0.80 |
| Level 21–30 | Mid-game progression slows down          |      ×0.65 |
| Level 31–40 | End-game, harder but reachable           |      ×0.50 |

This means the same action gives less level progress when the player is higher level.

Example:

A standard action has a base reward of 35% of the XP needed for the next level.

| Player level | Level band multiplier |       Final progress |
| -----------: | --------------------: | -------------------: |
|      Level 5 |                 ×1.00 |    35% of next level |
|     Level 15 |                 ×0.80 |    28% of next level |
|     Level 25 |                 ×0.65 | 22.75% of next level |
|     Level 35 |                 ×0.50 |  17.5% of next level |

This creates the desired progression curve:
early levels are quick, while levels 30–40 require more activity.

---

## XP Reward Percentages

Common: 15%
Rare: 35%
Epic: 60%
Legendary: 90%
Extreme Challenge: 150%

Easy Quest: 80%
Medium Quest: 140%
Hard Quest: 230%

Extreme Challenge is type legendary

type ActionTier =
  | "common"
  | "rare"
  | "epic"
  | "legendary";

---

## Expected Progression

The target progression should feel approximately like this:

| Player type        | Expected final level |
| ------------------ | -------------------: |
| Casual player      |          Level 30–35 |
| Active player      |          Level 35–38 |
| Very active player |             Level 40 |

Level 40 should be achievable, but not guaranteed.

The system should reward players who participate actively during the 4 days without making the progression impossible for normal players.

---

## Death XP Penalty

When a player reaches 0 HP and dies, they lose XP.

The penalty is based on the player's level immediately before death and is calculated from the player's current total XP.

| Player level | XP lost on death |
| -----------: | ---------------: |
| Level 1–10 | 5% of current total XP |
| Level 11–20 | 6% of current total XP |
| Level 21–30 | 7% of current total XP |
| Level 31–40 | 8% of current total XP |

Formula:

```text
xpLost = ceil(currentTotalXp × deathPenaltyRate)
```

Examples:

| Player state | Calculation | XP lost |
| ------------ | ----------: | ------: |
| Level 8, 1,173 XP | ceil(1,173 × 0.05) | 59 XP |
| Level 18, 4,200 XP | ceil(4,200 × 0.06) | 252 XP |
| Level 27, 11,000 XP | ceil(11,000 × 0.07) | 770 XP |
| Level 35, 25,000 XP | ceil(25,000 × 0.08) | 2,000 XP |

After subtracting XP:

```text
totalXp = max(totalXp - xpLost, 0)
```

Then recalculate the player's level from the remaining total XP.

This means a player can level down.

Death should be painful, especially at higher levels, but it should not destroy the player's entire progress.

The player keeps their equipment, inventory, coins, claimed level rewards, and other progress. Only XP is penalized.

---

## Level Recalculation Logic

The player’s level should never be stored as an independent source of truth.

Recommended approach:

```text
Player has total XP.
Level is calculated from total XP.
```

Whenever XP changes:

1. Add or subtract XP from the player’s total XP.
2. Clamp XP so it never goes below 0.
3. Recalculate the player’s level based on total XP thresholds.
4. Cap the displayed level at 40, but do not cap total XP.

Example:

```text
Player is level 20.
Player has 5,200 total XP.
The Level 11–20 death rate is 6%.

XP lost = ceil(5,200 × 0.06)
XP lost = 312

New total XP = 4,888.
The system recalculates the player's level.
Because 4,888 XP is below the Level 20 threshold,
the player drops to Level 19.
```

---

## Implementation Notes

Recommended constants:

```ts
const MAX_LEVEL = 40;
const BASE_LEVEL_XP = 100;
const XP_GROWTH_RATE = 1.10;

const DEATH_XP_PENALTY_BY_LEVEL = [
  { minLevel: 1, maxLevel: 10, penaltyRate: 0.05 },
  { minLevel: 11, maxLevel: 20, penaltyRate: 0.06 },
  { minLevel: 21, maxLevel: 30, penaltyRate: 0.07 },
  { minLevel: 31, maxLevel: 40, penaltyRate: 0.08 },
];
```

Recommended level band multipliers:

```ts
const LEVEL_BAND_MULTIPLIERS = [
  { minLevel: 1, maxLevel: 10, multiplier: 1.00 },
  { minLevel: 11, maxLevel: 20, multiplier: 0.80 },
  { minLevel: 21, maxLevel: 30, multiplier: 0.65 },
  { minLevel: 31, maxLevel: 40, multiplier: 0.50 },
];
```

Reward calculation:

```ts
xpReward =
  xpNeededForNextLevel(currentLevel)
  * rewardPercentage
  * levelBandMultiplier(currentLevel);
```

Death penalty calculation:

```ts
const deathPenaltyRate =
  getDeathPenaltyRate(currentLevel);

const xpLostOnDeath = Math.ceil(
  currentTotalXp * deathPenaltyRate
);

const newTotalXp = Math.max(
  currentTotalXp - xpLostOnDeath,
  0
);
```

Then recalculate the player's level from `newTotalXp`.


# Kempape — Level-Up HP & Reward Logic

## Purpose

This section extends the Level & XP system with level-based HP growth and level-up rewards.

Players should become stronger when they level up, but they should remain vulnerable. Leveling up should feel rewarding, but players should not be able to farm rewards by repeatedly leveling down and leveling up again.

---

## Max HP by Level

All players start with:

| Stat                  |                            Value |
| --------------------- | -------------------------------: |
| Level 1 Max HP        |                              100 |
| HP gained per level   |                        +5 Max HP |
| Level 40 Max HP       |                              295 |

Formula:

```text
Max HP = 100 + ((currentLevel - 1) × 5)
```

Examples:

| Level | Max HP |
| ----: | -----: |
|     1 |    100 |
|     5 |    120 |
|    10 |    145 |
|    20 |    195 |
|    30 |    245 |
|    40 |    295 |

---

## HP on Level Up

When a player levels up:

```text
Max HP increases by +5.
Current HP increases by +5.
The player is not fully healed.
```

Example:

| State           | Level | Max HP | Current HP |
| --------------- | ----: | -----: | ---------: |
| Before level up |     4 |    115 |         40 |
| After level up  |     5 |    120 |         45 |

This gives the player a small survival boost without making level-ups a full heal exploit.

---

## HP on Level Down

If a player loses XP and levels down, their Max HP must decrease accordingly.

Example:

| State            | Level | Max HP |
| ---------------- | ----: | -----: |
| Before death     |     5 |    120 |
| After level down |     4 |    115 |

The player loses the +5 Max HP from the lost level.

If the current HP is higher than the new Max HP, current HP should be clamped to the new Max HP.

Example:

```text
Player is level 5.
Max HP = 120.
Current HP = 118.

Player levels down to level 4.
New Max HP = 115.

Current HP becomes 115.
```

If current HP is already below the new Max HP, current HP does not need to change.

Example:

```text
Player is level 5.
Max HP = 120.
Current HP = 40.

Player levels down to level 4.
New Max HP = 115.

Current HP remains 40.
```

---

## Level-Up Rewards

Every time a player reaches a new level for the first time, they receive a one-time reward.

Basic level-up reward:

| Trigger                                    | Reward                                 |
| ------------------------------------------ | -------------------------------------- |
| Every new level reached for the first time | +5 Max HP, +5 Current HP, coins        |
| Every 5 levels reached for the first time  | +5 Max HP, +5 Current HP, coins, chest |

Important distinction:

| Reward type         | Can be received again after level down/up? |
| ------------------- | ------------------------------------------ |
| HP increase         | Yes, because HP depends on current level   |
| Small heal of +5 HP | Yes, every time the player levels up       |
| Coins               | No, only once per level                    |
| Chest               | No, only once per milestone level          |

---

## Anti-Farming Rule

Players can level down and later level up again.

However, coin and chest rewards must only be granted the first time the player reaches each level.

Example:

```text
Player reaches level 5 for the first time.
Player receives:
- +5 Max HP
- +5 Current HP
- Level 5 coins
- Level 5 milestone chest

Player dies and drops to level 4.

Later, player reaches level 5 again.
Player receives:
- +5 Max HP
- +5 Current HP

Player does NOT receive:
- Level 5 coins again
- Level 5 chest again
```

This prevents farming rewards by repeatedly dying and leveling back up.

---

## Implementation Recommendation

The player should store a list or set of levels whose rewards have already been claimed.

Example player data:

```ts
type Player = {
  totalXp: number;
  currentLevel: number;
  currentHp: number;
  claimedLevelRewards: number[];
};
```

Recommended behavior:

```text
claimedLevelRewards contains the levels where the player has already received coins/chests.
```

Example:

```ts
claimedLevelRewards = [2, 3, 4, 5, 6, 7, 8, 9, 10];
```

This means the player has already received the one-time rewards for levels 2 through 10.

If the player drops to level 9 and later reaches level 10 again, the system checks `claimedLevelRewards`, sees that level 10 is already claimed, and does not grant coins/chest again.

---

## Level-Up Processing Logic

Whenever XP changes:

1. Store the player’s previous level.
2. Add or subtract XP.
3. Recalculate the new level from total XP.
4. Compare previous level and new level.
5. If the player leveled up, apply HP increase and level-up healing.
6. For each newly reached level, check if the reward was already claimed.
7. If not claimed, grant coins/chest and mark that level as claimed.
8. If the player leveled down, recalculate Max HP and clamp Current HP if necessary.

---

## Multiple Level-Ups at Once

A player may gain enough XP to jump multiple levels at once.

Example:

```text
Player goes from level 4 to level 7.
```

The system should process levels 5, 6, and 7 individually.

The player receives:

```text
+5 Max HP for level 5
+5 Max HP for level 6
+5 Max HP for level 7

+5 Current HP for level 5
+5 Current HP for level 6
+5 Current HP for level 7
```

Total HP gain:

```text
+15 Max HP
+15 Current HP
```

Then the system checks rewards:

| Level | Reward check                                    |
| ----: | ----------------------------------------------- |
|     5 | If not claimed, grant coins and milestone chest |
|     6 | If not claimed, grant coins                     |
|     7 | If not claimed, grant coins                     |

---

## Milestone Chest Rewards

Every 5 levels, the player receives a chest or chests the first time they reach that level.

Milestone levels:

```text
5, 10, 15, 20, 25, 30, 35, 40
```

Example:

| Level reached for first time | Reward        |
| ---------------------------: | ------------- |
|                            2 | Coins         |
|                            3 | Coins         |
|                            4 | Coins         |
|                            5 | Coins + chest |
|                           10 | Coins + chest |
|                           15 | Coins + chest |
|                           20 | Coins + chest |
|                           25 | Coins + chest |
|                           30 | Coins + chest |
|                           35 | Coins + chest |
|                           40 | Coins + chest |

---

## Suggested Constants

```ts
const BASE_MAX_HP = 100;
const HP_PER_LEVEL = 5;
const LEVEL_REWARD_INTERVAL = 5;
```

Suggested helper:

```ts
function getMaxHpForLevel(level: number): number {
  return BASE_MAX_HP + ((level - 1) * HP_PER_LEVEL);
}
```

Suggested reward check:

```ts
function hasClaimedLevelReward(player: Player, level: number): boolean {
  return player.claimedLevelRewards.includes(level);
}
```

Suggested milestone check:

```ts
function isMilestoneLevel(level: number): boolean {
  return level % LEVEL_REWARD_INTERVAL === 0;
}
```

---

## Design Decisions Summary

| Topic                          | Decision                                           |
| ------------------------------ | -------------------------------------------------- |
| Level 1 Max HP                 | 100                                                |
| HP gained per level            | +5                                                 |
| Level 40 internal Max HP       | 295                                                |
| Full heal on level up          | No                                                 |
| Heal on level up               | +5 Current HP per level gained                     |
| Max HP loss on level down      | Yes                                                |
| Coins on level up              | Yes, once per level                                |
| Chest every 5 levels           | Yes, once per milestone                            |
| Reward farming allowed         | No                                                 |
| HP farming through re-leveling | Allowed naturally because HP follows current level |
| Required stored data           | `claimedLevelRewards`                              |

## Milestone Chest Rewards

Every 5 levels, the player receives one or more chests the first time they reach that milestone level.

Milestone chest rewards are one-time rewards. If a player levels down and later reaches the same milestone again, they do **not** receive the chest reward again.

| Level milestone | Chest reward                       |
| --------------: | ---------------------------------- |
|               5 | 1× Common Chest                    |
|              10 | 1× Rare Chest                      |
|              15 | 2× Common Chest                    |
|              20 | 1× Legendary Chest                 |
|              25 | 1× Rare Chest + 1× Common Chest    |
|              30 | 2× Rare Chest                      |
|              35 | 1× Legendary Chest + 1× Rare Chest |
|              40 | 2× Legendary Chest                 |

Implementation rule:

```text id="l8r51m"
Grant milestone chest rewards only if the milestone level has not already been claimed in claimedLevelRewards.
```

Suggested implementation map:

```ts id="8hfmvq"
const MILESTONE_CHEST_REWARDS = {
  5: [{ chestType: "common", quantity: 1 }],
  10: [{ chestType: "rare", quantity: 1 }],
  15: [{ chestType: "common", quantity: 2 }],
  20: [{ chestType: "legendary", quantity: 1 }],
  25: [
    { chestType: "rare", quantity: 1 },
    { chestType: "common", quantity: 1 },
  ],
  30: [{ chestType: "rare", quantity: 2 }],
  35: [
    { chestType: "legendary", quantity: 1 },
    { chestType: "rare", quantity: 1 },
  ],
  40: [{ chestType: "legendary", quantity: 2 }],
};
```
