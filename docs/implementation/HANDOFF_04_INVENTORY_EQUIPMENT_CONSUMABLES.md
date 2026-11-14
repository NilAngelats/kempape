# Handoff 04 — Inventory, Equipment, Consumables and Passive Effects

## Repository audit

- Starting commit: `84cbe66` (`Merge pull request #3 ... handoff-3-runtime-hardening`).
- Branch: `feat/handoff-4-inventory-equipment-consumables`, created from local `main` matching cached `origin/main`.
- Baseline: clean worktree; `npm run check` passed with 89 tests; linked migrations 0001–0007 match and linked lint is clean. Remote fetch was unavailable because the local SSH key was rejected.
- Existing UI: Inventory and Hospital were honest placeholders; Home linked to Inventory but displayed no equipped slots.
- Existing definitions: generated 64-ID Equipment skeleton, seven Consumables and seven Chaos Card display definitions existed without ownership/schema/commands or full effect metadata.
- Assets: all 64 Equipment, seven Consumable and seven Chaos Card PNG files exist under `public/assets`; the manifest did not yet register those categories. No approved on-character overlay/layer mapping exists, so Handoff 4 shows standalone equipped-slot art and does not fake compositing.
- Reused primitives: active-run and lifecycle guards, player states, capped XP, HP/coin ledgers, idempotency records, activity events, outbox invalidations, durable global pauses and migration 0007 state-version progression.
- Applied history: migrations 0001–0007 are immutable. Handoff 4 database work is forward-only migration 0008.

## Source-of-truth resolutions

The checked-in Equipment/Economy prose described 10 Gold coins per hour with a +3 full-set bonus. The approved July 15 correction now owns this topic: a two-hour interval, piece payouts 1/1/2/3, +1 full-set bonus and 8 total, with no daily cap. The dated decision supersedes older contradictory prose.

Phoenix is projection-only in Handoff 4: piece chances 10/10/25/50 percent, +5 percent full-set bonus, maximum 100 percent, and one successful save per canonical festival day. Combat consumption remains Handoff 5.

## Deferred integrations

Chaos Card targeting/combat, Phoenix/Thorns/Dodge/Protection resolution and full Hospital Equipment belong to Handoff 5. Chest purchasing, rolling, reward selection and Chest Set consumption belong to Handoff 6. Wheel spinning and Fortune-entitlement consumption belong to Handoff 7. Handoff 4 provides stacks, projections, supply reservation and durable Fortune entitlements only.

## Implementation contract

Inventory is active-run scoped, service-role commanded and browser-denied with forced RLS. Equipment copies are independent instances with provenance and per-instance 15-minute cooldowns. A unique equipped-slot boundary prevents two equipped items in one slot. Stack rows are per run/player/category/definition and database-constrained to 0–10. Epic supply is four per definition/run and Legendary supply is one; reservation and ownership commit together.

Effect projections use integer basis points for percentages. Regeneration uses independent one-hour item cursors and a separate full-set cursor. Gold uses independent two-hour cursors and a separate full-set cursor. Each cursor stores its last wall-clock observation plus an effective-seconds remainder. On processing, clipped exclusions are unioned with `range_agg`; `remainder + max(0, wall elapsed - excluded union)` is divided into complete intervals and a new remainder. This prevents overlap double-subtraction and prevents excluded wall time from being counted again. Regeneration includes Hospital in the exclusion union; Gold does not. Durable Chaos-lock intervals remain a Handoff 5 input. Due cursors are indexed and selected by `(run, player, next_check_at, id)` with bounded `FOR UPDATE SKIP LOCKED` processing.

Further schema, command, UI, tooling, validation and human-runbook details are maintained below as implementation lands.

## Migration 0008 and commands

Migration `0008_inventory_equipment_consumables.sql` adds the 64-row Equipment catalog, 14 stackable definitions, independent Equipment instances, per-run finite supply, one equipped item per slot, stack quantities, provenance, passive cursors, Fortune entitlements and one-pill-per-stay records. All new tables force RLS and deny browser roles. Protected functions use fixed `public,pg_temp` search paths and service-role-only execution.

Grant commands reserve Epic/Legendary supply and create ownership atomically. Common/Rare grants share the same provenance/idempotency contract without finite counters. Stack grants enforce 0–10 inside the transaction. Equipment mutation locks instance UUIDs in order, locks the slot uniqueness boundary and applies a 15-minute cooldown only after a successful state change. Replacement changes old/new items in one transaction.

`use_inventory_consumable` implements Potion Set-adjusted 25/60 HP healing, 5/30 percent next-level XP grants through the core XP processor, durable Fortune entitlements and Golden Hourglass reset of only enabled, explicitly resettable, currently active Action cooldowns. Discharge Pill is rejected from normal Inventory. The protected `use_discharge_pill` command locks an active stay and pill stack, enforces one use per stay with a composite stay/run/player foreign key, subtracts exactly 20 minutes, and immediately releases at 75% Max HP when due.

`process_passive_effects` is bounded, uses row locking and durable per-item/full-set cursors, excludes global pauses, excludes Hospital overlap for Regeneration, includes Hospital for Gold, advances full-HP Regeneration cursors and writes Gold through the coin ledger. Chaos-lock exclusion cannot be runtime-consumed until Handoff 5 introduces durable lock intervals; the projection/cursor contract is ready for that integration.

## UI and assets

Inventory replaces its placeholder with Equipment, Consumables and Chaos Cards tabs, empty states, quantities, filters, inspection modals, cooldown-disabled controls and atomic equip/unequip/replacement/use commands. One idempotency key is retained across a failed request retry. Home and Inventory perform bounded passive catch-up before authoritative reads. The typed manifest maps all 64 Equipment, seven Consumables and seven Chaos Cards to verified existing files, and standalone artwork is rendered without inventing on-character compositing.

## Development grant tooling

```powershell
npm run inventory:grant-dev -- --player-id=<uuid> --category=equipment --item-id=epic_gold_helmet --quantity=1 --source-id=<stable-id> --acknowledge-development-run-mutation
```

Linked development additionally requires temporary `ALLOW_LINKED_INVENTORY_DEV_GRANT=true`. The tool refuses production, requires explicit IDs/source provenance and never prints credentials. It was not executed.

## Validation and human application

Corrective-pass local validation passed: `npm run check` (100 tests plus production build), `git diff --check`, grant/runtime script syntax, and catalog/asset/migration invariant tests. Linked migration history showed 0001–0007 applied and the dry run showed only migration 0008:

```powershell
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

After explicit human authorization only:

```powershell
npx supabase db push --linked
npx supabase migration list --linked
npx supabase db lint --linked --level error --fail-on error
```

## Known limitations before acceptance

- Migration 0008 has not been applied or PostgreSQL-runtime tested.
- The guarded Inventory runtime script now creates isolated development fixtures and exercises browser/service privileges, concurrent stack caps, finite supply races, Equipment replacement/idempotency, concurrent passive processing, and committed Consumable state. The local Docker/Supabase stack was unavailable during the merge-gate pass, so the matrix remains unexecuted and no PostgreSQL runtime acceptance is claimed.
- Durable Chaos-lock pause overlap cannot be consumed until Handoff 5 supplies the canonical interval source.
- Full Hospital Equipment, combat/death integration, deferred damage and the complete Hospital lifecycle remain Handoff 5. Handoff 4 now provides the minimum authoritative Hospital countdown, pill quantity/used state and idempotent Discharge Pill control.

## Final merge-gate corrections

- Replacement settles completed item/full-set intervals and then deletes both the stopped item cursor and the old passive set cursor before the new slot state is installed. This resets partial full-set progress even for Gold-to-Gold or Regeneration-to-Regeneration same-set replacement; the refresh helper creates any newly complete set cursor from the replacement timestamp.
- `getCurrentAppState` centralizes lifecycle/bootstrap loading, bounded passive catch-up and authoritative bootstrap reload. React request caching lets the persistent App shell and child pages share the post-processing HP/coin state.
- Inventory snapshots include authoritative HP, Max HP, level, status and eligible Hourglass cooldown count. The UI explains advisory disabled states while SQL revalidates every command.
- Equipment effects and full-set bonuses share one basis-point/time-unit formatter. Cooldowns derive from database `serverNow` plus monotonic client elapsed time and update every second.
- Inventory and Hospital requests retain their idempotency key after uncertain network/JSON outcomes, always release the pending state, and clear the key after success or explicit conflict.
- Home renders typed-registry standalone Equipment art and explicit empty slots. No on-character compositing is attempted.
- Final realtime subscriptions and on-character Equipment layers remain deferred as planned.
