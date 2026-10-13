# TS-206: Converter: motions

| | |
|---|---|
| Trello | https://trello.com/c/tzzuM8kp |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-203, TS-204, TS-205 |

## Goal

Give the converted model the eight motions the battle scripts call, taken from its Time Stranger animations, timed so every script still lines up.

## Context

- TS-203: which Time Stranger animation plays each role.
- TS-204: the slot table (README, "Polygon Battle") and each base's slot lengths, key times, loop key, sounds and script timelines: `motion-slots.json`, written by `tools/motion_slots.py` (layout in its docstring), with the bases as a table in [motion-slots.md](motion-slots.md). A motion lasts 2 × d0 + Σ 2 × d frames; the first 2 × d0 are the blend into key 0.
- Motion key layout in `tools/build_models.py`.

## Steps

1. For each slot, sample the chosen Time Stranger animation through the merged-bone tree into keys of per-part rotation, move and scale.
2. Retime it to the base's slot length; place keys where the base has them.
3. Copy the camera record and the sound field of every key from the base's motion at the same time; Time Stranger has neither.
4. A slot without a Time Stranger counterpart uses the nearest role; log it.

## Acceptance criteria

- [ ] Guilmon's three attacks, damage, KO and victory play in `battle-preview.html` next to Agumon's, hits and camera at the same moments (frames in the log).
- [ ] `node tools/battletest.js` and `node tools/sim.js` pass.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
