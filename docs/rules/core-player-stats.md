# Kempape — Core Player Stats Handoff

## Purpose

This document defines the core player stats for Kempape.

The goal is to keep the player system extremely simple. Kempape should not have complex RPG stats like Strength, Defense, Dexterity, Intelligence, Attack Power, or Armor Rating.

The player’s power should mainly come from:

1. Current level.
2. Equipment effects.
3. Consumables.
4. Chaos Cards.
5. Player activity.

For the core MVP, the only natural combat scaling comes from the player’s level.

---

## Core Player Stats

| Stat              | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| HP                | Determines if the player is alive or sent to the Festival Hospital |
| XP                | Determines the player’s level                                      |
| Level             | Main progression stat, calculated from total XP                    |
| Coins             | Currency used to open chests                                       |
| Actions completed | Tracks player activity                                             |
| Actions validated | Tracks how often the player validates others                       |
| Deaths            | Tracks how many times the player has died                          |
| Hospital status   | Determines whether the player can currently perform actions        |

---

## What We Do NOT Have

The game should not include these stats:

| Removed stat       | Reason                                       |
| ------------------ | -------------------------------------------- |
| Strength           | Too complex                                  |
| Defense            | Too complex for MVP                          |
| Dexterity          | Not needed                                   |
| Intelligence       | Not needed                                   |
| Attack Power       | Damage already scales with level             |
| Armor Rating       | Equipment effects will be handled separately |
| Manual stat points | Too much complexity                          |

The game should be easy to understand:

```text
Higher level = more HP and stronger actions.
```

---

## Integer-Only Rule

All final game numbers must be whole numbers.

There should be no decimals in:

* Current HP.
* Max HP.
* Damage dealt.
* Damage received.
* XP rewards.
* XP penalties.
* Coin rewards.
* Chest quantities.

For damage calculations, if the result has decimals, round it up to the next whole number.

Example:

```text
46.72 damage becomes 47 damage.
47 damage stays 47 damage.
```

Recommended implementation:

```ts
Math.ceil(value)
```

This makes all final player-facing values clean and easy to understand.

---

## HP

HP is defined by the Level-Up HP system.

| Rule                  |                          Value |
| --------------------- | -----------------------------: |
| Level 1 Max HP        |                            100 |
| HP gained per level   |                      +5 Max HP |
| Level 40 Max HP       |                            295 |

Formula:

```text
Max HP = 100 + ((currentLevel - 1) × 5)
```

When a player levels up:

```text
+5 Max HP
+5 Current HP
```

The player is not fully healed.

When a player levels down:
```text
Max HP is recalculated from the new level.
Current HP is clamped if it is above the new Max HP.
```

HP values are always integers.

---

## XP and Level

XP is the source of truth.

The player’s level should always be calculated from total XP.

```text
Total XP → determines Level
Level → determines Max HP and damage scaling
```

The level itself may be stored for performance, but it should always be recalculated after XP changes.

XP values and XP rewards should always be rounded to whole numbers.

---

## Coins

Coins are part of the core player state because they are needed for chests.

Coins do not affect combat directly.

Coins are gained from:

* Validated actions.
* Daily Quests.
* One-time level-up rewards.
* Gold Set
* Daily Wheel
* Chest coin rewards
* Overflow compensation

Coins are spent on:

* Opening chests.

Coin values must always be whole numbers.

---

## Action Tracking

The game should track basic action stats for each player.

Recommended tracked values:

| Field              | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `actionsCompleted` | Total number of actions completed by the player         |
| `actionsValidated` | Total number of actions the player validated for others |
| `actionsByType`    | Number of times each action type was completed          |
| `lastActionAt`     | Used for action cooldowns                               |
| `lastValidatorId`  | Used to prevent the same validator twice in a row       |
| `damageDealt`      | Total HP damage dealt to others                         |
| `damageTaken`      | Total HP damage received                                |
| `deaths`           | Number of times the player has died                     |

These values are useful for:

* Ranking.
* Activity history.
* Balancing.
* Admin/debug tools.
* Festival statistics.

---

## Damage Scaling by Level

Players do not have a separate damage stat.

Damage is calculated from:

```text
Action base damage × level damage multiplier
```

Recommended formula:

```text
Final damage = ceil(baseDamage × (1 + ((attackerLevel - 1) × 0.04)))
```

Where:

| Value           | Meaning                                            |
| --------------- | -------------------------------------------------- |
| `baseDamage`    | Damage defined by the Chaos Card         |
| `attackerLevel` | Level of the player causing the damage             |
| `0.04`          | 4% extra damage per level                          |
| `ceil`          | Rounds decimal results up to the next whole number |

---

## Damage Multiplier Examples

| Player level | Damage multiplier |
| -----------: | ----------------: |
|            1 |             ×1.00 |
|            5 |             ×1.16 |
|           10 |             ×1.36 |
|           20 |             ×1.76 |
|           30 |             ×2.16 |
|           40 |             ×2.56 |

At level 40, the player deals 2.56× the damage of a level 1 player.

This makes high-level players clearly stronger, but they can still die because level does not reduce incoming damage.

---

## Damage Example

If an action has `20 base damage`:

| Attacker level | Formula         | Final damage |
| -------------: | --------------- | -----------: |
|              1 | ceil(20 × 1.00) |           20 |
|              5 | ceil(20 × 1.16) |           24 |
|             10 | ceil(20 × 1.36) |           28 |
|             20 | ceil(20 × 1.76) |           36 |
|             30 | ceil(20 × 2.16) |           44 |
|             40 | ceil(20 × 2.56) |           52 |

This keeps the system easy to understand.

A level 10 player hits harder than a level 5 player, and a level 40 player feels powerful, but high-level players are still vulnerable.

---

## Important Combat Rule

Level should increase:

* Max HP.
* Outgoing damage.

Level should NOT automatically reduce incoming damage.

This is important.

If level increased HP, outgoing damage, and defense at the same time, high-level players would become too difficult to kill.

So the simple rule is:

```text
Higher level = more HP and more damage.
Higher level does not naturally reduce damage received.
```

Any defensive effect should come from equipment, consumables, or special effects, not from the core level system.

---

## Gameplay Status

Use an authoritative gameplay status for the active game run:

```ts
type PlayerGameplayStatus =
  | "active"
  | "chaos_locked"
  | "hospitalized"
  | "disabled";
```

A player is targetable by a new Chaos Card only when:

```text
status = active
and no unresolved incoming Chaos attack exists
```

The player's account identity is global.

HP, XP, coins, status, and all gameplay counters are scoped to `gameRunId`.

## Recommended Player Data Shape

```ts
type Player = {
  id: string;
  gameRunId: string;
  characterId: string;

  gameplayStatus: PlayerGameplayStatus;
  activeChaosAttackId?: string;
  chaosLockedAt?: string;

  totalXp: number;
  currentLevel: number;

  currentHp: number;
  coins: number;

  claimedLevelRewards: number[];

  actionsCompleted: number;
  actionsValidated: number;

  actionsByType: Record<string, number>;
  lastActionAt: Record<string, string>;

  lastValidatorId?: string;

  damageDealt: number;
  damageTaken: number;

  deaths: number;
  hospitalUntil?: string;
};
```

`currentLevel` can be stored for convenience, but the source of truth should remain `totalXp`.

`maxHp` does not need to be stored permanently because it can be calculated from level:

```ts
const BASE_MAX_HP = 100;
const HP_PER_LEVEL = 5;

function getMaxHpForLevel(level: number): number {
  return BASE_MAX_HP + ((level - 1) * HP_PER_LEVEL);
}
```

Damage multiplier:

```ts
const DAMAGE_INCREASE_PER_LEVEL = 0.04;

function getDamageMultiplier(level: number): number {
  return 1 + ((level - 1) * DAMAGE_INCREASE_PER_LEVEL);
}
```

Final damage:

```ts
function calculateDamage(baseDamage: number, attackerLevel: number): number {
  return Math.ceil(baseDamage * getDamageMultiplier(attackerLevel));
}
```
