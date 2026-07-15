# Handoff 01 — Foundation and authentication

## Implemented

Handoff 1 replaces the confirmed-unapplied pre-freeze migration with a canonical foundation. It adds global characters, players, invite credentials and sessions; run identity, active-run pointer, durable pauses and player/run assignments; and shared idempotency, audit and outbox primitives. Gameplay systems remain deferred.

## Database and security

All festival state carries `game_run_id`. Constraints enforce one active invite per player, one active-run pointer, one open pause per run, session ownership, run/player uniqueness, bounded foundational stats and scoped idempotency keys. Every application table has forced RLS and no `anon` or `authenticated` privileges. Custom sessions do not pretend to be Supabase Auth identities. The service role is imported only by `server-only` modules.

`redeem_invite_code` atomically rate-checks, verifies an HMAC lookup hash, locks the invite/player, increments `session_version`, revokes older sessions, creates the hashed new session, updates safe metadata and audits success. Server-only admin pause/resume functions lock and transition the active run. No migration was applied to the hosted project.

## Authentication and session flow

Codes normalize case and approved whitespace/hyphen separators, require the `KMP` prefix plus 16 non-ambiguous characters, and are HMAC-SHA-256 hashed with a server-only secret. Failed logins are limited to five per hashed network/device scope in ten minutes. Invalid, revoked and disabled cases share one response.

Sessions use 256-bit opaque random tokens. Only an HMAC hash is stored. The cookie is `HttpOnly`, `SameSite=Lax`, path `/`, secure in production and defaults to 30 days. Restoration checks token shape, expiry, revocation, account status and session version, and throttles `last_seen_at` writes to fifteen minutes. Invalid credentials redirect through `/auth/clear-session`, which expires the cookie and returns to login without a loop. Database failures propagate as infrastructure failures and do not clear the cookie. Logout is repeat-safe and clears the cookie.

## Lifecycle and pause

`src/lib/game/config.ts` is the single fixed schedule source: Europe/Berlin, 16 July 11:30 through 20 July 03:00, followed by the documented 03:15 Chaos-resolution boundary for later use. The lifecycle API returns server time, `before_start|active|paused|ended`, mutation eligibility, four canonical day keys, start/end countdowns, final-midnight state and pause-aware elapsed time. July 20 midnight stays in cycle four. Durable pause intervals exclude paused time; players cannot call pause/resume.

## Routes and shell

`/` selects `/login` or `/app` from the server session. `/login` redirects restored sessions. `/app` and all child routes restore sessions server-side. The home route renders before-start, active, global-pause or ended/read-only state. The five primary destinations are Home, Actions, Store, Quests and Action Pool. Inventory is a secondary route opened from the Home/character area, not a bottom-navigation destination. `/app/hospital` and future system routes are honest placeholders and expose no fake gameplay.

Navigation authority for this correction is the explicit Handoff 1 acceptance direction dated 2026-07-15, which names Home, Actions, Store, Quests and Action Pool/Validation and asks that Inventory follow its intended secondary entry. This latest explicit direction supersedes the older proposed missing-key list in `docs/architecture/10_ASSET_REGISTRY_PLAN.md` for this named navigation topic. The resulting stable keys are `nav_home`, `nav_actions`, `nav_store`, `nav_quests` and `nav_action_pool`.

## Assets

`public/assets/manifest.json` and the typed registry establish stable categories and validation. The only Handoff 1 raster mapping is the non-assignable character template. Production characters/faces, navigation raster icons, logo and background remain explicitly unresolved; code-native navigation symbols and CSS provide a neutral shell without substituting unrelated artwork. The development character intentionally uses an unresolved development-only image key and does not treat the template as assigned art.

## Environment

Required server values are `APP_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INVITE_CODE_HASH_SECRET`, `SESSION_TOKEN_HASH_SECRET`, and `RATE_LIMIT_HASH_SECRET`. Optional/defaulted values are `SESSION_COOKIE_NAME`, `SESSION_TTL_DAYS`, and `INTERNAL_JOB_SECRET`. Public Supabase values are documented but unused. See `.env.example`; never commit `.env.local`.

## Development data

After starting local Supabase and applying the migration, run `npm run seed:dev`. It creates/upserts the definition, player, live run, active pointer and player/run state. It generates an active invite only when missing and prints the raw value once. Re-running does not duplicate canonical records and does not reveal or replace an existing invite. Production execution is refused unless `ALLOW_PRODUCTION_SEED=true` is deliberately set.

## Known limitations and deferred work

Local PostgreSQL/RLS tests require Docker and the local Supabase CLI. Production character/face assets are unavailable. Full reset orchestration, CSRF tokens for later gameplay commands, realtime, scheduled processors, Playwright E2E and all gameplay domains belong to later roadmap handoffs. The Handoff 1 login/session integration boundary is implemented in SQL and route handlers; database integration tests run only against an available local stack.

## Hosted development validation runbook

This runbook is only for the empty linked `kempape-dev` development project. Confirm the linked project identity and obtain explicit human authorization before the push step. `supabase db push` changes the hosted development schema; the dry run does not authorize the real push.

```powershell
npx supabase migration list --linked
npx supabase db push --dry-run
```

Stop here for human review and explicit authorization. Only after authorization:

```powershell
npx supabase db push
npx supabase migration list --linked
npx supabase db lint --linked --level error --fail-on error
```

Do not use `supabase db reset --linked` or `supabase migration repair` in this workflow. After schema validation, execute the database-backed invite authentication acceptance cases against development data: valid/invalid/revoked/disabled login, rate-limit boundary, session restoration/expiry/version invalidation, second-login invalidation, repeated logout, anonymous RLS denial, and confirmation that no raw credential is persisted.

## XP correction scope

Handoff 1 only corrects the pre-existing scaffold to enforce the approved Level-40 total-XP cap of 40,130 and to return no Level-40 reward basis. It does not add progression transactions, XP events, level reward processing, death processing or any Handoff 2 player engine behavior.
