# TS-105: Rare cards (338-346)

| | |
|---|---|
| Trello | https://trello.com/c/ZhfaqmM9 |
| Phase | 1 Cards |
| Depends on | TS-001, TS-002, TS-003, TS-101 |

## Goal

Add the nine Rare cards of [roster.md](roster.md) as custom cards with placeholder models (their base recoloured), playable in every mode. The roster as confirmed in TS-001 wins over the table below.

| Id | Lv | Card | Base | Model | Battle block |
|---|---|---|---|---|---|
| 338 | R | Dracomon | ClearAgumon (168) | 437 | none |
| 339 | R | Bearmon | Psychemon (170) | 438 | none |
| 340 | R | Kudamon | Vi-Elecmon (169) | 439 | none |
| 341 | C | Coredramon | Rockmon (159) | 440 | none |
| 342 | C | Grizzlymon | Ankylomon (151) | 441 | none |
| 343 | C | Reppamon | ShimaUnimon (162) | 442 | none |
| 344 | U | Wingdramon | Gigadramon (5) ✱ | 443 | offset 60000 |
| 345 | U | GrapLeomon | Etemon (150) | 444 | none |
| 346 | U | Chirinmon | MetalGarurumon (37) ✱ | 445 | offset 70000 |

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
6. README rows; tick each Digimon on the Trello card's Digimon checklist.

## Acceptance criteria

- [ ] `custom.load()` passes: ids 338-346, models 437-445 in sequence.
- [ ] Every card's numbers, ✕ effect and support equal its base's (selftest).
- [ ] `git status` shows only these cards' files, `cards.js`, `scripts.json.gz` (if a ✱ base), tests, README and docs.
- [ ] `node tools/selftest.js`, `decktest.js`, `sim.js`, `fxtest.js`, `battletest.js` and `python tools/check_paths.py` pass.
- [ ] Seen in the browser: deck editor (both card art styles), on the board, each attack in `battle-preview.html` next to its base; the report says what was seen.
- [ ] README "Time Stranger cards" rows and "Not from the game code" entry.
- [ ] One commit, `TS-105: …`, pushed.

## Out of scope

- Time Stranger models (Phase 2).
- Decks (Phase 3).
- Tuning numbers.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
