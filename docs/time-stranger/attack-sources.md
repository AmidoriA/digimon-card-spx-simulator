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
| 320 | Renamon | Rune Forest I | 30091 | char_RENAMON | [108] |
| 323 | Kyubimon | Mental Break | 32221 | char_KYUBIMON | [108] |
| 324 | Gargomon | Thunder Fall I | 30151 | char_GARGOMON | [111] |
| 326 | Taomon | Hell Crusher II | 30302 | char_TAOMON | [111] |
| 326 | Taomon | Magic Field | 32091 | char_TAOMON | [108] |
| 327 | Rapidmon | Thunder Fall II | 30152 | char_RAPIDMON | [111] |

## TS-103 sources and selected names

- **Renamon (320)**: Kohenkyo / Diamond Storm / Rune Forest I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=renamon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/renamon/).
- **Terriermon (321)**: Terrier Tornado / Blazing Fire / Double Typhoon. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=terriermon).
- **Lalamon (322)**: Seed Blast / Lala Screw / Sing a Song. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=lalamon).
- **Kyubimon (323)**: Fox Tail Inferno / Dragon Wheel / Mental Break. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=kyubimon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/kyubimon/).
- **Gargomon (324)**: Gatling Arm / Dumdum Uppercut / Thunder Fall I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=galgomon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/gargomon/).
- **Sunflowmon (325)**: Sunshine Beam / Smiley Slap / Cactus Tail. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=sunflowmon).
- **Taomon (326)**: Talisman of Light / Hell Crusher II / Magic Field. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=taomon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/taomon/).
- **Rapidmon (327)**: Rapid Fire / Golden Triangle / Thunder Fall II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=rapidmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/rapidmon/).
- **Lilamon (328)**: Lila Shower / Beauty Slap / Pollen Spray. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=lilamon).
| 329 | Agumon (Black) | Wolkenapalm I | 30011 | absent: bonus character | online character association only |
| 329 | Agumon (Black) | Magic Bind | 32151 | absent: bonus character | online character association only |
| 330 | Monodramon | Knuckle Beater | 24581 | char_MONODRAMON | [72] |
| 330 | Monodramon | Comet Hammer I | 30161 | char_MONODRAMON | [108] |
| 331 | Dracmon | Soul Fear I | 30304 | char_DRACUMON | [111] |
| 332 | Kurisarimon | Shadow Fang II | 30282 | char_KURISARIMON | [108] |
| 332 | Kurisarimon | Mental Break | 32221 | char_KURISARIMON | [111] |
| 333 | Strikedramon | Crush Blade II | 30222 | char_STRIKEDRAMON | [108] |
| 333 | Strikedramon | Heavy Strike II | 30312 | char_STRIKEDRAMON | [111] |
| 334 | Sangloupmon | Nightmare II | 30292 | char_SANGLOUPMON | [114] |
| 335 | MetalTyrannomon | Thunder Fall II | 30152 | char_METALTYRANNOMON | [108] |
| 336 | Cyberdramon | Nanomachine Break II | 30132 | char_CYBERDRAMON | [108] |
| 336 | Cyberdramon | Thunder Fall II | 30152 | char_CYBERDRAMON | [114] |

## TS-104 sources and selected names

- **Agumon (Black) (329)**: Pepper Breath / Wolkenapalm I / Magic Bind. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=agumon-black); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/agumon-black/).
- **Monodramon (330)**: Crack Bite / Knuckle Beater / Comet Hammer I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=monodramon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/monodramon/).
- **Dracmon (331)**: Eye of Nightmares / Undead Fang / Soul Fear I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=dracumon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/dracmon/).
- **Kurisarimon (332)**: Data Crusher / Shadow Fang II / Mental Break. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=chrysalimon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/kurisarimon/).
- **Strikedramon (333)**: Fang Strike / Crush Blade II / Heavy Strike II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=strikedramon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/strikedramon/).
- **Sangloupmon (334)**: Sticker Blade / Black Mind / Nightmare II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=sangloupmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/sangloupmon/).
- **MetalTyrannomon (335)**: Giga Destroyerโ…ก / Nuclear Laser / Thunder Fall II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=metaltyranomon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/metaltyrannomon/).
- **Cyberdramon (336)**: Desolation Claw / Nanomachine Break II / Thunder Fall II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=cyberdramon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/cyberdramon/).
- **Matadormon (337)**: Thousand Arrows / Bulldog / Earth-Shattering Stomp. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=matadrmon).
