# Asset audit and registry plan

Detection used byte signatures and PNG IHDR/GIF metadata. No file was renamed or regenerated. All paths are relative to repository root. Classification vocabulary: **Missing file**, **Unreadable/corrupt**, **Misleading extension**, **Duplicate**, **No stable game-ID mapping**, **Unused asset**, **Missing visual variant**.

## Exact non-equipment inventory

All listed PNGs are valid PNG, 1254×1254 unless noted; extension `.png`. Required action is “approve proposed key in manifest” unless another action is stated.

| Filepath | Format / dimensions | Proposed key / usage | Classification and exact ambiguity |
|---|---|---|---|
| `public/assets/character-template.png` | PNG 398×655 | `character_template` / development character | Unused asset; template has no canonical character ID; approve placeholder policy or remove later |
| `public/assets/chests.gif` | GIF 1200×675, 15 frames | `chests_opening_sheet` / Chest reveal | No stable game-ID mapping; one animation contains appearances for three chest types; approve frame/variant mapping |
| `public/assets/actions/20 Push-ups.png` | PNG | `push_ups_20` / Action | No stable mapping; filename not canonical |
| `public/assets/actions/40 Squats.png` | PNG | `squats_40` / Action | No stable mapping; filename not canonical |
| `public/assets/actions/Cold shower.png` | PNG | `cold_shower` / Action | No stable mapping |
| `public/assets/actions/Drink a Beer.png` | PNG | `drink_beer` / Action | No stable mapping |
| `public/assets/actions/Drink a Strong Mixed Drink.png` | PNG | `drink_strong_mixed_drink` / Action | No stable mapping |
| `public/assets/actions/Extreme challenge.png` | PNG | `extreme_challenge` / Action | No stable mapping; live challenge content remains admin-configured |
| `public/assets/actions/Find catalan people.png` | PNG | `find_catalan_people` / Action | No stable mapping |
| `public/assets/actions/Find someone you know.png` | PNG | `find_someone_you_know` / Action | No stable mapping |
| `public/assets/actions/Finish your drink.png` | PNG | `finish_your_drink` / Action | No stable mapping |
| `public/assets/actions/Get a permanen tattoo.png` | PNG | `get_permanent_tattoo` / Action | No stable mapping; filename typo `permanen` |
| `public/assets/actions/Have sex with someone.png` | PNG | `have_sex_with_someone` / Action | No stable mapping |
| `public/assets/actions/Make out with someone.png` | PNG | `make_out_with_someone` / Action | No stable mapping |
| `public/assets/actions/Pay for a Shower.png` | PNG | `pay_for_shower` / Action | No stable mapping |
| `public/assets/actions/Smoke a Cigarette.png` | PNG | `smoke_cigarette` / Action | No stable mapping |
| `public/assets/actions/Smoke a Joint.png` | PNG | `smoke_joint` / Action | No stable mapping |
| `public/assets/actions/Take  a Jägermeister Shot.png` | PNG | `take_jagermeister_shot` / Action | No stable mapping; double space/accent |
| `public/assets/actions/Take a Shot.png` | PNG | `take_shot` / Action | No stable mapping |
| `public/assets/actions/Tolk to a stranger for 20+ Minutes.png` | PNG | `talk_to_stranger_20_minutes` / Action | No stable mapping; filename typo `Tolk` |
| `public/assets/chaos-cards/Big Sip.png` | PNG | `big_sip` / Chaos Card | No stable mapping |
| `public/assets/chaos-cards/Double Sip.png` | PNG | `double_sip` / Chaos Card | No stable mapping |
| `public/assets/chaos-cards/Finish your drink.png` | PNG | `finish_your_drink` / Chaos Card | No stable mapping; category namespace required to avoid Action collision |
| `public/assets/chaos-cards/Jägermeister Shot.png` | PNG | `jagermeister_shot` / Chaos Card | No stable mapping; accent |
| `public/assets/chaos-cards/Mirror.png` | PNG | `mirror` / Chaos Card | No stable mapping |
| `public/assets/chaos-cards/Shot.png` | PNG | `shot` / Chaos Card | No stable mapping |
| `public/assets/chaos-cards/Smoke a Cigarette.png` | PNG | `smoke_cigarette` / Chaos Card | No stable mapping; category namespace required |
| `public/assets/consumables/Big Health Potion.png` | PNG | `big_health_potion` / Consumable | No stable mapping |
| `public/assets/consumables/Discharge Pill.png` | PNG | `discharge_pill` / Consumable | No stable mapping |
| `public/assets/consumables/Experience Potion.png` | PNG | `experience_potion` / Consumable | No stable mapping |
| `public/assets/consumables/Fortune Ticket.png` | PNG | `fortune_ticket` / Consumable/Wheel | No stable mapping |
| `public/assets/consumables/Golden Hourglass.png` | PNG | `golden_hourglass` / Consumable | No stable mapping |
| `public/assets/consumables/Small Health Potion.png` | PNG | `small_health_potion` / Consumable | No stable mapping |
| `public/assets/consumables/XP Candy.png` | PNG | `xp_candy` / Consumable | No stable mapping |

## Equipment inventory

All 64 paths below are valid PNG, `.png`, 1254×1254, intended for Equipment. There are no duplicates. Each needs a manifest entry because filenames do not follow the canonical `{rarity}_{set}_{slot}.png` convention. Required action: approve the key shown; do not rename in Handoff 0.

| Exact path template and concrete filenames | Proposed keys |
|---|---|
| `public/assets/equipment/damage/common/damage-{armor,boots,helmet,legs}-common.png` | `common_damage_{armor,boots,helmet,legs}` |
| `public/assets/equipment/damage/rare/damage-helmet-rare.png`, `damage-rare-{armor,boots,legs}.png` in the same folder | `rare_damage_{helmet,armor,boots,legs}` |
| `public/assets/equipment/damage/epic/damage-epic-{armor,boots,helmet,legs}.png` | `epic_damage_{armor,boots,helmet,legs}` |
| `public/assets/equipment/damage/legendary/damage-legendary-{armor,boots,helmet,legs}.png` | `legendary_damage_{armor,boots,helmet,legs}` |
| `public/assets/equipment/dodge/dodge-common-{armor,boots,helmet,legs}.png` | `common_dodge_{armor,boots,helmet,legs}` |
| `public/assets/equipment/potion/potion-common-{armor,boots,helmet,legs}.png` | `common_potion_{armor,boots,helmet,legs}` |
| `public/assets/equipment/protection/protection-rare-{armor,boots,helmet,legs}.png` | `rare_protection_{armor,boots,helmet,legs}` |
| `public/assets/equipment/hospital/hospital-rare-{armor,boots,helmet,legs}.png` | `rare_hospital_{armor,boots,helmet,legs}` |
| `public/assets/equipment/chest/chest-{armor,boots,helmet,legs}-epic.png` | `epic_chest_{armor,boots,helmet,legs}` |
| `public/assets/equipment/gold/gold-epic-{armor,boots,helmet,legs}.png` | `epic_gold_{armor,boots,helmet,legs}` |
| `public/assets/equipment/phoenix/phoenix-legendary-{armor,boots,helmet,legs}.png` | `legendary_phoenix_{armor,boots,helmet,legs}` |
| `public/assets/equipment/thorns/thorns-legendary-{armor,boots,helmet,legs}.png` | `legendary_thorns_{armor,boots,helmet,legs}` |
| `public/assets/equipment/regeneration/common/regeneration-common-{armor,boots,helmet,legs}.png` | `common_regeneration_{armor,boots,helmet,legs}` |
| `public/assets/equipment/regeneration/rare/regeneration-rare-{armor,boots,helmet,legs}.png` | `rare_regeneration_{armor,boots,helmet,legs}` |
| `public/assets/equipment/regeneration/epic/regeneration-epic-{armor,boots,helmet,legs}.png` | `epic_regeneration_{armor,boots,helmet,legs}` |
| `public/assets/equipment/regeneration/legendary/regeneration-legendary-{armor,boots,helmet,legs}.png` | `legendary_regeneration_{armor,boots,helmet,legs}` |

Braces above enumerate four literal filenames, not a runtime glob.

## Exact missing mappings

| Expected key / system usage | Classification | Required action |
|---|---|---|
| `take_group_photo_other_festival_group` / Action | Missing file | provide approved Action art |
| `learn_and_test_phrase_other_language` / Action | Missing file | provide approved Action art |
| `lead_toast_other_festival_group` / Action | Missing file | provide approved Action art |
| `receive_item_from_another_person` / Action | Missing file | provide approved Action art |
| every production `characterId` and face key / Players, validation, ranking | Missing visual variant | provide character and face inventory; template is insufficient |
| `nav_home`,`nav_actions`,`nav_validation`,`nav_inventory`,`nav_store` / navigation | Missing file | provide or approve code-native icon system |
| Wheel background/pointer/slices / Wheel | Missing visual variant | provide approved assets or approve CSS/canvas rendering |
| Hospital background/status art / Hospital | Missing visual variant | provide approved asset or approve UI-only presentation |
| Ranking badges/podium / Ranking | Missing visual variant | provide approved assets or approve CSS presentation |
| distinct Small/Medium/Big Chest mappings / Chests | Missing visual variant | approve how the combined GIF supplies each variant or provide separate files |

No unreadable/corrupt files, misleading extensions, or byte-identical duplicates were found. “No stable mapping” means a manifest approval is absent, not that the image bytes are invalid.

The manifest has typed sections and records display name, path, MIME, dimensions, animation metadata, rarity/slot/subtype and usage. Build validation requires every definition key/path, exact signature/dimensions, unique category key, and explicit unused allow-list.
