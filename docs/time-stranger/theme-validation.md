# Theme redesign validation — 2026-10-14

This validates the owner's revised fifteen deck themes, not the historical donor-swap
lists. Runtime source is `tools/custom_cards.json`; independent design fixtures are
`tools/time_stranger_theme_cards.json` and `tools/time_stranger_theme_decks.json`.

## Deck and effect contracts

- All fifteen decks: 30 cards, maximum four of one card, featured line at **4 R / 3 C /
  3 U**, total **9 R / 6 C / 3 U / 12 options**, and the requested exact color set.
- No Sevens (#285–291) or Download Digivolve (#293). Every deck contains evolution
  options. Real engine execution validates all **30 featured evolution steps** and
  **51 option routes**, including cross-color R→C/C→U with actual in-deck DP donors.
- All 45 new supports: **353 behavioral scenarios** covering all permitted active
  Specialties, paid costs, failed gates, actual cross effects, revival and its deciding-KO
  limit, Eat-up HP, support priority, and color/DP disruption of legal evolution.
- Only the Wingdramon group deliberately requires a different active Specialty.
  GrapLeomon's selected-power variable 0x50 works for all three attack choices and
  reads changes made by earlier support tiers. It cannot react retroactively to a
  later cross effect. Successful native counter damage copies the enemy attack;
  attack boosts are useful for a direct attack or a missed counter, not added reflection.
- WarGrowlmon's Chain Saw/Mega Hand are Circle/Triangle finishers. Its native Crash
  replaces cross damage with remaining HP, so Chain Saw plus Crash is not a damage combo.
- Frozen hashes verify all 301 disc cards, BlackWarGreymon, the 159 original decks and
  Black Fire Again retain their full data. Pictures, models and attack scripts are intact.

`node tools/selftest.js`: **32 passed**, including both contracts above.
`node tools/decktest.js`: **11 passed**. All 31 board-effect scripts and asset paths pass.

## Actual AI matches

Both streams of randomness (game shuffles and AI/cloned evaluations) are seeded.

| Suite | Games | Timeouts | Maximum turns | Evidence |
|---|---:|---:|---:|---|
| Directed theme decks vs base and five mixed-color original decks, both seats | 360 | 0 | 71 | 3,373 battles; 918 evolutions |
| Extended new-vs-new/original decks | 750 | 0 | 55 | All 45 revised supports activate naturally; average 10.4 turns |
| Standard engine soak | 200 | 0 | 159 | Seven explicitly logged legal-attack explorations of stagnant positions |

The **1,110 theme matches use unassisted live AI**. Every featured Ultimate appears
naturally and is reached by AI evolution. The same fixed directed seeds were retained
while improving MetalTyrannomon/Cyberdramon with two Speed Digivolve each, alongside
their Special Digivolve bridges. No seed selection or forced evolution hides a failure.

| Featured Ultimate | Natural evolutions in its 24 directed games |
|---|---:|
| WarGrowlmon | 1 |
| Flaremon | 7 |
| SaviorHuckmon | 2 |
| MachGaogamon | 8 |
| Crescemon | 10 |
| Dragomon | 9 |
| Taomon | 5 |
| Rapidmon | 9 |
| Lilamon | 15 |
| MetalTyrannomon | 1 |
| Cyberdramon | 2 |
| Matadormon | 9 |
| Wingdramon | 6 |
| GrapLeomon | 5 |
| Chirinmon | 4 |

These samples demonstrate functioning themes and evolution access. They do not establish
equal competitive strength. The standard soak's reported explorations remain distinct
from the live-AI theme results; original counter mirrors can otherwise stagnate.

## Browser and board review

Using the running local preview with fresh scripts and service workers blocked:

- All fifteen selectors show the intended owner/portrait, exact complete card counts,
  correct ratio headers, and each featured 4/3/3 group; all fifteen matches start.
- All 45 revised card supports, cross effects and powers were checked in both art modes
  (**90 card previews**). No page errors or failed asset requests.
- Three explicitly prepared board positions played through the normal UI: GrapLeomon's
  zero-power bonus (500 direct damage after a missed counter), Rapidmon forcing Triangle
  and actually countering it, and Taomon changing the enemy Specialty and emptying DP.
  No page errors. These positions were prepared fixtures, not naturally drawn matches.
- The SaviorHuckmon deck preview, GrapLeomon and Rapidmon playback captures were also
  inspected visually. The local reports/screenshots are under `sheets/ts-phase3/themes/`;
  that ignored folder is not part of the published repository.

The test server continues to serve the revised branch at `http://127.0.0.1:8765/`.

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

## Crescemon support balance — owner request, 2026-10-15

Crescemon now lowers all three attacks of **both players by 150**, with the normal
zero floor, and discards three cards from the enemy Online Deck. It no longer returns
any cards from its own Offline Pile. Its required/added DP is **40 / +10** (the +P value
falls from 20 to 10). HP, attack powers, cross effect and the deck composition remain.
Lekismon's separate two-card recycling support is outside this specific change.

Validation: 32 selftests with 367 behavioral scenarios, 11 deck checks, all 51 option
evolution routes, 31 effect scripts and asset paths pass. Tests assert the 40/+10
values, symmetric reductions and zero floor, no own recycle event or own deck/pile
change, and the retained three-card enemy discard. The combined Taomon/Crescemon
build completes 200 standard plus 360 directed matches without timeouts; the standard
run needs zero stalemate explorations. Every featured Ultimate evolves naturally.
Crescemon's 24 directed games include eight natural evolutions, with 12 wins.

Browser checks show 40 DP and +10 P in the card detail, all six Crescemon-line previews
across both art modes, and a prepared board support playback with both sides' attack
values reduced and no own recycle. No page errors or missing assets. The playback
capture was visually inspected. Local artifacts: `sheets/ts-phase3/crescemon/`.
Earlier descriptions of Crescemon recycling its own pile are superseded.


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

## Main integration accepted — 2026-10-15

The owner explicitly accepted the feature and authorized merging it into main after
the final Lilamon/Sunflowmon revision. The merge preserves main's asset loading
overlay and background preloading together with the full native Time Stranger model
renderer. Both entry pages load `battlenative.js` before the merged `battle3d.js`;
their script versions are refreshed. Documentation conflicts retain completed model
work and its recorded validation rather than the earlier unfinished instructions.

Integration checks pass: 32 selftests / 375 effect scenarios, 11 deck checks, loading
preload/cancellation/retry tests, all 31 effect scripts, asset paths and all **237
Digimon / 711 attacks in three styles**. Browser checks verify native Lilamon and
MachGaogamon rendering in all three styles, six card previews in two art modes, match
start and both prepared support playbacks with no missing assets or page errors.
The merged engine, AI and card data are identical to the final feature build tested
in the 100-match balance run above; no longer match simulation was added for the merge.
