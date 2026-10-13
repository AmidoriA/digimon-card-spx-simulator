# Time Stranger cards: ticket board

The owner asked for 45 new custom cards: for each Specialty (Fire, Ice, Nature, Darkness,
Rare) three Rookies, three Champions and three Ultimates, all Digimon from *Digimon Story:
Time Stranger* (2025) that are not on the DDCB disc; then their models taken from Time
Stranger itself; then a deck around each new Ultimate. This folder is the plan, split into
tickets so the work can be tracked.

| Phase | What | Needs |
|---|---|---|
| 0 Groundwork | Confirm the roster, find the pictures and clean them, let custom cards take a picture from the internet | Internet, ComfyUI |
| 1 Cards | 45 cards with placeholder models (their base recoloured), playable at once | `extracted/`, ComfyUI |
| 2 Models | Time Stranger's own models, converted to the game's format | The owner's Time Stranger install, the REA skill, ComfyUI for textures |
| 3 Decks | 15 custom decks, one per new Ultimate | Phase 1 |

Phase 2 can start alongside Phase 1 (TS-201 … TS-206 need no card); TS-207 needs Guilmon
(TS-101). Phase 3 needs only Phase 1.

## How to work a ticket

- Pick a ticket whose dependencies are `done`. Set it to `doing` here and in its file.
- Status is one of `todo`, `doing`, `blocked`, `done`. A `blocked` ticket names, under
  "Questions for the owner", what it waits for.
- Commit messages start with the ticket id: `TS-101: Add the Fire Time Stranger cards`.
  A ticket may take several commits; a commit never serves two tickets (CLAUDE.md: one
  request, one commit).
- In the ticket's last commit: tick its acceptance boxes, write the Log (what was done, what
  was found and where: addresses, URLs, commits), set it `done` here and in the file, and
  update [roster.md](roster.md) or [decks.md](decks.md).
- The rules of `CLAUDE.md` hold for every ticket: nothing guessed, say where it comes from,
  list what is not from the game code in the README, check in the browser before calling it
  done.

## Numbers

| | From | To |
|---|---|---|
| Card ids | 302 | 346 |
| Model numbers | 401 | 445 |
| Battle offsets (✱ bases only) | 20000 | +10000 each, in id order |
| Order | Fire, Ice, Nature, Darkness, Rare; in each R, C, U | |

## Files

- [roster.md](roster.md): the 45 cards and their state.
- [decks.md](decks.md): the 15 decks.
- [phase1.md](phase1.md), [phase3.md](phase3.md): rules shared by the tickets of a phase.
- `TS-*.md`: one file per ticket.

## Board

| ID | Title | Phase | Depends on | Status |
|---|---|---|---|---|
| [TS-001](TS-001-verify-roster.md) | Verify the roster against Time Stranger | 0 Groundwork | none | todo |
| [TS-002](TS-002-find-pictures.md) | Find each card's picture | 0 Groundwork | TS-001, TS-004 | todo |
| [TS-003](TS-003-art-from-internet.md) | Let `art.new` take a card-list or Reference Book picture | 0 Groundwork | none | todo |
| [TS-004](TS-004-comfyui-editing.md) | Picture editing through the local ComfyUI | 0 Groundwork | none | todo |
| [TS-101](TS-101-fire-cards.md) | Fire cards (302-310) | 1 Cards | TS-001, TS-002, TS-003 | todo |
| [TS-102](TS-102-ice-cards.md) | Ice cards (311-319) | 1 Cards | TS-001, TS-002, TS-003, TS-101 | todo |
| [TS-103](TS-103-nature-cards.md) | Nature cards (320-328) | 1 Cards | TS-001, TS-002, TS-003, TS-101 | todo |
| [TS-104](TS-104-darkness-cards.md) | Darkness cards (329-337) | 1 Cards | TS-001, TS-002, TS-003, TS-101 | todo |
| [TS-105](TS-105-rare-cards.md) | Rare cards (338-346) | 1 Cards | TS-001, TS-002, TS-003, TS-101 | todo |
| [TS-201](TS-201-unpack-time-stranger.md) | Find and unpack Time Stranger's files | 2 Models | none | todo |
| [TS-202](TS-202-read-model-format.md) | Read Time Stranger's model format | 2 Models | TS-201 | todo |
| [TS-203](TS-203-map-models-and-animations.md) | Find each Digimon's model and animations | 2 Models | TS-202 | todo |
| [TS-204](TS-204-ddcb-motion-slots.md) | Read what DDCB's eight motion slots are | 2 Models | none | todo |
| [TS-205](TS-205-convert-mesh.md) | Converter: mesh and texture to the DDCB model format | 2 Models | TS-202, TS-204 | todo |
| [TS-206](TS-206-convert-motions.md) | Converter: motions | 2 Models | TS-203, TS-204, TS-205 | todo |
| [TS-207](TS-207-pilot-guilmon.md) | Pilot: Guilmon (302) with its Time Stranger model | 2 Models | TS-101, TS-205, TS-206 | todo |
| [TS-208a](TS-208a-fire-models.md) | Fire models from Time Stranger | 2 Models | TS-207, TS-101 | todo |
| [TS-208b](TS-208b-ice-models.md) | Ice models from Time Stranger | 2 Models | TS-207, TS-102 | todo |
| [TS-208c](TS-208c-nature-models.md) | Nature models from Time Stranger | 2 Models | TS-207, TS-103 | todo |
| [TS-208d](TS-208d-darkness-models.md) | Darkness models from Time Stranger | 2 Models | TS-207, TS-104 | todo |
| [TS-208e](TS-208e-rare-models.md) | Rare models from Time Stranger | 2 Models | TS-207, TS-105 | todo |
| [TS-209](TS-209-import-skill-and-readme.md) | Skill `import-ts-model` and the README | 2 Models | TS-207 | todo |
| [TS-301](TS-301-choose-decks.md) | Choose the 15 base decks and exchanges | 3 Decks | TS-101 … TS-105 | todo |
| [TS-302](TS-302-fire-decks.md) | Fire decks | 3 Decks | TS-301, TS-101 | todo |
| [TS-303](TS-303-ice-decks.md) | Ice decks | 3 Decks | TS-301, TS-102 | todo |
| [TS-304](TS-304-nature-decks.md) | Nature decks | 3 Decks | TS-301, TS-103 | todo |
| [TS-305](TS-305-darkness-decks.md) | Darkness decks | 3 Decks | TS-301, TS-104 | todo |
| [TS-306](TS-306-rare-decks.md) | Rare decks | 3 Decks | TS-301, TS-105 | todo |
