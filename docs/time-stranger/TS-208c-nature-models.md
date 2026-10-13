# TS-208c: Nature models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/Clemd8tm |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-103 |

## Goal

Convert the nine Nature Digimon to their model numbers: Renamon (419), Terriermon (420), Lalamon (421), Kyubimon (422), Gargomon (423), Sunflowmon (424), Taomon (425), Rapidmon (426), Lilamon (427).

## Context

- `tools/ts_model.py` as settled in TS-207.
- [roster.md](roster.md).

## Steps

1. Convert each model with the TS-207 settings; drop its `model.recolour`.
2. Look at each in `battle-preview.html` (three styles) and fix what is off.
3. Run the checks; tick each Digimon on the Trello card's Digimon checklist.

## Acceptance criteria

- [ ] Nine models written; card entries otherwise unchanged.
- [ ] All checks of CLAUDE.md and `battletest.js` pass.
- [ ] Browser check reported.
- [ ] One commit, `TS-208c: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
