# Phase 3: owner-directed themed deck rebuild

Updated 2026-10-14. The latest owner request replaces the initial TS-301…TS-306 rule that
only exchanged existing base cards. Keep the fifteen existing custom deck identities
(#160–174) and fully rebuild their compositions around their new themes.

## Active requirements

- Each deck has 30 cards and at most four copies of one card.
- Each featured Rookie, Champion and Ultimate appears three to four times. The current
  build uses 4/3/3 for every themed group.
- Follow the owner's normal range: R 8–10, C 5–7, U 3–6, Options 8–12. The current build
  uses R 9, C 6, U 3, Options 12 for all fifteen decks.
- Follow the requested pure or mixed Specialty set exactly. Every requested color in a
  mixed deck has useful Rookie/Champion representation, not just a token support card.
- Every deck contains evolution Options. Mixed decks include at least three Special
  Digivolve for genuine cross-Specialty R→C and C→U routes. Pure decks use Speed
  Digivolve; Dragomon adds Warp Digivolve for its fast-evolution theme. MetalTyrannomon
  and Cyberdramon also have two Speed Digivolve to preserve DP for their attack plans,
  alongside the existing mixed-Specialty evolution bridges.
- Ban the seven Sevens cards (#285–291) and Download Digivolve (#293). Do not confuse
  this with ordinary effects that have a seven-card discard cost.
- Remove new-card own-active Specialty restrictions unless a powerful, intentional
  cross-Specialty theme needs them. Avoid vanilla own-Specialty-gated support donors
  and Options in these lists. Wingdramon specifically rewards a different active
  Specialty, making Ice and Nature partners purposeful.
- Preserve names, featured-Ultimate owner and portrait. Preserve rank, armor, music and
  base provenance. Original decks #0–158 and Black Fire Again #159 remain unchanged.

## Sources and ownership

`tools/time_stranger_theme_decks.json` is the current composition source: explicit named
counts, complete ordered card IDs, ratios, themes, requested Specialties, preserved base
provenance, and constructive evolution paths with DP evidence.

[decks.md](decks.md) documents the current lists. [card-design.md](card-design.md) documents
the 45 custom effect designs; `tools/custom_cards.json` is their executable source.
These stats, supports and deck compositions are intentional project designs rather than
rules found on the original disc.

The original `tools/time_stranger_decks.json` remains an archived audit of the TS-301
base-selection candidates, copy substitutions, original-data hashes and justified donor
fallbacks. Its exact replacement lists no longer define the playable deck compositions.
The earlier restrictions to preserve Option counts, retain inherited owners, or exchange
only one donor's copies are superseded by the owner's newer instructions.

## Dependencies and completion

1. Implement and validate custom effects, including any required support-only variable.
2. Load the new deck lists into the normal custom-data exporter and regenerate data.
3. Check line copies, ratios, exact color sets, banned IDs, owner/portrait metadata,
   original-data preservation and actual engine execution of evolution routes.
4. Run behavioral checks, repository checks and themed matchup simulations.
5. Inspect the selector, a deck preview and a started match using freshly loaded data.

The test-server view must use this worktree's generated assets after the rebuild.
Compositions may be prepared concurrently with effect design because existing IDs,
Specialties, stages and evolution rules remain stable; behavioral tests and simulations
must wait for the new effects and generated data.
