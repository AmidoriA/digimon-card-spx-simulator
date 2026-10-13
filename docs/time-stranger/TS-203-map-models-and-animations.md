# TS-203: Find each Digimon's model and animations

| | |
|---|---|
| Trello | https://trello.com/c/9HUw0jL2 |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-202 |

## Goal

For all 45 Digimon, know which file is its model and which of its animations are idle, attacks, damage, defeat and victory.

## Context

- [roster.md](roster.md) "TS model" column.
- TS-204 for what DDCB needs.

## Steps

1. Find the table that ties a Digimon id/name to its model and animation files; read it.
2. Read the animation format (tracks per bone, rotation encoding, key times, frame rate).
3. List Guilmon's animations with ids/names and lengths; find which is which from the game's own names or the battle code that plays them, not from looking at them.
4. Fill the TS model column for all 45.

## Acceptance criteria

- [ ] All 45 rows have their model file.
- [ ] Guilmon's animation list with the role of each, and where the role was read.
- [ ] README: the animation format and the table, with sources.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
