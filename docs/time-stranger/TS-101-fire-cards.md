# TS-101: Fire cards (302-310)

| | |
|---|---|
| Trello | https://trello.com/c/Xk0ypoEh |
| Phase | 1 Cards |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-001, TS-002, TS-003 |

## Goal

Add the nine Fire cards of [roster.md](roster.md) as custom cards with placeholder models (their base recoloured), playable in every mode. The table below matches the roster verified in TS-001; roster.md remains authoritative if later local-game verification changes it.

| Id | Lv | Card | Base | Model | Battle block |
|---|---|---|---|---|---|
| 302 | R | Guilmon | Agumon (27) | 401 | none |
| 303 | R | Coronamon | Goburimon (33) | 402 | none |
| 304 | R | Huckmon | Veemon (175) | 403 | none |
| 305 | C | Growlmon | Greymon (14) | 404 | none |
| 306 | C | Firamon | Centarumon (19) | 405 | none |
| 307 | C | BaoHuckmon | Flarerizamon (26) | 406 | none |
| 308 | U | WarGrowlmon | MetalGreymon (9) | 407 | none |
| 309 | U | Flaremon | Garudamon (7) | 408 | none |
| 310 | U | SaviorHuckmon | Paildramon (4) | 409 | none |

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

- [x] `custom.load()` passes: ids 302-310, models 401-409 in sequence.
- [x] Initial donor-stat implementation passed (historical); superseded by TS-106 original stat/effect design.
- [x] `git status` shows only these cards' files, `cards.js`, `scripts.json.gz` (if a ✱ base), tests, README and docs.
- [x] `node tools/selftest.js`, `decktest.js`, `sim.js`, `fxtest.js`, `battletest.js` and `python tools/check_paths.py` pass.
- [x] Seen in the browser: deck editor (both card art styles), on the board, each attack in `battle-preview.html` next to its base; the report says what was seen.
- [x] README "Time Stranger cards" rows and "Not from the game code" entry.
- [x] One commit, `TS-101: …`, pushed.

## Out of scope

- Time Stranger models (Phase 2).
- Decks (Phase 3).
- Further tuning is tracked by [TS-106](TS-106-original-stats-and-effects.md).

## Questions for the owner

- Attack names that the Reference Book gives fewer than three of: which to use for the third (ask once, for all cards).

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
  for every card. Local screenshots/report: extracted/newart/ts-phase1-browser/g0-*.
- Integrated into the time-stranger feature branch as this ticket's commit; no main merge.

### 2026-10-14 — owner gameplay update

Original stats, cross effects and support effects are now designed for this ticket's
nine Digimon under TS-106. The unchanged-base-stat notes above describe the initial
implementation. [Current design and lore](card-design.md) supersedes them; visual assets
and motion/script donors still follow this ticket. Acceptance and validation for the
redesign are tracked separately in TS-106 and Trello.
