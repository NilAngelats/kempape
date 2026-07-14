# Implementation roadmap

## Handoff 1 — Foundation, authentication, configuration, app shell

- Dependencies: approved Handoff 0; choose migration-forward strategy from deployment evidence.
- Scope: GameRun/active pointer/pause intervals, invite sessions, RLS, command/idempotency wrapper, FestivalClock, reset shell.
- Out: player mechanics, Actions/items/combat/rewards.
- Database/server/UI: corrective or replacement foundation migration; auth/run commands; login, mobile shell, minimal admin run controls.
- Tests: auth/rate/role/RLS, atomic reset, stale run, pause/resume time, reconnect bootstrap.
- Completion: secure session and fresh run work end-to-end; `npm run check`; schema reviewed.
- Parallel: shell UI may proceed against frozen contracts; schema/auth ordering remains sequential.

## Handoff 2 — Core player engine

- Dependencies: H1.
- Scope: PlayerRunState, capped XP/levels, HP, coins/ledgers, reward/idempotency primitives, activity/outbox.
- Out: Actions, inventory, combat, Chests, Wheel.
- Database/server/UI: run-state/ledger/grant schema; atomic XP/HP/coin services; Home stat projections.
- Tests: thresholds and Level-40 clamp/ties, death loss/level-down, rounding, duplicate/concurrent grants, pause/time boundaries.
- Completion: invariants enforced in SQL and service tests; reconnect returns authoritative version.
- Parallel: pure calculators and Home UI may parallel SQL after types freeze.

## Handoff 3 — Actions, validation, Daily Quests

- Dependencies: H2 eligibility/reward primitives.
- Scope: pending/accept/reject/two-hour expiry/cancellation, cooldown/usages, validation pool Actions tab, quests.
- Out: Chaos tab/combat, inventory systems.
- Database/server/UI: submission/state/usage/quest schema and commands; Accept/Reject UI/countdowns.
- Tests: duplicate validators, reject/expire no effects, expiry race, Hospital cancel, quest ordering, caps/midnight/stale run.
- Completion: all terminal states and recovery paths authoritative/idempotent.
- Parallel: H4 may begin after common eligibility/event contracts stabilize.

## Handoff 4 — Inventory, Equipment, Consumables

- Dependencies: H2; shared status guards coordinated with H3.
- Scope: stacks/copies/slots/cooldowns/passives and consumable effects excluding Chaos resolution.
- Out: combat, Store/Chests, Wheel.
- Database/server/UI: ownership/supply/slot/cursor schema; equip/use commands; inventory/equipment UI.
- Tests: atomic replacement, item cooldowns, stack overflow, duplicate use, pause/Hospital/Chaos interval behavior.
- Completion: ownership/effects recover after restart and conserve items.
- Parallel: safe with late H3 after shared guard contracts freeze.

## Handoff 5 — Chaos, Combat, Death, Hospital

- Dependencies: H3 validation and H4 inventory/equipment.
- Scope: attack snapshot/locks, two outgoing/one incoming, Chaos tab, Mirror/Thorns/Phoenix, death/stays/deferred damage.
- Out: Chest/Wheel reward generation.
- Database/server/UI: combat/lock/stay/application tables; commands; blocking modal and Hospital UI.
- Tests: simultaneous lethal damage, immutable snapshots, stale targets, deferred effects, Hospital cancellation, 03:00/03:15.
- Completion: no double damage/card loss/orphan lock under retries/reconnect.
- Parallel: presentation can follow frozen transaction response models.

## Handoff 6 — Economy, Reward Engine, Store, Chests

- Dependencies: H4 inventory/supply and H5 status/death guards.
- Scope: coin ledger integration, secure weighted grants, free credits, openings/overflow/reveal recovery.
- Out: Wheel, ranking/notifications.
- Database/server/UI: openings/rewards/credits; reward and Chest commands; Store/reveal UI.
- Tests: probability fixtures, final limited copy concurrency, duplicate open, payment conservation, overflow caps, interrupted reveal.
- Completion: immutable server result survives connection loss without reroll/payment duplication.
- Parallel: pure reward logic and Store UI may parallel after result contract.

## Handoff 7 — Daily Wheel and Fortune Tickets

- Dependencies: H6 reward engine; H5 punishment/combat.
- Scope: daily/Fortune entitlements, secure spins, outcomes/punishments, reveal recovery.
- Out: ranking/realtime platform and admin polish.
- Database/server/UI: Wheel state/spins; commands; Wheel/reveal UI.
- Tests: one daily/day, July 20 exception, duplicate spins, Fortune consumption, overflow/punishment, reconnect.
- Completion: exactly-once result and recovery for every source.
- Parallel: UI after result contract; otherwise sequential on H6.

## Handoff 8 — Ranking, realtime, activity, notifications

- Dependencies: stable events from H2–H7.
- Scope: capped-XP competition ranking, final snapshot, safe activity, invalidations/reconnect, persistent notifications.
- Out: new mechanics and deployment administration.
- Database/server/UI: ranking projection/snapshot, outbox/notifications; queries/delivery; ranking/activity/inbox UI.
- Tests: Level-40 ties, freeze, privacy, missed/duplicate/out-of-order events, polling fallback, run reset.
- Completion: missed realtime never leaves persistent incorrect state.
- Parallel: domain subscription adapters and UI can proceed in parallel from envelope contract.

## Handoff 9 — Admin, integration, deployment, release hardening

- Dependencies: all prior; resolve manual early-end behavior and deployment/backup choices.
- Scope: corrections/emergency controls/audit, PWA, observability, CI, backups/restore, complete E2E/release runbook.
- Out: public game creation, guild/chat/payment/trading/crafting.
- Database/server/UI: admin correction/audit additions; hardened admin commands; mobile admin screens and offline UX.
- Tests: authorization/confirmation/idempotency, full E2E, load/concurrency, security, backup restore, live rehearsal.
- Completion: release checklist, restore drill, monitoring and rollback plan approved.
- Parallel: operational docs/observability may parallel final E2E; release is sequential gate.
