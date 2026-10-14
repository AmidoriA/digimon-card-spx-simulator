# TS-106: Original stats and effects for all 45 cards

| | |
|---|---|
| Trello | https://trello.com/c/D4Ud9j8U |
| Phase | 1 Cards |
| Feature branch | time-stranger |
| Depends on | TS-101, TS-102, TS-103, TS-104, TS-105 (Done) |

## Goal

Owner request 2026-10-14: give all 45 new cards original stat/effect designs fitting
their Specialty and official lore. This supersedes donor-stat copying.

## Design

[card-design.md](card-design.md) contains exact HP/DP/+P, powers, cross/support effects,
official source links and individual roles/tradeoffs. Source of runtime data:
tools/custom_cards.json. Keep the five Specialties, roster and shared native pictures.

## Initial acceptance (historical, superseded where noted below)

- [x] 45 new stat profiles, 45 changed cross effects and 45 distinct supports.
- [x] Each card has official lore evidence and an explicit gameplay interpretation.
- [x] Existing DDCB operators only; no rule-engine or original disc-card/deck changes.
- [x] Same-Specialty/level stat ranges, support pass/fail, costs, revive and void tests pass.
- [x] Required tests and TS mixed-deck soak pass with no timeouts.
- [x] Actual editor/board/browser inspection, docs and Trello updated.
- [x] One request commit, integrated and pushed to time-stranger.

## Validation

2026-10-14: 31 selftests including 113 behavioral support scenarios, 11 deck checks,
200 standard AI matches, all 31 board-effect scripts, 237 Digimon / 711 attacks in
three styles, and check_paths passed. The 750-game temporary deck soak (300 vs donors,
300 TS vs TS, 150 involving three-color decks) had no timeouts, maintained 30 cards
per side, and activated all 45 supports. AI randomness means outcome totals may vary.

All 90 actual editor previews (45 cards × two art styles) match runtime stats, names,
cross/support text and the design doc. Actual board support playback was reviewed for
Coronamon, Keramon and Taomon using explicitly prepared hands, active stats and zones;
not every support was visually played. Screenshots/reports: extracted/newart/ts-phase1-browser/ts106-*.

The 301 disc cards, BlackWarGreymon and all 160 production decks are identical to the
previous commit. Visual assets, donor scripts and shared pictures are unchanged. Three
previously corrupted special-character attack labels were repaired from official sources.
These designs fit disc stat ranges but need further deck playtests; do not infer equal
competitive balance from runtime simulation success. Integrated/pushed to time-stranger.

## Theme redesign requested by the owner — 2026-10-14

The owner requested fifteen concrete deck themes, 3–4 copies of each featured R/C/U
stage, ordinary own-Specialty gates removed, evolution tools for pure and mixed lists,
and no Sevens or Download Digivolve. The new designs in `card-design.md` and
`tools/time_stranger_theme_cards.json` supersede the original exact cross/support
choices. Keeping every cross different from its visual donor is no longer a criterion.

The 45 supports now follow their deck themes. Only the Wingdramon group deliberately
requires a non-Rare active Digimon for its strong cross-color bonuses. GrapLeomon's
group tests selected attack power through custom variable 0x50; all actual effect
operations remain the existing DDCB operations. Terriermon, Gargomon and Rapidmon's
cross powers become zero to accompany Triangle Counter. Other stats, all original disc
cards, BlackWarGreymon and visual assets remain intact. The original-source lore
citations remain available in the design document.

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
