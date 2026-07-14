# Kempape — Game Lifecycle, Testing, and Reset Handoff

## Purpose

The MVP supports one private festival game, but it must also support:

* Testing before the festival.
* A clean transition from testing to live play.
* A remote admin `Reset & Start Fresh`.
* A fixed final end time.
* A safe final Chaos resolution window.
* Full separation between old and current gameplay state.

The MVP does not include a public game-creation wizard.

A future version may allow users to create games lasting one to six days, choose start/end times, and invite players.

---

# Game Run Model

Do not treat the whole database as one permanently mutable match.

Create a `game_run` identity.

Global records:

* Player accounts.
* Character assignments.
* Invite-code records.
* Admin roles.
* Game definitions.
* Assets and configuration.

Run-scoped records:

* Player HP, XP, level, and coins.
* Inventory.
* Equipped items.
* Cooldowns and usages.
* Daily Quests.
* Wheel state.
* Chest credits and results.
* Action submissions.
* Chaos attacks and locks.
* Hospital stays.
* Phoenix usage.
* Notifications.
* Activity events.
* Ranking state.

Every run-scoped table must include:

```text
game_run_id
```

Every gameplay command must use the current active run ID and reject stale-run commands.

---

# Suggested Game Run Shape

```ts
type GameRun = {
  id: string;

  mode: "testing" | "live";
  phase:
    | "setup"
    | "testing"
    | "live"
    | "paused"
    | "chaos_resolution"
    | "ended"
    | "archived";

  startedAt?: string;
  normalGameplayEndsAt: string;
  chaosResolutionEndsAt: string;

  createdByAdminId: string;
  resetFromGameRunId?: string;
  resetReason?: string;

  endedAt?: string;
  archivedAt?: string;

  stateVersion: number;
};
```

A single server-side configuration record identifies the current active run.

---

# Pre-Festival Testing

Before the scheduled live start, the admin may create a `testing` run.

Testing uses the real game systems:

* Invite-code sessions.
* Actions and validation.
* Chaos Cards.
* Equipment.
* Realtime.
* Chests.
* Wheel.
* Quests.
* Hospital.
* Admin tools.

Test data must be run-scoped.

Before live play, the admin uses:

```text
Reset & Start Fresh
```

This archives the test run and creates a new clean live run.

Do not manually delete test rows from multiple tables.

---

# Scheduled Live Window

The approved MVP schedule is defined in `config.md`.

Normal gameplay:

```text
2026-07-16 11:30
through
2026-07-20 03:00
Europe/Berlin
```

Chaos resolution:

```text
2026-07-20 03:00
through
2026-07-20 03:15
Europe/Berlin
```

The admin may reset and start a fresh live run after the scheduled start.

Example:

```text
Scheduled start: 12:00
Admin reset: 16:00

Fresh run starts at 16:00.
The final end remains unchanged.
```

A reset never extends the fixed festival end.

Daily boundaries remain based on the configured `Europe/Berlin` calendar, not on the reset timestamp.

---

# Reset & Start Fresh

## Purpose

The admin can remotely discard the current gameplay run and start all players from the approved initial state.

This is intended for:

* Test-to-live transition.
* A severe early gameplay mistake.
* A schema or logic problem discovered during the event.
* A group-approved fresh restart.
* A corrupted or desynchronized run.

It is not a normal player feature.

## Security Flow

1. Admin opens the mobile Admin panel.
2. Admin selects `Reset & Start Fresh`.
3. The server displays the effects of the reset.
4. Admin enters a required reason.
5. The server generates a one-time confirmation code.
6. Admin types the code before it expires.
7. Admin confirms the final destructive action.
8. The server performs one atomic run switch.

The admin must have an authenticated session with the `admin` role.

The reset endpoint must also require:

* Recent admin authentication.
* Rate limiting.
* CSRF protection.
* Idempotency key.
* Audit logging.

## Reset Transaction

The server atomically:

1. Locks the current active run.
2. Confirms no other reset is running.
3. Creates a new game run.
4. Initializes every enabled player.
5. Sets the new run as active.
6. Archives the previous run.
7. Records the reset reason and admin.
8. Increments the global run/state version.
9. Broadcasts `game_run_changed`.
10. Commits.

Do not delete or partially reset the previous run.

---

# Fresh Player State

Every enabled player starts the new run with:

```text
Level: 1
Total XP: 0
Current HP: 100
Max HP: 100
Coins: 50
Gameplay status: active
Deaths: 0
```

Reset to empty:

* Equipment inventory.
* Consumable inventory.
* Chaos Card inventory.
* Equipped items.
* Equipment cooldowns.
* Action cooldowns.
* Action usages.
* Pending normal Actions.
* Pending Chaos attacks.
* Chaos locks.
* Deferred Chaos attacker damage.
* Hospital stays.
* Phoenix usage.
* Chest credits and pending reveals.
* Wheel results and Fortune uses.
* Quest progress.
* Activity counters.
* Non-audit notifications.

For the current valid festival day:

* Generate fresh Daily Quest assignments.
* Make the normal Daily Wheel spin available.
* Reset current-day caps and Extreme Challenge use when that day permits them.
* Do not create a fifth-day entitlement during the July 20 exception.

---

# Data Preserved Across Reset

Preserve:

* Player accounts.
* Display names.
* Character assignments.
* Player faces and assets.
* Invite-code hashes.
* Active login sessions.
* Admin roles.
* Game definitions.
* Asset manifest.
* Canonical configuration.
* Previous run data.
* Audit history.

Existing player sessions automatically load the new active run after the reset event.

Players do not need new invite codes.

---

# Client Reset Behavior

When `game_run_changed` is received:

1. Stop all pending client mutations.
2. Clear run-scoped local caches.
3. Discard stale optimistic UI.
4. Close normal modals.
5. Load the new active run.
6. Load the player's fresh state.
7. Redirect to Home.
8. Show a simple message.

```text
The game was reset by the admin.
A fresh run has started.
```

Every old request carrying the previous `game_run_id` must fail safely.

---

# Pause and Resume

The admin may pause a live run.

While paused:

* No normal player mutation is allowed.
* Personal timers do not advance.
* Players may view read-only state.
* Admin inspection and correction remain available.

On resume:

* Personal timers continue from their preserved progress.
* No timer catches up for the paused duration.

Pause is different from a Chaos lock:

* Pause affects the whole run.
* Chaos lock affects one target.

---

# Manual Early End

The admin may end the game early.

The same two-step confirmation and reason requirements apply.

Recommended behavior:

1. Stop new normal gameplay.
2. Enter a configurable short Chaos resolution phase when unresolved Chaos attacks exist.
3. Resolve or cancel them according to admin choice.
4. Freeze ranking.
5. Mark the run ended.
6. Preserve the complete audit history.

---

# Future Version Scope

Not part of MVP implementation:

* Public game creation.
* User-selected duration.
* User-selected start/end.
* Multiple simultaneous independent games.
* Public invitation links.
* Game ownership transfer.
* Self-service player management.

The run-scoped architecture should make these features possible later without implementing them now.

---

# Acceptance Tests

## Test Run Is Isolated

```text
Given a testing run contains gameplay data,
when the admin starts a fresh live run,
then all new gameplay uses the new game_run_id
and the testing data remains archived.
```

## Reset Is Atomic

```text
Given the admin confirms a reset,
then either the complete new run becomes active
or the old run remains active.

A partially initialized run is never exposed.
```

## Sessions Survive Reset

```text
Given a player is logged in during reset,
when the client receives game_run_changed,
then the session remains valid
and the player loads fresh state from the new run.
```

## Stale Request Is Rejected

```text
Given a request references the archived run,
when it reaches the server,
then it is rejected
and changes no current-run state.
```

## Reset Does Not Extend Festival

```text
Given the live run is reset after the scheduled start,
then the new run starts at the reset time
but retains the configured final end.
```
