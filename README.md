# Digital Card Battle — web card battle

A browser version of the card battle from *Digimon Digital Card Battle* (PS1, SLUS-01328),
rebuilt from data, rules and graphics recovered from the disc image. Card battle only: no
story mode, no deck editor, no partner customisation.

All card data, art, UI textures and audio (`web/js/data/`, `web/assets/`) are generated
from the disc image (SLUS-01328, US release) and are committed, so a clone runs as is.
"Rebuild from the disc" shows how they were made.

## Play

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory web
```

Then open <http://localhost:8765/>. Pick one of the game's decks for yourself and one of
its opponents, choose the opponent skill, and start. Sound needs the page served over
HTTP as above; the Sound box in the side rail mutes it.

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

1. One Digimon card to the DP Slot (8 cards max; DP = sum of +P, capped at 90).
2. One digivolve option card. Digi-devolve and De-Armor act at once; the others ask for a
   target. Using an option card ends the phase.
3. Normal digivolution, repeatable while legal: R→C→U, same current Specialty, DP ≥ cost.

Legality is `0x801e9f5c`. Digivolving gives the new card's full stats and empties the DP
Slot (`0x801ece24`); Speed and Download keep the DP Slot. Speed is refused in an abnormal
state. Digi-devolve doubles the lower form's HP.

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
  the opponent already has 2 KOs. An armor Digimon falls back to its Rookie form. Otherwise
  the whole stack goes Offline. Three KOs win; a KO'd player with no Digimon in play, none
  in hand and an empty Online deck also loses.
- End of turn: supports go Offline, the turn passes.

**Support effects** are bytecode: two 32-byte conditions and three 16-byte actions per card.
`0x801e7dd4` reads 29 variables, `0x801e9abc` does the arithmetic (add/multiply cap at 9990,
subtract floors at 0, divide rounds down to tens with a minimum of 10), `0x801e9bac`
compares, `0x801e81dc` executes 54 opcodes. One card (Aquilamon) ships with comparison
operator `0xFF`, so its effect never fires; kept as is.

`node tools/selftest.js` checks 19 of these behaviours; `node tools/sim.js 300` plays
AI-vs-AI matches and checks card-count invariants.

## Sound

Music and effects are rendered offline from the disc's own data by `tools/build_audio.py`.

- `A/BGM/BGMnn.PAK` and `A/SE0.PAK` are chunk lists: type 6 = SEQ score, 7 = VAB header,
  8 = VAB samples. `tools/psxsnd.py` decodes the ADPCM samples and plays the scores with a
  software synthesiser (SPU ADSR rates, libsnd pitch formula from `0x80053984`, score loop
  markers). Rendered music lands on the equal-tempered grid within about 10 cents.
- **Battle music:** the battle start routine (`0x801f1aa8`) loads the track named in byte 104
  of the opponent's `DECK2.DEK` record; with none named it picks 143 or 144. The end of the
  match (`0x801f2a40`) plays 149 or 150.
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

## Not from the game code

- **Screen arrangement.** The battle screen uses the game's own textures (`B/CBTL_SYS.ARC`)
  on its 320×240 screen, and slot/bar positions inside each texture are measured from the
  art. Where each texture sits on screen is this project's arrangement; the draw code was
  not traced. Labels and numbers are redrawn as text.
- **Attack panel.** While you choose an attack, the game's attack panel (texture 13: three
  attack rows and a "SPECIAL EFFECT" field) is drawn over the hand slots, which it matches
  in width exactly; "View Cards" hides it. That placement is inferred from the sizes.
- **Sound details.** Which of tracks 149/150 is the win and which the loss is inferred
  (150 only plays in one-player mode when a flag is set, so it is used for a loss). Script
  frames are timed at 60 per second. Reverb is not modelled. The second per-opponent track
  (deck byte 105) belongs to the 3D "polygon battle" and is not used. Card sounds are
  triggered by comparing the board before and after each step; when several cards move at
  once they are spaced 8 frames apart, which is this project's choice. Two more uses of
  these sounds have nothing to attach to here and are left out: `A7` when the side panels
  slide in (`0x8003dd9c`, `0x8003e11c`) and `A6` when the Digimon cards turn for the switch
  to the battle scene (state 0x20).
- **Opponent AI** is new; the game's AI overlay (`SAISEG`) was not ported.
- **Hands shown face up** rests on the card-state byte being the same for both players'
  hand cards, and on how the game plays; the drawing code was not read.
- Who takes the first turn is random here; the game has you pick a card for it.
- Left out: partner Digi-Parts and levelling, the bonus the game tracks when HP lands on a
  multiple of 1110, undoing an entrance or digivolution, battle animations.

## Rebuild from the disc

```bash
python -m venv tools/.venv
tools/.venv/Scripts/python -m pip install -r tools/requirements.txt
python tools/extract_iso.py "<path>/Digimon Digital Card Battle.bin" extracted/disc
python tools/extract_drv.py extracted/disc extracted/drv
tools/.venv/Scripts/python tools/build_data.py extracted web        # cards and decks
tools/.venv/Scripts/python tools/upscale_assets.py extracted web    # art and UI, needs ComfyUI
tools/.venv/Scripts/python tools/build_audio.py extracted web       # music and effects
```

`upscale_assets.py` sends the 64×64 card art, the 40×40 board art and the battle textures
through a local ComfyUI (`http://127.0.0.1:8188`, model `RealESRGAN_x4plus`) for a 4×
upscale.

## Layout

| Path | What |
| --- | --- |
| `web/js/engine.js` | Rules engine (port of the traced routines) |
| `web/js/ai.js` | Computer opponent |
| `web/js/ui.js`, `web/css/style.css`, `web/index.html` | Front end |
| `web/js/data/cards.js` | Generated: 301 cards, 159 decks |
| `web/assets/art`, `mini`, `ui` | Generated: upscaled card art and battle textures |
| `tools/mips.py` | MIPS disassembly helper for the EXE and overlays (overlay base `0x801DDF38`) |
| `tools/extract_*.py`, `tim.py`, `comfy.py` | Disc, archive, texture and ComfyUI helpers |
| `tools/psxsnd.py`, `lzh.py`, `effscript.py`, `build_audio.py` | Sound: SEQ/VAB synthesiser, unpacker, effect scripts, audio build |
| `web/js/audio.js`, `web/assets/audio` | Sound playback and the generated music/effects |
| `extracted/` | Working copy of the disc and disassembly notes (about 270 MB, safe to delete) |

## File formats

- `.bin` is MODE2/2352; ISO9660 holds `SLUS_013.28` plus `A`–`G`,`P`.DRV archives.
- DRV: 32-byte entries `{u8 kind (0x80 dir, 0x01 file), char ext[3], u32 sector, u32 size, u32 time, char name[16]}`.
- ARC: u32 offset table, members are TIM images.
- `B/CARD2.CDD`: 191 Digimon records (316 bytes), 102 option records (226), 8 digivolve records (112).
- `B/DECK2.DEK`: 110-byte records: 30 card ids, deck name, owner, rank, armor byte.
