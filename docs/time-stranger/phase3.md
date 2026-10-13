# Phase 3 rules (TS-301 … TS-306)

One custom deck per new Ultimate: fifteen decks. They are this project's, made at the
owner's request, and the README says so.

- **Base deck**: a game deck that holds the Ultimate's base card. Of those, the one that also
  holds the most of the line's Rookie and Champion bases (roster.md); then the one whose
  Specialties best match.
- **Exchange**: every copy of the Ultimate's base → the new Ultimate; every copy of the
  line's R and C bases → the new R and C cards. If the deck has no copy of a line base, the
  deck's cards of the same Specialty and level are exchanged for the line's card instead,
  and the reason is logged. Copy counts stay, so the deck stays 30 cards with at most 4 of
  one card; option cards stay as they are.
- **Name**: at most 18 letters, unique among all decks, in the manner of the game's second
  decks ("Black Fire Again", "Evil Fire Revived").
- **Owner, rank, armor form, music**: the base deck's (that is how custom decks work).

Test: TS-302 adds one selftest with the list of Time Stranger decks (later tickets add to
it): each is its base deck with exactly the exchange of decks.md. `node tools/sim.js` then
plays them.
