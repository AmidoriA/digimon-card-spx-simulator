# Roster: the 45 Time Stranger cards

**Verified against online Time Stranger field-guide sources on 2026-10-13 (TS-001).**
45 different Digimon, none of the disc's 191, with three per (Specialty, level).
The owner chose to retain the proposed Specialties where thematically suitable; see the
policy and changes below. Local game-table confirmation follows TS-201/TS-203.

- Id: card number (custom cards follow BlackWarGreymon, 301). Model: model number (follows
  BlackWarGreymon's 400).
- Base: the disc card the custom card is made from (its numbers, motions, battle scripts and
  pictures). ✱ = a base of another Specialty: the card gets a `battle` block with recoloured
  effects (offsets 20000, 30000, … in id order; 10000 is BlackWarGreymon's).
- TS source: a Time Stranger field-guide page, labelled with its field-guide number and
  attribute. The page's stage was checked against Lv (Rookie/R, Champion/C, Ultimate/U).
- TS element: the signature skill's attack element, **not an intrinsic Digimon element**.
  None (debuff) means the signature skill has no damage element; Neutral (counter) means
  a buff whose counterattack does Neutral damage. These do not force a Specialty change.
- Picture: `card <NO> crop [x, y, size]` or `ref <slug>` (TS-002).
- TS model: the model in Time Stranger, `chrNNN` (its files are `chrNNN.geom`, `chrNNN_*.anim`,
  `images/chrNNN*.img`), with the Digimon's key in the game's tables. Read in TS-203 from
  `text/char_name.mbe` (English name to key) and `data/char_info.mbe` (key to model) of Steam
  build 23514637. All 45 current identities have local model rows; card 329 is Keramon
  (`char_KERAMON` → `chr626`) after the owner's correction.
- Picture edits made through ComfyUI (TS-004) are noted in the Picture column.
- Progress is tracked on Trello: each Specialty's Phase 1 and Phase 2 cards hold a checklist
  of its nine Digimon.

Bases were chosen by body shape (the 3D model keeps the base's shape until Phase 2), then by
Specialty, with three different bases in each slot. Note that DDCB's U level also holds
Megas, so some Ultimates get a Mega's numbers (Chirinmon from MetalGarurumon, for one).

| Id | Spec | Lv | Card | Base (id) | Model | TS source (no. · attribute) | TS element (signature) | Picture | TS model |
|---|---|---|---|---|---|---|---|---|---|
| 302 | Fire | R | Guilmon | Agumon (27) | 401 | [064 · Virus](https://digimon.jsuk.cloud/en/d/guilmon/) | Fire | card `BT2-009` crop `[0, 24, 430]`; edit 302 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr090` (`char_GUILMON`) |
| 303 | Fire | R | Coronamon | Goburimon (33) | 402 | [024 · Vaccine](https://digimon.jsuk.cloud/en/d/coronamon/) | Fire | card `EX5-007` crop `[0, 24, 430]`; edit 303 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr136` (`char_CORONAMON`) |
| 304 | Fire | R | Huckmon | Veemon (175) | 403 | [052 · Data](https://digimon.jsuk.cloud/en/d/huckmon/) | Neutral | card `BT7-009` crop `[0, 24, 430]`; edit 304 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr687` (`char_HACKMON`) |
| 305 | Fire | C | Growlmon | Greymon (14) | 404 | [145 · Virus](https://digimon.jsuk.cloud/en/d/growlmon/) | Fire | card `BT2-013` crop `[0, 24, 430]`; edit 305 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr078` (`char_GROWMON`) |
| 306 | Fire | C | Firamon | Centarumon (19) | 405 | [100 · Vaccine](https://digimon.jsuk.cloud/en/d/firamon/) | Fire | card `EX5-008` crop `[0, 24, 430]`; edit 306 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr137` (`char_FIRAMON`) |
| 307 | Fire | C | BaoHuckmon | Flarerizamon (26) | 406 | [133 · Data](https://digimon.jsuk.cloud/en/d/baohuckmon/) | Neutral | card `BT6-011` crop `[0, 24, 430]`; edit 307 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr115` (`char_BAOHUCKMON`) |
| 308 | Fire | U | WarGrowlmon | MetalGreymon (9) | 407 | [294 · Virus](https://digimon.jsuk.cloud/en/d/wargrowlmon/) | Fire | card `EX2-010` crop `[0, 24, 430]`; edit 308 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr134` (`char_MEGAGROWLMON`) |
| 309 | Fire | U | Flaremon | Garudamon (7) | 408 | [219 · Vaccine](https://digimon.jsuk.cloud/en/d/flaremon/) | Fire | card `EX5-012` crop `[0, 24, 430]`; edit 309 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr138` (`char_FLAREMON`) |
| 310 | Fire | U | SaviorHuckmon | Paildramon (4) | 409 | [240 · Data](https://digimon.jsuk.cloud/en/d/saviorhuckmon/) | Neutral | card `ST12-08` crop `[0, 24, 430]`; edit 310 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr116` (`char_SAVIORHUCKMON`) |
| 311 | Ice | R | Gaomon | Gabumon (62) | 410 | [041 · Data](https://digimon.jsuk.cloud/en/d/gaomon/) | Wind | card `BT4-021` crop `[0, 24, 430]`; edit 311 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr055` (`char_GAOMON`) |
| 312 | Ice | R | Lunamon | Penguinmon (64) | 411 | [057 · Data](https://digimon.jsuk.cloud/en/d/lunamon/) | Water | card `EX5-016` crop `[0, 24, 430]`; edit 312 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr002` (`char_LUNAMON`) |
| 313 | Ice | R | Syakomon | Betamon (63) | 412 | [067 · Virus](https://digimon.jsuk.cloud/en/d/syakomon/) | Water | card `EX5-056` crop `[0, 24, 430]`; edit 313 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr709` (`char_SHAKOMON`) |
| 314 | Ice | C | Gaogamon | Garurumon (46) | 413 | [114 · Data](https://digimon.jsuk.cloud/en/d/gaogamon/) | Wind | card `EX4-017` crop `[0, 24, 430]`; edit 314 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr068` (`char_GAOGAMON`) |
| 315 | Ice | C | Lekismon | Sorcerimon (57) | 414 | [137 · Data](https://digimon.jsuk.cloud/en/d/lekismon/) | Water | card `EX5-017` crop `[0, 24, 430]`; edit 315 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr003` (`char_LEKISMON`) |
| 316 | Ice | C | Octomon | Gesomon (51) | 415 | [142 · Virus](https://digimon.jsuk.cloud/en/d/octomon/) | None (debuff) | card `BT6-023` crop `[0, 24, 430]`; edit 316 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr240` (`char_OCTMON`) |
| 317 | Ice | U | MachGaogamon | WereGarurumon (39) | 416 | [258 · Data](https://digimon.jsuk.cloud/en/d/machgaogamon/) | Wind | card `EX4-019` crop `[0, 24, 430]`; edit 317 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr074` (`char_MACHGAOGAMON`) |
| 318 | Ice | U | Crescemon | Panjyamon (41) | 417 | [237 · Data](https://digimon.jsuk.cloud/en/d/crescemon/) | Ice | ref `crescemon`; no edit (card rules obscure the legs; rejected inpaint reconstruction) | `chr004` (`char_CRESCEMON`) |
| 319 | Ice | U | Dragomon | Zudomon (40) | 418 | [282 · Virus](https://digimon.jsuk.cloud/en/d/dragomon/) | Water | card `BT6-026` crop `[0, 24, 430]`; edit 319 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr129` (`char_DAGOMON`) |
| 320 | Nature | R | Renamon | Gatomon (184) | 419 | [058 · Data](https://digimon.jsuk.cloud/en/d/renamon/) | Plant | card `BT10-032` crop `[0, 24, 430]`; edit 320 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr391` (`char_RENAMON`) |
| 321 | Nature | R | Terriermon | Patamon (183) | 420 | [027 · Vaccine](https://digimon.jsuk.cloud/en/d/terriermon/) | Wind | card `EX2-025` crop `[0, 24, 430]`; edit 321 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr701` (`char_TERRIERMON`) |
| 322 | Nature | R | Lalamon | Palmon (98) | 421 | [056 · Data](https://digimon.jsuk.cloud/en/d/lalamon/) | Plant | card `BT4-052` crop `[0, 24, 430]`; edit 322 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr056` (`char_LALAMON`) |
| 323 | Nature | C | Kyubimon | Unimon (88) | 422 | [117 · Data](https://digimon.jsuk.cloud/en/d/kyubimon/) | Fire | card `BT5-038` crop `[0, 24, 430]`; edit 323 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr395` (`char_KYUBIMON`) |
| 324 | Nature | C | Gargomon | Leomon (85) | 423 | [086 · Vaccine](https://digimon.jsuk.cloud/en/d/gargomon/) | Steel | card `BT3-048` crop `[0, 24, 430]`; edit 324 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr710` (`char_GARGOMON`) |
| 325 | Nature | C | Sunflowmon | Togemon (84) | 424 | [120 · Data](https://digimon.jsuk.cloud/en/d/sunflowmon/) | Plant | card `BT4-054` crop `[0, 24, 430]`; edit 325 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr058` (`char_SUNFLOWMON`) |
| 326 | Nature | U | Taomon | Angewomon (77) | 425 | [242 · Data](https://digimon.jsuk.cloud/en/d/taomon/) | Dark | card `BT5-041` crop `[0, 24, 430]`; edit 326 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr405` (`char_TAOMON`) |
| 327 | Nature | U | Rapidmon | MagnaAngemon (75) | 426 | [227 · Vaccine](https://digimon.jsuk.cloud/en/d/rapidmon/) | Electric | card `BT3-052` crop `[0, 24, 430]`; edit 327 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr722` (`char_RAPIDMON`) |
| 328 | Nature | U | Lilamon | Lillymon (78) | 427 | [262 · Data](https://digimon.jsuk.cloud/en/d/lilamon/) | Plant | card `BT4-059` crop `[0, 24, 430]`; edit 328 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr073` (`char_LILAMON`) |
| 329 | Darkness | R | Keramon | Tsukaimon (135) | 428 | [080 · Unknown](https://digimon.jsuk.cloud/en/d/keramon/) | Dark | card `EX1-044` crop `[80, 105, 320]`; no edit needed | `chr626` (`char_KERAMON`) |
| 330 | Darkness | R | Monodramon | Veemon (175) ✱ | 429 | [037 · Vaccine](https://digimon.jsuk.cloud/en/d/monodramon/) | Neutral | card `BT1-009` crop `[0, 24, 430]`; edit 330 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr458` (`char_MONODRAMON`) |
| 331 | Darkness | R | Dracmon | DemiDevimon (132) | 430 | [070 · Virus](https://digimon.jsuk.cloud/en/d/dracmon/) | Dark | card `ST6-04` crop `[0, 24, 430]`; edit 331 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr457` (`char_DRACUMON`) |
| 332 | Darkness | C | Kurisarimon | Bakemon (123) | 431 | [178 · Unknown](https://digimon.jsuk.cloud/en/d/kurisarimon/) | Dark | card `BT2-059` crop `[0, 24, 430]`; edit 332 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr630` (`char_KURISARIMON`) |
| 333 | Darkness | C | Strikedramon | Darkrizamon (130) | 432 | [093 · Vaccine](https://digimon.jsuk.cloud/en/d/strikedramon/) | Fire | card `EX2-032` crop `[0, 24, 430]`; edit 333 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr016` (`char_STRIKEDRAMON`) |
| 334 | Darkness | C | Sangloupmon | Gururumon (126) | 433 | [153 · Virus](https://digimon.jsuk.cloud/en/d/sangloupmon/) | Dark | card `BT9-073` crop `[0, 24, 430]`; edit 334 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr030` (`char_SANGLOUPMON`) |
| 335 | Darkness | U | MetalTyrannomon | MasterTyrannomon (8) ✱ | 434 | [295 · Virus](https://digimon.jsuk.cloud/en/d/metaltyrannomon/) | Electric | card `BT1-024` crop `[0, 24, 430]`; edit 335 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr364` (`char_METALTYRANNOMON`) |
| 336 | Darkness | U | Cyberdramon | Andromon (116) | 435 | [210 · Vaccine](https://digimon.jsuk.cloud/en/d/cyberdramon/) | Neutral | card `EX3-050` crop `[0, 24, 430]`; edit 336 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr719` (`char_CYBERDRAMON`) |
| 337 | Darkness | U | Matadormon | Myotismon (111) | 436 | [290 · Virus](https://digimon.jsuk.cloud/en/d/matadormon/) | Dark | card `BT9-077` crop `[0, 24, 430]`; edit 337 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr031` (`char_MATADRMON`) |
| 338 | Rare | R | Dracomon | ClearAgumon (168) | 437 | [049 · Data](https://digimon.jsuk.cloud/en/d/dracomon/) | Fire | card `ST1-04` crop `[0, 24, 430]`; edit 338 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr208` (`char_DRACOMON`) |
| 339 | Rare | R | Bearmon | Psychemon (170) | 438 | [035 · Vaccine](https://digimon.jsuk.cloud/en/d/bearmon/) | Neutral | card `BT9-057` crop `[0, 24, 430]`; edit 339 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr234` (`char_BEARMON`) |
| 340 | Rare | R | Kudamon | Vi-Elecmon (169) | 439 | [022 · Vaccine](https://digimon.jsuk.cloud/en/d/kudamon/) | None (debuff) | card `P-043` crop `[0, 24, 430]`; edit 340 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr053` (`char_KUDAMON`) |
| 341 | Rare | C | Coredramon (Blue) | Rockmon (159) | 440 | [091 · Vaccine](https://digimon.jsuk.cloud/en/d/coredramon-blue/) | Fire | card `EX3-018` crop `[0, 24, 430]`; edit 341 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr218` (`char_COREDRAMON_BL`) |
| 342 | Rare | C | Grizzlymon | Ankylomon (151) | 441 | [089 · Vaccine](https://digimon.jsuk.cloud/en/d/grizzlymon/) | Neutral (counter) | card `BT9-060` crop `[0, 24, 430]`; edit 342 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr235` (`char_GRYZMON`) |
| 343 | Rare | C | Reppamon | ShimaUnimon (162) | 442 | [110 · Vaccine](https://digimon.jsuk.cloud/en/d/reppamon/) | Steel | card `BT1-051` crop `[0, 24, 430]`; edit 343 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended | `chr077` (`char_REPPAMON`) |
| 344 | Rare | U | Wingdramon | Gigadramon (5) ✱ | 443 | [200 · Vaccine](https://digimon.jsuk.cloud/en/d/wingdramon/) | Fire | card `ST8-07` crop `[0, 24, 430]`; edit 344 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr210` (`char_WINGDRAMON`) |
| 345 | Rare | U | GrapLeomon | Etemon (150) | 444 | [205 · Vaccine](https://digimon.jsuk.cloud/en/d/grapleomon/) | Wind | card `BT4-057` crop `[0, 24, 430]`; edit 345 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr403` (`char_GRAPLEOMON`) |
| 346 | Rare | U | Chirinmon | MetalGarurumon (37) ✱ | 445 | [213 · Vaccine](https://digimon.jsuk.cloud/en/d/chirinmon/) | Light | card `EX5-031` crop `[0, 24, 430]`; edit 346 via `ts002-inpaint`: frame/cost/DP print removed; background margins extended; rules text removed | `chr084` (`char_TYILINMON`) |

## Specialty policy (owner decision, 2026-10-13)

The owner chose **"Keep the proposed Specialty when thematically suitable"** after the
sources showed that Time Stranger has elemental matchups and skill elements, rather than
one elemental label on a Digimon. The original strict element-to-Specialty rule is therefore
superseded for this roster. The Specialties remain Fire, Ice, Nature, Darkness and Rare,
with nine cards each. Work stays on `time-stranger` until all 45 new cards are complete;
no card is moved solely because of its signature skill's element.

The mapping Fire → Fire; Water/Ice → Ice; Plant/Wind/Earth/Light/Electric → Nature;
Dark → Darkness; Neutral/Steel/other → Rare is a guide to thematic choices, not a claim
about a game mechanic. In particular:

- Fire retains the Huckmon family alongside the Guilmon and Coronamon families. Huckmon's
  signature is Neutral, but it resists Fire; BaoHuckmon learns a Fire attack, and the family
  is kept together. BaoHuckmon and SaviorHuckmon also have Neutral signatures.
- Ice retains the Gaomon family: all three resist Ice despite having Wind signatures.
  The Lunamon family supplies Water/Ice skills. Syakomon, Octomon and Dragomon are the
  aquatic group; Octomon's signature is a debuff, not a Water attack.
- Nature keeps the Renamon, Terriermon and Lalamon families together. Kyubimon's Fire,
  Gargomon's Steel and Taomon's Dark signatures are recorded accurately rather than
  being relabelled to match their custom card Specialty.
- Darkness keeps the black Agumon variant and the Monodramon/Strikedramon/Cyberdramon
  and Dracmon/Sangloupmon/Matadormon themes. Fire, Neutral and Electric skills do not
  make those custom card choices facts about Time Stranger. Kurisarimon fills the
  missing Champion slot with a Dark signature; the three cards in that themed column
  are not asserted to be a direct evolution chain.
- Rare retains the Dracomon dragon family, Bearmon beast family and Kudamon holy-beast
  family. Dracomon/Coredramon (Blue)/Wingdramon have Fire signatures, GrapLeomon has
  Wind and Chirinmon has Light; these are intentional theme choices. Kudamon's
  signature is a debuff, and Grizzlymon's counter does Neutral damage.

## Identity corrections and replacements

- 304/307/310: Hackmon/BaoHackmon/SaviorHackmon → **Huckmon/BaoHuckmon/SaviorHuckmon**,
  the English names shown by the Time Stranger sources. These are spelling aliases,
  not different species.
- Historical, superseded 329: BlackAgumon was corrected to **Agumon (Black)**,
  field-guide 468, distinct from the disc's Agumon. The owner later classified it as
  Fire and replaced it with Keramon; the old availability/placeholder exception is closed.
- 341: Coredramon → **Coredramon (Blue)**, field-guide 091. The blue form explicitly
  evolves into Wingdramon, so this resolves the unspecified colour without changing
  the intended dragon family; Coredramon (Green) is a separate field-guide entry (149).
- 332: DarkTyrannomon → **Kurisarimon** (178), an alternate already listed in the plan.
  DarkTyrannomon is absent from both indexes linked below. Kurisarimon is a Champion,
  absent from the DDCB disc, and has a Dark signature. Its base changes from Tyrannomon
  (16) ✱ to **Bakemon (123)**: a floating body with hanging limbs is a closer placeholder
  for a chrysalis with appendages than a dinosaur. Bakemon is already Darkness, so no ✱.
- 319: MarineDevimon → **Dragomon** (282). MarineDevimon is absent from both indexes.
  Dragomon is an aquatic Ultimate and explicitly evolves from Octomon, preserving the
  Syakomon → Octomon → Ultimate route. Its base changes from WaruSeadramon (43) to
  **Zudomon (40)**, a bulky aquatic biped rather than a long serpent. The Ice Ultimate
  bases remain three different cards (39, 41, 40).

The absence findings use the [476-entry index](https://digimon.jsuk.cloud/en/d/) and
[DigimonWiki's Time Stranger field guide](https://digimon.fandom.com/wiki/Digimon_Story:_Time_Stranger/Field_Guide),
checked on 2026-10-13. They are online roster findings, not proof about an unread local
installation. Every retained/replacement row links to its individual field-guide page;
each page includes Basic Info, matchups, skills and a linked in-game field-guide screen.

## Verification and follow-up

- Checked all 45 source pages for presence, number, stage, attribute and signature skill.
  This is an online-source audit; the linked screenshots were not independently transcribed.
- Compared names, including the spelling aliases above and Kurisarimon/Chrysalimon and
  Chirinmon/Tyilinmon, against all 191 Digimon in `web/js/data/cards.js` (ids 0–190).
  There are no disc duplicates. MarineAngemon is not MarineDevimon; ordinary Agumon is
  not its black variant, and disc Lillymon is not Lilamon.
- Checked card ids 302–346, model ids 401–445, three rows and three distinct base ids
  in each of the 15 slots, exact base names/ids, and every cross-Specialty ✱ marker.
  There are five ✱ bases after replacing DarkTyrannomon; Phase 1 derives their battle
  offsets in card-id order as described above. No stats, assets or game code changed.
- Roster.md is authoritative for later tickets. Their Phase 1 tables, Phase 2 model
  lists and Phase 3 deck targets are now synchronized with these names and bases;
  phase1.md records the five current cross-Specialty battle offsets.
- After TS-201/TS-203 can read the owner's install, check these identities, availability
  and skills against its tables and record any discrepancy. No local tables were read
  for TS-001; this later check remains open without being a dependency of the online audit.

## Alternates

If later local-game verification requires another change:

- Darkness: Impmon; Keramon → Kurisarimon (Kurisarimon is now used at 332).
- Nature or Rare: Lopmon → Turuiemon → Antylamon; Falcomon → Peckmon.
- Rare: Kotemon → Dinohyumon.
- Ice: Crabmon → Ebidramon.

## Picture audit (TS-002, 2026-10-13)

All 45 final pictures were inspected as contact sheets; unclear text/edges and the variant identities were checked at native size. No selected source contains SAMPLE. 43 regular card illustrations use the broad normalized crop and recorded edits;
Keramon uses the clean EX1-044 crop [80,105,320]. Their original compositions can still be close-ups; restoration does not claim unseen anatomy from the game.

Each `edit <id>` above is the matching recipe in `tools/new_art_edits.json`: model `512-inpainting-ema.safetensors`, stored workflow `tools/comfy_workflows/ts002-inpaint.json`, explicit mask, prompt, seed and sampling settings. Edited native crops, before pictures, masks and hash metadata are cached under `extracted/newart/edited/ts002/<id>.*`; download files stay in `cards/` and `ref/`. `tools/time_stranger_art.json` is the machine-readable selection; it does not add playable cards.

Crescemon is an intentional suitability fallback, not an assertion that it has no card: EX5-020 and its print variants place rules over the legs; attempted restoration changed the anatomy and was rejected. The inspected official Reference Book source is https://digimon.net/reference_en/detail.php?directory_name=crescemon (image `crescemon.jpg`). Current 329 is Keramon, EX1-044 crop [80,105,320], with no card UI print in the crop. The earlier BT8-058 black Agumon selection is superseded. Coredramon (Blue) remains EX3-018, visibly blue; its official card title omits the qualifier.

Current validation: 45 source entries (ids 302–346), 43 active cached ComfyUI edits
plus unedited Keramon and Reference Book Crescemon, verified source images and valid crop bounds; every pixel outside every declared mask remains identical to its source. Coronamon edit 303 was independently uploaded and executed twice on this local ComfyUI: decoded pixel SHA-256 `96b5cbc7c0e3e262e468c2c45f8df704771a5fc0207ba1ea7371cb5e666d99ce` both times. Fixed-seed reproducibility on other hardware/software is not asserted. The owner accepted its before/after on 2026-10-13.

### TS-101 Phase 1 — 2026-10-13

Cards 302–310 are playable with recoloured disc placeholders, unchanged base numbers/effects,
verified three-slot labels (attack-sources.md), and identical prepared pictures in both
art modes. Required checks and browser review passed; integrated into time-stranger.

### TS-102 Phase 1 — 2026-10-13

Cards 311–319 are playable with recoloured disc placeholders, unchanged base numbers/effects,
verified three-slot labels (attack-sources.md), and identical prepared pictures in both
art modes. Required checks and browser review passed; integrated into time-stranger.

### TS-103 Phase 1 — 2026-10-13

Cards 320–328 are playable with recoloured disc placeholders, unchanged base numbers/effects,
verified three-slot labels (attack-sources.md), and identical prepared pictures in both
art modes. Required checks and browser review passed; integrated into time-stranger.

### TS-104 Phase 1 — 2026-10-13

Cards 329–337 are playable with recoloured disc placeholders, unchanged base numbers/effects,
verified three-slot labels (attack-sources.md), and identical prepared pictures in both
art modes. Required checks and browser review passed; integrated into time-stranger.

### 2026-10-13 — owner correction: Keramon replaces Agumon (Black)

The owner classified the black Agumon variant as Fire and removed it from this Darkness
slot. Current card 329 is **Keramon**, Darkness/R, base **Tsukaimon (135)**, placeholder
model **428**. Its shape remains the recoloured PS1 base until Phase 2; this is an
approximation, not a native Keramon mesh. All numbers/support/cross effects now equal
Tsukaimon's exactly. No other cards' numbers or effects changed.

Local Steam build 23514637 evidence: `app_text01/text/char_name.mbe` maps Keramon to
`char_KERAMON`; column 3 in both app_0 and patch `data/char_info.mbe` maps it to `chr626`.
`chr626.geom` and its animation files exist; the model was read and drawn with overlays.
`app_0/data/digimon_status.mbe` links skill IDs 26261 / 33011 / 32151 to this character
(columns 72 / 108 / 111); English labels are Crazy Giggle / Venom Trap / Magic Bind.
Crazy Giggle's battle_skill row has element 10 in column 28; English `text/element.mbe`
maps 10 to Dark, agreeing with the online field guide. This column meaning is inferred
from data, not traced from combat code. The field guide's Spirit Bind label differs from
the installed row: the local Magic Bind label wins. Labels do not add TS debuff rules.

Official picture **EX1-044**, crop **[80, 105, 320]**, needs no restoration: cost, DP,
level gauge and rules are outside the crop; the binary digits are its illustration's
background. The same native crop and 160px mini serve both art modes. Card illustration
is preferred over the Reference Book; no ComfyUI restart or new generation was needed.

Only four active cross-Specialty rows remain, 330 / 335 / 344 / 346. Offset **20000** is
retired with card 329's old cloned effects; active offsets stay **30000 / 40000 / 50000 /
60000** to keep already published asset identifiers stable. TS-208d must convert all
nine Darkness models, including Keramon's chr626 into 428. Previous Black Agumon
absence/placeholder decisions below are historical and superseded by this correction.

Sources: [Reference Book](https://digimon.net/reference_en/detail.php?directory_name=keramon),
[Time Stranger field guide](https://digimon.jsuk.cloud/en/d/keramon/),
[official card search](https://world.digimoncard.com/cardlist/?search=true&free=Keramon).

### TS-105 Phase 1 — 2026-10-14

Cards 338–346 are playable with recoloured disc placeholders, unchanged base numbers/effects,
verified three-slot labels (attack-sources.md), and identical prepared pictures in both
art modes. Required checks and browser review passed; integrated into time-stranger.
