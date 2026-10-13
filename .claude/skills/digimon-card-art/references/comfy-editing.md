# ComfyUI card restoration

The owner selected local ComfyUI for this project, at `http://127.0.0.1:8188`.
Use `/object_info` to verify model/node availability. On 2026-10-13 the stock inpainting
checkpoint `512-inpainting-ema.safetensors` and the nodes below were installed. Availability
is not guaranteed in another session. No new model download was needed for TS-002.

The maintained recipe and runnable implementation are in the repository's `tools/` directory;
use them instead of reconstructing the graph from memory. For other rosters, adapt the manifest
and masks while retaining the same cache and visual-review contract.

## Graph and settings

`LoadImage → CheckpointLoaderSimple / CLIPTextEncode → InpaintModelConditioning → KSampler
→ VAEDecode → SaveImage`. Positive and negative conditioning both connect through
`InpaintModelConditioning`. `LoadImage` reads the mask from inverse alpha: transparent pixels
are masked, opaque pixels are protected.

TS-002 settings: 512×512 model input; 24 steps; CFG 6; Euler sampler; normal scheduler;
denoise 1; explicit fixed seeds recorded in each recipe (usually `202610130002 + card id`,
with Lunamon incremented once after a generated mark was rejected). These are tested defaults for this
checkpoint, not requirements for different models. The negative prompt weights text/letters
at 1.5 and numbers at 1.3, also excluding logos, borders, duplicate characters and extra limbs.
Positive prompts describe a seamless continuation of the existing illustration's background,
colors, lighting and pose. They do not request a new character design.

The model output returns to the crop's native size. Composite it into the original with a soft
1px seam **inside** the declared mask; preserve every pixel where the original mask is zero.
The API returns a prompt id. Poll that job's `/history/<id>`, detect execution errors, and read
the saved image through `/view`. Do not interrupt or clear someone else's queued jobs.

## Masks

In `tools/new_art_edits.json`, mask shapes use the normalized **full-card** coordinate system.
Crop the 430×600 mask using the exact manifest crop afterward. Shapes are rectangles, ellipses
or polygons. Review the mask over the actual source: printed fields differ between cards.

For the tested broad TS-002 crop, masks cover the thin outer card frame, header/DP corner,
play/digivolve cost circles, and only cards with rules print receive a lower text mask.
Multi-cost circles need an additional ellipse. Mask the complete printed block including its
last line and dark print overlay when appropriate. Do not copy one card's lower boundary to
all cards: EX2-010 and several others had text below the first attempted mask.

## Cache/replay

```powershell
& tools/.venv/Scripts/python.exe tools/prepare_time_stranger_art.py extracted --only 303
& tools/.venv/Scripts/python.exe tools/prepare_time_stranger_art.py extracted --review
# Deliberate re-execution, after checking the recipe:
& tools/.venv/Scripts/python.exe tools/prepare_time_stranger_art.py extracted --only 303 --force
```

The edited image lives at `extracted/newart/edited/ts002/<id>.png`; its `-before.png`,
`-mask.png` and JSON metadata sit beside it. Metadata includes decoded source/mask/output
SHA-256 hashes, recipe/workflow hashes and prompt id. Reuse is valid only when these inputs
and the cached output match. Preserve the actual chosen result alongside the downloads;
do not commit downloaded official artwork.

The current preparer writes native crops only. TS-003 is responsible for letting the custom
card builder consume internet/edited artwork; changing runtime art or rebuilding all original
cards is not implied by preparing a source crop.

## Measured limits and current API

`tools/comfy.py` now has `inpaint(image, mask, prompt, seed=...)`; the preparer delegates
to it. Its optional `outpaint(image, padding, prompt, seed=...)` protects all original pixels,
but the tested Coronamon extensions introduced pale framing and were rejected for use.
Treat outpaint prompts as unapproved trials until visual review. The 44 chosen TS-002
restorations extend margins with explicit inpaint masks instead.

Crescemon's EX5-020 rules cover its legs. Large-area and glyph-mask restorations failed
visual review, so the selected source is `ref crescemon`. A suitable official Reference Book
picture is preferable to guessed anatomy when no clear card crop can be restored.

Independent warmed inpaint runs matched the accepted Coronamon decoded hash
`96b5cbc7c0e3e262e468c2c45f8df704771a5fc0207ba1ea7371cb5e666d99ce`.
One run immediately after switching models differed before consecutive reruns matched.
Do not promise pixel determinism across model reloads; retain and verify the chosen cached
PNG for exact builds. `build_custom.new_art_source` accepts an `edited` path alongside its
original card/crop fields and rejects missing, mismatched, stale or damaged edit caches.

If ComfyUI is closed, use verified cached edits and continue source/data work. Image
generation/upscaling that lacks a cached result still requires the service; do not claim
those assets complete or substitute arbitrary browser resizing.
