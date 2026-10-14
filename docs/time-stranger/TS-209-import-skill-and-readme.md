# TS-209: Skill `import-ts-model` and the README

| | |
|---|---|
| Trello | https://trello.com/c/Q68gsJGz |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207 |

## Goal

Leave the Time Stranger model work repeatable and say plainly what is not from the DDCB disc.

## Context

- What TS-201 … TS-207 found and logged.

## Steps

1. Write `.claude/skills/import-ts-model/SKILL.md` from what was actually done: commands, format notes, the conversion rules, the traps met.
2. README "Not from the game code": the models come from Time Stranger, and how they were reduced (bone merge, decimation, palette, retiming, camera and sound borrowed from the base).

## Acceptance criteria

- [ ] A new agent can convert one more Digimon by following the skill alone. (Not shown yet: its author ran every command of it, on Guilmon and on Coronamon; TS-208a is the first use by someone else.)
- [x] README updated.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-14

**The skill** is `.claude/skills/import-ts-model/SKILL.md`, written from TS-207: what to
look up for a card, a first conversion to look at, the four things the tool cannot choose
(part numbers, size, motions, figures), the card's entry and the build, the checks, the
pictures, what to write down, what is known to be not right, and the traps. `CLAUDE.md`
and the `create-card` skill point to it. The TS-208 tickets are written to follow it.

**Tried on a second Digimon**, Coronamon (`chr136`) on Goburimon's model 80, into a
scratch directory (nothing of it is committed; the card is TS-208a's). Two things came of
it and are in the tool and the skill:

- Goburimon's second attack names part 6, its free hand. To see what a part number is,
  `ts_model.py --preview` takes `--show N,N` and paints those parts in plain colours in
  the base and in the new model. Coronamon's part 6 was a foot until `--part 6=J_hand_r`.
- Sized against its base as in Time Stranger (TS-207's rule for Guilmon), Coronamon comes
  out 0.32 times Goburimon's height: 94 high against 296. The two games do not size their
  Digimon alike. So `--against` is for where it fits, the base's height stays the rule
  without it, and `--size K` (the card's `size`) is there for a number chosen by eye.

Coronamon has 89 bones with vertices and 10,618 triangles; it came down to 30 parts and
976 triangles, 93 texture pieces at 0.157 of their size, in 14 seconds.

**Tools for looking**, made from what TS-207 used: `tools/sheet_server.py` (the site
without caching, and it keeps the pictures the page posts) and `tools/model_sheet.js`
(`modelSheet(...)` steps a scene and draws a sheet of frames for each card in each style,
with the frames at which the model's motions start and end). `.claude/launch.json` has the
server as `model-sheets` on port 8766; its pictures go to `sheets/`, which git ignores.
Run against Guilmon and Agumon after they were moved into `tools/`: sheets saved, no page
errors, the same timeline for both.

**README:** "Time Stranger models as DDCB models" has the size rules as they are now and
"Looking at a converted model"; "Not from the game code" says in short what a converted
model is made of (bones merged, triangles thinned, texture laid out again in palette rows,
motions on the base's keys, camera and sound the base's).

**Checks** after the tool changes: Guilmon's three files build to the same bytes as in
TS-207; the checks of `CLAUDE.md` and `battletest.js` pass.
