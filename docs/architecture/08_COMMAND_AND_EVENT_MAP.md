# Command and event map

Inputs never include computed XP, HP, coins, damage, rewards, random values, completion times, or supply. Gameplay commands require `{gameRunId,idempotencyKey}`; outputs include authoritative result and `stateVersion`.

## Queries

Authenticated player queries: `getBootstrap`, `getPlayerState`, `getValidationPool(tab)`, `getInventory`, `getStore`, `getPendingReveal`, `getWheelState`, `getRanking`, `getActivity`, `getNotifications`. Admin-only: `getAdminSnapshot`, `getAuditEvents`. All authorize field visibility and resolve the active run; queries are not idempotency-recorded.

## Commands

| Command | Authentication / authorization | Input → output | Errors; idempotency; transaction; events |
|---|---|---|---|
| `redeemInviteCode` | anonymous, rate-limited | code → session/player bootstrap | invalid/revoked/rate-limited; required; redeem transaction; `session_changed` |
| `logout` | session owner | none → success | unauthenticated; optional; session revoke; `session_changed` |
| `submitAction` | active eligible player | action ID → pending submission/expiresAt | cap/cooldown/pending/status/phase; required; submit transaction; `validation_pool_changed` |
| `acceptActionSubmission` | eligible non-owner validator | submission ID → accepted result/player state | expired/terminal/ineligible/conflict; required; accept transaction; pool/player/quest/Hospital invalidations |
| `rejectActionSubmission` | eligible non-owner validator | submission ID → rejected result | expired/terminal/ineligible; required; reject transaction; pool/notification |
| `expireActionSubmission` | service worker/lazy server | submission ID/boundary key → expired result | not due/terminal; required; expiry transaction; pool/notification |
| `equipInventoryItem` | eligible owner | inventory item/slot → equipment state | status/cooldown/slot/not-owned; required; equip transaction; equipment/player |
| `unequipInventoryItem` | eligible owner | item ID → equipment state | status/cooldown/not-equipped; required; unequip transaction; equipment/player |
| `replaceEquippedItem` | eligible owner | slot/new item → equipment state | status/either cooldown/not-owned; required; replacement transaction; equipment/player |
| `useHealthPotion` | eligible owner | consumable ID → inventory/HP | empty/full/status; required; potion transaction; inventory/HP |
| `useXpConsumable` | eligible owner below cap | consumable ID → inventory/progression | empty/Level40/status; required; XP consumable transaction; inventory/XP/level |
| `useFortuneTicket` | eligible non-Hospital owner | item ID → Wheel entitlement | empty/status; required; ticket transaction; inventory/Wheel |
| `useGoldenHourglass` | eligible owner | item ID → reset cooldown projection | empty/no eligible cooldown/status; required; hourglass transaction; inventory/actions |
| `useChaosCard` | active attacker | card ID,target ID → snapshotted attack | stale/locked/Hospital/outgoing cap/empty; required; Chaos creation; lock/pool/inventory |
| `validateChaosAttack` | eligible validator, not target; attacker allowed | attack ID → combat result | terminal/ineligible/phase; required; Mirror/Thorns/Phoenix/death transaction; HP/Chaos/Hospital |
| `equipHospitalItem` | hospitalized owner | stay/item/slot → stay/equipment | no stay/already applied/cooldown; required; Hospital equip; Hospital/equipment |
| `useDischargePill` | hospitalized owner | stay/item → updated until | none/already used/empty; required; discharge transaction; Hospital/inventory |
| `openChest` | eligible non-Hospital owner | chest type → immutable opening/rewards | balance/type/status/supply; required; purchased/free-priority opening; Chest/coins/inventory |
| `completeChestReveal` | opening owner | opening ID → completion | not found/already complete safe; required; reveal flag transaction; Chest result |
| `spinWheel` | eligible owner | source (`daily` or Fortune credit) → immutable spin/result | unavailable/status/duplicate; required; matching spin transaction; Wheel/affected state |
| `completeWheelReveal` | spin owner | spin ID → completion | not found/already complete safe; required; reveal transaction; Wheel result |
| `markNotificationRead` | notification owner | notification ID → read time | not found/forbidden; optional key; notification transaction; notification changed |
| `createTestRun` | recently authenticated admin | confirmation/reason → run | forbidden/unsafe transition; required; run creation; run/audit |
| `resetAndStartFresh` | recent admin + confirmation | reason/code → new bootstrap | confirmation/stale/conflict; required; reset transaction; `game_run_changed`/audit |
| `pauseRun` | admin | run/reason → paused phase | wrong phase/stale; required; pause transaction; run/audit |
| `resumeRun` | admin | run/reason → live phase | wrong phase/stale; required; resume transaction; run/audit |
| `endRun` | recent admin + confirmation | reason/resolution choice → phase/result | unresolved KMP-009/confirmation; required; end transaction; run/ranking/audit |
| `cancelActionSubmission` | admin recovery only | submission/reason → cancelled | terminal/not found; required; cancellation transaction; pool/notification/audit |
| `cancelChaosAttack` | admin recovery | attack/reason → cancellation/card/lock result | terminal/orphan conflict; required; Chaos cancel; Chaos/lock/audit |
| `repairChaosLock` | admin recovery | attack/target/reason → repaired state | valid attack conflict/unsafe; required; lock repair; Chaos/audit |
| `correctPlayerState` | recent admin | target, field, new value, reason → before/after | unsupported/unsafe/stale; required; correction/compensating ledger transaction; player/audit |
| `managePlayer` | admin | player enable/role/character operation → player | live restriction/conflict; required; player admin transaction; player/audit |
| `revokeSessions` | admin | player/reason → count | not found; required; session revoke; session/audit |
| `issueInviteCode` | admin | player/reason → one-time code | active/conflict/rate; required; invite transaction; audit only |
| `configureExtremeChallenge` | admin within allowed phase | enabled/text/reason → definition projection | phase/unsafe text; required; definition override transaction; actions/audit |
| `applyMidnightHeal` | authenticated scheduler/worker lease | boundary key → counts | not due/already done; required boundary key; midnight transaction; HP |
| `processDueHospitalExits` | scheduler/worker lease | batch cursor → processed IDs | lease/conflict; per-entity keys; exit transactions; Hospital/HP |
| `processContinuousEffects` | scheduler/worker lease | batch cursor → processed IDs | lease/conflict; per-effect boundary keys; Gold/Regen transactions; player |
| `advanceGamePhase` | scheduler/worker lease | boundary key → phase | not due/already transitioned; required; phase transaction; run/pool/Chaos |
| `deliverOutbox` | service worker | batch cursor → publish count | lease/transport; event ID dedupe; mark-after-publish; realtime delivery |

## Realtime envelope

`{eventId,gameRunId,kind,entityId?,stateVersion,occurredAt}`. Kinds: `game_run_changed`, `validation_pool_changed`, `player_state_changed`, `inventory_changed`, `equipment_changed`, `hospital_changed`, `ranking_changed`, `activity_changed`, `notification_changed`, `chest_result_ready`, `wheel_result_ready`. These are invalidations only; clients refetch authoritative queries.
