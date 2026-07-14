# Domain data model

Global identity/definition rows survive resets. Every row marked **run** has non-null `game_run_id`; archived runs and append-only history are retained, never cascade-deleted by normal gameplay.

| Entity / owner | Purpose and important fields | PK / FKs / uniqueness / indexes | Scope, mutation, retention |
|---|---|---|---|
| `Player` / Players | account, display name, role, enabled, character | PK `id`; FK character; unique normalized name; role/status index | global; mutable/audited; retain |
| `Character` / Players | stable character/face keys | PK text `id`; unique image keys | global definition; immutable; retain |
| `InviteCode` / Auth | code hash, last four, active/revoked/use times | PK UUID; FK player; unique hash and one active/player; active index | global; mutable; retain audit metadata |
| `Session` / Auth | token hash, version, expiry/revocation | PK UUID; FK player; unique hash; player/expiry index | global; mutable/revocable; purge expired per policy |
| `GameRun` / Lifecycle | mode, phase, start/end, reset source, state version | PK UUID; FK creator/prior run; phase index | run identity; mutable state machine; retain/archive |
| `ActiveGameRun` / Lifecycle | singleton pointer and global version | singleton PK; FK run; unique active run | global mutable singleton; audited |
| `PauseInterval` / Lifecycle | pause/resume instants and actor/reason | PK UUID; FK run/admin; one open interval/run; time index | run; append-only except close; retain |
| `PlayerRunState` / Players | XP, level, HP, coins projection, deaths, status/version | PK `(run,player)`; FKs run/player; status/ranking indexes | **run**; mutable projection; retain |
| `XPEvent` / Progression | delta, before/after, source | PK UUID; FKs run/player; unique `(run,source_type,source_id)`; player/time index | **run** append-only; retain |
| `LevelRewardGrant` / Progression | one reward per reached level | PK UUID; FKs run/player; unique `(run,player,level)` | **run** append-only; retain |
| `CoinLedger` / Economy | signed delta, balance after, source | PK UUID; FKs run/player; unique source; player/time index | **run** append-only; retain |
| `EquipmentDefinition` / Equipment | rarity, slot, set, effects, limit, image key | PK text; unique image key; rarity/set index | global definition; version rather than delete |
| `EquipmentInventoryItem` / Inventory | owned physical copy, acquisition, cooldown/effect cursors | PK UUID; FKs run/player/definition/grant; player/slot index; unique limited grant | **run** mutable; retain |
| `EquippedSlot` / Equipment | equipped item for slot | PK `(run,player,slot)`; FK inventory item; unique equipped item | **run** mutable; retain history via events |
| `ConsumableQuantity` / Inventory | stack count | PK `(run,player,definition)`; count 0..10 | **run** mutable; retain |
| `ChaosCardQuantity` / Inventory | stack count | PK `(run,player,definition)`; count 0..10 | **run** mutable; retain |
| `EquipmentGlobalSupply` / Reward | claimed count/limit | PK `(run,definition)`; check count<=limit | **run** mutable under row lock; retain |
| `ActionDefinition` / Actions | reward/cost/caps/cooldown/image/enabled | PK text; enabled/tier indexes | global definition; version rather than delete |
| `ActionSubmission` / Actions | owner/action, `pending|accepted|rejected|expired|cancelled`, submitted/expires/resolved, validator, cancellation reason | PK UUID; FKs run/action/owner/resolver; unique submit idempotency and partial unique pending owner/action; `(run,status,expires_at)` index | **run** state machine; retain. `cancelled` is dedicated; reason enum records Hospital/admin/reset/festival |
| `ActionUsage` / Actions | accepted usage and day key | PK UUID; FKs run/player/action/submission; unique submission; player/action/day index | **run** append-only; retain |
| `ActionCooldown` / Actions | eligible cooldown end and adjustment/version | PK `(run,player,action)`; FK accepted submission; due index | **run** mutable/derived; retain |
| `DailyQuestProgress` / Quests | assigned set, counters, completion | PK `(run,player,day)`; FKs run/player; day index | **run** mutable; retain |
| `QuestRewardGrant` / Quests | exact once completion reward | PK UUID; FK progress/quest; unique `(run,player,day,quest)` | **run** append-only; retain |
| `ChaosAttack` / Combat | attacker/target/card, immutable stat/equipment/damage snapshot, status/times | PK UUID; FKs run/players/card; partial unique unresolved target; attacker/status index supports max two transaction check | **run** state machine; retain |
| `ChaosLock` / Combat | target lock and timer-freeze anchor | PK UUID; FK attack/target; unique active attack and target; active index | **run** close-only; retain |
| `DeferredCombatDamage` / Combat | attacker-side Mirror/Thorns effect awaiting release | PK UUID; FKs run/attack/player; unique `(attack,type,player)`; due index | **run** append-only plus applied time; retain |
| `PhoenixActivation` / Combat | attempt/result/day/item/source | PK UUID; FKs run/player/item/source; unique source and daily success constraint | **run** append-only; retain |
| `HospitalStay` / Hospital | death, until, release, XP loss | PK UUID; FKs run/player/death source; one active/player/run; due index | **run** state machine; retain |
| `HospitalEquipmentApplication` / Hospital | one item reduction per stay | PK `(stay,item)`; FKs stay/inventory item; activated time | **run** append-only; retain |
| `ChestOpening` / Chests | payment, price, secure roll facts, result/reveal | PK UUID; FKs run/player; unique command key; pending-reveal index | **run** immutable except reveal time; retain |
| `ChestReward` / Chests | ordered slot/result/overflow/grant | PK `(opening,slot)`; FK grant/item; unique slot | **run** append-only; retain |
| `FreeChestCredit` / Chests | entitlement source/type/consumption | PK UUID; FKs run/player/opening; unique grant source; unused index | **run** append-only consumption; retain |
| `WheelState` / Wheel | derived/current entitlement projection | PK `(run,player)`; FKs run/player | **run** mutable cache; reconstructable |
| `WheelSpin` / Wheel | source/day/result/reveal | PK UUID; FKs run/player; unique command key and one daily `(run,player,day)`; reveal index | **run** immutable except reveal; retain |
| `ActivityEvent` / Activity | public-safe event payload | PK UUID; FKs run/player; `(run,created_at)` index; dedupe key | **run** append-only; retain |
| `Notification` / Notifications | persistent private message/read time | PK UUID; FKs run/player/source event; player/unread index | **run** append-only except read; retain/policy purge |
| `IdempotencyRecord` / Platform | actor/command/key/request hash/result/status | PK `(actor,command,key)`; FK run when gameplay; expiry index | run/global as command requires; immutable result; retain through retry horizon |
| `AdminAuditEvent` / Admin | command, reason, target, before/after/request ID | PK UUID; FKs admin/run/target; run/time and actor/time indexes | append-only; never gameplay-delete |
| `OutboxEvent` / Platform | event ID, aggregate/version, safe payload, publish time | PK UUID; FK run; unique aggregate/version; unpublished index | append-only; prune only after retention |
| `RankingSnapshot` / Ranking | frozen ordered entries/tie rank at end | PK `(run,player)`; FK run/player; unique display order | **run** append-only after freeze; retain |

`total_xp` is clamped to `MAX_LEVEL_THRESHOLD` (40,130 in current configuration). XP grants at cap write no positive XP event; coins/items still grant. Death loss can reduce XP below the threshold and level is recalculated. Ranking uses capped total XP and competition ties.
