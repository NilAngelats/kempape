# System architecture

## Recommendation

Keep a single Next.js application and PostgreSQL/Supabase. Server Components/route handlers render/query; authenticated command endpoints call versioned PostgreSQL functions for critical transactions. Use Zod at HTTP boundaries and SQL constraints inside the database. Do not add an ORM until a concrete need exceeds typed Supabase access.

Client responsibilities: mobile UI, accessible reveals/countdowns, command idempotency keys, cache invalidation, and authoritative refetch. It never supplies outcomes, balances, damage, completion times, or randomness.

Server responsibilities: authenticate hashed session cookie, authorize role/player, resolve active `game_run_id`, use database/server time, validate phase/status, call one transaction, map stable domain errors, and publish non-secret invalidation events.

Database responsibilities: source of truth, constraints, row locks/advisory locks where needed, append-only ledgers/results/audits, global supply reservations, unique idempotency records, and transactional outbox.

Background responsibilities: a small leased worker/cron calls idempotent processors for due Hospital exits, regeneration/gold intervals, Action/festival cancellation, midnight heal, and 03:00/03:15 transitions. Every effect is also lazily caught up on authoritative interaction; no global midnight rewrite is the sole mechanism.

Realtime: Supabase Realtime on a narrow outbox/channel is simplest for the small group. Messages carry run ID, entity ID, version and event kind, not canonical state. Refetch after reconnect/focus and use short polling fallback.

Assets: typed build-time registry generated/validated against `public/assets/manifest.json`; definitions reference `imageKey`. Missing keys fail validation and never silently substitute.

Security/operations: HTTPS, `HttpOnly Secure SameSite=Lax` hashed session tokens, hashed invite codes, CSRF protection, rate limits, server-only service key, restrictive RLS, cryptographic DB/server randomness, structured logs with request/command/run IDs, Sentry-compatible error reporting, database metrics and audited admin operations.

Deployment: one Next.js deployment plus managed Supabase in an EU region close to Berlin/Madrid; one scheduled worker endpoint protected by a secret and database lease. Pin migrations, take backups before live/reset, and document restore. Post-festival queries remain read-only.

Errors use stable codes (`UNAUTHENTICATED`, `FORBIDDEN`, `STALE_RUN`, `PHASE_BLOCKED`, `HOSPITALIZED`, `CHAOS_LOCKED`, `CONFLICT`, `INSUFFICIENT_BALANCE`, `ALREADY_PROCESSED`) plus safe display text and optional authoritative result/version.
