# TS-001: Verify the roster against Time Stranger

| | |
|---|---|
| Status | todo |
| Phase | 0 Groundwork |
| Depends on | none |

## Goal

Make sure each of the 45 proposed Digimon is in *Digimon Story: Time Stranger*, is not on the DDCB disc, and sits in the Specialty its Time Stranger element calls for. The proposal in [roster.md](roster.md) was written from memory in a session that could not open the roster sites; nothing in it is confirmed yet.

## Context

- [roster.md](roster.md): the proposed roster, its alternates and the columns to fill.
- `web/js/data/cards.js`: the disc's 191 Digimon; a name already there is not allowed.
- Specialty rule (the project's choice, written in the README under "Not from the game code" in TS-101): Time Stranger element Fire → Fire; Water or Ice → Ice; Plant, Wind, Earth, Light or Electric → Nature; Dark → Darkness; Neutral, Steel or any other → Rare.
- The owner's install (`D:\Games\Steam\steamapps\common\Digimon Story Time Stranger`) is the final word if a site and the game disagree; once TS-201/TS-203 can read its tables, check the roster against them too.

## Steps

1. For each row, find a page that shows the Digimon in Time Stranger's field guide (field guide number, stage, attribute, element). Record the URL and the element in the row.
2. Check the stage: Rookie → R, Champion → C, Ultimate → U. (DDCB's U also holds Megas; this project uses Time Stranger Ultimates only, as the owner asked.)
3. Apply the Specialty rule. A Digimon whose element points to another Specialty moves there, and a slot left short is filled from the alternates; keep each line together where possible.
4. Check every name against `cards.js` (no Digimon of the disc, under its old or new name).
5. Each (Specialty, level) slot keeps three different bases; a replacement Digimon gets a base by body shape (same Specialty first; another Specialty is marked ✱ and needs a battle recolour in Phase 1).
6. Update roster.md and log every swap with its reason.

## Acceptance criteria

- [ ] 45 rows, 3 per (Specialty, level), each with a Time Stranger source URL and element.
- [ ] No name is on the DDCB disc.
- [ ] Each slot has three different bases; ✱ marks every cross-Specialty base.
- [ ] Swaps are logged here with the reason.

## Out of scope

- Stats, pictures and models (later tickets).

## Questions for the owner

- If a whole line is missing from Time Stranger, which alternate the owner prefers.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
