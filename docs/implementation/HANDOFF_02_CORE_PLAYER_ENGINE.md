# Handoff 02 — Core player engine

## Implemented

Handoff 2 adds the reusable, run-scoped player progression foundation. `total_xp` remains authoritative; the cached level is transactionally recalculated and checked. It includes exact Level 1–40 thresholds, capped XP mutation, level gain/loss HP behavior, one-time level rewards, free Chest-opening credits, coin and XP ledgers, healing, midnight full-heal processing, activity/outbox production, and a typed core-player projection used by Home and the shell.

Actions, Quests, inventory contents, Equipment effects, Combat, Hospital transitions, Chest opening, Wheel and Ranking queries remain deferred.

## Migration 0002

`supabase/migrations/0002_core_player_engine.sql` is forward-only and leaves applied migration 0001 unchanged. It adds the canonical threshold table; normalized claimed rewards and free credits; append-only XP/coin ledgers; midnight applications; activity events; and initialization/invariant triggers. Every new table has forced RLS and no browser privileges. Functions use a fixed `public, pg_temp` search path and command execution is restricted to `service_role`.

## XP, HP, coins and rewards

`src/lib/game/xp.ts` is the checked-in TypeScript canonical curve. Migration 0002 mirrors those exact values so SQL never approximates it. XP clamps to 0–40,130; Level 40 has no next-level requirement and percentage rewards return zero. Max HP is `100 + (level - 1) * 5`. Level gains add five current HP per crossed level; losses only clamp to the derived maximum.

Levels 2–40 grant five coins once, or fifteen total every fifth level. Unique run/player/level claims prevent re-level farming. Milestone Small/Medium/Big opening credits persist through level loss. Coin changes lock the state, reject overdrafts, and update balance plus ledger atomically.

## Idempotency and events

`core_mutate_xp`, `core_change_coins`, and `core_heal_player` validate the active run, authorize the actor, lock state, claim the Handoff 1 idempotency record, reject request-hash conflicts, and replay completed results. State, accounting, rewards, activity and outbox events commit together. No generic browser mutation endpoint exists.

## Midnight healing

`core_process_midnight_heals` is bounded and protected by an advisory transaction lock. Unique run/player/day records make retries harmless and hospitalized players are skipped. Global pause freezes personal timers but does not suppress the fixed canonical midnight heal. `final-midnight` heals eligible players without creating a fifth cycle. The future scheduled HTTP adapter must require `INTERNAL_JOB_SECRET`, derive eligibility from server time and repeatedly invoke bounded batches.

## Read model and UI

Bootstrap creates `CorePlayerReadModel` with identity, XP progress, derived level/Max HP, HP percentage, coins, credits and lifecycle. Home and the persistent shell show real values, including `Level 40 — MAX`, without exposing credentials or internal records.

## Validation and linked-development runbook

Run `npm run check`, `git diff --check`, and `git status --short`. PostgreSQL runtime, RLS and concurrency cases require a local database; static checks are not a substitute.

Human review may run:

```powershell
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

Stop for explicit authorization. Only after authorization:

```powershell
npx supabase db push --linked
npx supabase migration list --linked
npx supabase db lint --linked --level error --fail-on error
```

Never use linked reset or migration repair.

## Known limitations

- PostgreSQL runtime/RLS/concurrency validation remains pending when local Supabase is unavailable.
- The protected scheduled HTTP adapter is deferred; the bounded SQL processor is ready for it.
- No background cleanup job for abandoned failed/processing idempotency records is added.
- Free credits cannot be consumed before the Chest handoff.

## PostgreSQL lint correction — migration 0003

After migration 0002 was applied to linked `kempape-dev`, `supabase db lint --linked --level error --fail-on error` reported an ambiguous `result` reference in `core_change_coins`, `core_heal_player`, and `core_mutate_xp`. Each function used `result` as both a local PL/pgSQL variable and the target table column in an idempotency-record update.

Migration `0003_fix_core_function_result_ambiguity.sql` replaces those three functions forward-only. Command responses now use `v_result`; the persistence update aliases `idempotency_records` as `ir`, assigns `ir.result` from `v_result`, and qualifies its predicate columns. Function signatures, safe search paths, security-definer status, service-role-only execution, row locks, completed-result replay, fingerprint conflict rejection, ledgers, rewards and transactional events are preserved.

Migration 0002 was not edited because it is applied shared history. A static test records its SHA-256 fingerprint and rejects ambiguous SQL self-assignment patterns in migration 0003.

Migration 0003 must remain local until human review. Remaining validation is:

```powershell
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

After explicit authorization, a human may apply 0003 and verify:

```powershell
npx supabase db push --linked
npx supabase migration list --linked
npx supabase db lint --linked --level error --fail-on error
```

## Authoritative lifecycle correction

Runtime lifecycle now flows from `active_game_run` to its referenced `game_runs` row, through server bootstrap into `RunLifecycleInput`, and then into the shared lifecycle calculator. Persisted `phase`, `scheduled_starts_at`, `started_at`, `normal_gameplay_ends_at`, `chaos_resolution_ends_at`, and durable pause intervals determine the server-rendered state. `FESTIVAL_CONFIG` remains the canonical seeding/default schedule and festival-calendar authority, but does not replace timestamps from an existing run.

A live run whose `started_at` is in the past is active even if the default production start is later. A run with no `started_at` and a future persisted schedule remains `before_start`. Normal end enters `chaos_resolution`; Chaos end, `ended`/`archived` phases end the run. Missing active-run state renders an explicit unavailable state instead of a misleading countdown.

### Explicit development lifecycle testing

The lifecycle test script never runs automatically, refuses `NODE_ENV=production`, and requires an acknowledgement flag. Local Supabase examples:

```powershell
npm run lifecycle:dev -- --state=scheduled --acknowledge-development-run-mutation
npm run lifecycle:dev -- --state=live --acknowledge-development-run-mutation
npm run lifecycle:dev -- --state=paused --acknowledge-development-run-mutation
npm run lifecycle:dev -- --state=chaos --acknowledge-development-run-mutation
npm run lifecycle:dev -- --state=ended --acknowledge-development-run-mutation
```

Hosted development is additionally refused unless `ALLOW_LINKED_LIFECYCLE_TEST=true` is explicitly present for that one reviewed invocation. This flag must never be enabled in production.

Restore the active development run to the canonical production launch schedule with:

```powershell
npm run lifecycle:dev -- --state=restore --acknowledge-development-run-mutation
```

For a deliberately reviewed linked-development test, set `ALLOW_LINKED_LIFECYCLE_TEST=true` only for the test and restoration invocations, then remove it. The script never changes production constants and never executes without an operator command.
