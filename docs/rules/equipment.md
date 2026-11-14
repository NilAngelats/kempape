# Kempape — Equipment System Handoff

## Purpose

This document defines the first version of the Kempape equipment system.

Equipment should be simple, fun, and easy to balance. Players can equip 4 item slots:

| Slot   |
| ------ |
| Helmet |
| Armor  |
| Legs   |
| Boots  |

Each item belongs to:

| Category | Options                                    |
| -------- | ------------------------------------------ |
| Rarity   | Common, Rare, Epic, Legendary              |
| Set line | Regeneration, Damage, Special A, Special B |
| Slot     | Helmet, Armor, Legs, Boots                 |

There are 4 set lines per rarity and 4 item slots per set.

```text id="snxbmg"
4 rarities × 4 set lines × 4 slots = 64 equipment item types
```

---

## General Equipment Rules

A player can equip only one item per slot.

| Slot   | Power weight |
| ------ | ------------ |
| Helmet | Low          |
| Boots  | Low          |
| Legs   | Medium       |
| Armor  | High         |

Armor should usually give the strongest bonus. Legs should be medium. Helmet and boots should be smaller.

Partial sets give partial bonuses.

Full sets give an additional full set bonus.

A full set means the player has all 4 pieces of the same set equipped:

```text id="zv8f6c"
Helmet + Armor + Legs + Boots from the same set
```

---

## Item Copy Rules

| Rarity    | Copies per specific item |
| --------- | -----------------------: |
| Common    |                 Infinite |
| Rare      |                 Infinite |
| Epic      |                 4 copies |
| Legendary |                   1 copy |

Examples:

```text id="5h5kfw"
Common Regeneration Armor can appear unlimited times.
Rare Damage Boots can appear unlimited times.
Epic Chest Set Helmet can appear only 4 times during the festival.
Legendary Phoenix Armor can appear only once during the festival.
```

Once an Epic or Legendary item is obtained, it is removed from the available reward pool according to its copy limit.

Legendary items are unique festival items.

---

## Rounding Rule

All final values must be whole numbers.

Use:

```ts id="pihx5e"
Math.ceil(value)
```

No final stat should display decimals.

---

# Set Line 1 — Regeneration Set

## Effect

Regeneration items heal the player every hour.

This healing cannot exceed Max HP.

```text id="8s7mol"
currentHp = min(currentHp + regenerationAmount, maxHp)
```

Regeneration only works while the item is equipped.

## Regeneration Values

| Rarity    |  Helmet |   Boots |    Legs |   Armor | Piece total | Full set bonus | Full set total |
| --------- | ------: | ------: | ------: | ------: | ----------: | -------------: | -------------: |
| Common    | +1 HP/h | +1 HP/h | +1 HP/h | +2 HP/h |     +5 HP/h |        +1 HP/h |        +6 HP/h |
| Rare      | +1 HP/h | +1 HP/h | +2 HP/h | +3 HP/h |     +7 HP/h |        +2 HP/h |        +9 HP/h |
| Epic      | +2 HP/h | +2 HP/h | +3 HP/h | +4 HP/h |    +11 HP/h |        +3 HP/h |       +14 HP/h |
| Legendary | +3 HP/h | +3 HP/h | +4 HP/h | +6 HP/h |    +16 HP/h |        +4 HP/h |       +20 HP/h |

---

# Set Line 2 — Damage Set

## Effect

Damage items increase outgoing damage.

This applies to player damage from Chaos Cards unless a specific action/card says otherwise.

Damage bonus is applied after level damage scaling.

```text id="ras102"
finalDamage = ceil(levelScaledDamage × (1 + equipmentDamageBonus))
```

## Damage Values

| Rarity    | Helmet | Boots | Legs | Armor | Piece total | Full set bonus | Full set total |
| --------- | -----: | ----: | ---: | ----: | ----------: | -------------: | -------------: |
| Common    |    +1% |   +1% |  +1% |   +2% |         +5% |            +0% |            +5% |
| Rare      |    +1% |   +1% |  +2% |   +3% |         +7% |            +3% |           +10% |
| Epic      |    +2% |   +2% |  +3% |   +5% |        +12% |            +3% |           +15% |
| Legendary |    +3% |   +3% |  +5% |   +8% |        +19% |            +6% |           +25% |

Example:

```text id="tbk1d6"
Level-scaled damage = 40
Player has full Rare Damage Set = +10%

Final damage = ceil(40 × 1.10)
Final damage = 44
```

---

# Set Line 3 — Special Set A

Special Set A gives each rarity its own identity.

| Rarity    | Set name       | Effect                                                        |
| --------- | -------------- | ------------------------------------------------------------- |
| Common    | Dodge Set      | Chance to ignore incoming player damage                       |
| Rare      | Protection Set | Reduces incoming player damage                                |
| Epic      | Gold Set       | Generates coins every two effective hours                     |
| Legendary | Thorns Set     | Reflects part of incoming damage and reduces that same amount |

---

## Common Special A — Dodge Set

Dodge gives a chance to completely avoid incoming player damage.

Dodge should only apply to damage from other players.

It should not apply to self-cost actions.

| Piece          | Dodge chance |
| -------------- | -----------: |
| Helmet         |          +1% |
| Boots          |          +1% |
| Legs           |          +2% |
| Armor          |          +3% |
| Piece total    |          +7% |
| Full set bonus |          +3% |
| Full set total |         +10% |

If dodge succeeds:

```text id="mpmzvq"
incomingDamage = 0
```

---

## Rare Special A — Protection Set

Protection reduces incoming player damage.

| Piece          | Damage reduction |
| -------------- | ---------------: |
| Helmet         |              -2% |
| Boots          |              -2% |
| Legs           |              -4% |
| Armor          |              -6% |
| Piece total    |             -14% |
| Full set bonus |              -6% |
| Full set total |             -20% |

Example:

```text id="yxrzdq"
Incoming damage = 50
Full Protection Set = 20% reduction

Final damage = ceil(50 × 0.80)
Final damage = 40
```

---

## Epic Special A — Gold Set

Gold Set generates coins every completed two-hour effective interval.

This only works while equipped.

| Piece          | Coins per two-hour interval |
| -------------- | --------------------------: |
| Helmet         |                           +1 |
| Boots          |                           +1 |
| Legs           |                           +2 |
| Armor          |                           +3 |
| Piece total    |                           +7 |
| Full set bonus |                           +1 |
| Full set total |                           +8 |

There is no daily generation cap. Offline and Hospital time count; global-pause and Chaos-lock time do not.

---

## Legendary Special A — Thorns Set

Thorns reflects part of incoming player damage back to the attacker.

The same amount is also reduced from the defender’s incoming damage.

| Piece          | Reflect / reduction |
| -------------- | ------------------: |
| Helmet         |                  2% |
| Boots          |                  2% |
| Legs           |                  4% |
| Armor          |                  6% |
| Piece total    |                 14% |
| Full set bonus |                 +6% |
| Full set total |                 20% |

Example:

```text id="xqhlr7"
Incoming damage = 50
Full Thorns Set = 20%

Reflected damage = ceil(50 × 0.20) = 10
Defender receives = 50 - 10 = 40
Attacker receives = 10
```

Thorns should only trigger from damage caused by other players.

---

# Set Line 4 — Special Set B

Special Set B adds extra utility effects.

| Rarity    | Set name     | Effect                              |
| --------- | ------------ | ----------------------------------- |
| Common    | Potion Set   | Potions heal more                   |
| Rare      | Hospital Set | Reduces hospital time               |
| Epic      | Chest Set    | Chance to gain 1 extra chest reward |
| Legendary | Phoenix Set  | Chance to survive lethal damage     |

---

## Common Special B — Potion Set

Potion Set increases healing received from HP potions.

It does not affect:

* Passive regeneration.
* Midnight full heal.
* Level-up healing.
* Hospital exit healing.

| Piece          | Potion healing bonus |
| -------------- | -------------------: |
| Helmet         |                  +1% |
| Boots          |                  +1% |
| Legs           |                  +3% |
| Armor          |                  +5% |
| Piece total    |                 +10% |
| Full set bonus |                  +5% |
| Full set total |                 +15% |

Example:

```text id="gd6xlb"
Potion heals 50 HP.
Full Potion Set = +15%

Final healing = ceil(50 × 1.15)
Final healing = 58 HP
```

Healing still cannot exceed Max HP.

---

## Rare Special B — Hospital Set

Hospital Set reduces the time a player spends in the Festival Hospital.
Equipment already worn when the player dies

Hospital pieces already equipped at the moment of death should activate automatically.

Example:

Player dies while wearing:
Hospital Helmet
Hospital Boots

Initial Hospital time: 60 minutes
Helmet reduction: -4
Boots reduction: -4

Starting remaining time: 52 minutes

Those pieces are immediately locked until discharge.

The player may then equip missing Hospital pieces from the Hospital screen.

This preserves both approaches:

Players who planned ahead receive the benefit immediately.
Players who own the pieces but were wearing another set can decide to change while hospitalized.

Existing equipment cooldowns

The normal 15-minute item cooldown should still matter.

A player cannot use death to bypass a locked equipment choice.

Example:

12:00 — Player equips Gold Armor.
Gold Armor is locked until 12:15.

12:05 — Player dies.
Player tries to replace it with Hospital Armor.

Result:
The replacement is unavailable until 12:15.

After 12:15, they may equip the Hospital Armor and apply its reduction.

When Hospital equipment is successfully equipped:

The replaced item starts its normal unequip cooldown.
The Hospital item starts its normal 15-minute cooldown.
The Hospital item also becomes locked until discharge.

Its effective lock ends at the later of:

Normal equipment cooldown
or
Hospital discharge

This maintains the strategic commitment established by the Inventory system, where each item has its own independent 15-minute cooldown.


Base hospital duration:

```text id="g4f9ei"
60 minutes
```

| Piece          | Hospital time reduction |
| -------------- | ----------------------: |
| Helmet         |                  -4 min |
| Boots          |                  -4 min |
| Legs           |                  -8 min |
| Armor          |                 -12 min |
| Piece total    |                 -28 min |
| Full set bonus |                  -2 min |
| Full set total |                 -30 min |

Full set result:

```text id="a2p9kb"
60 min - 30 min = 30 min hospital time
```

Minimum hospital time from this set:

```text id="pdbqfw"
30 minutes
```

---

## Epic Special B — Chest Set

Chest Set gives a chance to receive 1 extra reward when opening a chest.

| Piece          | Extra reward chance |
| -------------- | ------------------: |
| Helmet         |                 +2% |
| Boots          |                 +2% |
| Legs           |                 +6% |
| Armor          |                +10% |
| Piece total    |                +20% |
| Full set bonus |                 +5% |
| Full set total |                +25% |

Trigger rule:

```text id="21sq9a"
When opening a chest, roll the extra reward chance.
If successful, add +1 extra reward to that chest opening.
```

The extra reward pool should be defined in the chest system.

---

## Legendary Special B — Phoenix Set

Phoenix Set gives the player a chance to survive lethal damage.

Lethal damage means:

```text id="y7jlk1"
incoming damage would reduce currentHp to 0 or below
```

If Phoenix succeeds:

```text id="nrr6d0"
Player survives with 1 HP.
Player does not enter Hospital.
Player does not lose XP from death.
Phoenix is consumed for that day.
```

If Phoenix fails:

```text id="vly3um"
Player dies normally.
Phoenix is not consumed.
The player can try to trigger Phoenix again later.
```

| Piece          | Survival chance |
| -------------- | --------------: |
| Helmet         |            +10% |
| Boots          |            +10% |
| Legs           |            +25% |
| Armor          |            +50% |
| Piece total    |            +95% |
| Full set bonus |             +5% |
| Full set total |            100% |

Daily limit:

```text id="t3e8pq"
Phoenix can successfully save the player once per day.
```

Reset time:

```text id="ucvm3d"
00:00 daily reset
```

After Phoenix successfully triggers, the survival chance becomes 0% until the next daily reset.

---

## Combat Resolution Order

Recommended order when damage is dealt:

1. Calculate base damage.
2. Apply attacker level damage scaling.
3. Apply attacker Damage Set bonus.
4. Check defender Dodge.
5. Apply defender Protection if dodge failed.
6. Apply defender Thorns if applicable.
7. Apply final damage to defender HP.
8. If defender HP reaches 0 or below, check Phoenix.
9. If Phoenix fails or is unavailable, trigger death and hospital rules.

---

## MVP Rules

Do not add item merging in the MVP.

Do not add XP bonus equipment in the MVP.

Equipment should affect:

* HP regeneration.
* Outgoing damage.
* Dodging.
* Damage reduction.
* Coin generation.
* Potion healing.
* Hospital time.
* Chest rewards.
* Phoenix survival.

Equipment should not create extra permanent Max HP unless a future set explicitly defines it.
