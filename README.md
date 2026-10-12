# Digital Card Battle — web card battle

A browser version of the card battle from *Digimon Digital Card Battle* (PS1, SLUS-01328),
rebuilt from data, rules and graphics recovered from the disc image. Card battle and deck
building only: no story mode, no card collection, no partner customisation.

**Play it in the browser: <https://amidoria.github.io/digimon-card-spx-simulator/>**

All card data, art, UI textures and audio (`web/js/data/`, `web/assets/`) are generated
from the disc image (SLUS-01328, US release) and are committed, so a clone runs as is.
"Rebuild from the disc" shows how they were made. Two things are not from the disc: the new
card art (`web/assets/art2`, `mini2`, see "New card art") and the custom cards, which are
made from cards of the game (see "Custom cards").

## Play

Online at <https://amidoria.github.io/digimon-card-spx-simulator/>, or from a clone:

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory web
```

Then open <http://localhost:8765/>. Pick one of the game's decks for yourself and one of
its opponents, choose the opponent skill, and start. Sound needs the page served over
HTTP as above; the Sound box in the side rail mutes it.

The online copy is the `web` folder as it is: `.github/workflows/pages.yml` publishes it to
GitHub Pages on every push that changes it (the repository's Pages source is set to
"GitHub Actions"). Before publishing it runs
`tools/check_paths.py`, which checks that every file the page asks for is in git under
exactly that name, capitals included: Pages tells names apart by case and Windows does not.

"Card art" on the start screen, and the "New card art" box in the side rail during a match,
switch the Digimon cards between new illustrations and the game's own pictures. The choice
is remembered.

**Battle visuals** on the start screen and in the match rail switches between **Enhanced Ultra**,
**Enhanced** (the default) and **Original PS1**. Both enhanced levels use 4× upscaled arena
textures. Ultra adds denser particles, attack lighting and surface shadows at the same
resolution as Enhanced, and selects the smoother model shape. The choice is saved
separately from card art and the animation on/off box. **Preview attacks** opens a browser
preview for all 192 Digimon (the game's 191 and the custom card) and
their three attacks. Its **Opponent** picker offers the same 192 and starts with
Garurumon; an opponent choice applies to the next attack played. Pause or use **Next moment**, then switch styles to compare the same
pose. Its **Stage** picker offers all 24 arenas with a thumbnail, plus **Random** (one of
the twelve free-battle arenas). The preview remembers its stage separately from the match
arena; a stage choice applies to the next attack played. Preview damage is a fixed 300 HP;
it does not change card balance.

**Graphics options** is available on setup, in the match rail and in the attack preview.
Each setting can be changed independently and is remembered across those screens:

- **Lighting:** Original PS1, Enhanced, or Ultra with shadows on the Digimon themselves.
- **Model shape:** Original polygons, Refined, or Smooth. Smooth rounds the existing
  models' silhouettes and body facets while retaining body parts and sharper features.
- **Render resolution:** Adaptive (960×720, falling to 640×480 under sustained slow frames),
  or fixed 320×240, 640×480, 960×720, or 1280×960.
- **Arena resolution:** Original textures, sharper 2×, or sharper 4×. The 2× choice uploads
  a half-sized copy of the decoded 4× atlas to reduce GPU memory use.
- **Attack effects:** Original PS1, Enhanced, or Ultra's denser particles.

Changing one option leaves the others alone, and keeps a paused preview at the same frame.
The **Battle visuals** picker shows **Custom** when the options differ from a preset.
Choosing Original PS1, Enhanced or Enhanced Ultra again resets all five options. Enhanced
and Ultra presets share the same rendering resolution. Original PS1 resets every option
to the original presentation. Graphics choices never affect damage or attack timing.

During a match, click a TRASH plate to see that player's Offline pile (newest card first)
and a DECK plate to see which cards are still in that deck, by level and with their counts.

**Two players.** Set Players to "2, at this screen" and each player picks a deck (any of
them). Both play at the one screen and take the mouse in turn; the hands are open in the game
anyway. The attack is the one secret: the turn player chooses first while the other looks
away, then they swap, and nothing on the board shows a choice until the battle begins. The
deck tracker is off in this mode: the DECK plates only count the cards. This way of sharing
a screen is this project's arrangement, not something traced in the game.

## Deck editor

**New deck** on the start screen opens the deck editor; **Copy and edit** under a deck's
contents starts from any deck of the game, yours or an opponent's. Decks you build are kept
in the browser (`localStorage`), saved as you go, and are listed above the game's decks; a
finished one can also be picked as the opponent's deck, or by either of two players.

The rules are the ones of the game's deck editor, the overlay `P/SUBSEG.BIN`:

- A deck is 30 cards. Leaving the editor, `0x801ed61c` walks the deck's 30 slots: with an
  empty one it says "There are not enough Cards.", and with no Digimon card among them
  "Please place Digimon Cards in a Deck." (`0x801ed674`).
- Before a card goes into a slot, `0x801ece70` refuses the armor forms (card numbers
  172-174, 176-181, 185, 186, 188, 189) and any card the deck already holds 4 of.
- Card numbers are the ids used here: `0x80046bac` takes numbers below 191 as Digimon, the
  next 102 as option cards and the rest as digivolve cards. The custom cards follow from 301.

Finding cards:

- **Search** looks for every word typed in card names, attack names, the name of the
  ✕ effect and the effect text, and marks what it found. `"attack first"` keeps words
  together, `-discard` leaves cards out. Numbers can be compared: `hp>=1500`, `dp<40`,
  `+p=20`, `o>600` (`o`, `t`, `x` are the three attack powers). The attack symbols can be
  typed as `circle`, `triangle`, `cross`.
- **Filters** for type, Specialty, level and whether a card is in the deck, and under "More
  filters" the ✕ effect, DP cost and +P. Each value shows how many cards choosing it
  would leave; several values of one filter widen it, different filters narrow each other.
- **Sort** by the keys of the game's own sort menu (table `0x801f2154`: Number, Level,
  Strength, Required DP, Added DP, the three attack powers, Cards Used) or by name. In
  number order a search puts cards whose name matches before cards that only mention the word.
- **Keys:** `/` goes to the search box, Enter there adds the first card found, the down arrow
  goes into the list, where Enter or `+` adds and `-` takes out. Ctrl+Z and Ctrl+Y undo and
  redo. A click on a card adds it, Shift+click takes one out.

**Export** gives a deck as a card list (one `4 Agumon` line per card, which can be changed
by hand) or as a short deck code, to copy, to save as a file or as a link that opens the
page with the deck ready to import. **Import** reads either form, pasted, chosen as a file or
dropped; it says what it understood before anything is kept, names a card it does not know
with the nearest name, and leaves out what the rules do not allow. A deck that is not
complete yet is kept, opens in the editor and cannot start a battle.

`node tools/decktest.js` checks the rules against all 159 decks of the game, the search and
filters, and that every deck comes back the same from both exported forms.

## Rules, as traced in the game code

The turn controller is a 40-state machine at `0x80034260` in `SLUS_013.28`. One turn
belongs to one player (the byte at state `+0x817`), who is also the first attacker.

**Preparation (states 1–0xA)**

- Only the turn player draws, up to 4 cards. Nobody starts with a hand, so the first turn
  has no battle: the opponent has no Digimon yet.
- With no Digimon in play and no Digimon card in hand, the hand is redrawn automatically;
  with an empty Online deck that player loses ("There are no more Cards, so %s loses!").
- "Change All Cards" (discard the hand, draw 4) is available while the Online deck has cards.
- Digimon Entrance: any Digimon card may enter. The card's level bits become an "abnormal
  state" (`0x801ea558`), and `0x8004080c` shifts HP and all attack powers right by
  `level - 1`, cut to tens: level C enters at half strength, level U at a quarter.
- Digi-Egg Power-Up: a partner Rookie entering can armor digivolve. Partner ids are in a
  table at `0x8006e518`, their armor forms at `0x8006e520`; a per-deck byte (last byte of
  each `DECK2.DEK` record) selects the form. Armor cards are never in a deck.

**Digivolve (states 0xB–0x16)**, in this fixed order

1. One Digimon card to the DP Slot (8 cards max; DP = sum of +P, capped at 90). The eight
   boxes under the slot count its cards: one lights per card, the upper four first, from
   the left (`0x800399f8`).
2. One digivolve option card. Digi-devolve and De-Armor act at once; the others ask for a
   target. Using an option card ends the phase. A card that can do nothing as things stand
   (`0x801ea374`: no card in the hand is a legal target for it, or there is nothing to
   devolve) may still be used: state 0xF asks "This Digivolve Option has no Effect. Do you
   still want to use it?", and state 0x10 sends it Offline and goes on to step 3. A card
   that does have a legal target cannot be thrown away like this.
3. Normal digivolution, repeatable while legal: R→C→U, same current Specialty, DP ≥ cost.

A digivolution's effect plays to its end before the cards change: the effect call
(`0x801f6214`) comes back only when the effect is over, and the card is moved after it, in
every digivolve state and for the armor digivolution of the entrance (`0x80034fb4`).

Legality is `0x801e9f5c`. Digivolving sets the new card's stats with the same `0x8004080c`
and empties the DP Slot (`0x801ece24`); Speed and Download keep the DP Slot. Speed is refused
in an abnormal state. Digi-devolve doubles the lower form's HP.

The entrance penalty is not tied to the card that entered. Normal digivolution (states 0x13
and 0x15) calls `0x801ec7c0` with the abnormal state untouched, so a level C that entered at
half strength digivolves into a level U at half strength. The option cards clear the state
first and give full stats: Digi-devolve in state 0x10 (`0x80035f90`), and every card of
state 0x12 (`0x80036788` Special, Warp and Mutant, `0x800368f0` Speed and Download,
`0x80036a18` ArmorCrush). De-Armor (`0x80040d88`) does not touch it.

**Battle (states 0x17–0x25)**

- No battle if the opponent has no Digimon in play.
- Both players choose an attack (state 0x19), hidden.
- The non-turn player commits a support card first (0x1A), then the turn player (0x1D). A
  support is a Digimon or option card from the hand, or the top card of the Online deck,
  face down. Digivolve option cards cannot be supports.
- Resolution (`0x801e6aa4`): six effect sources — option supports, Digimon supports, ✕
  effects, turn player's first — run in tiers 3, 2, 1. Each card carries its tier; ✕ effect
  tiers come from a table at `0x8006e4fc`. A support from the deck uses its own card's tier
  like any other; it is only turned face up when its tier comes.
- "Support voided" (opcode `0x2C`, and Jamming) blocks Digimon supports only; opcode `0x2D`
  also blocks option cards.
- Attack order: turn player, overridden by 1st Attack, then by Counter (the countering
  side strikes second with the opponent's power). Crash and Eat-up apply per strike; a KO'd
  Digimon does not strike back.
- KO (`0x801ecf0c`): the opponent scores. A revive effect keeps the Digimon in play unless
  the opponent already has 2 KOs. An armor Digimon is first shown dropping back to its Rookie form
  (effect script `0x1e`); then, as for any other Digimon,
  the whole stack goes Offline. Three KOs win; a KO'd player with no Digimon in play, none
  in hand and an empty Online deck also loses.
- End of turn: supports go Offline, the turn passes.

**Support effects** are bytecode: two 32-byte conditions and three 16-byte actions per card.
`0x801e7dd4` reads 29 variables, `0x801e9abc` does the arithmetic (add/multiply cap at 9990,
subtract floors at 0, divide rounds down to tens with a minimum of 10), `0x801e9bac`
compares, `0x801e81dc` executes 54 opcodes. One card (Aquilamon) ships with comparison
operator `0xFF`, so its effect never fires; kept as is.

**Speciality Change** (opcodes 0 and 1, `0x801e8240`): the Specialty of a Digimon in play is
kept apart from its card, in bits 19–21 of word `0x178` of the player's block. Effect script
`0xF` plays to its end first, then the new value is written. The card's frame follows it:
the card draw (`0x80044ab0`) takes the frame palette from byte `0x14` of the card object
(CLUT row `0x1f1` + that byte, at `0x80045560`), and every frame the board gives the top
card of the Digimon stack the Specialty from that word (`0x8003d664`). A card that goes
Offline after a KO keeps the frame it had; the Rookie an armor Digimon drops back to gets
its own Specialty again (`0x80040dcc`).

`node tools/selftest.js` checks these behaviours (26 checks, the custom card among them);
`node tools/sim.js 300` plays AI-vs-AI matches and checks card-count invariants.

## Custom cards

Cards that are not on the disc. Each is made from a card of the game: it has that card's
model, motions and battle scripts in other colours, and numbers and an effect of its own.
`tools/custom_cards.json` lists them; `tools/build_custom.py` makes their files (see
"Rebuild from the disc"). They follow the game's 301 cards from number 301, their models
the game's from 400, and their battle scripts and effect files carry the number of the
script they were made from plus 10000 for the first custom card, 20000 for the second.
The deck editor offers them like any other card; no deck of the game holds one.

| | BlackWarGreymon (301) | WarGreymon (2), which it is made from |
|---|---|---|
| Specialty, level | Fire, U | Fire, U |
| DP, +P | 60, +20 | 50, +20 |
| HP | 1750 | 1650 |
| ○ | Black Terra Force 950 | Terra Force 900 |
| △ | Black Great Tornado 700 | Great Tornado 670 |
| ✕ | Black Dramon Cutter 400, Nature Foe x3 | Dramon Cutter 380, Ice Foe x3 |
| Support | Add number of Darkness Cards in DP Slot x200 to own Attack Power. | Add number of Cards in Hand x100 to own Attack Power. |

- **Model 400** is WarGreymon's (`F/173.PAK`): the same mesh, motions and texture, with the
  14 palettes changed. Gold becomes charcoal, the orange of the straps, the hair and the leg
  bands yellow, the green eye yellow and the blue lining of the shield slate; the silver
  armour is as it was.
- **Battle scripts** 11105-11107 and 10435, 12006, 10400 are WarGreymon's three attack
  scripts and their hit scripts. Before each object a script creates, the colour variables
  of that kind of object (screen rectangle, ring, particles, light change) are set to the
  changed colour, and back after it. The effect files of the same numbers hold the sprites,
  textures and effect models with their palettes changed the same way: reds, oranges and
  yellows become violet. Great Tornado's wind is not a fire colour and stays as it is.
- **Pictures.** The game's two pictures of WarGreymon (`B/CARD/LC002.TIM`, member 2 of
  `B/M_CARD.ARC`) recoloured and enlarged 4x through ComfyUI like the other cards'; for
  "New card art" a square of a picture supplied by the owner (`tools/custom/`).

## Sound

Music and effects are rendered offline from the disc's own data by `tools/build_audio.py`.

- `A/BGM/BGMnn.PAK` and `A/SE0.PAK` are chunk lists: type 6 = SEQ score, 7 = VAB header,
  8 = VAB samples. `tools/psxsnd.py` decodes the ADPCM samples and plays the scores with a
  software synthesiser (SPU ADSR rates, libsnd pitch formula from `0x80053984`, score loop
  markers). Rendered music lands on the equal-tempered grid within about 10 cents.
- **Battle music:** the battle start routine (`0x801f1aa8`) loads two tracks (`0x8002b024`):
  into slot 0, at volume 127, the one named in byte 104 of the opponent's `DECK2.DEK` record,
  and into slot 1, at volume 100, the one named in byte 105. With no opponent record it rolls
  twice: 143 or 144 for slot 0, 147 or 148 for slot 1. It then starts slot 0, the board's
  music. The switch to the 3D battle (`0x8002e26c`) starts slot 1 once the battle overlay is
  loaded and slot 0 again when the board is back. Starting a slot (`0x8002b858`) stops the
  track that plays (`SsSeqStop`) and plays the other from its beginning. The decks pair the
  tracks 143/147, 144/148, 46/37 and 47/44. The track is the opponent's, as the arena is
  (byte 106, handed to the 3D battle's setup at `0x8003eaec`), not the arena's: the same arena
  is fought in with different tracks (entry 37 with all four). The end of the match
  (`0x801f2a40`) plays 149 or 150.
- **Effects:** the play routine (`0x8002b498`) takes `program*16 + tone` in the SE0 bank. The
  turn controller plays `A0` on confirm and `A1` on cancel, the hand selector `A2` on cursor
  movement, message windows `A3`/`A4`.
- **Battle effects:** each effect animation is a script in `B/CBTL_EFF.ARC` (packed with the
  LZSS+Huffman scheme at `0x8001bdec`, see `tools/lzh.py`) that carries its own sound ids and
  frame offsets. `tools/effscript.py` lists them; the game plays the script whose number
  matches the message it shows (digivolve types, "1st Attack is Set", attack results, ...).
- **Card movement:** every card on the board is an object with a state byte, run by
  `0x8003b210`. A card that starts moving plays `A5`: to the hand (state 3), Offline (8), the
  Digimon stack (0xB), the DP Slot (0x1A), the support place from the hand (0x10) or from the
  Online deck (0x15). A card reaching the Digimon stack or the DP Slot plays `A7` when its
  16-frame move ends (states 0xC, 0x1B). A support from the deck rests face down in state
  0x19; when its tier comes the resolver puts it back in state 0x10, which plays `A6` instead
  of `A5` for a card that has to be turned over.
- **Number roll:** `0x8003e4f0` keeps a shown and a real value for HP, the three attack
  powers and DP of each player. Every frame a shown value moves `|difference| / 16 + 1`
  towards the real one, and while any is still moving `AA` plays on every 4th frame. With no
  Digimon in play the first four are zero, so a new Digimon's numbers roll up from 0.

## Battle effects

The effect animations are the game's own scripts, played by a port of its effect engine
(`web/js/effects.js`; `node tools/fxtest.js` runs all 31 without a display).

- **Scripts.** Each member of `B/CBTL_EFF.ARC` is a small program for the reader at
  `0x80020f54`, run once per frame by the interpreter at `0x801f663c` on 190 integer
  variables: set/add/subtract/multiply/divide/modulo/random, a test that skips the next
  command, a jump, and host commands. The host commands create an effect object in one of 16
  slots from the current variables, switch slots on and off, wait, play a sound, put the
  effect on a card (the launcher `0x801f6294` names card A and card B: a player's Digimon or
  support card) and tint a card. `tools/effscript.py` documents the command set.
- **Objects.** Two kinds draw. A *ring* (`0x80031f58`, drawn by `0x8003230c`) is 2 × N
  gouraud quads between an inner, a middle and an outer circle with one colour each. A
  *particle set* (`0x80032b44`, drawn by `0x80033258`) is N line streaks: each flies along
  its own randomly turned axis, one frame behind the previous, on a fixed cycle, its colour
  running from the first to the second colour; a flag makes them fly inwards.
- **Motion.** Every object hangs on a transform node (`0x80030e3c`, updated by `0x80030f90`):
  position (fixed, or along a line), rotation with speed and acceleration, scale moving to a
  target, a lifetime, and a brightness mode from `0x800317a8` (follow the scale, ramp, pulse
  once, pulse forever, flicker). Rotation is `Rx·Ry·Rz` and projection distance 448, both
  checked by running the game's routines in an emulator (`tools/emu.py`).
- **Cards.** A card sliding to the hand, the Digimon place, the DP Slot or the support place
  takes 16 frames, as its state counter in `0x8003b210` does.

## Polygon Battle (battle animation)

The optional enhanced presentation renders at 960×720, dropping to 640×480 when frame
delivery stays slow. Enhanced Ultra uses the same 960×720 resolution and 640×480 fallback.
Original PS1 keeps the original 320×240 framebuffer and nearest sampling. All three modes
use the same models, motions, scripts, cameras, sounds and damage
timing. `js/battlehd.js` refines a Digimon mesh on demand (four triangles per source
triangle, shared curved edge positions and crease-aware normals). Smooth uses two curved
subdivision passes (sixteen triangles per source triangle), with broader normal blending
on body facets. All 190 unique card models fit 16-bit indices at this level. Only four
Smooth meshes remain resident, and both lighting and shadow passes use the selected shape.
The original mesh is
kept for immediate switching. Model and sprite palettes remain nearest sampled; enhanced
texture filtering interpolates **decoded colours**, never palette indices.

Enhanced shading adds per-fragment lighting, restrained procedural surface grain, material
highlights and rim lighting. Attack names select fire, ice/water, electric, dark, holy,
physical or generic energy accents; unmatched names use Specialty colour. These accents
follow the existing sprites, particle lines, rings and effect models, with an impact burst
when the hit script starts. They use at most 112 live particles and 160 procedural quads
in one extra draw, plus a bounded bloom pass. Camera cuts clear trails, and misses and
countered motions never emit these accents. The Digimon refinements require no extra
model or texture downloads.

Both enhanced levels use **4× RealESRGAN arena textures** for all 24 stages. Generated by
`tools/upscale_arenas.py` through the owner's local ComfyUI and
`RealESRGAN_x4plus.safetensors`, they decode each referenced palette region before
upscaling, pack the regions with padded edges into atlases, and retain the original alpha
mask. Atlas dimensions range from 2048×512 to 2048×2048. All 24 WebP atlases together are
4.66 MiB; only the selected stage loads, and at most two atlases stay in GPU memory.
The independent 2× setting uploads the same atlas at half its width and height; UV mapping
remains identical. Original textures can also be selected independently of lighting,
models and attack particles.
Mipmaps and optional 4× anisotropic filtering keep distant surfaces stable. Arena
primitives retain their exact native sorting order, including transparency; only adjacent
primitives with the same palette can share an atlas draw. Original PS1 uses the original
indexed textures. Missing or unsupported atlases fall back to the original texture path.
Use `python tools/upscale_arenas.py --missing` to resume generation without re-encoding
existing assets. `python tools/arenatest.py` checks every atlas and its palette mapping
against over 1.6 million original pixels, including transparency.

Ultra raises the limits to 448 live particles and 768 procedural quads in one extra draw,
adds fading streak trails, wider layered glows and expanding impact rings. The largest
two active effect sources cast coloured, distance-limited light onto the Digimon. Ultra
omits screen-space bloom to avoid ghost outlines around bright surfaces; Enhanced keeps
its subtle bloom. `js/battleultra.js` draws the posed Digimon into a 1024×1024
colour depth map, with nine-sample soft filtering for shadows on the Digimon themselves.
The arena remains camera-centred and drawn in its native polygon order. No ground plane,
floor shadow or contact shadow is added. Shadows are skipped if the framebuffer is
unsupported; the other Ultra improvements still work. These are authored visual additions,
not recovered game behaviour. They require no new downloaded model or texture assets.

`node tools/battletest.js` validates every card model and compares all 576 attack/hit script
runs in all three styles with the same random seed, including no-effect misses and countered
motions. It checks CPU animation logic; real shader linking and visual appearance are
checked separately in `battle-preview.html`. For deliberately uncommitted development,
`python tools/check_paths.py --working-tree` includes new files; the normal command still
requires every website file to be in Git before publication.

The game can show each attack as a 3D "Polygon Battle". The **Battle animation** box in the
side rail turns it on and off. It was ported in three stages: models and motions, the battle
scripts, then camera and arenas.

- **Models.** Each Digimon card names a model (byte `0xE5` of its `CARD2.CDD` record) in
  `F/NNN.PAK`. The model chunk holds a tree of rigid parts and one "OMD0" mesh per part:
  vertices, a colour table (flat colours, or normals to be lit), and fans/strips of textured
  or plain triangles and quads (drawn by `0x800202d8`, `0x8001f3c0`, `0x8001f94c`).
  `tools/omd.py` documents and parses the format; all 211 files parse to the last byte.
  How the vertices of a fan or strip join was read from the data rather than from the
  emitters: of the possible orders, the one in `omd.py` is the one that leaves the meshes
  closed (about a seventh as many open edges as joining them in file order).
- **Motions.** Eight per Digimon, LZH-packed. A motion is a list of 772-byte keys: a duration,
  a sound, and a rotation / offset / scale record for each of up to 32 parts. The model eases
  from its current pose to the key over twice the duration, in two halves of constant
  acceleration aimed at the speed the next key needs (`0x80022100`, `0x80021aa8`,
  `0x80021c18`). Part rotation is `Ry·Rx·Rz` (`0x8005cbc4`, checked in the emulator).
- **Which scripts.** A card's attack record is {power, attack script, hit script, name}; the
  loader `0x8002dea0` reads the two script numbers. The director (`0x801ee3d4`) runs the
  attack script for the attacker, then the hit script for the target (not when the attack
  did no damage). The scripts are in the Digimon's own `F/NNN.PAK`.
- **Script engine.** The interpreter `0x801e8678` in the overlay `P/SUGSEG.BIN` is the board
  effect engine with 460 variables and more commands (`tools/bscript.py`; `tools/btrace.py`
  prints a script's timeline). A script runs in the frame of its Digimon (`0x801ea258`: origin
  at its feet, turned to its facing), first sets everything up in one go, then says it is
  ready and runs frame by frame. Commands start a motion (the damage motion 4 becomes the KO
  motion 5 when HP is 0), show one Digimon and hide the other, wait, play sounds, and create
  objects that hang on the script's frame, on another object or on a body part of a Digimon.
- **Objects.** Rings, particles and plain nodes are the board ones. New here: a *sprite*
  (`0x801e41ac`, drawn by `0x801eb874`), a flat picture facing the viewer that steps through
  the frames of a sprite chunk, 4 x its size, with the GPU's blend modes; an *effect model*
  (`0x801e38a0`), a model with its own motion from the attack's asset file `E/NNN.PAK`, carried
  by a node and dimmed by its fade; a *light change* (`0x801e76a8`), which swings one of the
  three lights' direction and colour for a number of frames; a *screen rectangle*
  (`0x801e6424`), a blended rectangle whose colour steps between two colours, used for flashes.
- **Movement.** A node's motion type picks how it moves (table `0x800108b0`): fixed, along a
  line to its target, a line with a jump arc, with a sine sway on x or y, turned arcs, random
  shake; other tables say what happens on arrival and when its lifetime ends (freeze, restart,
  hide, fade). Types above 90 start after a delay.
- **Lighting** is the GTE's: back colour (`0x30, 0x30, 0x40`, set at `0x80024440`) plus the
  colour matrix times the clamped light matrix times the normal, with the default lights at
  `0x801ef25c` / `0x801ef27c`.

- **Places.** The battle setup (`0x801edc4c`) puts the turn player's Digimon at z = 750
  facing -z and the other at z = -750 facing it. They stay there: the routine that would walk
  a model along its facing (`0x80021964`) is not called in battle.
- **Camera.** The camera task (`0x800250f4`) follows the model a script puts on screen (a
  Digimon, or an effect model that takes the camera). The last record of every motion key is
  the camera track for that motion: the camera sits at the model's place plus the record's
  offset (mirrored for the Digimon that faces the other way) and is turned by minus the
  record's angles plus that Digimon's facing. It eases between keys like the body parts do.
- **The turn.** The board hands over to the 3D battle once for the whole turn: its state 0x22
  (`0x80038298`) waits 60 frames and runs the switch (`0x8002e26c`), and the battle's entry
  (`0x801eee90`) gives the director both players' HP, damage and flags. The board does not
  come back between the strikes. When it is back, state 0x23 plays none of the strike effects
  (hit, counter hit, Eat-up, Crash, no damage: scripts 0x18-0x1c): it waits 60 frames, sets
  both HP to what the battle left, waits for the two numbers to roll (`0x80038900`) and goes
  on to the KO. Those effects, one strike after the other, are what state 0x23 shows when bit 3 of
  the word at 0x20 of the block at `[0x8006e050]` is set, where state 0x22 skips the switch;
  that bit is taken to be the battle animation option (where it is set was not read).
- **How a strike goes.** The director (`0x801ee3d4`) has three ways. Normally the attack
  script plays, then the hit script on the target, and it waits for the target's damage
  motion (4, or 5 when the hit takes its HP to 0) to finish. An attack that does no damage has
  no script at all: the attacker stands and "Miss!!" is shown (`0x801eee24`). An attack that
  is countered plays only its motion (`0x801eebec`) under "ATTACK!" (`0x801ecc70`); the counter
  attack that follows is a normal strike labelled "COUNTER ATTACK!". When a Digimon is left at
  0 HP the winner is shown alone in its victory motion (6) under "WINNER!!" (`0x801ed97c`).
- **Words on screen.** The director draws them from the battle texture (chunk 104 of
  `A/BATTLE.PAK`: one picture holding several overlaid ones, told apart by 24 palettes that
  sit inside the texture's own area). Each piece slides to a first place, then a second; then
  it fades, or, for "WINNER!!" and "Eat-Up HP", waits and leaves to the right (`0x801ec160`,
  `0x801ec1f4`). Every colour of the texture has the blend bit set, so a piece is mixed with
  the picture by its blend mode after its colours are scaled by its brightness
  (`0x8001c4dc`): "ATTACK!", the type icon, the player label, the HP and the damage are added
  to the picture; the name, the badges, "COUNTER ATTACK!", "Miss!!", "WINNER!!" and "Eat-Up
  HP" are mixed half and half, which is why a fading one ends as a shadow. Sliding pieces
  trail up to six after-images, a quarter added, at the places of the frames before
  (`0x801ebfd4`). The attack banner (`0x801ecf20`) has the player label (1P / Com), "ATTACK!"
  with the attack's type icon, the attack's name, and badges for 1st Attack, Crash and x3.
  During the hit (`0x801ec8a4`, `0x801ec6e0`) the target's HP counts down over 40 frames and
  "DAMAGE nnn pts." comes up piece by piece.
- **Eat-Up HP.** After a hit by an attack with Eat-up, once the target's motion has ended
  and before the winner is shown, `0x801eec3c` shows the attacker with script 998 of
  `A/BATTLE.PAK` (rings closing on it), slides in "Eat-Up HP" (`0x801edb64`) and counts the
  attacker's HP up to its new value with the same counter that counts a target's down.
- **Arenas.** An arena (`0x8002e42c`) is a model from `F/BGnnn.PAK`, drawn turned with the
  camera but not moved by it, behind everything, at the brightness the arena table
  (`0x8006e0c0`) gives; the table also gives the back colour. The game has no depth buffer:
  each polygon goes into an ordering table at its average depth / 4 (`0x8001f728`), the
  arena into the far quarter of it (`0x80024010`), and the table is drawn from the far end,
  the polygons of one entry in the reverse of the order they were sent. An arena's layers
  lie on each other (a sky with clouds over it, a wall with a window in it), so the arena is
  drawn here in exactly that order; the Digimon and the effects use a depth buffer. With no arena named the game
  picks one of twelve at random (table entries 44-55), which is what a match here does
  unless an arena is picked on the start screen (any of the table's 24, which the game
  does not name). The picker's previews are this project's: each arena drawn by the same
  renderer from the middle of it, level, with a wider angle than the battle's
  (`tools/arena_previews.py`).

`tools/build_battle.py` exports all 737 scripts, the 745 asset files and the 24 free-battle
arenas; every Digimon's three attacks run to their end in the browser's dry-run mode
(`DDCB_B3D.attack({dry: true})`).

## Not from the game code

- **Custom cards.** Nothing about a custom card is the game's but what it is made from.
  BlackWarGreymon's numbers (DP 60, +P 20, HP 1750, attacks 950 / 700 / 400), its attack
  names, its colours and its support effect were chosen for this project at the owner's
  request. "Nature Foe x3" is one of the game's ✕ effects. The support effect counts the
  Darkness cards in the own DP Slot, which the game's effect interpreter has no variable
  for: the engine has variables of its own for it, 0x40-0x44 for the number of cards of
  each Specialty in the own DP Slot and 0x48-0x4c for the opponent's (the game's end at
  0x1c). The effect is written like Imperialdramon's and has its tier, 1. An attack of a
  custom card can name the colour family of the enhanced effects (`accent`), which is
  otherwise taken from the attack's name. How a script's colours are changed is this
  project's too: the values are followed through the script from the top, and a colour
  that is computed or set under a test would be left as it is (none of BlackWarGreymon's
  is; the builder runs both scripts and compares every object's colours).

- **Mobile setup controls.** On screens up to 900px wide, the sticky setup bar shows
  Settings, Random opponent and Start battle. Settings opens a scrollable panel above
  the bar for the existing battle and graphics options. This is a browser layout choice.

- **Enhanced battle visuals.** Higher rendering resolution, curved mesh subdivision,
  crease normals, interpolated palette colours, procedural surface materials, rim/specular
  lighting, bloom, attack-family particles and hit sparks are this project's new art
  direction, requested as an alternative to the PS1 visuals. Ultra's shadow maps,
  effect lighting, trails and shockwaves extend that direction. Material and attack-family
  assignments are name-based presentation choices, not recovered game data. This improves
  the existing models; it does not replace them with individually sculpted modern models
  or newly painted high-resolution textures. The attack preview and its fixed damage are
  also this project's tools.

- **Upscaled arenas.** The 4× RealESRGAN arena atlases are derived from the original game's
  textures. Their inferred fine detail and smooth filtering are an optional authored
  presentation for Enhanced and Ultra, while Original PS1 retains the source assets.

- **Screen arrangement.** The battle screen uses the game's own textures (`B/CBTL_SYS.ARC`)
  on its 320×240 screen, and slot/bar positions inside each texture are measured from the
  art. Where each texture sits on screen is this project's arrangement; the draw code was
  not traced. Labels and numbers are redrawn as text.
- **Attack panel.** While you choose an attack, the game's attack panel (texture 13: three
  attack rows and a "SPECIAL EFFECT" field) is drawn over the hand slots, which it matches
  in width exactly; "View Cards" hides it. That placement is inferred from the sizes.
- **Sound details.** Which of tracks 149/150 is the win and which the loss is inferred
  (150 only plays in one-player mode when a flag is set, so it is used for a loss). Script
  frames are timed at 60 per second. Reverb is not modelled. The 3D battle's track starts
  when the turn's first scene is on screen. Its volume of 100 out of 127 is applied as
  a plain factor (how the sound library folds a track's volume into a note was not read), and
  the four frames the game waits after stopping a track are left out. Card sounds are
  triggered by comparing the board before and after each step; when several cards move at
  once they are spaced 8 frames apart, which is this project's choice. Two more uses of
  these sounds have nothing to attach to here and are left out: `A7` when the side panels
  slide in (`0x8003dd9c`, `0x8003e11c`) and `A6` when the Digimon cards turn for the switch
  to the battle scene (state 0x20).
- **Effect details.** Effects are drawn on a 320×240 layer added to the board. The camera is
  taken as looking straight at the board (the card coordinates fit that, but the camera
  object was not read), particle lines are blended additively (their blend mode comes from
  whatever was drawn before them), and a tinted card is only brightened, at a speed chosen
  here. Text labels the scripts put on cards are replaced by this project's captions. A card
  slides in a straight line at constant speed; the game's exact path was not read.
- **Polygon Battle staging.** Each strike is shown as its own scene from the Digimon's home
  places; the game runs a whole battle turn in one scene with an intro (script 999), which
  is not played. The scenes of a turn follow each other with a cut; the last picture of one
  stays up until the next is ready. The two lines of text under the board after the battle
  (each strike's damage) are this project's. The attack's name is drawn as plain text where the game shows a name plate
  from a strip of video memory whose source was not found. The words are drawn from a copy
  of the game's texture enlarged four times by an upscaling model, over a scene that keeps
  the game's 320x240 in Original PS1 mode. Before a
  script puts its model on screen, and for a model without a camera track, the camera is this
  project's. Arenas that animate their palette are shown still, and the arena an opponent's
  deck names (byte 106, entries 32-43 of the table) is not used: a match takes the arena
  picked on the start screen or the random free-battle one.
- **Polygon Battle gaps.** Three object types are created but not drawn yet: palette
  changes (type 1) and two textured kinds (10 and 12). Rings that ask for a texture are drawn plain. Effect models fade by brightness
  only, and texture animation on them is not played. A few commands whose routines were not read are ignored (among them
  `a.6` and `b.0`), "place where that object is" (`b.13`) is done in the script's frame, and
  arrival at a target is judged by distance travelled. The alternate models in archive `G`
  are not used, and five models whose palette is not in their own file fall back to their
  texture's first palette. Sounds named by motions are not played; sounds named by scripts
  are, where the sound bank has them.
- **Taking back in the Digivolve Phase.** In the game, answering No to "Is it OK to end the
  Digivolve Phase?" (or backing out of the digivolve choice) returns the DP card placed this
  turn and an option card used to no effect to the hand and starts the phase again
  (`0x801ecd68`); what a digivolution already made leaves to take back was not traced. Here
  a card that was placed stays placed.
- **Looking into the piles.** The Offline view and the list of what is left in a deck are
  this project's; whether and how the game shows them was not traced. The deck list gives
  nothing away that the table does not already show: both hands are open here and the decks
  are the game's own lists. It is sorted, not in draw order, and a support card lying face
  down from the deck is still counted as in the deck.
- **New card art.** With "Card art: New" the 191 Digimon cards show illustrations of the
  modern Digimon Card Game (2020) in the game's card frame: for 182 of them a square cut out
  of a card picture from the official card list (world.digimoncard.com), and for the nine
  that have no card in that game (BomberNanimon, Yanmamon, J-Mojyamon, NiseDrimogemon,
  ShimaUnimon, MudFrigimon, SandYanmamon, Baronmon, Tylomon) the picture of the Digimon
  Reference Book (digimon.net). Cards are matched by name, with the game's older names
  taken to today's (Goburimon = Goblimon, Rockmon = Golemon, Zassomon = Weedmon, Raidramon
  = Lighdramon, R-Gatomon = Gatomon and so on); RealMetalGreymon and MetalGreymon are the
  Vaccine and the Virus MetalGreymon, Omnimon I and II two different Omnimon cards.
  `tools/new_art.json` names the card and the square for each. Squares were placed by eye
  to centre the Digimon; where that takes in part of the card's own print (a cost circle at
  the left edge, a line of rules text at the foot) it is left in rather than moving the
  Digimon off centre. The 110 option cards have no counterpart and keep the game's pictures. "Legacy"
  shows the game's pictures for every card.
- **Deck editor screen.** The rules above are the game's; the screen, the search, the
  filters, undo, and the list and code a deck is exported as are this project's. The game's
  editor only offers the cards a save holds ("Cards in Stock": a working copy at `0x801f3f48`,
  filled from the save by `0x80045f5c`, from which `0x801eda88` takes one for each card put
  in). There is no collection here, so every card is on offer, the six partner Rookies
  included: how many of those a save holds was not traced, and here the check that allows 4
  of a card is the only limit on them. A deck's armor form is one choice for the whole deck,
  as in a `DECK2.DEK` record; how the game's own editor stores it ("Armor Change with L1 &
  R1") was not traced. How each key of the game's sort menu orders the cards was not read
  either: here they sort by the value they name. The game also offers "Auto Deck" and
  starting from a "Base Deck"; only the second has a counterpart here (Copy and edit).
- **Opponent AI** is new; the game's AI overlay (`SAISEG`) was not ported. In the Digivolve
  Phase it sends one card to the DP Slot every turn until the slot holds the highest DP a
  card of the next level in its hand or deck asks for, and digivolves as soon as it can.
- **Hands shown face up** rests on the card-state byte being the same for both players'
  hand cards, and on how the game plays; the drawing code was not read.
- Who takes the first turn is random here; the game has you pick a card for it.
- Left out: partner Digi-Parts and levelling, the bonus the game tracks when HP lands on a
  multiple of 1110, undoing an entrance or digivolution.

## Rebuild from the disc

### The disc

Everything here was read from one disc image: *Digimon Digital Card Battle* (USA),
SLUS-01328, as a single-track `.bin` of raw 2352-byte sectors. Every address and file
offset in the tools and in this document is for that build.

| | |
|---|---|
| Size | 215,661,936 bytes (91,693 sectors) |
| CRC-32 | `2cd0aad9` |
| MD5 | `3170c2d81cb4c28b9d7924ddbf4a831d` |
| SHA-1 | `b3945b3e76c1fcc554a7614e2b4211d974990105` |
| SHA-256 | `345ea3e1ce1140e0483afaa63b902773ec32fc04ba414e8042968b6de84c4bf1` |

An image in another format (2048-byte sectors, CHD, a different rip) will not have these
hashes even when the game is the same. The boot file inside it tells: `SLUS_013.28`,
428,032 bytes, SHA-1 `fa4e03b5e0671dce399a35f2747080ced492d2c3`
(MD5 `57df71732a052dc774d8745e77b59bf5`). `tools/extract_iso.py` prints both comparisons
when it unpacks an image.

### Steps

```bash
python -m venv tools/.venv
tools/.venv/Scripts/python -m pip install -r tools/requirements.txt
python tools/extract_iso.py "<path>/Digimon Digital Card Battle.bin" extracted/disc
python tools/extract_drv.py extracted/disc extracted/drv
tools/.venv/Scripts/python tools/build_data.py extracted web        # cards and decks
tools/.venv/Scripts/python tools/upscale_assets.py extracted web    # art and UI, needs ComfyUI
tools/.venv/Scripts/python tools/build_audio.py extracted web       # music and sound effects
tools/.venv/Scripts/python tools/build_effects.py extracted web     # battle effect scripts
tools/.venv/Scripts/python tools/build_models.py extracted web      # 3D models, textures, motions
tools/.venv/Scripts/python tools/build_battle.py extracted web      # battle scripts, attack assets
tools/.venv/Scripts/python tools/arena_previews.py web              # arena previews, drawn in a browser
tools/.venv/Scripts/python tools/build_new_art.py extracted web     # new card art, needs the internet and ComfyUI
tools/.venv/Scripts/python tools/build_custom.py extracted web      # the custom cards' models, effects and pictures, needs ComfyUI
```

`build_data.py` and `build_battle.py` write the custom cards' records and battle scripts
along with the game's; `build_custom.py` makes the rest (and those two again), or one part
of it: `data`, `model`, `battle`, `art`. Only `art` needs ComfyUI. `tools/custom_look.py`
shows a model's texture with its palettes, the game's pictures of a card under a recolour,
and the colours a card's battle scripts use, for writing a recolour.

`upscale_assets.py` sends the 64×64 card art, the 40×40 board art and the battle textures
through a local ComfyUI (`http://127.0.0.1:8188`, model `RealESRGAN_x4plus`) for a 4×
upscale.

`build_new_art.py` is the only step that does not read the disc: it downloads the card
pictures named in `tools/new_art.json` (once, into `extracted/newart`), cuts the squares
out, upscales them 4× through the same ComfyUI model and writes 512×512 and 160×160 files.

## Layout

| Path | What |
| --- | --- |
| `web/js/engine.js` | Rules engine (port of the traced routines) |
| `web/js/ai.js` | Computer opponent |
| `web/js/decks.js` | Deck rules (from the game's editor), card search, deck export and import |
| `web/js/editor.js` | Deck editor screen |
| `tools/decktest.js` | Checks of the deck rules, the search and export/import |
| `web/js/ui.js`, `web/css/style.css`, `web/index.html` | Front end |
| `web/js/data/cards.js` | Generated: the game's 301 cards and 159 decks, and the custom cards |
| `tools/custom_cards.json`, `custom.py`, `build_custom.py`, `custom_look.py`, `tools/custom/` | The custom cards: their list, the recolouring, the builder, a viewer, their picture sources |
| `web/assets/art`, `mini`, `ui` | Generated: upscaled card art and battle textures |
| `web/assets/art2`, `mini2` | Generated: new art for the Digimon cards (`tools/build_new_art.py`, `tools/new_art.json`) |
| `tools/check_paths.py` | Checks that every file the page asks for is in git under its exact name |
| `tools/mips.py` | MIPS disassembly helper for the EXE and overlays (overlay base `0x801DDF38`) |
| `tools/extract_*.py`, `tim.py`, `comfy.py` | Disc, archive, texture and ComfyUI helpers |
| `tools/psxsnd.py`, `lzh.py`, `build_audio.py` | Sound: SEQ/VAB synthesiser, unpacker, audio build |
| `web/js/audio.js`, `web/assets/audio` | Sound playback and the generated music/effects |
| `web/js/effects.js`, `web/js/data/effects.js` | Effect engine port and the generated effect scripts |
| `tools/effscript.py`, `build_effects.py`, `fxtest.js` | Effect script parser, export and headless check |
| `web/js/battle3d.js`, `web/assets/models` | Polygon Battle: model/motion player and the generated models |
| `tools/pak.py`, `omd.py`, `build_models.py` | PAK chunks, model and motion formats, model export |
| `tools/bscript.py`, `btrace.py`, `build_battle.py` | Battle script parser, tracer, script and asset export |
| `web/assets/battle` | Generated: battle scripts and attack effect assets |
| `tools/lift.py`, `emu.py` | Compact MIPS listing and Unicorn runner used while reading the engine |
| `extracted/` | Working copy of the disc and disassembly notes (about 270 MB, safe to delete) |

## File formats

- `.bin` is MODE2/2352; ISO9660 holds `SLUS_013.28` plus `A`–`G`,`P`.DRV archives.
- DRV: 32-byte entries `{u8 kind (0x80 dir, 0x01 file), char ext[3], u32 sector, u32 size, u32 time, char name[16]}`.
- ARC: u32 offset table, members are TIM images.
- `B/CARD2.CDD`: 191 Digimon records (316 bytes), 102 option records (226), 8 digivolve records (112).
- `B/DECK2.DEK`: 110-byte records: 30 card ids, deck name, owner, rank, armor byte.
