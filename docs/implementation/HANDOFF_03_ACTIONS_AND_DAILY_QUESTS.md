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
