# TS-202: Read Time Stranger's model format

| | |
|---|---|
| Status | todo |
| Phase | 2 Models |
| Depends on | TS-201 |

## Goal

Read a Time Stranger Digimon model completely: mesh, skeleton, skin weights, materials, textures.

## Context

- `extracted_ts/` from TS-201.
- REA for the parser in the executable.

## Steps

1. Find Guilmon's model file (or any Digimon's, then Guilmon's).
2. Read the mesh (positions, normals, UVs, vertex colours, index buffers, submeshes), the skeleton (bone tree, names, bind pose), the skin weights and the materials/textures (texture format and how it is decoded).
3. Write `tools/ts_model_read.py` and a dump to glTF (`.glb`) for inspection.
4. Open the dump in a viewer and compare with the game.

## Acceptance criteria

- [ ] Guilmon's `.glb` shows the right shape, textures and a bind pose matching the game (screenshot in the log).
- [ ] README: the format, field by field, with where it was read.

## Out of scope

- Animations (TS-203).
- Conversion (TS-205).

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
