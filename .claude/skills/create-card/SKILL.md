---
name: create-card
description: Add a card that is not in the game (a custom card), with its own model colours, textures, battle effects and card pictures, made from a card of the game. Use when the owner asks for a new card, a recoloured model or texture, or attack effects in other colours.
---

# Making a custom card

A custom card is made from a card of the game, its **base**: it has the base's model, motions
and battle scripts in other colours, and numbers and an effect of its own. Nothing about it is
the game's, so the rule "nothing is guessed" turns into: **say so**. Every custom card is
listed in the README under "Custom cards" and "Not from the game code".

BlackWarGreymon (card 301, from WarGreymon) is the worked example; read its entry in
`tools/custom_cards.json` next to this.

| File | What |
|---|---|
| `tools/custom_cards.json` | The list: the recolours and the cards. The only file you write by hand |
| `tools/custom.py` | Reads the list; the recolouring of palettes, models, pictures and scripts |
| `tools/build_custom.py` | Makes the files under `web/` |
| `tools/custom_look.py` | Shows what there is to recolour, before you build |
| `tools/custom/` | Pictures the owner supplied for "New card art" |

The tools need the unpacked disc (`extracted/`; in a worktree it is the one of the main
checkout, pass its path) and `tools/.venv/Scripts/python`.

## 1. Ask what is not said

The owner gives some of: Specialty, level, DP, +P, the support effect, the ✕ effect, the
names. What is left to you ("you adjust the stats") is taken from the base and its
neighbours: list the cards of that level and DP and stay inside what they have.

```bash
node -e "require('./web/js/data/cards.js').cards.filter(c=>c.type==='digimon'&&c.level===3).forEach(c=>console.log(c.name,c.dp,c.pp,c.hp,c.atk.map(a=>a.power).join('/'),c.text))"
```

Level is 0 R, 2 C, 3 U. Tell the owner the numbers you chose and what you compared them with.

## 2. The card

Add an entry to `"cards"`. The numbers follow each other: card ids from 301, models from 400,
`battle.offset` 10000, 20000, ... (a script and its effect file get the base's number plus
the offset). `custom.py` explains every field.

- **`xfx`** is one of the names in `XFX` (`web/js/engine.js`): the game's sixteen ✕ effects.
  A new one would be a new rule in `runXfx`; say so to the owner before adding one.
- **`support`** is the effect as `cards.js` holds it: `prio` (the tier, 1 to 3), `conds`
  and `acts`. Do not invent the encoding: find a card of the game whose effect has the same
  shape and copy its record, then change the numbers. `getVar` and `exec` in `engine.js`
  name the variables and the operations. For "add N for each ..." the pattern is
  Imperialdramon's: `{"op": 10, "v": [11, 0, X], "i": [0, N, 0], "m1": 0, "m2": 2}` is
  attack power = own attack power + X times N.
- **A value the game has no variable for** needs one in `getVar`. The game's variables end
  at 0x1c; the project's own start at 0x40 (0x40-0x44 cards of each Specialty in the own DP
  Slot, 0x48-0x4c in the opponent's). Add the next ones after those, with a comment that
  they are not the game's, a check in `tools/selftest.js`, and a line in the README.
- **`text`** is worded like the game's texts for the same kind of effect.

## 3. The model and its texture

A model is the base's mesh and motions with other colours: its texture is a picture of
colour numbers (`NNN.png`) and rows of palettes (`NNNp.png`), and a recolour changes the
palettes and the colours of untextured triangles. Look first:

```bash
tools/.venv/Scripts/python tools/custom_look.py model web 173 look.png
```

It writes the texture as the model wears it and prints every palette colour with its hue,
saturation and value. A recolour is a list of rules in `"recolours"`; the first rule that
takes a colour changes it. Select by hue range, and where two things share a hue (a dark
gold and a light orange) name the exact colours in a `colours` rule placed before the
ranges. Greys (saturation under 0.2) are left alone unless a rule says otherwise.

```bash
tools/.venv/Scripts/python tools/build_custom.py extracted web model
```

```bash
tools/.venv/Scripts/python tools/custom_look.py model web 400 look.png
```

Read the picture, change the rules, build again. A different shape is not something this
does: there is no modelling tool here, only the game's meshes. A texture drawn anew would
have to keep the model's layout and its 16 colours a palette; say so if that is asked for.

## 4. The battle effects

The base's attack scripts and hit scripts are copied with the colours changed, and so are
their effect files (sprites, textures, effect models). See what colours they use and what
a recolour makes of them:

```bash
tools/.venv/Scripts/python tools/custom_look.py script extracted 2 darkfire
```

```bash
tools/.venv/Scripts/python tools/build_custom.py extracted web battle
```

The builder prints, for each script, how many colours it set and how many it had to leave,
and then runs the old and the new script side by side: "N objects' colours as wanted, 0
not" is what you want. A colour that is left is one the script computes; report it.
Effects are added to the picture on screen, so a dark colour is a faint one: "dark fire" is
violet, not black. `battle.accent` (fire, ice, electric, dark, holy, physical) names the
colour of the enhanced effects, which otherwise goes by the attack's name.

## 5. The pictures

`art.recolour` is applied to the game's two pictures of the base, which are then enlarged
through the owner's ComfyUI like every other card's. Try the rules first; this needs no
ComfyUI:

```bash
tools/.venv/Scripts/python tools/custom_look.py art extracted 2 blackwargreymon-art look.png
```

The picture has a background, so a rule for the model usually takes too much here: write a
separate, narrower recolour. `art.new` can name a supplied file or an official internet
picture; see "Pictures from the internet" below. File paths are relative to `tools/`. Then,
with ComfyUI running at `http://127.0.0.1:8188`:

```bash
tools/.venv/Scripts/python tools/build_custom.py extracted web art
```

### Pictures from the internet

Use exactly one source in `art.new`:

- `{"file":"custom/x.png","crop":[x,y,size]}` retains native file coordinates.
- `{"card":"BT2-009","crop":[85,90,320]}` downloads the official card-list picture and uses coordinates in its normalized 430×600 image.
- `{"ref":"crescemon"}` uses the official Reference Book picture when no suitable card illustration is available.

Downloads are cached under `<extracted_dir>/newart/cards` or `ref`; the existing ComfyUI upscaling/output process is shared. Verify species/colour aliases visually, inspect every crop, keep SAMPLE outside the selected picture, and record sources and edits in the roster/README. `tools/time_stranger_art.json` holds the TS-002 selections; local ComfyUI recipes are in `tools/new_art_edits.json`. The reusable `digimon-card-art` skill describes search and cleanup. For a prepared official-source crop, add `edited` (for example `edited/ts002/303.png`) alongside its original card/crop fields. The builder verifies the recipe/cache before using that native crop, without cropping it again; run `tools/prepare_time_stranger_art.py` first if absent or stale.

Time Stranger owner choice (2026-10-13): `art.shared: true` uses the prepared
TS-002 source at its native resolution for both art modes, with identical mini pictures.
Use this instead of `art.recolour` and a separate Legacy build for TS-101–105.
It does not need ComfyUI; the other cards keep the existing ComfyUI path.

## 6. Everything, and the checks

```bash
tools/.venv/Scripts/python tools/build_custom.py extracted web
```

- `git status` should show only the new card's files, `cards.js` and `scripts.json.gz`.
  In `cards.js` only the new line (and the comma before it) may differ.
- `tools/decktest.js` counts the cards; a search there that now finds the new card too has
  to be told. Add a check of the new card's effect to `tools/selftest.js`.
- Run the five checks of `CLAUDE.md`, and `node tools/battletest.js`, which plays every
  card's attacks in all three styles.
- Look at it in the browser (the browser skill): the card in the deck editor with both
  kinds of card art, on the board, and each attack in `battle-preview.html` next to the
  base's, on a dark stage (the first one) so the effects can be seen. The owner's server on
  8765 serves the main checkout; from a worktree start one of your own on another port.
- In the README: a column in the table of "Custom cards" with what the card is made from,
  and in "Not from the game code" what was chosen and by whom.

## A deck with the card

When the owner wants an opponent to play a custom card, the game's deck stays as it is and
a **custom deck** is made from it: an entry in `"decks"` with a name, the base deck (its
name and owner) and the cards to exchange by name. It follows the game's 159 decks and
keeps its base's owner, rank, armor form and music, so it shows up as that opponent's next
deck. The name is yours to choose unless the owner gives one: at most 18 letters, like the
game's, and in the manner of the game's second decks ("Black Storm Again", "Evil Fire
Revived"). Only the card data changes:

```bash
tools/.venv/Scripts/python tools/build_custom.py extracted web data
```

Add a check to `tools/selftest.js` that the deck is its base with the exchange, run
`node tools/sim.js` (it now plays the deck), look for it in the opponent list on the start
screen, and name it in the README next to the card.

## Many cards at once

When the owner asks for a set of cards (the Time Stranger cards in `docs/time-stranger/`
are 45), plan before writing any entry:

- **Numbers in blocks.** Give the whole set its card ids, model numbers and battle offsets
  up front, in a fixed order (Specialty, then level), and write them down; `custom.load()`
  refuses gaps, so a card dropped later means renumbering the ones after it.
- **One group, one commit.** Build, test and commit a group (one Specialty, say) at a time,
  not the whole set in one go, so each push is small enough to check in the browser.
- **Numbers the owner did not give** are the base's, unchanged: DP, +P, HP, the attack
  powers, the ✕ effect and the support record. Only the names change. That keeps the game's
  balance, and the README says the names are this project's and the numbers the base's.
  Choose other numbers only when the owner asks, as in section 1.
- **Choosing a base.** Body shape first, since the model keeps the base's shape; then a base
  of the same Specialty, so its attack effects fit; and three different bases for the three
  cards of a (Specialty, level) slot, so they do not play alike. A base of another Specialty
  needs a `battle` block (offset, recolour, `accent`) so its effects take the card's colours.
- **One selftest for the set.** List the set's names in one check that compares each card
  with its base, instead of one check per card.

## Traps

- **The page keeps old files.** After a rebuild, fetch the model, the effect files and
  `scripts.json.gz` again with `cache: 'reload'` before you judge a colour.
- **Enhanced lighting brightens the model.** A grey that looks right in the texture sheet
  is lighter on screen; look at the model in Enhanced and in Original PS1.
- **A hue range that goes through red** is written with the larger number first:
  `[330, 70]`.
- **Do not touch the game's cards or decks** to make room for a custom card. No deck of
  the game holds one; the owner builds a deck with it in the deck editor, or asks for a
  custom deck (below).
