# TS-208c: Nature models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/Clemd8tm |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-209, TS-103 |

## Goal

Convert the nine Nature Digimon to their model numbers: Renamon (419), Terriermon (420), Lalamon (421), Kyubimon (422), Gargomon (423), Sunflowmon (424), Taomon (425), Rapidmon (426), Lilamon (427).

## Context

- **The skill `import-ts-model`** (`.claude/skills/import-ts-model/SKILL.md`, TS-209) is the
  whole procedure. Read it first and follow it for each Digimon; the steps below only name
  its steps.
- Guilmon (card 302, model 401) is the worked example: [TS-207](TS-207-pilot-guilmon.md).
- [roster.md](roster.md): each card's base and Time Stranger model.
  [motion-slots.md](motion-slots.md): the body parts each base's scripts name.

## Steps

For each of the nine Digimon, one after the other, the steps of the skill `import-ts-model`:

1. **Look up** (skill, step 1): its roster row, its base's model number, the parts the
   base's scripts name, and the base's own Time Stranger model if it has one.
2. **Convert once to look, and choose** (steps 2 and 3): into a scratch directory with
   `--preview --show` and `--poses`; then the part numbers, the size (`against`, `size` or
   the base's height) and the motions. The figures stay Angewomon's.
3. **Write the entry and build** (step 4): the card's `model` names `ts` and loses its
   `recolour` (and the recolour's rules, if nothing else uses them);
   `build_custom.py … model <card>`.
4. **Check** (step 5): `battletest.js`, then the sheets of its three attacks, damage, KO
   and victory next to its base in the three styles. Fix what is off and build again.
5. **Write it down** (step 6): README, roster.md Phase 2 status, the log below, and the
   Digimon's tick on this ticket's Trello checklist.

Then once for the group: the five checks of CLAUDE.md and `battletest.js`, and the commit.

Where the skill is wrong or lacks something, correct the skill in the same commit and say
so in the log.

## Acceptance criteria

- [ ] Nine models written by `build_custom.py` from their card entries: each `model` names `ts`, none of these cards has a `model.recolour` left; card entries otherwise unchanged.
- [ ] The log has, for each Digimon: its entry, the figures the tool printed, its part numbers, its size rule (with the `against` ratio or the `size` chosen), any motion that was replaced, its sheets, and what is not right.
- [ ] All checks of CLAUDE.md and `battletest.js` pass.
- [ ] Browser check reported as the skill's step 5 asks: every sheet read, `sameTimeline`, no page errors.
- [ ] README ("Not from the game code") and roster.md updated; the Digimon ticked on Trello.
- [ ] One commit, `TS-208c: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
