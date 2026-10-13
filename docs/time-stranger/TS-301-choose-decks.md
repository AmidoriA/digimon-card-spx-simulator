# TS-301: Choose the 15 base decks and exchanges

| | |
|---|---|
| Trello | https://trello.com/c/CC15DUlA |
| Phase | 3 Decks |
| Depends on | TS-101 … TS-105 |

## Goal

Plan one custom deck around each new Ultimate (WarGrowlmon, Flaremon, SaviorHackmon, MachGaogamon, Crescemon, MarineDevimon, Taomon, Rapidmon, Lilamon, MetalTyrannomon, Cyberdramon, Matadormon, Wingdramon, GrapLeomon, Chirinmon).

## Context

- `tools/custom.py` `decks()` and the create-card skill, "A deck with the card": a custom deck is a game deck with cards exchanged by name; it keeps its base's owner, rank, armor form and music, and follows the game's 159 decks as that owner's next deck.
- `web/js/data/cards.js` `decks`: the game's decks.
- [phase3.md](phase3.md): the rules for choosing.
- [decks.md](decks.md): the table to fill.

## Steps

1. For each new Ultimate, list the game decks that hold its base and how many of its line's R/C bases they hold (a `node -e` over `cards.js`).
2. Pick the base deck and write the exchange as phase3.md says.
3. Propose a name per deck.
4. Fill decks.md and show the owner the names and owners.

## Acceptance criteria

- [ ] decks.md has 15 rows: Ultimate, base deck (name, owner), exchange map, name, reason.
- [ ] Every exchange keeps 30 cards and at most 4 copies.
- [ ] The owner has seen the list.

## Out of scope

- Building them (TS-302 … TS-306).

## Questions for the owner

- Are the names and the owners right?

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
