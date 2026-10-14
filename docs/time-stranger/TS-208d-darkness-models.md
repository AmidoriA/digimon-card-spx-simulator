# TS-208d: Darkness models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/EzPc1GY6 |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-209, TS-104 |

## Goal

Convert all nine Darkness Digimon to their model numbers: Keramon (428), Monodramon (429), Dracmon (430), Kurisarimon (431), Strikedramon (432), Sangloupmon (433), MetalTyrannomon (434), Cyberdramon (435), Matadormon (436).

## Context

- **The skill `import-ts-model`** (`.claude/skills/import-ts-model/SKILL.md`, TS-209) is the
  whole procedure. Read it first and follow it for each Digimon; the steps below only name
  its steps.
- Guilmon (card 302, model 401) is the worked example: [TS-207](TS-207-pilot-guilmon.md).
- [roster.md](roster.md): each card's base and Time Stranger model.
  [motion-slots.md](motion-slots.md): the body parts each base's scripts name.
- Keramon (428) uses local chr626 (`char_KERAMON`), verified in both model tables.
  The old black Agumon placeholder exception is superseded.

## Steps

For each of the nine Digimon, Keramon/428 included, follow the skill `import-ts-model`. Independent model work may run in parallel; one coordinator integrates shared configuration and runs the full suite:

1. **Look up** (skill, step 1): its roster row, its base's model number, the parts the
   base's scripts name, and the base's own Time Stranger model if it has one.
2. **Inspect the full source and choose** (steps 2 and 3): compare source geometry,
   motion poses and official art; choose anatomical effect aliases, size (`against`,
   `size` or base height), grounding and motions. Use `native: true` to retain full source
   geometry, original skeleton and four skin weights, UVs and native-resolution RGBA.
   The owner's 2026-10-14 full-source instruction supersedes reduced Angewomon figures.
3. **Write the entry and build** (step 4): the card's `model` names `ts` and loses its
   `recolour` (and the recolour's rules, if nothing else uses them);
   `build_custom.py … model <card>`.
4. **Check** (step 5): `battletest.js`, then the sheets of its three attacks, damage, KO
   and victory next to its base in the three styles. Fix what is off and build again.
5. **Write it down** (step 6): README, roster.md Phase 2 status, the log below, and the
   Digimon's tick on this ticket's Trello checklist.

Then once for the group: the five checks of CLAUDE.md and `battletest.js`, and the commit.

Where the skill is wrong or lacks something, correct the skill in the same commit and say
so in the log.

## Acceptance criteria

- [x] Nine models written by `build_custom.py` from their card entries (428-436), including Keramon from chr626: each `model` names `ts`, none of these cards has a `model.recolour` left; card entries otherwise unchanged.
- [x] The log has, for each Digimon: its entry, the figures the tool printed, its part numbers, its size rule (with the `against` ratio or the `size` chosen), any motion that was replaced, its sheets, and what is not right.
- [x] All checks of CLAUDE.md and `battletest.js` pass.
- [x] Browser check reported as the skill's step 5 asks: every sheet read, `sameTimeline`, no page errors.
- [x] README ("Not from the game code") and roster.md updated; the Digimon ticked on Trello.
- [x] One commit, `TS-208d: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Decisions

- 2026-10-13, owner correction: Keramon replaces the Fire black Agumon variant.
  Its model chr626 is available locally, so 428 is converted with the other eight.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### 2026-10-13 — owner correction: Keramon replaces Agumon (Black)

Current slot 329 is Keramon, Darkness/R, base Tsukaimon (135), placeholder model 428.
Initially its numbers/effects were copied from Tsukaimon; TS-106 supersedes that
with original gameplay (card-design.md). Local char_KERAMON → chr626 is
present in both model tables; Phase 2 converts all nine Darkness models. The old
black Agumon exception is superseded. Official EX1-044 crop [80,105,320] needs no
restoration and is shared by both art modes. Offset 20000 is retired; the four other
published offsets remain stable. [Full evidence and current roster](roster.md).

### Final full-native review — 2026-10-14

The final canonical all-45 build and source audit passed after correcting native affine
placement. The source audit checks source meshes, UV sets, four skin influences, full bone
names/parents, native RGBA texels and sampled pose equivalence. The full battle test passed
711 cases in each of Original PS1, Enhanced and Enhanced Ultra (2,133 total), and the
required CLAUDE checks passed, as reported by the integration coordinator. Darkness review
covers 54 sheets and 1,620 saved shots. Camera clipping and source shader limits remain
explicitly recorded below. README, roster and Trello model checklist acceptance is recorded
under the coordinator's final integration; commit/push stays unchecked until completed.

Rebuild the accepted entries canonically from the consolidated configuration:

```powershell
& 'D:/Projects/digimon card/tools/.venv/Scripts/python.exe' -I tools/build_custom.py 'D:/Projects/digimon card/extracted' web model 329 330 331 332 333 334 335 336 337
```

The complete per-card recipes below use the default eight source motions. Native output
is `web/assets/models/NNN.bin.gz` plus one `NNN-MATERIAL.png` per full RGBA material.
Export statistics link each material's dimensions, exact source sample frames, scale,
optional grounding and effect aliases. No reduced-only budget fields or recolor remain.


All nine entries in `sheets/darkness-config.json` use `native: true`. Final reviewed assets are from the root canonical all-45 rebuild after the native inverse-bind affine correction. Local reproducible build helper: `sheets/darkness-native-build.py`, invoking `build_custom.main()` with an in-memory parsed configuration copy, replacing only cards 329–337. Arguments are `tools/build_custom.py D:/Projects/digimon card/extracted web model 329 330 331 332 333 334 335 336 337`; Python is the main checkout virtual environment with `-I`. Full source geometry, original bone hierarchy/IDs, inverse binds, native-resolution RGBA and normalized four-weight skin are retained. No reduction or recolor. Detailed materials and all sampled motion frames are in `sheets/darkness-native-stats.json`; canonical output log is `sheets/darkness-native-build.log`.

All 54 final corrected-affine browser sheets were regenerated and individually read, side by side with their bases, in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every case saved 30 / 30 shots, errors 0, sameTimeline true. Source drawings were compared with `web/assets/art2/ID.webp`. Default motions are retained for every card: 0/7 bn01, 1 ba01, 2 ba02, 3 bs01, 4 bd01, 5 bd02, 6 bv01. No missing-file substitutions or manual size factors. Base key durations, sounds, camera and effect timing remain; strike synchronization and source shader parity are not claimed.

| Card / model | Bones | Vertices | Triangles | Native RGBA materials | Scale | Final height |
|---|---:|---:|---:|---|---:|---:|
| 329 Keramon / 428 | 33 | 13,803 | 6,464 | 1024 x 1024, 1024 x 1024, 1024 x 1024 | 177.988275 | 208.085693 |
| 330 Monodramon / 429 | 36 | 12,384 | 5,868 | 1024 x 1024, 1024 x 1024, 1024 x 1024, 1024 x 1024 | 230.109773 | 253.913567 |
| 331 Dracmon / 430 | 49 | 15,618 | 7,242 | 1024 x 1024, 1024 x 1024, 1024 x 1024 | 1125.013421 | 248.780520 |
| 332 Kurisarimon / 431 | 34 | 16,118 | 7,650 | 1024 x 1024, 1024 x 1024, 1024 x 1024, 1024 x 1024 | 131.626453 | 209.000006 |
| 333 Strikedramon / 432 | 50 | 64,983 | 21,661 | 1024 x 1024, 1024 x 1024, 1024 x 1024, 1024 x 1024, 1024 x 1024 | 143.860759 | 309.432968 |
| 334 Sangloupmon / 433 | 45 | 16,934 | 7,616 | 1024 x 1024, 1024 x 1024, 1024 x 1024, 1024 x 1024 | 171.593200 | 327.478004 |
| 335 MetalTyrannomon / 434 | 35 | 30,456 | 14,366 | 2048 x 2048, 2048 x 2048, 1024 x 1024, 1024 x 1024 | 158.557078 | 697.167806 |
| 336 Cyberdramon / 435 | 57 | 68,445 | 22,815 | 2048 x 2048, 2048 x 2048, 2048 x 2048, 2048 x 2048 | 188.672570 | 533.583328 |
| 337 Matadormon / 436 | 65 | 16,985 | 7,562 | 2048 x 2048, 2048 x 2048, 2048 x 2048, 2048 x 2048 | 197.781842 | 430.869818 |

#### 329 Keramon / model 428 / chr626

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 428,
  "ts": "chr626",
  "parts": {
    "0": "J_mune",
    "1": "J_atama",
    "7": "J_paipu01_L"
  },
  "native": true
}
```

[Final native export statistics](img/ts208-329-native-stats.json) · [Six-case browser results](img/ts208-329-results.json).

Lavender round head, long hands/antennae, yellow collar and dangling tentacle body remain intact. Official artwork has green eye rings; decoded native eye textures render black pupils. Source shader/environment reflection is unread; no invented recolor is applied.

Tsukaimon torso/chest 0, head 1 and left ear 7 become Keramon chest, head and left antenna. Exact effect aliases: 0=J_mune, 1=J_atama, 7=J_paipu01_L.

Source height 1.169098; no exact Tsukaimon source identity was found in char_name/char_info. Disc base height used.

Eight slot durations: 80, 292, 292, 292, 124, 196, 400, 128. All source files present.

[Full source anatomy](img/ts208-329-source.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-329-attack1.jpg): 2, 74, 146, 218, 290 | Whole floating body/antennae/hands through purple spell; effects follow chest/head alias. |
| [attack2](img/ts208-329-attack2.jpg): 2, 73, 144, 215, 286 | Paired hands and tentacle body remain intact during turning/lifting; native height is lower in the inherited floating-base frame. |
| [attack3](img/ts208-329-attack3.jpg): 2, 47, 92, 137, 182 | Extended hands, collar and antennae stay whole through charge. |
| [damage](img/ts208-329-damage.jpg): 307, 337, 367, 397, 427 | Recoils and returns with all hands/tentacles intact. |
| [ko](img/ts208-329-ko.jpg): 307, 354, 401, 448, 495 | Falls onto floor with body and antennae connected. |
| [victory](img/ts208-329-victory.jpg): 625, 670, 715, 760, 805 | Visible from 670 onward, drifting toward the right edge; last frame clips the far antenna/hand slightly. Native black pupils remain. |

#### 330 Monodramon / model 429 / chr458

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 429,
  "ts": "chr458",
  "parts": {
    "0": "J_center"
  },
  "native": true
}
```

[Final native export statistics](img/ts208-330-native-stats.json) · [Six-case browser results](img/ts208-330-results.json).

Purple body, gold crest/eyes and shoulder accents, red chest straps, arm membranes, silver claws and long tail match source and card anatomy. The rigid POSITION.w reader correction is retained; no detached nails/teeth were observed.

Veemon belly/hips part 0 becomes Monodramon J_center. Exact effect aliases: 0=J_center.

Source height 1.103445, base Veemon chr114 source height 0.102224, ratio 10.794377. Source-relative scaling rejected because ratio lies outside 0.8–1.3; disc base height used.

Eight slot durations: 108, 288, 288, 288, 124, 184, 304, 124. All source files present.

[Full source anatomy](img/ts208-330-source.png). [Full weighted source pose evidence](img/ts208-330-native-pose-review.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-330-attack1.jpg): 2, 47, 92, 137, 182 | Claws and membranes remain attached during bite/lunge; no detached source-rigid teeth. |
| [attack2](img/ts208-330-attack2.jpg): 2, 47, 92, 137, 182 | Arm extension retains both membranes, feet and tail. |
| [attack3](img/ts208-330-attack3.jpg): 2, 47, 92, 137, 182 | Source leap is visible at 47/137; inherited close-up misses the body at 182. Full-source pose evidence verifies the complete airborne geometry. |
| [damage](img/ts208-330-damage.jpg): 307, 335, 363, 391, 419 | Recoil at 335/363 and low frame 391 retain whole body. |
| [ko](img/ts208-330-ko.jpg): 307, 350, 393, 436, 479 | Complete body falls to floor; feet/claws remain, final body is low behind caption. |
| [victory](img/ts208-330-victory.jpg): 482, 527, 572, 617, 662 | Whole body and paired limbs visible from 527 onward; no stray claws. |

#### 331 Dracmon / model 430 / chr457

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 430,
  "ts": "chr457",
  "parts": {
    "0": "J_atama",
    "2": "J_kakato_L",
    "7": "J_te_L",
    "10": "J_te_R"
  },
  "native": true
}
```

[Final native export statistics](img/ts208-331-native-stats.json) · [Six-case browser results](img/ts208-331-results.json).

Black asymmetric red/green eye head, white grin, purple clothes, gold buttons, red wrist/boot spikes and tail remain. Native wide hands and hand eyes are retained; source shading makes the artwork red eye appear magenta.

DemiDevimon head/body 0, left foot 2, left wing 7 and right wing 10 become Dracmon head, left heel and left/right hands. Exact effect aliases: 0=J_atama, 2=J_kakato_L, 7=J_te_L, 10=J_te_R.

Source height 0.221136, base DemiDevimon chr097 source height 1.800974, ratio 0.122787. Source-relative scaling rejected because ratio lies outside 0.8–1.3; disc base height used.

Eight slot durations: 128, 244, 268, 260, 128, 168, 240, 128. All source files present.

[Full source anatomy](img/ts208-331-source.png). [Full weighted source pose evidence](img/ts208-331-native-pose-review.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-331-attack1.jpg): 2, 58, 114, 170, 226 | Head, grin, eye marks, hands and boots stay whole; red effect overlays frame 170 and inherited frame 226 makes the body small. |
| [attack2](img/ts208-331-attack2.jpg): 2, 64, 126, 188, 250 | Hands and head stay whole through paired effect at 188. |
| [attack3](img/ts208-331-attack3.jpg): 2, 63, 124, 185, 246 | Source upward/downward leap clips upper body at 124 and reduces body size at 185; fixed-camera source evidence verifies anatomy. |
| [damage](img/ts208-331-damage.jpg): 307, 338, 369, 400, 431 | Paired arms/hands and asymmetric face remain through recoil. |
| [ko](img/ts208-331-ko.jpg): 307, 344, 381, 418, 455 | Falls with head, boots, hands and tail attached, no gaps. |
| [victory](img/ts208-331-victory.jpg): 485, 530, 575, 620, 665 | Source lateral/forward center offset plus inherited camera clips body at 530/575, returns whole at 620/665. Fixed-camera source evidence preserves default bv01. |

#### 332 Kurisarimon / model 431 / chr630

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 431,
  "ts": "chr630",
  "parts": {
    "0": "J_mune"
  },
  "native": true
}
```

[Final native export statistics](img/ts208-332-native-stats.json) · [Six-case browser results](img/ts208-332-results.json).

Purple armored shell, red horn, yellow side spikes, lower point and six long thin black tentacles with yellow/purple tips remain connected. The narrow tentacles are source anatomy, not refinement fans.

Bakemon whole ghost-body part 0 becomes Kurisarimon J_mune shell/body. Exact effect aliases: 0=J_mune.

Source height 1.587827, base Bakemon chr013 source height 2.690410, ratio 0.590180. Source-relative scaling rejected because ratio lies outside 0.8–1.3; disc base height used.

Eight slot durations: 140, 208, 224, 208, 128, 196, 380, 128. All source files present.

[Full source anatomy](img/ts208-332-source.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-332-attack1.jpg): 12, 55, 98, 141, 184 | Shell, horn, spikes and six tentacles stay connected through raised tentacles and green circle. |
| [attack2](img/ts208-332-attack2.jpg): 2, 52, 102, 152, 202 | Rotating shell and thin tentacles stay intact; inherited green effect covers the body at 152. |
| [attack3](img/ts208-332-attack3.jpg): 2, 47, 92, 137, 182 | Charge keeps shell/tentacles whole; purple wall at 137 occludes model, frame 182 is opponent. |
| [damage](img/ts208-332-damage.jpg): 307, 335, 363, 391, 419 | Tentacle tips remain connected during shell recoil and return. |
| [ko](img/ts208-332-ko.jpg): 307, 355, 403, 451, 499 | Shell rotates onto ground; all tentacles remain, last body is low behind caption. |
| [victory](img/ts208-332-victory.jpg): 473, 518, 563, 608, 653 | Whole shell/horn and tentacles visible from 518 onward; no fans. |

#### 333 Strikedramon / model 432 / chr016

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 432,
  "ts": "chr016",
  "parts": {
    "0": "J_spine02",
    "7": "J_elbow_r",
    "10": "J_armor_r",
    "11": "J_elbow_l"
  },
  "native": true
}
```

[Final native export statistics](img/ts208-333-native-stats.json) · [Six-case browser results](img/ts208-333-results.json).

Metal helmet, orange hair, purple skin, chest red mark, green pants, paired arm/foot blades and long armored tail match source and artwork. The legitimate source bs01 zero-scale hair keys are preserved.

Darkrizamon neck/body 0, right forearm 7, right shoulder 10 and left forearm 11 become Strikedramon spine02, right elbow, right armor and left elbow. Exact effect aliases: 0=J_spine02, 7=J_elbow_r, 10=J_armor_r, 11=J_elbow_l.

Source height 2.150920; no exact Darkrizamon source identity was found in char_name/char_info. Disc base height used.

Eight slot durations: 108, 240, 240, 244, 128, 208, 220, 112. All source files present.

[Full source anatomy](img/ts208-333-source.png). [Full weighted source pose evidence](img/ts208-333-native-pose-review.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-333-attack1.jpg): 2, 58, 114, 170, 226 | Whole armored body, hair, blades and tail during lunge/leap; effects are inherited Darkrizamon purple fire. |
| [attack2](img/ts208-333-attack2.jpg): 2, 47, 92, 137, 182 | White chest mark and arm blades remain whole through slash/turn. |
| [attack3](img/ts208-333-attack3.jpg): 2, 68, 133, 199, 264 | Source hair collapses legitimately in bs01 keys 35–80, and source movement leaves inherited frame at 264. Native pose evidence and finite-matrix/source-skin audit distinguish this from missing geometry. |
| [damage](img/ts208-333-damage.jpg): 307, 336, 365, 394, 423 | Recoil/return retains paired armor, pants and blade feet. |
| [ko](img/ts208-333-ko.jpg): 307, 354, 401, 448, 495 | Complete fall with tail/blades/armor intact. |
| [victory](img/ts208-333-victory.jpg): 479, 524, 569, 614, 659 | Whole bending/turning body from 524 onward; hair and tail remain. |

#### 334 Sangloupmon / model 433 / chr030

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 433,
  "ts": "chr030",
  "parts": {
    "0": "J_spine03",
    "6": "J_foot01_r",
    "9": "J_foot01_l",
    "11": "J_leg02_r",
    "13": "J_foot02_r",
    "16": "J_foot02_l"
  },
  "native": true
}
```

[Final native export statistics](img/ts208-334-native-stats.json) · [Six-case browser results](img/ts208-334-results.json).

Purple wolf, large ear/eye-band shape, long gray-purple mane, red shoulder/tail marks, front curved blade guards and all four armored feet remain. Blade guards follow front-leg bones; no source components were reduced.

Gururumon front neck/torso 0, right front foot 6, left front foot 9, right rear upper leg 11, right rear foot 13 and left rear foot 16 become Sangloupmon spine03, corresponding front feet, rear leg/foot and left rear foot. Exact effect aliases: 0=J_spine03, 6=J_foot01_r, 9=J_foot01_l, 11=J_leg02_r, 13=J_foot02_r, 16=J_foot02_l.

Source height 1.908456; no exact Gururumon source identity was found in char_name/char_info. Disc base height used.

Eight slot durations: 104, 292, 280, 292, 124, 220, 324, 124. All source files present.

[Full source anatomy](img/ts208-334-source.png). [Full weighted source pose evidence](img/ts208-334-native-pose-review.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-334-attack1.jpg): 2, 74, 146, 218, 290 | Mane, four feet and curved front blades remain through crouch and rise. |
| [attack2](img/ts208-334-attack2.jpg): 2, 68, 134, 200, 266 | Rearing and front paws retain both blades and back feet; no joint shards. |
| [attack3](img/ts208-334-attack3.jpg): 2, 73, 144, 215, 286 | Native source leap moves below/outside inherited camera at 215/286; fixed-camera source evidence retains full wolf body. |
| [damage](img/ts208-334-damage.jpg): 307, 336, 365, 394, 423 | Whole mane/feet/tail during recoil and recovery. |
| [ko](img/ts208-334-ko.jpg): 307, 360, 413, 466, 519 | Complete side fall retains all four feet, blades and tail. |
| [victory](img/ts208-334-victory.jpg): 533, 578, 623, 668, 713 | Source airborne start/crouch plus inherited camera clips upper body at 578 and lower body at 623/668; whole wolf returns at 713. Fixed-camera source evidence verifies bv01. |

#### 335 MetalTyrannomon / model 434 / chr364

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 434,
  "ts": "chr364",
  "parts": {
    "0": "J_spine1",
    "2": "J_hed",
    "19": "J_indexL",
    "20": "J_middleL",
    "21": "J_thumbL"
  },
  "native": true
}
```

[Final native export statistics](img/ts208-335-native-stats.json) · [Six-case browser results](img/ts208-335-results.json).

Silver mechanical dinosaur, blue eye/joint lenses, white armor, black claws, red/blue chest cables, tail cables and dark dorsal plates match source and artwork. The TS design is slimmer than the broad disc base at measured base height.

MasterTyrannomon torso 0, head 2, left-hand claw segments 19, 20 and 21 become MetalTyrannomon spine1, hed, indexL, middleL and thumbL. Exact effect aliases: 0=J_spine1, 2=J_hed, 19=J_indexL, 20=J_middleL, 21=J_thumbL.

Source height 4.396952; no exact MasterTyrannomon source identity was found in char_name/char_info. Disc base height used.

Eight slot durations: 132, 288, 288, 288, 124, 244, 404, 124. All source files present.

[Full source anatomy](img/ts208-335-source.png). [Full weighted source pose evidence](img/ts208-335-native-pose-review.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-335-attack1.jpg): 2, 71, 140, 209, 278 | Whole silver armor, hand claws, knees/feet and cables during charge; base fire is inherited purple for this card. |
| [attack2](img/ts208-335-attack2.jpg): 2, 65, 128, 191, 254 | Both claws, mouth and tail remain whole through torso turn. |
| [attack3](img/ts208-335-attack3.jpg): 2, 47, 92, 137, 182 | Whole mechanical body through ring charge; bright frame 182 occludes body. |
| [damage](img/ts208-335-damage.jpg): 307, 335, 363, 391, 419 | Whole armor/cables/claws during recoil and return. |
| [ko](img/ts208-335-ko.jpg): 307, 365, 423, 481, 539 | Falls with attached tail, feet and hands; later body is near lower screen edge. |
| [victory](img/ts208-335-victory.jpg): 543, 588, 633, 678, 723 | Source crouch/roar is visible at 588/678/723; frame 633 clips most body below inherited camera, same tendency in base. Source pose evidence verifies whole geometry. |

#### 336 Cyberdramon / model 435 / chr719

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 435,
  "ts": "chr719",
  "parts": {
    "0": "J_spine01",
    "3": "J_elbow_r",
    "6": "J_elbow_l",
    "10": "J_knee_r",
    "13": "J_knee_l"
  },
  "native": true,
  "against": "chr342"
}
```

[Final native export statistics](img/ts208-336-native-stats.json) · [Six-case browser results](img/ts208-336-results.json).

Dark segmented torso armor, gray chain/shoulder/thigh details, paired red upper/lower wings, long tail, white hand claws and feet remain. The native source mesh has 68,445 vertices and renders without index wrapping.

Andromon torso 0, right forearm 3, left forearm 6, right shin 10 and left shin 13 become Cyberdramon spine01 and matching elbow/knee bones. Exact effect aliases: 0=J_spine01, 3=J_elbow_r, 6=J_elbow_l, 10=J_knee_r, 13=J_knee_l.

Source height 2.828092, base Andromon chr342 source height 2.356546, ratio 1.200100. `against: chr342` used: ratio lies in 0.8–1.3 and body fits beside the base.

Eight slot durations: 180, 264, 288, 236, 128, 204, 144, 124. All source files present.

[Full source anatomy](img/ts208-336-source.png). [Full weighted source pose evidence](img/ts208-336-native-pose-review.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-336-attack1.jpg): 2, 47, 92, 137, 182 | Large full native body/armor/wings remain intact. Corrected forearm aliases place the blue effect at the crouching forearm near the waist; knee aliases remain anatomically matched to the shins. |
| [attack2](img/ts208-336-attack2.jpg): 2, 47, 92, 137, 182 | Wings, claws and feet retain source detail through crouch/rear; no seams. |
| [attack3](img/ts208-336-attack3.jpg): 2, 60, 118, 176, 234 | Whole body visible through 176; inherited close-up clips most at 234. |
| [damage](img/ts208-336-damage.jpg): 307, 338, 369, 400, 431 | Whole crouched body with both wings/feet through recoil. |
| [ko](img/ts208-336-ko.jpg): 307, 354, 401, 448, 495 | Complete floor fall with tail and paired wings/claws intact. |
| [victory](img/ts208-336-victory.jpg): 459, 492, 525, 558, 591 | Close-up from 492 onward clips wings, feet and sometimes head as camera follows base. Source pose evidence shows all four wings and armor whole. |

#### 337 Matadormon / model 436 / chr031

Accepted card model entry (effect aliases retain the original full skeleton):

```json
{
  "number": 436,
  "ts": "chr031",
  "parts": {
    "0": "J_chest",
    "10": "J_thumb_r",
    "11": "J_hand_r",
    "14": "J_thumb_l",
    "15": "J_hand_l"
  },
  "native": true,
  "against": "chr085"
}
```

[Final native export statistics](img/ts208-337-native-stats.json) · [Six-case browser results](img/ts208-337-results.json).

Tall thin masked figure, gold crest, magenta sleeves with long gray finger blades, gold scarf, green waist belt and red pants with black spirals match source/art. Cloth and scarf retain their original source bones.

Myotismon chest 0, right thumb 10, right fingers 11, left thumb 14 and left fingers 15 become Matadormon chest and matching thumb/hand bones. Exact effect aliases: 0=J_chest, 10=J_thumb_r, 11=J_hand_r, 14=J_thumb_l, 15=J_hand_l.

Source height 2.178510, base Myotismon chr085 source height 2.489790, ratio 0.874978. `against: chr085` used: ratio lies in 0.8–1.3 and body fits beside the base.

Eight slot durations: 180, 280, 216, 280, 128, 244, 204, 128. All source files present.

[Full source anatomy](img/ts208-337-source.png). [Full weighted source pose evidence](img/ts208-337-native-pose-review.png).

| Case / reviewed browser frames | Observations in all three styles |
|---|---|
| [attack1](img/ts208-337-attack1.jpg): 2, 69, 136, 203, 270 | Whole pants, crest, scarf and sleeve blades through casting; effect remains inherited green sphere. |
| [attack2](img/ts208-337-attack2.jpg): 2, 53, 104, 155, 206 | Source jump at 104 cuts the head above the inherited frame; low landing at 155 shows the head/upper body at the bottom. Sleeves, finger blades and cloth remain whole in the complementary source poses. |
| [attack3](img/ts208-337-attack3.jpg): 2, 47, 92, 137, 182 | Source bs01 leap appears as a small whole figure at upper-right 47, then leaves the camera at 92/137; frame 182 is opponent. Fixed-camera source evidence verifies complete pose, not a metrics-only acceptance. |
| [damage](img/ts208-337-damage.jpg): 307, 336, 365, 394, 423 | Whole source figure through recoil; frame 394 places the upper body low near the bottom and cuts the lower legs. |
| [ko](img/ts208-337-ko.jpg): 307, 364, 421, 478, 535 | Complete fall with sleeves, crest, scarf and pants intact. |
| [victory](img/ts208-337-victory.jpg): 614, 662, 710, 758, 806 | Whole turning figure from 662 onward; long sleeve blades and cloth remain attached. |

#### Source reading and remaining limits

Strikedramon chr016 bs01 has zero scale on hair bones 7/8/12 over frames 35–80, with descendants 9/10 inheriting collapse. Native export retains these raw local PSR/quaternion keys and does not use SVD. The legacy part_pose helper was separately made finite for zero axes using reference rotations and parent pseudoinverse. Five synthetic zero-scale regressions pass; the actual 50-bone source audit is finite at frames 0, 34, 34.5, 35, 80. Full weighted source geometry (64,983 vertices) matches the direct bone-world times inverse-bind reference to 3.55e-15 at frames 0, 34, 35, 80. Native parser/skinner has nine semantic regressions including four weights, parent nonuniform scale/shear, zero axes, 39th bone, source index 65,536 and expanded 65,538 vertices, exact RGBA UV endpoints/repeat, cache bounds, exporter motion objects and unused zero-weight vertices.

The inherited cameras/effects do not match every new body or native flight. Empty/cropped browser frames are documented with source pose evidence; metrics alone were not accepted as visual proof. Fine face details remain in native textures but small battle frames do not establish every pupil. Keramon black pupils versus artwork green rings remain an unread source shader limitation. Debug source raster alpha differs from native browser RGBA. No recolor, invented pose, effect synchronization claim, or reduced-mesh figure is used in this final report.

#### Source center movement evidence

Fixed-camera source pose drawings are recentered per frame and establish intact anatomy, not absolute position. Actual source J_center world coordinates were separately measured in `sheets/darkness-native-source-centers.json`. In native source units:

| Card / motion | First center (x, y, z) | Last center (x, y, z) | Sampled y range |
|---|---|---|---|
| 330 bs01 | 0.0000, 0.3342, -4.9812 | 0.0099, 0.2894, 0.9813 | 0.2894 to 0.9303 |
| 331 bs01 | 0.0000, 0.0781, -0.0038 | -0.0021, 0.0651, 0.0494 | 0.0582 to 0.1414 |
| 331 bv01 | 0.2043, 0.0695, 0.5003 | 0.0144, 0.0684, 0.0036 | 0.0651 to 0.0734 |
| 333 bs01 | 0.0000, 1.0555, -8.1000 | 0.0000, 1.3198, 9.4538 | 0.9228 to 1.4095 |
| 334 bs01 | 0.0000, 0.9896, -0.2922 | 0.0000, 6.3978, -7.5091 | 0.8717 to 7.3272 |
| 334 bv01 | 0.0000, 4.2172, -0.9655 | 0.0000, 0.9758, -0.1647 | 0.9329 to 4.2172 |
| 335 bv01 | 0.2942, 1.9510, 0.3301 | 0.0367, 1.9529, 0.3301 | 1.6438 to 1.9529 |
| 336 bv01 | 0.0565, 1.2990, -0.2622 | -0.0553, 1.2660, -0.2845 | 1.2256 to 1.3551 |
| 337 ba02 | -0.0677, 1.2672, 0.0193 | -0.0677, 1.2672, 0.0193 | 0.6408 to 2.7472 |
| 337 bs01 | -0.0470, 4.3389, -11.1097 | 0.0300, 3.1184, 3.8895 | 3.1184 to 11.1878 |

Large colored base-part previews confirm the high-number aliases: [Gururumon rear feet](img/ts208-334-native-anchor-base-11.png), [MasterTyrannomon left claw segments](img/ts208-335-native-anchor-base-19.png), [Andromon torso/forearms/right shin](img/ts208-336-native-anchor-base-0.png), [Andromon left shin](img/ts208-336-native-anchor-base-13.png), [Myotismon thumb/finger segments](img/ts208-337-native-anchor-base-10.png).

Integration: this ticket has its own `TS-208d:` commit on `time-stranger`; all five group commits are pushed together after final inventory verification.
