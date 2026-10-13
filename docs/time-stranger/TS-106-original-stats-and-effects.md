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

## Acceptance

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
