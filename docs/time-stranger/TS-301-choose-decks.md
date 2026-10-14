# TS-301: Choose the 15 base decks and exchanges

| | |
|---|---|
| Trello | https://trello.com/c/CC15DUlA |
| Phase | 3 Decks |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-101 … TS-105, TS-106 |

## Goal

Plan one custom deck around each new Ultimate (WarGrowlmon, Flaremon, SaviorHuckmon, MachGaogamon, Crescemon, Dragomon, Taomon, Rapidmon, Lilamon, MetalTyrannomon, Cyberdramon, Matadormon, Wingdramon, GrapLeomon, Chirinmon).

## Context

- [card-design.md](card-design.md): TS-106 original gameplay and Specialty/lore synergies.

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

- [x] decks.md has 15 rows: Ultimate, base deck (name, owner), exchange map, name, reason.
- [x] Every exchange keeps 30 cards and at most 4 copies.
- [x] The owner has seen the list.

## Out of scope

- Building them (TS-302 … TS-306).

The complete list is in [decks.md](decks.md); all names contain at most 18 characters
and are unique against the existing 160 deck names. The owner requested TS-301–306 to
be completed with dependency-aware subagents, authorizing routine deck design choices.
The parent task presents the finished name/owner list to satisfy the final visibility item.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

- 2026-10-14: TS-101–TS-106 are complete on `time-stranger` (TS-106 `a2e69da`).
  Audited all 159 original decks (IDs 0–158), with complete ranked R/C/U copy counts
  and target-Specialty counts in [decks.md](decks.md). Excluded custom Black Fire Again.
- Chose one base/exchange map per Ultimate. No disc deck contains Panjyamon (41) or
  MetalGarurumon (37); Crescemon/Chirinmon therefore use deterministically ranked
  same-Specialty Ultimate alternatives. MetalTyrannomon/Wingdramon need same-level
  cross-Specialty R/C donors. The complete exception policy is recorded in
  [phase3.md](phase3.md), including one whole donor per level to retain the four-copy cap.
- Skipped Matadormon's otherwise best #36 because it contains no Champions; chose #52.
  Skipped Flaremon's otherwise best #158 Practice because `ui.js` excludes Player decks
  from `OP_DECKS`; chose #42 First Attack (Birdramon) so TS-302 can appear as an opponent.
- Added `tools/time_stranger_decks.json`: ordered exchanges with source/target IDs and
  counts, all candidates and reasons, IDs 160–174, ticket groups, and frozen SHA-256
  snapshots of all pre-Phase-3 cards/decks for independent regression checks.
- Applied all fifteen maps in memory: each retains exactly 30 cards, at most four copies,
  unchanged ordered Options, and all R/C/U group members. Names pass length/uniqueness.
  TS-302–TS-306 perform the runtime build, gameplay/simulation and browser verification.

- 2026-10-14: Presented all fifteen finished deck names and owners in the parent chat.

### Owner presentation update — 2026-10-14

Owner request: replace the inherited character portrait and deck-owner name on all
fifteen Time Stranger decks. Each now displays its featured Ultimate’s name and uses
that card’s prepared illustration in the deck selector and large preview. Match names
and battle-log introductions use the same new owner. Source owners remain in the
base-deck records for provenance; rank, armor, music and exact card exchanges remain.
The initial inherited-owner/picture criteria above are historical and superseded.
Validation: 32 selftests, 11 deck checks, the standard 200-match engine soak,
31 board-effect scripts and asset paths pass. On the running localhost:8765 preview,
all fifteen new owners/portraits load in both art modes; all fifteen match names and
introductory battle logs match the Ultimate. Zero page errors or failed asset requests.
Representative WarGrowlmon setup and MetalTyrannomon match screenshots were inspected.
