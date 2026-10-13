# TS-208d: Darkness models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/EzPc1GY6 |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-104 |

## Goal

Convert the nine Darkness Digimon to their model numbers: Agumon (Black) (428), Monodramon (429), Dracmon (430), Kurisarimon (431), Strikedramon (432), Sangloupmon (433), MetalTyrannomon (434), Cyberdramon (435), Matadormon (436).

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
- [ ] One commit, `TS-208d: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
