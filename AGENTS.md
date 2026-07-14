# AGENTS.md

Before implementing or modifying Kempape:

1. Read `docs/INDEX.md`, the latest dated decisions, relevant `docs/rules/`, and relevant `docs/architecture/` files.
2. Latest explicit dated decisions override older conflicting prose only for their named topics; never silently invent or change rules.
3. `rules/config.md` owns timing/July 20; lifecycle owns runs/reset/global pause/end. July 15 owns normal Action Accept/Reject/two-hour expiry and capped Level-40 XP.
4. Read `docs/ASSETS.md` before visual work. Runtime art uses `public/assets/manifest.json`, canonical IDs and `imageKey`; never guess missing art.
5. Scope gameplay rows/mutations to active `game_run_id`; reject stale runs.
6. Mutations are server-authoritative, authenticated, authorized, atomic, idempotent, and use server time and secure randomness.
7. Enforce Hospital, Chaos lock, pause, end and phase restrictions server-side. Realtime is invalidation, never truth; refetch on load/focus/reconnect.
8. Treat `supabase/migrations/0001_initial_schema.sql` as pre-freeze scaffold. Replace only if never applied importantly; otherwise add forward migrations. Never rewrite shared migration history.
9. Keep gameplay values integral and follow dedicated rounding order. Clamp total XP to the configured Level-40 threshold.
10. Add mechanic, transaction, concurrency, stale-run, reconnect and boundary tests as applicable. Run `npm run check`.
11. Never commit invite codes, session secrets, Supabase secret keys, database credentials or `.env.local`.
