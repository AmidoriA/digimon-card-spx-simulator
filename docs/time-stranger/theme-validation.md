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
