# TS-002: Find each card's picture

| | |
|---|---|
| Status | todo |
| Phase | 0 Groundwork |
| Depends on | TS-001 |

## Goal

Give every Time Stranger card a "New card art" picture from the internet, from the same two sources the game's cards already use.

## Context

- `tools/build_new_art.py`: `CARD_URL` (Digimon Card Game official card list, `https://world.digimoncard.com/images/cardlist/card/<NO>.png`, 430x600) and `REF_URL` (Digimon Reference Book, `https://digimon.net/cimages/digimon/<slug>.jpg`).
- `tools/new_art.json`: how a card and its square crop are written; crops are centred on the Digimon and keep the "SAMPLE" mark out.
- README "Not from the game code" → "New card art": the rules used for the game's cards.

## Steps

1. For each row of roster.md, look up the Digimon on the official card list and pick one card whose illustration shows it whole and clearly (prefer the plain version of the Digimon over alternate-art or partner-form cards).
2. Download it and choose a square `[x, y, size]` as `new_art.json` does; check by eye.
3. Where the card game has no such card, use the Reference Book picture and its slug.
4. Write the card number and crop, or the slug, into roster.md.

## Acceptance criteria

- [ ] Every row has `card` + `crop`, or `ref`.
- [ ] Every crop was looked at: Digimon centred, no SAMPLE mark inside.
- [ ] Pictures are cached under `extracted/newart` like the game cards' (not in git).

## Out of scope

- The tool change that builds them (TS-003).

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
