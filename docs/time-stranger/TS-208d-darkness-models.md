# TS-208d: Darkness models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/EzPc1GY6 |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-104 |

## Goal

Convert eight of the nine Darkness Digimon to their model numbers: Monodramon (429), Dracmon (430), Kurisarimon (431), Strikedramon (432), Sangloupmon (433), MetalTyrannomon (434), Cyberdramon (435), Matadormon (436).

## Context

- Agumon (Black) (428) is not converted: it is not in the owner's Time Stranger build (TS-203) and keeps the disc's Agumon with its texture recoloured (see Decisions).
- `tools/ts_model.py` as settled in TS-207.
- [roster.md](roster.md).

## Steps

1. Convert each of the eight models with the TS-207 settings; drop its `model.recolour`. Leave 428 and its `model.recolour` as they are.
2. Look at each in `battle-preview.html` (three styles) and fix what is off.
3. Run the checks; update roster.md Phase 2 status.

## Acceptance criteria

- [ ] Eight models written (429-436); 428 keeps its recoloured Agumon; card entries otherwise unchanged.
- [ ] All checks of CLAUDE.md and `battletest.js` pass.
- [ ] Browser check reported.
- [ ] One commit, `TS-208d: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Decisions

- 2026-10-13, the owner: Agumon (Black) uses the PS1 game's Agumon with its texture recoloured, not a Time Stranger model.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
