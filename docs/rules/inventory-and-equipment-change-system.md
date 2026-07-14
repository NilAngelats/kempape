# Kempape — Inventory & Equipment Change System Handoff

## Purpose

This document defines the first complete version of the Kempape Inventory system and the equipment equip/unequip cooldown rules.

The Inventory stores all player-owned:

* Equipment.
* Consumables.
* Chaos Cards.

The Inventory should make every item easy to inspect and should provide the correct action depending on the item type:

* Consumables can normally be used.
* Chaos Cards can be used against another valid player.
* Equipment can be equipped or unequipped.
* The Discharge Pill is used only from the Hospital screen.

The equipment system must prevent players from constantly changing items to benefit from every situation.

Equipment is intended to be a strategic commitment.

A player should think ahead before choosing:

* Damage.
* Regeneration.
* Gold generation.
* Protection.
* Dodge.
* Thorns.
* Potion bonuses.
* Hospital reduction.
* Chest bonuses.
* Phoenix survival.

Players should not be able to:

* Equip Damage equipment immediately before attacking.
* Change to Regeneration immediately afterward.
* Equip the Chest Set only for the instant they open a chest.
* Equip Gold equipment only for a payout moment.
* Change into defensive equipment immediately before incoming damage.
* Switch between all set effects without meaningful commitment.

For the MVP, this is controlled with a separate cooldown on every individual equipment item.

---

# Inventory Categories

The Inventory contains three main categories:

| Category | Stored content | Main item action |
| -------- | -------------- | ---------------- |
| Equipment | Helmets, Armor, Legs, Boots | Equip or Unequip |
| Consumables | Potions, Candy, Tickets, Pills, Hourglass | Use |
| Chaos Cards | Player-targeted attack cards | Select target and Use |

Recommended UI:

```text
Equipment | Consumables | Chaos Cards
```

Tabs, segmented controls, or filters may be used.

The player may inspect all inventory items while equipment cooldowns are active.

---

# General Item Modal

When a player taps any inventory item, open a modal.

Every item modal displays:

1. Item image.
2. Item title.
3. Item rarity.
4. Item category.
5. Short description.
6. Quantity, when stackable.
7. Context-specific action controls.
8. Cancel or close control.

The modal should reuse the same item image, title, and description used in chest and wheel reward reveals.

The available controls depend on the item category.

---

# Inventory Quantity Rules

## Consumables and Chaos Cards

Consumables and Chaos Cards are stackable.

Maximum quantity:

```text
10 copies per specific item type
```

Example:

```text
10 Small Health Potions
10 Fortune Tickets
10 Mirror cards
```

Each type has its own independent quantity.

When one is successfully used:

```text
quantity = quantity - 1
```

---

## Equipment

Equipment is not stacked into one quantity counter.

Each equipment copy is an owned inventory instance.

This matters because:

* Common and Rare equipment may have duplicates.
* Epic equipment has limited global copies.
* Legendary equipment is unique.
* Each equipment item instance has its own equip state.
* Each equipment item instance has its own cooldown.

Recommended equipment instance fields:

```ts
type EquipmentInventoryItem = {
  inventoryItemId: string;
  equipmentDefinitionId: string;

  ownerPlayerId: string;

  rarity: "common" | "rare" | "epic" | "legendary";
  slot: "helmet" | "armor" | "legs" | "boots";
  setLine: string;

  isEquipped: boolean;
  equipmentCooldownEndsAt?: string;

  acquiredAt: string;
};
```

---

# Consumable Modal

A standard consumable modal displays:

* Item image.
* Name.
* Rarity.
* Description.
* Quantity owned.
* Use button.
* Cancel button.

When Use is pressed:

1. Revalidate ownership.
2. Revalidate that the item can currently be used.
3. Apply the effect.
4. Remove one copy.
5. Save the transaction.
6. Close the modal.
7. Refresh affected player data.

The Use button must be disabled when the item is not currently usable.

---

# Consumable-Specific Behavior

## Small Health Potion

Use is enabled only when:

* The player is not hospitalized.
* Current HP is below Max HP.
* At least one potion is owned.

Effect:

```text
Restore 25 HP
```

Potion Set bonuses apply.

---

## XP Candy

Use is enabled only when:

* The player is below level 40.
* At least one candy is owned.

Effect:

```text
Grant 5% of XP needed for the next level
```

---

## Big Health Potion

Use is enabled only when:

* The player is not hospitalized.
* Current HP is below Max HP.
* At least one potion is owned.

Effect:

```text
Restore 60 HP
```

Potion Set bonuses apply.

---

## Fortune Ticket

Use is enabled only when:

* The player is not hospitalized.
* At least one Fortune Ticket is owned.

Effect:

```text
Consume one ticket
and grant one pending Fortune spin
```

After use:

* Close the modal.
* Redirect to the Daily Wheel screen.
* The normal daily spin remains unchanged.

---

## Experience Potion

Use is enabled only when:

* The player is below level 40.
* At least one potion is owned.

Effect:

```text
Grant 30% of XP needed for the next level
```

---

## Golden Hourglass

Use is enabled only when:

* The player is not hospitalized.
* At least one eligible normal action cooldown is active.
* At least one Golden Hourglass is owned.

Effect:

```text
Reset all eligible active action cooldowns
```

It does not reset:

* Equipment cooldowns.
* Daily Quests.
* Daily Wheel limits.
* Daily action caps.
* Festival action caps.
* Once-per-day limits.
* Once-per-festival limits.
* Phoenix daily use.
* Pending Action Pool submissions.

Equipment cooldowns are intentionally excluded.

---

# Discharge Pill Exception

The Discharge Pill cannot be used from the normal Inventory modal.

When selected in the Inventory, display:

* Item image.
* Name.
* Rarity.
* Description.
* Quantity.
* Disabled Use control or informational label.

Recommended message:

```text
Can only be used from the Hospital screen.
```

The actual Discharge Pill button appears on the Hospital screen.

Hospital behavior remains:

* Reduces remaining Hospital time by 20 minutes.
* Maximum one Discharge Pill per Hospital stay.
* Releases the player immediately if the timer reaches zero.
* Uses the normal Hospital exit HP.
* Does not reverse the death XP penalty.

---

# Chaos Card Modal

When a player taps a Chaos Card, show:

1. Card image.
2. Card title.
3. Card rarity.
4. Card description.
5. Quantity owned.
6. Valid target selector.
7. Use button.
8. Cancel button.

The target selector may be:

* A dropdown.
* A scrollable player list.
* A player-selection modal.

A visual player list is recommended because it can show more useful information.

Each target should display:

* Player face.
* Player name.
* Current HP.
* Max HP.

---

# Valid Chaos Card Targets

Do not display:

* The attacking player.
* Hospitalized players.
* Dead players.
* Disabled players.
* Chaos-locked players.
* Players with another unresolved incoming Chaos attack.
* Otherwise untargetable players.

The attacker must also have fewer than two unresolved outgoing Chaos attacks.

The player must select exactly one valid target.

The Use button remains disabled until a target is selected.

---

# Chaos Card Use Flow

This document owns only the Inventory presentation and target-selection entry point.

The complete authoritative flow is defined in:

```text
docs/rules/chaos-cards.md
```

When `USE` is pressed:

1. Send the selected card ID, target ID, and idempotency key to the server.
2. Revalidate card ownership and target eligibility.
3. Revalidate the attacker's two-outgoing-attack limit.
4. Create the immutable combat snapshot.
5. Consume the card.
6. Create the pending Chaos validation.
7. Chaos-lock the target.
8. Pause the target's personal timers.
9. Commit atomically.
10. Play the consume/throw presentation only after success.

Do not apply target damage from the Inventory request.

Damage, Mirror, Thorns, Phoenix, death, Hospital, unlocking, and deferred attacker damage are processed only through the Chaos validation flow.

If revalidation fails:

* Do not consume the card.
* Do not create an attack.
* Do not lock the target.
* Keep or reopen the modal with an error.

---

# Equipment Inventory

Equipment should be filterable by:

* Slot.
* Rarity.
* Set line.
* Equipped state.

Recommended slot filters:

```text
All | Helmet | Armor | Legs | Boots
```

Every equipment item card should show:

* Item image.
* Name.
* Rarity.
* Slot.
* Set identity.
* Equipped marker, when equipped.
* Cooldown marker, when locked.

---

# Equipment Modal

When an equipment item is selected, display:

1. Item image.
2. Item name.
3. Rarity.
4. Slot.
5. Set name.
6. Exact piece effect.
7. Full-set effect summary.
8. Equipped or Unequipped state.
9. Equip or Unequip button.
10. Item cooldown remaining, when active.
11. Close button.

Example:

```text
Epic Gold Armor

Slot: Armor
Set: Gold Set

Generates 3 coins every hour while continuously equipped.
```

The modal should clearly explain continuous-timer effects where applicable.

---

# Equipment Slots

A player has four active equipment slots:

| Slot |
| ---- |
| Helmet |
| Armor |
| Legs |
| Boots |

Only one item can be equipped in each slot.

Equipping a new item into an occupied slot requires the currently equipped item to be unequipped as part of the same server transaction.

---

# Core Equipment Cooldown Rule

Every individual equipment item has its own independent 15-minute cooldown.

```text
Equipment item cooldown = 15 minutes
```

The cooldown begins whenever that specific item changes equip state.

A state change means:

* Unequipped -> Equipped.
* Equipped -> Unequipped.

The cooldown is attached to the individual inventory item instance.

It is not:

* A global player cooldown.
* A full-loadout cooldown.
* A slot-wide cooldown.
* A set-wide cooldown.

---

# Independent Item Timers

Example:

```text
12:00
Player equips Helmet A.

Helmet A cooldown:
12:00–12:15
```

```text
12:10
Player equips Armor B.

Armor B cooldown:
12:10–12:25
```

At 12:10:

```text
Helmet A has 5 minutes remaining.
Armor B has 15 minutes remaining.
```

The items do not share or reset each other’s cooldowns.

At 12:15:

* Helmet A can be changed.
* Armor B remains locked for 10 more minutes.

---

# Equip Cooldown

When an unequipped item is equipped:

1. Validate the item belongs to the player.
2. Validate the item’s cooldown has expired.
3. Validate the relevant slot can be changed.
4. Equip the item.
5. Set:

```text
equipmentCooldownEndsAt =
equippedAt + 15 minutes
```

The item cannot be unequipped again until its cooldown expires.

Example:

```text
Helmet equipped at 12:00.
Helmet cannot be removed before 12:15.
```

---

# Unequip Cooldown

When an equipped item is unequipped:

1. Validate the item’s existing cooldown has expired.
2. Unequip the item.
3. Set:

```text
equipmentCooldownEndsAt =
unequippedAt + 15 minutes
```

The same inventory item cannot be equipped again until this new cooldown expires.

Example:

```text
Helmet unequipped at 12:20.
That same Helmet cannot be equipped again before 12:35.
```

The equipment slot itself may receive another eligible item if that other item is not locked.

---

# Replacing an Equipped Item

Replacing an equipped item in one slot involves two item-state changes:

```text
Current item:
Equipped -> Unequipped

New item:
Unequipped -> Equipped
```

Both item instances must be eligible.

A replacement is allowed only when:

* The currently equipped item’s cooldown has expired.
* The new item’s cooldown has expired.
* Both items belong to the player.
* Both items use the same slot.
* The player is allowed to interact with equipment.

When confirmed:

* The old item is unequipped.
* The old item starts a new 15-minute cooldown.
* The new item is equipped.
* The new item starts a new 15-minute cooldown.
* Both changes happen atomically.

Example:

```text
12:00 — Helmet A equipped and locked until 12:15.
12:10 — Player attempts to replace Helmet A with Helmet B.

Result:
Blocked because Helmet A cannot yet be unequipped.
```

```text
12:16 — Player replaces Helmet A with Helmet B.

Helmet A:
Unequipped and locked until 12:31.

Helmet B:
Equipped and locked until 12:31.
```

---

# Empty Slot Behavior

If a slot is empty, an eligible item may be equipped when:

* The item belongs to the player.
* The item is not already equipped.
* The item’s cooldown has expired.
* The player is allowed to change equipment.

The other equipment slots are unaffected.

---

# Cooldown Display

Every locked item should show its own timer.

Examples:

```text
Equipped — change available in 04:32
```

```text
Unequipped — equip available in 11:08
```

The timer should update in the UI.

The server timestamp is the source of truth.

Do not trust device time.

When the timer reaches zero:

* Re-enable the valid action.
* Remove the locked visual state.

---

# No Cooldown for Inspection

The following actions do not start or reset equipment cooldown:

* Opening the Inventory.
* Viewing an item.
* Opening an equipment modal.
* Filtering equipment.
* Closing a modal.
* Attempting an invalid change.
* Selecting the already active state without changing it.

Only a successfully committed equip-state change starts the item timer.

---

# Strategic Purpose

The cooldown makes equipment a planning decision.

Example:

```text
A player equips Gold Armor to generate coins.

For the next 15 minutes,
that Armor cannot be removed.

The player accepts the risk
of not using another Armor effect.
```

Another example:

```text
A player equips Damage Boots before using Chaos Cards.

The Boots remain committed for 15 minutes.

The player cannot instantly replace them
with Regeneration or Protection Boots.
```

The system discourages constant app checking and reactive equipment micromanagement.

---

# Equipment Effect Timing

Equipment effects use the loadout that is active when the relevant server event is processed.

## Outgoing Damage

Use the attacker’s equipped Damage items when:

* A Chaos Card use is processed.
* Any other player-damage event is processed.

---

## Incoming Defense

Use the defender’s active equipment when incoming damage is processed.

This includes:

* Dodge.
* Protection.
* Thorns.
* Phoenix.

A player cannot reactively change equipment after the server event has begun.

---

## Potion Bonus

Use the Potion equipment active when the potion transaction is processed.

---

## Chest Set Bonus

Use the Chest Set equipment active when the chest-opening transaction begins.

Changing equipment after pressing Open cannot affect the opening.

---

## Hospital Set

Check the equipment file

---

## Gold Set

Gold items use continuous individual equipment timers.

Equipping or unequipping Gold items follows both:

* The 15-minute equipment item cooldown.
* The Gold accrual rules.

When a Gold item is unequipped:

1. Grant completed Gold generation intervals not yet processed.
2. Discard incomplete interval progress.
3. Reset that Gold item’s generation timer.
4. Start the item’s 15-minute unequipped cooldown.

The full-set Gold timer begins only while all four Gold items are equipped simultaneously.

Removing any piece ends and resets the full-set timer according to the Gold Set rules.

---

## Regeneration Set

Regeneration works only while the item is equipped.

When an item is removed:

* Its regeneration stops immediately.
* Its equipment cooldown begins.

---

# Hospital and Inventory

Recommended MVP rule:

```text
Hospitalized players cannot interact with the normal Inventory.
```

While hospitalized:

* Equipment cannot be equipped (except hospital set).
* Equipment cannot be unequipped.
* Standard consumables cannot be used.
* Chaos Cards cannot be used.
* The Discharge Pill may be used only from the Hospital screen.

Equipment already worn remains equipped.

Equipment cooldown timers continue counting down during Hospital time.

Passive Gold generation continues during Hospitalization.

Other passive equipment behavior follows its existing system rules.

---

# Inventory During Pending Actions

A pending Action Pool submission does not automatically lock the Inventory.

However, action rewards, self-damage, and action effects use the equipment active when the action is successfully accepted and processed.

This means equipment may change between:

```text
Action submitted
and
Action accepted
```

The server should always use the actual equipped state at acceptance time.

---

# Atomic Equipment Transaction

Every equipment change must be processed server-side and atomically.

## Equip Into Empty Slot

1. Validate player eligibility.
2. Validate ownership.
3. Validate item slot.
4. Validate item is unequipped.
5. Validate item cooldown has expired.
6. Confirm the slot is empty.
7. Equip the item.
8. Set its cooldown end to 15 minutes after the transaction time.
9. Start or update relevant passive timers.
10. Save activity history.
11. Commit.

---

## Unequip Item

1. Validate player eligibility.
2. Validate ownership.
3. Validate item is equipped.
4. Validate item cooldown has expired.
5. Process completed continuous-effect intervals when relevant.
6. Unequip the item.
7. Set its cooldown end to 15 minutes after the transaction time.
8. Stop or reset relevant passive timers.
9. Save activity history.
10. Commit.

---

## Replace Item

1. Validate player eligibility.
2. Validate ownership of both items.
3. Validate both items use the same slot.
4. Validate old item is equipped.
5. Validate new item is unequipped.
6. Validate old item cooldown has expired.
7. Validate new item cooldown has expired.
8. Process old item continuous effects.
9. Unequip old item.
10. Equip new item.
11. Set both item cooldowns to 15 minutes after transaction time.
12. Stop/reset old passive timers.
13. Start new passive timers.
14. Recalculate full-set states.
15. Save activity history.
16. Commit.

If any step fails:

* No equipment state changes.
* No cooldown changes.
* No timer progress is lost.
* No partial replacement occurs.

---

# Equipment Change Notifications

After a successful change, show a concise confirmation.

Example:

```text
Epic Gold Armor equipped.

This item can be changed again in 15:00.
```

Replacement example:

```text
Rare Protection Helmet equipped.

Old and new items are locked for 15:00.
```

---

# Suggested Data Shapes

## Inventory

```ts
type PlayerInventory = {
  playerId: string;

  consumables: Record<ConsumableType, number>;
  chaosCards: Record<ChaosCardId, number>;

  equipmentItems: EquipmentInventoryItem[];
};
```

---

## Equipment Item

```ts
type EquipmentInventoryItem = {
  inventoryItemId: string;
  equipmentDefinitionId: string;

  ownerPlayerId: string;

  rarity: EquipmentRarity;
  slot: EquipmentSlot;
  setLine: EquipmentSetLine;

  isEquipped: boolean;

  equipmentCooldownEndsAt?: string;

  continuousEffectStartedAt?: string;
  continuousEffectLastProcessedAt?: string;

  acquiredAt: string;
};
```

---

## Equipped Slots

Recommended derived structure:

```ts
type EquippedSlots = {
  helmet?: string;
  armor?: string;
  legs?: string;
  boots?: string;
};
```

Each value stores an `inventoryItemId`.

The database should enforce:

```text
Maximum one equipped item per player per slot
```

---

# Suggested Constants

```ts
const EQUIPMENT_CHANGE_COOLDOWN_MINUTES = 15;
const MAX_CONSUMABLE_QUANTITY = 10;
const MAX_CHAOS_CARD_QUANTITY = 10;
```

---

# Suggested Cooldown Helper

```ts
function isEquipmentItemLocked(
  item: EquipmentInventoryItem,
  now: Date
): boolean {
  if (!item.equipmentCooldownEndsAt) {
    return false;
  }

  return new Date(item.equipmentCooldownEndsAt) > now;
}
```

```ts
function getEquipmentCooldownRemainingMs(
  item: EquipmentInventoryItem,
  now: Date
): number {
  if (!item.equipmentCooldownEndsAt) {
    return 0;
  }

  return Math.max(
    new Date(item.equipmentCooldownEndsAt).getTime()
      - now.getTime(),
    0
  );
}
```

---

# UI State Examples

## Equipped and Locked

```text
Epic Gold Helmet
Equipped
Change available in 05:12
```

Button:

```text
UNEQUIP
```

Disabled until cooldown expires.

---

## Unequipped and Locked

```text
Epic Gold Helmet
Unequipped
Equip available in 08:47
```

Button:

```text
EQUIP
```

Disabled until cooldown expires.

---

## Unequipped and Available

```text
Rare Protection Helmet
Unequipped
Ready
```

Button:

```text
EQUIP
```

Enabled.

---

## Replacement Blocked by Current Item

```text
Cannot equip this Helmet yet.

Your currently equipped Helmet
can be removed in 04:21.
```

---

## Replacement Blocked by New Item

```text
This Helmet was recently unequipped.

It can be equipped again in 06:35.
```

---

# Idempotency and Anti-Exploit Rules

| Rule | Purpose |
| ---- | ------- |
| Equipment cooldown belongs to each item instance | Allow independent timers |
| Equip starts 15-minute item cooldown | Prevent immediate removal |
| Unequip starts 15-minute item cooldown | Prevent immediate re-equipping |
| Replacement validates both items | Prevent bypass through swapping |
| Server time is authoritative | Prevent device-time manipulation |
| Equipment changes are atomic | Prevent half-equipped states |
| One equipped item per slot | Preserve slot rules |
| Inspection starts no cooldown | Avoid punishing normal browsing |
| Golden Hourglass cannot reset equipment cooldown | Preserve strategic commitment |
| Hospital blocks normal Inventory interaction | Match Hospital rules |
| Passive effects use server event time | Prevent reactive switching exploits |
| Chest, combat, potion, and death logic snapshot current equipment | Ensure deterministic effects |
| Idempotency key required for item actions | Prevent double consumption or double equip |
| Client cannot directly set equip state | Prevent manipulation |

---

# Acceptance Tests

## Independent Timers

```text
Given a Helmet is equipped at 12:00
and Armor is equipped at 12:10,
then at 12:10 the Helmet has 5 minutes remaining
and the Armor has 15 minutes remaining.
```

---

## Equip Lock

```text
Given an item was equipped at 12:00,
when the player tries to unequip it at 12:10,
then the request is rejected
and the item remains equipped.
```

---

## Unequip Lock

```text
Given an item was unequipped at 12:20,
when the player tries to equip the same item at 12:25,
then the request is rejected
and the item remains unequipped.
```

---

## Independent Other Slot

```text
Given a Helmet is locked,
when the player equips an eligible Armor,
then the Armor equip succeeds
and the Helmet timer is unchanged.
```

---

## Replacement Requires Old Item Availability

```text
Given Helmet A is equipped and locked
and Helmet B is available,
when the player tries to equip Helmet B,
then the replacement is rejected
because Helmet A cannot be removed yet.
```

---

## Replacement Requires New Item Availability

```text
Given Helmet A can be removed
but Helmet B is still locked after a recent unequip,
when the player tries to replace A with B,
then the replacement is rejected.
```

---

## Successful Replacement

```text
Given Helmet A and Helmet B are both available,
when the player replaces A with B,
then A becomes unequipped,
B becomes equipped,
and both receive new 15-minute cooldowns.
```

---

## No Inspection Cooldown

```text
When a player opens and closes an Equipment modal
without changing equip state,
then no cooldown starts or changes.
```

---

## Consumable Use

```text
Given a player owns a usable Consumable,
when Use succeeds,
then its effect is applied
and quantity decreases by one.
```

---

## Discharge Pill Inventory Restriction

```text
Given a player selects a Discharge Pill
from normal Inventory,
then the modal explains that it is Hospital-only
and does not allow normal use.
```

---

## Chaos Card Target Requirement

```text
Given a Chaos Card modal is open
and no valid target is selected,
then the Use button remains disabled.
```

---

## Chaos Target Revalidation

```text
Given a target enters Hospital after being selected,
when the attacker presses Use,
then server validation fails
and the card is not consumed.
```

---

## Golden Hourglass Exclusion

```text
Given equipment items have active cooldowns,
when a Golden Hourglass is used,
then action cooldowns reset normally
but equipment cooldowns remain unchanged.
```

---

## Gold Item Unequip

```text
Given a Gold item has completed generation intervals
and an incomplete interval,
when it is successfully unequipped,
then completed coins are granted,
incomplete progress is discarded,
and the item begins a 15-minute cooldown.
```

---

## Hospital Cooldown Progress

```text
Given an equipment item has 10 minutes remaining
when the player enters Hospital,
then its timer continues normally
and may expire during Hospitalization.
```

---

## Atomic Replacement Failure

```text
Given a replacement transaction fails,
then neither item changes equip state
and neither cooldown is modified.
```

---

# Design Decisions Summary

| Topic | Decision |
| ----- | -------- |
| Inventory categories | Equipment, Consumables, Chaos Cards |
| Universal item interaction | Open item modal |
| Standard consumable action | Use |
| Discharge Pill | Hospital screen only |
| Chaos Card action | Select target and Use |
| Equipment action | Equip or Unequip |
| Equipment slots | Helmet, Armor, Legs, Boots |
| Equipment cooldown duration | 15 minutes |
| Cooldown scope | Individual equipment item instance |
| Global equipment cooldown | No |
| Slot cooldown | No |
| Set cooldown | No |
| Equip starts cooldown | Yes |
| Unequip starts cooldown | Yes |
| Replacement affects | Old and new item |
| Independent slot changes | Allowed |
| Inspection starts cooldown | No |
| Golden Hourglass resets equipment cooldown | No |
| Server time source of truth | Yes |
| Equipment changes | Atomic |
| Hospital Inventory access | Blocked except Discharge Pill interface |
| Passive timers during Hospital | Continue according to existing rules |
| Consumable stack limit | 10 |
| Chaos Card stack limit | 10 |
| Equipment duplicates | Separate item instances |

---

# Current Status

This Inventory and Equipment Change system is approved as the first version for Kempape.

The final equipment cooldown rule is:

```text
Every individual equipment item has its own
independent 15-minute cooldown.

Equipping an item starts its cooldown.

Unequipping an item starts a new cooldown.

The item cannot change equip state again
until its own cooldown expires.
```

Example:

```text
Helmet equipped at 12:00:
available again at 12:15.

Armor equipped at 12:10:
available again at 12:25.
```

This handoff should be added to the Kempape game logic project as the source of truth for Inventory behavior, item modals, Consumable use, Chaos Card targeting, equipment changes, and per-item equipment cooldowns.
