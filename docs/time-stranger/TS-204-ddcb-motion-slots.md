# TS-204: Read what DDCB's eight motion slots are

| | |
|---|---|
| Trello | https://trello.com/c/Nu4LssEP |
| Phase | 2 Models |
| Depends on | none |

## Goal

Know exactly what each of a DDCB model's eight motions is for and what the battle scripts expect of them, so a converted model can fill them.

## Context

- `web/js/battle3d.js`: `play`, `snap`, script command 2 (start a motion; damage 4 → KO 5), victory motion 6.
- `tools/build_models.py` docstring: motion keys are (duration, sound, (parts + 1) x (rot, show, move, scale, next)); the last record is the camera track.
- Skill `trace-game-code`; README "Polygon Battle".

## Steps

1. From the battle scripts and the code, list which slot each command starts and when (idle, attacks, guard, damage, KO, victory…). Note the addresses.
2. For the bases in roster.md, measure each slot's length and where the scripts wait on it.
3. Describe how the camera record and the sound field are used per key.

## Acceptance criteria

- [ ] A table slot 0-7 → meaning, started by, address, in README "Polygon Battle".
- [ ] Per base: slot lengths (frames) in a table the converter can read.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
