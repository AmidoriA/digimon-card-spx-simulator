# Phase 1 attack-name evidence

Owner choice, 2026-10-13: Reference Book names in listed order, first three when more exist;
missing slots use verified Time Stranger skills. No strength ranking was found in the
Reference Book. This is a label mapping, not Time Stranger combat rules: every DDCB
power, support, cross effect and animation remains the selected base's. Some fillers are
buffs/debuffs in Time Stranger and do not acquire that behavior here.

Primary local evidence: Steam build 23514637, `app_text01/text/skill_name.mbe`, Sheet1
(skill ID, English name), and `app_0/data/digimon_status.mbe`, digimon_status_data.
The table layout uses TS-203's reader (executable 0x140dcf480). By matching the field-guide
signature/learnable names to each character row: zero-based column 72 is its signature;
108/111/114/117 are learned IDs, with the following +2 columns matching learn levels.
These column meanings are inferred from data and cross-checked against the linked pages,
not traced from executable combat logic. Agumon (Black) is absent locally: its two generic
skill names exist locally but the character association is verified only by its online
field guide. Its disc placeholder model is retained per the owner's earlier decision.

## Added fillers

| Card | Digimon | Label | English skill ID | Character key | Matching columns |
|---|---|---|---|---|---|
| 302 | Guilmon | Critical Charge | 32061 | char_GUILMON | [108] |
| 305 | Growlmon | Magma Fall I | 30031 | char_GROWMON | [108] |
| 308 | WarGrowlmon | Crush Blade II | 30222 | char_MEGAGROWLMON | [111] |

## TS-101 sources and selected names

- **Guilmon (302)**: Rock Breaker / Fire Ball / Critical Charge. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=guilmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/guilmon/).
- **Coronamon (303)**: Corona๏ฝฐKnuckles / Corona Flame / Petit Prominence. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=coronamon).
- **Huckmon (304)**: Fifth Rush / Teen Ram / Pepper Breath. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=huckmon).
- **Growlmon (305)**: Plasma Blade / Exhaust Flame / Magma Fall I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=growmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/growlmon/).
- **Firamon (306)**: Flame Dive / Fira Claw / Fira Bomb. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=firamon).
- **BaoHuckmon (307)**: Fif Cross / Teen Blade / Blazing Flame. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=baohuckmon).
- **WarGrowlmon (308)**: Double Edge / Atomic Blaster / Crush Blade II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=megalogrowmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/wargrowlmon/).
- **Flaremon (309)**: Crimson Wave of the Beast King / Crimson Lion Dance / Purifying Howl. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=flaremon).
- **SaviorHuckmon (310)**: Ledge Stride / Meteor Flame / Trident Saber. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=saviorhuckmon).
