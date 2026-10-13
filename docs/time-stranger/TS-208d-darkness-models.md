# TS-208d: Darkness models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/EzPc1GY6 |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-104 |

## Goal

Convert all nine Darkness Digimon to their model numbers: Keramon (428), Monodramon (429), Dracmon (430), Kurisarimon (431), Strikedramon (432), Sangloupmon (433), MetalTyrannomon (434), Cyberdramon (435), Matadormon (436).

## Context

- Keramon (428) uses local chr626 (`char_KERAMON`), verified in both model tables.
  The old black Agumon placeholder exception is superseded.
- `tools/ts_model.py` as settled in TS-207.
- [roster.md](roster.md).

## Steps

1. Convert each of the nine models with the TS-207 settings; drop its `model.recolour`, including Keramon/428.
2. Look at each in `battle-preview.html` (three styles) and fix what is off.
3. Run the checks; update roster.md Phase 2 status.

## Acceptance criteria

- [ ] Nine models written (428-436), including Keramon from chr626; card entries otherwise unchanged.
- [ ] All checks of CLAUDE.md and `battletest.js` pass.
- [ ] Browser check reported.
- [ ] One commit, `TS-208d: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Decisions

- 2026-10-13, owner correction: Keramon replaces the Fire black Agumon variant.
  Its model chr626 is available locally, so 428 is converted with the other eight.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-13 — owner correction: Keramon replaces Agumon (Black)

Current slot 329 is Keramon, Darkness/R, base Tsukaimon (135), placeholder model 428.
All its numbers/effects are copied from Tsukaimon. Local char_KERAMON → chr626 is
present in both model tables; Phase 2 converts all nine Darkness models. The old
black Agumon exception is superseded. Official EX1-044 crop [80,105,320] needs no
restoration and is shared by both art modes. Offset 20000 is retired; the four other
published offsets remain stable. [Full evidence and current roster](roster.md).
