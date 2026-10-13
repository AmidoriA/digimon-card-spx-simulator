# TS-001: Verify the roster against Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/sFJRSkSQ |
| Phase | 0 Groundwork |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | none |

## Goal

Make sure each of the 45 proposed Digimon is in *Digimon Story: Time Stranger*, is not on the DDCB disc, and has a documented thematic Specialty. The proposal in [roster.md](roster.md) was written from memory; this ticket verifies it against online field-guide sources. The owner's 2026-10-13 decision retains the proposed Specialties where thematically suitable.

## Context

- [roster.md](roster.md): the proposed roster, its alternates and the columns to fill.
- `web/js/data/cards.js`: the disc's 191 Digimon; a name already there is not allowed.
- Specialty policy (owner, 2026-10-13): keep the proposed Specialty where thematically suitable. Time Stranger lists elemental matchups and skill elements, not a single intrinsic element. Record signature-skill elements accurately; the old strict element mapping is only thematic guidance. The README under "Not from the game code" and roster.md record this decision.
- The owner's install (`D:\Games\Steam\steamapps\common\Digimon Story Time Stranger`) is the final word if a site and the game disagree; once TS-201/TS-203 can read its tables, check the roster against them too.

## Steps

1. For each row, find a page that shows the Digimon in Time Stranger's field guide (field guide number, stage, attribute, element). Record the URL, field-guide number, attribute and signature-skill element in the row; explicitly record a non-damaging signature as None (debuff).
2. Check the stage: Rookie → R, Champion → C, Ultimate → U. (DDCB's U also holds Megas; this project uses Time Stranger Ultimates only, as the owner asked.)
3. Apply the owner's thematic Specialty policy. Retain the proposed Specialty when suitable, document any mismatch with the signature element, replace missing species and keep evolution families together where possible.
4. Check every name against `cards.js` (no Digimon of the disc, under its old or new name).
5. Each (Specialty, level) slot keeps three different bases; a replacement Digimon gets a base by body shape (same Specialty first; another Specialty is marked ✱ and needs a battle recolour in Phase 1).
6. Update roster.md and log every swap with its reason.

## Acceptance criteria

- [x] 45 rows, 3 per (Specialty, level), each with a Time Stranger source URL and accurately labelled signature element (or non-damaging signature), under the owner's thematic policy.
- [x] No name is on the DDCB disc.
- [x] Each slot has three different bases; ✱ marks every cross-Specialty base.
- [x] Swaps are logged here with the reason.

## Out of scope

- Stats, pictures and models (later tickets).

## Questions for the owner

- Resolved 2026-10-13: the owner chose "Keep the proposed Specialty when thematically suitable" instead of forcing the signature attack's element or picking one resistance.
- No whole evolution family was missing. Two individual species were replaced as logged below; no alternate-family decision is pending.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->


### 2026-10-13 — online roster verification

- Started in the managed worktree `ts-001-verify-roster`, branch
  `codex/ts-001-verify-roster`, based on planning commit `9dac800` from
  `origin/ccr-c44316bd-21mmda`. Moved the Trello card from Todo to Doing.
- Read each retained/replacement Digimon's [Time Stranger field-guide page](https://digimon.jsuk.cloud/en/d/).
  All 45 final rows have the correct Rookie/Champion/Ultimate stage and a source number,
  attribute and signature element. Non-damaging signatures and Neutral counter damage
  are labelled explicitly. Source URLs are in roster.md; these are community sources
  with linked game screenshots, not a transcription of the owner's local tables.
- Owner decision: keep proposed Specialties where thematically suitable. Documented the
  distinction between custom Specialty, elemental matchups and skill elements in
  roster.md and the README's "Not from the game code" section. No signature element
  was changed to fit a card's Specialty.
- Corrected three Huckmon-family spellings and BlackAgumon's Time Stranger name;
  disambiguated Coredramon as Blue (091) because it evolves into Wingdramon.
- 332: DarkTyrannomon → [Kurisarimon (178)](https://digimon.jsuk.cloud/en/d/kurisarimon/).
  The missing species is absent from both the 476-entry index and
  [DigimonWiki's field guide](https://digimon.fandom.com/wiki/Digimon_Story:_Time_Stranger/Field_Guide).
  Kurisarimon was already an allowed alternate, is Champion, and has a Dark signature.
  Base Tyrannomon (16) ✱ → Bakemon (123), a closer floating placeholder in Darkness;
  removing this cross-Specialty base leaves five ✱ rows. This themed column is not
  claimed to be a direct evolution chain.
- 319: MarineDevimon → [Dragomon (282)](https://digimon.jsuk.cloud/en/d/dragomon/).
  MarineDevimon is also absent from both indexes. Dragomon is an aquatic Ultimate
  explicitly reachable from Octomon, so it retains the aquatic route. Base
  WaruSeadramon (43) → Zudomon (40), a bulky aquatic biped; Ice/U bases are 39, 41, 40.
- Compared all 45 final identities against the disc's 191 Digimon in
  `web/js/data/cards.js`, checking relevant English spelling aliases. No duplicates.
  Verified ids 302–346, models 401–445, three cards and three different exact base ids
  in every slot, source stages and all cross-Specialty markers.
- Local install validation remains a follow-up after TS-201/TS-203, including the black
  Agumon variant's availability in the installed version. The online audit needs no
  models or assets and does not implement any later ticket.
- Validation: all 29 self-tests and 11 deck tests passed; 200 simulated matches ended with zero timeouts; all board-effect scripts and the asset-path check passed. The change is documentation only, so there is no changed browser screen to inspect.


### 2026-10-13 — dependent tickets and feature branch

- Owner requested a shared `time-stranger` feature branch and explicitly authorized
  pushing to GitHub. All ticket work starts from this feature branch and returns to it;
  do not merge it to `main` until every one of the 45 new cards is complete and validated.
- Synchronized the Phase 1 ticket tables, Phase 2 model lists, deck target list and
  Fire/Ice deck tickets with the verified roster. Model/card ids remain unchanged.
- Corrected the earlier note's cross-Specialty count from six to five. The actual ✱
  rows were 329/330/335/344/346 at that audit. The later Keramon/Tsukaimon
  correction retires 20000; active rows are 330/335/344/346 at 30000/40000/50000/60000.
  Kurisarimon's same-Specialty Bakemon base does not consume a battle offset.
- Updated linked ticket/roster/deck addresses and affected Digimon checklist names
  on Trello, preserving unfinished ticket state. TS-001 moves to Done after the push;
  this does not mean any of the 45 cards has been implemented yet.

### 2026-10-13 — owner correction: Keramon replaces Agumon (Black)

Current slot 329 is Keramon, Darkness/R, base Tsukaimon (135), placeholder model 428.
Initially its numbers/effects were copied from Tsukaimon; TS-106 supersedes that
with original gameplay (card-design.md). Local char_KERAMON → chr626 is
present in both model tables; Phase 2 converts all nine Darkness models. The old
black Agumon exception is superseded. Official EX1-044 crop [80,105,320] needs no
restoration and is shared by both art modes. Offset 20000 is retired; the four other
published offsets remain stable. [Full evidence and current roster](roster.md).
