# Time Stranger cards: ticket board

The owner asked for 45 new custom cards: for each Specialty (Fire, Ice, Nature, Darkness,
Rare) three Rookies, three Champions and three Ultimates, all Digimon from *Digimon Story:
Time Stranger* (2025) that are not on the DDCB disc; then their models taken from Time
Stranger itself; then a deck around each new Ultimate. This folder is the plan, split into
tickets so the work can be tracked.

| Phase | What | Needs |
|---|---|---|
| 0 Groundwork | Confirm the roster, find the pictures and clean them, let custom cards take a picture from the internet | Internet, ComfyUI |
| 1 Cards | 45 cards with original gameplay (TS-106) and recoloured placeholder models | `extracted/`; prepared shared pictures |
| 2 Models | Time Stranger's own models, converted to the game's format | The owner's Time Stranger install, the REA skill, ComfyUI for textures |
| 3 Decks | 15 custom decks, one per new Ultimate | Phase 1 |

Phase 2 can start alongside Phase 1 (TS-201 … TS-206 need no card); TS-207 needs Guilmon
(TS-101). Phase 3 needs only Phase 1.

## Feature branch and merge gate

All Time Stranger work belongs to [`time-stranger`](https://github.com/AmidoriA/digimon-card-spx-simulator/tree/time-stranger)
(owner decision, 2026-10-13). Start each ticket worktree from the latest feature branch;
if a ticket uses its own branch, integrate it back into `time-stranger`. Push completed
ticket work to this feature branch, with each ticket's commits kept separate.

**Do not merge this feature into `main` until all 45 new cards are complete and their
applicable acceptance criteria and validation pass.** A completed groundwork ticket such
as TS-001 does not open that gate. Main remains the published game during the feature's
development; the Pages workflow's automatic deployment is limited to pushes to `main`.
This is the documented working policy, not a GitHub branch-protection rule.

TS-001's verified roster is the source of truth for names, bases, field-guide evidence
and thematic Specialties. The Phase 1 tables, Phase 2 model lists and Phase 3 deck targets
now use Huckmon/BaoHuckmon/SaviorHuckmon, Keramon, Coredramon (Blue), Kurisarimon
and Dragomon. The four current cross-Specialty battle offsets are listed in phase1.md.

## How to work a ticket

**Status lives on Trello**, <https://trello.com/b/6XCl7ca0/my-trello-board>: one card per ticket in the lists Todo, Doing, Blocked
and Done; the card's checklist is the ticket's acceptance criteria (and, for each Specialty's
Phase 1 and Phase 2 cards, its nine Digimon). Labels give the phase: green 0 Groundwork,
yellow 1 Cards, orange 2 Models, purple 3 Decks. The files here hold what does not change
with progress (goal, context, steps) and what is found (the Log).

- Pick a card in Todo whose dependencies are in Done; move it to Doing. Create its
  worktree from `time-stranger`, not `main` or the superseded planning branch.
- If it waits on the owner, move it to Blocked and write the question in the ticket's
  "Questions for the owner" and as a comment on the card.
- Commit messages start with the ticket id: `TS-101: Add the Fire Time Stranger cards`.
  A ticket may take several commits; a commit never serves two tickets (CLAUDE.md: one
  request, one commit).
- Tick the card's checklist as each criterion is met. In the ticket's last commit write
  its Log (what was done, what was found and where: addresses, URLs, commits) and update
  [roster.md](roster.md) or [decks.md](decks.md); after the work is pushed/integrated into `time-stranger`, move the card to Done
  and comment the commit.
- The rules of `CLAUDE.md` hold for every ticket: nothing guessed, say where it comes from,
  list what is not from the game code in the README, check in the browser before calling it
  done.

## Numbers

| | From | To |
|---|---|---|
| Card ids | 302 | 346 |
| Model numbers | 401 | 445 |
| Battle offsets (✱ bases only) | 30000 | 30000/40000/50000/60000; retired 20000 |
| Order | Fire, Ice, Nature, Darkness, Rare; in each R, C, U | |

## Files

- [card-design.md](card-design.md): all 45 current stats/effects, Specialty themes and official lore sources.
- [roster.md](roster.md): the 45 cards: names, bases, numbers, sources.
- [decks.md](decks.md): the 15 decks.
- [phase1.md](phase1.md), [phase3.md](phase3.md): rules shared by the tickets of a phase.
- [motion-slots.md](motion-slots.md), `motion-slots.json`: what the eight motions of each base last and when its scripts start them (TS-204; written by `tools/motion_slots.py`).
- `TS-*.md`: one file per ticket, linked to its Trello card.

## Board

| ID | Title | Phase | Depends on | Trello |
|---|---|---|---|---|
| [TS-001](TS-001-verify-roster.md) | Verify the roster against Time Stranger | 0 Groundwork | none | [card](https://trello.com/c/sFJRSkSQ) |
| [TS-002](TS-002-find-pictures.md) | Find each card's picture | 0 Groundwork | TS-001, TS-004 | [card](https://trello.com/c/k5VoEA4W) |
| [TS-003](TS-003-art-from-internet.md) | Let `art.new` take a card-list or Reference Book picture | 0 Groundwork | none | [card](https://trello.com/c/gCoH4rVv) |
| [TS-004](TS-004-comfyui-editing.md) | Picture editing through the local ComfyUI | 0 Groundwork | none | [card](https://trello.com/c/GAJm2Oml) |
| [TS-101](TS-101-fire-cards.md) | Fire cards (302-310) | 1 Cards | TS-001, TS-002, TS-003 | [card](https://trello.com/c/Xk0ypoEh) |
| [TS-102](TS-102-ice-cards.md) | Ice cards (311-319) | 1 Cards | TS-001, TS-002, TS-003, TS-101 | [card](https://trello.com/c/Qdbd1HXO) |
| [TS-103](TS-103-nature-cards.md) | Nature cards (320-328) | 1 Cards | TS-001, TS-002, TS-003, TS-101 | [card](https://trello.com/c/AKMIGtfK) |
| [TS-104](TS-104-darkness-cards.md) | Darkness cards (329-337) | 1 Cards | TS-001, TS-002, TS-003, TS-101 | [card](https://trello.com/c/v00WU7tG) |
| [TS-105](TS-105-rare-cards.md) | Rare cards (338-346) | 1 Cards | TS-001, TS-002, TS-003, TS-101 | [card](https://trello.com/c/ZhfaqmM9) |
| [TS-201](TS-201-unpack-time-stranger.md) | Find and unpack Time Stranger's files | 2 Models | none | [card](https://trello.com/c/7uOsB4s1) |
| [TS-202](TS-202-read-model-format.md) | Read Time Stranger's model format | 2 Models | TS-201 | [card](https://trello.com/c/fkaEh4xz) |
| [TS-203](TS-203-map-models-and-animations.md) | Find each Digimon's model and animations | 2 Models | TS-202 | [card](https://trello.com/c/9HUw0jL2) |
| [TS-204](TS-204-ddcb-motion-slots.md) | Read what DDCB's eight motion slots are | 2 Models | none | [card](https://trello.com/c/Nu4LssEP) |
| [TS-205](TS-205-convert-mesh.md) | Converter: mesh and texture to the DDCB model format | 2 Models | TS-202, TS-204 | [card](https://trello.com/c/2nugKL0f) |
| [TS-206](TS-206-convert-motions.md) | Converter: motions | 2 Models | TS-203, TS-204, TS-205 | [card](https://trello.com/c/tzzuM8kp) |
| [TS-207](TS-207-pilot-guilmon.md) | Pilot: Guilmon (302) with its Time Stranger model | 2 Models | TS-101, TS-205, TS-206 | [card](https://trello.com/c/Br9ZwXGj) |
| [TS-208a](TS-208a-fire-models.md) | Fire models from Time Stranger | 2 Models | TS-207, TS-209, TS-101 | [card](https://trello.com/c/zTdFN9Xd) |
| [TS-208b](TS-208b-ice-models.md) | Ice models from Time Stranger | 2 Models | TS-207, TS-209, TS-102 | [card](https://trello.com/c/vUoHDXbM) |
| [TS-208c](TS-208c-nature-models.md) | Nature models from Time Stranger | 2 Models | TS-207, TS-209, TS-103 | [card](https://trello.com/c/Clemd8tm) |
| [TS-208d](TS-208d-darkness-models.md) | Darkness models from Time Stranger | 2 Models | TS-207, TS-209, TS-104 | [card](https://trello.com/c/EzPc1GY6) |
| [TS-208e](TS-208e-rare-models.md) | Rare models from Time Stranger | 2 Models | TS-207, TS-209, TS-105 | [card](https://trello.com/c/7IcLCqJO) |
| [TS-209](TS-209-import-skill-and-readme.md) | Skill `import-ts-model` and the README | 2 Models | TS-207 | [card](https://trello.com/c/Q68gsJGz) |
| [TS-301](TS-301-choose-decks.md) | Choose the 15 base decks and exchanges | 3 Decks | TS-101 … TS-105 | [card](https://trello.com/c/CC15DUlA) |
| [TS-302](TS-302-fire-decks.md) | Fire decks | 3 Decks | TS-301, TS-101 | [card](https://trello.com/c/tfBaYtSp) |
| [TS-303](TS-303-ice-decks.md) | Ice decks | 3 Decks | TS-301, TS-102 | [card](https://trello.com/c/aAJwuQS9) |
| [TS-304](TS-304-nature-decks.md) | Nature decks | 3 Decks | TS-301, TS-103 | [card](https://trello.com/c/LWJsByLx) |
| [TS-305](TS-305-darkness-decks.md) | Darkness decks | 3 Decks | TS-301, TS-104 | [card](https://trello.com/c/c832rBj3) |
| [TS-306](TS-306-rare-decks.md) | Rare decks | 3 Decks | TS-301, TS-105 | [card](https://trello.com/c/4tlEb1gi) |

### 2026-10-13 — owner correction: Keramon replaces Agumon (Black)

Current slot 329 is Keramon, Darkness/R, base Tsukaimon (135), placeholder model 428.
Initially its numbers/effects were copied from Tsukaimon; TS-106 supersedes that
with original gameplay (card-design.md). Local char_KERAMON → chr626 is
present in both model tables; Phase 2 converts all nine Darkness models. The old
black Agumon exception is superseded. Official EX1-044 crop [80,105,320] needs no
restoration and is shared by both art modes. Offset 20000 is retired; the four other
published offsets remain stable. [Full evidence and current roster](roster.md).

Owner update 2026-10-14: TS-106 supersedes the donor-stat gameplay rule. TS-101–105 remain
completed initial implementations; TS-106 tracks the new design and validation. Phase 3
deck choices must use this gameplay design, not the earlier unchanged-base assumptions.
