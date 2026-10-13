# TS-004: Picture editing through the local ComfyUI

| | |
|---|---|
| Trello | https://trello.com/c/GAJm2Oml |
| Phase | 0 Groundwork |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
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

- [x] `tools/comfy.py` can inpaint (and outpaint, if needed) with a stored workflow and a fixed seed.
- [x] Running the same recipe twice gives the same picture.
- [x] The installed models used are named in the README.
- [x] The owner has seen one before/after and agrees with the result.

## Out of scope

- Drawing new art: edits only remove print or extend the picture's own background and edges.

## Questions for the owner

- Which inpainting model to use, if ComfyUI has none installed.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

- 2026-10-13: Inspected local `/object_info`; the installed `512-inpainting-ema.safetensors` checkpoint and stock InpaintModelConditioning/KSampler nodes fit card-print removal. No model was downloaded. Added public `comfy.inpaint` and optional `outpaint`, using the stored `tools/comfy_workflows/ts002-inpaint.json` graph, explicit seeds and native-size masked compositing. Existing upscaling is unchanged.
- 2026-10-13: TS-002 prepared 44 selected edits with recipes, masks, before/after and hash metadata; Crescemon uses its unedited official Reference Book picture because attempted leg restoration failed visual review. The preparer now uses the public API. `build_custom.new_art_source` loads recorded edited crops only after source/crop, recipe/workflow and pixel-hash verification; tested all 44 caches, missing and mismatched sources, outside-cache paths, mask-size errors and an empty-mask no-op. An actual scratch custom-card build using edit 303 produced its new-art files.
- 2026-10-13: Two independent public-API uploads with the same seed/source/mask gave the accepted decoded SHA-256 `96b5cbc7c0e3e262e468c2c45f8df704771a5fc0207ba1ea7371cb5e666d99ce`. One initial run after model switching differed; no cross-reload or cross-hardware pixel determinism is claimed. Verified chosen cached pictures are kept for exact rebuilds. Padding-only outpaint trials preserved every original pixel but introduced pale framing, so those trials are not selected assets; no selected picture needs this optional helper.
- 2026-10-13: Shown Coronamon EX5-007 before/after; the owner replied "ยอมรับผลนี้". README names the installed models, source/edit accounting, commands and measured limits.
