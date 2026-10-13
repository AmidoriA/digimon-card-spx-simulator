# TS-101: Fire cards (302-310)

| | |
|---|---|
| Trello | https://trello.com/c/Xk0ypoEh |
| Phase | 1 Cards |
| Depends on | TS-001, TS-002, TS-003 |

## Goal

Add the nine Fire cards of [roster.md](roster.md) as custom cards with placeholder models (their base recoloured), playable in every mode. The roster as confirmed in TS-001 wins over the table below.

| Id | Lv | Card | Base | Model | Battle block |
|---|---|---|---|---|---|
| 302 | R | Guilmon | Agumon (27) | 401 | none |
| 303 | R | Coronamon | Goburimon (33) | 402 | none |
| 304 | R | Hackmon | Veemon (175) | 403 | none |
| 305 | C | Growlmon | Greymon (14) | 404 | none |
| 306 | C | Firamon | Centarumon (19) | 405 | none |
| 307 | C | BaoHackmon | Flarerizamon (26) | 406 | none |
| 308 | U | WarGrowlmon | MetalGreymon (9) | 407 | none |
| 309 | U | Flaremon | Garudamon (7) | 408 | none |
| 310 | U | SaviorHackmon | Paildramon (4) | 409 | none |

## Context

- [phase1.md](phase1.md): the rules every Phase 1 ticket follows (numbers, names, model, battle, art, tests, README).
- `.claude/skills/create-card/SKILL.md`: the procedure, worked on BlackWarGreymon.
- `tools/custom_cards.json`, `tools/custom.py`, `tools/build_custom.py`.

## Steps

1. Write the nine entries in `tools/custom_cards.json` as phase1.md says.
2. Write the model recolours (and the battle recolours for ✱ bases); look with `custom_look.py` until the colours read as the Digimon.
3. `tools/.venv/Scripts/python tools/build_custom.py extracted web` (or limited to these card numbers).
4. Add the Time Stranger selftest (phase1.md) and the `decktest.js` count.
5. Run the checks and look in the browser (phase1.md).
6. README rows; roster.md Phase 1 status; board status.

## Acceptance criteria

- [ ] `custom.load()` passes: ids 302-310, models 401-409 in sequence.
- [ ] Every card's numbers, ✕ effect and support equal its base's (selftest).
- [ ] `git status` shows only these cards' files, `cards.js`, `scripts.json.gz` (if a ✱ base), tests, README and docs.
- [ ] `node tools/selftest.js`, `decktest.js`, `sim.js`, `fxtest.js`, `battletest.js` and `python tools/check_paths.py` pass.
- [ ] Seen in the browser: deck editor (both card art styles), on the board, each attack in `battle-preview.html` next to its base; the report says what was seen.
- [ ] README "Time Stranger cards" rows and "Not from the game code" entry.
- [ ] One commit, `TS-101: …`, pushed.

## Out of scope

- Time Stranger models (Phase 2).
- Decks (Phase 3).
- Tuning numbers.

## Questions for the owner

- Attack names that the Reference Book gives fewer than three of: which to use for the third (ask once, for all cards).

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
