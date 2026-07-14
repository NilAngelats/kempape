# Source-of-truth map

Precedence is explicit deployment configuration, latest dated approved decision, dedicated system rule, then general summaries. `DECISIONS-2026-07-15.md` supersedes earlier documents only for normal Action rejection/expiry, capped Level-40 XP, and pause confirmation.

| System | Authority |
|---|---|
| Festival clock, four cycle keys, July 20, 03:00/03:15 | `rules/config.md` |
| Run/test/reset/global pause/end/stale requests | `rules/game-lifecycle-and-reset.md` |
| Normal Action Accept/Reject/two-hour expiry/statuses | `DECISIONS-2026-07-15.md`, then `rules/actions.md` for unaffected mechanics |
| Chaos validation-only tab and no normal timeout | `rules/chaos-cards.md` |
| Level 40 XP clamp and ranking ties | `DECISIONS-2026-07-15.md`, then XP/ranking rules for unaffected mechanics |
| Other approved cross-system flows | `DECISIONS-2026-07-14.md` |
| Auth, stats, HP, Quests, inventory, equipment, consumables, Hospital, Chests, Wheel, realtime, admin | matching dedicated `rules/` file |
| Economy summary | `rules/economy.md`, subordinate to dedicated reward-system documents |
| Assets | `ASSETS.md`, then reviewed `public/assets/manifest.json` |

Code, migrations, seeds, tests, README and historical audits never override rules. Missing exact values remain open. Every gameplay mutation is authenticated, server-authoritative, active-run scoped, atomic, idempotent, server-timed, and recoverable after ambiguity. Database state is truth; realtime is an invalidation hint.
