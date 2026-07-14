# Kempape — Daily Quests System Handoff

## Purpose

This document defines the first version of the Kempape Daily Quests system.

Daily Quests should:

* Encourage players to complete actions throughout the day.
* Give players a reason to regularly validate other players' actions.
* Reward variety instead of repeating only the easiest or safest action.
* Support the four-day level progression and coin economy.
* Remain simple to understand and implement for the MVP.

Daily Quest progress is based only on successfully accepted actions.

Rejected, expired, duplicated, cancelled, or failed submissions never count.

---

# Daily Quest Structure

Each player receives six Daily Quests every festival day:

| Difficulty | Number of quests |
| ---------- | ---------------: |
| Easy       |                3 |
| Medium     |                2 |
| Hard       |                1 |
| **Total**  |            **6** |

All six quests are active simultaneously from the beginning of the festival day.

The player does not need to select, activate, or accept a quest before making progress.

---

# Daily Quest List

## Easy Quest 1 — Getting Started

| Rule | Value |
| ---- | ----: |
| Requirement | Complete 5 accepted actions |
| XP reward | 80% of next-level XP |
| Coin reward | 15 coins |

Short description:

```text
Complete 5 accepted actions today.
```

Progress example:

```text
3 / 5 accepted actions
```

---

## Easy Quest 2 — Helping Hand

| Rule | Value |
| ---- | ----: |
| Requirement | Successfully validate 10 actions from other players |
| XP reward | 80% of next-level XP |
| Coin reward | 15 coins |

Short description:

```text
Successfully validate 10 actions from other players today.
```

Only successful Accept validations count.

Rejecting an action does not count.

A validation also does not count if the server rejects the operation because the submission expired, was already processed, or the validator was not eligible.

Progress example:

```text
7 / 10 successful validations
```

---

## Easy Quest 3 — Mix It Up

| Rule | Value |
| ---- | ----: |
| Requirement | Complete 5 different action types |
| XP reward | 80% of next-level XP |
| Coin reward | 15 coins |

Short description:

```text
Complete 5 different action types today.
```

Different action types are determined using the action's unique `actionId`.

Repeating the same action multiple times increases the player's accepted-action total, but it counts only once toward action variety.

Example:

```text
Accepted actions:
- Smoke a Cigarette
- Drink a Beer
- Drink a Beer
- Take a Shot
- 20 Push-ups
- Find Someone You Know

Accepted-action progress = 6
Different-action progress = 5
```

Progress example:

```text
4 / 5 different action types
```

---

## Medium Quest 1 — Festival Regular

| Rule | Value |
| ---- | ----: |
| Requirement | Complete 10 accepted actions |
| XP reward | 140% of next-level XP |
| Coin reward | 30 coins |

Short description:

```text
Complete 10 accepted actions today.
```

Progress example:

```text
8 / 10 accepted actions
```

---

## Medium Quest 2 — Community Support

| Rule | Value |
| ---- | ----: |
| Requirement | Successfully validate 15 actions from other players |
| XP reward | 140% of next-level XP |
| Coin reward | 30 coins |

Short description:

```text
Successfully validate 15 actions from other players today.
```

Progress example:

```text
12 / 15 successful validations
```

---

## Hard Quest — Daily Mastery

Daily Mastery combines personal activity, support for other players, and action variety.

All three requirements must be completed during the same festival day.

| Requirement | Target |
| ----------- | -----: |
| Accepted actions completed | 15 |
| Other players' actions successfully validated | 20 |
| Different action types completed | 7 |

| Reward | Value |
| ------ | ----: |
| XP reward | 230% of next-level XP |
| Coin reward | 95 coins |

Short description:

```text
Complete 15 accepted actions, successfully validate 20 actions from other players, and complete 7 different action types today.
```

UI progress example:

```text
Accepted actions:       13 / 15
Successful validations: 18 / 20
Different action types:  6 / 7
```

The quest is completed only when all three values reach their targets.

---

# Cumulative Progress Rules

The Easy, Medium, and Hard quests share the same daily progress counters.

Progress is not restarted after completing a lower-difficulty quest.

Example:

```text
At 5 accepted actions:
Complete Getting Started.

At 10 accepted actions:
Complete Festival Regular.

At 15 accepted actions:
Complete the accepted-action requirement for Daily Mastery.
```

The same successful validations count toward:

* Helping Hand.
* Community Support.
* Daily Mastery.

The same unique action types count toward:

* Mix It Up.
* Daily Mastery.

This creates the intended progression:

```text
Accepted actions:
5 -> 10 -> 15

Successful validations:
10 -> 15 -> 20

Different action types:
5 -> 7
```

Completing Daily Mastery will normally mean that the player has also completed all five lower-difficulty quests.

Daily Mastery acts as a final daily completion bonus.

---

# What Counts as an Accepted Action

An action counts toward Daily Quests only after another eligible player successfully accepts it and the server completes the acceptance transaction.

The action owner receives:

```text
+1 accepted action
```

The action's unique ID is added to the owner's daily variety set:

```text
dailyDistinctActionIds.add(actionId)
```

An accepted action counts even if its HP cost kills the player afterward.

The action and Daily Quest rewards are processed before the action's self-damage and possible death penalty, matching the Actions system.

An action does not count when it is:

* Pending.
* Rejected.
* Expired.
* Cancelled because the owner entered the Hospital.
* Invalidated by the server.
* Processed more than once.
* Submitted but not yet accepted.

---

# What Counts as a Successful Validation

A successful validation occurs when an eligible player accepts another player's pending action and the server successfully processes that action.

The validator receives:

```text
+1 successful validation
```

The validator does not receive a direct XP or coin reward for the individual validation.

The reward comes from completing the related Daily Quests.

The following do not count:

* Pressing Reject.
* Attempting to accept an expired submission.
* Attempting to accept an already processed submission.
* Attempting to validate while hospitalized.
* Attempting to validate the player's own action.
* A validation rejected by any server-side eligibility rule.
* A duplicate request caused by refreshing or pressing Accept more than once.

All normal Action Pool validation restrictions remain active, including the rule preventing the same validator from validating two consecutive accepted actions from the same player.

---

# Different Action Type Rules

Different action types are counted using unique action definitions, not action tiers or broad categories.

Use:

```text
actionId
```

Do not use:

```text
tier
category
submissionId
```

Examples:

```text
Smoke a Cigarette and Drink a Beer
= 2 different action types

Drink a Beer completed four times
= 1 different action type

20 Push-ups and 40 Squats
= 2 different action types
```

Only accepted actions add an `actionId` to the player's daily variety set.

Rejected, expired, or pending actions do not add variety progress.

---

# Daily Reset

Daily Quest progress resets every day at:

```text
00:00 in the configured festival timezone
```

Do not use each player's device timezone.

Use one server-side festival timezone for every player.

Recommended configuration:

```ts
const FESTIVAL_TIME_ZONE = "CONFIGURED_EVENT_TIME_ZONE";
```

At midnight:

* Accepted-action Daily Quest progress returns to 0.
* Successful-validation Daily Quest progress returns to 0.
* The daily set of different `actionId` values becomes empty.
* All six quests become incomplete for the new day.
* Unfinished quest progress is lost.
* Completed quest rewards already earned are kept.
* Previous days' records may remain stored for history and statistics.

Daily Quest progress does not carry over into the next festival day.

---

## Midnight Boundary Rule

Use the time when the action is successfully accepted:

```text
acceptedAt
```

Do not use:

```text
submittedAt
```

Example:

```text
Action submitted at 23:50.
Action accepted at 00:05.

The action and validation count toward the new festival day.
```

This rule keeps the action owner and validator on the same Daily Quest day.

---

## Recommended Reset Implementation

The safest implementation is to store progress using a festival-day key instead of editing every player's counters with one large midnight job.

Example:

```ts
festivalDayKey = getFestivalDayKey(currentTime, FESTIVAL_TIME_ZONE);
```

Player progress should be loaded or created using:

```text
playerId + festivalDayKey
```

When the date changes at midnight, the game automatically reads a new empty progress record.

This avoids problems when:

* A player is offline at midnight.
* The server restarts near midnight.
* A scheduled reset job fails.
* Players use devices with different local timezones.

A scheduled midnight process may still be used for notifications or UI refreshes, but the date-keyed record must remain the source of truth.

---

# Daily Quest Rewards

## XP Rewards

Daily Quest XP is percentage-based.

| Difficulty | Base XP progress |
| ---------- | ---------------: |
| Easy       | 80% of the XP needed for the next level |
| Medium     | 140% of the XP needed for the next level |
| Hard       | 230% of the XP needed for the next level |

Apply the existing level-band multiplier:

```text
xpReward = ceil(
  xpNeededForNextLevel(currentLevel)
  x questXpPercentage
  x levelBandMultiplier(currentLevel)
)
```

Level-band multipliers:

| Level range | Multiplier |
| ----------- | ---------: |
| 1-10        | x1.00 |
| 11-20       | x0.80 |
| 21-30       | x0.65 |
| 31-40       | x0.50 |

All final XP rewards must be whole numbers.

Use:

```ts
Math.ceil(value)
```

The player's current level at the exact moment the quest is completed should be used for the reward calculation.

At level 40:

* The quest may still be completed.
* The coin reward is still granted.
* Additional XP is capped or ignored according to the Level system.

---

## Coin Rewards

| Difficulty | Number | Coins each | Daily maximum |
| ---------- | -----: | ---------: | ------------: |
| Easy       | 3 | 15 | 45 |
| Medium     | 2 | 30 | 60 |
| Hard       | 1 | 95 | 95 |
| **Total**  | **6** | - | **200** |

Maximum Daily Quest coins:

```text
200 coins per festival day
```

Across a four-day festival, a player who completes every Daily Quest can receive:

```text
800 Daily Quest coins
```

All coin rewards are whole numbers.

---

# Reward Granting Behavior

Recommended MVP behavior:

```text
Quest rewards are granted automatically when the requirement is completed.
```

No Claim button is required.

When a quest changes from incomplete to complete:

1. Confirm the quest has not already been completed for that festival day.
2. Calculate the XP reward using the player's current level.
3. Grant XP.
4. Recalculate the player's level.
5. Apply normal level-up HP and first-time level reward rules.
6. Grant the quest's coin reward.
7. Mark the quest as completed for that festival day.
8. Add the completion to activity history.
9. Notify the player in the UI.

The completion check and reward grant must be atomic.

A quest must never grant its reward more than once during the same festival day.

---

# Processing Order During Action Acceptance

When one player accepts another player's action, use one atomic server transaction.

Recommended order:

1. Revalidate the pending action submission.
2. Confirm the owner and validator are eligible.
3. Mark the submission as accepted.
4. Grant the action XP and coins to the action owner.
5. Record the action usage and start its cooldown.
6. Add `+1` to the owner's daily accepted-action counter.
7. Add the accepted `actionId` to the owner's daily distinct-action set.
8. Add `+1` to the validator's daily successful-validation counter.
9. Evaluate and grant newly completed Daily Quests for the owner.
10. Evaluate and grant newly completed Daily Quests for the validator.
11. Apply the action's fixed HP cost to the owner, if applicable.
12. Resolve Phoenix, death, XP loss, and Hospital rules if needed.
13. Add final events to activity history.
14. Notify both players.

This means an action that completes a Daily Quest still grants that quest reward even when the action's HP cost kills the owner afterward.

Any XP death penalty is calculated after the action and quest rewards have been granted.

---

# Hospital Rules

Hospitalized players cannot:

* Submit actions.
* Validate actions.
* Make new Daily Quest progress through activity.
* Complete a pending action after entering the Hospital.

When a player enters the Hospital, their pending action submissions are cancelled according to the Actions system.

Daily Quest progress already earned earlier that day is not removed.

Daily Quest progress still resets normally at midnight, even when the player is hospitalized.

---

# UI Requirements

The Daily Quests screen should display all six quests grouped by difficulty.

Each quest should show:

* Quest name.
* Short description.
* Difficulty.
* XP reward.
* Coin reward.
* Current progress.
* Target progress.
* Completed state.
* Time remaining until the midnight reset.

Single-requirement quests should use one progress value.

Example:

```text
Festival Regular
8 / 10 accepted actions
```

Daily Mastery should display three separate progress values.

Example:

```text
Daily Mastery

Accepted actions:       13 / 15
Successful validations: 18 / 20
Different action types:  6 / 7
```

After completion:

* Mark the quest as completed.
* Keep it visible until midnight.
* Show that its rewards were granted.
* Do not allow it to be completed again that day.

For display purposes, quest progress may be capped at the target:

```text
15 / 15
```

The underlying daily activity counters may continue increasing for statistics.

---

# Suggested Data Shape

```ts
type DailyQuestId =
  | "easy_accepted_5"
  | "easy_validations_10"
  | "easy_variety_5"
  | "medium_accepted_10"
  | "medium_validations_15"
  | "hard_daily_mastery";

type DailyQuestProgress = {
  playerId: string;
  festivalDayKey: string;

  acceptedActions: number;
  successfulValidations: number;
  distinctActionIds: string[];

  completedQuestIds: DailyQuestId[];

  createdAt: string;
  updatedAt: string;
};
```

A database-native set or a separate relation may be used instead of a string array for `distinctActionIds`.

The database should enforce one progress record per player and festival day:

```text
UNIQUE(playerId, festivalDayKey)
```

---

# Suggested Quest Configuration

```ts
const DAILY_QUESTS = {
  easyAcceptedActions: {
    id: "easy_accepted_5",
    difficulty: "easy",
    acceptedActionsRequired: 5,
    xpPercentage: 0.80,
    coinReward: 15,
  },

  easyValidations: {
    id: "easy_validations_10",
    difficulty: "easy",
    successfulValidationsRequired: 10,
    xpPercentage: 0.80,
    coinReward: 15,
  },

  easyVariety: {
    id: "easy_variety_5",
    difficulty: "easy",
    distinctActionTypesRequired: 5,
    xpPercentage: 0.80,
    coinReward: 15,
  },

  mediumAcceptedActions: {
    id: "medium_accepted_10",
    difficulty: "medium",
    acceptedActionsRequired: 10,
    xpPercentage: 1.40,
    coinReward: 30,
  },

  mediumValidations: {
    id: "medium_validations_15",
    difficulty: "medium",
    successfulValidationsRequired: 15,
    xpPercentage: 1.40,
    coinReward: 30,
  },

  hardDailyMastery: {
    id: "hard_daily_mastery",
    difficulty: "hard",
    acceptedActionsRequired: 15,
    successfulValidationsRequired: 20,
    distinctActionTypesRequired: 7,
    xpPercentage: 2.30,
    coinReward: 95,
  },
} as const;
```

Economy configuration:

```ts
const DAILY_QUEST_ECONOMY = {
  questCounts: {
    easy: 3,
    medium: 2,
    hard: 1,
  },

  coinRewards: {
    easy: 15,
    medium: 30,
    hard: 95,
  },

  maximumDailyCoins: 200,
};
```

This configuration replaces any older Daily Quest count or reward placeholders found elsewhere in the project.

---

# Quest Evaluation Logic

Suggested helper:

```ts
function evaluateDailyQuests(
  player: Player,
  progress: DailyQuestProgress
): DailyQuestId[] {
  const completed = new Set(progress.completedQuestIds);
  const newlyCompleted: DailyQuestId[] = [];

  function completeIfEligible(
    questId: DailyQuestId,
    isEligible: boolean
  ): void {
    if (isEligible && !completed.has(questId)) {
      completed.add(questId);
      newlyCompleted.push(questId);
    }
  }

  completeIfEligible(
    "easy_accepted_5",
    progress.acceptedActions >= 5
  );

  completeIfEligible(
    "easy_validations_10",
    progress.successfulValidations >= 10
  );

  completeIfEligible(
    "easy_variety_5",
    progress.distinctActionIds.length >= 5
  );

  completeIfEligible(
    "medium_accepted_10",
    progress.acceptedActions >= 10
  );

  completeIfEligible(
    "medium_validations_15",
    progress.successfulValidations >= 15
  );

  completeIfEligible(
    "hard_daily_mastery",
    progress.acceptedActions >= 15
      && progress.successfulValidations >= 20
      && progress.distinctActionIds.length >= 7
  );

  return newlyCompleted;
}
```

Each newly completed quest should then be rewarded once in the same database transaction.

---

# Idempotency and Anti-Exploit Rules

| Rule | Purpose |
| ---- | ------- |
| Only accepted actions count | Prevent reward progress from unverified claims |
| Only successful Accept validations count | Prevent rejection farming |
| Unique `actionId` values determine variety | Prevent repeated-action variety farming |
| One reward per quest per festival day | Prevent duplicate rewards |
| Atomic action and quest processing | Prevent partial or repeated grants |
| Server-side festival timezone | Prevent device-time manipulation |
| Use `acceptedAt` for day attribution | Keep owner and validator progress synchronized |
| Database uniqueness on player/day records | Prevent duplicate daily states |
| Existing validation eligibility rules remain active | Prevent collusion and invalid validations |
| Pending actions do not carry quest credit | Require successful completion |
| No quest activation required | Prevent lost progress and UI confusion |

The API must be idempotent.

If the same action-acceptance request is received more than once, the submission and Daily Quest progress must be processed only once.

---

# Acceptance Tests

## Accepted-Action Progress

```text
Given a player has 4 accepted actions today,
when another action is successfully accepted,
then Getting Started becomes complete,
the player receives its XP and 15 coins,
and the accepted-action counter becomes 5.
```

## Medium Cumulative Progress

```text
Given a player has already completed Getting Started,
when their accepted-action counter reaches 10,
then Festival Regular becomes complete,
without resetting or subtracting the first 5 actions.
```

## Variety Progress

```text
Given a player completes the same action 5 times,
then acceptedActions increases by 5,
but distinctActionIds increases by only 1.
```

## Easy Variety Completion

```text
Given a player has completed 4 different accepted action types,
when a fifth unique action type is accepted,
then Mix It Up becomes complete.
```

## Hard Completion

```text
Given a player has:
- 15 accepted actions,
- 20 successful validations,
- 6 different accepted action types,

when a seventh unique action type is accepted,
then Daily Mastery becomes complete.
```

## Rejection Does Not Count

```text
When a player rejects another player's submission,
then successfulValidations does not increase.
```

## Midnight Attribution

```text
Given an action is submitted at 23:50,
when it is accepted at 00:05,
then the action owner's progress and the validator's progress
both count toward the new festival day.
```

## Duplicate Request

```text
Given an action has already been accepted,
when the same Accept request is sent again,
then no counters or rewards change.
```

## Level 40

```text
Given a level 40 player completes a Daily Quest,
then the coin reward is granted,
the quest is marked complete,
and additional XP is capped or ignored.
```

## Lethal Action

```text
Given an accepted HP-cost action completes a Daily Quest
and then reduces the owner to 0 HP,
then the action and quest rewards are granted first,
and death processing occurs afterward.
```

# Current Status

This Daily Quests system is approved as the first version for Kempape.

The final variety requirements are:

```text
Easy Mix It Up:
5 different accepted action types

Hard Daily Mastery:
7 different accepted action types
```

This handoff is the source of truth for Daily Quest requirements, rewards, reset behavior, counting rules, and implementation logic.
