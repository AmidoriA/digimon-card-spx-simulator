# TS-103: Nature cards (320-328)

| | |
|---|---|
| Trello | https://trello.com/c/AKMIGtfK |
| Phase | 1 Cards |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-001, TS-002, TS-003, TS-101 |

## Goal

Add the nine Nature cards of [roster.md](roster.md) as custom cards with placeholder models (their base recoloured), playable in every mode. The table below matches the roster verified in TS-001; roster.md remains authoritative if later local-game verification changes it.

| Id | Lv | Card | Base | Model | Battle block |
|---|---|---|---|---|---|
| 320 | R | Renamon | Gatomon (184) | 419 | none |
| 321 | R | Terriermon | Patamon (183) | 420 | none |
| 322 | R | Lalamon | Palmon (98) | 421 | none |
| 323 | C | Kyubimon | Unimon (88) | 422 | none |
| 324 | C | Gargomon | Leomon (85) | 423 | none |
| 325 | C | Sunflowmon | Togemon (84) | 424 | none |
| 326 | U | Taomon | Angewomon (77) | 425 | none |
| 327 | U | Rapidmon | MagnaAngemon (75) | 426 | none |
| 328 | U | Lilamon | Lillymon (78) | 427 | none |

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

- [ ] `custom.load()` passes: ids 320-328, models 419-427 in sequence.
- [ ] Every card's numbers, ✕ effect and support equal its base's (selftest).
- [ ] `git status` shows only these cards' files, `cards.js`, `scripts.json.gz` (if a ✱ base), tests, README and docs.
- [ ] `node tools/selftest.js`, `decktest.js`, `sim.js`, `fxtest.js`, `battletest.js` and `python tools/check_paths.py` pass.
- [ ] Seen in the browser: deck editor (both card art styles), on the board, each attack in `battle-preview.html` next to its base; the report says what was seen.
- [ ] README "Time Stranger cards" rows and "Not from the game code" entry.
- [ ] One commit, `TS-103: …`, pushed.

## Out of scope

- Time Stranger models (Phase 2).
- Decks (Phase 3).
- Tuning numbers.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
