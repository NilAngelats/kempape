# Time, scheduling, and realtime architecture

`FestivalClock` reads PostgreSQL `clock_timestamp()` and the fixed Europe/Berlin configuration. Instants are `timestamptz`; festival calendar boundaries use the IANA zone. Phone time and countdown completion never authorize a mutation.

Global pause is canonical: `rules/game-lifecycle-and-reset.md` lines 313–332 says the admin may pause and personal timers do not advance; `admin-and-game-control.md`, `economy.md`, and `realtime-and-notifications.md` reinforce it. Persist pause intervals and derive effective elapsed time. This is distinct from target-specific Chaos/Hospital pauses.

| Timed behavior | Stored timestamp / day key | Lazy catch-up | Scheduled / leased worker | Client countdown |
|---|---|---|---|---|
| Festival start/03:00/03:15 | configured boundaries | every query/command derives phase | small scheduled `advanceGamePhase` with DB lease | display only |
| Two-hour Action expiry | `submitted_at`,`expires_at` | pool/query/accept first expires due row | batched expiry worker with `SKIP LOCKED` lease | display only |
| Action cooldown | `cooldown_ends_at` adjusted by canonical pause durations | eligibility query/command | no required eager job | display only |
| Equipment cooldown | per-item end/remaining basis | inventory/equip commands | no required job | display only |
| Hospital stay | `hospital_until` plus applicable pause rules | bootstrap/any player command exits if due | due-stay leased batch | display only |
| Chaos lock timers | lock start/end and frozen anchors | resolution/cancellation computes shift | 03:15 cleanup worker | display only |
| Gold interval | item cursor + effective elapsed | bootstrap/coin/equipment interactions | periodic leased batch for freshness | optional next tick |
| Regeneration interval | item cursor + effective elapsed | bootstrap/HP/equipment interactions | periodic leased batch for freshness | optional next tick |
| Daily Quest assignment/progress | unique approved festival-day key | lookup/create on bootstrap/action | no global reset job required | day boundary display |
| Daily Wheel | unique `(run,player,day)` spin | lookup on Wheel/bootstrap | no reset rewrite | availability display |
| Phoenix daily availability | activation keyed by approved day | combat lookup | no reset rewrite | status display |
| Daily Action caps/Extreme | usage keyed by approved day | submission/accept lookup | no reset rewrite | status display |
| Midnight heal | boundary marker timestamp/day | first post-boundary interaction catches up | leased boundary processor for prompt UI | never applies heal |
| July 20 00:00 | cycle-4 heal marker only | catch-up heal | same boundary worker | display only |
| Chest/Wheel reveal | immutable result + reveal completion | bootstrap fetches unfinished result | none | animation only |
| Session expiry | `expires_at` | every authenticated request | optional cleanup | login display only |

The smallest viable worker is a protected Next.js scheduled endpoint calling a PostgreSQL function that obtains a database advisory/row lease and processes bounded batches. No separate queue service is required for the expected player count. Durable truth remains timestamps, unique boundary keys, and transactional results; late/missed schedules are repaired lazily.

At 03:00, commands derive `chaos_resolution`, reject normal mutations, expire/cancel remaining Actions according to the approved terminal rule, and allow only existing Chaos validation/admin recovery. At 03:15, unresolved Chaos is cancelled, cards returned, locks released, ranking frozen, and the run ended.

Supabase Realtime publishes only safe committed invalidations. The minimal implementation can insert a small outbox row in each gameplay transaction and have the same protected worker publish/retry it; alternatively, direct Postgres Changes subscriptions may be used where payload privacy and transaction visibility are sufficient. Do not add Kafka or a general queue.

Clients subscribe to active-run and private-player topics, discard another run or older version, debounce refetches, and refetch bootstrap/pool/state on load, focus, reconnect, route entry, subscription recovery, and ambiguous command timeout. A 15–30 second short-poll fallback is sufficient. Server results remain authoritative when countdowns reach zero.
