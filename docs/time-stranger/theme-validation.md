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
