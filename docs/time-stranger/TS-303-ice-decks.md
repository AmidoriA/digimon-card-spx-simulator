# TS-303: Ice decks

| | |
|---|---|
| Trello | https://trello.com/c/aAJwuQS9 |
| Phase | 3 Decks |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-301, TS-102, TS-106 |

## Goal

Build the three decks of decks.md around MachGaogamon, Crescemon, Dragomon.

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

- [x] In `cards.js` only the three deck records are new.
- [x] Selftest: each deck is its base with exactly the listed exchange.
- [x] `node tools/sim.js` plays 200 matches without timeouts; the other checks pass.
- [x] In the browser: the deck is in the opponent list under its owner, its card list opens, and a match against it starts.
- [x] README names the decks next to the cards and under "Not from the game code".
- [x] One commit, `TS-303: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-14 — implemented from the locked TS-301 plan

Dependencies were completed in order: TS-102 supplies the nine playable
Specialty cards, TS-106 supplies their current original gameplay, and TS-301
locks the base choices and exchanges before this ticket's data build.
The source is [decks.md](decks.md) and `tools/time_stranger_decks.json`; donor
names come from the original disc deck table, not from guessed evolution chains.

| Deck id / name | Ultimate | Base id / deck (owner) | Exact exchange (all copies) |
|---|---|---|---|
| 163 / Lunar Howl Again | MachGaogamon | 88 / Shoot Everything! (MetalGarurumon) | Gabumon (62) ×4 → Gaomon (311); Garurumon (46) ×4 → Gaogamon (314); WereGarurumon (39) ×1 → MachGaogamon (317) |
| 164 / Moonlight Revived | Crescemon | 13 / Fightback (Garurumon) | Penguinmon (64) ×3 → Lunamon (312); Garurumon (46) ×4 → Lekismon (315); Zudomon (40) ×2 → Crescemon (318) |
| 165 / Deep Sea Revived | Dragomon | 91 / First Aid (Joe) | Betamon (63) ×4 → Syakomon (313); Ikkakumon (47) ×3 → Octomon (316); Zudomon (40) ×2 → Dragomon (319) |

Documented TS-301 fallback decisions (one donor per missing slot, keeping its
copy count and level):

- Crescemon: Garurumon ×4 → Lekismon: roster donor absent; target-Specialty same-level fallback.
- Crescemon: Zudomon ×2 → Crescemon: roster donor absent; target-Specialty same-level fallback.
- Dragomon: Ikkakumon ×3 → Octomon: roster donor absent; target-Specialty same-level fallback.

Added only the three custom-deck definitions to `tools/custom_cards.json`
and regenerated `web/js/data/cards.js` through `build_custom.py … data`.
The complete Phase 3 build appends fifteen decks (160–174); all 347 existing
card records and all 160 existing deck records compare exactly with HEAD.
Options, card order and inherited owner/rank/armor/music/picture remain the
base deck’s; each new deck has 30 cards and no more than four of one card.
No card stats, support effects, cross effects, pictures or model assets changed.

### Validation and completion — 2026-10-14

All 32 selftests (including the original-design 113 support scenarios), 11 deck checks,
31 board-effect scripts, and case-sensitive asset-path checks pass. The standard
200-match simulation has zero timeouts (longest 148 turns). The soak now seeds AI noise
and cloned evaluations as well as shuffles. It reports seven explicit legal-attack
explorations after 20 identical positions: the old Rough Sea King/Guarding Sea matchup
can otherwise leave two original MegaSeadramon choosing Circle Counter forever.
This is test-harness exploration, not a change to live AI or battle rules; without
that exploration the reproducible seed-1000 soak has one original-deck stalemate. The final 15-deck directed suite adds 360
seeded matches against each base plus five mixed-Specialty original decks, in both
seats: zero timeouts, 3,067 battles and 948 evolutions, longest match 35 turns.
The deck contract covers all 30 R→C→U steps with actual deck DP donors and confirms
the AI takes each available prepared evolution. All 347 card records and all 160
pre-existing deck records match frozen pre-Phase-3 hashes.

Browser review on a fresh local preview selected every new opponent under the inherited
owner, opened all fifteen Ultimate card dialogs, checked each complete themed group,
and started all fifteen matches with the inherited music pair. No page errors or failed
asset requests. Screenshots/structured results are retained locally under
`sheets/ts-phase3/`; representative setup, card-dialog and match captures were visually
inspected. This review covers selection and match startup, not fifteen full manual matches.

Natural Ultimate appearances were absent for WarGrowlmon, SaviorHuckmon, MachGaogamon,
Dragomon and MetalTyrannomon in the 24-game-per-deck directed sample. Their prepared evolution
scenarios pass; these initial themed decks are not a claim of equal competitive strength.
No TS-106 card tuning was changed to fit this sample.

README names this ticket's three decks and identifies their choices as project additions.
The ticket is committed separately with a `TS-303:` subject and pushed to `time-stranger`;
the Trello card is moved to Done after push verification. The main merge gate remains.
