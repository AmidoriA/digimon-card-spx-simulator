# Phase 1 rules (TS-101 … TS-105)

Every Phase 1 ticket makes nine cards this way. These are this project's choices, made at the
owner's request; the README lists them under "Not from the game code".

## Numbers and effects: original designs (TS-106)

Owner update 2026-10-14 supersedes copying the donor's stats/effects. Every one of the
45 cards has an original stat profile, a redesigned cross choice and a distinct support.
[card-design.md](card-design.md) is the current design and lore rationale; the actual
records live in tools/custom_cards.json. Disc bases now provide visual assets and motions.
Choose values within same-Specialty/level disc ranges, preserve Rookie DP 0, and use
existing effect operators. Stat values may coincide individually with a donor, but the
full profile and effects must not be clones. No new permanent status rules are introduced.

## Names

- `name`: the Digimon's English name as Time Stranger writes it (TS-001's source).
- Attack names (circle, triangle, cross): the Digimon's moves as the Digimon Reference Book
  (digimon.net/reference) lists them; log the page.

Owner update (2026-10-13): fill missing names with verified Time Stranger skills.
Keep the Reference Book names first (the first three when more are given). Fillers
prefer damage skills; a few Digimon only offer buffs/debuffs. These are names only:
DDCB rules and visual motions remain unchanged; TS-106 defines powers and effects.
Do not import the Time Stranger behavior of a filler just because its label matches.
`attack-sources.md` records English skill IDs and each character's local table linkage.

## Model (placeholder)

`model`: `{"number": <the card's model number>, "recolour": "<name>"}`. The recolour takes the
base towards the Digimon's own colours (create-card skill §3; `custom_look.py model web <base
model> look.png`). Phase 2 writes the Time Stranger model over the same number and drops the
recolour.

## Battle

- Base of the same Specialty: no `battle` block; the base's attack effects are used.
- Base of another Specialty (✱ in roster.md): `battle` with the current offset in the table below,
  a recolour of the effects into the card's Specialty colours and its `accent` (create-card
  skill §4; BlackWarGreymon's `darkfire` is the example).

Active offsets are stable once published. Same-Specialty bases do not consume an offset.
The owner replaced card 329 with Keramon/Tsukaimon; offset 20000 is retired and its old
effects removed. The four active offsets below retain their published numbers.

| Card id | Card | Battle offset |
|---|---|---|
| 330 | Monodramon | 30000 |
| 335 | MetalTyrannomon | 40000 |
| 344 | Wingdramon | 50000 |
| 346 | Chirinmon | 60000 |

## Art

- Owner update (2026-10-13): no separate Legacy picture. `art.shared: true` writes the same
  TS-002 native prepared crop (Keramon uses the unedited EX1-044 crop) to both full-size art folders and identical 160px thumbnails
  to both mini folders. No enlargement, new inpainting or ComfyUI restart is needed.
- `art.new`: the picture from TS-002 (`card` + `crop`, or `ref`; TS-003), or its ComfyUI-edited
  version (TS-004) where the row in roster.md says it was edited.

## Tests

- The roster selftest checks ids, identity, level, Specialty, model/script linkage and shared pictures.
- tools/time_stranger_design_test.js checks 45 distinct supports, non-cloned stat profiles,
  chosen cross effects, same-Specialty/level disc ranges and actual support outcomes;
  every condition and resource gate has failing scenarios. Include the conditional
  revive scoring and Digimon-only support cancellation checks.
- Run the design test with --soak for temporary TS decks versus each other and disc bases;
  original production decks are unchanged. This is runtime validation, not proof of balance.
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
  project's at the owner's request; stats/effects are original designs, with cited lore
  and explicit tradeoffs in card-design.md.
