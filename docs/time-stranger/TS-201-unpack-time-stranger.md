# TS-201: Find and unpack Time Stranger's files

| | |
|---|---|
| Status | todo |
| Phase | 2 Models |
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
- [ ] Nothing from the install is committed.
- [ ] If an archive cannot be opened: status `blocked`, with what was tried.

## Out of scope

- Reading the model format itself (TS-202).

## Questions for the owner

- May models converted from Time Stranger be committed to this repository and published on GitHub Pages, or should they stay local (built by a tool, not in git)?

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
