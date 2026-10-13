# TS-004: Picture editing through the local ComfyUI

| | |
|---|---|
| Status | todo |
| Phase | 0 Groundwork |
| Depends on | none |

## Goal

The owner's local ComfyUI is used to edit pictures, not only to enlarge them: clean a card picture's print out of a crop, extend a picture cut off at the edge, and touch up a reduced texture. Set up the tool once so every ticket that edits a picture does it the same, repeatable way.

## Context

- `tools/comfy.py`: today only `upscale(image, model, prefix)` through `http://127.0.0.1:8188` (RealESRGAN_x4plus).
- CLAUDE.md rule 3: pictures come from the game's (or the stated) sources; enlarging goes through ComfyUI. Editing is new: every edited picture must be named in the README under "Not from the game code".
- Users: TS-002 (card pictures), TS-205 (textures, if a reduced texture needs it).

## Steps

1. Ask ComfyUI what it has (`/object_info`, the models folder): inpainting and outpainting models and nodes. Use what is installed; if nothing fits, ask the owner which model to install rather than picking one.
2. Add to `tools/comfy.py` an `inpaint(image, mask, prompt, …)` (and `outpaint` if needed) that runs a stored workflow (`tools/comfy_workflows/*.json`) with a fixed seed, so the same input gives the same picture.
3. Write where edits are kept: the edited picture is saved next to its download (under `extracted/newart/edited/`) and its recipe (source, mask, prompt, seed, workflow) in `tools/new_art_edits.json`, so `build_custom.py` uses the edited one.
4. Try it on one card picture with a cost circle at the edge; show the owner before and after.
5. README: how pictures are edited, and the rule that each edited picture is listed.

## Acceptance criteria

- [ ] `tools/comfy.py` can inpaint (and outpaint, if needed) with a stored workflow and a fixed seed.
- [ ] Running the same recipe twice gives the same picture.
- [ ] The installed models used are named in the README.
- [ ] The owner has seen one before/after and agrees with the result.

## Out of scope

- Drawing new art: edits only remove print or extend the picture's own background and edges.

## Questions for the owner

- Which inpainting model to use, if ComfyUI has none installed.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->
