---
name: trace-game-code
description: Read a rule or behaviour out of the PlayStation game's code before porting it. Use whenever a game rule, a timing, a screen position, an animation order or a file format is in question, or when the owner says the real game behaves differently.
---

# Reading the game's code

The owner's standing rule: every rule and behaviour of the port is read from the game, never
reconstructed. This is how that is done here. There is no Ghidra or other decompiler on this
machine; the tools below are what there is.

## What is loaded where

- `extracted/disc/SLUS_013.28`: the main program, loaded at `0x80010000` (file offset 0x800).
- `extracted/drv/P/*.BIN`: overlays, one at a time, at `0x801DDF38`. `KAWSEG` is the card
  battle, `SUGSEG` the 3D battle, `SAISEG` the game's own computer player (not ported).
- An address at or above `0x801DDF38` means nothing without the overlay it belongs to.
  Pick it with the `OVL` environment variable; the default is `KAWSEG`.

## Tools

```bash
tools/.venv/Scripts/python tools/mips.py dis 0x801e9f5c 60
```

```bash
tools/.venv/Scripts/python tools/mips.py func 0x801e9f5c
```

```bash
tools/.venv/Scripts/python tools/mips.py xref 0x801e9f5c
```

```bash
tools/.venv/Scripts/python tools/lift.py 0x80035880 0x80035dc4
```

```bash
OVL=SUGSEG tools/.venv/Scripts/python tools/lift.py 0x801eec3c 0x801eee24
```

- `mips.py dis <addr> [count]`, `func <addr>`, `xref <addr>` (callers and references),
  `find16 <value>` (instructions using a 16-bit constant), `str <addr>` (a C string),
  `words <addr> [count]` (a table of words, with strings where they point at one).
- `lift.py <start> <end>`: one line per instruction, written like C. Quick to read, but it
  drops what sits in a delay slot and it does not show which register an argument is in.
  Use it to find your way; settle the detail with `mips.py dis`.
- `emu.py`: runs one routine under Unicorn. Used to settle what a maths helper does (the
  order of a rotation matrix, for example) when reading it is not enough.
- `btrace.py <pak> <script id>`: plays a 3D battle script and prints what it does in time
  order. `bscript.py`, `effscript.py`: the script formats. `omd.py`: models and motions.
  `pak.py`, `lzh.py`: the archives and the packer.

## Ways in that have worked

- **From a message.** The game's texts are plain strings. Find one with a search of the
  program file, then `mips.py xref` on its address leads to the code that shows it. That is
  how "This Digivolve Option has no Effect" led to the rule behind it.
- **From a picture.** A piece of the screen is drawn from a texture position. Search for
  the constants (u, v, width, height, palette number) with `mips.py find16`. That is how
  the DP card counter was found.
- **From the state machine.** The card battle is one loop over a state number (table at
  `0x80011008`, state in byte `0x818` of the block at `[0x801d8340]`, player in `0x817`).
  The README names the states of each phase. Read the whole state, including what the
  buttons do and what happens when a check fails; the failing path is where rules hide.
- **From a caller.** `mips.py xref` on a routine you already know (the legality check
  `0x801e9f5c`, the effect call `0x801f6214`, the sound call `0x8002b498`) shows every
  place the game uses it.

## What to write down

- The address, in a comment next to the ported code and in the README section for that
  area. Say what the routine does, not how you found it.
- What you could not read. If part of a behaviour is your own choice (a camera for a
  preview, a missing piece drawn as text), it goes in the README under "Not from the game
  code", and you tell the owner. A format read from the data and not from the code that
  uses it is said to be so (see the note on fans and strips in `tools/omd.py`).
- A check in `tools/selftest.js` for a rule, so it cannot quietly change.

## Traps

- Calls that wait: the effect call (`0x801f6214` and `0x801f6294`) and the script task
  come back only when the effect is over. What follows them in the code happens after the
  effect on screen. Order on screen is order in the code.
- The 3D battle is drawn without a depth buffer: polygons are filed by their average depth
  and drawn far to near. Draw order questions are answered by that, not by geometry alone.
- The same script reader serves the board effects and the 3D battle with different
  variable numbers. Do not carry a variable number from one to the other.
- Do not copy a rule from another Digimon game or from a guide. This game differs.
