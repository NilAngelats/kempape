# Kempape — Actions System Handoff

## Purpose

Actions are festival activities completed by players to gain XP and coins.

Action effects always apply to the player completing the action. They never damage another player.

Every action requires validation from one other active player before its rewards, HP cost, cooldown, or daily usage are applied.

Validators receive no reward.

---

## Action Tier Rewards

| Tier      |            XP reward | Coin reward |
| --------- | -------------------: | ----------: |
| Common    | 15% of next-level XP |    10 coins |
| Rare      | 35% of next-level XP |    25 coins |
| Epic      | 60% of next-level XP |    50 coins |
| Legendary | 90% of next-level XP |   100 coins |

XP calculation:

```text
xpReward = ceil(
  xpNeededForNextLevel
  × tierXpPercentage
  × levelBandMultiplier
)
```

The XP percentages and coin rewards are initial balance values.

---

# HP-Cost Actions

HP-cost actions give progression in exchange for fixed self-damage.

Rules:

* HP cost does not scale with level.
* Damage equipment does not increase the HP cost.
* Dodge, Protection, and Thorns cannot reduce it.
* HP-cost actions can kill the player.
* Phoenix may trigger if the damage is lethal.
* Every HP-cost action has at least a 10-minute cooldown.

| Action                     | Tier      | HP cost |   XP | Coins | Cooldown |
| -------------------------- | --------- | ------: | ---: | ----: | -------: |
| Smoke a Cigarette          | Common    |    6 HP |  15% |    10 |   10 min |
| Drink a Beer               | Common    |   10 HP |  15% |    10 |   10 min |
| Drink a Strong Mixed Drink | Rare      |   14 HP |  35% |    25 |   10 min |
| Take a Shot                | Rare      |   18 HP |  35% |    25 |   10 min |
| Take a Jägermeister Shot   | Epic      |   24 HP |  60% |    50 |   10 min |
| Smoke a Joint              | Epic      |   30 HP |  60% |    50 |   10 min |
| Finish Your Drink          | Legendary |   37 HP |  90% |   100 |   10 min |
| Extreme Challenge | Legendary |   60 HP | 150% |   150 | Once/day |

The Extreme Challenge must be configured before the festival and must not require illegal drugs, unknown substances, or unsafe consumption.

Players may use pre-agreed non-alcoholic and non-smoking substitutes without changing the in-game reward.

---

# Physical and Recovery Actions

These actions do not cost HP. Cooldowns and daily caps prevent farming.

| Action           | Tier   |  XP | Coins | Cooldown | Daily cap |
| ---------------- | ------ | --: | ----: | -------: | --------: |
| 20 Push-ups      | Common | 15% |    10 |   1 hour |         5 |
| 40 Squats        | Common | 15% |    10 |   1 hour |         5 |
| Cold Shower      | Common | 15% |    10 |  4 hours |         2 |
| Pay for a Shower | Rare   | 35% |    25 |        — |         1 |

A daily cap resets at `00:00`.

---

# Social Actions

## Core Social Actions

| Action                             | Tier      |  XP | Coins | Limit              |
| ---------------------------------- | --------- | --: | ----: | ------------------ |
| Find Someone You Know              | Common    | 15% |    10 | No fixed daily cap |
| Talk to a Stranger for 20+ Minutes | Rare      | 35% |    25 | 2/day              |
| Find Catalan People                | Rare      | 35% |    25 | 1/day              |
| Make Out With Someone              | Epic      | 60% |    50 | 1/day              |
| Have Sex With Someone              | Legendary | 90% |   100 | 1/festival         |
| Get a Permanent Tattoo             | Legendary | 90% |   100 | 1/festival         |

For `Find Someone You Know`, every accepted claim must involve a different person.

For `Find Catalan People`, the same person or group cannot be reused.

Intimate actions must be voluntary and consensual. Validation confirms only that the action occurred. The app must never request or store intimate photos, videos, names, or private details.

---

## Additional Festival Social Actions

### Take a Group Photo With Another Festival Group

| Rule      | Value |
| --------- | ----- |
| Tier      | Rare  |
| XP        | 35%   |
| Coins     | 25    |
| Daily cap | 1     |
| HP cost   | 0     |

Requirements:

* The photo must include the player and members of another festival group.
* The same external group cannot be reused on another festival day by the same player.
* The app does not need to permanently store the image unless photo proof is explicitly added later.

Short description:

```text
Take a group photo with another festival group.
```

---

### Learn and Test a Phrase in Another Language

| Rule      | Value |
| --------- | ----- |
| Tier      | Rare  |
| XP        | 35%   |
| Coins     | 25    |
| Daily cap | 1     |
| HP cost   | 0     |

Requirements:

1. Learn a phrase from someone who speaks another language.
2. Say the phrase to a different person.
3. Ask whether that person understood it.

The action is complete after the second person confirms whether they understood the phrase.

Short description:

```text
Learn a phrase in another language and test it on someone else.
```

---

### Lead a Toast With Another Festival Group

| Rule      | Value |
| --------- | ----- |
| Tier      | Rare  |
| XP        | 35%   |
| Coins     | 25    |
| Daily cap | 1     |
| HP cost   | 0     |

Requirements:

* The player must lead a toast involving another festival group.
* The same group cannot be reused by that player for another accepted toast action.
* A non-alcoholic toast is fully valid.

Short description:

```text
Lead a toast with another festival group.
```

---

### Receive an Item From Another Person

| Rule      | Value |
| --------- | ----- |
| Tier      | Epic  |
| XP        | 60%   |
| Coins     | 50    |
| Daily cap | 1     |
| HP cost   | 0     |

The player must receive an item freely from another person.

Valid examples:

* Shirt.
* Hat.
* Bracelet.
* Accessory.
* Festival decoration.
* Other voluntarily gifted or lent object.

Rules:

* The item must be given voluntarily.
* Stealing does not count.
* Taking an unattended item does not count.
* The same item cannot be reused for future claims.
* The item does not need to be permanently gifted; lending is valid if the other person agrees.

Short description:

```text
Convince someone to freely give or lend you an item.
```

---

---


# Action Submission

When a player completes an Action:

1. The player selects the Action.
2. The server confirms the player may submit it.
3. A pending submission is created.
4. The submission enters the `ACTIONS` tab of the shared Validation Pool.
5. No XP, coins, HP cost, cooldown, daily use, or festival use is applied yet.

```text
status = "pending"
```

A pending Action does not automatically expire.

It remains pending until:

* Another eligible player validates it.
* An admin cancels it because of a verified mistake or technical problem.
* The owner enters the Hospital.
* The active game run is reset.
* The festival reaches its normal gameplay end.

---

# Pending Action Lock

A pending submission freezes that specific Action for its owner.

Example:

```text
Player A submits Drink a Beer.

Until that submission is validated or cancelled,
Player A cannot submit Drink a Beer again.
```

The pending submission does not freeze the player's whole account.

Player A may still:

* Submit other Actions, subject to the global pending limit.
* Use Inventory items when otherwise eligible.
* Open Chests.
* Use the Daily Wheel.
* Participate in other normal game systems.

The player may have a maximum of:

```text
3 pending normal Action submissions
```

A player cannot create another submission when they already have three pending normal Actions.

---

# Validation Pool Display

Normal Action submissions appear only in:

```text
Validation Pool
-> ACTIONS
```

Each pending Action displays:

* Player face.
* Player name.
* Action image.
* Action name.
* Action tier.
* Submission time.
* One `VALIDATE` button.

There is no Reject button.

The Action owner cannot validate their own submission.

---

# No Rejection Flow

Normal Actions cannot be rejected by another player.

Do not create:

* A Reject button.
* A rejection modal.
* A rejection reason.
* A `rejected` status.
* A rejection API endpoint.
* A rejection notification.

The only normal player interaction with a pending Action is:

```text
VALIDATE
```

Admin cancellation is an exceptional recovery operation and is not a player rejection flow.

---

# Validation Eligibility

One other eligible player must validate the Action.

The validator:

* Cannot be the Action owner.
* Must be active.
* Cannot be hospitalized.
* Cannot be Chaos-locked.
* Cannot validate two consecutive accepted Actions from the same player.
* Receives no XP.
* Receives no coins.
* Receives no items.
* Receives no other gameplay reward.

```text
Validation grants no reward.
```

The consecutive-validator rule applies only to accepted normal Actions.

It does not apply to Chaos Card validations.

---

# Accepted Action Processing

When an eligible player presses `VALIDATE`, process everything in one server-authoritative atomic transaction:

1. Authenticate the validator.
2. Load and lock the pending submission.
3. Confirm the submission is still pending.
4. Confirm it has not already been processed.
5. Confirm the owner is still eligible.
6. Confirm the validator is eligible.
7. Confirm the owner does not have a conflicting gameplay state.
8. Reconfirm cooldown, daily-cap, and festival-cap availability.
9. Mark the submission as accepted.
10. Store the validator ID and acceptance time.
11. Grant XP.
12. Grant coins.
13. Record the Action usage.
14. Start the cooldown.
15. Apply the fixed HP cost, when applicable.
16. Trigger Phoenix or death rules if HP reaches `0` or below.
17. Update the owner's last accepted validator.
18. Add the event to activity history.
19. Send the realtime result to affected clients.
20. Commit the transaction.

Rewards are granted before self-damage.

If an Action kills the owner, the owner still earns the Action XP and coins before the death XP penalty is calculated.

The request must be idempotent.

Repeated clicks, retries, or reconnects cannot grant the same Action twice.

---

# Cooldowns and Usage Limits

Cooldowns begin only after successful validation.

```text
cooldownEndsAt = acceptedAt + actionCooldown
```

Daily and festival usage are consumed only after successful validation.

A player cannot submit an Action when:

* That Action already has a pending submission.
* That Action has an active cooldown.
* Its daily cap has been reached.
* Its festival cap has been reached.
* The player already has three pending normal Actions.
* The player is hospitalized.
* The player is Chaos-locked.
* The current game phase does not allow new Action submissions.

The Golden Hourglass may reset normal time-based cooldowns.

It does not reset:

* Daily caps.
* Once-per-day Actions.
* Once-per-festival Actions.
* Pending submissions.
* Chaos locks.
* Festival phase restrictions.

---

# Chaos Lock Interaction

When the Action owner becomes Chaos-locked:

* Existing pending normal Actions remain stored.
* They become unavailable for validation.
* They are hidden or disabled in the Validation Pool.
* They become available again if the owner survives and returns to `active`.
* They are cancelled if the owner dies and enters the Hospital.

Because pending Actions do not expire, no pending expiration timer needs to be paused.

A Chaos-locked player cannot submit or validate normal Actions.

---

# Hospital Interaction

When a player enters the Hospital:

* Cancel all pending normal Action submissions owned by that player.
* Apply no rewards.
* Apply no HP cost.
* Start no cooldown.
* Consume no daily or festival usage.
* Mark the cancellation reason as `owner_hospitalized`.

This prevents delayed rewards from being accepted while the owner is hospitalized.

---

# Admin Cancellation

An admin may cancel a pending normal Action only for:

* A mistaken submission.
* A duplicated server operation.
* A technical failure.
* An impossible or unsafe situation.
* Another exceptional reason recorded in the audit log.

Admin cancellation:

* Grants no XP.
* Grants no coins.
* Applies no HP cost.
* Starts no cooldown.
* Consumes no daily or festival use.
* Unlocks that Action for the owner.
* Stores the admin ID and reason.
* Notifies the owner through realtime state.

---

# Festival-End Handling

At the configured normal gameplay end:

```text
2026-07-20 03:00 Europe/Berlin
```

* No new normal Action submissions may be created.
* Pending normal Actions may no longer be validated.
* Every remaining pending normal Action is marked `festival_cancelled`.
* No rewards, HP cost, cooldown, or usage are applied.

Only unresolved Chaos Card attacks may continue during the separate Chaos resolution window defined in `config.md` and `game-lifecycle-and-reset.md`.

---

# Anti-Exploit Rules

| Rule | Purpose |
| ---- | ------- |
| Maximum 3 pending normal Actions per player | Prevent pool spam |
| Maximum 1 pending submission per Action | Prevent duplicate claims |
| No automatic pending expiration | Match the approved validation flow |
| No Reject control or status | Prevent hostile or accidental rejection |
| Atomic validation transaction | Prevent duplicate rewards |
| Idempotent validation request | Prevent double processing |
| No self-validation | Required |
| No same validator twice consecutively | Reduce collusion |
| Validator receives no reward | Prevent validation farming |
| Cooldown starts after acceptance | Match the approved flow |
| Daily and festival uses apply after acceptance | Avoid consuming unvalidated claims |
| Hospital cancels pending owner submissions | Prevent delayed Hospital rewards |
| Chaos lock temporarily disables owner submissions | Match the blocking-state rules |
| Every mutation checks game phase and run ID | Prevent stale-run processing |

---

# Suggested Data Shape

```ts
type ActionTier = "common" | "rare" | "epic" | "legendary";

type GameAction = {
  id: string;
  name: string;
  description: string;
  tier: ActionTier;

  hpCost: number;
  xpPercentage: number;
  coinReward: number;

  cooldownMinutes?: number;
  dailyCap?: number;
  festivalCap?: number;

  requiresUniquePerson?: boolean;
  requiresUniqueGroup?: boolean;
  requiresUniqueItem?: boolean;
};

type ActionSubmissionStatus =
  | "pending"
  | "accepted"
  | "admin_cancelled"
  | "owner_hospitalized"
  | "festival_cancelled"
  | "run_reset";

type ActionSubmission = {
  id: string;
  gameRunId: string;
  actionId: string;
  playerId: string;

  status: ActionSubmissionStatus;

  submittedAt: string;
  acceptedAt?: string;
  resolvedAt?: string;

  validatorId?: string;
  cancelledByAdminId?: string;
  cancellationReason?: string;

  idempotencyKey: string;
};
```

There is intentionally no `expiresAt` field and no `rejected` status.

---

# Acceptance Tests

## Action Is Frozen While Pending

```text
Given Player A has a pending Drink a Beer submission,
when Player A tries to submit Drink a Beer again,
then the request is rejected
and no second submission is created.
```

## Other Actions Remain Available

```text
Given Player A has a pending Drink a Beer submission,
when Player A submits 20 Push-ups
and all other rules allow it,
then the second Action may be created.
```

## No Reject Operation Exists

```text
Given a pending normal Action,
then the Validation Pool displays only VALIDATE
and no player rejection endpoint exists.
```

## Cooldown Starts After Validation

```text
Given a pending Action with a 10-minute cooldown,
then no cooldown is active before validation.

When an eligible player validates it,
the 10-minute cooldown begins at acceptedAt.
```

## No Automatic Expiration

```text
Given a normal Action has remained pending for more than two hours,
then it remains pending
until validation or an approved cancellation event occurs.
```

## Duplicate Validation Is Safe

```text
Given two clients validate the same pending Action,
then exactly one transaction succeeds
and rewards are granted exactly once.
```

## Chaos Lock Disables Validation

```text
Given the Action owner becomes Chaos-locked,
then their pending Action is unavailable for validation.

When the owner survives and becomes active,
the same pending Action becomes available again.
```

## Hospital Cancels Pending Actions

```text
Given Player A owns pending normal Actions,
when Player A enters the Hospital,
then those submissions are cancelled
without rewards, HP cost, cooldown, or usage.
```

---

# Final Approved Action Flow

```text
Player submits an Action
-> that specific Action becomes unavailable to the owner
-> submission remains in the ACTIONS validation tab
-> another eligible player presses VALIDATE
-> rewards and usage are applied
-> cooldown begins
-> HP cost is applied
-> Phoenix, death, and Hospital rules run when required
```

There is no player rejection and no automatic expiration.
