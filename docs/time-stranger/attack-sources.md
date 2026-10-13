# Phase 1 attack-name evidence

Owner choice, 2026-10-13: Reference Book names in listed order, first three when more exist;
missing slots use verified Time Stranger skills. No strength ranking was found in the
Reference Book. This is a label mapping, not Time Stranger combat rules. TS-106 now
chooses original powers, cross and support effects in card-design.md. Animations remain
the selected visual base's; filler labels do not import Time Stranger behavior.

Primary local evidence: Steam build 23514637, `app_text01/text/skill_name.mbe`, Sheet1
(skill ID, English name), and `app_0/data/digimon_status.mbe`, digimon_status_data.
The table layout uses TS-203's reader (executable 0x140dcf480). By matching the field-guide
signature/learnable names to each character row: zero-based column 72 is its signature;
108/111/114/117 are learned IDs, with the following +2 columns matching learn levels.
These column meanings are inferred from data and cross-checked against the linked pages,
not traced from executable combat logic. All current fillers have local character linkage, including Keramon at 329. The online
field guide differs on Keramon's second learned label; installed Magic Bind wins.

## Added fillers

| Card | Digimon | Label | English skill ID | Character key | Matching columns |
|---|---|---|---|---|---|
| 302 | Guilmon | Critical Charge | 32061 | char_GUILMON | [108] |
| 305 | Growlmon | Magma Fall I | 30031 | char_GROWMON | [108] |
| 308 | WarGrowlmon | Crush Blade II | 30222 | char_MEGAGROWLMON | [111] |
| 313 | Syakomon | Hydro Water I | 30051 | char_SHAKOMON | [108] |
| 316 | Octomon | Hydro Water II | 30052 | char_OCTMON | [108] |
| 316 | Octomon | Void Ray II | 30332 | char_OCTMON | [114] |
| 319 | Dragomon | Hell Crusher II | 30302 | char_DAGOMON | [111] |
| 319 | Dragomon | Hydro Water II | 30052 | char_DAGOMON | [108] |
| 320 | Renamon | Rune Forest I | 30091 | char_RENAMON | [108] |
| 323 | Kyubimon | Mental Break | 32221 | char_KYUBIMON | [108] |
| 324 | Gargomon | Thunder Fall I | 30151 | char_GARGOMON | [111] |
| 326 | Taomon | Hell Crusher II | 30302 | char_TAOMON | [111] |
| 326 | Taomon | Magic Field | 32091 | char_TAOMON | [108] |
| 327 | Rapidmon | Thunder Fall II | 30152 | char_RAPIDMON | [111] |
| 329 | Keramon | Magic Bind | 32151 | char_KERAMON | [111] |
| 329 | Keramon | Venom Trap | 33011 | char_KERAMON | [108] |
| 330 | Monodramon | Comet Hammer I | 30161 | char_MONODRAMON | [108] |
| 330 | Monodramon | Knuckle Beater | 24581 | char_MONODRAMON | [72] |
| 331 | Dracmon | Soul Fear I | 30304 | char_DRACUMON | [111] |
| 332 | Kurisarimon | Mental Break | 32221 | char_KURISARIMON | [111] |
| 332 | Kurisarimon | Shadow Fang II | 30282 | char_KURISARIMON | [108] |
| 333 | Strikedramon | Crush Blade II | 30222 | char_STRIKEDRAMON | [108] |
| 333 | Strikedramon | Heavy Strike II | 30312 | char_STRIKEDRAMON | [111] |
| 334 | Sangloupmon | Nightmare II | 30292 | char_SANGLOUPMON | [114] |
| 335 | MetalTyrannomon | Thunder Fall II | 30152 | char_METALTYRANNOMON | [108] |
| 336 | Cyberdramon | Nanomachine Break II | 30132 | char_CYBERDRAMON | [108] |
| 336 | Cyberdramon | Thunder Fall II | 30152 | char_CYBERDRAMON | [114] |
| 339 | Bearmon | Attack Charge | 32011 | char_BEARMON | [111] |
| 339 | Bearmon | Comet Hammer I | 30161 | char_BEARMON | [108] |
| 340 | Kudamon | Holy Light I | 30261 | char_KUDAMON | [108] |
| 342 | Grizzlymon | Comet Hammer II | 30162 | char_GRYZMON | [108] |
| 342 | Grizzlymon | Gaia Blaster II | 30172 | char_GRYZMON | [114] |
| 345 | GrapLeomon | Nanomachine Break II | 30132 | char_GRAPLEOMON | [108] |

## TS-101 sources and selected names

- **Guilmon (302)**: Rock Breaker / Fire Ball / Critical Charge. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=guilmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/guilmon/).
- **Coronamon (303)**: CoronaｰKnuckles / Corona Flame / Petit Prominence. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=coronamon).
- **Huckmon (304)**: Fifth Rush / Teen Ram / Pepper Breath. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=huckmon).
- **Growlmon (305)**: Plasma Blade / Exhaust Flame / Magma Fall I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=growmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/growlmon/).
- **Firamon (306)**: Flame Dive / Fira Claw / Fira Bomb. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=firamon).
- **BaoHuckmon (307)**: Fif Cross / Teen Blade / Blazing Flame. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=baohuckmon).
- **WarGrowlmon (308)**: Double Edge / Atomic Blaster / Crush Blade II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=megalogrowmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/wargrowlmon/).
- **Flaremon (309)**: Crimson Wave of the Beast King / Crimson Lion Dance / Purifying Howl. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=flaremon).
- **SaviorHuckmon (310)**: Ledge Stride / Meteor Flame / Trident Saber. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=saviorhuckmon).

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

## TS-104 sources and selected names

- **Keramon (329)**: Crazy Giggle / Venom Trap / Magic Bind. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=keramon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/keramon/). Local learned rows override the guide's mismatched Spirit Bind.
- **Monodramon (330)**: Crack Bite / Knuckle Beater / Comet Hammer I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=monodramon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/monodramon/).
- **Dracmon (331)**: Eye of Nightmares / Undead Fang / Soul Fear I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=dracumon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/dracmon/).
- **Kurisarimon (332)**: Data Crusher / Shadow Fang II / Mental Break. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=chrysalimon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/kurisarimon/).
- **Strikedramon (333)**: Fang Strike / Crush Blade II / Heavy Strike II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=strikedramon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/strikedramon/).
- **Sangloupmon (334)**: Sticker Blade / Black Mind / Nightmare II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=sangloupmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/sangloupmon/).
- **MetalTyrannomon (335)**: Giga DestroyerⅡ / Nuclear Laser / Thunder Fall II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=metaltyranomon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/metaltyrannomon/).
- **Cyberdramon (336)**: Desolation Claw / Nanomachine Break II / Thunder Fall II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=cyberdramon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/cyberdramon/).
- **Matadormon (337)**: Thousand Arrows / Bulldog / Earth-Shattering Stomp. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=matadrmon).

## TS-105 sources and selected names

- **Dracomon (338)**: Baby Breath / Tail Smash / Great Strike. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=dracomon).
- **Bearmon (339)**: Bear Fist / Comet Hammer I / Attack Charge. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=bearmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/bearmon/).
- **Kudamon (340)**: Bullet Whirlwind / Blinding Ray / Holy Light I. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=kudamon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/kudamon/).
- **Coredramon (Blue) (341)**: Blue Flare Breath / Strike Bomber / Great StrikeⅡ. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=coredramon_b).
- **Grizzlymon (342)**: Maul Attack / Comet Hammer II / Gaia Blaster II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=gryzmon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/grizzlymon/).
- **Reppamon (343)**: Rolling Tackle / Lion Claw / Razor Wind. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=reppamon).
- **Wingdramon (344)**: Blaze Sonic Breath / Exploding Sonic Lance / Wing Blast. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=wingdramon).
- **GrapLeomon (345)**: The King of Fists / Cyclonic Kick / Nanomachine Break II. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=grappuleomon); [Time Stranger field guide](https://digimon.jsuk.cloud/en/d/grapleomon/).
- **Chirinmon (346)**: Wind Cutter Sword / Knowledge of Swiftness / Holy Wave. [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=tyilinmon).

### 2026-10-13 — owner correction: Keramon replaces Agumon (Black)

Current slot 329 is Keramon, Darkness/R, base Tsukaimon (135), placeholder model 428.
Initially its numbers/effects were copied from Tsukaimon; TS-106 supersedes that
with original gameplay (card-design.md). Local char_KERAMON → chr626 is
present in both model tables; Phase 2 converts all nine Darkness models. The old
black Agumon exception is superseded. Official EX1-044 crop [80,105,320] needs no
restoration and is shared by both art modes. Offset 20000 is retired; the four other
published offsets remain stable. [Full evidence and current roster](roster.md).
