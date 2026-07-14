# Kempape — Player Ranking System Handoff

## Purpose

This document defines the first version of the Kempape Player Ranking system.

The ranking should be simple, easy to scan, and focused on the information players need to understand their position during the festival.

The ranking is primarily based on player progression:

```text
Higher total XP = higher ranking position
```

The player’s displayed level is important, but total XP is the real sorting value.

This handoff defines:

* Ranking order.
* Tie handling.
* Player row layout.
* Avatar presentation.
* HP and Hospital display.
* Coin display.
* Current-player highlighting.
* Real-time update expectations.
* Suggested data shape.
* Server and UI rules.
* Acceptance tests.

---

# Core Ranking Rule

Players are ranked by:

```text
Current total XP, highest to lowest
```

Do not sort only by displayed level.

Two players can be on the same level while having different total XP.

Example:

| Player | Level | Total XP | Rank |
| ------ | ----: | -------: | ---: |
| Anna | 18 | 4,300 | 1 |
| Nil | 18 | 4,120 | 2 |
| Marc | 17 | 3,950 | 3 |

Even though Anna and Nil are both level 18, Anna ranks higher because she has more total XP.

---

# XP as the Ranking Source of Truth

The existing Level system already defines:

```text
Total XP -> determines Level
```

The ranking must therefore use the same `totalXp` value used by the Level system.

Whenever XP changes:

* The player’s level may change.
* Their ranking position may change.
* Their Max HP may change.
* Their row should update.

XP changes may come from:

* Accepted actions.
* Daily Quests.
* XP consumables.
* Death penalties.
* Other future XP sources.

A player can move down in the ranking after losing XP from death.

## Level 40 Ranking Behavior

Level 40 players continue earning total XP.

Therefore:

* Several Level 40 players do not automatically tie.
* Ranking continues to use uncapped `totalXp`.
* Displayed level remains 40.
* Max HP remains 295.
* Level rewards stop.
* Death penalties may reduce a Level 40 player below the Level 40 threshold.

Example:

| Player | Level | Total XP | Rank |
| ------ | ----: | -------: | ---: |
| Anna | 40 | 45,900 | 1 |
| Nil | 40 | 44,200 | 2 |
| Marc | 39 | 38,000 | 3 |

The Level 40 XP reward formula is defined in `xp-system.md`.

---

# Tie Handling

Two or more players may have exactly the same total XP.

Recommended visible ranking behavior:

```text
Same total XP = same displayed rank
```

Use standard competition ranking.

Example:

| Displayed rank | Player | Total XP |
| -------------: | ------ | -------: |
| 1 | Anna | 4,300 |
| 2 | Nil | 4,120 |
| 2 | Marc | 4,120 |
| 4 | Júlia | 4,000 |

The next position skips the number occupied by the tied players.

For stable internal ordering between tied players, use:

1. Total XP descending.
2. Player name ascending.
3. Player ID ascending as a final deterministic fallback.

The secondary order affects only row stability.

It does not change the displayed tied rank.

---

# Ranking Screen Layout

The Ranking screen displays one row per player.

Recommended row structure:

```text
[Rank] [Face] [Player information] [Coins]
```

Each row should include:

1. Ranking position.
2. Character face.
3. Player name.
4. Current level.
5. XP progress toward the next level.
6. Current HP and Max HP.
7. Small HP bar.
8. Current coin balance.
9. Hospital indicator when applicable.

---

# Recommended Row Example

```text
#2   [Face]   Nil
              Level 18
              XP 320 / 560
              HP 142 / 185
                               320 coins
```

The exact responsive layout may change depending on screen width.

The information hierarchy should remain:

```text
Rank and identity first
Progress and health second
Coins clearly visible
```

---

# Ranking Position

Every row must display the player’s current ranking position.

Examples:

```text
#1
#2
#3
#10
```

The first three positions may use special visual styling:

| Rank | Suggested treatment |
| ---: | ------------------- |
| 1 | Gold medal, crown, or gold border |
| 2 | Silver medal or silver border |
| 3 | Bronze medal or bronze border |

The styling must not reduce readability.

The numerical rank should still be visible.

---

# Character Face Rules

The ranking uses the player’s assigned character face.

Display:

* Character face.
* Hair.
* Facial features.
* Normal base character identity.

Do not display:

* Helmet.
* Armor.
* Legs equipment.
* Boots equipment.
* Equipment visual effects.
* Temporary damage or potion effects.

The face should remain recognizable regardless of the player’s active equipment.

Recommended asset:

```text
A cropped face or head portrait derived from the assigned character avatar.
```

This is not a live render of the currently equipped character.

---

# Player Name

Display the player’s chosen or assigned display name.

The name should be the main text element beside the face.

Long names should:

* Remain on one line when possible.
* Use truncation with an ellipsis when required.
* Not push essential information off-screen.

Example:

```text
Manel G...
```

The full name may appear when the row or profile is opened in a future version.

---

# Level Display

Display the player’s current level.

Example:

```text
Level 18
```

At maximum level:

```text
Level 40 — MAX
```

The displayed level is derived from total XP.

The Ranking screen must never show a stale level inconsistent with total XP.

---

# XP Progress Display

Show the player’s progress within the current level.

Recommended format:

```text
320 / 560 XP
```

This means:

```text
320 XP earned inside the current level
560 XP required to reach the next level
```

A small XP progress bar may also be displayed.

At Level 40:

```text
MAX LEVEL
```

Do not show XP needed for Level 41.

The XP progress display helps explain why one player of the same level is ranked above another.

---

# HP Display

Display:

```text
Current HP / Max HP
```

Example:

```text
142 / 185 HP
```

Also display a small HP bar.

The bar should use the same HP percentage as the main player UI:

```text
hpPercentage =
currentHp / maxHp
```

Current HP and Max HP must use whole numbers.

---

# Hospital Display

When a player is hospitalized:

* Display Current HP as 0.
* Show a Hospital icon or label.
* Show the remaining Hospital countdown when practical.

Example:

```text
0 / 185 HP
Hospital — 23:18
```

The Hospital state should be visually clear so players understand why the player has 0 HP and cannot currently interact.

Recommended display priority:

```text
Hospital status replaces the normal HP sublabel,
but the HP bar may remain empty.
```

A hospitalized player remains visible in the ranking.

Hospitalization does not remove or hide the player.

---

# Coin Display

Display the player’s current coin balance.

Example:

```text
320 coins
```

Use a coin icon where available.

Coin values are whole numbers.

Coins do not affect ranking order.

They are informational only.

---

# Current Player Highlight

The logged-in player’s row should be easy to find.

Recommended treatment:

* Subtle outline.
* Slightly different background.
* `YOU` label.
* Automatic scroll into view when opening the Ranking screen, when useful.

Example:

```text
#7 — YOU
```

Do not change the sorting order to place the current player at the top.

The current player remains in their real ranking position.

---

# Recommended Information Per Row

Final approved row content:

| Field | Required |
| ----- | -------- |
| Rank position | Yes |
| Character face | Yes |
| Player name | Yes |
| Current level | Yes |
| XP progress to next level | Yes |
| Current HP / Max HP | Yes |
| HP bar | Yes |
| Current coins | Yes |
| Hospital status | When applicable |
| Current-player highlight | For logged-in player |

---

# Information Not Shown

To keep the ranking simple, do not show:

* Equipped items.
* Current set.
* Actions completed.
* Actions validated.
* Damage dealt.
* Damage taken.
* Death count.
* Inventory size.
* Number of Chaos Cards.
* Online or offline status.
* Last active time.
* Daily Quest progress.

These values may be used in future player profiles or statistics screens.

They are out of scope for the MVP Ranking screen.

---

# Real-Time Update Requirement

The Ranking should use current game data.

For Kempape’s small player group, the ranking should update in near real time.

The row and position should refresh when any displayed or ranking-relevant value changes:

* Total XP.
* Level.
* Current HP.
* Max HP.
* Coins.
* Hospital status.
* Hospital countdown state.
* Player display name.
* Character assignment.

The most important real-time values are:

```text
Rank
Total XP
Level
HP
Coins
Hospital status
```

---

# Real-Time Behavior

Examples:

## XP Gain

```text
Player completes an accepted action.
XP increases.
Level may increase.
Ranking position updates.
```

## Death

```text
Player dies.
XP penalty is applied.
Level may decrease.
HP becomes 0.
Hospital status appears.
Ranking position may decrease.
```

## Coin Change

```text
Player opens a chest.
Coins decrease.
Ranking position does not change.
Coin value refreshes.
```

## Hospital Exit

```text
Hospital timer ends.
HP becomes 75% of current Max HP.
Hospital status disappears.
HP row refreshes.
```

---

# Update Strategy

The exact data-retrieval technology will be defined later.

The Ranking system should support one of these approaches:

* Real-time database subscription.
* WebSocket event stream.
* Server-sent events.
* Fast event-driven refresh.
* Short polling fallback.

The implementation must not rely only on a manual page refresh.

Recommended behavior:

```text
When relevant player data changes,
send an update event or refreshed ranking snapshot
to connected Ranking screens.
```

A full ranking snapshot is acceptable for the MVP because the player group is small.

---

# Consistency Rules

The Ranking should use one consistent server snapshot.

Avoid states such as:

```text
New XP with old Level
New Level with old Max HP
Hospital status with non-zero HP
```

Whenever related values change together, the Ranking update should include the complete updated row.

Recommended updated row payload:

```ts
type RankingPlayerRow = {
  playerId: string;

  displayRank: number;

  displayName: string;
  characterFaceKey: string;

  totalXp: number;
  currentLevel: number;

  xpIntoCurrentLevel: number;
  xpNeededForNextLevel?: number;

  currentHp: number;
  maxHp: number;

  coins: number;

  isHospitalized: boolean;
  hospitalUntil?: string;

  isCurrentPlayer: boolean;
};
```

---

# Sorting Logic

Recommended server sorting:

```ts
players.sort((a, b) => {
  if (b.totalXp !== a.totalXp) {
    return b.totalXp - a.totalXp;
  }

  const nameCompare =
    a.displayName.localeCompare(b.displayName);

  if (nameCompare !== 0) {
    return nameCompare;
  }

  return a.playerId.localeCompare(b.playerId);
});
```

Then calculate displayed competition ranks.

Example helper:

```ts
function assignCompetitionRanks(
  sortedPlayers: RankingPlayerRow[]
): RankingPlayerRow[] {
  let previousXp: number | undefined;
  let currentRank = 0;

  return sortedPlayers.map((player, index) => {
    if (
      previousXp === undefined
      || player.totalXp !== previousXp
    ) {
      currentRank = index + 1;
    }

    previousXp = player.totalXp;

    return {
      ...player,
      displayRank: currentRank,
    };
  });
}
```

---

# XP Progress Calculation

Recommended fields:

```ts
function getXpProgressForRanking(
  totalXp: number,
  currentLevel: number
): {
  xpIntoCurrentLevel: number;
  xpNeededForNextLevel?: number;
} {
  if (currentLevel >= 40) {
    return {
      xpIntoCurrentLevel: 0,
      xpNeededForNextLevel: undefined,
    };
  }

  const currentLevelThreshold =
    totalXpRequiredToReachLevel(currentLevel);

  const nextLevelRequirement =
    xpNeededForNextLevel(currentLevel);

  return {
    xpIntoCurrentLevel:
      totalXp - currentLevelThreshold,

    xpNeededForNextLevel:
      nextLevelRequirement,
  };
}
```

All values should be whole numbers.

---

# Hospital Countdown

The Ranking may display a live Hospital countdown.

The server provides:

```text
hospitalUntil
```

The client may display the remaining time using the server timestamp.

The server remains authoritative.

When the countdown reaches zero:

1. Request or receive the updated player state.
2. Remove Hospital status.
3. Display the restored HP value.

Do not assume Hospital exit only from client-side countdown completion.

---

# Responsive Layout

The Ranking is primarily designed for mobile.

Recommended compact mobile row:

```text
#1  [Face]  Player Name          320 coins
            Level 18
            XP progress
            HP bar 142 / 185
```

On narrower screens:

* Keep rank and face visible.
* Keep name and level visible.
* Allow coins to move below the name.
* Do not hide HP or Hospital status.
* Avoid horizontal scrolling.

The full player list should use vertical scrolling.

---

# Loading and Empty States

## Loading

Display:

```text
Loading ranking...
```

A skeleton row list may be used.

## Empty State

If no players exist:

```text
No players are available yet.
```

## Connection Issue

If live updates disconnect:

```text
Ranking connection interrupted.
Showing the latest available data.
```

Attempt reconnection automatically.

Do not clear the visible ranking unnecessarily.

---

# Optional Row Interaction

For the MVP, ranking rows do not need to be interactive.

Tapping a row may do nothing.

A future version may open a player profile showing:

* Statistics.
* Equipment.
* Activity.
* Achievements.

This is out of scope for the first Ranking system.

---

# Privacy and Visibility

The Ranking intentionally exposes to all participating players:

* Player name.
* Character face.
* Level.
* XP progress.
* HP.
* Hospital status.
* Coins.
* Rank position.

Do not expose:

* Private account details.
* Email address.
* Phone number.
* Login information.
* Inventory content.
* Intimate action details.
* Hidden moderation data.

---

# Suggested API Response

```ts
type RankingResponse = {
  generatedAt: string;
  players: RankingPlayerRow[];
};
```

Example:

```json
{
  "generatedAt": "2026-07-12T18:30:00+02:00",
  "players": [
    {
      "playerId": "player_anna",
      "displayRank": 1,
      "displayName": "Anna",
      "characterFaceKey": "character_anna_face",
      "totalXp": 4300,
      "currentLevel": 18,
      "xpIntoCurrentLevel": 180,
      "xpNeededForNextLevel": 560,
      "currentHp": 142,
      "maxHp": 185,
      "coins": 320,
      "isHospitalized": false,
      "isCurrentPlayer": false
    }
  ]
}
```

---

# Performance Notes

The expected festival group is small.

For the MVP:

* Load the complete ranking.
* Sort server-side.
* Send complete updated rows or a complete ranking snapshot.
* Avoid premature pagination complexity.

Pagination may be added only if the player group becomes much larger.

---

# Atomic Update Expectations

Ranking data should reflect completed game transactions.

Do not update ranking values from unconfirmed client actions.

Examples:

* XP updates after an action acceptance transaction commits.
* Coin updates after a chest-opening transaction commits.
* HP updates after damage processing commits.
* Hospital status updates after death processing commits.
* Level updates after XP recalculation commits.

This prevents temporary incorrect rankings.

---

# Acceptance Tests

## Higher XP Ranks First

```text
Given Player A has 4,300 total XP
and Player B has 4,120 total XP,
when the ranking is generated,
then Player A appears above Player B.
```

---

## Same Level, Different XP

```text
Given two players are Level 18
but one has more total XP,
then the player with more total XP ranks higher.
```

---

## Exact XP Tie

```text
Given two players have exactly 4,120 total XP,
then both display rank 2
and the next player displays rank 4.
```

---

## Stable Tie Order

```text
Given two players have equal total XP,
then their row order remains stable
using name and player ID as deterministic fallbacks.
```

---

## Death Ranking Update

```text
Given a player dies and loses XP,
when the death transaction commits,
then their XP, level, HP, Hospital status,
and ranking position update together.
```

---

## Coin Change

```text
Given a player spends coins on a chest,
when the chest transaction commits,
then their coin balance updates
without changing their rank.
```

---

## Hospital Display

```text
Given a player is hospitalized,
then their row shows 0 HP,
an empty HP bar,
and a Hospital indicator.
```

---

## Hospital Exit

```text
Given a player leaves the Hospital,
then the Hospital indicator disappears
and the restored HP is displayed.
```

---

## Avatar Without Equipment

```text
Given a player has a Helmet equipped,
then the Ranking still displays
their normal unequipped character face.
```

---

## Current Player Highlight

```text
Given the logged-in player appears at rank 7,
then their row remains at rank 7
and receives the current-player highlight.
```

---

## Level 40

```text
Given a player is Level 40,
then the row displays MAX LEVEL
and does not show XP required for Level 41.
```

---

## Live XP Update

```text
Given the Ranking screen is open,
when another player gains XP,
then the ranking updates without requiring
a manual full-page refresh.
```

---

## Consistent Snapshot

```text
When a player levels up,
then the Ranking never displays
the new Level with the previous Max HP.
```

---

# Design Decisions Summary

| Topic | Decision |
| ----- | -------- |
| Primary ranking value | Current total XP |
| Displayed level | Yes |
| Same-level ordering | Higher total XP first |
| Exact XP ties | Same displayed rank |
| Tie style | Competition ranking |
| Stable tie fallback | Name, then player ID |
| Rank number displayed | Yes |
| Character image | Face only |
| Helmet shown | No |
| Armor shown | No |
| Player name | Yes |
| XP progress | Yes |
| Current HP / Max HP | Yes |
| HP bar | Yes |
| Coins | Yes |
| Hospital status | Yes |
| Hospital countdown | Recommended |
| Current player highlight | Yes |
| Equipment details | No |
| Action statistics | No |
| Online status | No |
| Update behavior | Near real time |
| Manual refresh required | No |
| Ranking pagination | Not required for MVP |
| Server sorting | Required |
| Ranking data source | Committed game state |

---

# Current Status

This Player Ranking system is approved as the first version for Kempape.

The final ranking rule is:

```text
Sort all players by current total XP,
from highest to lowest.
```

Each row displays:

```text
Rank position
Character face without equipment
Player name
Current level
XP progress
Current HP / Max HP
HP bar
Current coins
Hospital status when applicable
```

The Ranking should update in near real time whenever relevant committed player data changes.

This handoff should be added to the Kempape documentation project as the source of truth for ranking order, ranking presentation, ties, displayed values, and update behavior.
