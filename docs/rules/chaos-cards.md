# Kempape — Chaos Cards Handoff

## Overview

Chaos Cards are one-use consumables used to attack another active player and assign them a real-world challenge.

Using a Chaos Card does **not** apply damage immediately.

The approved flow is:

```text
Player A selects a Chaos Card and Player B
-> the card is consumed
-> a pending Chaos attack is created
-> Player B becomes Chaos-locked
-> the attack appears in the Validation Pool
-> Player B completes the card challenge
-> an eligible player confirms completion
-> the stored combat result is applied
-> Player B is unlocked or enters the Hospital
```

They use the standard consumable inventory rules:

* Maximum 10 copies of each Chaos Card.
* All Chaos Cards can appear repeatedly; Epic and Legendary equipment copy limits do not apply.
* If a chest awards a card already at quantity 10:
refundPerOverflow =
floor(
  (chestReferencePrice × 0.50)
  / baseRewardSlotCount
)
* Successfully using a card removes one copy from inventory.

---

## Chaos Card List

| Tier      | Card              | Base damage |
| --------- | ----------------- | ----------: |
| Common    | Smoke a Cigarette |           6 |
| Common    | Double Sip        |           8 |
| Rare      | Big Sip           |          14 |
| Rare      | Shot              |          18 |
| Epic      | Jägermeister Shot |          24 |
| Epic      | Mirror            |          32 |
| Legendary | Finish Your Drink |          37 |

---

## Chaos Card Attack and Validation Flow

## Core Principle

Using a Chaos Card creates a pending, validated combat event.

The card is consumed when the attack is successfully created.

Damage is applied only after another eligible player confirms that the target completed the card challenge.

Terminology:

```text
Attacker = Player A
Target = Player B
Validator = player confirming that Player B completed the challenge
```

A Chaos attack is separate from a normal Action submission.

It has its own:

* Pending attack record.
* Validation Pool entry.
* Target lock.
* Timer-freeze state.
* Combat snapshot.
* Resolution transaction.
* Notifications and activity events.

---

## Card Modal and Target Selection

Player A opens:

```text
Inventory
-> Chaos Cards
-> Select Card
```

The card modal displays:

1. Card image.
2. Card name.
3. Card rarity.
4. Physical challenge.
5. Base damage.
6. Quantity owned.
7. Valid target list.
8. Use button.
9. Cancel button.

Each target entry displays:

* Player face.
* Player name.
* Current HP.
* Max HP.

The player must select exactly one valid target before `USE` becomes enabled.

---

## Valid Chaos Card Targets

Do not allow Player A to select:

* Player A.
* A hospitalized player.
* A dead player.
* A disabled player.
* A Chaos-locked player.
* A player already affected by another unresolved incoming Chaos attack.
* Any player otherwise marked as untargetable.

A player may have a maximum of:

```text
1 unresolved incoming Chaos attack
```

This prevents several players from locking the same target simultaneously.

## Outgoing Chaos Attack Limit

Each attacker may have a maximum of:

```text
2 unresolved outgoing Chaos attacks
```

Player A may therefore attack Player B and Player C while both attacks remain unresolved.

While Player A already has two unresolved outgoing attacks:

* Player A cannot create another Chaos attack.
* No additional card is consumed.
* Player A may continue normal gameplay when otherwise eligible.

Each resolved or cancelled outgoing attack immediately frees one outgoing slot.

The limit is calculated from authoritative unresolved attack records for the active game run.

---

## Cancel Before Use

Before `USE` is pressed, Player A may close the modal.

```text
Close the modal.
Do not consume the card.
Do not create an attack.
Do not lock the target.
Do not apply damage.
```

---

## Using the Chaos Card

When Player A presses `USE`, the server performs one atomic transaction.

### Attack Creation Transaction

1. Authenticate Player A.
2. Confirm Player A is active.
3. Confirm Player A is not hospitalized.
4. Confirm Player A is not Chaos-locked.
5. Confirm Player A still owns the selected card.
6. Confirm Player A has fewer than two unresolved outgoing Chaos attacks.
7. Revalidate Player B.
8. Confirm Player B is active and targetable.
9. Confirm Player B is not hospitalized.
10. Confirm Player B is not already Chaos-locked.
11. Confirm Player B has no unresolved incoming Chaos attack.
12. Snapshot the combat values required for the attack.
13. Resolve and store server-side random results such as Dodge.
14. Consume one copy of the Chaos Card.
15. Create the pending Chaos attack.
16. Create its Validation Pool entry.
17. Set Player B to `chaos_locked`.
18. Store the time at which Player B became locked.
19. Pause Player B's applicable personal timers.
20. Temporarily disable Player B's pending normal Action submissions.
21. Record the attack-created activity event.
22. Send a realtime state event to Player B.
23. Commit the transaction.
24. Return the immutable pending attack to Player A.

If any step fails:

* Do not consume the card.
* Do not create an attack.
* Do not lock Player B.
* Do not pause timers.
* Do not partially change either player.

The request must use an idempotency key so repeated clicks or retries cannot create duplicate attacks.

---

## Attacker Presentation

After the attack creation transaction commits:

1. Play a brief card-use or card-throw animation.
2. Visually consume the selected card.
3. Close the card modal.
4. Refresh Player A's card quantity.
5. Show confirmation.

Example:

```text
Shot used against Manel.

Waiting for punishment confirmation.
```

Player A cannot cancel the attack after it has committed.

Closing the app does not cancel or refund the card.

## Attacker Changes After Creation

The combat snapshot is final at attack creation.

After the attack is created:

* Equipping a Damage Set does not increase the pending damage.
* Unequipping a Damage Set does not reduce the pending damage.
* Level changes do not modify the pending damage.
* Later consumables do not modify the pending damage.
* Later defensive equipment changes do not modify stored reflected or self-damage.
* The attack remains valid if Player A later becomes Chaos-locked.
* The attack remains valid if Player A later dies or enters the Hospital.
* Player B still must complete the challenge and receive the stored result.

An unresolved outgoing attack continues occupying one of Player A's two outgoing slots even while Player A is hospitalized.

---

## Pending Chaos Validation

Every unresolved Chaos attack creates an entry in the shared Validation Pool.

Example:

```text
CHAOS ATTACK

Nil attacked Manel with Shot.

Confirm that Manel completed:
Take one standard shot.
```

The entry displays:

* Chaos Card image.
* Card name.
* Card rarity.
* Attacker face and name.
* Target face and name.
* Physical challenge.
* Attack creation time.
* Confirm button.

Chaos validations must be visually different from normal Action validations.

Recommended label:

```text
CHAOS ATTACK
```

---

## Chaos Validation Eligibility

An eligible validator:

* Must be an active player.
* Must not be hospitalized.
* Must not be Chaos-locked.
* Must not be the target.
* May be the attacker.

Therefore:

```text
Player A may confirm that Player B
completed the punishment.
```

Player B cannot validate their own punishment.

Chaos validation:

* Grants no XP.
* Grants no coins.
* Grants no items.
* Does not count as an accepted normal Action.
* Does not increase normal Action-validation quest progress.
* Does not use the consecutive normal-Action validator restriction.

The validator confirms only that the agreed real-world challenge or substitute was completed.

---

## Chaos Validation Controls

A pending Chaos attack uses:

```text
CONFIRM
```

It does not use the normal Action Pool `Reject` flow.

Players who did not witness the challenge should not confirm it.

The attack remains pending until:

* An eligible player confirms it.
* An admin performs an emergency cancellation.
* The festival-ending process handles it.

A normal Action Pool expiration does not apply.

---

## Target Notification

As soon as the attack transaction commits, Player B receives a notification.

Example:

```text
Nil attacked you with Shot.
```

The notification includes:

* Attacker name.
* Chaos Card image.
* Card name.
* Required challenge.

The target lock begins immediately on the server.

It does not wait for Player B to read the notification or open the application.

---

## Target Realtime Redirect

### Target Currently Using the App

When Player B is currently using the app:

1. Receive the realtime Chaos attack event.
2. Interrupt the current screen.
3. Redirect Player B to Home.
4. Open the blocking Chaos Card modal.
5. Disable normal navigation and interaction.

This applies even if Player B is viewing:

* Inventory.
* Actions.
* Action Pool.
* Daily Quests.
* Store.
* Ranking.
* Daily Wheel.
* Another normal modal.

Already committed server transactions remain valid.

Uncommitted client-only UI changes may be discarded.

### Target Opens the App Later

When Player B opens or refreshes the app:

1. Restore the player session.
2. Load the authoritative player state.
3. Detect the unresolved incoming Chaos attack.
4. Redirect to Home.
5. Display the blocking Chaos Card modal before any normal interaction.

Player B cannot bypass the lock by:

* Closing the browser or PWA.
* Refreshing.
* Opening another application route.
* Remaining offline.
* Reinstalling the PWA.
* Logging in from another device.

The lock is stored in the database and enforced by every server command.

---

## Target Chaos Card Modal

The blocking modal displays:

1. Chaos Card image.
2. Card name.
3. Card rarity.
4. Attacker name.
5. Physical challenge.
6. Stored expected target damage.
7. Waiting-for-validation state.

Example:

```text
SHOT

Nil used this Chaos Card against you.

Complete:
Take one standard shot.

Waiting for another player to confirm completion.
```

The modal:

* Cannot be dismissed.
* Cannot be minimized.
* Cannot be closed with browser back navigation.
* Cannot be bypassed by opening another route.
* Remains visible until the attack resolves or an admin cancels it.

---

## Chaos-Locked Player State

Recommended gameplay status:

```ts
type PlayerGameplayStatus =
  | "active"
  | "chaos_locked"
  | "hospitalized"
  | "disabled";
```

When Player B becomes Chaos-locked:

```text
gameplayStatus = "chaos_locked"
activeChaosAttackId = chaosAttack.id
chaosLockedAt = attackCreatedAt
```

While Chaos-locked, Player B cannot:

* Submit normal Actions.
* Validate normal Actions.
* Validate Chaos attacks.
* Use the normal Inventory.
* Equip or unequip items.
* Use Consumables.
* Use Chaos Cards.
* Open Chests.
* Use free Chest credits.
* Spin the Daily Wheel.
* Use Fortune spins.
* Make new Daily Quest progress through activity.
* Receive another Chaos attack.
* Perform any normal gameplay mutation.

Every server command must check the player's authoritative gameplay status.

Disabling buttons only in the client is not sufficient.

---

## Frozen Player Timers

The following Player B systems pause while the Chaos attack is unresolved:

* Gold Set generation.
* Regeneration Set healing.
* Normal Action cooldowns.
* Equipment cooldowns.
* Other player-specific continuous equipment timers.

No progress is earned while the target is Chaos-locked.

No progress already earned before the lock is lost.

### Continuous Timer Example

```text
Gold Armor has completed 42 minutes
of its one-hour interval.

Player B becomes Chaos-locked for 8 minutes.

After release, Gold Armor continues
from 42 minutes.
```

The Gold item does not:

* Generate coins during the lock.
* Advance to 50 minutes.
* Reset to zero.

The same rule applies to Regeneration.

### Cooldown Example

```text
An Action cooldown has 18 minutes remaining.

Player B is Chaos-locked for 7 minutes.

After release,
the cooldown still has 18 minutes remaining.
```

A timestamp-based implementation may move each paused end timestamp forward by the exact lock duration.

### Equipment Cooldown Example

```text
An equipment item has 6 minutes remaining.

Player B is Chaos-locked for 4 minutes.

After release,
the item still has 6 minutes remaining.
```

The Golden Hourglass cannot remove or bypass a Chaos lock.

---

## Pending Normal Actions

Pending normal Action submissions owned by Player B become unavailable for validation while Player B is Chaos-locked.

Recommended behavior:

* Keep the submission records.
* Hide or disable them in the Action Pool.
* Resume them if Player B survives.
* Cancel them if Player B dies and enters the Hospital.

No normal Action belonging to the locked target may be accepted during the Chaos lock.

Pending normal Actions do not expire, so they require no expiration-timer adjustment.

---

## Global Time That Does Not Pause

The Chaos lock affects Player B only.

The following continue normally:

* Server time.
* Festival start and end.
* Other players' gameplay.
* Ranking changes caused by other players.
* Festival-day boundaries.
* Daily Quest record rollover.
* Global equipment supply.
* Realtime events.

A Chaos lock never pauses the entire festival.

---

## Midnight While Chaos-Locked

A Chaos-locked player does not receive the midnight HP heal.

Their HP remains at the value stored when the attack was created.

This prevents the target from delaying confirmation to recover to full HP.

At midnight:

* Player B remains Chaos-locked.
* Player B's HP does not change.
* Gold and Regeneration remain paused.
* Personal cooldowns remain paused.
* The unresolved attack remains active.
* Global festival-day records change normally.
* Unfinished Daily Quest progress expires normally.
* New daily activities remain inaccessible until the lock ends.

---

## Combat Snapshot

The attack uses an immutable combat snapshot created when Player A successfully uses the card.

Snapshot at least:

* Attacker ID.
* Target ID.
* Chaos Card ID and definition version.
* Attacker level.
* Attacker Damage Set bonus.
* Target Current HP.
* Target Max HP.
* Target Dodge chance.
* Target Protection percentage.
* Target Thorns percentage.
* Target Phoenix equipment and daily availability.
* Attacker Phoenix equipment and daily availability when relevant.
* Server-side Dodge result.
* Level-scaled damage.
* Offensive damage.
* Final target damage.
* Mirror self-damage.
* Thorns reflected damage.
* Creation timestamp.

The snapshot prevents every later equipment or progression change from modifying the pending result.

The exact equipment, level, bonuses, defenses, Phoenix availability, and random outcomes present at creation are the values used for the attack.

Player A changing equipment after card use does not increase or reduce the attack.

Player B cannot change equipment while locked.

---

## Damage Calculation and Preparation

At attack creation:

1. Calculate level-scaled damage.
2. Apply Player A's Damage Set.
3. Resolve Player B's Dodge using server-side randomness.
4. If Dodge fails, apply Player B's Protection.
5. Calculate Player B's Thorns reflection.
6. Calculate final target damage.
7. Calculate Mirror self-damage when relevant.
8. Store the immutable combat snapshot.
9. Do not subtract HP yet.

Use the shared formulas.

```text
levelScaledDamage =
ceil(
  baseDamage
  ×
  (1 + ((attackerLevel - 1) × 0.04))
)
```

Then apply the attacker's Damage Set:

```text
offensiveDamage =
ceil(
  levelScaledDamage
  ×
  (1 + equipmentDamageBonus)
)
```

Target equipment is resolved in this order:

1. Dodge.
2. Protection.
3. Thorns.
4. Final target damage.
5. Mirror self-damage.
6. Phoenix checks after validation.
7. Death and Hospital processing after validation.

No HP changes when the attack is created.

---

## Confirming the Punishment

When an eligible validator presses `CONFIRM`, the server performs one atomic resolution transaction.

### Resolution Transaction

1. Authenticate the validator.
2. Confirm the validator is eligible.
3. Lock the pending Chaos attack database record.
4. Confirm the attack is still unresolved.
5. Confirm Player B is still linked to this attack.
6. Mark the attack as confirmed.
7. Store the validator ID and confirmation time.
8. Apply the stored target damage to Player B.
9. Apply stored Mirror self-damage to Player A when relevant.
10. Apply stored Thorns damage to Player A when relevant.
11. Check Phoenix independently for every player receiving lethal damage.
12. Resolve death independently for every player not saved by Phoenix.
13. Apply XP death penalties where required.
14. Enter affected players into the Hospital where required.
15. Remove Player B's Chaos lock.
16. Resume or transfer Player B's paused timers.
17. Resume or cancel Player B's pending normal Actions.
18. Add combat, validation, death, and Hospital activity events.
19. Notify Player A, Player B, and the validator.
20. Commit the complete transaction.

If any step fails:

* Apply no partial damage.
* Do not partially unlock Player B.
* Do not process the confirmation twice.
* Keep the attack pending unless the entire transaction commits.

The confirmation request must use an idempotency key.

---

## Simultaneous Combat Outcomes

The resolution transaction supports:

* Player B survives.
* Player B dies.
* Player A dies from Thorns.
* Player A dies from Mirror self-damage.
* Both players die.
* Phoenix saves Player A.
* Phoenix saves Player B.
* Phoenix saves both players.
* Dodge produces zero target damage.
* Protection and Thorns modify the stored result.

Every affected player is processed independently inside the same transaction.

---

## Target Survives

When Player B survives:

```text
gameplayStatus = "active"
activeChaosAttackId = null
```

Then:

1. Close the blocking modal.
2. Resume all paused timers from their previous progress.
3. Restore normal navigation.
4. Re-enable valid game commands.
5. Show the result.

Example:

```text
Shot completed.

You lost 32 HP.
Current HP: 84 / 145
```

---

## Target Dies

When Player B reaches 0 HP and Phoenix does not save them:

1. Remove the Chaos lock.
2. Process the death XP penalty.
3. Store Current HP as 0.
4. Enter the Hospital.
5. Cancel pending normal Actions according to the Actions system.
6. Transfer UI control directly to the Hospital screen.
7. Begin the Hospital countdown and Hospital Set flow.

The player does not briefly return to active gameplay.

---

## Attacker-Side Damage

Mirror self-damage and Thorns reflection are part of the immutable combat snapshot.

### Attacker Active at Confirmation

When Player A is active when the attack resolves:

* Apply stored Mirror and Thorns damage in the same resolution transaction.
* Resolve Phoenix when lethal.
* Resolve death, XP penalty, and Hospital entry when Phoenix does not save Player A.

### Attacker Already Hospitalized at Confirmation

Player A's earlier death does not cancel the outgoing attack.

The target still receives the stored result.

Stored Mirror or Thorns damage against a currently hospitalized attacker is not discarded and is not applied to a player already at 0 HP.

Instead:

1. Create a deferred attacker-damage record.
2. Link it to the resolved Chaos attack.
3. Apply it immediately when Player A is discharged.
4. Apply it before Player A may perform another gameplay mutation.
5. Process deferred records oldest first.
6. Resolve Phoenix, death, XP penalty, and a new Hospital entry normally if the deferred damage is lethal.
7. Mark the deferred record as applied exactly once.

This anti-exploit rule prevents Player A from avoiding Mirror or Thorns by dying before validation.

---

## Realtime Completion

When resolution commits:

### Player B

Receives an immediate realtime update.

The blocking modal changes to:

* Damage result when surviving.
* Phoenix result when saved.
* Hospital transition when dead.

### Player A

Receives a result such as:

```text
Your Chaos attack against Manel was confirmed.
```

The result may include:

* Target damage.
* Dodge.
* Protection.
* Thorns damage.
* Mirror self-damage.
* Target death.
* Attacker death.
* Phoenix result.

### Validator

Receives:

```text
Chaos punishment confirmed.
```

The validator receives no gameplay reward.

---

## Offline Resolution

Player B does not need to have the app open when confirmation occurs.

When Player B next opens the game:

1. Load the completed attack result.
2. Show the result or Hospital state.
3. Do not recreate the lock.
4. Do not apply damage again.
5. Mark the result reveal completed after it is shown.

The same attack can never resolve twice.

---

## No Normal Expiration

A pending Chaos attack does not automatically expire after the normal Action Pool timeout.

This prevents Player B from escaping by waiting.

The attack remains pending until:

* An eligible player confirms it.
* An admin performs an emergency cancellation.
* The festival-ending process handles it.

---

## Festival-End Resolution Window

At:

```text
2026-07-20 03:00 Europe/Berlin
```

the game enters `chaos_resolution`.

During this 15-minute window:

* No new normal Actions may be submitted or validated.
* No new Chaos attacks may be created.
* No Chest, Wheel, Quest, Inventory, Consumable, or equipment mutation may be performed.
* Existing unresolved Chaos attacks may still be validated.
* Admin emergency controls remain available.
* Stored Chaos damage, Phoenix, death, Hospital, and death XP penalties still resolve normally.
* Ranking may still change because of Chaos-related death penalties.

At:

```text
2026-07-20 03:15 Europe/Berlin
```

the server must atomically:

1. Mark every remaining unresolved Chaos attack as `festival_cancelled`.
2. Return each consumed card to its attacker.
3. Unlock every affected target.
4. Resume no further gameplay, because the run is ending.
5. Apply no unresolved target, Mirror, or Thorns damage.
6. Record audit events.
7. Freeze the final ranking.
8. Set the game run to `ended`.

---

## Emergency Admin Cancellation

Normal players cannot cancel a committed Chaos attack.

An admin may cancel one only because of:

* A mistaken target.
* A duplicated server operation.
* A safety concern.
* An impossible real-world situation.
* A technical failure.
* Another exceptional documented reason.

Admin cancellation must atomically:

1. Mark the attack as `admin_cancelled`.
2. Store the admin ID and reason.
3. Return one copy of the consumed card to Player A.
4. Unlock Player B.
5. Resume Player B's paused timers.
6. Resume eligible pending normal Actions.
7. Apply no damage.
8. Apply no death effect.
9. Add an audit event.
10. Notify Player A and Player B.

---

## Real-World Safety and Consent

Every physical Chaos Card prompt is voluntary.

A player may stop any real-world action at any time.

A pre-agreed:

* Non-alcoholic substitute.
* Non-smoking substitute.
* Harmless equivalent.

is valid without changing the in-game damage.

The app must not require:

* Forced participation.
* Unsafe speed.
* Unknown substances.
* Excessive quantities.
* Intimate evidence.
* Photos or videos proving consumption.

Validation confirms only that the agreed challenge or substitute was completed.

---

## Damage Scaling Without Equipment

| Card              | Base | Level 1 | Level 10 | Level 20 | Level 30 | Level 40 |
| ----------------- | ---: | ------: | -------: | -------: | -------: | -------: |
| Smoke a Cigarette |    6 |       6 |        9 |       11 |       13 |       16 |
| Double Sip        |    8 |       8 |       11 |       15 |       18 |       21 |
| Big Sip           |   14 |      14 |       20 |       25 |       31 |       36 |
| Shot              |   18 |      18 |       25 |       32 |       39 |       47 |
| Jägermeister Shot |   24 |      24 |       33 |       43 |       52 |       62 |
| Mirror            |   32 |      32 |       44 |       57 |       70 |       82 |
| Finish Your Drink |   37 |      37 |       51 |       66 |       80 |       95 |

At equal levels, the approximate damage categories are:

| Tier      | Approximate share of Max HP |
| --------- | --------------------------: |
| Common    |                        5–8% |
| Rare      |                      12–18% |
| Epic      |                      21–32% |
| Legendary |                      32–37% |

These values are suitable for the first playtest. Common cards are irritating, Rare cards are meaningful, Epic cards are dangerous, and the Legendary card removes approximately one-third of an equal-level player’s full HP.

---

# Common Cards

## Smoke a Cigarette

**Base damage:** 6 HP

**Description:**

```text
Target smokes one cigarette. Deals 6 base damage.
```

**Visual direction:** A cigarette with smoke rising around a Common-tier card frame.

A pre-agreed non-smoking substitute may be used without changing the in-game damage.

---

## Double Sip

**Base damage:** 8 HP

**Description:**

```text
Target takes two sips. Deals 8 base damage.
```

**Visual direction:** A cup with two visible drops, waves, or sip marks.

---

# Rare Cards

## Big Sip

**Base damage:** 14 HP

**Description:**

```text
Target drinks roughly half of their current drink. Deals 14 base damage.
```

**Visual direction:** A half-full cup with a visible 50% marker.

---

## Shot

**Base damage:** 18 HP

**Description:**

```text
Target takes one standard shot. Deals 18 base damage.
```

**Visual direction:** A filled shot glass with a Rare-tier glow.

---

# Epic Cards

## Jägermeister Shot

**Base damage:** 24 HP

**Description:**

```text
Target takes one Jägermeister shot. Deals 24 base damage.
```

**Visual direction:** A dark herbal shot glass with green and orange details.

---

## Mirror

**Base target damage:** 32 HP

**Description:**

```text
Drink together. The target must follow your pace until you stop. Deals 32 base damage and damages you too.
```

### Physical Effect

The attacker and target perform the agreed challenge together.

The target may stop at any time.

A pre-agreed non-alcoholic or harmless substitute is fully valid without changing the in-game result.

### Self-Damage

Mirror self-damage equals one-fifth of the attacker’s final offensive damage, rounded down:

```text
mirrorSelfDamage = floor(offensiveDamage ÷ 5)
```

Examples without Damage equipment:

| Attacker level | Target offensive damage | Attacker self-damage |
| -------------: | ----------------------: | -------------------: |
|              1 |                      32 |                    6 |
|             10 |                      44 |                    8 |
|             20 |                      57 |                   11 |
|             30 |                      70 |                   14 |
|             40 |                      82 |                   16 |

Self-damage is calculated before target defenses. Therefore:

* Target Dodge does not remove the self-damage.
* Target Protection does not reduce the self-damage.
* Target Thorns is resolved separately.
* Attacker Dodge and Protection cannot reduce self-damage.
* Self-damage can kill the attacker.
* Phoenix may save the attacker if the self-damage is lethal and Phoenix is available.

Mirror self-damage is applied during the same atomic combat event.

**Visual direction:** A magical mirror showing two cups or two reflected drinkers.

---

# Legendary Card

## Finish Your Drink

**Base damage:** 37 HP

**Description:**

```text
Target finishes the drink remaining in their cup. Deals 37 base damage.
```

**Visual direction:** A cup being emptied completely, with a powerful Legendary-tier frame and impact animation.

---

## Maximum-Damage Reference

At level 40 with a full Legendary Damage Set giving +25% outgoing damage:

| Card              | Final offensive damage |
| ----------------- | ---------------------: |
| Smoke a Cigarette |                     20 |
| Double Sip        |                     27 |
| Big Sip           |                     45 |
| Shot              |                     59 |
| Jägermeister Shot |                     78 |
| Mirror            |                    103 |
| Finish Your Drink |                    119 |

Mirror would deal:

```text
floor(103 ÷ 5) = 20 self-damage
```

The strongest combinations can kill a low-level player from full HP. This is acceptable for the MVP because it requires maximum level, the strongest Damage Set, and an Epic or Legendary card. Review this during the live balance test.

---

## Suggested Data Shape

```ts
type ChaosCardId =
  | "smoke_cigarette"
  | "double_sip"
  | "big_sip"
  | "shot"
  | "jagermeister_shot"
  | "mirror"
  | "finish_your_drink";

type ChaosCardDefinition = {
  id: ChaosCardId;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  baseDamage: number;
  description: string;
  imageKey: string;
  maxQuantity: 10;
  selfDamageDivisor?: number;
};
```

```ts
const CHAOS_CARDS: ChaosCardDefinition[] = [
  {
    id: "smoke_cigarette",
    name: "Smoke a Cigarette",
    rarity: "common",
    baseDamage: 6,
    description: "Target smokes one cigarette. Deals 6 base damage.",
    imageKey: "smoke_cigarette",
    maxQuantity: 10,
  },
  {
    id: "double_sip",
    name: "Double Sip",
    rarity: "common",
    baseDamage: 8,
    description: "Target takes two sips. Deals 8 base damage.",
    imageKey: "double_sip",
    maxQuantity: 10,
  },
  {
    id: "big_sip",
    name: "Big Sip",
    rarity: "rare",
    baseDamage: 14,
    description: "Target drinks roughly half of their current drink. Deals 14 base damage.",
    imageKey: "big_sip",
    maxQuantity: 10,
  },
  {
    id: "shot",
    name: "Shot",
    rarity: "rare",
    baseDamage: 18,
    description: "Target takes one standard shot. Deals 18 base damage.",
    imageKey: "shot",
    maxQuantity: 10,
  },
  {
    id: "jagermeister_shot",
    name: "Jägermeister Shot",
    rarity: "epic",
    baseDamage: 24,
    description: "Target takes one Jägermeister shot. Deals 24 base damage.",
    imageKey: "jagermeister_shot",
    maxQuantity: 10,
  },
  {
    id: "mirror",
    name: "Mirror",
    rarity: "epic",
    baseDamage: 32,
    description: "Drink together. The target follows your pace. Deals 32 base damage and damages you too.",
    imageKey: "mirror",
    maxQuantity: 10,
    selfDamageDivisor: 5,
  },
  {
    id: "finish_your_drink",
    name: "Finish Your Drink",
    rarity: "legendary",
    baseDamage: 37,
    description: "Target finishes the drink remaining in their cup. Deals 37 base damage.",
    imageKey: "finish_your_drink",
    maxQuantity: 10,
  },
];
```

---

# Pending Chaos Attack Data

## Suggested Status

```ts
type ChaosAttackStatus =
  | "pending_validation"
  | "resolved"
  | "admin_cancelled"
  | "festival_cancelled"
  | "run_reset";
```

## Suggested Attack Record

```ts
type ChaosAttack = {
  id: string;

  attackerPlayerId: string;
  targetPlayerId: string;
  chaosCardId: ChaosCardId;

  status: ChaosAttackStatus;

  createdAt: string;
  confirmedAt?: string;
  resolvedAt?: string;
  cancelledAt?: string;

  validatorPlayerId?: string;
  cancelledByAdminId?: string;
  cancellationReason?: string;

  targetHpAtCreation: number;
  targetMaxHpAtCreation: number;

  attackerLevelAtCreation: number;
  attackerDamageBonusAtCreation: number;

  levelScaledDamage: number;
  offensiveDamage: number;

  targetDodgeChance: number;
  targetDodgeTriggered: boolean;

  targetProtectionRate: number;
  targetThornsRate: number;

  finalTargetDamage: number;
  thornsDamage: number;
  mirrorSelfDamage: number;

  targetPhoenixEligibleAtCreation: boolean;
  attackerPhoenixEligibleAtCreation: boolean;

  targetLockedAt: string;
  targetUnlockedAt?: string;

  attackerDamageDeferredAt?: string;
  attackerDamageAppliedAt?: string;

  revealCompletedAt?: string;
};
```

## Suggested Player Lock Fields

```ts
type ChaosLockState = {
  activeChaosAttackId?: string;
  chaosLockedAt?: string;
};
```

The effective player status is derived from:

```text
active incoming Chaos attack
Hospital status
account status
```

---

# State Machine

```text
AVAILABLE CARD
    |
    | Player A uses card
    v
PENDING VALIDATION
    |
    | Card consumed
    | Player B locked
    | Player B timers paused
    |
    +------ Admin/festival cancel ---> CANCELLED
    |                                   |
    |                                   -> Card returned
    |                                   -> Player B unlocked
    |
    | Eligible player confirms
    v
RESOLVING
    |
    +------ Target survives ----------> ACTIVE
    |
    +------ Phoenix saves target -----> ACTIVE WITH 1 HP
    |
    +------ Target dies --------------> HOSPITAL
```

---

# Idempotency and Anti-Exploit Rules

| Rule | Purpose |
| ---- | ------- |
| Card use requires an idempotency key | Prevent duplicate attacks |
| Card is consumed with attack creation | Prevent free attacks |
| Target lock is stored server-side | Prevent UI bypass |
| Maximum one unresolved incoming attack | Prevent stacked locks |
| Maximum two unresolved outgoing attacks | Avoid unlimited mass locking while preserving usability |
| Frozen or hospitalized targets are untargetable | Prevent overlapping blocking states |
| Attacker death does not cancel an attack | Preserve committed attacks |
| Hospitalized attacker-side damage is deferred | Prevent Mirror or Thorns avoidance |
| Combat snapshot is immutable | Prevent equipment manipulation |
| Damage waits for validation | Match the real-world challenge flow |
| Target timers pause | Prevent waiting for recovery or income |
| Midnight heal is blocked while locked | Prevent delayed full healing |
| Every command checks gameplay status | Prevent direct API bypass |
| Validator cannot be the target | Prevent self-confirmation |
| Attacker may validate | Match the approved group flow |
| Chaos validation grants no reward | Prevent validation farming |
| Confirmation is atomic | Prevent partial damage or unlock |
| Confirmation requires idempotency | Prevent double damage |
| Closing the app does not remove the lock | Prevent offline escape |
| Pending attack has no normal expiry | Prevent waiting out the card |
| Admin cancellation is audited | Provide an emergency recovery path |
| Card returns only after admin cancellation | Preserve fairness |

---

# Acceptance Tests

## Card Is Consumed at Creation

```text
Given Player A owns one Shot card,
when Player A successfully attacks Player B,
then the Shot quantity becomes zero,
a pending Chaos attack is created,
and Player B receives no damage yet.
```

## Target Becomes Locked

```text
Given Player A successfully creates a Chaos attack,
then Player B immediately becomes Chaos-locked
and cannot use any normal gameplay command.
```

## Target Is Redirected

```text
Given Player B is viewing Inventory,
when the realtime attack event arrives,
then Player B is redirected to Home
and the blocking Chaos modal appears.
```

## Offline Target

```text
Given Player B is offline when attacked,
when Player B later opens the app,
then the unresolved Chaos modal appears
before normal gameplay is available.
```

## Gold Is Paused

```text
Given a Gold item has 42 minutes of progress,
when Player B is locked for 8 minutes,
then after unlocking it still has 42 minutes of progress.
```

## Regeneration Is Paused

```text
Given Regeneration is 10 minutes from its next heal,
when Player B becomes Chaos-locked,
then no healing occurs during the lock
and the remaining 10 minutes resume afterward.
```

## Cooldowns Are Paused

```text
Given an Action has 18 minutes of cooldown remaining,
when Player B is locked for 7 minutes,
then it still has 18 minutes remaining after unlocking.
```

## Midnight Does Not Heal Locked Player

```text
Given Player B is Chaos-locked with 20 HP at midnight,
then Player B remains at 20 HP
and does not receive the midnight full heal.
```

## Attacker May Validate

```text
Given Player A attacked Player B,
when Player A confirms the completed challenge,
then the confirmation is eligible.
```

## Target Cannot Validate

```text
Given Player B is the target,
when Player B attempts to confirm the attack,
then the request is rejected.
```

## Damage After Confirmation

```text
Given a pending Chaos attack,
when an eligible player confirms it,
then the stored combat result is applied exactly once.
```

## Target Survives

```text
Given the stored damage is not lethal,
when the attack resolves,
then Player B becomes active
and all paused systems resume.
```

## Target Dies

```text
Given the stored damage is lethal
and Phoenix does not save Player B,
when the attack resolves,
then Player B enters the Hospital
without returning to active gameplay.
```

## Simultaneous Death

```text
Given Player B receives lethal target damage
and Player A receives lethal Thorns or Mirror damage,
when the attack resolves,
then both deaths are processed atomically.
```

## Duplicate Confirmation

```text
Given a Chaos attack has already resolved,
when another confirmation request is received,
then no additional damage is applied.
```

## Second Incoming Attack Is Blocked

```text
Given Player B already has an unresolved incoming Chaos attack,
when another player tries to target Player B,
then the new attack is rejected
and the second card is not consumed.
```

## Snapshot Ignores Later Equipment

```text
Given Player A creates a Chaos attack without a Damage Set,
when Player A equips a Damage Set afterward,
then the pending target damage remains unchanged.
```

## Frozen Target Cannot Be Attacked

```text
Given Player B already has an unresolved incoming Chaos attack,
when any player tries to attack Player B,
then the request is rejected
and no card is consumed.
```

## Two Outgoing Attacks Are Allowed

```text
Given Player A has no unresolved outgoing attacks,
when Player A attacks Player B and Player C,
then both attacks may remain pending.
```

## Third Outgoing Attack Is Blocked

```text
Given Player A already has two unresolved outgoing attacks,
when Player A tries to attack Player D,
then the request is rejected
and the third card is not consumed.
```

## Attacker Death Does Not Cancel Attack

```text
Given Player A attacks Player B,
when Player A dies before validation,
then Player B remains Chaos-locked
and the attack can still be validated.
```

## Hospitalized Attacker Damage Is Deferred

```text
Given Player A is hospitalized when a stored Mirror or Thorns result resolves,
then Player B's stored result is applied,
Player A's attacker-side damage is stored as deferred,
and it is applied exactly once immediately after discharge.
```

## Festival Resolution Window

```text
Given unresolved Chaos attacks exist at 03:00,
then only their validation and admin controls remain available.

Given one remains unresolved at 03:15,
then it is cancelled,
the card is returned,
the target is unlocked,
and no stored damage is applied.
```

## Admin Cancellation

```text
Given an unresolved Chaos attack,
when an admin cancels it with a recorded reason,
then Player B is unlocked,
paused timers resume,
no damage is applied,
and the card is returned to Player A.
```

---

# Final Approved Rule

```text
Using a Chaos Card consumes the card
and creates a pending Chaos validation.

The target is immediately Chaos-locked.

While locked, the target cannot interact with the game,
and all target-specific income, healing, cooldown,
equipment, and pending-action timers are paused.

The target sees a blocking Chaos Card modal
until an eligible player confirms the challenge.

Only after confirmation is the stored combat result applied.

The attacker may have at most two unresolved outgoing attacks.
Changing equipment or dying after creation does not cancel or modify them.

The target then resumes normal play,
is saved by Phoenix,
or enters the Hospital.
```
