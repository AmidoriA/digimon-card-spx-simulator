# TS-208e: Rare models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/7IcLCqJO |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-105 |

## Goal

Convert the nine Rare Digimon to their model numbers: Dracomon (437), Bearmon (438), Kudamon (439), Coredramon (Blue) (440), Grizzlymon (441), Reppamon (442), Wingdramon (443), GrapLeomon (444), Chirinmon (445).

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
- [ ] One commit, `TS-208e: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
