# Kempape — Economy System Handoff

## Purpose

This document defines the first version of the Kempape coin economy.

The economy should:

* Let players open approximately 10–20 purchased chests per day.
* Make chest opening a frequent and exciting activity.
* Reward participation without requiring constant app attention.
* Prevent duplicate items and passive income from creating unlimited coins.
* Remain simple enough for the MVP.

Chest contents, reward quantities, rarity probabilities, and Daily Wheel results will be defined separately.

---

# Core Currency

Kempape has one spendable currency:

```text
Coins
```

Coins are earned from:

* Validated actions.
* Daily Quests.
* First-time level rewards.
* Epic Gold equipment.
* Consumable and Chaos Card overflow refunds.
* Possible future Daily Wheel results.
* Chests

Coins are spent on:

* Small Chests.
* Medium Chests.
* Big Chests.

For the MVP, there are no other purchases.

---

# Starting Balance

Every player begins the festival with:

```text
50 coins
```

This allows every player to immediately purchase:

```text
2 Small Chests
```

The starting balance introduces the chest-opening loop before the player completes any actions.

---

# Chest Prices

| Chest        |     Price |
| ------------ | --------: |
| Small Chest  |  25 coins |
| Medium Chest |  70 coins |
| Big Chest    | 200 coins |

These prices are intentionally affordable because chest opening is one of the primary game loops.

## Purchasing-Power Examples

| Reward source    | Coins | Approximate value         |
| ---------------- | ----: | ------------------------- |
| Common Action    |    10 | 40% of a Small Chest      |
| Rare Action      |    25 | 1 Small Chest             |
| Epic Action      |    50 | 2 Small Chests            |
| Legendary Action |   100 | 4 Small Chests            |
| Extreme Action   |   150 | More than 2 Medium Chests |

Chest reward slots, reward pools, and rarity chances are not defined in this handoff.

---

# Action Coin Rewards

Keep the approved action coin values:

| Action tier                | Coin reward |
| -------------------------- | ----------: |
| Common                     |    10 coins |
| Rare                       |    25 coins |
| Epic                       |    50 coins |
| Legendary                  |   100 coins |
| Extreme Festival Challenge |   150 coins |

Coins are granted only after another active player successfully validates the action.

The validator does not receive a direct reward for accepting an individual action.

Validation-based Daily Quests may reward validators separately.

---

# Daily Quest Economy

Each player receives six Daily Quests:

| Difficulty      | Number available | Coins per quest | Maximum coins |
| --------------- | ---------------: | --------------: | ------------: |
| Easy            |                3 |              15 |            45 |
| Medium          |                2 |              30 |            60 |
| Hard            |                1 |              95 |            95 |
| **Daily total** |            **6** |               — |       **200** |

Completing all Daily Quests grants:

```text
200 coins per day
```

Equivalent purchasing power:

```text
7 Small Chests with 5 coins remaining
```

Daily Quest requirements will be defined in a separate Daily Quest handoff.

The planned quest structure may include:

* Completing validated actions.
* Completing actions of specific tiers.
* Completing different action types.
* Accepting actions from the Action Pool.

Only successfully accepted actions count toward Daily Quest progress.

Rejected, expired, duplicated, or failed submissions do not count.

---

# Validation Quest Principle

Some Daily Quests should reward players for accepting other players’ actions.

This gives players a reason to regularly check the Action Pool without changing the core rule:

```text
A single validation grants no direct XP or coins.
```

The quest grants the reward only after its full requirement has been completed.

Recommended validation quest requirements should account for the small group size and will be finalized in the Daily Quest handoff.

---

# First-Time Level Rewards

Players receive coins the first time they reach each level.

| Level type        |    Coin reward |
| ----------------- | -------------: |
| Normal level      |        5 coins |
| Every fifth level | 15 coins total |

Milestone levels:

```text
5, 10, 15, 20, 25, 30, 35, 40
```

The 15-coin milestone reward replaces the normal 5-coin reward for that level.

It is not an additional 15 coins.

## Total Festival Level Coins

Across levels 2–40:

```text
31 normal levels × 5 coins = 155 coins
8 milestone levels × 15 coins = 120 coins

Total = 275 coins
```

Level coins are awarded only once per level.

If a player loses XP, levels down, and reaches the same level again, they do not receive those coins again.

Use the existing `claimedLevelRewards` system.

---
# Epic Gold Set Economy

Gold equipment passively generates coins.

Gold is generated every hour while the equipment remains continuously equipped.

## Piece Generation

| Equipped piece     | Coins every hour | Maximum over 24 continuous hours |
| ------------------ | ---------------: | -------------------------------: |
| Helmet             |                1 |                               24 |
| Boots              |                1 |                               24 |
| Legs               |                2 |                               48 |
| Armor              |                3 |                               72 |
| Piece total        |                7 |                              168 |
| Full-set bonus     |               +3 |                              +72 |
| **Full-set total** |           **10** |                          **240** |

Formula:

```text
Full Gold Set:
10 coins every hour
```

There is no daily generation cap.

The player may keep the equipment active for the entire festival.

Gold continues accumulating:

* While the player is offline.
* While the player is sleeping.
* While the player is hospitalized.
* Without requiring a claim button.

Gold does not accumulate while the player is Chaos-locked or while the whole game run is paused.

Partial hourly progress is preserved and resumes from the same point after unlocking or resuming.

A complete Gold Set generates:

```text
10 coins per hour
240 coins over 24 continuous hours
```

At the current chest prices, this is enough to purchase one Big Chest with 40 coins remaining.

The full set is intentionally powerful because the player must equip all four Gold pieces and therefore gives up regeneration, damage, dodge, protection, thorns, and other equipment effects.

---

## Gold Accrual Rules

Each equipped Gold item has its own continuous equipment timer.

A payout requires the item to remain equipped for one complete hour.

```text
completedIntervals =
floor(continuousEquippedTime ÷ 1 hour)

coinsGenerated =
completedIntervals × itemHourlyPayout
```

Coins should be granted automatically whenever a complete hourly interval finishes.

When a Gold item is unequipped:

1. Grant coins for any completed hourly intervals not already processed.
2. Discard incomplete hourly progress.
3. Reset that item’s timer.

Example:

```text
Gold Armor has been equipped for 5 hours and 40 minutes.

5 complete intervals have passed.
Reward = 5 × 3 coins = 15 coins.

The remaining 40 minutes do not produce coins.
```

This prevents players from equipping Gold items immediately before a fixed global payout.

Each item tracks its own timer independently.

Example:

```text
Helmet equipped at 10:00.
Armor equipped at 10:30.

Helmet first payout: 11:00.
Armor first payout: 11:30.
```

---

## Full-Set Bonus Timer

The additional `+3 coins per hour` uses a separate full-set timer.

The timer begins when all four Gold pieces are equipped simultaneously.

If any Gold piece is removed:

1. Grant any completed full-set hourly intervals not already processed.
2. Discard the unfinished full-set interval.
3. Reset the full-set timer.

Example:

```text
All four Gold pieces have been equipped together for 3 hours and 20 minutes.

3 full-set intervals have passed.
Bonus reward = 3 × 3 coins = 9 coins.

The remaining 20 minutes are discarded if any piece is removed.
```

The complete hourly payout is:

```text
Helmet: 1 coin
Boots: 1 coin
Legs: 2 coins
Armor: 3 coins
Full-set bonus: 3 coins

Total: 10 coins per hour
```

---

## Gold Set Summary

| Rule                                  |               Decision |
| ------------------------------------- | ---------------------: |
| Generation interval                   |             Every hour |
| Helmet generation                     |            1 coin/hour |
| Boots generation                      |            1 coin/hour |
| Legs generation                       |           2 coins/hour |
| Armor generation                      |           3 coins/hour |
| Full-set bonus                        |           3 coins/hour |
| Full-set total                        |          10 coins/hour |
| Maximum theoretical output            | 240 coins per 24 hours |
| Daily cap                             |                   None |
| Offline generation                    |                    Yes |
| Hospital generation                   |                    Yes |
| Claim button required                 |                     No |
| Incomplete interval after unequipping |              Discarded |

---

# Consumable and Chaos Card Overflow

Consumables and Chaos Cards have a maximum quantity of 10 per item type.

When a chest awards an item already at quantity 10:

* Do not add the item.
* Grant an overflow coin refund.
* Calculate the refund from the chest price and number of reward slots.

## Refund Formula

```text
refundPerOverflow =
floor(
  (chestPrice × 0.50)
  ÷ chestRewardSlotCount
)
```

The refund uses `Math.floor()`.

Decimals are always rounded down.

## Example

Suppose a Big Chest costs 200 coins and contains three reward slots:

```text
refundPerOverflow =
floor((200 × 0.50) ÷ 3)

refundPerOverflow =
floor(100 ÷ 3)

refundPerOverflow = 33 coins
```

| Overflowing rewards | Total refund |
| ------------------: | -----------: |
|                   1 |     33 coins |
|                   2 |     66 coins |
|                   3 |     99 coins |

A completely overflowing chest refunds approximately half its price.

The player never profits from overflow.

## Maximum Refund Principle

```text
Total overflow refund from one chest
must never exceed 50% of that chest’s price.
```

Free level-milestone chests use the normal shop price of their chest type as their reference price.

The final number of reward slots for each chest will be defined in the Chest System handoff.

---

# Duplicate Equipment

## Common and Rare Equipment

Common and Rare equipment may appear multiple times.

Duplicate Common and Rare pieces:

* Remain in the player’s inventory.
* Are not automatically converted into coins.
* Cannot be sold in the MVP.
* Cannot be recycled in the MVP.
* Cannot be merged in the MVP.

This avoids introducing an uncontrolled coin source.

Duplicate equipment may gain a purpose in a future version through:

* Trading.
* Recycling.
* Crafting.
* Item merging.
* Selling.

None of these systems are included in the first MVP.

---

## Epic and Legendary Equipment Supply

| Equipment rarity | Global copies per specific item |
| ---------------- | ------------------------------: |
| Common           |                       Unlimited |
| Rare             |                       Unlimited |
| Epic             |                        4 copies |
| Legendary        |                          1 copy |

When all four copies of a specific Epic item have been claimed, that item is removed from the global chest reward pool.

When the unique copy of a Legendary item has been claimed, it is removed from the global chest reward pool.

Epic equipment uses **four copies**, replacing the previous three-copy rule.

---

# Coin Balance Rules

## Integer Rule

All coin values must be whole numbers.

Use:

```text
Math.floor()
```

for half-price overflow calculations.

Use configured whole-number values for normal rewards and purchases.

## Non-Negative Balance

A player’s balance can never fall below zero.

```text
coins = max(coins, 0)
```

A chest purchase must fail when the player cannot afford its full price.

## Atomic Transactions

Chest purchases and coin rewards must be processed server-side and atomically.

A chest purchase should:

1. Confirm the player has enough coins.
2. Deduct the complete chest price.
3. Generate all rewards.
4. Calculate any overflow refunds.
5. Grant rewards and refunds.
6. Save the completed transaction.

If the transaction fails, no coins or rewards should change.

---

# No Equipment Resale

For the MVP:

* Equipment cannot be sold.
* Consumables cannot be sold.
* Chaos Cards cannot be sold.
* Items cannot be traded.
* Coins cannot be transferred between players.

This protects the economy from uncontrolled farming, collusion, and duplicate conversion.

---

# Hospital Economy Rules

A hospitalized player cannot:

* Purchase chests.
* Open chests.
* Complete actions.
* Validate actions.
* Complete Daily Quests through new activity.

Passive Gold equipment continues generating coins.

Any coins already earned remain in the player’s account.

---

# Expected Daily Economy

These are approximate balance targets rather than guaranteed payouts.

## Casual Player

| Source         | Approximate coins |
| -------------- | ----------------: |
| Actions        |           180–200 |
| Daily Quests   |             40–60 |
| Level rewards  |             25–40 |
| Gold equipment |                 0 |
| **Total**      |       **245–300** |

Expected chest purchases:

```text
Approximately 9–11 Small-equivalent chests
```

---

## Active Player

| Source         | Approximate coins |
| -------------- | ----------------: |
| Actions        |           400–500 |
| Daily Quests   |           140–180 |
| Level rewards  |             50–75 |
| Gold equipment |              0–48 |
| **Total**      |       **590–803** |

Expected chest purchases:

```text
Approximately 13–17 mixed chests
```

---

## Very Active Player

| Source        | Approximate coins |
| ------------- | ----------------: |
| Actions       |           650–750 |
| Daily Quests  |               180 |
| Level rewards |             60–75 |
| Full Gold Set |               240 |
| **Total**     |   **1,150–1,265** |

Expected chest purchases:

```text
Approximately 18–21 mixed chests
```

The target is not that every player buys exactly the same number of chests.

The intended progression is:

| Player type | Purchased chests per day |
| ----------- | -----------------------: |
| Casual      |                Around 10 |
| Active      |             Around 14–17 |
| Very active |             Around 18–20 |

Free milestone chests are additional and do not count toward this target.

---

# Economy Configuration

```ts
const ECONOMY_CONFIG = {
  startingCoins: 50,

  chestPrices: {
    small: 25,
    medium: 70,
    big: 200,
  },

  actionCoinRewards: {
    common: 10,
    rare: 25,
    epic: 50,
    legendary: 100,
    extreme: 150,
  },

  dailyQuestCoinRewards: {
  easy: 15,
  medium: 30,
  hard: 95,
},

dailyQuestCounts: {
  easy: 3,
  medium: 2,
  hard: 1,
},

  levelRewards: {
    normal: 5,
    milestone: 15,
  },

  goldGenerationIntervalMinutes: 60,

goldGeneration: {
  helmet: 1,
  boots: 1,
  legs: 2,
  armor: 3,
  fullSetBonus: 3,
},

  overflowRefundRate: 0.50,

  equipmentCopyLimits: {
    common: null,
    rare: null,
    epic: 4,
    legendary: 1,
  },
};
```

---

# Out of Scope

The following will be defined in separate handoffs:

* Chest reward slots.
* Chest reward contents.
* Chest rarity probabilities.
* Equipment drop rates.
* Consumable drop rates.
* Chaos Card drop rates.
* Extra reward behavior from the Epic Chest Set.
* Daily Wheel rewards and probabilities.
* Fortune Ticket expected value.
* Exact Daily Quest requirements.

---
