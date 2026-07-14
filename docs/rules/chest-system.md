# Kempape — Chest System Handoff

## Purpose

This document defines the first complete version of the Kempape Chest system.

The Chest system is one of the game’s main reward loops. Players earn coins through actions, Daily Quests, level rewards, Gold equipment, and other systems, then spend those coins to open chests immediately.

The design goals are:

* Make chest opening frequent, exciting, and easy to understand.
* Give each chest size a clearly different value and reward profile.
* Allow every chest to produce exciting rewards, including very rare Legendary results.
* Keep permanent Legendary equipment scarce.
* Make consumables and Chaos Cards obtainable often enough to influence the four-day festival.
* Prevent exploits, rerolls, duplicate unique equipment, and lost rewards.
* Keep the full interaction suitable for the MVP.

This handoff is the source of truth for:

* Chest prices.
* Chest opening behavior.
* Reward slot types.
* Reward probabilities.
* Coin reward ranges.
* Free chest openings.
* Chest animation and reveal behavior.
* Epic Chest Set bonus behavior.
* Limited equipment handling.
* Overflow compensation.
* Server-side transaction and recovery rules.

---

# Chest Types and Prices

Kempape has three chest types:

| Chest | Price | Base reward slots |
| ----- | ----: | ----------------: |
| Small Chest | 25 coins | 1 |
| Medium Chest | 70 coins | 2 |
| Big Chest | 200 coins | 3 |

The chest prices remain:

```text
Small Chest:  25 coins
Medium Chest: 70 coins
Big Chest:   200 coins
```

---

# No Chest Inventory

Purchased and free chests are not stored as normal inventory items.

The player never receives a physical chest object that must later be selected from the inventory.

Instead:

```text
Tap chest -> Open chest modal -> Pay or use free opening -> Open immediately
```

This removes unnecessary inventory complexity.

Free chest rewards are stored as opening credits rather than visible chest items.

---

# Chest Reward Slot Types

There are two reward slot types:

1. Regular Reward Slot.
2. Premium Reward Slot.

Each slot type has a different purpose.

## Regular Reward Slot

A Regular slot can grant only:

* Coins.
* Consumables.

It cannot grant:

* Equipment.
* Chaos Cards.

Regular slots are designed to provide a useful baseline reward before the stronger Premium rewards are revealed.

Only Medium and Big Chests contain a Regular slot.

---

## Premium Reward Slot

A Premium slot can grant:

* Equipment.
* Consumables.
* Chaos Cards.

Premium slots first roll the reward category and then roll the reward rarity.

Premium slots are used in every chest type.

---

# Chest Slot Composition

| Chest | Reward 1 | Reward 2 | Reward 3 |
| ----- | -------- | -------- | -------- |
| Small Chest | Small Premium slot | — | — |
| Medium Chest | Medium Regular slot | Medium Premium slot | — |
| Big Chest | Big Regular slot | Big Premium slot | Big Premium slot |

The order in this table is also the default reveal order.

```text
Small:
Premium

Medium:
Regular -> Premium

Big:
Regular -> Premium -> Premium
```

The Epic Chest Set may add one extra Premium reward after the base slots.

---

# Small Chest

## Overview

| Rule | Value |
| ---- | ----: |
| Price | 25 coins |
| Base rewards | 1 |
| Slot type | Small Premium |
| Coins directly available | No |

The Small Chest does not directly award coins.

Returning a small amount of coins after paying 25 coins would often feel disappointing and would weaken the purpose of the chest.

Its single reward can be:

* Equipment.
* Consumable.
* Chaos Card.

---

## Small Premium Category Probabilities

The three categories have equal probability.

| Category | Probability |
| -------- | ----------: |
| Equipment | 1/3 |
| Consumable | 1/3 |
| Chaos Card | 1/3 |

Implementation should use exact equal thirds rather than storing three rounded `33.33%` values.

Recommended implementation:

```ts
const categories = [
  "equipment",
  "consumable",
  "chaos_card",
];

const selectedCategory =
  categories[randomIntegerInclusive(0, 2)];
```

This guarantees a true total of 100%.

---

## Small Premium Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Common | 79% |
| Rare | 18% |
| Epic | 2.8% |
| Legendary | 0.2% |
| **Total** | **100%** |

A Legendary reward from a Small Chest occurs approximately:

```text
0.2% = 1 in 500 Small Premium rolls
```

This gives inexpensive chests a very small jackpot possibility.

---

# Medium Chest

## Overview

| Rule | Value |
| ---- | ----: |
| Price | 70 coins |
| Base rewards | 2 |
| Reward 1 | Medium Regular |
| Reward 2 | Medium Premium |

---

## Medium Regular Slot

The Medium Regular slot first chooses between Coins and Consumable.

### Reward Type Probabilities

| Reward type | Probability |
| ----------- | ----------: |
| Coins | 50% |
| Consumable | 50% |

### Coin Reward

When Coins are selected:

```text
Random whole-number amount from 15 to 30 coins, inclusive.
```

Every integer in the range should initially have equal probability.

Examples:

```text
15 coins
21 coins
30 coins
```

Recommended implementation:

```ts
randomIntegerInclusive(15, 30)
```

### Consumable Rarity Probabilities

When Consumable is selected:

| Rarity | Probability |
| ------ | ----------: |
| Common | 55% |
| Rare | 30% |
| Epic | 10% |
| Legendary | 5% |
| **Total** | **100%** |

Because the first roll has a 50% Consumable chance, the effective chance that the Medium Regular slot grants a Legendary consumable is:

```text
50% x 5% = 2.5%
```

---

## Medium Premium Slot

### Category Probabilities

| Category | Probability |
| -------- | ----------: |
| Equipment | 50% |
| Chaos Card | 40% |
| Consumable | 10% |
| **Total** | **100%** |

### Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Common | 50% |
| Rare | 37% |
| Epic | 12% |
| Legendary | 1% |
| **Total** | **100%** |

The category and rarity rolls are independent.

Example:

```text
Category roll: Equipment
Rarity roll: Epic
Result: One available Epic equipment item
```

---

# Big Chest

## Overview

| Rule | Value |
| ---- | ----: |
| Price | 200 coins |
| Base rewards | 3 |
| Reward 1 | Big Regular |
| Reward 2 | Big Premium |
| Reward 3 | Big Premium |

The two Big Premium slots roll independently.

---

## Big Regular Slot

### Reward Type Probabilities

| Reward type | Probability |
| ----------- | ----------: |
| Coins | 50% |
| Consumable | 50% |

### Coin Reward

When Coins are selected:

```text
Random whole-number amount from 20 to 45 coins, inclusive.
```

Every integer in the range should initially have equal probability.

Recommended implementation:

```ts
randomIntegerInclusive(20, 45)
```

### Consumable Rarity Probabilities

When Consumable is selected:

| Rarity | Probability |
| ------ | ----------: |
| Common | 30% |
| Rare | 35% |
| Epic | 20% |
| Legendary | 15% |
| **Total** | **100%** |

The effective chance that the Big Regular slot grants a Legendary consumable is:

```text
50% x 15% = 7.5%
```

---

## Big Premium Slots

Both Big Premium slots use the same independent configuration.

### Category Probabilities

| Category | Probability |
| -------- | ----------: |
| Equipment | 50% |
| Chaos Card | 40% |
| Consumable | 10% |
| **Total** | **100%** |

### Rarity Probabilities

| Rarity | Probability |
| ------ | ----------: |
| Common | 20% |
| Rare | 45% |
| Epic | 30% |
| Legendary | 5% |
| **Total** | **100%** |

Each slot rolls independently.

This means one Big Chest has:

```text
Chance of at least one Legendary Premium reward:

1 - (0.95 x 0.95)
= 9.75%
```

Approximately:

```text
1 in 10.3 Big Chests
```

The chance of both Premium slots being Legendary is:

```text
0.05 x 0.05
= 0.25%
```

Approximately:

```text
1 in 400 Big Chests
```

---

## No Big Chest Rarity Guarantee

The Big Chest does not force one Premium slot to be Rare-or-better.

Both Premium slots are allowed to roll Common.

The chance of both Big Premium slots being Common is:

```text
0.20 x 0.20
= 4%
```

This result remains valid for the first playtest.

The Big Chest still includes its Regular reward, so the player receives three rewards even in this low-roll outcome.

No automatic reroll should occur only because both Premium rewards are Common.

---

# Probability Resolution Order

## Regular Slot

Resolve a Regular slot in this order:

1. Roll Coins or Consumable.
2. If Coins:
   * Roll a whole-number amount in the chest’s configured range.
3. If Consumable:
   * Roll the configured consumable rarity.
   * Select one eligible consumable from that rarity.

Example:

```text
Big Regular slot

Reward type: Consumable
Rarity: Legendary
Result: Golden Hourglass
```

---

## Premium Slot

Resolve a Premium slot in this order:

1. Roll category.
2. Roll rarity.
3. Select one eligible item matching both results.
4. Apply limited-equipment and stack-limit rules.

Example:

```text
Medium Premium slot

Category: Chaos Card
Rarity: Rare
Result: Big Sip or Shot
```

Category and rarity probabilities should remain independent.

Do not roll a combined flat list unless it produces mathematically identical results and remains easy to audit.

---

# Item Selection Within a Category and Rarity

For the first version, every eligible item inside the selected category and rarity should have equal probability.

Examples:

## Rare Consumable

Possible results:

* Big Health Potion.
* Fortune Ticket.

Each receives equal weight unless a later balance update explicitly assigns different weights.

## Epic Chaos Card

Possible results:

* Jägermeister Shot.
* Mirror.

Each receives equal weight.

## Equipment

Select randomly from all equipment pieces that:

* Match the rolled rarity.
* Still have an available global copy when the rarity is limited.

Individual item weighting may be added later, but it is not included in the MVP.

---

# Reward Pools

## Equipment

Equipment rarities:

* Common.
* Rare.
* Epic.
* Legendary.

The latest global copy rules are:

| Rarity | Global copies per specific equipment item |
| ------ | ----------------------------------------: |
| Common | Unlimited |
| Rare | Unlimited |
| Epic | 4 |
| Legendary | 1 |

The four-copy Epic rule replaces any older three-copy placeholder.

---

## Consumables

Current consumables:

| Rarity | Items |
| ------ | ----- |
| Common | Small Health Potion, XP Candy |
| Rare | Big Health Potion, Fortune Ticket |
| Epic | Experience Potion, Discharge Pill |
| Legendary | Golden Hourglass |

The Discharge Pill may be received normally from a chest even though it is used only from the Hospital interface.

---

## Chaos Cards

Current Chaos Cards:

| Rarity | Items |
| ------ | ----- |
| Common | Smoke a Cigarette, Double Sip |
| Rare | Big Sip, Shot |
| Epic | Jägermeister Shot, Mirror |
| Legendary | Finish Your Drink |

Chaos Cards can only appear in Premium slots.

They never appear in Regular slots.

---

# Effective Legendary Consumable Chances

These calculations are for balance reference only.

## Small Chest

Small Premium:

```text
Consumable category: 1/3
Legendary rarity: 0.2%

Effective Legendary consumable chance:
1/3 x 0.2%
= approximately 0.0667%
```

Approximately:

```text
1 in 1,500 Small Chests
```

---

## Medium Chest

Medium Regular Legendary consumable:

```text
50% Consumable x 5% Legendary
= 2.5%
```

Medium Premium Legendary consumable:

```text
10% Consumable x 1% Legendary
= 0.1%
```

Approximate chance of at least one Legendary consumable in the complete Medium Chest:

```text
1 - (0.975 x 0.999)
= approximately 2.60%
```

Approximately:

```text
1 in 38.5 Medium Chests
```

---

## Big Chest

Big Regular Legendary consumable:

```text
50% Consumable x 15% Legendary
= 7.5%
```

Each Big Premium Legendary consumable:

```text
10% Consumable x 5% Legendary
= 0.5%
```

Approximate chance of at least one Legendary consumable in the complete Big Chest:

```text
1 - (0.925 x 0.995 x 0.995)
= approximately 8.42%
```

Approximately:

```text
1 in 11.9 Big Chests
```

These probabilities are intentionally more generous than Legendary equipment probabilities because consumables are one-use rewards.

---

# Epic Chest Set Bonus

The Epic Chest Set gives a chance to receive one additional reward when a chest is opened.

## Piece Chances

| Equipped piece | Extra reward chance |
| -------------- | ------------------: |
| Helmet | 2% |
| Boots | 2% |
| Legs | 6% |
| Armor | 10% |
| Piece total | 20% |
| Full-set bonus | +5% |
| **Full-set total** | **25%** |

Partial pieces contribute their listed chances.

A complete set gives:

```text
25% chance to receive one additional reward
```

---

## Bonus Reward Type

The bonus reward is always a Premium slot.

It never uses a Regular slot.

The bonus slot uses the Premium configuration of the chest being opened:

| Opened chest | Bonus reward |
| ------------ | ------------ |
| Small | One additional Small Premium slot |
| Medium | One additional Medium Premium slot |
| Big | One additional Big Premium slot |

Examples:

```text
Small Chest with bonus:
Premium + Small Premium bonus
```

```text
Medium Chest with bonus:
Regular + Premium + Medium Premium bonus
```

```text
Big Chest with bonus:
Regular + Premium + Premium + Big Premium bonus
```

---

## Bonus Roll Rules

The Chest Set performs one bonus check per chest opening.

The bonus reward cannot trigger another bonus reward.

```text
No recursive Chest Set triggers
```

The equipment state used for the roll is the equipment worn when the server begins processing the chest opening.

Changing equipment after pressing Open cannot affect the result.

The bonus check and bonus reward must be resolved inside the same atomic server transaction as the normal chest rewards.

---

# Limited Equipment Handling

Epic and Legendary equipment is globally limited.

When an equipment result is rolled:

1. Filter equipment by the rolled rarity.
2. Remove pieces whose global supply has been exhausted.
3. Randomly select from the remaining eligible pieces.
4. Reserve the selected copy atomically.
5. Decrease the remaining global quantity.
6. Grant the item to the player.

Two players must never receive the same final unique Legendary equipment copy.

---

## Exhausted Equipment Category

A player should not lose or downgrade an Epic or Legendary rarity roll because equipment of that rarity is exhausted.

When:

```text
Category = Equipment
and
no eligible equipment exists at the rolled rarity
```

Then:

1. Preserve the rolled rarity.
2. Reroll the category using only:
   * Consumable.
   * Chaos Card.
3. Select an eligible item of the preserved rarity.

Recommended reroll weights preserve the relative Premium category weights:

Original non-equipment Premium weights:

```text
Consumable: 10
Chaos Card: 40
```

Normalized reroll:

| Replacement category | Probability |
| -------------------- | ----------: |
| Consumable | 20% |
| Chaos Card | 80% |

For a Small Premium slot, where the original category weights are equal, reroll equally:

| Replacement category | Probability |
| -------------------- | ----------: |
| Consumable | 50% |
| Chaos Card | 50% |

Do not downgrade the rarity.

---

# Consumable and Chaos Card Stack Limits

Each Consumable and Chaos Card type has a maximum player inventory quantity of:

```text
10 copies
```

When a chest selects an item already at quantity 10:

* Do not add the item.
* Do not reroll it.
* Grant the configured overflow coin refund.
* Record the original rolled item in the chest-opening result.
* Display the refund clearly during the reward reveal.

Example reveal:

```text
Golden Hourglass

Inventory full.
Converted into 33 coins.
```

---

# Overflow Refund Rules

Use the existing Economy rule:

```text
refundPerOverflow =
floor(
  (chestReferencePrice x 0.50)
  / baseRewardSlotCount
)
```

The calculation uses the chest’s normal shop price even when the opening was free.

## Refund Per Overflowing Reward

| Chest | Reference price | Base slots | Refund per overflow |
| ----- | --------------: | ---------: | ------------------: |
| Small | 25 | 1 | 12 coins |
| Medium | 70 | 2 | 17 coins |
| Big | 200 | 3 | 33 coins |

Calculations:

```text
Small:
floor((25 x 0.50) / 1) = 12
```

```text
Medium:
floor((70 x 0.50) / 2) = 17
```

```text
Big:
floor((200 x 0.50) / 3) = 33
```

---

## Maximum Refund Per Opening

The total overflow refund from one chest opening must not exceed 50% of that chest’s reference price.

| Chest | Maximum total overflow refund |
| ----- | ----------------------------: |
| Small | 12 coins |
| Medium | 35 coins |
| Big | 100 coins |

The maximum applies to the complete opening, including an additional reward created by the Epic Chest Set.

The base reward slot count is still used to calculate each individual overflow refund.

---

## Duplicate Equipment

Common and Rare duplicate equipment:

* Remains in inventory.
* Is not converted into coins.
* Is not rerolled.
* Cannot be sold, merged, recycled, or traded in the MVP.

Epic and Legendary duplicates are prevented by the global copy system.

---

# Free Chest Openings

Free chest rewards may come from:

* Level milestone rewards.
* Future special rewards.

Free chests should not appear in the normal inventory.

Store them as free opening credits:

---

## Naming Compatibility

Older systems may refer to milestone reward chests by rarity-style names.

Normalize them as:

```text
Common Chest    -> Small Chest
Rare Chest      -> Medium Chest
Legendary Chest -> Big Chest
```

The actual chest behavior and reward probabilities always follow Small, Medium, and Big Chest definitions.

---

## Opening Priority

When a player has a free opening credit for the selected chest:

* The modal button displays `OPEN`.
* No coin amount is shown on the button.
* Pressing Open consumes one free credit.
* Coins are not deducted.

When the player has no free credit:

* Use the normal coin price.
* Confirm that the player can afford it.
* Deduct the full price.

A free opening should be used before a coin purchase for the same chest.

---

# Store and Modal Interaction

## Store Display

The Store displays:

* Small Chest.
* Medium Chest.
* Big Chest.
* Chest image.
* Chest price.
* Available free opening count, when greater than zero.

Example:

```text
Medium Chest
70 coins
Free openings: 1
```

---

## Opening the Modal

When the player taps a chest, show a modal containing:

1. Chest name.
2. Chest image.
3. Number of rewards.
4. Price or free-opening state.
5. Open button.
6. Cancel or close control.

---

## Button States

### Free Opening Available

Button:

```text
OPEN
```

The button is enabled.

The price is not displayed inside the button.

The modal may separately show:

```text
Free opening available
```

---

### Player Can Afford the Chest

Example:

```text
OPEN — 70
```

The button is green and enabled.

A coin icon may be shown next to the amount.

---

### Player Cannot Afford the Chest

Example:

```text
70 coins required
```

The button is disabled.

The amount or text should appear in light red or red.

The client should prevent the click, but the server must still revalidate the balance for every opening request.

---

# Chest Animation

The provided chest animation asset should be used during the opening sequence.

Current asset:

```text
Chests.png
```

The file should be verified by the developer because its extension and actual animation format may not match.

Recommended visual mapping:

| Chest | Animation appearance |
| ----- | -------------------- |
| Small | Brown/basic chest |
| Medium | Red and gold chest |
| Big | Blue/crystal premium chest |

The final implementation may use:

* Animated GIF.
* Animated WebP.
* Sprite sheet.
* Frame animation.
* Another game-ready exported animation format.

The important requirement is that each chest displays an opening animation before rewards are revealed.

---

# Reward Reveal Flow

## General Flow

1. Chest modal is open.
2. Player presses Open.
3. Server completes the entire opening transaction.
4. Client receives the saved opening result.
5. Opening animation starts.
6. At the end of the animation, the first reward appears over the open chest.
7. Player taps the displayed reward.
8. The next reward appears, when one exists.
9. Tapping the final reward closes the reward overlay and chest modal.
10. Player returns to the Store.

Rewards appear one at a time.

---

## Small Chest Reveal

The Small Chest has one base reward.

```text
Open animation
-> Display Reward 1
-> Tap Reward 1
-> Close chest modal
-> Return to Store
```

When the Chest Set bonus succeeds, the Small Chest has two rewards and follows the multi-reward behavior.

---

## Medium Chest Reveal

```text
Open animation
-> Display Regular Reward
-> Tap
-> Display Premium Reward
-> Tap final reward
-> Close chest modal
-> Return to Store
```

When the Chest Set bonus succeeds, reveal the bonus Premium reward after the normal Premium reward.

---

## Big Chest Reveal

```text
Open animation
-> Display Regular Reward
-> Tap
-> Display Premium Reward 1
-> Tap
-> Display Premium Reward 2
-> Tap final reward
-> Close chest modal
-> Return to Store
```

When the Chest Set bonus succeeds, reveal the bonus Big Premium reward last.

---

# Reward Presentation

An item reward should use the same visual identity as the corresponding inventory item.

Display:

* Item image.
* Item title.
* Rarity.
* Short description.
* Quantity, when relevant.
* Overflow conversion, when relevant.

Do not display:

* Use button.
* Equip button.
* Sell button.
* Target selector.
* Any action unrelated to revealing the reward.

The reveal is informational only.

---

## Coin Reward Presentation

Display:

* Coin image.
* Title: `Coins`.
* Exact amount.
* Short description.

Example:

```text
Coins

You received 27 coins.
```

---

## Equipment Reward Presentation

Example:

```text
Legendary Phoenix Armor

Legendary Equipment — Armor

Provides a chance to survive lethal damage.
```

---

## Consumable Reward Presentation

Example:

```text
Golden Hourglass

Legendary Consumable

Resets all active eligible action cooldowns.
```

---

## Chaos Card Reward Presentation

Example:

```text
Mirror

Epic Chaos Card

Drink together. Deals damage to the target and damages you too.
```

---

# Server-Side Opening Transaction

The server determines and grants every reward before the animation begins.

The animation is only a reveal of a completed result.

This prevents:

* Closing the modal to reroll.
* Closing the app to reroll.
* Client-side probability manipulation.
* Losing rewards during animation.
* Coins being deducted without rewards.
* Duplicate unique Legendary equipment.
* Duplicate processing from repeated button presses.

---

## Coin-Purchased Opening

Recommended atomic processing:

1. Validate the player is not hospitalized.
2. Validate the requested chest type.
3. Confirm no free opening credit will be used.
4. Confirm the player has enough coins.
5. Lock or atomically update the player balance.
6. Deduct the complete chest price.
7. Generate all base reward slots.
8. Roll the Epic Chest Set bonus.
9. Generate the bonus Premium reward if successful.
10. Reserve limited equipment.
11. Apply item stack and overflow rules.
12. Grant items and coins.
13. Save the chest-opening record.
14. Commit the transaction.
15. Return the immutable opening result to the client.
16. Start the animation.

If any step fails, no coins, credits, inventory quantities, limited-item counts, or rewards should change.

---

## Free Opening

Recommended atomic processing:

1. Validate the player is not hospitalized.
2. Validate the chest type.
3. Confirm at least one free credit exists.
4. Decrease the appropriate free credit by one.
5. Generate all base reward slots.
6. Roll the Epic Chest Set bonus.
7. Generate the bonus Premium reward if successful.
8. Reserve limited equipment.
9. Apply item stack and overflow rules.
10. Grant items and coins.
11. Save the chest-opening record.
12. Commit the transaction.
13. Return the immutable opening result.
14. Start the animation.

The opening uses the normal chest reference price for overflow calculations even though no coins were paid.

---

# Hospital Restriction

A hospitalized player cannot:

* Buy a chest.
* Use a free chest opening.
* Open or reveal a new chest.
* Trigger a Chest Set bonus through a new opening.

Recommended MVP behavior:

```text
Hospitalized players cannot interact with the Store.
```

A chest opening completed before death remains valid.

An unfinished reveal from an already completed server transaction may be shown again after leaving the Hospital or when the app is reopened, depending on UI implementation.

---

# Chest Opening Recovery

A player may close the app or lose connection during the animation or reward reveal.

The rewards have already been granted, so the opening must not reroll.

Store whether the reveal was completed.

On the next app load:

1. Check for an opening whose transaction completed but reveal did not.
2. Load the saved rewards.
3. Resume the reveal.
4. Never deduct coins or free credits again.
5. Never reroll any reward.
6. Mark the reveal completed after the final reward is dismissed.

This makes the system reliable on unstable festival connections.

---

# Suggested Data Shapes

## Chest Types

```ts
type ChestType =
  | "small"
  | "medium"
  | "big";

type ChestPaymentType =
  | "coins"
  | "free_credit";
```

---

## Reward Slot Types

```ts
type ChestSlotType =
  | "regular"
  | "premium";

type RewardCategory =
  | "coins"
  | "equipment"
  | "consumable"
  | "chaos_card";

type ItemRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary";
```

---

## Chest Reward

```ts
type ChestReward = {
  slotIndex: number;
  slotType: ChestSlotType;
  isChestSetBonus: boolean;

  category: RewardCategory;

  rarity?: ItemRarity;
  itemId?: string;
  itemName?: string;

  coinAmount?: number;

  wasOverflowConverted: boolean;
  overflowCoinAmount?: number;
};
```

---

## Chest Opening Record

```ts
type ChestOpening = {
  id: string;
  playerId: string;

  chestType: ChestType;
  paymentType: ChestPaymentType;

  referencePrice: number;
  pricePaid: number;

  chestSetChance: number;
  chestSetTriggered: boolean;

  rewards: ChestReward[];

  createdAt: string;
  transactionCompletedAt: string;

  revealCompletedAt?: string;
};
```

---

## Free Opening Credits

```ts
type FreeChestCredits = {
  small: number;
  medium: number;
  big: number;
};
```

---

# Suggested Configuration

```ts
const CHEST_CONFIG = {
  small: {
    price: 25,
    baseRewardSlotCount: 1,

    slots: [
      {
        type: "premium",

        categoryWeights: {
          equipment: 1,
          consumable: 1,
          chaosCard: 1,
        },

        rarityWeights: {
          common: 79.0,
          rare: 18.0,
          epic: 2.8,
          legendary: 0.2,
        },
      },
    ],
  },

  medium: {
    price: 70,
    baseRewardSlotCount: 2,

    slots: [
      {
        type: "regular",

        rewardTypeWeights: {
          coins: 50,
          consumable: 50,
        },

        coinRange: {
          min: 15,
          max: 30,
        },

        consumableRarityWeights: {
          common: 55,
          rare: 30,
          epic: 10,
          legendary: 5,
        },
      },

      {
        type: "premium",

        categoryWeights: {
          equipment: 50,
          consumable: 10,
          chaosCard: 40,
        },

        rarityWeights: {
          common: 50,
          rare: 37,
          epic: 12,
          legendary: 1,
        },
      },
    ],
  },

  big: {
    price: 200,
    baseRewardSlotCount: 3,

    slots: [
      {
        type: "regular",

        rewardTypeWeights: {
          coins: 50,
          consumable: 50,
        },

        coinRange: {
          min: 20,
          max: 45,
        },

        consumableRarityWeights: {
          common: 30,
          rare: 35,
          epic: 20,
          legendary: 15,
        },
      },

      {
        type: "premium",

        categoryWeights: {
          equipment: 50,
          consumable: 10,
          chaosCard: 40,
        },

        rarityWeights: {
          common: 20,
          rare: 45,
          epic: 30,
          legendary: 5,
        },
      },

      {
        type: "premium",

        categoryWeights: {
          equipment: 50,
          consumable: 10,
          chaosCard: 40,
        },

        rarityWeights: {
          common: 20,
          rare: 45,
          epic: 30,
          legendary: 5,
        },
      },
    ],
  },
} as const;
```

---

## Chest Set Configuration

```ts
const CHEST_SET_BONUS = {
  helmet: 0.02,
  boots: 0.02,
  legs: 0.06,
  armor: 0.10,
  fullSetBonus: 0.05,
  maximumChance: 0.25,

  bonusSlotType: "premium",
  maximumBonusRewardsPerOpening: 1,
  recursiveTriggerAllowed: false,
};
```

---

## Overflow Configuration

```ts
const CHEST_OVERFLOW_CONFIG = {
  refundRate: 0.50,

  refundPerOverflow: {
    small: 12,
    medium: 17,
    big: 33,
  },

  maximumRefundPerOpening: {
    small: 12,
    medium: 35,
    big: 100,
  },
};
```

---

# Suggested Weighted Roll Helper

```ts
type WeightedOption<T> = {
  value: T;
  weight: number;
};

function weightedRandom<T>(
  options: WeightedOption<T>[],
  randomValue: number
): T {
  const totalWeight = options.reduce(
    (sum, option) => sum + option.weight,
    0
  );

  let cursor = randomValue * totalWeight;

  for (const option of options) {
    cursor -= option.weight;

    if (cursor < 0) {
      return option.value;
    }
  }

  return options[options.length - 1].value;
}
```

The production implementation should use a secure server-side random source appropriate for the selected backend.

Do not trust random results sent by the client.

---

# Idempotency and Anti-Exploit Rules

| Rule | Purpose |
| ---- | ------- |
| All reward rolls happen server-side | Prevent client manipulation |
| Payment and rewards are one transaction | Prevent payment without reward |
| Free credit consumption and rewards are one transaction | Prevent double use |
| Chest opening request uses an idempotency key | Prevent duplicate processing |
| Limited equipment is atomically reserved | Prevent duplicate unique items |
| Animation starts after transaction success | Prevent visual/result mismatch |
| Rewards are immutable after creation | Prevent rerolling |
| Incomplete reveal resumes from saved data | Prevent lost rewards |
| Chest Set bonus checks once | Prevent recursive bonus farming |
| Maximum one bonus reward | Preserve equipment design |
| Stack overflow does not reroll | Preserve economy rules |
| Hospitalized players cannot open chests | Match Hospital rules |
| Device time does not affect rewards | Prevent manipulation |
| Coin ranges use server-generated whole numbers | Preserve integer rule |

---

# Acceptance Tests

## Small Chest Purchase

```text
Given a player has 25 coins and no free Small opening,
when the player opens a Small Chest,
then 25 coins are deducted,
one Small Premium reward is generated,
and no direct coin reward can be selected.
```

---

## Small Chest Insufficient Coins

```text
Given a player has fewer than 25 coins
and no free Small opening,
when the Small Chest modal opens,
then the Open button is disabled
and the required amount is displayed in red or light red.
```

---

## Free Chest Priority

```text
Given a player has one free Medium opening
and at least 70 coins,
when the player opens a Medium Chest,
then the free credit is consumed
and no coins are deducted.
```

---

## Medium Slot Order

```text
When a Medium Chest is opened,
then Reward 1 uses the Medium Regular rules
and Reward 2 uses the Medium Premium rules.
```

---

## Big Slot Order

```text
When a Big Chest is opened,
then Reward 1 uses the Big Regular rules,
Reward 2 uses the Big Premium rules,
and Reward 3 uses the Big Premium rules.
```

---

## Medium Regular Legendary Consumable

```text
Given the Medium Regular slot selects Consumable
and then rolls Legendary,
then a Legendary consumable is granted
using the Medium Regular 5% Legendary weight.
```

---

## Big Regular Legendary Consumable

```text
Given the Big Regular slot selects Consumable
and then rolls Legendary,
then a Legendary consumable is granted
using the Big Regular 15% Legendary weight.
```

---

## Regular Slot Exclusions

```text
When a Regular slot is resolved,
then it can never grant equipment
and can never grant a Chaos Card.
```

---

## Premium Slot Categories

```text
When a Premium slot is resolved,
then it can grant equipment, consumables, or Chaos Cards
according to the chest-specific category weights.
```

---

## Big Double Common

```text
Given both Big Premium slots roll Common,
then both Common rewards remain valid
and no forced Rare-or-better reroll occurs.
```

---

## Chest Set Bonus

```text
Given a player has a 25% Chest Set chance
and the bonus check succeeds while opening a Big Chest,
then exactly one additional Big Premium reward is generated.
```

---

## No Recursive Bonus

```text
Given the Chest Set grants an additional reward,
then the additional reward does not trigger another Chest Set check.
```

---

## Exhausted Legendary Equipment

```text
Given a Premium slot rolls Legendary Equipment
but all Legendary equipment is exhausted,
then the system preserves Legendary rarity
and rerolls between Legendary Consumable
and Legendary Chaos Card.
```

---

## Maximum Stack Overflow

```text
Given a Big Chest selects a consumable
that the player already owns at quantity 10,
then the item is not added,
the reward is not rerolled,
and 33 coins are granted,
subject to the 100-coin opening cap.
```

---

## App Closed During Animation

```text
Given the server completed and saved a chest opening,
when the player closes the app during the animation,
then reopening the app resumes the saved reveal
without charging or rerolling again.
```

---

## Duplicate Open Request

```text
Given an Open request has already completed,
when the same idempotency key is submitted again,
then the existing opening result is returned
and no additional payment or rewards occur.
```

---

# Design Decisions Summary

| Topic | Decision |
| ----- | -------- |
| Chest inventory | Not used |
| Opening behavior | Immediate |
| Small price | 25 coins |
| Medium price | 70 coins |
| Big price | 200 coins |
| Small rewards | 1 Premium |
| Medium rewards | 1 Regular + 1 Premium |
| Big rewards | 1 Regular + 2 Premium |
| Regular categories | Coins or Consumables |
| Premium categories | Equipment, Consumables, Chaos Cards |
| Medium Regular coins | 15–30 |
| Big Regular coins | 20–45 |
| Medium Regular consumable rarity | 55/30/10/5 |
| Big Regular consumable rarity | 30/35/20/15 |
| Small Premium categories | Equal thirds |
| Small Premium rarity | 79/18/2.8/0.2 |
| Medium Premium category | 50 Equipment / 10 Consumable / 40 Chaos |
| Medium Premium rarity | 50/37/12/1 |
| Big Premium category | 50 Equipment / 10 Consumable / 40 Chaos |
| Big Premium rarity | 20/45/30/5 |
| Big double-Common result | Allowed |
| Coin range distribution | Uniform whole number |
| Chest Set full chance | 25% |
| Chest Set bonus reward | One matching Premium slot |
| Recursive Chest Set trigger | No |
| Epic copies per equipment item | 4 globally |
| Legendary copies per equipment item | 1 globally |
| Exhausted equipment result | Preserve rarity, reroll category |
| Item stack limit | 10 per Consumable or Chaos Card |
| Overflow behavior | Coin conversion, no reroll |
| Free chest storage | Opening credits |
| Hospital opening | Not allowed |
| Reward generation | Server-side |
| Reward granting | Before animation |
| Animation purpose | Reveal only |
| Interrupted reveal | Resume saved result |

---

# Current Status

This Chest system is approved as the first version for Kempape.

The final Regular consumable rarity probabilities are:

```text
Medium Regular:
Common 55%
Rare 30%
Epic 10%
Legendary 5%
```

```text
Big Regular:
Common 30%
Rare 35%
Epic 20%
Legendary 15%
```

The final Premium configurations are:

```text
Small Premium:
Categories: equal thirds
Rarity: 79% / 18% / 2.8% / 0.2%
```

```text
Medium Premium:
Equipment 50%
Consumable 10%
Chaos Card 40%

Rarity:
50% / 37% / 12% / 1%
```

```text
Big Premium:
Equipment 50%
Consumable 10%
Chaos Card 40%

Rarity:
20% / 45% / 30% / 5%
```

This handoff should be added to the Kempape game logic project as the source of truth for chest opening, reward generation, probabilities, UI behavior, and implementation rules.
