---
name: import-ts-model
description: Give custom cards their Digimon Story Time Stranger geometry, full skeleton, native textures and motions. Use for TS-208 imports, incorrect converted anatomy, and source/native model pipeline changes.
---

# Giving a custom card its Time Stranger model

A custom card starts with its disc base's recolored model. The current workflow replaces
it with the Digimon's complete Time Stranger model while keeping the base battle scripts.
The owner explicitly changed the requirement on 2026-10-14: retain full source shape,
textures and bones; revisit a triangle budget later. Use `"native": true` for this work.
Do not silently apply the former Angewomon 976-triangle/30-part/256 x 128 budget, a
2000-triangle interim budget, or the legacy `no_decimate` 30-part path.

Read the README's Time Stranger model/motion sections, the card's roster row, its
TS-208 ticket, `docs/time-stranger/motion-slots.md`, and the TS-207 Guilmon pilot log
before the first model. The pilot's reduced-mesh figures are historical; its source
comparison and visual verification lessons still apply. These are another game's files,
not PlayStation-native models.

| File | Role |
|---|---|
| `tools/custom_cards.json`, `tools/custom.py` | Card model proposals and accepted options |
| `tools/build_custom.py` | Canonical card build; routes `native: true` to the native exporter |
| `tools/ts_native_model.py` | Full source geometry, four-weight skin, full skeleton and RGBA exporter |
| `web/js/battlenative.js` | Native parser, CPU weighted skin, bounds and quaternion helpers |
| `web/js/battle3d.js`, `web/js/battleultra.js` | Native playback/material rendering and Ultra drawing |
| `tools/ts_model_read.py`, `tools/ts_anim_read.py` | Source model/texture and motion readers |
| `tools/ts_mbe.py` | Source identity tables |
| `tools/sheet_server.py`, `tools/model_sheet.js`, `tools/model_sheet_page.html` | Six browser cases, timelines and saved pictures |
| `tools/battlenative_test.js`, `tools/ts_native_model_test.py` | Native semantic regression tests |
| `tools/ts_model.py` | Optional historical reduced-format converter |

Unpacked disc files, the Time Stranger extraction (about 49 GB), and the Python virtual
environment may live only in the main checkout. Use full paths from a worktree. Never
commit extracted source data. Run every Python source-reading tool with `python -I`.
A helper importing project tools must explicitly add that tools directory to its path.

## 1. Establish identity, effects and size

Read the roster for card ID, model number, `chrNNN` and disc base. Confirm the base's
model number from the generated cards data. Read the base's three rows in motion-slots,
including every body-part number named by its effects. Part 0 also matters for incoming
hit effects. Inspect a colored front/side preview of the disc base to identify the actual
anatomy behind those numbers; compare left/right in the same facing view.

Look up the base's own Time Stranger identity if available using the English name table
and `char_info`. Names can differ (Goblimon, Tailmon, Vamdemon); search name fragments,
then verify the exact identity rather than choosing a similar Digimon.

```bash
tools/.venv/Scripts/python -I tools/ts_mbe.py extracted_ts/app_text01/text/char_name.mbe Sheet1 Goblimon
tools/.venv/Scripts/python -I tools/ts_mbe.py extracted_ts/app_0/data/char_info.mbe char_info char_GOBURIMON
```

The base-height rule is the default. Consider `--against <base's own .geom>` only when
source/base height ratio is about 0.8 to 1.3 and the body looks appropriately sized beside
the base. Record both measured heights, ratio and decision. Horns, ears, raised weapons
or flames can dominate height; compare the body too. An optional numeric `--ground SOURCE_Y` (card `ground`) chooses a measured source
foot-sole floor when an accessory extends below the feet. It changes translation only.
Record the source bind/standing measurement and recheck every motion. A manual `--size K` is allowed when
needed, but record the exact factor as a visual choice and why. A similar silhouette is
not evidence of matching source scale.

## 2. Read and compare the full source

Draw the source with overlays and inspect poses from actual source motion files before
judging the import. Compare with the card's official artwork or another official image.
Check face marks, eyes, body colors, paired limbs, wings, armor, feet, cloth and weapons.

```bash
tools/.venv/Scripts/python -I tools/ts_model_read.py extracted_ts/app_0/chr136.geom --png source.png --overlays
tools/.venv/Scripts/python -I tools/ts_anim_read.py extracted_ts/app_0/chr136_ba01.anim --geom extracted_ts/app_0/chr136.geom --frame 20 --png source-pose.png
```

The source debug raster is not the native browser renderer. Alpha planes can appear as
rectangles in that raster; check native RGBA transparency in the browser. The material
shader is not fully read. A known example is Keramon: decoded native eye textures contain
black pupils, while card artwork shows green rings; do not invent a green recolor or claim
shader parity. Record the observed limitation and the source evidence.

## 3. Make a native scratch export and choose aliases

```bash
tools/.venv/Scripts/python -I tools/ts_native_model.py extracted_ts/app_0/chr136.geom web 80 <scratch-dir> 402 --part 0=J_spine01 --part 6=J_hand_r --stats <scratch-dir>/stats.json
```

Arguments are source geometry, current web directory, disc base model number, output
directory and new model number. `--part N=BONE`, `--motion SLOT=NAME`, `--against GEOM`
and `--size K` repeat or work as shown in the CLI help. Read the exact figures and stats.
Keep all drawn mesh vertices/triangles, original source bone IDs and hierarchy, inverse
bind matrices, four normalized skin weights, source UVs and native-resolution RGBA
material textures. Unindexed zero-weight source vertices may exist; they are retained
but do not contribute to drawn bounds. A referenced zero-weight vertex is a fault.

`parts` maps a script's logical number to an original source bone **as an effect alias**.
It does not merge, reorder or renumber source bones. True skeleton matrices remain
separate from aliased effect matrices. Choose anatomical aliases for all script numbers,
including high numbers such as Paildramon's 28/29; a convenient bone number is not a
justification. Check emitters in each attack, and log unavoidable anatomy differences.

Standard slots are 0/7 `bn01`, 1 `ba01`, 2 `ba02`, 3 `bs01`, 4 `bd01`, 5 `bd02`, 6 `bv01`.
The exporter prints missing-motion substitutions. Inspect them; use another named source
motion when a substitute duplicates attacks or has the wrong role. Record every change.
Native local positions/scales and quaternions retain source precision. Bone rotations
are rest times motion as established by the reader, and playback uses quaternion slerp.
No Euler/SVD decomposition or inversion of a posed singular matrix is needed. Legitimate
zero-scale animation hides geometry; do not invent an unhidden pose to conceal it.

Native affine placement must apply site translation once. If source bind vertices use
C = S plus site shift (S is the untranslated axis/scale basis), native bone world is
C × source bone world × inverse(S), and native inverse bind is
S × source inverse bind × inverse(C). Using C on the inverse bind's left side double-applies
root placement. Check a nonzero shift or ground with rotated/nonuniform and zero-scale
bones against transformed source weighted poses and rest bounds. Zero-shift tests do not
catch this error. A correction requires rebuilding every affected native asset and fresh
browser QA.

Base key durations, camera, sounds and effect timing remain. Source poses are sampled
over source duration at those key times. This preserves the script timeline, but does
not prove the source strike occurs on the inherited effect moment. Source camera,
location and effect-animation files are not automatically imported.

## 4. Build the card canonically

```json
"model": {"number": 402, "ts": "chr136", "native": true, "parts": {"0": "J_spine01", "6": "J_hand_r"}}
```

Optional `against`, `size` and `motions` are anatomical/timing choices. Omit reduced-only
`detail`, `figures`, `preserve_seams` and `no_decimate` from native proposals. Remove the
old model recolor and remove unused recolor rules when integrating. With multiple workers,
write separate proposals/log fragments and have one owner integrate shared config/docs.
A worker can run canonical `build_custom.main()` with a parsed configuration copy that
replaces only its owned model entries, leaving the shared file untouched until integration.

```bash
tools/.venv/Scripts/python -I tools/build_custom.py extracted web model 303
```

Native artifacts are `web/assets/models/402.bin.gz` (gzip JSON `ts-native-v1`) and
`402-0.png`, `402-1.png`, etc. (one RGBA image per material), not a palette/index pair.
The generated card still references the same model number. Check deterministic output
when changing exporter code. Obsolete reduced `.png`/`p.png` artifacts can be removed
once no current model uses them; never delete source data during import.

## 5. Verify source semantics and all browser cases

Run meaningful native/parser tests for changes to that pipeline, then `battletest.js`
and the required CLAUDE checks at the integration owner level. Avoid every worker running
the same full suite simultaneously. Native models may exceed 32 bones and 65,535 source
or expanded vertices. Native rendering uses expanded drawArrays and its own adaptive
smoothing path; the historical 16-bit disc index limit is not a native source budget.

Open the sheet harness on the active sheet server, e.g.
`http://localhost:8767/sheet-qa.html?card=303` (use its actual configured port), click
**Run model sheets**, and read each saved JPG. A batch can use `?cards=303,304`. Generate
three attacks, damage, KO and victory in Original PS1, Enhanced and Enhanced Ultra
(Smooth), with the base beside the new model. Each case must have saved true, shots equal
to wanted (normally 30), errors 0 and sameTimeline true. Derive five frames over the
case's actual motion timeline; a far-frame probe provides runs/ended checkpoints.

Read every sheet and compare to full source and official art. Confirm whole connected
anatomy, face/marks/colors, both sides when the pose is symmetric, upright facing/ground
placement, armor/cape/feet/weapons and correct effect body parts. Inspect source motion
keys when geometry leaves the camera, especially collapse/flight/cloth poses. Metrics
alone do not show whether the Digimon was visible. If inherited framing clips it, use
fixed-camera full-source pose evidence and document the precise case/frames; choose a
suitable source substitute only when warranted, and record it. Reload after a rebuild
because the browser caches models. Save the final reviewed pictures/results to docs/img.

## 6. Record reviewable evidence

Update the README, roster phase status, ticket log and checklist as authorized. Record
canonical command/helper, full geometry/bone/material counts and texture dimensions,
all anchor aliases with anatomy, measured size decision, eight motion sources/durations
and substitutions, observations for each of the six sheets, and remaining limitations.
Link reviewed JPGs/JSON and source/pose references. Do not reuse superseded reduced-mesh
figures or claim shader/strike synchronization that was not checked.

## Optional historical reduced-format workflow

The TS-207 pilot and early TS-208 work used `tools/ts_model.py`. This remains available
only when a user explicitly requests that reduced format or a separate compatibility
experiment; it is not the current full-source task's default.

```bash
tools/.venv/Scripts/python -I tools/ts_model.py extracted_ts/app_0/chr136.geom web 80 <scratch-dir> 402 --detail 170 --part 6=J_hand_r --show 0,6 --preview look.png --poses poses.png
```

`--detail 170` historically meant 30 parts, 976 triangles, 256 x 128 and 14 palette rows.
`--figures` individual CLI flags/card `figures` and card `detail` choose other supported
legacy figures. `--preserve-seams` protects source UV/material/bone wedges, eye vertices,
connected surfaces and closed shells during reduction; examine texture stretch and the
actual final budget. `--no-decimate` keeps legacy triangle detail but still does not imply
full native bones, textures or weighted skin. Legacy exports are `.bin.gz`, index `.png`
and palette `p.png`. Their 16-bit index/bone/texture limitations do not describe the
native exporter. Lost shell components, cloth, eyes and joints must never be accepted
because a reduced result is recognizable. Compare every body component against source.

Historical traps still matter: UV v counts from the bottom; rigid `POSITION.w` selects
a bone palette index; motion rotations are made after rest rotations; giving an entire
triangle to one bone tears weighted joints. Native skin must compose posed full bone
world with source inverse bind and weight positions/normals at each vertex, not invert a
posed matrix. Test nonuniform parent scale/rotation and zero scale with reference affine
math when changing this. Keep source reading and model rendering faults distinct.
