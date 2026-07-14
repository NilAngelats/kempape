# Kempape — Festival Configuration

This file is authoritative for MVP timing, timezone, final-midnight behavior, and the festival-end Chaos resolution window.

## Fixed MVP Schedule

```ts
const FESTIVAL_CONFIG = {
  timeZone: "Europe/Berlin",

  scheduledStartsAt: "2026-07-16T11:30:00+02:00",
  normalGameplayEndsAt: "2026-07-20T03:00:00+02:00",
  chaosResolutionEndsAt: "2026-07-20T03:15:00+02:00",

  maximumUnresolvedOutgoingChaosAttacks: 2,
  maximumUnresolvedIncomingChaosAttacks: 1,
};
```

The MVP is one private festival game.

The admin may run test game runs before the scheduled live start and may perform an audited `Reset & Start Fresh` during the festival.

A reset starts a fresh game run at the reset timestamp but does not extend the fixed final end time.

## Game Phases

```ts
type GameRunPhase =
  | "setup"
  | "testing"
  | "live"
  | "paused"
  | "chaos_resolution"
  | "ended"
  | "archived";
```

### Live

Normal gameplay is available only during an active `live` run and before `normalGameplayEndsAt`.

### Chaos Resolution

At `normalGameplayEndsAt`:

* Stop all new normal gameplay mutations.
* Cancel remaining pending normal Actions.
* Allow only validation of already-pending Chaos attacks.
* Allow required Chaos combat, Phoenix, death, Hospital, and XP-penalty processing.
* Keep admin emergency operations available.

At `chaosResolutionEndsAt`:

* Cancel unresolved Chaos attacks.
* Return their consumed cards.
* Unlock targets.
* Apply no unresolved damage.
* Freeze final ranking.
* End the active run.

## July 20 Midnight Exception

At July 20 at `00:00`:

* Apply the normal midnight HP heal to active, non-hospitalized, non-Chaos-locked players.
* Do not heal hospitalized players.
* Do not heal Chaos-locked players.
* Do not create a fifth Daily Quest set.
* Do not grant another Daily Wheel spin.
* Do not reset Phoenix.
* Do not reset daily Action limits.
* Do not grant another Extreme Challenge use.

The fourth gameplay day continues until `03:00`.

## Server-Time Requirement

Use server time in `Europe/Berlin` for:

* Game phases.
* Daily keys.
* Midnight healing.
* Daily caps.
* Wheel availability.
* Quest assignment.
* Phoenix reset.
* Festival end.
* Chaos resolution end.

Never trust a phone's clock for gameplay decisions.
