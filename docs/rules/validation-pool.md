# Kempape — Validation Pool Handoff

## Purpose

The Validation Pool contains the two kinds of records that require confirmation by another player:

```text
ACTIONS
CHAOS CARDS
```

The two record types share one screen but have different validation effects.

Neither type can be rejected by a normal player.

---

# Screen Structure

Use two clearly separated tabs:

```text
ACTIONS | CHAOS CARDS
```

Each tab displays its own pending count.

Recommended default:

* Open the tab last used by the player.
* When a player has an incoming Chaos lock, the blocking Chaos modal takes priority over the Validation Pool.
* Do not mix the two record types into one undifferentiated list.

Within each tab, order pending records by:

```text
oldest pending first
```

---

# Universal Validation Rule

Every pending card has one player control:

```text
VALIDATE
```

Do not implement:

* Reject.
* Decline.
* Downvote.
* Rejection reason.
* Player cancellation.
* Swipe-to-delete.

Admin cancellation is a separate audited recovery function.

---

# ACTIONS Tab

The `ACTIONS` tab displays pending normal Action submissions.

Each row shows:

* Owner face and name.
* Action image.
* Action name.
* Tier.
* Submission time.
* `VALIDATE`.

An Action validator:

* Cannot be the owner.
* Must be active.
* Cannot be hospitalized.
* Cannot be Chaos-locked.
* Cannot validate two consecutive accepted Actions from the same owner.
* Receives no reward.

Validation atomically applies:

* XP.
* Coins.
* Usage.
* Cooldown start.
* HP cost.
* Phoenix/death/Hospital rules.
* History and realtime state.

A pending normal Action has no automatic expiration.

A pending Action becomes temporarily unavailable while its owner is Chaos-locked and is cancelled when its owner enters the Hospital.

The complete source of truth is:

```text
docs/rules/actions.md
```

---

# CHAOS CARDS Tab

The `CHAOS CARDS` tab displays unresolved incoming Chaos attacks.

Each row shows:

* `CHAOS ATTACK` label.
* Card image, name, and rarity.
* Attacker face and name.
* Target face and name.
* Required challenge.
* Creation time.
* `VALIDATE`.

A Chaos validator:

* Cannot be the target.
* May be the attacker.
* Must be active.
* Cannot be hospitalized.
* Cannot be Chaos-locked.
* Receives no reward.

Validation atomically applies the immutable stored combat result and then unlocks the target or transfers them to Hospital.

A pending Chaos attack has no normal expiration.

The complete source of truth is:

```text
docs/rules/chaos-cards.md
```

---

# Validation Button Behavior

When `VALIDATE` is pressed:

1. Disable that button locally.
2. Generate or reuse an idempotency key.
3. Send the validation command to the server.
4. Do not grant optimistic rewards or damage.
5. Wait for the authoritative transaction result.
6. Remove or update the record only after confirmation.
7. Refresh the relevant player and pool state.

When the request times out:

```text
Validation may still be processing.
Reconnecting...
```

On reconnect, query the server by submission ID and idempotency key.

Never blindly repeat a completed transaction.

---

# Realtime Updates

The pool must update when:

* A normal Action is submitted.
* A normal Action is validated.
* A normal Action becomes unavailable because of Chaos lock.
* A normal Action returns after Chaos survival.
* A normal Action is cancelled by Hospital, admin, reset, or festival end.
* A Chaos attack is created.
* A Chaos attack is validated.
* A Chaos attack is cancelled.
* The active game run changes.

Realtime is an optimization, not the source of truth.

On:

* App start.
* Reconnect.
* Window focus.
* Route entry.
* Realtime subscription recovery.

the client must refetch the authoritative pending records for the active game run.

---

# Empty States

ACTIONS:

```text
No Actions are waiting for validation.
```

CHAOS CARDS:

```text
No Chaos attacks are waiting for validation.
```

Do not hide a tab merely because it is empty.

---

# Suggested Data Projection

```ts
type ValidationPoolItem =
  | {
      kind: "action";
      id: string;
      gameRunId: string;
      ownerPlayerId: string;
      actionId: string;
      submittedAt: string;
      canCurrentPlayerValidate: boolean;
      unavailableReason?: string;
    }
  | {
      kind: "chaos";
      id: string;
      gameRunId: string;
      attackerPlayerId: string;
      targetPlayerId: string;
      chaosCardId: string;
      createdAt: string;
      canCurrentPlayerValidate: boolean;
      unavailableReason?: string;
    };
```

---

# Acceptance Tests

## No Reject Button

```text
Given any pending validation record,
then the UI exposes VALIDATE only
and no normal-player rejection command exists.
```

## Owner Cannot Validate Own Action

```text
Given Player A submitted an Action,
when Player A attempts to validate it,
then the server rejects the request.
```

## Attacker May Validate Chaos

```text
Given Player A attacked Player B,
when Player A validates the completed challenge,
then the request may succeed.
```

## Target Cannot Validate Chaos

```text
Given Player B is the Chaos target,
when Player B attempts to validate it,
then the server rejects the request.
```

## Reconnect Restores Pool

```text
Given the client misses realtime events,
when it reconnects,
then it refetches the authoritative pool
and displays the correct records without duplication.
```
