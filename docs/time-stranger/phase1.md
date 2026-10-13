# Phase 1 rules (TS-101 … TS-105)

Every Phase 1 ticket makes nine cards this way. These are this project's choices, made at the
owner's request; the README lists them under "Not from the game code".

## Numbers: the base's

The owner gave no numbers, so a card takes its base's, unchanged: DP, +P, HP, the three attack
powers, the ✕ effect (`xfx`) and the support effect (`support`: copy `prio`, `conds`, `acts`
and `text` from the base's record in `cards.js`). The game's balance stays the game's, and the
three cards of a slot mirror three different cards of the game. The owner can ask for tuning
later.

## Names

- `name`: the Digimon's English name as Time Stranger writes it (TS-001's source).
- Attack names (circle, triangle, cross): the Digimon's moves as the Digimon Reference Book
  (digimon.net/reference) lists them, strongest first; log the page.

## Model (placeholder)

`model`: `{"number": <the card's model number>, "recolour": "<name>"}`. The recolour takes the
base towards the Digimon's own colours (create-card skill §3; `custom_look.py model web <base
model> look.png`). Phase 2 writes the Time Stranger model over the same number and drops the
recolour.

## Battle

- Base of the same Specialty: no `battle` block; the base's attack effects are used.
- Base of another Specialty (✱ in roster.md): `battle` with the offset given in the ticket,
  a recolour of the effects into the card's Specialty colours and its `accent` (create-card
  skill §4; BlackWarGreymon's `darkfire` is the example).

## Art

- `art.recolour`: the base's two game pictures recoloured, for "Legacy" card art.
- `art.new`: the picture from TS-002 (`card` + `crop`, or `ref`; TS-003), or its ComfyUI-edited
  version (TS-004) where the row in roster.md says it was edited.

## Tests

- TS-101 adds one selftest that holds the list of Time Stranger card names (later tickets
  add to it) and checks for each: it is a custom card, its `custom` is its base, and its
  `spec` (for same-Specialty bases), `level`, `dp`, `pp`, `hp`, attack powers, `xfx`, `prio`,
  `conds`, `acts` and `text` equal the base's.
- `tools/decktest.js`: the `CUSTOM` count and any search that now also finds a new card.
- Checks: `node tools/selftest.js`, `node tools/decktest.js`, `node tools/sim.js`,
  `node tools/fxtest.js`, `node tools/battletest.js`, `python tools/check_paths.py`.

## Browser (check-in-browser skill)

Deck editor with both card art styles; the cards on the board; each attack in
`battle-preview.html` next to the base's. Say what was seen and what was not.

## README

- "Custom cards": a "Time Stranger cards" table, one row per card: id, name,
  Specialty/level, base (id), model, picture source, Time Stranger source.
- "Not from the game code": names, Specialty choices, recolours and attack names are this
  project's at the owner's request; numbers and effects are the base's.
