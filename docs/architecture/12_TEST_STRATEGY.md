# Testing strategy

Keep Vitest for TypeScript, add isolated local PostgreSQL/Supabase integration tests and Playwright mobile E2E. Use server-clock seams only; never authorize with client time.

- Unit: XP thresholds and 40,130 clamp/no-op rewards/ties; rounding; Max HP/death level-down; damage ordering; weighted rolls/overflow; Berlin cycle/DST; Action expiry; pause/Hospital/Chaos effective time.
- Integration: invite, Action accept/reject/expire/cancel effects, quest ordering, equipment/consumables, combat/Phoenix/Hospital, Chest/Wheel, supply, reset/stale run, reveal recovery.
- Concurrency: accept versus reject versus expiry; two validators; final limited copy; duplicate open/spin/use/reward; lethal damage; reset racing commands.
- E2E: invite, Action Accept/Reject, automatic expiry recovery, quest, Chest, equipment, Chaos/death/Hospital, Wheel, capped-XP ranking tie, offline reconnect.
- Boundaries: festival start, Berlin midnights, July 20, 03:00/03:15, two-hour expiry, stays/intervals across pause/restart/end.
- Security: auth/role/RLS/CSRF/rate limits, stale target, idempotency hash mismatch, redaction, post-end read-only.

CI: migration/schema test, `npm run typecheck`, `npm test`, E2E, `npm run build`. Every mechanic requires happy, failure, duplicate, applicable concurrency, stale-run and time-boundary coverage.
