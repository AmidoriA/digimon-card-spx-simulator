# TS-203: Find each Digimon's model and animations

| | |
|---|---|
| Trello | https://trello.com/c/9HUw0jL2 |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-202 |

## Goal

For all 45 Digimon, know which file is its model and which of its animations are idle, attacks, damage, defeat and victory.

## Context

- [roster.md](roster.md) "TS model" column.
- TS-204 for what DDCB needs.

## Steps

1. Find the table that ties a Digimon id/name to its model and animation files; read it.
2. Read the animation format (tracks per bone, rotation encoding, key times, frame rate).
3. List Guilmon's animations with ids/names and lengths; find which is which from the game's own names or the battle code that plays them, not from looking at them.
4. Fill the TS model column for all 45.

## Acceptance criteria

- [ ] All 45 rows have their model file.
- [ ] Guilmon's animation list with the role of each, and where the role was read.
- [ ] README: the animation format and the table, with sources.

## Out of scope

- None.

## Questions for the owner

- 2026-10-13: Agumon (Black), card 329, has no row in the tables of Steam build 23514637
  and so no model here. Is it in a DLC or a later update that this install does not have,
  or should card 329 be another Digimon? Until then the first criterion stands at 44 of 45.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-13 — the models

**The tables.** `.mbe` files are `EXPA` tables with their strings in a `CHNK` block;
`tools/ts_mbe.py` reads them. The reader in the executable is `0x140dcf480` (magic checks
at `0x140dcf6cf` and `0x140dcf992`). The column types were worked out from the rows (README,
"Time Stranger tables"): 2, 3, 4 integers of 32, 16 and 8 bits, 5 float, 6/7/8 string, 9 one
bit, 10 no room. That fits 2,787 of the 2,788 tables of `app_0/data` (740 files); the one
left has a type 0 column.

**Name to model.** `text/char_name.mbe` (`app_text01`, English) gives the key of a name,
`char_GUILMON`; `data/char_info.mbe` gives the key's model in column 3, `chr090`. The
`patch` archive has a newer `char_info.mbe` (839 rows against 836); the 45 rows wanted are
the same in both.

44 of the 45 are found by their exact English name and are in [roster.md](roster.md).
Their keys are the Japanese names: Huckmon `char_HACKMON`, Growlmon `char_GROWMON`,
WarGrowlmon `char_MEGAGROWLMON`, Syakomon `char_SHAKOMON`, Octomon `char_OCTMON`, Dragomon
`char_DAGOMON`, Dracmon `char_DRACUMON`, Matadormon `char_MATADRMON`, Grizzlymon
`char_GRYZMON`, Chirinmon `char_TYILINMON`.

Each of the 44 was read with `tools/ts_model_read.py` and drawn (`--overlays`); they are
the Digimon their rows name:

![The 44 models found through the tables](img/ts-203-roster-models.png)

**Agumon (Black), card 329, is not in this build.** Neither `char_name.mbe` nor
`char_info.mbe` (of `app_0` and of `patch`) has a row for it: the names holding "agumon"
are Agumon, Agumon (Bond of Bravery), Pagumon, ToyAgumon (two rows) and Agumon & Gatomon.
The field guide the roster was checked against lists it as no. 468. See the question to
the owner.
