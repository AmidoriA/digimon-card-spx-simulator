# TS-205: Converter: mesh and texture to the DDCB model format

| | |
|---|---|
| Trello | https://trello.com/c/2nugKL0f |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-202, TS-204 |

## Goal

Turn a Time Stranger model into a DDCB model file (`web/assets/models/NNN.*`) that looks like the Digimon in the 320x240 scene and costs what a disc model costs.

## Context

- `tools/build_models.py` docstring: the DM format (rigid parts, vertex = x y z nx ny nz r g b u v part palette-row, opaque then blended triangles, texture as colour indices + palette rows).
- Budget of the disc's models: 16-23 parts, about 640-880 triangles, texture up to 256x128, up to 12 palette rows; 8 motions each.
- `js/battlehd.js`: Smooth subdivides x16 and must fit 16-bit indices.
- CLAUDE.md: the scene stays 320x240; no depth buffer in Original PS1.

## Steps

1. `tools/ts_model.py <ts model> <base card> <model number>`: bind every vertex to its heaviest bone; merge bones with few vertices into their parent until there are no more parts than the base has (log the merges).
2. Decimate the mesh to the base's triangle count, keeping UV seams.
3. Bake the textures into one sheet no larger than 256x128, quantised to the palette size the format uses, at most 12 rows; split triangles that cross palette regions as the disc models do.
4. Scale and turn the model to the base's height and facing (base's bounding box in its idle pose).
5. Where the reduced texture loses detail that reads at 320x240 (eyes, markings) or shows seams, touch it up through ComfyUI (TS-004) before quantising; log each edit.
6. Write the bind pose as a one-key motion in all 8 slots for now.

## Acceptance criteria

- [ ] Guilmon written as model 401 stands in `battle-preview.html` in Original PS1, Enhanced and Smooth (screenshots in the log).
- [ ] Parts, triangles, texture size and palette rows within the base's figures.
- [ ] `node tools/battletest.js` validates it.

## Out of scope

- Motions (TS-206).

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
