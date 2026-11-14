# Approved correction decisions — 2026-07-15

This record supersedes `DECISIONS-2026-07-14.md` and dedicated rule prose only for the topics below. All other July 14 decisions remain approved.

## Normal Actions

- Pending Actions expose `ACCEPT` and `REJECT` to eligible validators.
- Pending Actions expire two hours after server submission time.
- Terminal states are `accepted`, `rejected`, `expired`, and `cancelled`.
- `cancelled` is a dedicated status with a required reason such as Hospital, admin recovery, run reset, or festival end.
- Rejected, expired, and cancelled submissions grant no XP, coins or other rewards; apply no HP cost; start no cooldown; and consume no daily/festival use.
- Hospital entry cancels the owner's pending submissions.
- Chaos validation remains validation-only and has no normal Action timeout.

## Level 40 XP

- Maximum displayed level is 40.
- `total_xp` is clamped to the configured Level-40 threshold (currently 40,130).
- Positive XP mutations at the cap are no-ops. Coin and item rewards still grant normally.
- Death penalties may reduce XP below the threshold and cause level-down.
- Ranking sorts by capped total XP. Multiple capped players may tie; competition-ranking tie rules apply.

## Pause confirmation

Global admin pause remains approved because `rules/game-lifecycle-and-reset.md` explicitly defines it. Personal timers exclude the global paused duration. This decision does not add a new mechanic.

## Epic Gold equipment

- Gold equipment completes one generation interval every two effective hours, not every hour.
- Helmet and Boots grant 1 coin per completed interval; Legs grant 2; Armor grants 3.
- The four equipped pieces total 7 coins per interval and the full-set cursor grants 1 additional coin, for 8 coins every two effective hours.
- There is no daily cap. Offline and Hospital time count; global-pause and Chaos-lock time do not.
- Each equipped piece and the full-set bonus keep independent durable cursors. Completed intervals settle before unequip/replacement; incomplete progress is discarded when the applicable item or full set breaks.
- This section supersedes all older one-hour and `+3` full-set Gold prose in Equipment and Economy documents.
