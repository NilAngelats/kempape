# Approved Flow Decisions — 2026-07-14

This decision record summarizes the rules integrated into the canonical handoffs.

## Chaos Cards

* Combat is snapshotted when the card is used.
* Later equipment, level, or stat changes do not modify the pending attack.
* A Chaos-locked target cannot receive another Chaos attack.
* Hospitalized, dead, disabled, and Chaos-locked players are untargetable.
* An active, non-hospitalized, non-Chaos-locked player is targetable.
* Attacker death or Hospital entry does not cancel a committed outgoing attack.
* Each player may have up to two unresolved outgoing Chaos attacks.
* A resolved or cancelled attack immediately frees one outgoing slot.
* The target remains blocked until validation or admin/festival cancellation.
* Attacker-side Mirror/Thorns damage is deferred when the attacker is already hospitalized.
* At 03:00, only existing Chaos validations and admin controls remain.
* At 03:15, unresolved Chaos attacks are cancelled, cards returned, targets unlocked, and ranking frozen.

## Normal Actions

* A normal Action cannot be rejected.
* The Validation Pool exposes `VALIDATE` only.
* A pending Action has no automatic expiration.
* The specific Action is unavailable to its owner while pending.
* Cooldown, rewards, HP cost, and usages begin/apply only after validation.
* A maximum of three normal Actions may be pending per player.
* Chaos lock temporarily makes the owner's pending Actions unavailable.
* Hospital, reset, or festival end cancels pending Actions without reward.

## Validation Pool

* Two tabs: `ACTIONS` and `CHAOS CARDS`.
* Both use one `VALIDATE` button.
* No normal-player rejection exists anywhere.

## Game Runs and Reset

* MVP uses one private game with test and live runs.
* All gameplay state is scoped by `game_run_id`.
* Admin can remotely `Reset & Start Fresh`.
* Reset archives the old run and atomically creates a clean run.
* Player accounts, characters, invite codes, roles, and sessions are preserved.
* A reset does not extend the fixed festival end.

## Realtime and Presentation

* Correct database state and reconnect recovery have priority over notifications and animations.
* Blocking state is enforced by the server even when realtime delivery fails.
* Persistent notifications are a later MVP phase.
* Level gains use one summary modal, not one modal per level.
* Daily boundary refresh is nonblocking.

## Level 40

* Displayed level and Max HP cap at Level 40.
* Total XP continues increasing for ranking.
* Level rewards stop.
* XP consumables cannot be used at Level 40.
* Percentage rewards use a virtual 4,110 XP requirement and the Level 31–40 multiplier.
* Death penalties can cause a Level 40 player to level down.
