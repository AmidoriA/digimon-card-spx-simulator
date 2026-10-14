# Decks: one per new Ultimate (Phase 3)

TS-301 plan, verified against all 159 original deck records (IDs 0–158) on 2026-10-14.
Build tickets TS-302–TS-306 consume `tools/time_stranger_decks.json`; the JSON records the
same ordered replacements, copy counts, all ranked candidates and the frozen original-data hashes.
The card gameplay comes from [card-design.md](card-design.md), not the visual donors.

## Names, owners and exact exchanges

Each `×N` means **all N copies** of that one source are exchanged. Every other card stays
at the same position, including all Options. Each result has 30 cards and at most 4 copies
of any card. Rank, armor and music come from the base. The base owner in the table is source
provenance. Owner update (2026-10-14): the displayed owner is the Ultimate in the first
column; its prepared illustration supplies the selector and large-preview portrait.
`owner` and `ownerCard` in the machine plan record this separately from `base.owner`.

| Ultimate | Spec | Base deck (ID; owner) | Exchange | Name | Reason |
|---|---|---|---|---|---|
| WarGrowlmon | Fire | Go Go Dinosaur (#6; Veemon) | Agumon ×4 → Guilmon; Greymon ×3 → Growlmon; MetalGreymon ×2 → WarGrowlmon | Crimson Fire Again | Rank 7 exact R/C copies, 25 target-Specialty Digimon copies, then lowest deck ID. |
| Flaremon | Fire | First Attack (#42; Birdramon) | Goburimon ×3 → Coronamon; Birdramon ×4 → Firamon; Garudamon ×2 → Flaremon | Solar Flame Again | Skip #158 Practice: Player owner is excluded from opponent list (ui.js OP_DECKS), so it cannot meet TS-302 opponent/match acceptance. Next candidate #42 ranks 3 exact R/C copies and 20 Fire Digimon copies; Birdramon supplies missing Centarumon. |
| SaviorHuckmon | Fire | Fire Heart (#27; Davis) | Veemon ×1 → Huckmon; Flarerizamon ×1 → BaoHuckmon; Paildramon ×2 → SaviorHuckmon | Brave Fire Revived | Rank 2 exact R/C copies, 21 target-Specialty Digimon copies, then lowest deck ID. |
| MachGaogamon | Ice | Shoot Everything! (#88; MetalGarurumon) | Gabumon ×4 → Gaomon; Garurumon ×4 → Gaogamon; WereGarurumon ×1 → MachGaogamon | Lunar Howl Again | Rank 8 exact R/C copies, 22 target-Specialty Digimon copies, then lowest deck ID. |
| Crescemon | Ice | Fightback (#13; Garurumon) | Penguinmon ×3 → Lunamon; Garurumon ×4 → Lekismon; Zudomon ×2 → Crescemon | Moonlight Revived | Ultimate roster donor appears in no original deck; rank same-Specialty Ultimate alternatives. Rank 3 exact R/C copies, 22 target-Specialty Digimon copies, then lowest deck ID. Fallback: Lekismon from Garurumon, Crescemon from Zudomon. |
| Dragomon | Ice | First Aid (#91; Joe) | Betamon ×4 → Syakomon; Ikkakumon ×3 → Octomon; Zudomon ×2 → Dragomon | Deep Sea Revived | Rank 4 exact R/C copies, 27 target-Specialty Digimon copies, then lowest deck ID. Fallback: Octomon from Ikkakumon. |
| Taomon | Nature | Divine Monster (#74; Nefertimon) | Gatomon ×1 → Renamon; Unimon ×3 → Kyubimon; Angewomon ×2 → Taomon | Divine Fox Again | Rank 4 exact R/C copies, 20 target-Specialty Digimon copies, then lowest deck ID. |
| Rapidmon | Nature | Call of Destiny (#73; Gatomon) | Salamon ×3 → Terriermon; Leomon ×3 → Gargomon; MagnaAngemon ×2 → Rapidmon | Rapid Hope Again | Rank 3 exact R/C copies, 17 target-Specialty Digimon copies, then lowest deck ID. Fallback: Terriermon from Salamon. |
| Lilamon | Nature | Flower Fairies (#85; Lillymon) | Palmon ×4 → Lalamon; Togemon ×4 → Sunflowmon; Lillymon ×4 → Lilamon | Flower Bloom Again | Rank 8 exact R/C copies, 30 target-Specialty Digimon copies, then lowest deck ID. |
| MetalTyrannomon | Darkness | Go Go Dinosaur (#6; Veemon) | Agumon ×4 → Keramon; Greymon ×3 → Kurisarimon; MasterTyrannomon ×1 → MetalTyrannomon | Dark Steel Again | Rank 0 exact R/C copies, 0 target-Specialty Digimon copies, then lowest deck ID. Fallback: Keramon from Agumon, Kurisarimon from Greymon. |
| Cyberdramon | Darkness | Machine Empire (#100; Machinedramon) | Kokuwamon ×4 → Monodramon; Guardromon ×4 → Strikedramon; Andromon ×1 → Cyberdramon | Machine Fang Again | Rank 0 exact R/C copies, 13 target-Specialty Digimon copies, then lowest deck ID. Fallback: Monodramon from Kokuwamon, Strikedramon from Guardromon. |
| Matadormon | Darkness | Dark Revival (#52; Myotismon) | DemiDevimon ×4 → Dracmon; Devidramon ×3 → Sangloupmon; Myotismon ×4 → Matadormon | Night Dance Again | Skip higher candidate lacking a Rookie or Champion level. Rank 4 exact R/C copies, 21 target-Specialty Digimon copies, then lowest deck ID. Fallback: Sangloupmon from Devidramon. |
| Wingdramon | Rare | Mega Giga (#38; Gigadramon) | Agumon ×3 → Dracomon; Flarerizamon ×3 → Coredramon (Blue); Gigadramon ×2 → Wingdramon | Sky Dragon Again | Rank 0 exact R/C copies, 0 target-Specialty Digimon copies, then lowest deck ID. Fallback: Dracomon from Agumon, Coredramon (Blue) from Flarerizamon. |
| GrapLeomon | Rare | Steel Gate (#51; MetalEtemon) | Psychemon ×3 → Bearmon; ShimaUnimon ×2 → Grizzlymon; Etemon ×2 → GrapLeomon | Beast Fist Again | Rank 3 exact R/C copies, 20 target-Specialty Digimon copies, then lowest deck ID. Fallback: Grizzlymon from ShimaUnimon. |
| Chirinmon | Rare | Steel Gate (#51; MetalEtemon) | Vi-Elecmon ×3 → Kudamon; ShimaUnimon ×2 → Reppamon; MetalEtemon ×3 → Chirinmon | Holy Beast Revived | Ultimate roster donor appears in no original deck; rank same-Specialty Ultimate alternatives. Rank 5 exact R/C copies, 20 target-Specialty Digimon copies, then lowest deck ID. Fallback: Chirinmon from MetalEtemon. |

## Deterministic selection and exceptions

See [phase3.md](phase3.md) for the complete order. R/C score counts copies of the exact
roster donors, including a donor from another Specialty. Specialty score counts all
Digimon copies of the target Specialty, ignoring Options. Final ties use ascending disc
deck ID; repeated rematch records are candidates in their own right. A candidate must
be eligible as an opponent and contain a Rookie, Champion and Ultimate so that each new themed group appears.

The original plan cannot be followed literally in these disc-proven cases:

- **Crescemon:** Panjyamon (41) occurs in **0/159 decks**. Rank every Ice deck containing an Ice Ultimate; #13 wins on 3 R/C copies, 22 Ice copies and lowest ID. Its most numerous Ice Ultimate is Zudomon ×2; its missing Sorcerimon slot uses Garurumon ×4. Penguinmon ×3 is exact.
- **Chirinmon:** MetalGarurumon (37) occurs in **0/159 decks**. Rank every Rare deck containing a Rare Ultimate; #51 wins with both exact line donors (Vi-Elecmon ×3 + ShimaUnimon ×2), 20 Rare copies. MetalEtemon ×3 is its most numerous Rare Ultimate and becomes Chirinmon.
- **Matadormon:** #36 has 4 exact Rookie copies and 26 Darkness copies, but **zero Champions of any Specialty**. Skip it; #52 is the next ranked candidate (4 exact R/C copies, 21 Darkness copies) and supplies Devidramon ×3. No stage or Option is repurposed.
- **MetalTyrannomon:** its Fire donor MasterTyrannomon appears only in #6 and #25. Both have zero exact R/C donors and zero Darkness cards at R/C. #6 wins by ID; Fire is dominant at both levels. Agumon ×4 → Keramon and Greymon ×3 → Kurisarimon supply the complete Darkness group. The group is thematic; no direct Keramon → Kurisarimon → MetalTyrannomon lore chain is claimed.
- **Wingdramon:** Gigadramon appears only in #38 and #115; neither has Rare R/C cards. #38 wins on ID after equal 0/0 R/C/Specialty scores. Fire and Darkness tie at 5 Rookie copies, so Fire (Specialty ID 0) wins; the same tie at 4 Champion copies again selects Fire. Agumon ×3 and Flarerizamon ×3 become Dracomon and Coredramon (Blue).
- **Cyberdramon:** Veemon (a cross-Specialty visual donor) is absent from its sole eligible base #100; Kokuwamon ×4 provides Darkness Rookies. Darkrizamon is also absent; Guardromon ×4 supplies Darkness Champions.
- **Flaremon opponent eligibility:** #158 Practice has the best exact R/C count (4) but its Player owner is excluded from the opponent list by `ui.js` `OP_DECKS`. #42 First Attack (Birdramon) is next, with 3 exact R/C copies and 20 Fire cards. It supplies Goburimon ×3, Birdramon ×4 and Garudamon ×2.
- **Other missing slots:** Flaremon uses Birdramon ×4 because #42 has no Centarumon; Dragomon uses Ikkakumon ×3 because #91 has no Gesomon; Rapidmon uses Salamon ×3 because #73 has no Patamon; GrapLeomon uses ShimaUnimon ×2 because #51 has no Ankylomon. Tied legal source cards use the lowest source card ID.

Exactly one donor is chosen for a missing slot: combining every card of the same level
would exceed the four-copy limit in many bases. A chosen donor is exchanged completely;
there are no partial substitutions. This is a necessary clarification of the original
plural fallback wording. Strict Ultimate donor containment remains the rule wherever
that donor occurs at all. The two absent-U exceptions, Player exclusion and the empty-Champion exception
are project choices documented here, not rules read from the game.

## Exhaustive candidate ranking

The following lists contain **every eligible original deck**, in rank order. For the
two absent Ultimate donors, the candidates are all decks containing a target-Specialty
Ultimate. `R/C/U` are exact visual-donor copies (U remains zero for absent-donor cases);
`Spec` counts Digimon copies of the target Specialty. `Skip` marks a Player-owned deck or
a deck missing an entire R/C level. No gameplay tuning is used to reorder the phase3 rules.

### WarGrowlmon

Roster donors: Agumon (27) / Greymon (14) / MetalGreymon (9).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 6 | Go Go Dinosaur | Veemon | 4/3/2 | 7 | 25 | Chosen |
| 2 | 27 | Fire Heart | Davis | 3/2/1 | 5 | 21 |  |

### Flaremon

Roster donors: Goburimon (33) / Centarumon (19) / Garudamon (7).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 158 | Practice | Player | 4/0/1 | 4 | 16 | Skip: Player deck excluded from opponent list |
| 2 | 42 | First Attack | Birdramon | 3/0/2 | 3 | 20 | Chosen |
| 3 | 82 | Sun's Gift | Garudamon | 0/0/4 | 0 | 22 |  |
| 4 | 135 | Sun's Gift | Garudamon | 0/0/4 | 0 | 22 |  |
| 5 | 83 | Hyper Digivolution | Sora | 0/0/4 | 0 | 20 |  |
| 6 | 58 | Storm Bringer | Aquilamon | 0/0/2 | 0 | 11 |  |
| 7 | 3 | New Power | Babamon | 0/0/1 | 0 | 6 |  |

### SaviorHuckmon

Roster donors: Veemon (175) / Flarerizamon (26) / Paildramon (4).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 27 | Fire Heart | Davis | 1/1/2 | 2 | 21 | Chosen |
| 2 | 103 | Miracle Knight's | Magnamon | 1/0/3 | 1 | 21 |  |
| 3 | 81 | Three Signs | Paildramon | 0/0/4 | 0 | 19 |  |

### MachGaogamon

Roster donors: Gabumon (62) / Garurumon (46) / WereGarurumon (39).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 88 | Shoot Everything! | MetalGarurumon | 4/4/1 | 8 | 22 | Chosen |
| 2 | 136 | Shooter | MetalGarurumon | 4/4/1 | 8 | 22 |  |
| 3 | 13 | Fightback | Garurumon | 3/4/1 | 7 | 22 |  |
| 4 | 138 | Fightback | Garurumon | 3/4/1 | 7 | 22 |  |
| 5 | 43 | Howl to the Moon | WereGarurumon | 3/4/4 | 7 | 21 |  |
| 6 | 91 | First Aid | Joe | 0/0/1 | 0 | 27 |  |

### Crescemon

Roster donors: Penguinmon (64) / Sorcerimon (57) / Panjyamon (41).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 13 | Fightback | Garurumon | 3/0/0 | 3 | 22 | Chosen |
| 2 | 47 | Mega Flood | MegaSeadramon | 3/0/0 | 3 | 22 |  |
| 3 | 116 | Patriot | BK MetalGarurumon | 0/3/0 | 3 | 22 |  |
| 4 | 138 | Fightback | Garurumon | 3/0/0 | 3 | 22 |  |
| 5 | 41 | Anti-Fire | Ikkakumon | 3/0/0 | 3 | 21 |  |
| 6 | 43 | Howl to the Moon | WereGarurumon | 3/0/0 | 3 | 21 |  |
| 7 | 11 | Hearty Meal | Frigimon | 3/0/0 | 3 | 19 |  |
| 8 | 90 | Armed | Zudomon | 0/2/0 | 2 | 19 |  |
| 9 | 134 | Armed | Zudomon | 0/2/0 | 2 | 19 |  |
| 10 | 89 | Bonding | Matt | 2/0/0 | 2 | 13 |  |
| 11 | 31 | Magic Strike | Wizardmon | 0/2/0 | 2 | 6 |  |
| 12 | 113 | Blue Star Red Moon | Omnimon | 1/0/0 | 1 | 11 |  |
| 13 | 3 | New Power | Babamon | 0/1/0 | 1 | 6 |  |
| 14 | 91 | First Aid | Joe | 0/0/0 | 0 | 27 |  |
| 15 | 12 | Guarding Sea | Whamon | 0/0/0 | 0 | 22 |  |
| 16 | 88 | Shoot Everything! | MetalGarurumon | 0/0/0 | 0 | 22 |  |
| 17 | 98 | Rough Sea King | MetalSeadramon | 0/0/0 | 0 | 22 |  |
| 18 | 136 | Shooter | MetalGarurumon | 0/0/0 | 0 | 22 |  |
| 19 | 112 | Permafrost | Vikemon | 0/0/0 | 0 | 13 |  |
| 20 | 87 | Yellow Submarine | Submarimon | 0/0/0 | 0 | 11 |  |
| 21 | 75 | Swirling Light | Tylomon | 0/0/0 | 0 | 10 |  |
| 22 | 22 | Bad Luck Wind | Quetzalmon | 0/0/0 | 0 | 9 |  |
| 23 | 102 | 4 Strong Monsters | Piedmon | 0/0/0 | 0 | 6 |  |
| 24 | 110 | Invincible Emperor | Imperialdramon | 0/0/0 | 0 | 6 |  |
| 25 | 141 | Pick Up | Betamon | 0/0/0 | 0 | 2 | Skip: missing R/C level |

### Dragomon

Roster donors: Betamon (63) / Gesomon (51) / Zudomon (40).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 91 | First Aid | Joe | 4/0/2 | 4 | 27 | Chosen |
| 2 | 12 | Guarding Sea | Whamon | 3/0/1 | 3 | 22 |  |
| 3 | 13 | Fightback | Garurumon | 0/0/2 | 0 | 22 |  |
| 4 | 138 | Fightback | Garurumon | 0/0/2 | 0 | 22 |  |
| 5 | 41 | Anti-Fire | Ikkakumon | 0/0/2 | 0 | 21 |  |
| 6 | 90 | Armed | Zudomon | 0/0/4 | 0 | 19 |  |
| 7 | 134 | Armed | Zudomon | 0/0/4 | 0 | 19 |  |
| 8 | 3 | New Power | Babamon | 0/0/1 | 0 | 6 |  |

### Taomon

Roster donors: Gatomon (184) / Unimon (88) / Angewomon (77).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 74 | Divine Monster | Nefertimon | 1/3/2 | 4 | 20 | Chosen |
| 2 | 95 | Shining Goddess | Angewomon | 1/2/4 | 3 | 20 |  |
| 3 | 26 | Evil Slayer | Angemon | 0/2/2 | 2 | 21 |  |
| 4 | 30 | Wings of Hope | T.K. | 0/2/1 | 2 | 20 |  |
| 5 | 34 | Ladies' Night | Kari | 1/0/2 | 1 | 19 |  |

### Rapidmon

Roster donors: Patamon (183) / Leomon (85) / MagnaAngemon (75).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 73 | Call of Destiny | Gatomon | 0/3/2 | 3 | 17 | Chosen |
| 2 | 72 | Great Hope | Pegasusmon | 1/0/2 | 1 | 21 |  |
| 3 | 94 | Divine Sword | MagnaAngemon | 1/0/3 | 1 | 21 |  |
| 4 | 106 | Heaven's Gate | Seraphimon | 1/0/1 | 1 | 21 |  |
| 5 | 30 | Wings of Hope | T.K. | 1/0/2 | 1 | 20 |  |
| 6 | 71 | Twin Meteor | Baronmon | 1/0/2 | 1 | 11 |  |
| 7 | 26 | Evil Slayer | Angemon | 0/0/1 | 0 | 21 |  |
| 8 | 89 | Bonding | Matt | 0/0/1 | 0 | 8 |  |

### Lilamon

Roster donors: Palmon (98) / Togemon (84) / Lillymon (78).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 85 | Flower Fairies | Lillymon | 4/4/4 | 8 | 30 | Chosen |
| 2 | 132 | Flower Fairies | Lillymon | 4/4/4 | 8 | 30 |  |
| 3 | 39 | Spiky | Togemon | 4/4/2 | 8 | 20 |  |
| 4 | 34 | Ladies' Night | Kari | 4/3/1 | 7 | 19 |  |
| 5 | 86 | Princess | Mimi | 4/3/4 | 7 | 11 |  |
| 6 | 7 | Quick Digivolve | Vegiemon | 4/2/2 | 6 | 30 |  |
| 7 | 3 | New Power | Babamon | 0/0/1 | 0 | 6 |  |

### MetalTyrannomon

Roster donors: Tsukaimon (135) / Bakemon (123) / MasterTyrannomon (8).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 6 | Go Go Dinosaur | Veemon | 0/0/1 | 0 | 0 | Chosen |
| 2 | 25 | Paleo-Energy | Tyrannomon | 0/0/3 | 0 | 0 |  |

### Cyberdramon

Roster donors: Veemon (175) / Darkrizamon (130) / Andromon (116).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 100 | Machine Empire | Machinedramon | 0/0/1 | 0 | 13 | Chosen |

### Matadormon

Roster donors: DemiDevimon (132) / Gururumon (126) / Myotismon (111).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 36 | Dark Digivolution | DemiDevimon | 4/0/2 | 4 | 26 | Skip: missing R/C level |
| 2 | 52 | Dark Revival | Myotismon | 4/0/4 | 4 | 21 | Chosen |
| 3 | 69 | Dark Prince | Myotismon | 3/0/4 | 3 | 21 |  |
| 4 | 21 | Evil Fire Revived | Shadramon | 0/0/2 | 0 | 14 |  |

### Wingdramon

Roster donors: ClearAgumon (168) / Rockmon (159) / Gigadramon (5).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 38 | Mega Giga | Gigadramon | 0/0/2 | 0 | 0 | Chosen |
| 2 | 115 | Black Fire Heart | BK WarGreymon | 0/0/1 | 0 | 0 |  |

### GrapLeomon

Roster donors: Psychemon (170) / Ankylomon (151) / Etemon (150).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 51 | Steel Gate | MetalEtemon | 3/0/2 | 3 | 20 | Chosen |

### Chirinmon

Roster donors: Vi-Elecmon (169) / ShimaUnimon (162) / MetalGarurumon (37).

| Rank | ID | Base deck | Owner | R/C/U | R+C | Spec | Decision |
|---:|---:|---|---|---|---:|---:|---|
| 1 | 51 | Steel Gate | MetalEtemon | 3/2/0 | 5 | 20 | Chosen |
| 2 | 65 | Star Force | SuperStarmon | 4/0/0 | 4 | 24 |  |
| 3 | 105 | Ancient Legend | Shakkoumon | 3/0/0 | 3 | 21 |  |
| 4 | 119 | Who Are You? | Nanimon | 3/0/0 | 3 | 20 |  |
| 5 | 128 | Who Are You? | Nanimon | 3/0/0 | 3 | 20 |  |
| 6 | 129 | Who Are You? | Nanimon | 3/0/0 | 3 | 20 |  |
| 7 | 130 | Who Are You? | Nanimon | 3/0/0 | 3 | 20 |  |
| 8 | 131 | Who Are You? | Nanimon | 3/0/0 | 3 | 20 |  |
| 9 | 15 | Toy Party | Hagurumon | 2/0/0 | 2 | 21 |  |
| 10 | 61 | Rock Head | Ankylomon | 2/0/0 | 2 | 21 |  |
| 11 | 63 | Blitzkrieg | Thundermon | 2/0/0 | 2 | 19 |  |
| 12 | 62 | Mountain CrusherDX | Digmon | 2/0/0 | 2 | 16 |  |
| 13 | 99 | Toy Castle | Puppetmon | 0/0/0 | 0 | 23 |  |
| 14 | 29 | Ready To Go | Cody | 0/0/0 | 0 | 20 |  |
| 15 | 64 | Bean Stalk | MetalMamemon | 0/0/0 | 0 | 18 |  |
| 16 | 102 | 4 Strong Monsters | Piedmon | 0/0/0 | 0 | 10 |  |
| 17 | 87 | Yellow Submarine | Submarimon | 0/0/0 | 0 | 8 |  |
| 18 | 112 | Permafrost | Vikemon | 0/0/0 | 0 | 7 |  |
| 19 | 141 | Pick Up | Betamon | 0/0/0 | 0 | 2 | Skip: missing R/C level |

## Verification and provenance

- Source: `web/js/data/cards.js` at `time-stranger` commit `a2e69da`; all disc IDs 0–158 were searched, excluding Black Fire Again (custom #159).
- The original 301 cards, original 159 decks, preexisting custom records and full pre-Phase-3 arrays are frozen as SHA-256 hashes of `JSON.stringify(records)` in the planning JSON.
- Each exchange source exists in its chosen base, is a Digimon of the target level, and maps to the roster group in first/second/third Specialty order.
- Applying the replacements to the ordered source arrays gives fifteen 30-card decks, each with maximum duplicate count ≤4, with all Options unchanged. All fifteen names are unique against the existing 160 decks and against one another, and have ≤18 characters including spaces.
- These are original project decks using TS-106 designs. Selection and structural validation do not establish equal competitive strength; the Phase 3 simulations and browser checks belong to the build tickets.
