# Phase 3 rules (TS-301 … TS-306)

One custom deck per new Ultimate: fifteen decks. Use TS-001's verified names and bases
in roster.md; the Ice aquatic Ultimate is Dragomon, and the Fire Ultimate is SaviorHuckmon. They are this project's, made at the
owner's request, and the README says so.

- **Card group**: match the first, second or third Rookie/Champion/Ultimate in each
  Specialty's roster slot. These are themed deck groups; do not assume every group is
  a direct Time Stranger evolution chain. In particular, Keramon, Kurisarimon
  and MetalTyrannomon form the first Darkness group.
- **Base deck**: a game deck that holds the Ultimate's base card. Of those, the one that also
  holds the most of the line's Rookie and Champion bases (roster.md); then the one whose
  Specialties best match. Count copies (R+C), then all Digimon copies of the target
  Specialty, then ascending original deck ID. A base must be opponent-eligible
  (`owner !== 'Player'`; `ui.js` excludes Player decks from `OP_DECKS`) and contain
  all three R/C/U levels so the complete themed group can be supplied.
- **Exchange**: every copy of the Ultimate's base → the new Ultimate; every copy of the
  line's R and C bases → the new R and C cards. If the deck has no copy of a line base, the
  deck's cards of the same Specialty and level are exchanged for the line's card instead,
  and the reason is logged. Copy counts stay, so the deck stays 30 cards with at most 4 of
  one card; option cards stay as they are.
  Choose **one donor card per missing level**, taking all of its copies: prefer target
  Specialty, then descending copies and ascending card ID. This avoids merging several
  donors into more than four copies. Keep exact roster donors wherever present, including
  a donor from another Specialty.
- **Name**: at most 18 letters, unique among all decks, in the manner of the game's second
  decks ("Black Fire Again", "Evil Fire Revived").
- **Owner, rank, armor form, music**: the base deck's (that is how custom decks work).

Test: TS-302 adds one selftest with the list of Time Stranger decks (later tickets add to
it): each is its base deck with exactly the exchange of decks.md. `node tools/sim.js` then
plays them.

## Exhaustive disc audit and fallback resolution (TS-301, 2026-10-14)

The literal original rules have no solution for several roster slots. The audit searched
all 159 disc decks (IDs 0–158), excluding existing custom deck #159. The full ranked
candidate lists, counts and exact exchanges are in [decks.md](decks.md) and
`tools/time_stranger_decks.json`. Use these deterministic project choices where necessary:

1. If an Ultimate's roster donor occurs in **no disc deck**, rank opponent-eligible decks
   containing an Ultimate of the target Specialty by the same R/C, Specialty and ID order.
   Choose its Ultimate donor by descending copies and ascending card ID. This is necessary
   for Crescemon (Panjyamon 41 absent from all decks) and Chirinmon (MetalGarurumon 37 absent).
2. Skip a candidate with an entire R or C level absent: a complete new group cannot be made
   without changing levels or consuming Options. Matadormon's otherwise best #36 has no
   Champions; #52 is next. Skip Player-owned candidates because the result must be playable
   as an opponent: Flaremon's otherwise best #158 Practice is excluded, so #42 is next.
3. If no card of the target Specialty exists at a missing R/C level, use the most populous
   Specialty **at that level** (count copies; ties use ascending Specialty ID), then the
   most numerous card of that Specialty and level (ties use ascending card ID). This supplies
   complete Darkness/Rare groups in the Fire bases of MetalTyrannomon and Wingdramon.

These exceptions and tie-break choices are original project deck design, not disc rules.
Never replace Options, change a donor's level, insert extra cards or perform a partial
copy replacement. Names and all inherited owner/rank/armor/music fields follow the rules
above. Gameplay choices remain the independent TS-106 designs, not the visual donor stats.

## Gameplay source (2026-10-14)

Use the original stat/effect designs in [card-design.md](card-design.md), completed under
TS-106, when choosing decks. Donor ids determine existing visual assets, not new gameplay.
