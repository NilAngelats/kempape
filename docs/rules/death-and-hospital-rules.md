# Kempape — Death & Hospital Rules

## Purpose

This document defines what happens when a player dies and enters the Festival Hospital.

Keep this system simple, punishing, but not devastating.

---

## Death Trigger

A player dies when their HP reaches `0` or below.

```text
currentHp <= 0 = dead
```

Example:

```text
Player has 5 HP.
Incoming damage is 20 HP.
Result would be -15 HP.
Player dies.
```

After death is triggered, store the player's HP as `0`.

---

## XP Penalty on Death

When a player dies, they lose a percentage of their current total XP.

Use the player’s level to decide the penalty percentage.

| Player level |       XP lost on death |
| -----------: | ---------------------: |
|   Level 1–10 | 5% of current total XP |
|  Level 11–20 | 6% of current total XP |
|  Level 21–30 | 7% of current total XP |
|  Level 31–40 | 8% of current total XP |

Formula:

```text
xpLost = ceil(currentTotalXp × deathPenaltyRate)
```

Examples:

| Player state        |         Calculation |  XP lost |
| ------------------- | ------------------: | -------: |
| Level 8, 1,173 XP   |  ceil(1,173 × 0.05) |    59 XP |
| Level 18, 4,200 XP  |  ceil(4,200 × 0.06) |   252 XP |
| Level 27, 11,000 XP | ceil(11,000 × 0.07) |   770 XP |
| Level 35, 25,000 XP | ceil(25,000 × 0.08) | 2,000 XP |

After subtracting XP:

```text
totalXp = max(totalXp - xpLost, 0)
```

Then recalculate the player’s level from total XP.

The player can level down.

---

## Hospital State

When a player dies:

```text
currentHp = 0
hospitalUntil = deathTime + 1 hour
```

While in the hospital, the player:

| Action          | Allowed?                      |
| --------------- | ----------------------------- |
| Do actions      | No                            |
| Complete quests | No                            |
| Use Chaos Cards | No                            |
| Receive damage  | No                            |
| Be killed again | No                            |
| Use potions     | No                            |
| Open chests     | No                            |

Recommended MVP rule:

```text
Hospitalized players cannot interact with the game until hospitalUntil.
```

Recommended Hospital Set system

When a player dies:

Base Hospital time = 60 minutes
Current HP = 0

The player enters a special Hospital screen.

While there, they still cannot:

Perform or validate actions.
Use Chaos Cards.
Open chests.
Spin the wheel.
Use normal consumables.

However, the Hospital screen allows two special interactions:

Equip Hospital Set items
Use one Discharge Pill

The player does not receive access to the full normal Inventory.

How the equipment should work

Hospital equipment can be equipped during the current Hospital stay.

When a Hospital item is equipped:

It immediately reduces the current Hospital countdown.
That item becomes locked.
It cannot be unequipped or replaced until the player leaves the Hospital.
Its reduction can apply only once during that Hospital stay.

I recommend keeping the existing fixed values:

Hospital piece	Immediate reduction
Helmet	4 minutes
Boots	4 minutes
Legs	8 minutes
Armor	12 minutes
Piece total	28 minutes
Full-set bonus	2 minutes
Full set	30 minutes

These values already exist in the Equipment system and reduce the normal 60-minute stay to 30 minutes with the full set.

---

## Hospital Exit

After 1 hour, the player leaves the hospital.

The player returns with 75% of their current Max HP.

Formula:

```text
currentHp = ceil(maxHp × 0.75)
```

Examples:

| Max HP | Hospital exit HP |
| -----: | ---------------: |
|    100 |               75 |
|    145 |              109 |
|    195 |              147 |
|    245 |              184 |
|    295 |              222 |

After leaving the hospital, the player can again:

* Do actions.
* Complete quests.
* Use Chaos Cards.
* Use potions.
* Receive damage.
* Be killed again.

---

## Important Notes

Death affects XP and level.

If the XP loss causes the player to level down:

```text
Max HP must be recalculated from the new level.
```

If needed, clamp Current HP to the new Max HP.

However, after hospital exit, HP should be set using the new recalculated Max HP:

```text
currentHp = ceil(newMaxHp × 0.75)
```

---

## Suggested Constants

```ts
const HOSPITAL_DURATION_MINUTES = 60;
const HOSPITAL_EXIT_HP_RATE = 0.75;

const DEATH_XP_PENALTY_BY_LEVEL = [
  { minLevel: 1, maxLevel: 10, penaltyRate: 0.05 },
  { minLevel: 11, maxLevel: 20, penaltyRate: 0.06 },
  { minLevel: 21, maxLevel: 30, penaltyRate: 0.07 },
  { minLevel: 31, maxLevel: 40, penaltyRate: 0.08 },
];
```

---

## Suggested Logic

const hospitalReduction =
  getEquippedHospitalReduction(player);

const hospitalDurationMinutes = Math.max(
  60 - hospitalReduction,
  30
);

hospitalUntil = addMinutes(
  deathTime,
  hospitalDurationMinutes
);

```ts
function handlePlayerDeath(player: Player, deathTime: Date): Player {
  const penaltyRate = getDeathPenaltyRate(player.currentLevel);
  const xpLost = Math.ceil(player.totalXp * penaltyRate);

  const newTotalXp = Math.max(player.totalXp - xpLost, 0);
  const newLevel = getLevelFromTotalXp(newTotalXp);

  return {
    ...player,
    totalXp: newTotalXp,
    currentLevel: newLevel,
    currentHp: 0,
    deaths: player.deaths + 1,
    hospitalUntil: addMinutes(deathTime, 60),
  };
}
```

```ts
function releasePlayerFromHospital(player: Player): Player {
  const maxHp = getMaxHpForLevel(player.currentLevel);
  const exitHp = Math.ceil(maxHp * 0.75);

  return {
    ...player,
    currentHp: exitHp,
    hospitalUntil: undefined,
  };
}
```

The UI for the Hospital could be a countdown displayed on the homepage letting the player do nothing else but look at the countdown. Not even accept other players' actions.

# Thorns and Mirror deaths

Attacker dies.
Defender dies.
Both die simultaneously.
Phoenix saves either player independently.


# Final recommended rule

Every death begins with a 60-minute Hospital countdown.

Hospital Set pieces already equipped at death
reduce the countdown immediately.

While hospitalized, the player may equip additional
Hospital Set pieces through the Hospital screen.

Each piece immediately reduces the remaining time once
and becomes locked until discharge.

Normal equipment cooldown restrictions still apply.

Completing the full Hospital Set grants
an additional 2-minute reduction.

The full set reduces Hospital time by up to 30 minutes.

The Discharge Pill can reduce it by another 20 minutes.
