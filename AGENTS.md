# AGENTS.md

Before implementing or modifying Kempape:

1. Read `docs/INDEX.md`.
2. Read `docs/DECISIONS-2026-07-14.md`.
3. Read all relevant documents under `docs/rules/`.
4. Read `docs/ASSETS.md` before implementing visual components.
5. Treat `docs/rules/config.md` as authoritative for fixed festival timing and the July 20 exception.
6. Treat `docs/rules/game-lifecycle-and-reset.md` as authoritative for game runs, testing, reset, pause, and end behavior.
7. Treat `docs/rules/validation-pool.md` as authoritative for the two validation tabs and the no-rejection rule.
8. Do not silently invent or modify game rules.
9. Scope every gameplay row and mutation to the active `game_run_id`.
10. Keep gameplay mutations server-authoritative, authenticated, atomic, and idempotent.
11. Use server time for cooldowns, Hospital timers, game phases, daily keys, and event boundaries.
12. Enforce Hospital, Chaos-lock, pause, end, and stale-run restrictions on the server.
13. Realtime events are not the source of truth; refetch authoritative state on load, focus, and reconnect.
14. Prioritize database correctness, synchronization, and recovery before notifications and animations.
15. Add automated tests for every changed mechanic and edge case.
16. Runtime artwork must load from `public/assets/`.
17. Match assets through canonical IDs, `imageKey`, and `public/assets/manifest.json`.
18. Do not guess or silently substitute missing asset files.
19. Never commit invite codes, session secrets, Supabase secret keys, or database credentials.
