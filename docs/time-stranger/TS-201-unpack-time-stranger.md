# TS-201: Find and unpack Time Stranger's files

| | |
|---|---|
| Trello | https://trello.com/c/7uOsB4s1 |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | none |

## Goal

Know how Time Stranger stores its files and get a working copy of what the models need, read from the owner's own install with the REA skill.

## Context

- Install: `D:\Games\Steam\steamapps\common\Digimon Story Time Stranger` (Steam). Read only: never write into it.
- Skill: `anthropic-skills:reverse-engineer-anything` (REA).
- Precedent: `tools/extract_iso.py`, `tools/extract_drv.py` and the README "Rebuild from the disc" (hashes of the image, what was found where).
- A web search found no published format or unpacker for this game; one mod site claims the archives are encrypted. Unconfirmed: find out.

## Steps

1. Record the Steam build id, the executable's hash and the file list (sizes, hashes) of the data folders.
2. With REA, find the archive format(s) and how the executable opens them (header, table of contents, compression, encryption and where its key comes from). Write the addresses or offsets down.
3. Write `tools/ts_extract.py <install> <out>` that unpacks into `extracted_ts/`; add `extracted_ts/` to `.gitignore`.
4. README: a section "Time Stranger files" with the version, hashes, layout and where each fact was read.

## Acceptance criteria

- [ ] `tools/ts_extract.py` unpacks the archives that hold models, textures and animations.
- [ ] The README section lets someone with the same build repeat it.
- [ ] No raw file from the install (archives, unpacked files) is committed; only the converted models are (see Decisions).
- [ ] If an archive cannot be opened: status `blocked`, with what was tried.

## Out of scope

- Reading the model format itself (TS-202).

## Questions for the owner

- None.

## Decisions

- 2026-10-13, the owner: models converted from Time Stranger (`web/assets/models/401-445`) are committed to this repository and published on GitHub Pages like the disc's models. The unpacked Time Stranger files (`extracted_ts/`) stay out of git.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
