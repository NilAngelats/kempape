# Kempape — Asset Locations and Naming

## Runtime Asset Location

All images displayed directly by the Next.js application are stored under:

```text
public/assets/
```

Recommended categories:

```text
public/assets/actions/
public/assets/chaos-cards/
public/assets/consumables/
public/assets/equipment/
public/assets/characters/
public/assets/faces/
public/assets/chests/
public/assets/ui/
```

Files under `public/assets` are referenced without the `public` prefix.

Example:

```text
public/assets/consumables/small_health_potion.png
```

Application path:

```text
/assets/consumables/small_health_potion.png
```

---

# Canonical Filename Rule

Asset filenames match canonical game IDs.

Use:

* Lowercase letters.
* Underscores instead of spaces.
* No accents.
* No apostrophes.
* No special characters.

Examples:

```text
Small Health Potion -> small_health_potion.png
Golden Hourglass -> golden_hourglass.png
Jägermeister Shot -> jagermeister_shot.png
20 Push-ups -> push_ups_20.png
```

The display name may contain spaces and accents.

The canonical ID and `imageKey` do not.

---

# Equipment Naming

Equipment filenames follow:

```text
rarity_set_slot.png
```

Examples:

```text
common_regeneration_helmet.png
rare_hospital_armor.png
epic_gold_legs.png
legendary_phoenix_boots.png
```

A flat `equipment` folder is preferred for MVP.

---

# Manifest

The canonical asset mapping is stored in:

```text
public/assets/manifest.json
```

Example:

```json
{
  "consumables": {
    "small_health_potion": {
      "displayName": "Small Health Potion",
      "path": "/assets/consumables/small_health_potion.png"
    }
  },
  "chaosCards": {
    "shot": {
      "displayName": "Shot",
      "path": "/assets/chaos-cards/shot.png"
    }
  },
  "actions": {
    "drink_beer": {
      "displayName": "Drink a Beer",
      "path": "/assets/actions/drink_beer.png"
    }
  },
  "equipment": {
    "epic_gold_armor": {
      "displayName": "Epic Gold Armor",
      "path": "/assets/equipment/epic_gold_armor.png",
      "rarity": "epic",
      "set": "gold",
      "slot": "armor"
    }
  }
}
```

Every game definition containing an image uses an `imageKey` matching a manifest entry.

Coders must not guess filenames or silently substitute an unrelated image.

When an asset is missing:

* Use the approved placeholder.
* Log or report the missing canonical ID.
* Do not rename another file to hide the mismatch.

Renaming an asset requires updating:

* The file.
* `manifest.json`.
* The game definition.
* Tests that validate asset coverage.
