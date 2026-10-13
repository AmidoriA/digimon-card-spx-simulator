# TS-204: Read what DDCB's eight motion slots are

| | |
|---|---|
| Trello | https://trello.com/c/Nu4LssEP |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
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

- [x] A table slot 0-7 → meaning, started by, address, in README "Polygon Battle".
- [x] Per base: slot lengths (frames) in a table the converter can read.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-13

**The slots** are in the README, "Polygon Battle" ("The eight motion slots" and the three
paragraphs after it), with the address of every start. In short:

| Slot | What | Started by |
|---|---|---|
| 0 | Standing | the director (`0x801ee00c`, `0x801ee86c`, `0x801ee9ec`, `0x801ee904`, `0x801eea8c`, `0x801eeabc`, `0x801eee50`, `0x801ed934`) and the scripts (`b.2 [0]`) |
| 1-3 | Attack 1-3 | the attack script (`b.2 [1..3]`); for a countered attack the director (`0x801ee774` → `0x801eebec`) |
| 4 | Damage | the hit script (`b.2 [4]`, interpreter `0x801e8920`) |
| 5 | KO | `b.2 [4]` when HP is 0 or less (`0x801e892c` … `0x801e896c`) |
| 6 | Victory | the director (`0x801eeb0c`) |
| 7 | Entrance | script 999 of `A/BATTLE.PAK` (`b.1 [7]`, `b.2 [7]`), played on each Digimon when the battle opens (`0x801ee4e8`, `0x801ee6b8`); also the pose a model is loaded in (`0x8002de18` … `0x8002de54`) |

There is no guard motion: the ticket's guess was wrong. No script and no call passes any
other number (all 1095 scripts of `F/*.PAK` and `A/BATTLE.PAK` searched; every caller of
`0x80022d34` and `0x8002daac` in the main program and the seven overlays read).

**Lengths.** A motion lasts 2 × d0 + Σ 2 × d frames: the start (`0x80022d34`) first blends
the model into key 0 over 2 × d0 frames (the lead), then the task (`0x80022b98`) takes
every key, key 0 again first. Settled by running `0x80022d34`, `0x80022100` and
`0x80021c18` in Unicorn on the disc's motions: Agumon (model 3) attack 1, keys adding up to
216, takes 240; model 6 damage 124 → 128; model 11 victory plays key 0's sound twice and
then loops from key 4 as its loop field says.

**The table** is [motion-slots.md](motion-slots.md) (the 43 bases of the roster) and
[motion-slots.json](motion-slots.json) (all 190 card models; per slot: keys, durations,
lead, frames, loop key, loop length, sounds with their frames; per script: its length, the
frames at which it starts which slot, the body parts it hangs objects on). Both are written
by `tools/motion_slots.py`, whose docstring gives the layout:

```bash
tools/.venv/Scripts/python tools/motion_slots.py extracted docs/time-stranger/motion-slots.json docs/time-stranger/roster.md docs/time-stranger/motion-slots.md
```

The script timelines come from playing each script through the tool's own copy of the
interpreter's commands (as `web/js/battle3d.js` ports `0x801e8678`), without its objects.
That is exact here because no script of the Digimon files reads an object's state and none
takes a different time with other random numbers (checked with three seeds).

**Where the scripts wait.** Nowhere: a script is a fixed timeline. 563 of the 573 attacks
start their motion at frame 1 of the attack script and the script ends by putting the
Digimon back to standing, so the script's length is the room the attack motion has (Agumon:
attack 1 lasts 240, its script 254). The director waits for the target's damage or KO
motion to end (`0x801ee87c`, `0x801ee9fc`) and for the entrance to end (`0x801ed920`).

**Camera and sound per key.** The sound field (number + 1) is played with `0x8002b498` when
the model starts towards the key (`0x80022184`). The record after the last part is the
camera track, eased like a part (README, "Camera", `0x800250f4`); in every Digimon motion
its scale is 4096 and its show flag 0.

**For the converter (TS-205, TS-206):**

- Parts: the scripts name body parts by number (the "Parts" columns), so a converted model
  must keep a part with that number in that place (a hand, the mouth) for every script of
  its base. The game does not check the number: MagnaAngemon's third attack (script 1020)
  names part 25 of its 25 parts (0 to 24).
- Standing must loop (loop key 0) except for Agumon's base, whose standing motion stops;
  victory loops from the base's loop key; the others stop in their last pose.
- A key's time in the base is 2 × d0 + Σ 2 × d of the keys before it and itself.
- Against TS-203's candidates: DDCB has no guard slot, so `bg01` has no place; slot 7 is an
  entrance, for which TS-203 names no motion yet (TS-206 has to pick one or use the nearest
  role and log it). The rest pair as idle 0, the three attacks 1-3, damage 4, down 5, win 6.

**Found on the way, not changed here** (the port, `web/js/battle3d.js`; listed in the
README under "Not from the game code", Polygon Battle gaps):

- `Actor.play` starts a motion at key 0 without the lead, so every motion runs 2 × d0 frames
  (4 to 64) ahead of its script.
- Script command `b.2` does not restart a motion that is already playing; the game does.
- A hidden model keeps moving; in the game it does not (`0x80022bd0`).
- The entrance (script 999, slot 7) is not played (already listed under staging).
- Omnimon II (card 35) names hit scripts 2011 and 497, which are not in its model's file
  (`F/180.PAK`) nor in `E/SKILL`; what the game does then was not read.

### 2026-10-14

The roster changed after the table was made: card 329 is now Keramon on the base Tsukaimon
(135, model 96), which the table did not have. `motion-slots.md` was written again from the
current roster and now holds its 44 bases; nothing else in it changed, and
`motion-slots.json` already had every card model. Run the command above again whenever a
base in `roster.md` changes.
