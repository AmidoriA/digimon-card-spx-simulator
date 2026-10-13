# TS-102: Ice cards (311-319)

| | |
|---|---|
| Trello | https://trello.com/c/Qdbd1HXO |
| Phase | 1 Cards |
| Depends on | TS-001, TS-002, TS-003, TS-101 |

## Goal

Add the nine Ice cards of [roster.md](roster.md) as custom cards with placeholder models (their base recoloured), playable in every mode. The roster as confirmed in TS-001 wins over the table below.

| Id | Lv | Card | Base | Model | Battle block |
|---|---|---|---|---|---|
| 311 | R | Gaomon | Gabumon (62) | 410 | none |
| 312 | R | Lunamon | Penguinmon (64) | 411 | none |
| 313 | R | Syakomon | Betamon (63) | 412 | none |
| 314 | C | Gaogamon | Garurumon (46) | 413 | none |
| 315 | C | Lekismon | Sorcerimon (57) | 414 | none |
| 316 | C | Octomon | Gesomon (51) | 415 | none |
| 317 | U | MachGaogamon | WereGarurumon (39) | 416 | none |
| 318 | U | Crescemon | Panjyamon (41) | 417 | none |
| 319 | U | MarineDevimon | WaruSeadramon (43) | 418 | none |

## Context

- [phase1.md](phase1.md): the rules every Phase 1 ticket follows (numbers, names, model, battle, art, tests, README).
- `.claude/skills/create-card/SKILL.md`: the procedure, worked on BlackWarGreymon.
- `tools/custom_cards.json`, `tools/custom.py`, `tools/build_custom.py`.

## Steps

1. Write the nine entries in `tools/custom_cards.json` as phase1.md says.
2. Write the model recolours (and the battle recolours for ✱ bases); look with `custom_look.py` until the colours read as the Digimon.
3. `tools/.venv/Scripts/python tools/build_custom.py extracted web` (or limited to these card numbers).
4. Extend the Time Stranger selftest's list and the `decktest.js` count.
5. Run the checks and look in the browser (phase1.md).
6. README rows; roster.md Phase 1 status; board status.

## Acceptance criteria

- [ ] `custom.load()` passes: ids 311-319, models 410-418 in sequence.
- [ ] Every card's numbers, ✕ effect and support equal its base's (selftest).
- [ ] `git status` shows only these cards' files, `cards.js`, `scripts.json.gz` (if a ✱ base), tests, README and docs.
- [ ] `node tools/selftest.js`, `decktest.js`, `sim.js`, `fxtest.js`, `battletest.js` and `python tools/check_paths.py` pass.
- [ ] Seen in the browser: deck editor (both card art styles), on the board, each attack in `battle-preview.html` next to its base; the report says what was seen.
- [ ] README "Time Stranger cards" rows and "Not from the game code" entry.
- [ ] One commit, `TS-102: …`, pushed.

## Out of scope

- Time Stranger models (Phase 2).
- Decks (Phase 3).
- Tuning numbers.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
