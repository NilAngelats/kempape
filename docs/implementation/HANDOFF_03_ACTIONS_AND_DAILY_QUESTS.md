# Handoff 03 — Actions and Daily Quests

## Implementation

Migration `0004_actions_and_daily_quests.sql` is forward-only after applied migrations 0001–0003. It adds the canonical Action definitions, five-state submissions, accepted usage, cooldowns, date-keyed Quest progress/distinct/completion records, and the narrow base Hospital stay required by lethal self-damage. All rows are active-run scoped where applicable, browser access is denied with forced RLS, and command functions are service-role only with fixed search paths.

The typed catalog contains 22 stable lowercase IDs. SQL stores XP as integer basis points and a parity test covers IDs and rewards. Existing art is mapped through `public/assets/manifest.json`; the four missing social images use the documented neutral fallback. Raw filenames never enter UI components.

## Commands and state transitions

`submit_action` validates the active run, player status, definition/configuration, pending limits, cooldown and caps, then creates `pending` with a server timestamp and two-hour expiry. It grants nothing. `reject_action_submission` records the validator and grants nothing. `accept_action_submission` locks the submission and both players, revalidates eligibility/caps and the consecutive-validator rule, and atomically applies Action reward, usage/cooldown, owner and validator Quest progress/rewards, fixed HP cost, and base lethal transition. Terminal states cannot return to pending. `cancel_pending_actions_for_player` is the reusable idempotent Hospital/admin/end hook.

Acceptance attribution uses `accepted_at` and Europe/Berlin. July 20 maps to July 19 so no fifth Quest day is created. Quest evaluation order is easy accepted, easy validations, easy variety, medium accepted, medium validations, then Daily Mastery. Rewards precede self-damage; death penalty follows all Action and newly completed Quest rewards. A lethal Action sets HP to zero, applies the canonical percentage XP loss, increments deaths, creates a 60-minute stay, and cancels pending Actions. Phoenix, Equipment and full Hospital processing remain deferred to Handoff 5.

Privacy-safe MVP validation stores no proof, partner names, stranger identity, intimate media, or reference details. Where distinct real-world people/groups/items are required, the validator attests uniqueness; the database does not claim to prove identity uniqueness.

## UI and development testing

Actions, Action Pool and Daily Quests replace their placeholders with mobile layouts and authoritative server reads. HP-cost submission asks for confirmation and explicitly says HP is lost only after acceptance. The Pool shows own submissions as awaiting validation and exposes Accept/Reject only to another player. Quest rewards are automatic.

Create guarded two-player development data only after applying migration 0004 locally:

```powershell
npm run actions:seed-dev -- --acknowledge-development-run-mutation
```

For a reviewed linked-development invocation, additionally set `ALLOW_LINKED_ACTION_TEST=true` for that invocation only. The script refuses production, is idempotent, preserves existing progression/invites, prints newly generated invite codes once, and never persists raw codes. Log in as Action Owner in a normal browser and Action Validator in an incognito window or second profile.

## Validation and limitations

Vitest covers catalog uniqueness/rewards/assets/Quest order and static migration security/status rules. PostgreSQL/RLS/concurrency behavior requires explicit runtime acceptance against a disposable local stack or the reviewed linked development project. Migration 0004 is present on linked `kempape-dev`; migration 0005 remains unapplied pending human review. Final realtime, automated expiry worker, full Hospital exit processing, character faces, four Action artworks, and final visual polish are deferred.

## PostgreSQL pgcrypto correction — migration 0005

After migration `0004_actions_and_daily_quests.sql` was applied to linked `kempape-dev`, database lint reported `function digest(text, unknown) does not exist` in `public.action_complete_eligible_quests` and `public.accept_action_submission`. Both are `SECURITY DEFINER` functions with the intentionally minimal fixed search path `public, pg_temp`. Supabase installs pgcrypto in the `extensions` schema, so the unqualified `digest(...)` calls from migration 0004 could not resolve through that safe search path.

Migration `0005_fix_pgcrypto_digest_resolution.sql` replaces the two deployed functions forward-only with their exact signatures and return types. Each request fingerprint now uses `extensions.digest(convert_to(input, 'UTF8'), 'sha256'::text)` before hexadecimal encoding. The migration does not add `extensions` to either function search path. Authorization, lifecycle checks, locks, idempotency behavior, Action and Quest rewards, Quest order, HP/death ordering, ledgers, activity/outbox writes, security-definer status and response payloads remain otherwise unchanged. Execution is explicitly revoked from `public`, `anon`, and `authenticated`, then granted only to `service_role`.

Migration 0004 is already shared applied history and therefore remains byte-for-byte immutable; a static SHA-256 regression test enforces that boundary. The SQL audit found no uses of `hmac`, `crypt`, or `gen_salt`. Its five unqualified pgcrypto digest calls were all inside the two functions replaced by migration 0005.

Codex must not push migration 0005. Human review should run:

```powershell
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

After explicit authorization, a human may apply and validate it:

```powershell
npx supabase db push --linked
npx supabase migration list --linked
npx supabase db lint --linked --level error --fail-on error
```

## Runtime hardening correction — migration 0006

Migrations 0001–0006 are applied shared history on linked `kempape-dev`; linked migration history matches local history and linked database lint completed successfully after migration 0006.

Runtime review found that the deployed Accept and Reject signatures accepted idempotency inputs without claiming, checking, or completing Handoff 2 idempotency records. A same-key retry therefore could not replay the exact authoritative reward/damage/Quest result. It also found that `getActionPool` used a privileged direct table update and raw `expires_at`, producing no transactional activity/outbox event and ignoring durable global pauses.

Migration `0006_harden_actions_runtime.sql` preserves the deployed reward/Quest/death effect pipeline behind hardened service-only wrappers. Submit, Accept and Reject validate fingerprints; scope records by actor, active run, command and key; lock the idempotency record; reject hash/run conflicts; persist the exact JSON result; and replay it unchanged. A different key against a terminal submission receives a stable terminal domain failure. Processing records are created and completed in the command transaction, so a rollback does not strand a newly claimed record.

Action validation time is derived as wall duration since `submitted_at` minus the overlap of durable `game_run_pauses`. Open pauses end at the database snapshot time, which freezes the countdown. `expires_at` remains a display/index projection, not authority. `expire_due_action_submissions` uses database time, a bounded deterministic candidate order, `FOR UPDATE SKIP LOCKED`, pending-state revalidation, and transactional activity/outbox writes. Accept, Reject and Expire lock the same submission row, so only one terminal transition wins and accepted effects remain unique.

The Action Pool now invokes the protected lazy expiration operation before a pure snapshot RPC. Its response includes `submissionId`, `status`, `submittedAt`, `remainingValidationSeconds`, `isExpired`, `serverNow`, and a pause-aware `expiresAt` projection. The browser animates from the server snapshot and refetches after commands, at zero, on focus and on reconnect.

Expected PostgreSQL failures are translated to safe application codes and HTTP statuses without returning SQLSTATEs, queries, table names, stack traces, or raw database messages. Unknown/temporary failures remain `INFRASTRUCTURE` errors.

### Guarded PostgreSQL runtime acceptance

The runtime harness never runs automatically, refuses production, creates uniquely named Owner/Validator A/Validator B fixtures, uses the deployed RPCs, and prints assertions without printing credentials. Local development:

```powershell
npm run actions:runtime-acceptance -- --acknowledge-development-run-mutation
```

Linked development additionally requires the temporary flag for that invocation only:

```powershell
$env:ALLOW_LINKED_ACTION_RUNTIME_TEST='true'
npm run actions:runtime-acceptance -- --acknowledge-development-run-mutation
Remove-Item Env:ALLOW_LINKED_ACTION_RUNTIME_TEST
```

The harness intentionally retains uniquely suffixed fixtures for auditable inspection because cross-table deletion is not safely atomic through the HTTP client. PostgreSQL acceptance must not be claimed until migration 0006 is human-applied and this command actually succeeds.

### Human validation sequence

```powershell
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

The dry run must list only migration 0006. After explicit human authorization only:

```powershell
npx supabase db push --linked
npx supabase migration list --linked
npx supabase db lint --linked --level error --fail-on error
$env:ALLOW_LINKED_ACTION_RUNTIME_TEST='true'
npm run actions:runtime-acceptance -- --acknowledge-development-run-mutation
Remove-Item Env:ALLOW_LINKED_ACTION_RUNTIME_TEST
```

### Runtime acceptance expansion and migration 0007

The expanded harness dispatches genuinely overlapping PostgreSQL requests for Accept/Accept, Accept/Reject, Accept/Expire and Reject/Expire. Against linked `kempape-dev`, all four races passed terminal-state, XP, coin, usage, cooldown, owner/validator Quest progress, activity and outbox cardinality assertions using the original zero-HP race fixture. Validator A was then correctly blocked from the owner's second Action and Validator B accepted it. The harness is now tightened to use a 6-HP Action and to assert the exact winning HP delta plus unique Quest reward source keys on the post-0007 rerun.

The final consecutive-validator step exposed a deployed outbox-version defect before the pause and domain-error matrices ran. A validator can make Quest progress without otherwise changing `player_run_states.state_version`. A later `daily_quest_progress_changed` event for that validator therefore attempted to reuse the same `(aggregate_type,aggregate_id,aggregate_version,event_type)` outbox key and failed with a unique violation. The affected acceptance transaction rolled back, so no partial Action effects committed.

Local-only migration `0007_fix_outbox_event_version_progression.sql` replaces `core_record_event` so each committed player event locks the player state, increments its authoritative `state_version`, and writes activity/outbox with that fresh version. Migrations 0001–0006 remain unchanged. Migration 0007 must be human-reviewed and applied before rerunning the complete harness; Codex did not push it.

The expanded command additionally requires acknowledgement of its two brief canonical pause/resume transitions:

```powershell
$env:ALLOW_LINKED_ACTION_RUNTIME_TEST='true'
npm run actions:runtime-acceptance -- --acknowledge-development-run-mutation --acknowledge-temporary-global-pause
Remove-Item Env:ALLOW_LINKED_ACTION_RUNTIME_TEST
```

Remaining limitations: pause, remaining consecutive-validator recovery, and the full runtime domain-error matrix await application of migration 0007. No scheduled expiration adapter or final realtime subscription is included; lazy catch-up is authoritative. Full Hospital equipment/Phoenix behavior remains in its planned handoff.
