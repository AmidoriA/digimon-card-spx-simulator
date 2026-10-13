# TS-105: Rare cards (338-346)

| | |
|---|---|
| Trello | https://trello.com/c/ZhfaqmM9 |
| Phase | 1 Cards |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-001, TS-002, TS-003, TS-101 |

## Goal

Add the nine Rare cards of [roster.md](roster.md) as custom cards with placeholder models (their base recoloured), playable in every mode. The table below matches the roster verified in TS-001; roster.md remains authoritative if later local-game verification changes it.

| Id | Lv | Card | Base | Model | Battle block |
|---|---|---|---|---|---|
| 338 | R | Dracomon | ClearAgumon (168) | 437 | none |
| 339 | R | Bearmon | Psychemon (170) | 438 | none |
| 340 | R | Kudamon | Vi-Elecmon (169) | 439 | none |
| 341 | C | Coredramon (Blue) | Rockmon (159) | 440 | none |
| 342 | C | Grizzlymon | Ankylomon (151) | 441 | none |
| 343 | C | Reppamon | ShimaUnimon (162) | 442 | none |
| 344 | U | Wingdramon | Gigadramon (5) ✱ | 443 | offset 50000 |
| 345 | U | GrapLeomon | Etemon (150) | 444 | none |
| 346 | U | Chirinmon | MetalGarurumon (37) ✱ | 445 | offset 60000 |

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

- [x] `custom.load()` passes: ids 338-346, models 437-445 in sequence.
- [x] Every card's numbers, ✕ effect and support equal its base's (selftest).
- [x] `git status` shows only these cards' files, `cards.js`, `scripts.json.gz` (if a ✱ base), tests, README and docs.
- [x] `node tools/selftest.js`, `decktest.js`, `sim.js`, `fxtest.js`, `battletest.js` and `python tools/check_paths.py` pass.
- [x] Seen in the browser: deck editor (both card art styles), on the board, each attack in `battle-preview.html` next to its base; the report says what was seen.
- [x] README "Time Stranger cards" rows and "Not from the game code" entry.
- [x] One commit, `TS-105: …`, pushed.

## Out of scope

- Time Stranger models (Phase 2).
- Decks (Phase 3).
- Tuning numbers.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-14 — Phase 1 complete

- Added nine cards with sequential ids/models, exact base numbers/support/cross effects,
  three sourced labels and recoloured disc placeholder palettes. See attack-sources.md.
- Owner update: both art modes use the same prepared native TS-002 picture, with identical
  160px thumbnails. No separate Legacy recolour or ComfyUI restart was needed.
- All six required checks passed: selftest (30), decktest (11), 200 simulations without
  timeouts, all 31 effect scripts, battletest (every card's three attacks × three styles),
  and check_paths after staging new generated files.
- Browser: all nine found in the actual deck editor in both art styles; adding a card
  shows the three labels/powers and support. Each entered/rendered on the actual board
  using manually prepared hands. All 27 new attacks and 27 base attacks completed in
  the actual battle-preview page, Stage 1, Original PS1; frame-120 pairs were inspected.
  Enhanced/Ultra were exercised by battletest; those styles were not visually compared
  for every card. Local screenshots/report: extracted/newart/ts-phase1-browser/g4-*.
- Integrated into the time-stranger feature branch as this ticket's commit; no main merge.

- Final palette review changed Bearmon’s inherited pink body patches to muted brown.
  Its three new/base attack pairs were inspected again; all six completed.
  The final battletest passed 237 Digimon, 711 attacks in each of three styles.
