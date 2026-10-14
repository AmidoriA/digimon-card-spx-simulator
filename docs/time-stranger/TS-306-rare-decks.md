# TS-306: Rare decks

| | |
|---|---|
| Trello | https://trello.com/c/4tlEb1gi |
| Phase | 3 Decks |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-301, TS-105, TS-106 |

## Goal

Build the three decks of decks.md around Wingdramon, GrapLeomon, Chirinmon.

## Context

- [phase3.md](phase3.md)
- [decks.md](decks.md)
- `tools/custom_cards.json` `decks`.

## Steps

1. Add the three entries to `"decks"`.
2. `tools/.venv/Scripts/python tools/build_custom.py extracted web data`.
3. Extend the Time Stranger deck selftest's list.
4. Run the checks; look in the browser.
5. README; fill decks.md.

## Acceptance criteria

- [x] In `cards.js` only the three deck records are new.
- [x] Selftest: each deck is its base with exactly the listed exchange.
- [x] `node tools/sim.js` plays 200 matches without timeouts; the other checks pass.
- [x] In the browser: the deck is in the opponent list under its owner, its card list opens, and a match against it starts.
- [x] README names the decks next to the cards and under "Not from the game code".
- [x] One commit, `TS-306: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-14 — implemented from the locked TS-301 plan

Dependencies were completed in order: TS-105 supplies the nine playable
Specialty cards, TS-106 supplies their current original gameplay, and TS-301
locks the base choices and exchanges before this ticket's data build.
The source is [decks.md](decks.md) and `tools/time_stranger_decks.json`; donor
names come from the original disc deck table, not from guessed evolution chains.

| Deck id / name | Ultimate | Base id / deck (owner) | Exact exchange (all copies) |
|---|---|---|---|
| 172 / Sky Dragon Again | Wingdramon | 38 / Mega Giga (Gigadramon) | Agumon (27) ×3 → Dracomon (338); Flarerizamon (26) ×3 → Coredramon (Blue) (341); Gigadramon (5) ×2 → Wingdramon (344) |
| 173 / Beast Fist Again | GrapLeomon | 51 / Steel Gate (MetalEtemon) | Psychemon (170) ×3 → Bearmon (339); ShimaUnimon (162) ×2 → Grizzlymon (342); Etemon (150) ×2 → GrapLeomon (345) |
| 174 / Holy Beast Revived | Chirinmon | 51 / Steel Gate (MetalEtemon) | Vi-Elecmon (169) ×3 → Kudamon (340); ShimaUnimon (162) ×2 → Reppamon (343); MetalEtemon (141) ×3 → Chirinmon (346) |

Documented TS-301 fallback decisions (one donor per missing slot, keeping its
copy count and level):

- Wingdramon: Agumon ×3 → Dracomon: roster and target-Specialty donors absent; dominant-Specialty same-level fallback (Fire).
- Wingdramon: Flarerizamon ×3 → Coredramon (Blue): roster and target-Specialty donors absent; dominant-Specialty same-level fallback (Fire).
- GrapLeomon: ShimaUnimon ×2 → Grizzlymon: roster donor absent; target-Specialty same-level fallback.
- Chirinmon: MetalEtemon ×3 → Chirinmon: roster donor absent; target-Specialty same-level fallback.

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
The ticket is committed separately with a `TS-306:` subject and pushed to `time-stranger`;
the Trello card is moved to Done after push verification. The main merge gate remains.

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

### Theme composition redesign — owner request, 2026-10-14

Current source is `tools/time_stranger_theme_decks.json`; full lists and rationales are
in `decks.md`. The owner superseded the initial exact-base-exchange constraint: every
featured R/C/U group is now 4/3/3 copies, all lists are 9 R / 6 C / 3 U / 12 options,
and Sevens cards plus Download Digivolve are excluded. Each pure-color deck has
evolution support, and every mixed-color deck has genuine cross-Specialty evolution.
Base records retain source metadata provenance; names and Ultimate portraits remain.
The matching 45 custom card effects are revised in `card-design.md`. Original disc
cards/decks and Black Fire Again remain intact. Historical acceptance evidence above
describes the prior lists and does not override the owner's new requirements.

#### Revised-theme validation complete

- [x] Complete 4/3/3 featured groups, 9/6/3/12 ratios, exact colors and banned-card checks.
- [x] 353 effect scenarios; 30 normal evolution steps and 51 actual option routes.
- [x] 360 directed and 750 extended theme matches without timeouts or AI intervention;
  every featured Ultimate evolves naturally and all 45 supports activate naturally.
- [x] 32 selftests, 11 deck checks, 31 board-effect scripts and asset paths pass.
- [x] All 15 browser deck lists/match starts and all 90 card previews pass; three actual
  prepared board support playbacks pass without errors.

See [theme-validation.md](theme-validation.md) for seed/coverage details, the standard
200-match soak's explicitly reported stalemate explorations, and counter/Crash caveats.
This owner request is integrated in one commit on `time-stranger`; the main merge gate
remains. Prior exact-exchange acceptance is historical.
