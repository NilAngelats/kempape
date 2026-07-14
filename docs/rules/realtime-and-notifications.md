# Kempape — Realtime Synchronization and Notifications Handoff

## Priority

For MVP1, correct shared state is more important than animation or a polished notification center.

Implementation order:

```text
1. Server-authoritative transactions
2. Database integrity
3. Realtime state synchronization
4. Reconnect and recovery
5. Basic blocking/result UI
6. Persistent notification center
7. Animations and polish
```

A missing animation is acceptable.

A desynchronized player is not acceptable.

---

# Source of Truth

The database is authoritative.

The client must not independently decide:

* XP.
* HP.
* Coins.
* Cooldown completion.
* Action acceptance.
* Chaos locks.
* Damage.
* Inventory consumption.
* Chest result.
* Wheel result.
* Quest completion.
* Hospital release.
* Game phase.
* Active game run.

Realtime events tell clients that state changed.

Clients then load or reconcile authoritative state.

---

# Required Realtime State Events

At minimum, support state refresh for:

* Player state changed.
* Inventory changed.
* Equipment changed.
* Action Pool changed.
* Chaos attack created.
* Chaos attack resolved or cancelled.
* Player Chaos-locked or unlocked.
* Hospital entered or released.
* Game phase changed.
* Active game run changed.
* Ranking changed.
* Daily state changed.

Do not rely on a notification entry to enforce a blocking state.

Example:

```text
Chaos lock row exists
-> server commands reject normal mutations
-> client redirects and shows blocking modal
```

The lock is valid even when notification delivery fails.

---

# Reconnect and Focus Recovery

On:

* Initial app load.
* Network reconnect.
* App returning to foreground.
* Browser focus.
* Realtime subscription reconnect.
* Route entry after a long idle period.

the client must refresh:

1. Active game run and phase.
2. Current player status.
3. Incoming Chaos lock.
4. Hospital status.
5. Player stats.
6. Inventory and equipped items.
7. Pending validation counts.
8. Relevant daily state.

Use a monotonic `stateVersion` or equivalent version/timestamp to reject stale client payloads.

---

# Mutation Reliability

Every gameplay mutation:

* Is authenticated.
* Includes the active `game_run_id`.
* Includes an idempotency key.
* Runs in an atomic server transaction.
* Returns an authoritative result.
* Is safe to query after a timeout.
* Rejects stale runs.
* Rejects invalid player status.
* Does not grant optimistic rewards or damage.

While a command is pending:

* Disable the submitted control.
* Show a processing state.
* Prevent duplicate client clicks.

When connection is lost:

```text
Connection lost.
Your command may still be processing.
Reconnecting...
```

After reconnect:

* Query the command result.
* Do not blindly rerun it.
* Refresh authoritative state.

---

# Blocking-State Priority

Use this priority when deciding the player's current screen:

```text
1. Account disabled
2. Active game run changed/reset
3. Game ended
4. Global game paused
5. Hospital
6. Chaos lock
7. Unfinished committed Chest/Wheel result reveal
8. Simple result or level summary
9. Normal application
```

Hospital has priority when a resolved Chaos attack kills the target.

A pending Chaos lock has priority over normal pages and nonessential modals.

---

# Committed Reveal Interruption

Chest and Wheel results are committed before their animations.

When a Chaos attack arrives while a reveal animation is open:

1. Preserve the committed result.
2. Interrupt the animation.
3. Show the Chaos blocking state.
4. Do not reroll or regrant the result.
5. Resume or summarize the saved reveal after the player becomes active.

Animations never control transaction state.

---

# Level-Up Presentation

Do not require a persistent level-up notification.

After an XP transaction that gains one or more levels, show one simple summary:

```text
LEVEL UP

Level 12 -> Level 15
+15 Max HP
+15 Current HP
+15 coins
2 Small Chest credits
```

Process all level and milestone rewards on the server before displaying the summary.

Do not show one blocking modal per level.

Animation is optional for MVP1.

---

# Daily Boundary Presentation

At a daily boundary:

* Refresh Daily Quests.
* Refresh Daily Wheel availability.
* Apply midnight HP healing when eligible.
* Refresh daily caps when the configured day permits it.
* Refresh Phoenix availability when the configured day permits it.
* Show a small nonblocking `New Festival Day` message.

Do not forcibly redirect the player.

The July 20 midnight exception in `config.md` remains authoritative.

---

# Notification Center — Later MVP Phase

A persistent in-app notification center may be implemented after core gameplay is reliable.

Suggested notification types:

* Action validated.
* Action cancelled by admin, Hospital, reset, or festival end.
* Chaos attack received.
* Chaos attack validated.
* Chaos attack cancelled.
* Chest result ready.
* Wheel result ready.
* Daily Quest completed.
* Hospital entered.
* Hospital released.
* Phoenix triggered.
* Admin correction.
* Game reset.
* Game paused/resumed.
* Game ended.

Suggested shape:

```ts
type PlayerNotification = {
  id: string;
  gameRunId: string;
  playerId: string;
  type: string;

  title: string;
  body: string;

  relatedRecordId?: string;
  route?: string;

  createdAt: string;
  readAt?: string;
};
```

Notifications:

* Persist for offline players.
* Have read/unread state.
* Never contain secrets.
* Never replace authoritative state checks.
* Are not required before core systems can function.

---

# Acceptance Tests

## Missed Realtime Event Recovers

```text
Given a client misses a Chaos event,
when the app regains focus,
then it loads the authoritative lock
and shows the blocking modal.
```

## Duplicate Mutation Is Not Applied

```text
Given a command response is lost,
when the client reconnects and checks the idempotency key,
then it receives the existing result
without applying the mutation again.
```

## Reset Invalidates Old Cache

```text
Given the active game run changes,
then clients clear old run-scoped state
and no stale row is displayed or mutated.
```

## Notification Failure Does Not Break State

```text
Given notification insertion or delivery fails,
then the committed gameplay transaction remains valid
and the client recovers through authoritative state refresh.
```
