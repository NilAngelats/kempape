# Kempape — Consumables System Handoff

## Purpose

This document defines the consumable inventory, shared usage behavior, and the first seven consumable items.

Chaos Cards are also consumables, but their effects and values will be defined in a separate handoff.

---

## Consumable List

| Consumable          | Rarity    | Main effect                                          |
| ------------------- | --------- | ---------------------------------------------------- |
| Small Health Potion | Common    | Restores 25 HP                                       |
| XP Candy            | Common    | Grants 5% of the XP needed for the next level        |
| Big Health Potion   | Rare      | Restores 60 HP                                       |
| Fortune Ticket      | Rare      | Grants one free Daily Wheel spin                     |
| Experience Potion   | Epic      | Grants 30% of the XP needed for the next level       |
| Discharge Pill      | Epic      | Reduces the current Hospital countdown by 20 minutes |
| Golden Hourglass    | Legendary | Resets all eligible action cooldowns                 |

All consumables are one-time-use items.

---

# Inventory Rules

## Stack Limit

Each consumable type has its own maximum inventory quantity:

```text
Maximum quantity per consumable type = 10
```

Example:

```text
A player may hold:
- 10 Small Health Potions
- 10 XP Candies
- 10 Big Health Potions
- 10 Fortune Tickets
```

The limit applies independently to every consumable type.

---

## Overflow Compensation

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

# Standard Consumable Modal

When the player taps a consumable in the inventory, display a modal containing:

1. Item name.
2. Item image.
3. Short description.
4. Cancel button.
5. Use button.

## Cancel Button

```text
Close the modal.
Do not consume the item.
Do not trigger its effect.
```

## Use Button

For standard consumables:

1. Validate that the item can currently be used.
2. Trigger the effect immediately.
3. Remove one copy from the inventory.
4. Close the modal.
5. Refresh the affected player values.

```text
inventoryQuantity = inventoryQuantity - 1
```

No additional confirmation screen is required.

If the item cannot currently be used, the Use button should be disabled and the item should not be consumed.

---

# Common — Small Health Potion

## Effect

Restores 25 HP immediately.

```text
healing = 25 HP
currentHp = min(currentHp + healing, maxHp)
```

The potion cannot increase Max HP or heal above Max HP.

Equipment from the Potion Set may increase the final healing amount.

## Usage Restrictions

* Cannot be used at full HP.
* Cannot be used while hospitalized.
* Consumed immediately after successful use.

## UI Description

```text
Restores 25 HP.
```

## Visual Direction

A small glass potion bottle containing bright red healing liquid.

It should look clearly smaller and less powerful than the Big Health Potion.

---

# Common — XP Candy

## Effect

Immediately grants 5% of the XP needed for the player’s next level.

```text
xpGained = ceil(xpNeededForNextLevel × 0.05)
```

The XP is added immediately and may cause the player to level up.

Normal level-up rules and one-time level rewards still apply.

## Usage Restrictions

* Cannot be used at level 40.
* Consumed immediately after successful use.
* Does not use a timed XP multiplier.

## UI Description

```text
Grants 5% of the XP needed for your next level.
```

## Visual Direction

A bright wrapped candy with a small star or XP symbol.

It should look playful, common, and easy to recognize.

---

# Rare — Big Health Potion

## Effect

Restores 60 HP immediately.

```text
healing = 60 HP
currentHp = min(currentHp + healing, maxHp)
```

The potion cannot increase Max HP or heal above Max HP.

Equipment from the Potion Set may increase the final healing amount.

## Usage Restrictions

* Cannot be used at full HP.
* Cannot be used while hospitalized.
* Consumed immediately after successful use.

## UI Description

```text
Restores 60 HP.
```

## Visual Direction

A large glass potion bottle filled with glowing red healing liquid.

It should be visibly larger and more valuable than the Small Health Potion.

---

# Rare — Fortune Ticket

## Effect

Grants the player one free spin on the Daily Wheel.

When the player selects Use:

1. Consume one Fortune Ticket.
2. Grant one pending free wheel spin.
3. Close the item modal.
4. Redirect the player to the Daily Wheel screen.

The Fortune Ticket spin is separate from the player’s normal daily spin.

```text
pendingFortuneSpins = pendingFortuneSpins + 1
```

When the player completes the spin:

```text
pendingFortuneSpins = pendingFortuneSpins - 1
```

The wheel result is applied normally, including positive or negative results.

## Usage Restrictions

* Does not reset the normal daily spin.
* Each ticket grants exactly one additional spin.
* Consumed when the free spin is granted.
* Fortune Tickets can be saved and used on another festival day.

## UI Description

```text
Grants one free Daily Wheel spin.
```

## Visual Direction

A colorful festival ticket containing a wheel, clover, or luck symbol.

It should look valuable but clearly below the Legendary Golden Hourglass.

---

# Epic — Experience Potion

## Effect

Immediately grants 30% of the XP needed for the player’s next level.

```text
xpGained = ceil(xpNeededForNextLevel × 0.30)
```

The XP is added immediately and may cause the player to level up.

Normal level-up rules and one-time level rewards still apply.

## Usage Restrictions

* Cannot be used at level 40.
* Consumed immediately after successful use.
* Does not create a temporary XP multiplier.
* Does not use the action or quest level-band multiplier.

## UI Description

```text
Grants 30% of the XP needed for your next level.
```

## Visual Direction

A glowing purple or blue potion containing stars, energy, or floating XP particles.

It must look clearly different from the red Health Potions.

---

# Epic — Discharge Pill

## Effect

Reduces the player’s remaining Hospital time by 20 minutes.

```text
newHospitalTime = remainingHospitalTime - 20 minutes
```

If the remaining time becomes zero or less, release the player from the Hospital immediately.

The player leaves with the normal Hospital exit HP:

```text
currentHp = ceil(maxHp × 0.75)
```

The pill does not restore additional HP and does not reverse the XP penalty from death.

## Special Usage Flow

The Discharge Pill cannot be used from the normal inventory modal.

While hospitalized, the player sees:

1. Hospital countdown.
2. Remaining Discharge Pill quantity.
3. Use Discharge Pill button.

When the player presses the button:

1. Validate that at least one pill is available.
2. Remove one pill from the inventory.
3. Reduce the countdown by 20 minutes.
4. Update the Hospital screen immediately.
5. Release the player if the countdown reaches zero.

## Usage Restrictions

* Can only be used while hospitalized.
* Maximum one Discharge Pill per Hospital stay.
* Cannot be used before death or saved as a passive effect.
* This is the only consumable usable from the Hospital screen.

## UI Description

```text
Reduces your remaining Hospital time by 20 minutes.
```

## Visual Direction

A medical pill or capsule with a small red cross, clock, or Hospital symbol.

It should be recognizable as medicine rather than a fantasy potion.

---

# Legendary — Golden Hourglass

## Effect

Immediately resets all currently active eligible action cooldowns.

```text
For every eligible action:
cooldownEndsAt = currentTime
```

After successful use, the player may perform those actions again immediately.

## Cooldowns

The Golden Hourglass resets normal time-based action cooldowns.

It does not reset:

* Daily Quests.
* The Daily Wheel.
* Once-per-day limits.
* Once-per-festival limits.
* Legendary or special usage limits.
* Phoenix daily activation.
* Actions without cooldowns.

## Usage Restrictions

* Cannot be used if the player has no eligible active cooldowns.
* Cannot be used while hospitalized.
* Consumed immediately after successful use.
* Resets all eligible cooldowns at once; the player does not select individual actions.

## UI Description

```text
Resets all active action cooldowns.
```

## Visual Direction

An ornate golden hourglass with glowing or magical sand.

It should look powerful, unique, and unmistakably Legendary.

---

# Suggested Data Shape

```ts
type ConsumableType =
  | "small_health_potion"
  | "xp_candy"
  | "big_health_potion"
  | "fortune_ticket"
  | "experience_potion"
  | "discharge_pill"
  | "golden_hourglass";

type ConsumableDefinition = {
  id: ConsumableType;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  description: string;
  maxQuantity: 10;
  usableFromInventory: boolean;
  imageKey: string;
};

type ConsumableInventory = Record<ConsumableType, number>;
```

---

# Item Definitions

```ts
const CONSUMABLES: ConsumableDefinition[] = [
  {
    id: "small_health_potion",
    name: "Small Health Potion",
    rarity: "common",
    description: "Restores 25 HP.",
    maxQuantity: 10,
    usableFromInventory: true,
    imageKey: "small_health_potion",
  },
  {
    id: "xp_candy",
    name: "XP Candy",
    rarity: "common",
    description: "Grants 5% of the XP needed for your next level.",
    maxQuantity: 10,
    usableFromInventory: true,
    imageKey: "xp_candy",
  },
  {
    id: "big_health_potion",
    name: "Big Health Potion",
    rarity: "rare",
    description: "Restores 60 HP.",
    maxQuantity: 10,
    usableFromInventory: true,
    imageKey: "big_health_potion",
  },
  {
    id: "fortune_ticket",
    name: "Fortune Ticket",
    rarity: "rare",
    description: "Grants one free Daily Wheel spin.",
    maxQuantity: 10,
    usableFromInventory: true,
    imageKey: "fortune_ticket",
  },
  {
    id: "experience_potion",
    name: "Experience Potion",
    rarity: "epic",
    description: "Grants 30% of the XP needed for your next level.",
    maxQuantity: 10,
    usableFromInventory: true,
    imageKey: "experience_potion",
  },
  {
    id: "discharge_pill",
    name: "Discharge Pill",
    rarity: "epic",
    description: "Reduces your remaining Hospital time by 20 minutes.",
    maxQuantity: 10,
    usableFromInventory: false,
    imageKey: "discharge_pill",
  },
  {
    id: "golden_hourglass",
    name: "Golden Hourglass",
    rarity: "legendary",
    description: "Resets all active action cooldowns.",
    maxQuantity: 10,
    usableFromInventory: true,
    imageKey: "golden_hourglass",
  },
];
```
