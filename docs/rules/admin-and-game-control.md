# Kempape — Admin and Game Control Handoff

## Purpose

The admin must be able to operate the festival remotely from a phone without directly editing Supabase tables.

Admin operations are server-authoritative, role-protected, atomic, idempotent, and audited.

An admin may also be a normal player.

The account has:

```ts
role: "player" | "admin"
```

Admin permission is stored server-side and cannot be granted by the client.

---

# Admin Panel

Create a mobile-friendly Admin screen hidden from non-admin players.

Recommended sections:

```text
GAME
PLAYERS
CHAOS
CORRECTIONS
AUDIT
```

The Admin screen must never expose:

* Supabase secret keys.
* Raw invite codes after their one-time display.
* Session tokens.
* Database credentials.

---

# Game Operations

The admin can:

* Create a testing run.
* Start live play.
* Pause the active run.
* Resume the active run.
* Reset & Start Fresh.
* End the game early.
* Inspect current phase and timestamps.
* Inspect realtime connection health.
* Inspect current run ID and state version.

`Reset & Start Fresh` follows `game-lifecycle-and-reset.md`.

High-risk operations require:

* Required reason.
* One-time confirmation code.
* Final confirmation.
* Audit event.

---

# Player Operations

The admin can:

* Create a player.
* Enable or disable a player.
* Assign or change the character before live play.
* View player status.
* View HP, XP, level, coins, inventory, cooldowns, and usages.
* View Hospital status.
* View Chaos lock status.
* View pending Actions and outgoing/incoming Chaos attacks.
* Revoke the player's active sessions.
* Generate, revoke, or replace the player's invite code.

Invite-code rules remain defined in `authentication-and-onboarding.md`.

---

# Chaos Emergency Operations

The admin can:

* Inspect every unresolved Chaos attack.
* See attacker, target, card, timestamps, snapshot, and validator eligibility.
* Cancel an unresolved Chaos attack with a reason.
* Release an incorrect orphaned Chaos lock.
* Inspect deferred attacker-side Mirror or Thorns damage.
* Repair a missing lock only when linked to a valid pending attack.
* Resolve a technical duplicate without applying damage twice.

Normal admin cancellation:

* Returns the card.
* Unlocks the target.
* Resumes paused personal timers.
* Applies no stored damage.
* Records the reason.

An orphaned-lock repair must never silently resolve or delete a valid attack.

---

# Corrections

The admin can make verified corrections to:

* Current HP.
* Total XP.
* Coins.
* Inventory quantity.
* Equipment ownership.
* Equipped state when repairing technical corruption.
* Action cooldown or usage.
* Wheel or Chest entitlement.
* Quest progress.
* Hospital release time.
* Phoenix availability.

Each correction requires:

1. Current value.
2. New value.
3. Required reason.
4. Admin confirmation.
5. Atomic update.
6. Audit event.
7. Realtime player refresh.

The UI should prefer explicit operations such as:

```text
Add 20 coins
Remove 20 coins
Set HP to 75
Grant one Shot card
Remove one duplicate item
```

rather than unrestricted raw JSON editing.

---

# Audit Log

Every admin mutation records:

```ts
type AdminAuditEvent = {
  id: string;
  adminPlayerId: string;
  gameRunId?: string;

  operation: string;
  targetPlayerId?: string;
  targetRecordId?: string;

  beforeState?: unknown;
  afterState?: unknown;

  reason: string;
  idempotencyKey: string;

  createdAt: string;
};
```

Audit rows are append-only for normal application code.

The Admin panel supports filtering by:

* Operation.
* Admin.
* Player.
* Run.
* Date.

---

# Remote Reliability

Admin operations must work from the deployed application.

Do not require:

* Local VS Code access.
* Supabase dashboard access.
* A laptop.
* Direct SQL.
* A redeploy.

When connectivity is interrupted:

* Show that the command may still be processing.
* Query the operation by idempotency key.
* Never repeat a completed reset, correction, or cancellation.

---

# Minimum MVP Admin Operations

The following are required before live play:

1. Player and invite-code management.
2. Character assignment.
3. Start testing.
4. Reset & Start Fresh.
5. Pause and resume.
6. End game.
7. Cancel unresolved Chaos attack.
8. Repair orphaned Chaos lock.
9. Inspect player state.
10. Correct HP, XP, coins, and inventory.
11. Enable the Extreme Challenge and edit its live description.
12. View audit history.

Cosmetic analytics and advanced dashboards may come later.

---

# Acceptance Tests

## Non-Admin Is Rejected

```text
Given a normal player session,
when it calls an admin endpoint,
then the server returns forbidden
and changes no state.
```

## Reset Requires Confirmation

```text
Given an admin clicks Reset & Start Fresh,
then no reset occurs
until a reason and valid one-time confirmation code are submitted.
```

## Correction Is Audited

```text
Given an admin changes a player's coins,
then the before value, after value, admin, reason,
run, and timestamp are recorded.
```

## Duplicate Admin Command Is Safe

```text
Given the same idempotency key is retried,
then the high-risk admin mutation runs at most once.
```
