# TS-304: Nature decks

| | |
|---|---|
| Trello | https://trello.com/c/LWJsByLx |
| Phase | 3 Decks |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-301, TS-103, TS-106 |

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

- [x] In `cards.js` only the three deck records are new.
- [x] Selftest: each deck is its base with exactly the listed exchange.
- [x] `node tools/sim.js` plays 200 matches without timeouts; the other checks pass.
- [x] In the browser: the deck is in the opponent list under its owner, its card list opens, and a match against it starts.
- [x] README names the decks next to the cards and under "Not from the game code".
- [x] One commit, `TS-304: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-14 — implemented from the locked TS-301 plan

Dependencies were completed in order: TS-103 supplies the nine playable
Specialty cards, TS-106 supplies their current original gameplay, and TS-301
locks the base choices and exchanges before this ticket's data build.
The source is [decks.md](decks.md) and `tools/time_stranger_decks.json`; donor
names come from the original disc deck table, not from guessed evolution chains.

| Deck id / name | Ultimate | Base id / deck (owner) | Exact exchange (all copies) |
|---|---|---|---|
| 166 / Divine Fox Again | Taomon | 74 / Divine Monster (Nefertimon) | Gatomon (184) ×1 → Renamon (320); Unimon (88) ×3 → Kyubimon (323); Angewomon (77) ×2 → Taomon (326) |
| 167 / Rapid Hope Again | Rapidmon | 73 / Call of Destiny (Gatomon) | Salamon (99) ×3 → Terriermon (321); Leomon (85) ×3 → Gargomon (324); MagnaAngemon (75) ×2 → Rapidmon (327) |
| 168 / Flower Bloom Again | Lilamon | 85 / Flower Fairies (Lillymon) | Palmon (98) ×4 → Lalamon (322); Togemon (84) ×4 → Sunflowmon (325); Lillymon (78) ×4 → Lilamon (328) |

Documented TS-301 fallback decisions (one donor per missing slot, keeping its
copy count and level):

- Rapidmon: Salamon ×3 → Terriermon: roster donor absent; target-Specialty same-level fallback.

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
The ticket is committed separately with a `TS-304:` subject and pushed to `time-stranger`;
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

## Taomon random-color balance correction — 2026-10-14

The owner's follow-up supersedes the forced enemy-Darkness support effects. Renamon
and Taomon now change **both active Digimon to the same random Specialty**, using one
uniform seeded roll among all five colors. A current color can be rolled again. Color
changes persist until evolution/replacement, so the evolution risk is shared. Their
other draw/DP-discard/attack effects remain; Kyubimon and the deck list are unchanged.
Custom engine operation 0x36 implements the shared roll and emits both board changes.

Validation: 32 selftests containing **363 effect scenarios**, 11 deck checks, 31 board
effect scripts, asset paths, 360 directed matches and 200 standard matches pass.
Both match suites have zero timeouts; this standard run needed zero stalemate
explorations. Directed results: 3,376 battles, 913 evolutions, maximum 71 turns, with
every featured Ultimate evolving naturally. Tests cover all five outcomes, exactly
one roll per activation, identical seeded replays, both persistent colors, and actual
future evolution behavior. Original disc cards/decks and BlackWarGreymon remain intact.

The running browser preview shows all three Taomon-line cards in both art modes
(six card previews). Renamon and Taomon were played through normal board playback in
explicitly prepared positions with a controlled Fire roll: both Nature Digimon became
Fire, and Taomon still removed enemy DP. No page errors or missing assets. The Taomon
playback screenshot was inspected. Local artifacts: `sheets/ts-phase3/taomon/`.
The earlier fixed-Darkness evidence in this document is historical.

## Taomon healing revision — owner request, 2026-10-15

Taomon shifts from milling/discard disruption to recovery. The list now carries
Recovery Floppy ×3, Sup. Rec. Floppy ×3 and Med. Rec. Floppy ×3, alongside Special
Digivolve ×3. Psychemon ×3 replaces Armadillomon ×3; MudFrigimon ×3 replaces Numemon ×3.
Evil Program, Rare Altar and Digimon Grave are removed. No card in this list mills
the enemy deck or discards enemy DP. Featured line 4/3/3 and total 9R/6C/3U/12 options
remain; all three cross-color evolution routes use actual remaining cards.

Kyubimon now heals 200 HP and lowers enemy attacks by 100. Taomon keeps the shared
random color, heals 400 HP and lowers its own attacks by 100. Neither discards enemy DP.
Renamon's shared random color/draw support is unchanged. Psychemon copies the enemy HP,
so it helps when behind but can lower HP when ahead; Med. Rec. Floppy trades damage
for healing. The theme does not rely on an unconditional free healing loop.

Validation: 32 selftests with 366 effect scenarios, 11 deck checks, 31 effect scripts
and asset paths pass. All 51 option evolution routes remain legal. The 200 standard
and 360 directed matches finish without timeouts; this standard run uses zero
stalemate explorations. Taomon evolves naturally in five of its 24 directed games.
Browser list/ratios/counts, six Taomon-line previews across both art modes and two
prepared Kyubimon/Taomon board healing playbacks pass without errors or missing assets.
The earlier Taomon milling/DP-discard descriptions are historical and superseded.


## Lilamon and Sunflowmon balance revision — 2026-10-15

Owner-requested final Lilamon stats: **1,240 HP, 30 DP / +30 P, 650 / 340 / 200**.
HP is the owner's explicit value; other stats match Lillymon. Lilamon's support
still heals 300 HP and grants Eat-up HP, and now moves one random opponent Online
Digimon into that opponent's DP Slot. Project operation 0x37 samples Digimon copies
uniformly, never Options, and preserves all card copies. Full DP (eight cards), an
empty deck or no eligible Digimon leaves the transfer inactive without a random
roll; the healing and Eat-up benefit still apply. The board log identifies the card
transferred. Sunflowmon support heals 250 HP and reduces own attack by 100, with no
Eat-up HP flag; its native cross effect remains Eat-up HP. Deck composition stays
the same; Lilamon's documented evolution requirement is now 30 DP.

Final validation: 32 selftests including **375** independent effect scenarios,
11 deck checks including real evolution routes, 31 effect scripts and asset paths
pass. New effect cases cover both player seats, duplicate Digimon copies, Options,
first/last eligible selection, seven/eight DP cards, empty/no-Digimon decks and
Sunflowmon's absence of support healing on hit.

Per the owner's shorter simulation request, the final build ran **100** seeded
matches, each including Flower Bloom Again, against original and themed opponents
with both seating orders. All finished without intervention or timeout: 1,264 turns,
12.6 average / 33 maximum, 73 successful Lilamon supports and 73 DP transfers. Full
card inventories and zone capacities were checked throughout. Match seeds 42000–42099;
AI randomness seed 1000. This checks stability, not equal competitive strength.

Browser: six card previews across both art modes, full 30-card deck listing and
match start pass without missing assets/page errors. Two prepared board fixtures
verify Sunflowmon heals 250 without Eat-up, and Lilamon heals 300, grants Eat-up and
moves Palmon from a mixed Online Deck into the opponent's DP Slot. These fixtures
use deliberately prepared positions rather than naturally drawn games. Visual
playback confirms the new enemy DP card and transfer log.
