# TS-208a: Fire models from Time Stranger

| | |
|---|---|
| Status | todo |
| Phase | 2 Models |
| Depends on | TS-207, TS-101 |

## Goal

Convert the nine Fire Digimon to their model numbers: Guilmon (401), Coronamon (402), Hackmon (403), Growlmon (404), Firamon (405), BaoHackmon (406), WarGrowlmon (407), Flaremon (408), SaviorHackmon (409).

## Context

- `tools/ts_model.py` as settled in TS-207.
- [roster.md](roster.md).

## Steps

1. Convert each model with the TS-207 settings; drop its `model.recolour`.
2. Look at each in `battle-preview.html` (three styles) and fix what is off.
3. Run the checks; update roster.md Phase 2 status.

## Acceptance criteria

- [ ] Nine models written; card entries otherwise unchanged.
- [ ] All checks of CLAUDE.md and `battletest.js` pass.
- [ ] Browser check reported.
- [ ] One commit, `TS-208a: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
