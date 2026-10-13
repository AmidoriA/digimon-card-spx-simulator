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

- [x] `tools/ts_extract.py` unpacks the archives that hold models, textures and animations.
- [x] The README section lets someone with the same build repeat it.
- [x] No raw file from the install (archives, unpacked files) is committed; only the converted models are (see Decisions).
- [x] If an archive cannot be opened: status `blocked`, with what was tried. (Not needed: all 102 opened.)

## Out of scope

- Reading the model format itself (TS-202).

## Questions for the owner

- None.

## Decisions

- 2026-10-13, the owner: models converted from Time Stranger (`web/assets/models/401-445`) are committed to this repository and published on GitHub Pages like the disc's models. The unpacked Time Stranger files (`extracted_ts/`) stay out of git.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-13

**Build.** Steam app 1984270, build id 23514637, main depot 1984271 manifest
2791297361435523425. `Digimon Story Time Stranger.exe`: 30,453,760 bytes, SHA-256
`ff9de825a543bf874cfb7e73ed951256d3ce4e8702957afa3b26ca6487a81688`. `gamedata/` holds 102
`.mvgl` and 6 `.cpk` files (32.4 GB); every size and SHA-256 is in
[files-23514637.tsv](files-23514637.tsv). The install also has files that are not the
game's beside the executable (ReShade, `dxgi.dll`, DLSS add-ons); they were not read.

**How it was read.** REA is connected (rea-agents 6.4.0) but has no deep-analysis provider
on this machine: Ghidra is not configured and there is no Java. The executable was read as
disassembly with the new `tools/x64.py` (capstone, like `tools/mips.py`). Image base
`0x140000000`.

**`.mvgl` = `MDB1` archive, not encrypted.**

| Address | What |
|---|---|
| `0x1402b6b00` | mounts an archive: name + `.dx11` + `.mvgl`, object of 0x150 bytes (`0x1402c3bf0`) |
| `0x1402c3f40` | reads the 0x20-byte header; `0x1402c40d2` compares its first four bytes with `MDB1` (string at `0x1417853a8`) |
| `0x1402c4240` | reads the tables at 0x20: nodes (header+4, 16 bytes each), names (header+8, 0x80 each), then data entries (header+0xc, 24 each) |
| `0x1402cbbc0` | builds the tree from the nodes and names |
| `0x1402c4c60` | builds the 0x80-byte key: extension (4 bytes), path, all lowercased |
| `0x1402cb030` | walks the tree with the key, compares the name, returns the node's data entry (node+4) |
| `0x1402c46d0` | reads a file: offset = header+0x10 + entry+0; size entry+8; stored size entry+0x10; equal sizes are read straight (`0x1402c4813`), others go through `0x140e31400` |
| `0x140e31400`, `0x140e33170` | LZ4 block decoder (its tables at `0x1414b4d58` and `0x1414b4d78`); the result must be exactly `size` bytes |
| `0x1402bfdb0`, `0x1402c0230` | the file reads: `fopen("rb")`, `fseek`, `fread`; the bytes are not changed |

The mod site's claim that the archives are encrypted does not hold for this build: all 102
start with `MDB1` in the clear, names are readable in the tables, and the read path has no
transform.

**`.cpk`** is CRI's archive; the names in the tables are sound (`.acb`, `.awb`, `.acf`)
and movies (`.usm`, `.mp4`). Not unpacked: nothing the models need.

**Unpacked.** `tools/ts_extract.py <install> <out>` (needs `lz4`, added to
`tools/requirements.txt`). Run on the whole install: `196583 files, 49261839878 bytes,
0 failed`. The working copy is at `D:\Projects\digimon card\extracted_ts` (beside
`extracted/`, in the main checkout so every worktree can use it); `extracted_ts/` is in
`.gitignore` and, until `time-stranger` is merged to `main`, in the repository's
`.git/info/exclude`.

For TS-202 and TS-203: models are `chrNNN.geom` (532 in `app_0`, with `chrNNN_lod_N.geom`
and a `chrNNN.nlst` each), motions `*.anim` (39,235), skeletons `*.skel` (25), textures
`images/*.img` (20,416).

**Left open** (in the README under "Time Stranger files", "Not read from the
executable"): which archive wins when a path is in several (17,957 paths are, 12,098 of
them in `app_0` and `patch`); the header's last field; the `.cpk` contents.
