# Kempape Rules Documentation

This directory contains the canonical Markdown handoffs for the Kempape MVP.

## Authority

1. `rules/config.md` owns fixed timing, timezone, final-midnight behavior, and the Chaos resolution window.
2. `rules/game-lifecycle-and-reset.md` owns game runs, testing, phases, reset, pause, and end behavior.
3. `rules/validation-pool.md` owns the shared two-tab validation interface and the no-rejection rule.
4. Each system-specific document owns the mechanics named in its title.
5. `ASSETS.md` owns runtime asset locations and naming.
6. `DECISIONS-2026-07-14.md` records the latest approved cross-system decisions.

Do not keep older TXT copies beside these canonical Markdown files.

## Cross-System Rules

- [Approved Flow Decisions](DECISIONS-2026-07-14.md)
- [Asset Locations and Naming](ASSETS.md)

## Rule Files

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

## Instructions for Codex

- Read `AGENTS.md`, this index, the decision record, and all relevant rules before coding.
- Do not silently change probabilities, rewards, cooldowns, limits, validation rules, or timing.
- There is no normal-player rejection operation for Actions or Chaos Cards.
- All gameplay state must be scoped to the active `game_run_id`.
- All gameplay mutations must be server-authoritative, authenticated, atomic, idempotent, and safe after reconnect.
- Realtime delivery never replaces server-side state checks.
- Add or update automated tests whenever a mechanic changes.
- Record any remaining unresolved assumption before implementing it.
