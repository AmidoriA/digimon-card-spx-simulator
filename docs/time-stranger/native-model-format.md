# Full Time Stranger models in the web battle

Owner requirement, 2026-10-14: keep full geometry, texture resolution/colors and bones
for all 45 cards (302–346 / models 401–445). The former 976 and interim 2000 triangle
limits are superseded. This is a project web format, not a PlayStation model format.

`model.native: true` routes `build_custom.py` through `ts_native_model.py`. It retains
every vertex and triangle of the source reader's visible mesh inventory, the entire
source skeleton, all four skin influences and their source bone IDs, source UV sets,
and each material's full RGBA texture dimensions. There is no decimation, bone merging,
palette reduction or texture atlas repacking. Outline/reflection render passes and the
source lighting shaders remain unread; the reader's documented eye overlay composition
still applies, at full resolution. This does not reconstruct Time Stranger's renderer.

## Rebuild

```bash
tools/.venv/Scripts/python -I tools/build_custom.py extracted web model --ts extracted_ts/app_0
```

Give full source/venv paths in a worktree. To build a scratch model independently:

```bash
tools/.venv/Scripts/python -I tools/ts_native_model.py extracted_ts/app_0/chr137.geom web 36 sheets/firamon 405 --part 0=J_spine02 --part 6=J_hand_l --part 7=J_center --part 18=J_foot01_r --part 22=J_foot01_l --motion 3=ba02 --motion 6=fe02 --stats sheets/firamon/stats.json
```

The accepted card entry is authoritative. `parts` maps logical DDCB effect anchors to
source bone names without reordering/removing the skeleton; two anchors may name one
bone. Part 0 is required for incoming hit effects. `against` compares full source bind
heights with the base's own Time Stranger model; otherwise fit to the disc base height.
`size` is an explicit visual scale adjustment. `ground`, when present, is a measured
source Y floor used for vertical placement when a strap extends below the foot soles;
it changes translation, not geometry or the measured height.

## Asset schema

`NNN.bin.gz` contains gzip JSON. The loader recognizes leading `{` after decompression;
legacy disc models retain their original binary decoder. Native JSON uses
`format: "ts-native-v1"`, `version: 3`, and `fullSkin: true`.

| Field | Meaning |
|---|---|
| `n`, `names`, `parents` | Complete source skeleton, original source ordering/parent IDs |
| `offsets` | Flat 3 × n floating local rest translations in site coordinates |
| `inverseBind` | Flat 16 × n row-major inverse bind matrices transformed by S × source IBM × C⁻¹, with S the untranslated axis/scale basis |
| `anchors` | Logical script part number → actual source bone ID; aliases allowed |
| `meshes` | Full positions/normals, material UVs, original UV sets, reversed triangle winding, four joints/weights |
| `materials` | `NNN-0.png`, etc.; full RGBA dimensions and source sampler filenames |
| `motions` | Eight slot objects with source name, loop and base-length keys |
| key `dur`, `snd`, `r`, `q` | Base duration/sound/camera; float translations/scales and normalized local quaternions |
| `scale`, `shift`, `ground`, `baseModel` | Chosen placement and DDCB timing/camera donor |

The source-to-site transform C negates and uniformly scales the axes, with a vertical
shift; S has the same axes/scale without translation. Native bone world matrices are
C × source world × S⁻¹; the inverse bind is S × source IBM × C⁻¹, so the root shift
appears exactly once. A nonzero-ground, rotated, four-weight/zero-scale regression
caught and corrected an initial double-translation error before final acceptance.
y points downward and forward is −z in this site. Native poses retain local
position/rotation/scale and the full hierarchy, including nonuniform parent shear and
intentional zero scales. They are not decomposed through SVD into merged rigid parts.

## Playback and rendering

`battlenative.js` validates/parses the model and computes weighted vertices/normals
from world bone × inverse bind. All four influences contribute. Bounds use drawn
indexed vertices; unused zero-weight source vertices remain in the payload without
altering the visible bounds. Pose version caching shares work between the main drawing
and Ultra shadow pass. Expanded per-material GPU arrays avoid the old 16-bit index and
32-part uniform limits. Actor buffers are released when the scene stops.

The native mesh is used in Original, Enhanced and Ultra/Smooth. Those settings still
choose lighting, filtering, effects and shadows; the complete native source is already
the model geometry. Full RGBA sampling supports source repeat UVs. The original disc
models continue through their existing palette/refinement paths.

The eight slots retain the donor's key count, duration, sound and camera record. Native
local rotations interpolate with quaternion slerp; translation/scale use the existing
key easing with float precision. Source motion samples are retimed to those keys. Strike
moments are not synchronized to native special-skill events, and source leaps can leave
a donor close-up. Per-card logs identify retained camera limits and explicitly chosen
bounded motion substitutions. Camera/strike choreography remains a later task.

## Evidence

Each card has six browser sheets (three attacks, damage, KO, victory), five moments
beside its donor in three styles: 30 captured images per sheet. Timelines and page
errors accompany the sheets. Full source drawings/poses distinguish a source leap,
accessory or shader limitation from lost anatomy. The TS-208a–e logs contain exact
card entries, source counts, texture dimensions, size rules, anchors and motion choices.

Native semantic regressions cover four influences, exact RGBA resolution/colors,
affine/zero-scale poses, large bone/index ranges, UV repeat endpoints, exporter slot
objects and unused vertices. The full battle suite exercises all 711 attacks in three
styles, alongside the existing gameplay/deck/effect/path checks.
