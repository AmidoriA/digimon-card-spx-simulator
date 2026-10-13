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

The online copy can be installed from Chrome (Install app / Add to Home screen):
`web/manifest.webmanifest`, `web/sw.js` and the icons in `web/icons/` (made by
`tools/build_icons.py` from `tools/icon_source.jpg`) are what Chrome asks for. The service
worker asks the network first and keeps what was loaded as the fallback, so a reload still
gets the newest scripts and what has been used opens offline; nothing is fetched ahead of time.

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

## Decks and their owners

Every deck on the start screen is shown with its owner's picture: the one the game puts on
the "VS" screen before a battle.

- The screen is set up by the task at `0x801eda84` (`P/KAWSEG.BIN`, started from
  `0x801f003c`, which the battle start calls at `0x8003ed2c`). It loads
  `B:\MATCH\%3.3d.ARC` and sends every member to video memory at the place its own
  header names (`0x8001b438`).
- The number is the opponent's deck number: byte 4 of the opponent block at `[0x8006e054]`,
  which `0x80041794` sets together with the copy of that deck's `DECK2.DEK` record. A free
  battle (first argument 0) loads archive 999 instead.
- An archive has 14 textures. Members 11 and 12 are the two pictures, 128x112 in 256 colours
  (video memory 320,0 and 320,112): 11 is the player, the same in all 142 archives, and 12
  the owner. Member 13 is the owner's name as a picture, and in archive 999 member 12 is a
  second player. Which member is which was read from the files, not from the drawing code.
- There are archives for decks 0-141 except 76 (Tentomon's "No Can Do"), so 141 decks have
  a picture, 118 different ones: an owner's decks mostly share one, but Devimon, Myotismon
  and Gatomon have two, and Apokarimon's first deck has its own.
- The owner's name is a string at byte 79 of the deck record, copied whole as the
  opponent's name (the `strcpy` at `0x8003fdd4`).

`tools/build_owners.py` writes the pictures to `web/assets/owner/`, once each under the
lowest deck number that has it, enlarged 4x to 512x448 through ComfyUI, and `build_data.py`
gives each deck that number as `pic`.

Under a deck's name are the Specialties it plays, each with the number of the deck's
Digimon cards that have it, the most first (a card's Specialty is the high half of byte
`0x1A` of its `CARD2.CDD` record; option cards have none). The search boxes over the lists
find a deck by a Specialty as well as by its name or its owner.

A card in a deck's contents opens with a click (or Enter): its picture, Specialty and
level, HP, DP and +P, the three attacks with their power, the support effect, what its ✕
effect does, and how many of it the deck holds. The cards of the Offline pile and of what
is left of a deck during a battle open the same way. It is the card panel of the deck
editor, shown in a dialog.

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

`node tools/decktest.js` checks the rules against all 159 decks of the game and the custom one, the search and
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

`node tools/selftest.js` checks these behaviours (27 checks, the custom card and deck among them);
`node tools/sim.js 300` plays AI-vs-AI matches and checks card-count invariants.

## Custom cards

Cards that are not on the disc. Each is made from a card of the game: it has that card's
model, motions and battle scripts in other colours, and numbers and an effect of its own.
`tools/custom_cards.json` lists them; `tools/build_custom.py` makes their files (see
"Rebuild from the disc"). They follow the game's 301 cards from number 301, their models
the game's from 400, and their battle scripts and effect files carry the number of the
script they were made from plus 10000 for the first custom card, 20000 for the second.
The deck editor offers them like any other card; no deck of the game holds one.

A **custom deck** is a deck of the game with some of its cards exchanged; the list names it
with its base and the exchange. It follows the game's 159 decks and keeps its base's owner,
rank, armor form and music. There is one: **Black Fire Again**, BK WarGreymon's second
deck, which is his Black Fire Heart with its four WarGreymon exchanged for four
BlackWarGreymon. Black Fire Heart itself is as the game has it.

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

Custom picture sources (`art.new`) accept exactly one of `file` + `crop` (a picture under `tools/`, with native pixel coordinates), `card` + `crop` (the official Digimon Card Game card number, normalized to 430×600), or `ref` (the official Digimon Reference Book slug). For example, `{"card":"BT2-009","crop":[85,90,320]}` or `{"ref":"crescemon"}`. The internet forms reuse `build_new_art.source` and cache downloads in `extracted/newart/cards` or `ref`; they go through the same ComfyUI 4× upscale and 512×512/160×160 output as file sources. Selecting a source does not itself create a custom card.

### Time Stranger cards

Owner update (2026-10-14, TS-106): all 45 cards have newly designed HP, DP, +P,
three attack powers, cross and support effects. Their Specialty themes, cited official
lore, exact values and tradeoffs are in [card-design.md](docs/time-stranger/card-design.md).
The initial unchanged-base-stat requirement is superseded. Models are recoloured disc
placeholders, with the base's
shape and motions, pending Phase 2. Attack-name evidence and the chosen three-slot
mapping are in [attack-sources.md](docs/time-stranger/attack-sources.md).

Owner update (2026-10-13): use one prepared TS-002 picture for Legacy and New.
`art.shared: true` preserves the approved native crop (430px; Crescemon and Keramon 320px), writes
identical full-size files to `art`/`art2` and identical 160px thumbnails to `mini`/`mini2`.
No separate Legacy recolour, enlargement or new ComfyUI generation is performed.
Other custom cards retain their existing build path. Cached edited sources are hash
checked before every build. Rebuild with `build_custom.py <extracted> web art <ids>`.

| Id | Card | Specialty / level | Base (id) | Placeholder model | Picture | Time Stranger source |
|---|---|---|---|---|---|---|
| 302 | Guilmon | Fire / R | Agumon (27) | 401 | card `BT2-009`, edit 302 | [064 · Virus](https://digimon.jsuk.cloud/en/d/guilmon/) |
| 303 | Coronamon | Fire / R | Goburimon (33) | 402 | card `EX5-007`, edit 303 | [024 · Vaccine](https://digimon.jsuk.cloud/en/d/coronamon/) |
| 304 | Huckmon | Fire / R | Veemon (175) | 403 | card `BT7-009`, edit 304 | [052 · Data](https://digimon.jsuk.cloud/en/d/huckmon/) |
| 305 | Growlmon | Fire / C | Greymon (14) | 404 | card `BT2-013`, edit 305 | [145 · Virus](https://digimon.jsuk.cloud/en/d/growlmon/) |
| 306 | Firamon | Fire / C | Centarumon (19) | 405 | card `EX5-008`, edit 306 | [100 · Vaccine](https://digimon.jsuk.cloud/en/d/firamon/) |
| 307 | BaoHuckmon | Fire / C | Flarerizamon (26) | 406 | card `BT6-011`, edit 307 | [133 · Data](https://digimon.jsuk.cloud/en/d/baohuckmon/) |
| 308 | WarGrowlmon | Fire / U | MetalGreymon (9) | 407 | card `EX2-010`, edit 308 | [294 · Virus](https://digimon.jsuk.cloud/en/d/wargrowlmon/) |
| 309 | Flaremon | Fire / U | Garudamon (7) | 408 | card `EX5-012`, edit 309 | [219 · Vaccine](https://digimon.jsuk.cloud/en/d/flaremon/) |
| 310 | SaviorHuckmon | Fire / U | Paildramon (4) | 409 | card `ST12-08`, edit 310 | [240 · Data](https://digimon.jsuk.cloud/en/d/saviorhuckmon/) |
| 311 | Gaomon | Ice / R | Gabumon (62) | 410 | card `BT4-021`, edit 311 | [041 · Data](https://digimon.jsuk.cloud/en/d/gaomon/) |
| 312 | Lunamon | Ice / R | Penguinmon (64) | 411 | card `EX5-016`, edit 312 | [057 · Data](https://digimon.jsuk.cloud/en/d/lunamon/) |
| 313 | Syakomon | Ice / R | Betamon (63) | 412 | card `EX5-056`, edit 313 | [067 · Virus](https://digimon.jsuk.cloud/en/d/syakomon/) |
| 314 | Gaogamon | Ice / C | Garurumon (46) | 413 | card `EX4-017`, edit 314 | [114 · Data](https://digimon.jsuk.cloud/en/d/gaogamon/) |
| 315 | Lekismon | Ice / C | Sorcerimon (57) | 414 | card `EX5-017`, edit 315 | [137 · Data](https://digimon.jsuk.cloud/en/d/lekismon/) |
| 316 | Octomon | Ice / C | Gesomon (51) | 415 | card `BT6-023`, edit 316 | [142 · Virus](https://digimon.jsuk.cloud/en/d/octomon/) |
| 317 | MachGaogamon | Ice / U | WereGarurumon (39) | 416 | card `EX4-019`, edit 317 | [258 · Data](https://digimon.jsuk.cloud/en/d/machgaogamon/) |
| 318 | Crescemon | Ice / U | Panjyamon (41) | 417 | ref `crescemon` | [237 · Data](https://digimon.jsuk.cloud/en/d/crescemon/) |
| 319 | Dragomon | Ice / U | Zudomon (40) | 418 | card `BT6-026`, edit 319 | [282 · Virus](https://digimon.jsuk.cloud/en/d/dragomon/) |
| 320 | Renamon | Nature / R | Gatomon (184) | 419 | card `BT10-032`, edit 320 | [058 · Data](https://digimon.jsuk.cloud/en/d/renamon/) |
| 321 | Terriermon | Nature / R | Patamon (183) | 420 | card `EX2-025`, edit 321 | [027 · Vaccine](https://digimon.jsuk.cloud/en/d/terriermon/) |
| 322 | Lalamon | Nature / R | Palmon (98) | 421 | card `BT4-052`, edit 322 | [056 · Data](https://digimon.jsuk.cloud/en/d/lalamon/) |
| 323 | Kyubimon | Nature / C | Unimon (88) | 422 | card `BT5-038`, edit 323 | [117 · Data](https://digimon.jsuk.cloud/en/d/kyubimon/) |
| 324 | Gargomon | Nature / C | Leomon (85) | 423 | card `BT3-048`, edit 324 | [086 · Vaccine](https://digimon.jsuk.cloud/en/d/gargomon/) |
| 325 | Sunflowmon | Nature / C | Togemon (84) | 424 | card `BT4-054`, edit 325 | [120 · Data](https://digimon.jsuk.cloud/en/d/sunflowmon/) |
| 326 | Taomon | Nature / U | Angewomon (77) | 425 | card `BT5-041`, edit 326 | [242 · Data](https://digimon.jsuk.cloud/en/d/taomon/) |
| 327 | Rapidmon | Nature / U | MagnaAngemon (75) | 426 | card `BT3-052`, edit 327 | [227 · Vaccine](https://digimon.jsuk.cloud/en/d/rapidmon/) |
| 328 | Lilamon | Nature / U | Lillymon (78) | 427 | card `BT4-059`, edit 328 | [262 · Data](https://digimon.jsuk.cloud/en/d/lilamon/) |
| 329 | Keramon | Darkness / R | Tsukaimon (135) | 428 | card `EX1-044`, crop `[80,105,320]`, unedited | [080 · Unknown](https://digimon.jsuk.cloud/en/d/keramon/) |
| 330 | Monodramon | Darkness / R | Veemon (175) ✱ | 429 | card `BT1-009`, edit 330 | [037 · Vaccine](https://digimon.jsuk.cloud/en/d/monodramon/) |
| 331 | Dracmon | Darkness / R | DemiDevimon (132) | 430 | card `ST6-04`, edit 331 | [070 · Virus](https://digimon.jsuk.cloud/en/d/dracmon/) |
| 332 | Kurisarimon | Darkness / C | Bakemon (123) | 431 | card `BT2-059`, edit 332 | [178 · Unknown](https://digimon.jsuk.cloud/en/d/kurisarimon/) |
| 333 | Strikedramon | Darkness / C | Darkrizamon (130) | 432 | card `EX2-032`, edit 333 | [093 · Vaccine](https://digimon.jsuk.cloud/en/d/strikedramon/) |
| 334 | Sangloupmon | Darkness / C | Gururumon (126) | 433 | card `BT9-073`, edit 334 | [153 · Virus](https://digimon.jsuk.cloud/en/d/sangloupmon/) |
| 335 | MetalTyrannomon | Darkness / U | MasterTyrannomon (8) ✱ | 434 | card `BT1-024`, edit 335 | [295 · Virus](https://digimon.jsuk.cloud/en/d/metaltyrannomon/) |
| 336 | Cyberdramon | Darkness / U | Andromon (116) | 435 | card `EX3-050`, edit 336 | [210 · Vaccine](https://digimon.jsuk.cloud/en/d/cyberdramon/) |
| 337 | Matadormon | Darkness / U | Myotismon (111) | 436 | card `BT9-077`, edit 337 | [290 · Virus](https://digimon.jsuk.cloud/en/d/matadormon/) |
| 338 | Dracomon | Rare / R | ClearAgumon (168) | 437 | card `ST1-04`, edit 338 | [049 · Data](https://digimon.jsuk.cloud/en/d/dracomon/) |
| 339 | Bearmon | Rare / R | Psychemon (170) | 438 | card `BT9-057`, edit 339 | [035 · Vaccine](https://digimon.jsuk.cloud/en/d/bearmon/) |
| 340 | Kudamon | Rare / R | Vi-Elecmon (169) | 439 | card `P-043`, edit 340 | [022 · Vaccine](https://digimon.jsuk.cloud/en/d/kudamon/) |
| 341 | Coredramon (Blue) | Rare / C | Rockmon (159) | 440 | card `EX3-018`, edit 341 | [091 · Vaccine](https://digimon.jsuk.cloud/en/d/coredramon-blue/) |
| 342 | Grizzlymon | Rare / C | Ankylomon (151) | 441 | card `BT9-060`, edit 342 | [089 · Vaccine](https://digimon.jsuk.cloud/en/d/grizzlymon/) |
| 343 | Reppamon | Rare / C | ShimaUnimon (162) | 442 | card `BT1-051`, edit 343 | [110 · Vaccine](https://digimon.jsuk.cloud/en/d/reppamon/) |
| 344 | Wingdramon | Rare / U | Gigadramon (5) ✱ | 443 | card `ST8-07`, edit 344 | [200 · Vaccine](https://digimon.jsuk.cloud/en/d/wingdramon/) |
| 345 | GrapLeomon | Rare / U | Etemon (150) | 444 | card `BT4-057`, edit 345 | [205 · Vaccine](https://digimon.jsuk.cloud/en/d/grapleomon/) |
| 346 | Chirinmon | Rare / U | MetalGarurumon (37) ✱ | 445 | card `EX5-031`, edit 346 | [213 · Vaccine](https://digimon.jsuk.cloud/en/d/chirinmon/) |

### Local picture restoration (TS-004)

`tools/comfy.py` now exposes `inpaint(image, mask, prompt, seed=...)` with the stored stock-node workflow `tools/comfy_workflows/ts002-inpaint.json` and installed `512-inpainting-ema.safetensors` checkpoint. White mask pixels may change; black mask pixels are preserved exactly. It samples at 512×512 and composites only the masked result back at native size. The existing RealESRGAN_x4plus upscaler is unchanged. The optional `outpaint(image, (left, top, right, bottom), prompt, seed=...)` protects the original image and generates only added padding; its tested Coronamon extensions introduced a pale border and were rejected for use. No selected TS-002 picture uses that outpaint helper: the approved margin restorations use explicitly masked inpainting. New extension jobs require visual review, not blind reuse of that trial.

Recipes are in `tools/new_art_edits.json`; original downloads, chosen edited PNGs, before/mask PNGs and hash metadata stay in `extracted/newart/edited/ts002`. `tools/prepare_time_stranger_art.py` reuses a verified result unless `--force` is requested. To use a recorded edited crop, add `"edited":"edited/ts002/303.png"` to its `art.new` card/crop source. `build_custom.py` verifies the recorded source/crop, recipe/workflow and cached pixel hashes before using the already-cropped image; it does not crop it a second time. Missing, stale, mismatched or outside-cache references fail with a preparation instruction.

Two independently uploaded Coronamon jobs through the public inpaint API produced identical decoded pixels, SHA-256 `96b5cbc7c0e3e262e468c2c45f8df704771a5fc0207ba1ea7371cb5e666d99ce`, matching the earlier accepted result. One initial job after switching between upscaling and inpainting models had a different pixel hash, then consecutive independent runs matched again. A fixed seed is therefore not a guarantee across model reloads, GPU execution or software changes; the chosen cached PNG and its verified hashes are authoritative for exact rebuilds. The owner saw and accepted Coronamon before/after on 2026-10-13. Every selected restoration is named in roster.md and the picture-preparation entry under "Not from the game code".

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
motions. It also plays every motion of Agumon that stops and compares its length with the
one `tools/motion_slots.py` measured (`docs/time-stranger/motion-slots.json`), and checks
that a motion started again starts again, that a hidden or a held model waits, and that
effect models take the constant-speed path. It checks CPU
animation logic; real shader linking and visual appearance are
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
- **The eight motion slots.** A motion's chunk number in the Digimon's file is all the code
  knows it by (the table at `0x2220` of the model's block, filled by `0x80023094`). Only one
  is unpacked at a time: starting another frees it and unpacks the new one (`0x8002daac`).

  | Slot | What | Started by | Where |
  |---|---|---|---|
  | 0 | Standing | The director: for the Digimon a script is about to play on; for the attacker when the hit script is over; for a target left alive; for an attack that does no damage; when the entrance is over. The scripts: `b.2 [0]`, which the attack scripts end with | `0x801ee00c`; `0x801ee86c`, `0x801ee9ec`; `0x801ee904`, `0x801eea8c`, `0x801eeabc`; `0x801eee50`; `0x801ed934` |
  | 1, 2, 3 | The card's first, second and third attack | The attack script (`b.2 [1]` … `[3]`, at frame 1 of the script for 563 of the 573 attacks). For an attack that is countered, which has no script, the director: attack number + 1 | interpreter `0x801e8920`; `0x801ee774` → `0x801eebec` |
  | 4 | Damage | The hit script, which plays on the target (`b.2 [4]`) | interpreter `0x801e8920` |
  | 5 | KO | Nothing names it: `b.2 [4]` starts 5 when the Digimon's HP (`0x801ef9a4`) is 0 or less | `0x801e892c` … `0x801e896c` |
  | 6 | Victory | The director, for the winner, shown alone | `0x801eeb0c` |
  | 7 | Entrance | Script 999 of `A/BATTLE.PAK` (`b.1 [7]` takes its first pose, `b.2 [7]` starts it), which the director plays on each Digimon in turn when the battle opens. It is also the one motion unpacked when a model is loaded, and the pose the model is given then | `0x801ee4e8`, `0x801ee6b8`; loader `0x8002de18` … `0x8002de54` |

  No other number is ever passed: every battle script (those in `F`, `E` and
  `A/BATTLE.PAK`) was searched for `b.1` and `b.2`, and every call of the start routine in
  the main program and the seven overlays was read (the
  evolution scene, the opening, the arenas and the effect models start motion 0 or 1 of
  their own models).
- **How long a motion lasts.** The start (`0x80022d34`) aims the model at key 0 from the pose
  it is in, over 2 × that key's duration: a lead in which it blends in. Then the motion task
  (`0x80022b98`) takes the keys in turn, key 0 once more first, each over 2 × its duration. So
  a motion lasts 2 × d0 + Σ 2 × d frames; Agumon's first attack, whose keys add up to 216,
  takes 240 (the routines were run in the emulator on the disc's motions to check this).
  After the last key the motion goes on at the key named in the last field of key 0's first
  record (`0x80022d88`), or stops in its last pose when that is -1. Of the 190 card models,
  standing loops from key 0 in all but three (Agumon's is one that does not), victory loops
  in 156, mostly from a later key, two third attacks loop, and nothing else does. Starting a
  motion always starts it from its first key, also when it is the one playing (`0x8002daac`
  only skips unpacking it again). A hidden model is not moved on (`0x80022bd0`: the task
  passes over a model whose show flag, byte `0x114` + its number of the block at
  `[0x801d6a4c]`, is not above 0; `b.14` and the director set that flag). `Actor.play`,
  `setup` and `step` in `js/battle3d.js` do the same, and the port's director makes the
  starts the table above gives it around the scripts: standing for the Digimon a script is
  about to play on, with the one the script before played on hidden in its standing pose
  (`0x801ee00c` … `0x801ee060`), standing for the attacker when the hit script is over
  (`0x801ee860`, `0x801ee86c`) and for a target left alive (`0x801ee904`).
- **What a key holds besides the pose.** Its sound (the number + 1, 0 for none) is played
  with the sound call `0x8002b498` when the model starts towards the key (`0x80022184`), so
  key 0's sound is heard twice, at the start and at the end of the lead; 30 motions have one
  there. The record after the last part is the camera's (see *Camera* below); it is eased
  like a part's. Of each record the setup reads the rotation, the show flag (parts only), the
  offset and the scale; the word after the offset (105 or 64 in every motion) is not read by
  it or by the routine that takes a pose (`0x80023148`).
- **Motions and scripts.** A script never waits for a motion. It waits a number of frames
  (`b.10`), no script in the Digimon files reads the state of one of its objects, and none
  takes a different time with different random numbers: each is a fixed timeline made for
  the motion it starts. The director waits for a motion in two places: the target's damage or
  KO motion must be over before it goes on (`0x801ee87c`, `0x801ee9fc`), and the entrance must
  be over before the Digimon is put to standing (`0x801ed920`). It does not wait for the
  victory motion. Scripts hang objects on body parts by their number in the model
  (`0x801e9494`: variable `0x1b9` the part, `0x1be` whose; the number is not checked against
  the model's part count). `tools/motion_slots.py` measures every card model: the length, lead,
  loop and sounds of each slot, and for each attack and hit script when it starts which slot
  and which parts it uses (`docs/time-stranger/motion-slots.json`; the bases of the Time
  Stranger cards as a table in `docs/time-stranger/motion-slots.md`).
- **Which scripts.** A card's attack record is {power, attack script, hit script, name}; the
  loader `0x8002dea0` reads the two script numbers. The director (`0x801ee3d4`) runs the
  attack script for the attacker, then the hit script for the target (not when the attack
  did no damage). The scripts are in the Digimon's own `F/NNN.PAK`.
- **Script engine.** The interpreter `0x801e8678` in the overlay `P/SUGSEG.BIN` is the board
  effect engine with 460 variables and more commands (`tools/bscript.py`; `tools/btrace.py`
  prints a script's timeline). A script runs in the frame of its Digimon (`0x801ea258`: origin
  at its feet, turned to its facing), first sets everything up in one go, then says it is
  ready and runs frame by frame. Commands start a motion (the damage motion 4 becomes the KO
  motion 5 when HP is 0), hold a Digimon's motion where it is and let it go on (`a.7` and
  `a.8`, handlers `0x801e880c` and `0x801e8830`: `0x80022ca4` turns the motion's frame count
  below 0, which the motion task passes over, and `0x80022d00` turns it back; 26 scripts do
  this, the ice attacks to freeze the target under the ice), show one Digimon and hide the
  other (`b.14`), wait, play sounds, and create
  objects that hang on the script's frame, on another object or on a body part of a Digimon.
- **Objects.** Rings, particles and plain nodes are the board ones. New here: a *sprite*
  (`0x801e41ac`, drawn by `0x801eb874`), a flat picture facing the viewer that steps through
  the frames of a sprite chunk, 4 x its size, with the GPU's blend modes; an *effect model*
  (`0x801e38a0`), a model with its own motion from the attack's asset file `E/NNN.PAK`, carried
  by a node and dimmed by its fade. Its motion is started by the same start routine as a
  Digimon's (`0x801e39c4` … `0x801e39dc`), but with the fourth argument set unless the
  script's variable `0x1cb` is 1 (the scripts set it to 1 in 19 places). With that argument the key setup takes
  its other path (`0x80022784`): a key is reached in 1 × its duration, not 2 ×, at constant
  speed, and the step (`0x80021c38`) leaves the parts' speeds alone; so such a motion lasts
  d0 + Σ d frames. Of the 872 effect models with a motion that the cards' attacks create
  (each attack counted once), 826 are started this way. Like a Digimon, an effect model is
  moved on only while its show flag is above 0; its object sets the flag every frame, to 3
  or to -1 (`0x801e3cc0` … `0x801e3d00`; the port moves it on while its node is on and its
  brightness is not 0). Also new: a *light change* (`0x801e76a8`), which swings one of the
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

- **Time Stranger models made into DDCB models.** How a model is cut into parts, thinned,
  given its texture sheet and palette rows, sized and placed is this project's own, and so
  is which of its Time Stranger motions fills which of the game's eight slots and how it is
  laid on the base's keys
  (`tools/ts_model.py`; "Time Stranger models as DDCB models" lists every choice).

- **Time Stranger's files** are another game's, not the disc's. How they are stored was
  read from that game's executable; what was not is listed under "Time Stranger files"
  and "Time Stranger models", each under "Not read from the executable", and in "Time
  Stranger tables" (the column types and the meaning of the columns) and "Time Stranger
  motions" (the whole layout of a motion file; what each motion is for comes from the
  game's own script and tables).

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
  is; the builder runs both scripts and compares every object's colours). The deck Black
  Fire Again and its name are this project's as well, made at the owner's request; in the
  game BK WarGreymon has the one deck, and it plays WarGreymon.

- **Time Stranger Phase 1 cards.** The new labels and palette choices are project additions
  requested by the owner. TS-106 (2026-10-14) chooses original numbers and effects for
  all 45 cards, based on Specialty and each Digimon's official lore; see [card-design.md](docs/time-stranger/card-design.md).
  These are project designs, not canonical Time Stranger numbers or translated mechanics.
  Missing attack labels use verified Time Stranger skills, including a few buff/debuff
  names: these do not add Time Stranger mechanics to DDCB. Reference Book order is
  retained without claiming a verified strength ranking. Both art modes share the
  prepared native pictures per the owner's update; no separate Legacy image is built.
- **Planned Time Stranger roster.** The 45 cards in
  [roster.md](docs/time-stranger/roster.md) are custom additions, not disc cards.
  Their five Specialties and placeholder bases are project choices. On 2026-10-13
  the owner chose to keep the proposed Specialty where thematically suitable, even
  when a Time Stranger signature attack has a different element. Time Stranger's
  elemental matchups and skill elements do not supply one intrinsic element to copy.
  TS-001 records online field-guide evidence, identity corrections and two replacements;
  checking the owner's installed game tables follows TS-201/TS-203. That initial roster audit alone did not
  add playable cards. TS-101–105 made all 45 playable; TS-106 gives them original gameplay.
  Recoloured models remain placeholders until Phase 2.
  All work stays on the `time-stranger` feature branch; it must not merge to `main`
  until all 45 new cards are complete and their applicable acceptance criteria pass.
  See [the feature workflow](docs/time-stranger/README.md#feature-branch-and-merge-gate).

- **Installable app.** The manifest (names, `standalone` display, the colour `#0a1018` taken
  from the page's own background), the service worker's network-first caching and the app
  icon are this project's, not the game's. The icon is a crop of `tools/icon_source.jpg`, a
  picture of a Digimon card game card back (not a texture of the PlayStation game) that the
  owner supplied; it is only cut square and resized with a plain Lanczos filter, not
  enlarged through ComfyUI.

- **Deck list of the start screen.** The list, its rows and the panel with a deck's
  contents are this project's; the game has no such screen. The owners' pictures are the
  game's (see "Decks and their owners"), with these choices of this project's: the whole
  128x112 texture is shown, as what part of it the "VS" screen draws was not read; the
  starter decks and the decks you build show the player's picture, and in the second
  player's list the second player's of the free battle; Tentomon's deck 76, which has no
  archive, shows the back of a card; a custom deck shows the picture of the deck it was
  made from. The pictures are the game's 128x112 enlarged 4x through ComfyUI
  (`build_owners.py --upscale`), like the card art. Counting a
  deck's Digimon cards by Specialty is this project's summary of a deck; the game shows a
  deck's cards, not such a count. The card that opens from a card list shows the card's
  record as the deck editor does; the wording of what a ✕ effect does is this project's.

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
  On screens up to 900px wide, a panel below the board replaces the scaled attack buttons
  with full-width buttons at least 64 CSS pixels tall, showing names, power and the ✕ effect.
  The hand stays visible, and the panel clears as soon as an attack is chosen. This mobile
  layout is a browser usability choice, including the reminder to look away in two-player mode.
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
  are, where the sound bank has them. An effect model on the constant-speed path keeps, in
  the game, whatever accelerations its whole-model record (the camera's) was left with; they
  are taken as 0 here (whether the block is cleared when a model is loaded was not read).
  The entrance motion (slot 7) is never shown. After the
  second strike of a turn the game's director waits 30 frames (`0x801eea98`) where it waits
  20 after the first (`0x801ee910`); here every strike is a scene of its own and waits 20.
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
  The game paints a Digimon card's level into the upper left corner of its 40x40 board
  picture (`B/M_CARD.ARC`): R, A, C or U, and "RP" on the six partner Rookies. The new
  pictures have no letter, so on the board the game's own is laid over them as a separate
  element. `tools/build_levels.py` cuts each letter out of the game's pictures: the corner
  of all the pictures of a level, as already enlarged 4x, keeping for every pixel the
  darkest value any of them has there, which leaves the white letter they share. The dark
  edge around the letter is this project's, added because the new pictures are often bright
  where the game's are dark.
- **Time Stranger picture preparation (TS-002).** The current cards 302–346 use 44
  regular official illustrations and Reference Book Crescemon. There are 43 recorded
  ComfyUI restorations; Keramon uses clean EX1-044 crop [80,105,320] without an edit.
  Crescemon is a suitability fallback: card rules obscure its legs and attempted
  reconstruction changed its anatomy. These restorations are project additions, not
  game data. Sources/edits are in roster.md, tools/time_stranger_art.json and
  tools/new_art_edits.json. tools/prepare_time_stranger_art.py caches/replays the
  recipes with --review for contact sheets. The stored workflow uses local
  512-inpainting-ema.safetensors, 24 Euler steps, CFG 6 and explicit seeds. Native
  images/masks/hash metadata stay ignored under extracted/newart; pixels outside each
  mask are preserved. Picture preparation itself does not add playable cards.

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
tools/.venv/Scripts/python tools/build_owners.py extracted web --upscale   # the deck owners' pictures, needs ComfyUI
tools/.venv/Scripts/python tools/upscale_assets.py extracted web    # art and UI, needs ComfyUI
tools/.venv/Scripts/python tools/build_audio.py extracted web       # music and sound effects
tools/.venv/Scripts/python tools/build_effects.py extracted web     # battle effect scripts
tools/.venv/Scripts/python tools/build_models.py extracted web      # 3D models, textures, motions
tools/.venv/Scripts/python tools/build_battle.py extracted web      # battle scripts, attack assets
tools/.venv/Scripts/python tools/arena_previews.py web              # arena previews, drawn in a browser
tools/.venv/Scripts/python tools/build_new_art.py extracted web     # new card art, needs the internet and ComfyUI
tools/.venv/Scripts/python tools/build_levels.py extracted web      # the level letters laid over new art, from web/assets/mini
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

## Time Stranger files

The models of the Time Stranger cards (`docs/time-stranger/`) are to come from *Digimon
Story Time Stranger* itself, from the owner's own Steam install. This section is how its
files are stored and how to get a working copy; nothing of it is on the DDCB disc. The
unpacked files stay out of git (`extracted_ts/`); only models converted from them are
committed.

### The build

Everything below was read from one build. Addresses are virtual addresses in its
executable (image base `0x140000000`).

| | |
|---|---|
| Steam app | 1984270, build id `23514637` (`steamapps/appmanifest_1984270.acf`) |
| Main depot | 1984271, manifest `2791297361435523425` |
| `Digimon Story Time Stranger.exe` | 30,453,760 bytes, SHA-256 `ff9de825a543bf874cfb7e73ed951256d3ce4e8702957afa3b26ca6487a81688` |
| `gamedata/app_0.dx11.mvgl` | 13,075,138,986 bytes, SHA-256 `2bebf470a2f42f87258787b8a630199044b8b99265386d4a6cd2f39280c6fdc9` |
| `gamedata/patch.dx11.mvgl` | 1,371,328,286 bytes, SHA-256 `f7dd8b0be574324847902166729a8a1b08e00a375f15f7b835d1cfa8438f9fb6` |

`gamedata/` holds 102 `.mvgl` and 6 `.cpk` files, 32.4 GB. The size and SHA-256 of each,
and of the executable, are in `docs/time-stranger/files-23514637.tsv`.

### The archives

**`.mvgl`** holds the game's own files. Every one of the 102 starts with `MDB1`, and
neither the tables nor the data are encrypted (a mod site says they are; in this build
they are not).

| What | Where it was read |
|---|---|
| The archive of a name is `<name>.dx11.mvgl` | `0x1402b6b00` |
| Header, 0x20 bytes: `MDB1`, u32 nodes, u32 names, u32 data entries, u64 offset of the file data, u64 archive size | read at `0x1402c3f40`, magic compared at `0x1402c40d2` |
| Tables at 0x20: the nodes (16 bytes), the names (0x80 bytes), then the data entries (24 bytes) | `0x1402c4240` |
| Node: s32 bit, u32 data entry, u32 left, u32 right; node *n* has name *n*, node 0 is the root | walked at `0x1402cb030`, built at `0x1402cbbc0` |
| Name: 4 bytes extension padded with spaces, 124 bytes path without it, backslashes, lowercase | key built at `0x1402c4c60` |
| Data entry: u64 offset from the file data, u64 size, u64 stored size | `0x1402c46d0` |
| Stored size equal to size: the bytes are the file. Otherwise one LZ4 block | `0x1402c4813`; `0x140e31400` calls the decoder `0x140e33170` |
| The file is read with `fopen("rb")`, `fseek`, `fread`; nothing is done to the bytes | `0x1402bfdb0`, `0x1402c0230` |

A file is found by walking the tree with its name as the key (a bit of the key picks left
or right until the bit number stops growing) and comparing the name where the walk ends.
The unpacker does not need the walk: it goes through the nodes in order.

**`.cpk`** is CRI's archive. The names in their tables are sound (`.acb`, `.awb`, `.acf`)
and movies (`.usm`, `.mp4`); they are not unpacked.

### What is in them

196,583 files, 49.3 GB unpacked; 4,204 of them are stored without compression.

| Extension | Files | Bytes | Seen as |
|---|---|---|---|
| `geom` | 15,639 | 20.9 GB | models: `chrNNN.geom` (532 in `app_0`), `chrNNN_lod_N.geom`, fields, effects |
| `img` | 20,416 | 26.1 GB | textures, in `images/` |
| `anim` | 39,235 | 0.86 GB | motions |
| `skel` | 25 | 32 KB | skeletons |
| `nlst` | 15,639 | 54 MB | as many as there are `geom` |
| `shad` | 79,072 | 0.6 GB | shaders, in `shaders/` |
| `mbe` | 6,023 | 146 MB | tables and text (`data/`, `text/`, `message/`) |
| others | | 0.67 GB | `bson`, `lips`, `lua`, `detr`, `phys`, `scen`, `bin`, `sprk`, `note`, `usb`, `name`, `png` |

What each of these formats is inside has not been read; the "Seen as" column is from the
names only.

### Steps

```bash
tools/.venv/Scripts/python -m pip install -r tools/requirements.txt
tools/.venv/Scripts/python -I tools/ts_extract.py "<Steam>/steamapps/common/Digimon Story Time Stranger" extracted_ts
```

It reads `<install>/gamedata/*.mvgl` and writes each archive to `extracted_ts/<archive>/`,
with `extracted_ts/_manifest.tsv` (archive, path, offset, size, stored size). The install
is only read. `--only "chr*.geom"` unpacks what matches, `--archive app_0` one archive,
`--list` prints the tables and `--test` reads and inflates every file without writing.
On this build it ends with `196583 files, 49261839878 bytes, 0 failed`. With another
build, compare the executable's hash first: the addresses here are for this one, though
the unpacker itself needs only the layout.

`tools/x64.py` is the disassembly helper the addresses were read with
(`x64.py <exe> dis|func|xref|find|str|imm|bytes`).

### Not read from the executable

- **Which archive wins.** 17,957 paths are in more than one archive (12,098 of them in
  `app_0` and `patch`). The unpacker keeps each archive in its own folder; the order in
  which the game looks through them was not traced.
- **The header's last field** equals the file's size in all 102 archives; the routines
  read here do not use it.
- **The `.cpk` files** were only looked at for the names in their tables.
- REA's deep analysis (Ghidra) is not set up on the owner's machine; the routines were
  read as disassembly with `tools/x64.py`, not as decompiled code.

## Time Stranger models

How a Time Stranger model is stored, as far as it has been read (TS-202). Addresses are in
the same executable as above. "Data" in the last column means the field was read from the
files only, and says how it was checked; everything else names the routine that uses it.
`tools/ts_model_read.py` reads all 532 `chrNNN.geom` of `app_0` this way.

A Digimon is `chrNNN.geom` (the model), `chrNNN.nlst` (its names as text), its textures
`images/chrNNN*.img` and its motions `chrNNN_*.anim`. Guilmon is `chr090`: the row of
`char_GUILMON` in `data/char_info.mbe` and in `data/digimon_status.mbe` holds that name
(which column means what is TS-203's to read).

### `.geom`

One block; every offset counts from the start of the file. The loader is `0x1402dec00`.

| Where | What | Read at |
|---|---|---|
| +0x00 | u32 version, `0x13c`; nothing else is taken | `0x1402dedcf` |
| +0x04, +0x06 | u16 meshes, u16 materials | `0x1402e075a`; materials: data, the records end where the next table starts |
| +0x08, +0x0a | u16 counts of two more tables (below) | `0x1402e05a3`, `0x1402e05f0` |
| +0x0c | u32 bones | data: the skeleton's own count |
| +0x30 | u32 flags: `0x10` the vertex data is in `<name>.vert`, `0x04` the names are in `<name>.name` | `0x1402dee09`, `0x1402df04d` |
| +0x38, +0x40 | u32 size of the skeleton block, u32 size of the `.vert` file | `0x1402df309`, `0x1402dee8a` |
| +0x48 | meshes, 0x80 bytes each | `0x1402df1ca` |
| +0x50 | materials | `0x1402df51a` |
| +0x58, +0x60 | two tables of records, 0x80 and 0x38 bytes each; a record starts with the hash of a bone and is tied to that bone. Guilmon has none; what they are was not read | `0x1402e04b3`, `0x1402e0640` |
| +0x68 | one 3×4 float matrix for each bone: the inverse bind matrix | data: times the bone's rest matrix it gives the unit matrix (to 0.000005) for every bone of 495 of the 532 models; in the other 37 a few face and effect bones are posed otherwise |
| +0x78 | names, NUL-ended | `0x1402dedf2` |
| +0x90 | name table: u32 bones, u32 materials, then for each the offset of a list of name offsets | `0x1402def60` |
| +0x98 | skeleton block, or 0 and it is the file `<name>.skel` | `0x1402df2de`, `0x1402df372` |

**Mesh** (0x80 bytes).

| Where | What | Read at |
|---|---|---|
| +0x00, +0x08, +0x10 | vertices, indices (u16), bone palette (u32: skeleton bones) | data: each ends where the next begins, at count × size |
| +0x20 | vertex attributes | `0x1402df27b` |
| +0x28, +0x2a, +0x2c | u16 palette size, u16 attributes, u32 bytes a vertex | data |
| +0x30 | u8 weights a vertex | data: the BLENDWEIGHT attribute has as many |
| +0x31 | u8, 5 or 1; the loader keeps it for each mesh | `0x1402df1d5`; meaning not read |
| +0x34, +0x38 | u32 hash of the name, the name | `0x1402df280`; hash: data |
| +0x40, +0x44, +0x48 | u32 material, u32 vertices, u32 indices | data |

The indices are a **triangle strip**, pieces joined by repeated indices (data: the count is
seldom a multiple of 3, four in ten of the strip's triangles are empty, and drawn as a
strip the model is whole).

**Vertex attribute** (8 bytes): u8 kind, u16 components (+2), u16 number type (+4), u16
offset in the vertex (+6). `0x14035f260` turns them into the Direct3D input layout:

| Kind | Semantic (table `0x14165bd30`) | Seen as |
|---|---|---|
| 1 | POSITION | 3 floats (4 in a few meshes) |
| 2, 3 | NORMAL, TANGENT | 3 and 4 half floats |
| 4 | BINORMAL | not in any of the 532 |
| 5, 6, 7, 8 | TEXCOORD 0 to 3 | 2 floats (kind 8 not in any of the 532) |
| 9 | COLOR | 4 bytes, 0..1 |
| 10 | BLENDINDICES | 2 to 4 bytes: places in the mesh's bone palette |
| 11 | BLENDWEIGHT | 2 to 4 half floats |

Number types: 0 byte, 7 16-bit signed normalised (not in any of the 532), 8 half float,
9 float.

**Material**: +0 u32 hash of its name (data; the name table lists the names in another
order), +0x320 u8 shader parameters, +0x321 u8 render states, then 0x20 bytes for each of
them from +0x328, and the next material follows (`0x1402df51a`).

| Where | What |
|---|---|
| +0x00 | up to four floats; or, for a texture, s32 name offset and at +8 s32 its length (`0x1402df666`) |
| +0x10 | u16 id: a row of the shader parameter table at `0x141ac4f00` (0x38 bytes: hash, name, id, kind, size) |
| +0x12 | u8 number of floats; 0 a texture; 100 a render state |

Guilmon's body material has `ColorSampler` chr090a01, `NormalSampler` chr090a01n,
`RgbaMaskSampler`, `LightWeightSampler`, `CLUTSampler` and `DiffuseColor` 1 1 1 1. The
materials of its eyes add `OverlayColorSampler` (chr090p01, the pupils) and
`OverlayColorSampler2` (chr090b01, the lids), and their meshes have a second and a third
set of texture coordinates.

**Skeleton**, `60SE`. An offset inside it counts from the field that holds it
(`0x1402e054a`).

| Where | What | Read at |
|---|---|---|
| +0x10 | u16 bones | `0x1402df49f` |
| +0x18 | offset of the rest pose, 12 floats a bone: rotation x y z w, position x y z 1, scale x y z 1 | data: the inverse bind check above |
| +0x20 | offset of the bones' name hashes | `0x1402e054a` |
| +0x3c, +0x40 | u32 pairs, then the pairs: u16 bone, u16 parent (0x7fff none) | data: the same check; bit 15 is set on a few parents and was not read |

A name's hash is CRC-32 without the final inversion (data: every bone name of the 532
models has the hash the skeleton stores for it, and so have Guilmon's mesh and material
names).

### `.img`

A DDS file with a DX10 header; BC1 (DXGI 71, 72) and BC7 (98, 99) in Guilmon's.

### Looking at one

```bash
tools/.venv/Scripts/python -I tools/ts_model_read.py extracted_ts/app_0/chr090.geom
tools/.venv/Scripts/python -I tools/ts_model_read.py extracted_ts/app_0/chr090.geom --glb guilmon.glb
tools/.venv/Scripts/python -I tools/ts_model_read.py extracted_ts/app_0/chr090.geom --png guilmon.png --overlays
```

The first prints the bones, meshes and materials; `--glb` writes a glTF binary with the
skin and the colour textures; `--png` draws the front and the side.

### Not read from the executable

- **The shaders.** Which texture does what is known by its parameter's name only. The
  `.glb` carries `ColorSampler` alone and marks every material double-sided; which faces
  a material hides and the winding were not read. `--overlays` lays the two eye textures
  over the colour texture the way the pictures suggest, not the way a shader was read to
  do it. Meshes without a colour texture (the black outline shell, with the parameter
  `Fat`) and blended ones (the shine over each eye) are left out of the dumps unless
  `--all` is given.
- **Meshes of one bone and no weights** (the eyes) are given wholly to that bone in the
  `.glb`.
- The mesh byte at +0x31, bit 15 of a parent, the first 0x320 bytes of a material and the
  fields of a mesh after +0x4c.
- Models with a `.vert` or `.name` file beside them are refused by the reader; none of
  the 532 has one.
- The dump was not compared with the game running; the ticket's log says what it was
  compared with.

## Time Stranger models as DDCB models

`tools/ts_model.py` turns a Time Stranger model into a model file of this site
(`web/assets/models/NNN.*`, the format of `tools/build_models.py`), within the figures of
the card's base model (TS-205), and gives it eight motions made from its Time Stranger
motions on the base's keys (TS-206). **None of it is the PlayStation game's doing**; every
choice below is this project's, made to fit what the disc's models are. Those were
measured over the 211 card models in `web/assets/models`: rigid parts (2 to 31), 380 to
1,246 triangles, every triangle inside one part, textures of 16 colours a palette row
(1 to 16 rows), mostly 256×128.

```bash
tools/.venv/Scripts/python -I tools/ts_model.py extracted_ts/app_0/chr090.geom web 3 <out dir> 401 --part 0=J_spine02 --preview look.png --poses poses.png
```

That is Guilmon (`chr090`) on the figures of Agumon's model 3: 16 parts, 690 triangles, a
256×124 texture, 3 palette rows.

| Step | What the tool does |
|---|---|
| Parts | A vertex goes with the bone that weighs most on it. The bone with the fewest vertices is merged into its parent until there are no more parts than the base has. A triangle whose corners fall in different parts goes whole to the part most of them are in |
| Part numbers | `--part N=<bone>` gives a bone's part the number N. The base's battle scripts hang effects on parts by number (`docs/time-stranger/motion-slots.md`, the "Parts" columns; TS-204): Agumon's first attack names part 0, its chest, so Guilmon's `J_spine02` is part 0 |
| Triangles | Edges are collapsed onto one of their ends, cheapest first by how far the surface moves (quadric error), down to the base's count. A collapse that would tear the texture mapping at a seam, turn a triangle over or pinch the mesh is refused. The eyes' triangles weigh 30 times more, so they are not the first to go |
| Texture | The pieces of the texture mapping still in use are laid out again in one sheet of the base's size; pieces that use the same texels share them. All are shrunk by one factor across and one down. The pieces are sorted into as many groups as the base has palette rows by their mean colour, and the texels each group uses are reduced to 16 colours |
| Size and place | Scaled to the height of the base in key 0 of its standing motion, stood on the same ground, y downward and facing −z as the disc's models |
| Motions | Each of the eight slots keeps the base's keys: as many, each as long, with the base's sound and camera record. So the motion lasts what the base's lasts, and every sound and camera move comes at the base's moment. The pose of each key comes from the model's Time Stranger motion for that slot (table below) |

**Motions** (TS-206). What a slot is and how long a motion lasts is the PlayStation game's
(above, "Polygon Battle": 2 × d0 + Σ 2 × d frames); which Time Stranger motion fills it,
and how, is this project's.

| Slot | What | Time Stranger motion | Its name in that game's script |
|---|---|---|---|
| 0 | Standing | `bn01` | `MOTION_TYPE_IDLE` |
| 1 | First attack | `ba01` | `MOTION_TYPE_ATTACK` |
| 2 | Second attack | `ba02` | `MOTION_TYPE_COMMON_SKILL` |
| 3 | Third attack | `bs01` | `MOTION_TYPE_SPECIAL_SKILL01` |
| 4 | Damage | `bd01` | `MOTION_TYPE_DAMAGE` |
| 5 | KO | `bd02` | `MOTION_TYPE_DOWN` |
| 6 | Victory | `bv01` | `MOTION_TYPE_WIN` |
| 7 | Entrance | `bn01` | none: that game's battle table has no motion for coming in, so the slot gets the standing motion, the pose an entrance ends in. The site does not play slot 7 |

- **Which attack is which** is a choice: the three attack motions in the order the other
  game numbers them (2, 5, 34). A motion the model lacks is replaced by the next of the
  three, a missing `bd02` by `bd01`, a missing `bv01` by `fe02` (`MOTION_TYPE_HAPPY`), and
  anything still missing by `bn01`; `--motion SLOT=<name>` names another. The tool prints
  every replacement.
- **Time.** Key 0 takes the motion's first frame and the last key its last frame; the keys
  between take the frame at their share of the time between the two. A slot of the base
  that goes round from key 0, on a Time Stranger motion that ends as it begins, is laid on
  the round instead, the way back to key 0 counted in. Nothing puts the strike of an
  attack at the moment the base's script fires: the Time Stranger files were not searched
  for when a motion strikes.
- **Pose.** A part moves as its own bone does (the bone's matrix in that frame times its
  inverse bind matrix); bones merged into the part move with it as one piece, so a tail
  merged into the hips does not bend. From that the key gets, for each part, angles in the
  game's order Ry·Rx·Rz, a move added to the part's place and a scale. The angles of a key
  are written as near the key before as a whole turn allows, and key 0 of every slot as
  near the standing pose, because the game goes from key to key number by number. Between
  keys the game eases those numbers, which is not the path the Time Stranger motion took.
- **Not used:** the `chrNNNloc_*.anim`, `cam_chrNNN_*.anim` and `ef_b_chrNNN_*.anim` files
  beside a model's motions, and the motions without a number in the battle table.

The eyes' two overlay textures are laid over each other as `ts_model_read.py --overlays`
does; how the game's shader mixes them was not read.

## Time Stranger tables

The game's tables are `.mbe` files (`data/`, `text/`, `message/`). `tools/ts_mbe.py` reads
them (TS-203).

### `.mbe`

The reader in the executable is `0x140dcf480`: it checks `EXPA` (`0x140dcf6cf`) and `CHNK`
(`0x140dcf992`) and takes each table's row size from the file.

- `EXPA`, u32 tables. For each table: u32 length of its name, the name, u32 columns, a u32
  type for each column, u32 row size, u32 rows. The rows start at the next multiple of 8
  and each takes the row size rounded up to a multiple of 8.
- `CHNK`, u32 entries. For each: u32 offset in the file, u32 length, the string. The string
  belongs to the 8 bytes at that offset, which lie in a row.

Walked this way, all 740 `.mbe` files of `app_0/data` reach `CHNK` right after their last
table.

The column types were worked out from the rows, not read from the executable:

| Type | What |
|---|---|
| 2, 3, 4 | an integer of 32, 16 and 8 bits |
| 5 | a float |
| 6, 7, 8 | a string: 8 bytes, filled through `CHNK` |
| 9 | one bit; a run of such columns shares 32-bit words (which bit comes first was not checked) |
| 10 | nothing: the column takes no room in the row |

A column starts at a multiple of its own size and unused bytes hold `0xcc`. With these
sizes the columns fill the row size, and every `CHNK` offset falls on a string column, in
2,787 of the 2,788 tables of `app_0/data`. The one left has a column of type 0 and is not
read.

### Which model is whose

| Table | Column | What |
|---|---|---|
| `text/char_name.mbe`, `Sheet1` (`app_text01`: English) | 0, 1 | the Digimon's key (`char_GUILMON`), its name |
| `data/char_info.mbe`, `char_info` | 0 | the key |
| | 3 | the model, `chr090` |
| | 4 | a number, `1090` for `chr090` |

That column 3 is the model was not read from a routine: Guilmon's row names `chr090`,
which the owner confirmed to be Guilmon (TS-202), and the 44 other models plus Keramon/chr626 were
drawn and are the Digimon their rows name (`docs/time-stranger/img/ts-203-roster-models.png`).
`docs/time-stranger/roster.md` has the model of each card. All 45 current identities now have local model rows. The owner replaced the Fire black
Agumon variant with Keramon; the former native-model exception no longer applies.

## Time Stranger motions

A motion is one `.anim` file, `chrNNN_<name>.anim` (TS-203). `tools/ts_anim_read.py` reads
it; of the 11,333 `chrNNN_*.anim` of `app_0` it reads 11,321 (the other 12 have a kind of
channel it refuses).

### `.anim`

The loader is `0x1402dcd60`; it reads the file whole. **Nothing below was read from a
routine**: the layout was worked out from the files, and each part is checked as said.
An offset marked "rel" counts from the field that holds it.

| Where | What | Checked by |
|---|---|---|
| +0x00 | `80AE` | |
| +0x04, +0x08 | float length in seconds, float frames a second (30 in 11,235 files, 60 in 54, 512 in 32) | length × rate = frames − 1 in Guilmon's |
| +0x0e, +0x10, +0x12 | u16 bones, u16 frames, u16 chunks | bones: the model's count; frames: the chunks add up to it in every file read |
| +0x16 | u16 × 8: the channels that do not change (rotation, position, scale, float), then those that do | the lists and blocks below have these sizes |
| +0x38, +0x3c | rel chunk table (8 bytes a chunk, the second u32 its offset); rel chunk frames (u16 first frame, u16 frames after it) | every chunk ends where the next begins |
| +0x40, +0x44, +0x48 | rel values of the unchanging rotations (6 bytes each), positions and scales (3 floats each) | |
| +0x60 | the bone of each channel, u16: a list for each of the eight counts, filled up with the bone count to a multiple of 4 entries (the first list to 8) | the bones of a list are below the bone count and the fill is the bone count, in every file read |

**Chunk.** Eight u32 sizes: the first frame's rotations, positions, scales and floats, then
the later ones' (the scale and float sizes take in padding). The blocks follow in that
order, with a table of bits before the later ones: channel after channel, one bit for each
frame after the chunk's first, the highest bit of a byte first, set where a value is
stored. Checked in every chunk of every file read: the sizes add up to the chunk, and the
set bits of the rotation channels × 6 and of the position channels × 12 are exactly the
stored sizes (other ways of reading the table fit only by chance).

**Rotation**, 6 bytes read as one 48-bit number, highest byte first: the lowest 2 bits say
which of x, y, z, w was left out (the largest, taken positive); above them three 15-bit
numbers *n* for the others, each (*n* − 16383) / 16384 / √2; the top bit is unused.
Checked: of the readings tried this is the one where neighbouring values of a channel stay
close (their dot product averages 0.9975 and never falls below 0.83 over 4,546 values);
and Guilmon posed with it stands as a creature should
(`docs/time-stranger/img/ts-203-guilmon-bn01.png`).

**What the values are** (from that picture, not from a routine): a rotation is the bone's
whole rotation in its parent; a position is added to the bone's rest position. Between two
stored values `ts_anim_read.py` goes in a straight line; how the game does it was not read.

```bash
tools/.venv/Scripts/python -I tools/ts_anim_read.py extracted_ts/app_0/chr090_*.anim
tools/.venv/Scripts/python -I tools/ts_anim_read.py extracted_ts/app_0/chr090_bn01.anim --tracks
tools/.venv/Scripts/python -I tools/ts_anim_read.py extracted_ts/app_0/chr090_bn01.anim --png pose.png --geom extracted_ts/app_0/chr090.geom --frame 0
```

### Which motion is for what

The battle code asks for a motion by a number. Two things say what a number is:

- **Its name.** `lua/battle_define.lua`, a script of the game (Lua 5.2 bytecode; `tools/ts_luac.py`
  lists the globals it sets), gives the numbers their names: `MOTION_TYPE_IDLE = 0` and so on.
- **Its motion.** `0x140c46320` turns a number into a row of `battle_define_string`
  (`data/battle_calculate.mbe`) through `0x140c45e50` (rows 1 to 52) or `0x140c45c00`
  (rows 53 to 78), and `0x1409cdb00` fetches the row's string, the motion's name.

| Number | Name in `battle_define.lua` | Row | Motion |
|---|---|---|---|
| 0 | `MOTION_TYPE_IDLE` | 1 | `bn01` |
| 1 | `MOTION_TYPE_TIRED` | 2 | `bn02` |
| 2 | `MOTION_TYPE_ATTACK` | 3 | `ba01` |
| 5 | `MOTION_TYPE_COMMON_SKILL` | 4 | `ba02` |
| 7 | `MOTION_TYPE_GUARD` | 5 | `bg01` |
| 8 | `MOTION_TYPE_AVOID` | 6 | `bg02` |
| 9 | `MOTION_TYPE_DAMAGE` (also `DAMAGE02`, `DAMAGE03`) | 7 | `bd01` |
| 10 | `MOTION_TYPE_DOWN` | 8 | `bd02` |
| 11 | `MOTION_TYPE_UP` | 9 | `bd03` |
| 12 | `MOTION_TYPE_HAPPY` | 10 | `fe02` |
| 13 | `MOTION_TYPE_ANGRY` | 11 | `fe04` |
| 31 | `MOTION_TYPE_WIN` | 12 | `bv01` |
| 32 | `MOTION_TYPE_RUN` | 13 | `br01` |
| 34 to 41 | `MOTION_TYPE_SPECIAL_SKILL01` to `08` | 14 to 21 | `bs01` to `bs08` |

The other names are `ATTACK02` (3), `ATTACK03` (4), `ITEM` (6), `CHANGE_EXIT` (14), `CHANGE`
(15), `CHANGE_FOR_DEATH` (16), `CROSS_ARTS_CHARGE_COMPLETE_01` and `_02` (17, 18),
`CROSS_ARTS_IN` (19), `LOSE` (33), `COLLABO_SKILL` (42), `CHARGE_IDLE` to `CHARGE_FAILED`
(43 to 48) and, in the `patch` archive's script only, `ITEM_02` (49).

That the script's numbers are the code's numbers was not read from a routine; it shows in
the scripts of single battles, which pair the same names with the same motions:
`lua/battle_10400200.lua` holds `MOTION_TYPE_IDLE` with `bn01`, `TIRED` with `bn02`,
`DAMAGE` with `bd01`, `DOWN` with `bd02`, `UP` with `bd03` and `GUARD` with `bg01` (and
gives that one enemy `ba02` for `ATTACK` and `ba01` for `COMMON_SKILL`).

Outside battles: `bv02` and `bv03` are in the table `battle_extra_win`
(`data/battle_motion.mbe`), and a Digimon on the field stands with `bn01` and moves with
`br01` (`data/field.mbe`, `field_move_animation`, row `default_move_animation`). What the
`f…` motions of the field are for (`fe01`, `fe03`, `fq01`, `fq02`, `fn02_01`, `f000`) and
`bf01` was not read.

## Layout

| Path | What |
| --- | --- |
| `web/js/engine.js` | Rules engine (port of the traced routines) |
| `web/js/ai.js` | Computer opponent |
| `web/js/decks.js` | Deck rules (from the game's editor), card search, deck export and import |
| `web/js/editor.js` | Deck editor screen |
| `tools/decktest.js` | Checks of the deck rules, the search and export/import |
| `web/js/ui.js`, `web/css/style.css`, `web/index.html` | Front end |
| `web/js/data/cards.js` | Generated: the game's 301 cards and 159 decks, and the custom cards and decks |
| `tools/custom_cards.json`, `custom.py`, `build_custom.py`, `custom_look.py`, `tools/custom/` | The custom cards and decks: their list, the recolouring, the builder, a viewer, their picture sources |
| `web/assets/art`, `mini`, `ui` | Generated: upscaled card art and battle textures |
| `tools/build_owners.py`, `web/assets/owner` | The deck owners' pictures of the "VS" screen, and their export |
| `web/assets/art2`, `mini2` | Generated: new art for the Digimon cards (`tools/build_new_art.py`, `tools/new_art.json`) |
| `tools/build_levels.py`, `web/assets/ui/level_*.png` | The level letters of the game's board pictures, cut out to lie over new art |
| `tools/time_stranger_design_test.js` | TS-106 original stat ranges, 113 support scenarios; `--soak` plays 750 temporary mono/three-color deck matches |
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
| `tools/motion_slots.py`, `docs/time-stranger/motion-slots.*` | What each model's eight motions last and when the scripts start them, measured from the disc |
| `web/assets/battle` | Generated: battle scripts and attack effect assets |
| `tools/lift.py`, `emu.py` | Compact MIPS listing and Unicorn runner used while reading the engine |
| `extracted/` | Working copy of the disc and disassembly notes (about 270 MB, safe to delete) |
| `tools/ts_extract.py`, `x64.py` | Time Stranger: the `.mvgl` unpacker and the x86-64 disassembly helper for its executable |
| `tools/ts_model_read.py` | Time Stranger: reads a `.geom` model and its textures, dumps it as `.glb` or a drawing |
| `tools/ts_model.py` | Time Stranger: makes a DDCB model file from a `.geom` within a base model's figures |
| `tools/ts_mbe.py` | Time Stranger: reads the tables of a `.mbe` file |
| `tools/ts_anim_read.py` | Time Stranger: reads a `.anim` motion, lists its channels, draws a model in one of its frames |
| `tools/ts_luac.py` | Time Stranger: lists the globals and constants of a compiled script (`.lua`) |
| `extracted_ts/` | Working copy of Time Stranger's files (about 49 GB, not in git, safe to delete) |

## File formats

- `.bin` is MODE2/2352; ISO9660 holds `SLUS_013.28` plus `A`–`G`,`P`.DRV archives.
- DRV: 32-byte entries `{u8 kind (0x80 dir, 0x01 file), char ext[3], u32 sector, u32 size, u32 time, char name[16]}`.
- ARC: u32 offset table, members are TIM images.
- `B/CARD2.CDD`: 191 Digimon records (316 bytes), 102 option records (226), 8 digivolve records (112).
- `B/DECK2.DEK`: 110-byte records: 30 card ids, deck name (byte 60), owner (byte 79), rank, armor byte.
- `B/MATCH/NNN.ARC`: the textures of the screen before a battle, by deck number; an ARC of 14 TIM images.

## Time Stranger roster correction (2026-10-13)

The owner replaced the Fire black Agumon variant in the Darkness roster with Keramon
(329/428). Base Tsukaimon (135) originally supplied the numbers/effects; TS-106 now supplies
new gameplay design. Tsukaimon still supplies the temporary
mesh/motions; its palette is changed towards Keramon's grey-blue body and green eyes.
Local char_KERAMON maps to chr626 in both model tables; Phase 2 has all nine Darkness
models to convert. The old model exception and cloned effect offset 20000 are retired;
other published offsets remain stable. Both art modes use unedited official EX1-044
crop [80,105,320]. [Full evidence](docs/time-stranger/roster.md).
