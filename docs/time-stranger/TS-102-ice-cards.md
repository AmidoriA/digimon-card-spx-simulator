# TS-102: Ice cards (311-319)

| | |
|---|---|
| Trello | https://trello.com/c/Qdbd1HXO |
| Phase | 1 Cards |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-001, TS-002, TS-003, TS-101 |

## Goal

Add the nine Ice cards of [roster.md](roster.md) as custom cards with placeholder models (their base recoloured), playable in every mode. The table below matches the roster verified in TS-001; roster.md remains authoritative if later local-game verification changes it.

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
| 319 | U | Dragomon | Zudomon (40) | 418 | none |

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

- [x] `custom.load()` passes: ids 311-319, models 410-418 in sequence.
- [x] Initial donor-stat implementation passed (historical); superseded by TS-106 original stat/effect design.
- [x] `git status` shows only these cards' files, `cards.js`, `scripts.json.gz` (if a ✱ base), tests, README and docs.
- [x] `node tools/selftest.js`, `decktest.js`, `sim.js`, `fxtest.js`, `battletest.js` and `python tools/check_paths.py` pass.
- [x] Seen in the browser: deck editor (both card art styles), on the board, each attack in `battle-preview.html` next to its base; the report says what was seen.
- [x] README "Time Stranger cards" rows and "Not from the game code" entry.
- [x] One commit, `TS-102: …`, pushed.

## Out of scope

- Time Stranger models (Phase 2).
- Decks (Phase 3).
- Further tuning is tracked by [TS-106](TS-106-original-stats-and-effects.md).

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-13 — Phase 1 complete

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
  for every card. Local screenshots/report: extracted/newart/ts-phase1-browser/g1-*.
- Integrated into the time-stranger feature branch as this ticket's commit; no main merge.

- Shared-art level badge: native prepared pictures contain no DDCB letter. The generated
  `sharedArt` flag keeps the R/C/U overlay visible in Legacy as well as New, including
  when switching art mid-match. Original Legacy pictures keep their existing behavior.

### 2026-10-14 — owner gameplay update

Original stats, cross effects and support effects are now designed for this ticket's
nine Digimon under TS-106. The unchanged-base-stat notes above describe the initial
implementation. [Current design and lore](card-design.md) supersedes them; visual assets
and motion/script donors still follow this ticket. Acceptance and validation for the
redesign are tracked separately in TS-106 and Trello.
