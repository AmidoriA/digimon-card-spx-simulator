# TS-304: Nature decks

| | |
|---|---|
| Status | todo |
| Phase | 3 Decks |
| Depends on | TS-301, TS-103 |

## Goal

Build the three decks of decks.md around Taomon, Rapidmon, Lilamon.

## Context

- [phase3.md](phase3.md)
- [decks.md](decks.md)
- `tools/custom_cards.json` `decks`.

## Steps

1. Add the three entries to `"decks"`.
2. `tools/.venv/Scripts/python tools/build_custom.py extracted web data`.
3. Extend the Time Stranger deck selftest's list.
4. Run the checks; look in the browser.
5. README; decks.md and board status.

## Acceptance criteria

- [ ] In `cards.js` only the three deck records are new.
- [ ] Selftest: each deck is its base with exactly the listed exchange.
- [ ] `node tools/sim.js` plays 200 matches without timeouts; the other checks pass.
- [ ] In the browser: the deck is in the opponent list under its owner, its card list opens, and a match against it starts.
- [ ] README names the decks next to the cards and under "Not from the game code".
- [ ] One commit, `TS-304: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
