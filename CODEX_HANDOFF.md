# Codex Handoff — Apply Approved Flow Decisions

Read in this order:

1. `AGENTS.md`
2. `docs/INDEX.md`
3. `docs/DECISIONS-2026-07-14.md`
4. Every file under `docs/rules/`
5. `docs/ASSETS.md`
6. Existing source code, migrations, seed data, and tests

Do not code immediately.

First create:

```text
docs/audits/FLOW_AND_SCHEMA_AUDIT.md
```

The audit must identify every code, schema, seed, or test change required for:

* `game_run_id` scoping.
* Test and live game runs.
* Remote atomic Reset & Start Fresh.
* Admin roles and audited controls.
* Actions with no Reject and no automatic expiration.
* The two-tab Validation Pool.
* Chaos combat snapshots.
* One unresolved incoming Chaos attack per target.
* Two unresolved outgoing Chaos attacks per attacker.
* Frozen-target untargetability.
* Attacker death not cancelling outgoing attacks.
* Deferred Mirror/Thorns attacker damage.
* The 03:00–03:15 Chaos resolution phase.
* Level 40 uncapped ranking XP.
* Realtime reconnect recovery.
* Asset manifest integration.

The audit must list contradictions in existing code or migrations and must not silently choose a different rule.

After the audit, produce:

```text
docs/plans/FLOW_IMPLEMENTATION_PLAN.md
```

Use this implementation priority:

1. Active game-run model and run-scoped schema.
2. Admin role, test run, reset, pause, and end controls.
3. Authoritative player status and state-version/reconnect foundation.
4. Normal Actions and the ACTIONS validation tab.
5. Chaos attack creation, lock, snapshot, and CHAOS CARDS tab.
6. Chaos resolution, deferred attacker damage, Hospital, and festival-end handling.
7. Level 40 XP and ranking.
8. Asset manifest validation.
9. Persistent notifications.
10. Animations and visual polish.

Do not apply remote Supabase migrations until the audit and implementation plan are reviewed.

For every implemented phase:

* Add database constraints.
* Add transaction/idempotency tests.
* Add reconnect and stale-run tests.
* Run type checks.
* Run unit and integration tests.
* Run the production build.
* Summarize changed files and remaining blockers.
