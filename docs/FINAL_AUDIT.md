# Final pre-code audit result

## Status

The numerical and probability systems pass automated checks.

The documentation does **not** yet pass as a perfectly clean coding source because a few stale paragraphs remain. The starter isolates those issues in canonical code rather than copying contradictory prose.

## Blocking gameplay decision

### XP after Level 40

The ranking is sorted by total XP, but the XP document says XP is capped or ignored at Level 40.

If multiple players reach Level 40, a strict cap forces them all to tie permanently at 40,130 XP.

Starter default:

```text
continue_for_ranking
```

Under this rule:

* Level remains capped at 40.
* Max HP remains capped at 295.
* No more level rewards are granted.
* XP continues accumulating for ranking.
* XP Candy and Experience Potion remain unusable at Level 40.
* Actions and Daily Quests can still add ranking XP.
* Level 40 action/quest XP uses a virtual next-level basis of 4,110 XP,
  calculated from the same curve formula even though Level 41 does not exist.

Change `FESTIVAL_CONFIG.xpAfterMaxLevel` to `cap` only if permanent Level 40 ties are intended.

## Remaining documentation corrections

1. `Death & Hospital Rules.txt`
   * Remove the statement that every player leaves after exactly one hour.
   * Replace the old `hospitalUntil: death + 60` example with the dynamic timer.
   * Store one Hospital stay and one activation record per Hospital equipment instance.

2. `Inventory and Equipment Change System.txt`
   * Replace `Check the equipment file` with the actual Hospital exception.
   * Standard unequipping remains blocked, but replacing an eligible item with a Hospital Set item is allowed through the Hospital screen.

3. `HP and Recovery.txt`
   * Replace the remaining `all players are fully healed` line with `all non-hospitalized players`.
   * Use the Hospital-aware helper everywhere.
   * A Regeneration pause preserves unfinished progress and resumes after discharge.

4. `XP System.txt`
   * Remove the first generic Milestone Chest Rewards section.
   * Use `small`, `medium`, and `big` in the implementation map rather than `common`, `rare`, and `legendary`.

5. `Economy.txt`
   * Replace `Possible future Daily Wheel results` with `Daily Wheel results`.
   * Change the Very Active Daily Quests row from 180 to 200.
   * Remove sections that say finalized systems will be defined later.

6. `Actions.txt`
   * The Extreme Festival Challenge should start disabled.
   * The admin enables it and writes or announces the live challenge.

7. `Chaos cards.txt`
   * Remove wording that says a target cannot voluntarily stop.
   * Every physical prompt is voluntary and accepts a pre-agreed harmless substitute.

8. `Consumables.txt`
   * Explicitly state that the Golden Hourglass does not reset equipment cooldowns or Hospital locks.
   * Explicitly block Fortune Ticket use while hospitalized.

9. `Equipment.txt`
   * Remove `Gold generation should be reviewed later`.
   * Phoenix and daily effects use the four configured festival cycle keys, not raw calendar dates.

10. All daily systems
    * July 20 at 00:00 stays in cycle 4.
    * Only the non-Hospital midnight heal occurs.
    * No fifth quests, spin, Phoenix reset, action reset, or Extreme Challenge use is created.

## Edge-case rules selected in the starter

* Multiple quests completing together are rewarded in a fixed canonical order.
* Each reward uses the updated level after the previous reward.
* Regeneration pauses in Hospital and resumes unfinished progress after discharge.
* Gold continues in Hospital.
* Gold and Regeneration stop accruing at festival end.
* Gameplay commands are rejected at or after festival end.
* The final state is frozen at the event-end timestamp.
* The Extreme Challenge is disabled until an admin enables it.
* Social uniqueness is human-validator enforced, not automatically proven by the database.
* The unlimited `Find Someone You Know` action remains a playtest risk and must be monitored.
