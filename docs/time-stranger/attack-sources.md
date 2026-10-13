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
| 313 | Syakomon | Hydro Water I | 30051 | char_SHAKOMON | [108] |
| 316 | Octomon | Hydro Water II | 30052 | char_OCTMON | [108] |
| 316 | Octomon | Void Ray II | 30332 | char_OCTMON | [114] |
| 319 | Dragomon | Hydro Water II | 30052 | char_DAGOMON | [108] |
| 319 | Dragomon | Hell Crusher II | 30302 | char_DAGOMON | [111] |

## TS-102 sources and selected names

- **Gaomon (311)**: Rolling Upper / Double Backhand / Gao Rush. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=gaomon).
- **Lunamon (312)**: Luna Claw / Tearing Shot / Lop-Ear Ripple. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=lunamon).
- **Syakomon (313)**: Black Pearl Blast / Water Pressure / Hydro Water I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=shakomon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/syakomon/).
- **Gaogamon (314)**: Dash Double Claw / Gaoga Hound / Spiral Blow. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=gaogamon).
- **Lekismon (315)**: Moon Night Bomb / Tear Arrow / Moon Night Kick. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=lekismon).
- **Octomon (316)**: Spurting Ink / Hydro Water II / Void Ray II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=octmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/octomon/).
- **MachGaogamon (317)**: Gaoga Tornado / Winning Knuckle / Howling Cannon. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=machgaogamon).
- **Crescemon (318)**: Lunatic Dance / Ice Archery / Dark Archery. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=crescemon).
- **Dragomon (319)**: Forbidden Trident / Hydro Water II / Hell Crusher II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=dagomon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/dragomon/).
