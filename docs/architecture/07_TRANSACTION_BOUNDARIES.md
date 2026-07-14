# Transaction boundaries

Every command authenticates, authorizes, resolves and locks the active run, verifies the supplied run/version, claims `(actor,command,idempotency_key,request_hash)`, uses database time, locks rows in deterministic order, writes domain state plus activity/outbox, stores the result, then commits. Domain/precondition failure rolls back and returns a stable error. Duplicate keys with the same hash return the stored result; hash mismatch fails. Serialization/deadlock failures receive bounded retry; ordinary domain failures do not.

| Command | Preconditions; records read/locked | Ordered processing; records written | Events; failure/retry |
|---|---|---|---|
| `redeemInviteCode` | anonymous rate limit; lock active invite/player | verify hash/eligibility, update use, create hashed session | session changed; rollback; no unsafe retry, key replays |
| `submitAction` | active eligible owner; read definition; lock pending count/cooldown/usages | check caps, create pending with `expires_at=db_now+2h` | pool changed; conflict rolls back; replay existing |
| `acceptActionSubmission` | active eligible validator; lock submission, owner/validator, usage/HP/quest | require pending and before expiry; accepted; XP clamped then coins; usage/cooldown; HP; Phoenix/death/Hospital; quests | pool/player/quest/Hospital; full rollback; serialization retry |
| `rejectActionSubmission` | eligible non-owner validator; lock pending submission | require before expiry; set rejected/resolver/time; no reward/cost/usage/cooldown | pool/owner notification; rollback; replay terminal result |
| `expireActionSubmission` | DB time >= expiry; lock pending submission | set expired/resolved; no reward/cost/usage/cooldown | pool/owner notification; leased/lazy retry |
| `cancelActionSubmission` | admin or canonical state transition; lock pending row | set cancelled plus required reason (`hospital`,`admin`,`reset`,`festival_end`); no effects | pool/notification/audit; retry safe |
| `equipItem` | active/allowed status; lock item, slot, effects | settle due effects; validate cooldown; equip; start item cooldown | equipment/player; rollback; serialization retry |
| `unequipItem` | allowed status; lock equipped item/slot/effects | settle effects; require cooldown; clear slot; start cooldown | equipment/player; rollback/retry |
| `replaceEquippedItem` | lock old/new item and slot in ID order | settle effects; validate both; atomic swap; start both applicable cooldowns | equipment/player; rollback leaves old equipped |
| `useHealthPotion` | allowed status; lock stack/state/effects | calculate server heal, decrement once, cap HP | inventory/HP; rollback; replay |
| `useXpConsumable` | below L40; lock stack/state/reward grants | decrement; calculate/clamp XP; grant crossed levels ascending | inventory/XP; at cap reject without consumption; retry |
| `useFortuneTicket` | non-Hospital; lock stack/Wheel state | decrement and create one Fortune entitlement | inventory/Wheel; rollback/replay |
| `useGoldenHourglass` | allowed; lock stack and eligible Action cooldowns | decrement; reset only normal time cooldowns | inventory/actions; rollback/retry |
| `useChaosCard` | active attacker/target; lock players/card, unresolved attacks/lock, equipment | revalidate target and caps; consume; snapshot; create attack+lock; freeze personal timer anchors | Chaos/pool/target; stale target rolls back; retry |
| `resolveMirror` | lock attack, both states, snapshot, Phoenix/Hospital | apply stored target damage, then stored attacker damage or defer if hospitalized | HP/Chaos/Hospital; all-or-nothing/retry |
| `resolveThorns` | same ordered locks | apply stored target result then reflected attacker result/defer | HP/Chaos/Hospital; all-or-nothing/retry |
| `resolvePhoenix` | lethal source; lock player/equipped Phoenix/day activation | deterministic eligibility/roll recorded; consume daily success when triggered; otherwise continue death | HP/equipment; caller transaction owns retry |
| `processDeath` | HP lethal after Phoenix; lock state/XP/open submissions/stay | clamp HP, apply XP penalty and recalc level, cancel owned Actions, enter Hospital; committed outgoing Chaos remains | XP/Hospital/pool; caller rollback/retry |
| `enterHospital` | no active stay; lock state/stay uniqueness | create stay/until, set status, cancel pending Actions | Hospital/player/pool; unique conflict retry/refetch |
| `equipHospitalItem` | active stay; lock stay/item/application/slot | validate once/stay and slot exception; equip, apply exact reduction | Hospital/equipment; rollback/replay |
| `useDischargePill` | active stay, unused; lock stay/stack | decrement, mark used, reduce until respecting minimum | Hospital/inventory; rollback/replay |
| `exitHospital` | DB/effective time due; lock stay/state/deferred effects | close stay, active status, apply deferred effects canonical order, possibly new death/stay | Hospital/HP; leased/lazy retry |
| `purchaseAndOpenChest` | non-Hospital; lock balance, stacks, ordered supply rows | deduct price; secure slot rolls; bonus once; reserve; grant/overflow; save opening/rewards | Chest/coins/inventory; rollback all; replay immutable result |
| `openFreeChest` | non-Hospital; lock oldest eligible credit plus reward rows | consume credit then same opening pipeline | Chest/inventory; rollback/replay |
| `grantChestRewards` | internal to opening; locked supply/stacks | reserve before grant; enforce stack overflow and refund cap; write reward provenance | caller events; never separate commit/retry |
| `spinDailyWheel` | one daily entitlement; lock Wheel/player/reward targets | secure roll; consume daily key; apply result; save immutable spin | Wheel/affected state; rollback/replay |
| `spinWithFortuneCredit` | lock credit/Wheel/player | consume one credit; secure roll/apply/save | Wheel/state; rollback/replay |
| `applyWheelPunishment` | internal; lock affected players in ID order | revalidate eligible targets; apply canonical punishment/combat/death | HP/Hospital/Wheel; caller atomic |
| `processRegenerationInterval` | due equipped effects; lock item/state | derive effective elapsed excluding canonical pauses; grant whole intervals; advance cursor only to processed boundary | HP/player; leased/lazy retry |
| `processGoldInterval` | due effect; lock item/state/ledger | derive effective elapsed; append coin delta; advance cursor | coins/player; leased/lazy retry |
| `applyMidnightHeal` | approved boundary/day marker absent; lock eligible state/marker | heal active non-Hospital/non-Chaos; July 20 writes heal marker only | HP/day boundary; leased/lazy idempotent retry |
| `completeDailyQuest` | lock progress/reward grant/state | mark completed once; grant quests canonical order using updated level, clamp XP, grant coins/items | quest/XP/coins; rollback/retry |
| `grantLevelReward` | crossed unclaimed level; lock state/grant/supply | insert unique grant then reward engine; ascending level order | progression/inventory; duplicate returns grant |
| `reserveLimitedEquipment` | availability; lock supply by definition ID | conditional increment then create uniquely sourced inventory copy | inventory/supply; caller rollback; serialization retry |
| `resetAndStartFresh` | confirmed admin; lock active singleton/run | create/initialize new run, switch pointer, archive old, bump version, audit | game run changed; all-or-nothing/replay |
| `pauseRun` | admin/live/not paused; lock run/open interval | phase paused, open interval, bump version | run changed/audit; rollback/replay |
| `resumeRun` | admin/paused/open interval; lock both | close interval, restore live phase, bump version; timers later derive excluded duration | run changed/audit; rollback/replay |
| `endRun` | confirmed admin; lock run/unresolved records | enter approved resolution/end path, cancel/freeze as configured, audit | phase/ranking; rollback/replay |
| `closeChaosResolution` | at 03:15 or approved early boundary; lock unresolved attacks/locks/cards | cancel, return cards, unlock, freeze ranking, end run | Chaos/run/ranking; leased retry |

Action rejection and expiry are independent terminal outcomes. `cancelled` remains a dedicated terminal status because Hospital, admin repair, reset, and festival end are not validator rejection; `cancellation_reason` is mandatory whenever status is cancelled.
