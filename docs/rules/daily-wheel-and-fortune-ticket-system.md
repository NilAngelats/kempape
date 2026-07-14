# Kempape — Daily Wheel & Fortune Ticket System Handoff

## Purpose

This document defines the first complete version of the Kempape Daily Wheel system.

The Daily Wheel gives every player one free spin per festival day and also supports additional spins through Fortune Tickets.

The system should:

* Give players one exciting daily reward opportunity.
* Support additional spins through Fortune Tickets.
* Include a small chance of punishment.
* Make coins and consumables the most common results.
* Keep Chaos Cards and equipment exciting but less frequent.
* Make Premium rewards clearly rarer than Regular rewards.
* Keep Legendary equipment extremely rare.
* Use the same reward logic for free daily spins and Fortune Ticket spins.
* Prevent rerolls, duplicate processing, and client-side manipulation.

This handoff is the source of truth for:

* Wheel slices.
* Slice probabilities.
* Coin ranges.
* Regular and Premium reward logic.
* Punishment behavior.
* Daily spin reset rules.
* Fortune Ticket behavior.
* Reward generation.
* UI interaction.
* Server-side processing.
* Anti-exploit rules.
* Acceptance tests.

---

# Core Wheel Rules

Each player receives:

```text
1 free Daily Wheel spin per festival day
```

The normal daily spin resets at:

```text
00:00 in the configured festival timezone
```

Fortune Tickets grant additional spins.

A Fortune Ticket spin:

* Is separate from the normal daily spin.
* Uses exactly the same probabilities.
* Can be used on any festival day.
* Can be saved.
* Does not reset the normal daily spin.
* Is consumed when the extra spin is granted.

The Daily Wheel is unavailable while the player is hospitalized.

---

# Wheel Structure

The wheel has ten visible result categories:

1. Small Coin Reward.
2. Big Coin Reward.
3. Regular Consumable.
4. Premium Consumable.
5. Regular Chaos Card.
6. Premium Chaos Card.
7. Regular Equipment.
8. Premium Equipment.
9. Small Punishment.
10. Big Punishment.

These are called wheel slices.

The slices do not all have equal probability.

Their visible size should approximately match their real probability.

---

# Final Wheel Probabilities

| Wheel result | Probability |
| ------------ | ----------: |
| Small Coin Reward | 22% |
| Big Coin Reward | 10% |
| Regular Consumable | 20% |
| Premium Consumable | 8% |
| Regular Chaos Card | 13% |
| Premium Chaos Card | 5% |
| Regular Equipment | 12% |
| Premium Equipment | 5% |
| Small Punishment | 4% |
| Big Punishment | 1% |
| **Total** | **100%** |

---

# Probability by Category

| Category | Total probability |
| -------- | ----------------: |
| Coins | 32% |
| Consumables | 28% |
| Chaos Cards | 18% |
| Equipment | 17% |
| Punishments | 5% |
| **Total** | **100%** |

This produces the intended hierarchy:

```text
Coins and Consumables:
Most common

Chaos Cards and Equipment:
Less common

Regular rewards:
More common than Premium rewards

Punishments:
Rare
```

---

# Coin Rewards

## Small Coin Reward

| Rule | Value |
| ---- | ----: |
| Slice probability | 22% |
| Reward range | 20–40 coins |

When selected:

```text
Grant a random whole-number amount
from 20 to 40 coins, inclusive.
```

Every integer in the range should initially have equal probability.

Recommended implementation:

```ts
randomIntegerInclusive(20, 40)
```

Examples:

```text
20 coins
27 coins
40 coins
```

---

## Big Coin Reward

| Rule | Value |
| ---- | ----: |
| Slice probability | 10% |
| Reward range | 50–100 coins |

When selected:

```text
Grant a random whole-number amount
from 50 to 100 coins, inclusive.
```

Every integer in the range should initially have equal probability.

Recommended implementation:

```ts
randomIntegerInclusive(50, 100)
```

---

# Regular Reward Definition

Regular rewards contain only:

```text
Common or Rare items
```

Regular rewards never produce:

* Epic items.
* Legendary items.

The relevant slice determines the category:

* Regular Consumable.
* Regular Chaos Card.
* Regular Equipment.

---

# Regular Consumable

| Rule | Value |
| ---- | ----: |
| Wheel probability | 20% |

## Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Common | 70% |
| Rare | 30% |
| Epic | 0% |
| Legendary | 0% |
| **Total** | **100%** |

## Eligible Items

### Common

* Small Health Potion.
* XP Candy.

### Rare

* Big Health Potion.
* Fortune Ticket.

Items inside the selected rarity should have equal probability unless later rebalanced.

---

# Premium Consumable

| Rule | Value |
| ---- | ----: |
| Wheel probability | 8% |

Premium rewards contain only:

```text
Epic or Legendary items
```

## Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Epic | 85% |
| Legendary | 15% |
| **Total** | **100%** |

## Eligible Items

### Epic

* Experience Potion.
* Discharge Pill.

### Legendary

* Golden Hourglass.

The effective chance of receiving a Legendary consumable from any spin is:

```text
8% x 15%
= 1.2%
```

Approximately:

```text
1 in 83.3 spins
```

---

# Regular Chaos Card

| Rule | Value |
| ---- | ----: |
| Wheel probability | 13% |

## Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Common | 70% |
| Rare | 30% |
| Epic | 0% |
| Legendary | 0% |
| **Total** | **100%** |

## Eligible Items

### Common

* Smoke a Cigarette.
* Double Sip.

### Rare

* Big Sip.
* Shot.

Items inside the selected rarity should have equal probability unless later rebalanced.

---

# Premium Chaos Card

| Rule | Value |
| ---- | ----: |
| Wheel probability | 5% |

## Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Epic | 85% |
| Legendary | 15% |
| **Total** | **100%** |

## Eligible Items

### Epic

* Jägermeister Shot.
* Mirror.

### Legendary

* Finish Your Drink.

The effective chance of receiving a Legendary Chaos Card from any spin is:

```text
5% x 15%
= 0.75%
```

Approximately:

```text
1 in 133.3 spins
```

---

# Regular Equipment

| Rule | Value |
| ---- | ----: |
| Wheel probability | 12% |

## Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Common | 75% |
| Rare | 25% |
| Epic | 0% |
| Legendary | 0% |
| **Total** | **100%** |

The selected equipment piece must:

* Match the rolled rarity.
* Be selected from all eligible equipment pieces of that rarity.
* Use equal probability across eligible pieces unless later rebalanced.

Common and Rare equipment have unlimited global supply.

Duplicate Common and Rare equipment remains in the player inventory.

---

# Premium Equipment

| Rule | Value |
| ---- | ----: |
| Wheel probability | 5% |

## Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Epic | 95% |
| Legendary | 5% |
| **Total** | **100%** |

The effective chance of receiving Legendary equipment from any spin is:

```text
5% x 5%
= 0.25%
```

Approximately:

```text
1 in 400 spins
```

This is intentionally much rarer than Legendary Consumables and Legendary Chaos Cards because Legendary equipment is permanent and globally unique.

---

# Equipment Supply Rules

| Equipment rarity | Global copies per specific item |
| ---------------- | ------------------------------: |
| Common | Unlimited |
| Rare | Unlimited |
| Epic | 4 |
| Legendary | 1 |

When Premium Equipment is selected:

1. Roll Epic or Legendary.
2. Filter equipment pieces by that rarity.
3. Remove pieces whose global supply is exhausted.
4. Randomly select one available piece.
5. Reserve the selected copy atomically.
6. Decrease the global remaining quantity.
7. Grant the equipment.

---

## Exhausted Premium Equipment

If:

```text
Premium Equipment is selected
and
no equipment remains at the rolled rarity
```

Then:

1. Preserve the rolled rarity.
2. Reroll between:
   * Consumable.
   * Chaos Card.
3. Select an eligible item at the preserved rarity.

Recommended reroll probabilities:

| Replacement category | Probability |
| -------------------- | ----------: |
| Consumable | 50% |
| Chaos Card | 50% |

Do not downgrade:

```text
Legendary stays Legendary
Epic stays Epic
```

---

# Small Punishment

| Rule | Value |
| ---- | ----: |
| Wheel probability | 4% |
| HP loss | 10% of Max HP |
| Physical challenge | Drink one beer |

Formula:

```text
damage = ceil(maxHp x 0.10)
```

The player must also complete:

```text
Drink one beer
```

A pre-agreed non-alcoholic substitute is valid without changing the in-game punishment.

The app should never encourage unsafe speed, quantity, or forced consumption.

---

# Big Punishment

| Rule | Value |
| ---- | ----: |
| Wheel probability | 1% |
| HP loss | 25% of Max HP |
| Physical challenge | Take one Jägermeister shot |

Formula:

```text
damage = ceil(maxHp x 0.25)
```

The player must also complete:

```text
Take one Jägermeister shot
```

A pre-agreed non-alcoholic substitute is valid without changing the in-game punishment.

The app should never require an unknown substance, unsafe amount, or involuntary participation.

---

# Punishment Damage Rules

Wheel punishment damage is direct self-damage.

It follows these rules:

* Damage is based on Max HP.
* Damage is rounded up with `Math.ceil`.
* Damage Set does not increase it.
* Dodge does not avoid it.
* Protection does not reduce it.
* Thorns does not affect it.
* It can reduce the player to 0 HP.
* Phoenix may save the player if the damage is lethal.
* If Phoenix fails or is unavailable, normal death and Hospital rules apply.

Small Punishment:

```text
Lose 10% of Max HP
and
Drink one beer
```

Big Punishment:

```text
Lose 25% of Max HP
and
Take one Jägermeister shot
```

---

# Punishment Processing Order

When punishment is rolled:

1. Consume spin
2. Save the wheel result. 
3. Apply the direct HP damage server-side.
4. Check whether the damage is lethal.
5. If lethal, check Phoenix.
6. If Phoenix succeeds:
   * Player survives with 1 HP.
   * No death XP penalty.
   * No Hospital.
7. If Phoenix fails or is unavailable:
   * Trigger death.
   * Apply XP penalty.
   * Enter Hospital.
8. Record the event in activity history.
9. Notify the player.

The physical challenge is part of the real-world punishment, while the HP effect is processed immediately by the game.

---

# Daily Spin Reset

The normal free spin resets every day at:

```text
00:00 in the configured festival timezone
```

Do not use the player device timezone.

Recommended configuration:

```ts
const FESTIVAL_TIME_ZONE =
  "CONFIGURED_EVENT_TIME_ZONE";
```

The source of truth should be a festival-day key.

Example:

```ts
festivalDayKey =
  getFestivalDayKey(
    currentTime,
    FESTIVAL_TIME_ZONE
  );
```

Store whether the player has used the normal spin for that day.

---

# Fortune Ticket Rules

The Fortune Ticket is a Rare Consumable.

Effect:

```text
Grants one additional Daily Wheel spin.
```

## Usage Flow

When the player uses a Fortune Ticket:

1. Validate that the player owns at least one Fortune Ticket.
2. Validate that the player is not hospitalized.
3. Consume one Fortune Ticket.
4. Add one pending Fortune spin.
5. Close the consumable modal.
6. Redirect the player to the Daily Wheel screen.

Recommended field:

```ts
pendingFortuneSpins: number;
```

When a Fortune spin is used:

```text
pendingFortuneSpins -= 1
```

---

## Fortune Ticket Restrictions

A Fortune Ticket:

* Does not reset the normal daily spin.
* Grants exactly one extra spin.
* Can be saved.
* Can be used on a later festival day.
* Uses the same reward probabilities.
* Uses the same punishment probabilities.
* Can produce another Fortune Ticket.
* Is consumed when the extra spin is granted.
* Cannot be used while hospitalized.

There is no automatic daily limit on Fortune Ticket spins beyond the number of tickets the player owns.

---

# Spin Priority

When the player opens the Wheel screen:

1. If the normal daily spin is available, use it first.
2. If the normal daily spin is unavailable but pending Fortune spins exist, use one Fortune spin.
3. If neither is available, disable the Spin button.

Recommended display:

```text
Daily spin available
```

or:

```text
Fortune spins available: 2
```

or:

```text
Next daily spin at 00:00
```

---

# Wheel UI

The Wheel screen should display:

* The ten slices.
* Slice labels or recognizable icons.
* Spin button.
* Normal daily spin state.
* Pending Fortune spin count.
* Player coin count.
* Player HP and Max HP.
* Result modal after the wheel stops.

Recommended slice labels:

```text
Small Coins
Big Coins
Regular Consumable
Premium Consumable
Regular Chaos Card
Premium Chaos Card
Regular Equipment
Premium Equipment
Small Punishment
Big Punishment
```

---

# Visible Slice Sizes

The visible wheel should approximately match the real probabilities.

| Slice | Wheel share |
| ----- | ----------: |
| Small Coins | 22% |
| Big Coins | 10% |
| Regular Consumable | 20% |
| Premium Consumable | 8% |
| Regular Chaos Card | 13% |
| Premium Chaos Card | 5% |
| Regular Equipment | 12% |
| Premium Equipment | 5% |
| Small Punishment | 4% |
| Big Punishment | 1% |

Do not present ten visually equal slices while secretly using unequal probabilities.

The wheel pointer animation must land on the slice selected by the server result.

The animation does not determine the reward.

---

# Spin and Result Flow

Recommended interaction:

1. Player opens the Daily Wheel screen.
2. Client checks whether a normal or Fortune spin is available.
3. Player presses Spin.
4. Server validates eligibility.
5. Server consumes the correct spin source.
6. Server generates the immutable result.
7. Server grants or applies the result.
8. Server stores the complete spin record.
9. Server returns the result to the client.
10. Client animates the wheel.
11. The wheel lands on the saved result.
12. Result modal appears.
13. Player taps to close the result.
14. Wheel screen refreshes.

---

# Result Presentation

## Coins

Example:

```text
Small Coin Reward

You received 32 coins.
```

or:

```text
Big Coin Reward

You received 76 coins.
```

---

## Item Reward

Display:

* Item image.
* Item title.
* Rarity.
* Category.
* Short description.

Do not display:

* Use button.
* Equip button.
* Target selector.
* Sell button.

Example:

```text
Golden Hourglass

Legendary Consumable

Resets all active eligible action cooldowns.
```

---

## Small Punishment

Example:

```text
Small Punishment

Lose 10% of your Max HP
and drink one beer.
```

Also display:

```text
HP lost: 15
```

using the actual calculated value.

---

## Big Punishment

Example:

```text
Big Punishment

Lose 25% of your Max HP
and take one Jägermeister shot.
```

Also display:

```text
HP lost: 37
```

using the actual calculated value.

---

# Item Stack Overflow

Consumables and Chaos Cards have a maximum quantity of:

```text
10 copies per item type
```

If the wheel selects a Consumable or Chaos Card already at quantity 10:

* Do not add the item.
* Do not reroll.
* Convert it into coins.

Because wheel spins do not have a purchase price, wheel overflow needs its own fixed conversion values.

Recommended first-playtest values:

| Rolled rarity | Overflow compensation |
| ------------- | --------------------: |
| Common | 10 coins |
| Rare | 20 coins |
| Epic | 40 coins |
| Legendary | 80 coins |

These values apply only to Daily Wheel and Fortune Ticket rewards.

Example:

```text
Golden Hourglass

Inventory full.
Converted into 80 coins.
```

This wheel-specific overflow table should be reviewed after the first live balance test.

---

# Duplicate Equipment

Common and Rare equipment duplicates:

* Remain in inventory.
* Are not converted.
* Are not rerolled.
* Cannot be sold or merged in the MVP.

Epic and Legendary equipment duplicates are prevented through global supply limits.

---

# Hospital Rules

A hospitalized player cannot:

* Use the normal daily spin.
* Use a Fortune Ticket.
* Use a pending Fortune spin.
* Receive a new wheel result.

A normal daily spin remains unused while hospitalized and may be used later that same festival day after release.

The normal spin still expires at midnight if unused.

Pending Fortune spins persist until used.

---

# Server-Side Spin Transaction

All wheel results must be generated server-side.

The server must determine and apply the result before the animation begins.

The animation is only a visual reveal.

---

## Normal Daily Spin Transaction

Recommended atomic sequence:

1. Validate that the player is not hospitalized.
2. Determine the current festival-day key.
3. Confirm the normal daily spin is unused.
4. Mark the normal daily spin as consumed.
5. Roll the wheel slice.
6. Resolve the slice result.
7. Reserve limited equipment if needed.
8. Apply stack overflow if needed.
9. Grant coins or items, or apply punishment.
10. Resolve Phoenix, death, and Hospital if needed.
11. Save the spin record.
12. Commit the transaction.
13. Return the immutable result.
14. Start the client animation.

If any step fails, the spin must not be consumed.

---

## Fortune Spin Transaction

Recommended atomic sequence:

1. Validate that the player is not hospitalized.
2. Confirm `pendingFortuneSpins > 0`.
3. Decrease pending Fortune spins by one.
4. Roll the wheel slice.
5. Resolve the slice result.
6. Reserve limited equipment if needed.
7. Apply stack overflow if needed.
8. Grant coins or items, or apply punishment.
9. Resolve Phoenix, death, and Hospital if needed.
10. Save the spin record.
11. Commit the transaction.
12. Return the immutable result.
13. Start the client animation.

If any step fails, the Fortune spin must not be consumed.

---

# Interrupted Spin Recovery

A player may close the app or lose connection during the wheel animation.

The result has already been generated and applied.

On the next app load:

1. Check for a completed spin whose result reveal is unfinished.
2. Load the saved result.
3. Resume or replay the result reveal.
4. Do not consume another spin.
5. Do not reroll.
6. Mark the reveal completed after dismissal.

---

# Suggested Data Shapes

## Wheel Result Types

```ts
type WheelSliceId =
  | "small_coins"
  | "big_coins"
  | "regular_consumable"
  | "premium_consumable"
  | "regular_chaos_card"
  | "premium_chaos_card"
  | "regular_equipment"
  | "premium_equipment"
  | "small_punishment"
  | "big_punishment";

type SpinSource =
  | "daily"
  | "fortune_ticket";
```

---

## Wheel Spin Record

```ts
type WheelSpin = {
  id: string;
  playerId: string;

  festivalDayKey: string;
  source: SpinSource;

  sliceId: WheelSliceId;

  rarity?: "common" | "rare" | "epic" | "legendary";
  itemId?: string;

  coinAmount?: number;

  punishmentHpDamage?: number;
  punishmentPhysicalAction?: string;

  wasOverflowConverted: boolean;
  overflowCoinAmount?: number;

  createdAt: string;
  transactionCompletedAt: string;
  revealCompletedAt?: string;
};
```

---

## Player Wheel State

```ts
type PlayerWheelState = {
  playerId: string;

  lastDailySpinFestivalDayKey?: string;

  pendingFortuneSpins: number;
};
```

---

# Suggested Configuration

```ts
const DAILY_WHEEL_CONFIG = {
  slices: {
    smallCoins: {
      id: "small_coins",
      probability: 0.22,
      coinRange: {
        min: 20,
        max: 40,
      },
    },

    bigCoins: {
      id: "big_coins",
      probability: 0.10,
      coinRange: {
        min: 50,
        max: 100,
      },
    },

    regularConsumable: {
      id: "regular_consumable",
      probability: 0.20,
      rarityWeights: {
        common: 70,
        rare: 30,
      },
    },

    premiumConsumable: {
      id: "premium_consumable",
      probability: 0.08,
      rarityWeights: {
        epic: 85,
        legendary: 15,
      },
    },

    regularChaosCard: {
      id: "regular_chaos_card",
      probability: 0.13,
      rarityWeights: {
        common: 70,
        rare: 30,
      },
    },

    premiumChaosCard: {
      id: "premium_chaos_card",
      probability: 0.05,
      rarityWeights: {
        epic: 85,
        legendary: 15,
      },
    },

    regularEquipment: {
      id: "regular_equipment",
      probability: 0.12,
      rarityWeights: {
        common: 75,
        rare: 25,
      },
    },

    premiumEquipment: {
      id: "premium_equipment",
      probability: 0.05,
      rarityWeights: {
        epic: 95,
        legendary: 5,
      },
    },

    smallPunishment: {
      id: "small_punishment",
      probability: 0.04,
      maxHpDamageRate: 0.10,
      physicalAction: "drink_one_beer",
    },

    bigPunishment: {
      id: "big_punishment",
      probability: 0.01,
      maxHpDamageRate: 0.25,
      physicalAction: "take_one_jagermeister_shot",
    },
  },

  normalDailySpins: 1,

  resetTime: "00:00",

  fortuneTicket: {
    extraSpinsGranted: 1,
    persistsAcrossDays: true,
  },

  overflowCoins: {
    common: 10,
    rare: 20,
    epic: 40,
    legendary: 80,
  },
} as const;
```

---

# Suggested Slice Roll Helper

```ts
type WeightedSlice = {
  id: WheelSliceId;
  weight: number;
};

function rollWheelSlice(
  randomValue: number
): WheelSliceId {
  const slices: WeightedSlice[] = [
    { id: "small_coins", weight: 22 },
    { id: "big_coins", weight: 10 },
    { id: "regular_consumable", weight: 20 },
    { id: "premium_consumable", weight: 8 },
    { id: "regular_chaos_card", weight: 13 },
    { id: "premium_chaos_card", weight: 5 },
    { id: "regular_equipment", weight: 12 },
    { id: "premium_equipment", weight: 5 },
    { id: "small_punishment", weight: 4 },
    { id: "big_punishment", weight: 1 },
  ];

  const totalWeight = slices.reduce(
    (sum, slice) => sum + slice.weight,
    0
  );

  let cursor = randomValue * totalWeight;

  for (const slice of slices) {
    cursor -= slice.weight;

    if (cursor < 0) {
      return slice.id;
    }
  }

  return slices[slices.length - 1].id;
}
```

Use a secure server-side random source.

Do not trust client-generated random numbers.

---

# Anti-Exploit Rules

| Rule | Purpose |
| ---- | ------- |
| Server generates the result | Prevent client manipulation |
| Result is saved before animation | Prevent rerolls |
| Daily spin uses festival-day key | Prevent timezone exploits |
| Fortune spin decremented atomically | Prevent double use |
| Limited equipment reserved atomically | Prevent duplicate unique items |
| Same request uses idempotency key | Prevent duplicate processing |
| Punishment applies server-side | Prevent skipping HP loss |
| Animation follows saved result | Prevent visual mismatch |
| Incomplete reveal resumes | Prevent lost results |
| Stack overflow does not reroll | Preserve reward odds |
| Hospitalized players cannot spin | Match Hospital rules |
| Wheel slice sizes match probabilities | Maintain transparency |

---

# Acceptance Tests

## Daily Spin Available

```text
Given a player has not spun today
and is not hospitalized,
when the Wheel screen opens,
then the Daily Spin button is enabled.
```

---

## Daily Spin Reset

```text
Given a player used the normal spin yesterday,
when the festival day changes at 00:00,
then one new normal daily spin becomes available.
```

---

## Small Coin Reward

```text
When Small Coin Reward is selected,
then the player receives a whole-number amount
from 20 through 40 coins.
```

---

## Big Coin Reward

```text
When Big Coin Reward is selected,
then the player receives a whole-number amount
from 50 through 100 coins.
```

---

## Regular Reward Rarity

```text
When Regular Consumable is selected,
then only Common or Rare Consumables can be granted.
```

---

## Premium Reward Rarity

```text
When Premium Chaos Card is selected,
then only Epic or Legendary Chaos Cards can be granted.
```

---

## Small Punishment

```text
Given Small Punishment is selected,
then the player loses ceil(Max HP x 0.10)
and the result instructs the player to drink one beer.
```

---

## Big Punishment

```text
Given Big Punishment is selected,
then the player loses ceil(Max HP x 0.25)
and the result instructs the player
to take one Jägermeister shot.
```

---

## Phoenix Interaction

```text
Given wheel punishment damage is lethal
and Phoenix is available,
then Phoenix may save the player
using the normal Phoenix rules.
```

---

## Fortune Ticket

```text
Given a player owns one Fortune Ticket,
when the player uses it,
then one ticket is consumed
and pendingFortuneSpins increases by one.
```

---

## Fortune Spin Uses Same Probabilities

```text
When a Fortune spin is used,
then it uses exactly the same wheel slice probabilities
as the normal daily spin.
```

---

## Fortune Ticket Can Produce Fortune Ticket

```text
Given a Fortune spin selects Regular Consumable,
when the rarity and item roll select Fortune Ticket,
then the player receives a Fortune Ticket normally.
```

---

## Hospital Restriction

```text
Given a player is hospitalized,
when they open the Wheel screen,
then normal and Fortune spins are disabled.
```

---

## Interrupted Animation

```text
Given the spin transaction completed,
when the app closes during the wheel animation,
then the saved result is shown after reopening
without consuming another spin or rerolling.
```

---

## Duplicate Request

```text
Given a spin request already completed,
when the same idempotency key is submitted again,
then the existing result is returned
and no additional spin is consumed.
```

---

# Design Decisions Summary

| Topic | Decision |
| ----- | -------- |
| Normal daily spins | 1 |
| Reset | 00:00 festival timezone |
| Fortune Ticket | +1 additional spin |
| Fortune spins persist | Yes |
| Fortune probabilities | Same as normal spin |
| Total slices | 10 |
| Total punishment chance | 5% |
| Small punishment chance | 4% |
| Big punishment chance | 1% |
| Small punishment HP | 10% Max HP |
| Small punishment action | Drink one beer |
| Big punishment HP | 25% Max HP |
| Big punishment action | One Jägermeister shot |
| Small coins | 20–40 |
| Big coins | 50–100 |
| Regular rarity | Common or Rare |
| Premium rarity | Epic or Legendary |
| Small Coins probability | 22% |
| Big Coins probability | 10% |
| Regular Consumable | 20% |
| Premium Consumable | 8% |
| Regular Chaos Card | 13% |
| Premium Chaos Card | 5% |
| Regular Equipment | 12% |
| Premium Equipment | 5% |
| Legendary Consumable effective chance | 1.2% |
| Legendary Chaos Card effective chance | 0.75% |
| Legendary Equipment effective chance | 0.25% |
| Result generation | Server-side |
| Animation purpose | Visual reveal only |
| Hospital spinning | Not allowed |

---

# Current Status

This Daily Wheel and Fortune Ticket system is approved as the first version for Kempape.

The final wheel probabilities are:

```text
22% Small Coins
10% Big Coins

20% Regular Consumable
8% Premium Consumable

13% Regular Chaos Card
5% Premium Chaos Card

12% Regular Equipment
5% Premium Equipment

4% Small Punishment
1% Big Punishment
```

The final punishments are:

```text
Small Punishment:
Lose 10% of Max HP
and drink one beer.
```

```text
Big Punishment:
Lose 25% of Max HP
and take one Jägermeister shot.
```

The final Small Coin Reward is:

```text
20–40 coins
```

This handoff should be added to the Kempape game logic project as the source of truth for the Daily Wheel, Fortune Ticket spins, wheel probabilities, punishment effects, reward resolution, UI behavior, and implementation rules.
