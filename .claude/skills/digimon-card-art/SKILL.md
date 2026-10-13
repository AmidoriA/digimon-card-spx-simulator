---
name: digimon-card-art
description: Find official Digimon artwork, choose square card crops, and remove card print or extend illustration edges through local ComfyUI for the Digimon Digital Card Battle project.
---

# Digimon card artwork

Use the owner's requested sources and editing service. This workflow prepares illustrations;
building game assets is a separate task unless requested. Read the project's ticket, roster,
and artwork section of README before choosing pictures.

## Find the source

- Search the official card list with `https://world.digimoncard.com/cardlist/?search=true&free=<name>`.
  `free` is the search parameter; `card_name` does not filter it. The page returns rules-text
  matches too, so extract `popupCol` records and compare their `cardTitle` exactly.
- Use [scripts/search_cards.py](scripts/search_cards.py) to cache the search page and optionally
  download regular-card candidates. Run `--help` for arguments. Underscore-suffixed card numbers
  usually identify alternate illustrations and are excluded by default.
- Inspect candidate pictures. Prefer a plain, clearly recognizable pose with the whole visible
  figure and no SAMPLE across it. Regular older cards often avoid SAMPLE; age alone does not
  establish quality or identity.
- Confirm variants visually: the English card title can omit `Black` from Agumon and the colour
  from Coredramon. The current roster uses **EX1-044**, crop **[80,105,320]**, for Keramon and
  **EX3-018** for Coredramon (Blue). The old BT8-058 black Agumon source was retired
  when the owner classified it as Fire and replaced it in Darkness. A suitable clean
  crop needs no ComfyUI edit; shared art may reuse that native crop in both modes.
  Official spellings may differ from a game roster; verify the alias rather than guessing.
- Download from `https://world.digimoncard.com/images/cardlist/card/<NO>.png`. If no suitable
  card illustration exists, use the official Reference Book, verify the species/slug there,
  and cache `https://digimon.net/cimages/digimon/<slug>.jpg`. Record why the fallback was used.

## Crop and clean

Read [references/comfy-editing.md](references/comfy-editing.md) when removing card print or
extending an edge. Check the installed models before choosing a workflow; do not download a
new model without the owner's instruction.

- Normalize card pictures to 430×600 like `tools/build_new_art.py`. Record `[x, y, size]` in
  that coordinate space, not in a resized preview. Keep the Digimon centred.
- A narrow crop can avoid print but lose ears, wings or feet. Try another source or a wider
  square with a precise mask. The TS-002 `[0, 24, 430]` crop retains almost the entire source
  illustration and cleans the card margins; it is a starting point, not a universal crop.
- Protect the unmasked illustration. Remove only specified print or extend the source's own
  background/edges. Do not replace the Digimon with a newly drawn interpretation.
- Keep downloads, masks, before/after pictures and metadata under `extracted/newart`, outside
  git. Commit the manifest, recipes and workflow. Record every edit in the roster and README.
- Use the project's `tools/prepare_time_stranger_art.py` for TS-002 replay. Its manifest is
  `tools/time_stranger_art.json`, its recipes `tools/new_art_edits.json`, and its stored graph
  `tools/comfy_workflows/ts002-inpaint.json`. Confirm these files exist on the selected branch.

## Verify

Inspect **every** resulting crop, using contact sheets followed by full-size checks for unclear
areas. Look for residual print, generated pseudo-text, artificial borders, changed anatomy,
poor seams and a shifted subject. Extend the mask over complete multiline rules blocks;
masking only some lines was a demonstrated source of leftover text.

Check source/mask/output hashes and confirm pixels outside the mask match the source exactly.
For a new workflow, replay one recipe with independently uploaded identical inputs and compare
decoded pixel hashes; a fixed seed by itself does not prove reproducibility across hardware or
ComfyUI versions. Reuse a verified cached output unless the recipe or source changed.

Report what was inspected and any remaining limitations. Tick only satisfied ticket criteria.
This skill does not authorize Trello comments, publishing, unrelated model installs, or merging
the Time Stranger feature to main; follow the current user's request and repository branch gate.
