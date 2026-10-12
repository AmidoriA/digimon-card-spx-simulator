# Working on this project

A browser remake of the PlayStation game *Digimon Digital Card Battle* (USA, SLUS-01328),
rebuilt from the disc: the rules, the board, the sounds, the battle effects and the 3D battle
animation ("Polygon Battle"). `README.md` is the record of what was found and where; read
its section for the area you are about to touch before changing it.

## What the owner expects

1. **Nothing is guessed.** Every rule and every behaviour is read from the game's code or
   data before it is written here. Not from memory of the game, not from what seems
   reasonable. When the owner reports that the real game does something else, read the code
   again before answering: those reports have been right.
2. **Say where it comes from.** A ported behaviour carries the address of the routine it was
   read from, in a comment and in `README.md`. What could not be read from the code is listed
   in the README under "Not from the game code", in the same commit, and told to the owner.
3. **The game's own look.** Pictures come from the game's textures. Enlarging goes through
   the owner's local ComfyUI (`tools/comfy.py`, `http://127.0.0.1:8188`, RealESRGAN_x4plus),
   not through browser scaling or redrawn art. The 3D scene stays at the game's 320x240.
4. **One request, one commit.** When several things are asked for, each is committed and
   pushed on its own. With GitHub Pages on, a push to `main` that touches `web/` is
   published by `.github/workflows/pages.yml`.
5. **Check it running.** A change that shows on screen is looked at in the browser before it
   is called done, and the report says what was seen and what was not.

## Where things are

| Path | What |
|---|---|
| `web/` | The site. Plain scripts, no build step. `js/engine.js` rules, `js/ai.js` opponent, `js/ui.js` board and turn flow, `js/decks.js` deck rules, search and export, `js/editor.js` deck editor, `js/effects.js` board effects, `js/battle3d.js` 3D battle, `js/audio.js` sound |
| `web/js/data/`, `web/assets/` | Generated from the disc by the tools. Do not edit by hand |
| `tools/` | Readers for the game's formats, the exporters, the disassembly helpers, the tests |
| `extracted/` | The unpacked disc. Not in git: made with `tools/extract_iso.py` and `tools/extract_drv.py` from the owner's image (hashes in the README) |
| `.claude/skills/` | How to read the game code, how to rebuild the assets, how to check a change in the browser |

Python tools run with `tools/.venv/Scripts/python`; the tests run with `node`.

## Before saying it works

```bash
node tools/selftest.js
```

```bash
node tools/decktest.js
```

```bash
node tools/sim.js
```

```bash
node tools/fxtest.js
```

```bash
python tools/check_paths.py
```

`selftest.js` holds one check per traced rule; add one with every rule that changes.
`decktest.js` checks the deck rules, the card search and deck export/import.
`sim.js` plays 200 matches between two computer players and must end without timeouts.
`fxtest.js` runs every board effect script. `check_paths.py` must pass before a push: the
site is served by a host that tells file names apart by their capitals.

## Things that have gone wrong before

- **The browser keeps old scripts.** After an edit a reload can mix new and old files and
  break in ways that look like bugs. Force a reload (see the browser skill) before believing
  an error.
- **`tools/lift.py` is for reading, not for proof.** It drops instructions in delay slots
  and argument registers. Settle anything that matters with `tools/mips.py dis`.
- **Rendering the music again changes every file.** The encoder does not give the same
  bytes twice; use `build_audio.py ... --missing`.
- **The game has no depth buffer.** It sorts polygons into an ordering table. Where layers
  lie on each other (the arenas) the port follows that order; do not replace it with a depth
  test.
- **A long shell here-document with quotes in it fails on this machine.** Write the patch or
  the script to a file and run that.
- **Line-ending warnings from git** on this Windows checkout are harmless.
