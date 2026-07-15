# Kempape Rules Documentation

Canonical Markdown handoffs for the Kempape MVP.

## Implementation

- [Handoff 02 — Core player engine](implementation/HANDOFF_02_CORE_PLAYER_ENGINE.md)

- [Handoff 01 — Foundation and authentication](implementation/HANDOFF_01_FOUNDATION_AUTH.md)

## Architecture freeze

- [Repository audit](architecture/00_REPOSITORY_AUDIT.md)
- [Documentation inventory](architecture/01_DOCUMENTATION_INVENTORY.md)
- [Source of truth](architecture/02_SOURCE_OF_TRUTH.md)
- [Conflicts and open decisions](architecture/03_CONFLICTS_AND_OPEN_DECISIONS.md)
- [System architecture](architecture/04_SYSTEM_ARCHITECTURE.md)
- [Domain boundaries](architecture/05_DOMAIN_BOUNDARIES.md)
- [Domain data model](architecture/06_DOMAIN_DATA_MODEL.md)
- [Transaction boundaries](architecture/07_TRANSACTION_BOUNDARIES.md)
- [Command and event map](architecture/08_COMMAND_AND_EVENT_MAP.md)
- [Time and realtime](architecture/09_TIME_AND_REALTIME_ARCHITECTURE.md)
- [Asset registry plan](architecture/10_ASSET_REGISTRY_PLAN.md)
- [Security and integrity](architecture/11_SECURITY_AND_INTEGRITY.md)
- [Test strategy](architecture/12_TEST_STRATEGY.md)
- [Implementation roadmap](architecture/13_IMPLEMENTATION_ROADMAP.md)

## Authority

1. `rules/config.md` owns fixed timing, timezone, final-midnight behavior and Chaos resolution.
2. [July 15 corrections](DECISIONS-2026-07-15.md) are the latest authority for Action rejection/expiry, capped Level-40 XP and pause confirmation.
3. [July 14 decisions](DECISIONS-2026-07-14.md) remain authoritative for topics not superseded on July 15.
4. `rules/game-lifecycle-and-reset.md` owns runs, testing, reset, global pause and end.
5. Each dedicated system document owns its unaffected mechanics.
6. `ASSETS.md` owns runtime locations/naming; the reviewed manifest will own exact mappings.

## Rule files

- [Actions](rules/actions.md)
- [Admin & Game Control](rules/admin-and-game-control.md)
- [Authentication & Onboarding](rules/authentication-and-onboarding.md)
- [Chaos Cards](rules/chaos-cards.md)
- [Chest System](rules/chest-system.md)
- [Festival Configuration](rules/config.md)
- [Consumables](rules/consumables.md)
- [Core Player Stats](rules/core-player-stats.md)
- [Daily Quests](rules/daily-quests.md)
- [Daily Wheel & Fortune Tickets](rules/daily-wheel-and-fortune-ticket-system.md)
- [Death & Hospital](rules/death-and-hospital-rules.md)
- [Economy](rules/economy.md)
- [Equipment](rules/equipment.md)
- [Game Lifecycle, Testing & Reset](rules/game-lifecycle-and-reset.md)
- [HP & Recovery](rules/hp-and-recovery.md)
- [Inventory & Equipment Changes](rules/inventory-and-equipment-change-system.md)
- [Player Ranking](rules/player-ranking-system.md)
- [Realtime & Notifications](rules/realtime-and-notifications.md)
- [Validation Pool](rules/validation-pool.md)
- [XP & Levels](rules/xp-system.md)

## Durable instructions

- Apply dated decisions before older conflicting prose; record unresolved assumptions.
- Normal Actions use Accept/Reject and two-hour expiry. Chaos remains validation-only.
- Clamp XP at Level 40; ranking may contain competition ties.
- Scope gameplay to active `game_run_id`; mutations are authenticated, server-authoritative, atomic, idempotent and server-timed.
- Realtime is not truth; refetch on load, focus and reconnect.
- Never invent values or asset substitutions. Add tests for changed mechanics.
