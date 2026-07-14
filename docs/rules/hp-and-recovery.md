# Kempape — HP & Recovery Handoff

## Purpose

This document defines how players recover HP.

Keep this system simple. HP should be easy to understand, easy to balance, and should not create permanent HP increases except through leveling.

---

## Core HP Rules

| Rule                              | Decision                                            |
| --------------------------------- | --------------------------------------------------- |
| HP can be lost                    | From actions, Chaos Cards, and other damage sources |
| HP can be recovered               | Yes                                                 |
| Current HP can exceed Max HP      | No                                                  |
| Max HP can increase from recovery | No                                                  |
| Full heal exists                  | Yes, once per day at midnight                       |
| Passive healing exists            | Yes, from equipped items                            |

At 00:00, every active, non-hospitalized, non-Chaos-locked player
is fully healed.

Hospitalized players remain at 0 HP.
Chaos-locked players keep their current HP unchanged.
Their target-specific healing and income timers remain paused.

function applyMidnightHeal(player: Player): Player {
  if (isHospitalized(player) || isChaosLocked(player)) {
    return player;
  }

  return {
    ...player,
    currentHp: getMaxHpForLevel(player.currentLevel),
  };
}

Whenever healing is applied:

```text id="p17sn3"
currentHp = min(currentHp + healAmount, maxHp)
```

Healing can never increase `maxHp`.

---

## Recovery Sources

Players can recover HP from four sources:

| Source                 | Behavior                                                                        |
| ---------------------- | ------------------------------------------------------------------------------- |
| Daily full heal        | Every day at 00:00, all players recover to full HP, if not hospitalized         |
| HP potions             | Consumables that restore HP immediately                                         |
| Level up               | Player gains +5 Max HP and +5 Current HP                                        |
| Equipment regeneration | Some helmets, armors, legs, or boots may heal HP over time                      |

---

## Daily Full Heal

Every day at `00:00`, when the festival day changes, all players are fully healed.

Rule:

```text id="g6ia78"
currentHp = maxHp
```

Example:

```text id="fa7hiq"
Player has 2 / 145 HP.
At 00:00, player is healed to 145 / 145 HP.
```

This is a full heal, not a fixed amount.

---

## Potions

HP potions restore HP immediately when used.

Potion values will be defined later in the consumables system.

Rule:

```text id="ud0phw"
currentHp = min(currentHp + potionHealAmount, maxHp)
```

If the player is already at full HP, the potion should not increase Max HP.

---

## Level-Up HP

Leveling up gives:

```text id="jxu4pb"
+5 Max HP
+5 Current HP
```

This is not a full heal.

Example:

```text id="a8lubc"
Before level up: 40 / 115 HP
After level up: 45 / 120 HP
```

If a player levels down, Max HP is recalculated from the new level and Current HP is clamped if needed.

---

## Equipment Regeneration

Some equipped items may provide passive HP regeneration.

Possible item slots:

* Helmet.
* Armor.
* Legs.
* Boots.

Recommended regeneration interval:

Each Regeneration piece has its own continuous one-hour timer.

The timer begins when that piece is equipped.
Incomplete progress is discarded when removed.

The full-set bonus has a separate timer beginning
when all four matching pieces are equipped.

Regeneration pauses in Hospital.

Regeneration also pauses while the player is Chaos-locked.

The player preserves completed partial progress and resumes from the same progress after unlocking.

```text id="3df844"
Every 1 hour
```

Example:

```text id="9562a6"
Equipped item gives +5 HP per hour.
Player has 80 / 145 HP.
After 1 hour, player has 85 / 145 HP.
```

If the player is already at full HP, regeneration does nothing.

Example:

```text id="vf6d8l"
Player has 145 / 145 HP.
Item regeneration triggers.
Player remains at 145 / 145 HP.
```

---

## Implementation Notes

Recommended helper:

```ts id="nvlx4v"
function healPlayer(player: Player, healAmount: number): Player {
  const maxHp = getMaxHpForLevel(player.currentLevel);

  return {
    ...player,
    currentHp: Math.min(player.currentHp + healAmount, maxHp),
  };
}
```

Daily full heal:

```ts id="vo11bm"
function fullHealPlayer(player: Player): Player {
  const maxHp = getMaxHpForLevel(player.currentLevel);

  return {
    ...player,
    currentHp: maxHp,
  };
}
```

Equipment regeneration should reuse the same `healPlayer` helper.
