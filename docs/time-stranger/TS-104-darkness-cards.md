# TS-104: Darkness cards (329-337)

| | |
|---|---|
| Trello | https://trello.com/c/v00WU7tG |
| Phase | 1 Cards |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-001, TS-002, TS-003, TS-101 |

## Goal

Add the nine Darkness cards of [roster.md](roster.md) as custom cards with placeholder models (their base recoloured), playable in every mode. The table below matches the roster verified in TS-001; roster.md remains authoritative if later local-game verification changes it.

| Id | Lv | Card | Base | Model | Battle block |
|---|---|---|---|---|---|
| 329 | R | Agumon (Black) | Agumon (27) ✱ | 428 | offset 20000 |
| 330 | R | Monodramon | Veemon (175) ✱ | 429 | offset 30000 |
| 331 | R | Dracmon | DemiDevimon (132) | 430 | none |
| 332 | C | Kurisarimon | Bakemon (123) | 431 | none |
| 333 | C | Strikedramon | Darkrizamon (130) | 432 | none |
| 334 | C | Sangloupmon | Gururumon (126) | 433 | none |
| 335 | U | MetalTyrannomon | MasterTyrannomon (8) ✱ | 434 | offset 40000 |
| 336 | U | Cyberdramon | Andromon (116) | 435 | none |
| 337 | U | Matadormon | Myotismon (111) | 436 | none |

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

- [ ] `custom.load()` passes: ids 329-337, models 428-436 in sequence.
- [ ] Every card's numbers, ✕ effect and support equal its base's (selftest).
- [ ] `git status` shows only these cards' files, `cards.js`, `scripts.json.gz` (if a ✱ base), tests, README and docs.
- [ ] `node tools/selftest.js`, `decktest.js`, `sim.js`, `fxtest.js`, `battletest.js` and `python tools/check_paths.py` pass.
- [ ] Seen in the browser: deck editor (both card art styles), on the board, each attack in `battle-preview.html` next to its base; the report says what was seen.
- [ ] README "Time Stranger cards" rows and "Not from the game code" entry.
- [ ] One commit, `TS-104: …`, pushed.

## Out of scope

- Time Stranger models (Phase 2).
- Decks (Phase 3).
- Tuning numbers.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
