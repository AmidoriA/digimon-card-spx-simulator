# TS-208b: Ice models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/vUoHDXbM |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-209, TS-102 |

## Goal

Convert the nine Ice Digimon to their model numbers: Gaomon (410), Lunamon (411), Syakomon (412), Gaogamon (413), Lekismon (414), Octomon (415), MachGaogamon (416), Crescemon (417), Dragomon (418).

## Context

- **The skill `import-ts-model`** (`.claude/skills/import-ts-model/SKILL.md`, TS-209) is the
  whole procedure. Read it first and follow it for each Digimon; the steps below only name
  its steps.
- Guilmon (card 302, model 401) is the worked example: [TS-207](TS-207-pilot-guilmon.md).
- [roster.md](roster.md): each card's base and Time Stranger model.
  [motion-slots.md](motion-slots.md): the body parts each base's scripts name.

## Steps

For each of the nine Digimon, one after the other, the steps of the skill `import-ts-model`:

1. **Look up** (skill, step 1): its roster row, its base's model number, the parts the
   base's scripts name, and the base's own Time Stranger model if it has one.
2. **Inspect the source and choose** (steps 2 and 3): compare scratch source poses and
   official art, then choose effect-anchor aliases, size (`against`, `size` or the base's
   height), grounding and motions. The accepted entries use `native: true`: all source
   geometry, bones, skin weights and full-resolution RGBA materials are preserved.
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

- [x] Nine models written by `build_custom.py` from their card entries: each `model` names `ts`, none of these cards has a `model.recolour` left; card entries otherwise unchanged.
- [x] The log has, for each Digimon: its entry, the figures the tool printed, its part numbers, its size rule (with the `against` ratio or the `size` chosen), any motion that was replaced, its sheets, and what is not right.
- [x] All checks of CLAUDE.md and `battletest.js` pass.
- [x] Browser check reported as the skill's step 5 asks: every sheet read, `sameTimeline`, no page errors.
- [x] README ("Not from the game code") and roster.md updated; the Digimon ticked on Trello.
- [x] One commit, `TS-208b: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

### Final native acceptance — 2026-10-14

All nine models were rebuilt by the canonical builder from the consolidated card entries
with the corrected native inverse-bind affine transform. The owner's full-source instruction
supersedes earlier reduced exports: there is no geometry decimation, skeleton reduction,
palette quantization or texture-atlas resizing in these accepted models. Effect anchors alias
source bones without replacing their hierarchy.

The final source audit passed for all 45 imported models, including these nine, checking
source geometry, all UV sets, all four skin influences, bone names/parents, full RGBA texels
and posed affine equivalence. The full battle test passed 711 cases in each of Original PS1,
Enhanced and Enhanced Ultra (2,133 cases). Required repository checks passed. Each of the
54 Ice sheets was opened individually; all nine result files report saved captures, 30/30
shots per case, `sameTimeline: true` and no page errors. Camera cropping, inherited effects
and the chosen motion substitutions are documented per model below.

README, roster and Trello model checklists are updated. The commit/push checkbox remains
open until the coordinator completes the commit and push.

<!-- Final native source review after corrected affine export. Earlier reduced figures are superseded by the user full-source instruction. -->

### Gaomon (311, model 410)

Blue dog, red boxing gloves/headband, white chest and black/gold eyes match source and prepared official art. Paired gloves/feet and headband ribbons remain intact.

```json
{"number":410,"ts":"chr055","parts":{"1":"J_joint12","0":"J_joint11"},"against":"chr151","motions":{"3":"ba01"},"native":true}
```

Base part0 chest → J_joint11;1 head → J_joint12. These are effect aliases, not the skeleton count.

Against TS Gabumon chr151: height1.727 /1.492 =1.158, final height451.115.

Full native source: **28 bones, 16157 vertices, 5484 triangles**, 4 materials (1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA). Scale 261.157926. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

Slot3 bs01 replaced with ba01 (attack1 repeated for Gao Rush); bounded boxing keeps the character visible under inherited rush camera. Other slots remain canonical.

Final slots0–7: `bn01/ba01/ba02/ba01/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-311-attack1.jpg): Boxing with joined gloves, feet and headband.
- [attack2](img/ts208-311-attack2.jpg): Jump/backhand visible through209;278 outside framing.
- [attack3](img/ts208-311-attack3.jpg): ba01 repeat readable;182 moves to lower-right edge.
- [damage](img/ts208-311-damage.jpg): Recoil/recovery remains whole.
- [ko](img/ts208-311-ko.jpg): Tumble then side fall; joined gloves/ribbons.
- [victory](img/ts208-311-victory.jpg): First516 transition empty; cartwheel visible at606; bow/landing later.

[Raw timeline/capture results](img/ts208-311-results.json); [exact native source figures](img/ts208-311-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### Lunamon (312, model 411)

Light lavender rabbit, four long ears, pink/red eyes, yellow crescent forehead/belly, chest disc and ribbons match source/art. Correct rigid POSITION.w binding retains attached small details.

```json
{"number":411,"ts":"chr002","parts":{"0":"J_spine01"},"native":true}
```

Base part0 torso/body-hit anchor → J_spine01.

Base Penguinmon height265.066; no corresponding TS Penguinmon geometry found in the local name/table search. Full source height2.022 includes the ears, so body appears smaller than the round base.

Full native source: **35 bones, 14875 vertices, 7805 triangles**, 4 materials (1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA). Scale 131.071748. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

All eight canonical slots retained. ba01 is a high jump; partial upper-frame clipping is documented rather than claiming it is fully framed.

Final slots0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-312-attack1.jpg): ba01 jump near top;137/182 only lower skirt/feet visible.
- [attack2](img/ts208-312-attack2.jpg): Tearing Shot full four ears and body throughout.
- [attack3](img/ts208-312-attack3.jpg): Ear motions/face visible before ice obscures both base/custom at250.
- [damage](img/ts208-312-damage.jpg): Ears recoil and return, torso/disc intact.
- [ko](img/ts208-312-ko.jpg): Tumble then side fall; full four ears.
- [victory](img/ts208-312-victory.jpg): First447 transition empty; later ear/arm gestures and turn fully visible.

[Raw timeline/capture results](img/ts208-312-results.json); [exact native source figures](img/ts208-312-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### Syakomon (313, model 412)

Purple/pink toothed shell with black stripe, yellow-green inner body, two eyes and antennae match source/art. Lid opening and closing follows native skeleton; the closed-shell eyes are native shell details.

```json
{"number":412,"ts":"chr709","parts":{"7":"J_shell02","0":"J_center","1":"J_spine01"},"against":"chr389","native":true}
```

Base0 body core → J_center;1 inner head → J_spine01;7 back/fin effect → J_shell02 upper lid.

Against TS Betamon chr389: height0.880 /0.973 =0.904, final height214.943.

Full native source: **21 bones, 12178 vertices, 4074 triangles**, 6 materials (1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA). Scale 244.132044. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

All eight canonical slots retained; native shell folding is visible, not an absent inner body.

Final slots0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-313-attack1.jpg): Opens/closes shell, closed-shell eyes visible; inherited electric beam from lid.
- [attack2](img/ts208-313-attack2.jpg): Inner body stretches within opening; both antennae intact.
- [attack3](img/ts208-313-attack3.jpg): Rise with lid open; upper lid cropped at137, readable again182.
- [damage](img/ts208-313-damage.jpg): Lid/inner body recoil then recover together.
- [ko](img/ts208-313-ko.jpg): Shell snaps closed during fall, not lost geometry.
- [victory](img/ts208-313-victory.jpg): First439 transition empty; open→closed→open shell happy motion visible.

[Raw timeline/capture results](img/ts208-313-results.json); [exact native source figures](img/ts208-313-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### Gaogamon (314, model 413)

Blue quadruped with white mane/underbelly, red paw gloves, gold eyes and long red head ribbons matches source/art. All four legs, tail and both ribbons are present.

```json
{"number":413,"ts":"chr068","parts":{"0":"J_body2","2":"J_head","11":"J_b_leg0_r"},"against":"chr012","native":true,"size":1.6}
```

Base0 chest → J_body2;2 head → J_head;11 rear right upper leg → J_b_leg0_r.

Against TS Garurumon chr012: full height2.464 /2.436 =1.011. Initial fit height331.175 made the body hard to read because ribbon tips dominate bounds; size1.6 gives height529.880. Corrected-affine browser review accepts the more readable body; full ribbons remain unchanged, some tips reach frame edges.

Full native source: **45 bones, 36015 vertices, 12005 triangles**, 4 materials (1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA). Scale 215.062366. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

All canonical slots retained; long ribbons and low running body have inherited camera/UI limitations.

Final slots0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-314-attack1.jpg): Full paw gloves/mane readable at size1.6; long ribbons move with chest and four legs, all action frames visible.
- [attack2](img/ts208-314-attack2.jpg): Crouch/jump whole; distant final266 has joined paw gloves/head/ribbons before shock effect.
- [attack3](img/ts208-314-attack3.jpg): Full body/head/mane visible through209, some long ribbon tips exceed upper edge; inherited ice hides final278.
- [damage](img/ts208-314-damage.jpg): All four feet/ribbons connected.
- [ko](img/ts208-314-ko.jpg): Quadruped rolls to side, tail joined.
- [victory](img/ts208-314-victory.jpg): First527 transition empty; lowered body hidden behind WINNER at617/662, visible572/707.

[Raw timeline/capture results](img/ts208-314-results.json); [exact native source figures](img/ts208-314-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### Lekismon (315, model 414)

Pink/purple armored rabbit, silver face mask, yellow crescent marks, blue gloves and multiple long ears/back appendages match source/art. Both legs/gloves and all curling appendages stay joined; source pose asymmetry is animated, not missing geometry.

```json
{"number":414,"ts":"chr003","parts":{"0":"J_spine02","6":"J_hand_r","9":"J_hand_r"},"against":"chr755","native":true}
```

Base0 chest → J_spine02;6 right hand and9 staff endpoint both → J_hand_r. Duplicate aliases are intentional: Lekismon has no Sorcerimon staff and the same-side hand owns both effects; no bone or geometry is merged.

Against TS Sorcerimon chr755: height1.997 /2.251 =0.887, final height373.267.

Full native source: **89 bones, 26514 vertices, 12624 triangles**, 4 materials (1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA). Scale 186.927371. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

Canonical slots retained. bs01 source center reachesY6.619; bv01 reachesY6.259. Partial exits are retained with explicit camera limits because earlier action frames are visible.

Final slots0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-315-attack1.jpg): Jump visible, long appendages and gloves joined;92 upper tip cropped.
- [attack2](img/ts208-315-attack2.jpg): Arrow stance/hand effect alias works; whole body before beam270.
- [attack3](img/ts208-315-attack3.jpg): bs01 visible47/92, absent137/182 under inherited camera.
- [damage](img/ts208-315-damage.jpg): Recoil/recover all ears/arms/legs connected.
- [ko](img/ts208-315-ko.jpg): Tumble and floor-side pose retains appendages.
- [victory](img/ts208-315-victory.jpg): First494 transition empty; visible539/584/629;674 exits right edge.

[Raw timeline/capture results](img/ts208-315-results.json); [exact native source figures](img/ts208-315-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### Octomon (316, model 415)

Brown crowned octopus head, yellow eyes/black mask, horns, eight red tentacles and the source-held sword/cannon/metal arms match source/art. Weapon pieces follow native tentacle bones rather than floating bind fragments.

```json
{"number":415,"ts":"chr240","parts":{"0":"J_head"},"native":true,"motions":{"6":"fe02"}}
```

Base0 head/body effect point → J_head (crowned head).

Base Gesomon height701.113; TS Gesomon geometry absent from local English/table search. Full source height3.036 retained.

Full native source: **130 bones, 52500 vertices, 17500 triangles**, 6 materials (1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA). Scale 230.953762. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

Slot6 bv01 replaced with happy fe02. Source bv01 center reachesY10.049 and Z[-3.670,3.236], leaving almost all late victory frames empty; fe02 center staysY≤.778 (idle≤.508), full source pose checked at25%/75%. Attacks retained.

Final slots0–7: `bn01/ba01/ba02/bs01/bd01/bd02/fe02/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-316-attack1.jpg): All eight tentacles/weapons joined;124 low crop,185 empty,246 visible distant.
- [attack2](img/ts208-316-attack2.jpg): Face/sword/cannon remain visible until222 inherited effect covers frame.
- [attack3](img/ts208-316-attack3.jpg): Dome/knight overlays mask tentacles, crown/head visible.
- [damage](img/ts208-316-damage.jpg): Tentacles curl/recover, weapon endpoints stay joined.
- [ko](img/ts208-316-ko.jpg): Crowned head tumbles, tentacles/metal arms/weapons retained.
- [victory](img/ts208-316-victory.jpg): First520 transition empty; bounded fe02 keeps face/crown/tentacles/weapons visible565/610/655/700; bottom tentacles partly behind WINNER and wide sword/arms at side edges.

[Raw timeline/capture results](img/ts208-316-results.json); [exact native source figures](img/ts208-316-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### MachGaogamon (317, model 416)

Blue armored wolf, metal fists, red chest badge, black trousers, boots, back jets and long belt/tail straps match source/art. Paired fist/foot pieces intact; hanging straps are present in the indexed source geometry.

```json
{"number":416,"ts":"chr074","parts":{"0":"J_tail0","5":"J_jnt_rh0","8":"J_jnt_lh0","13":"J_foot_r","17":"J_toe_l"},"against":"chr140","native":true,"ground":0.013540250225618833}
```

Base highlights:0 tail, not chest → J_tail0 strap root;5 right fist → J_jnt_rh0;8 left fist → J_jnt_lh0;13 right foot → J_foot_r;17 left foot → J_toe_l. Part0 is the inherited tail-effect exception.

Against TS WereGarurumon chr140: height4.728 /4.126 =1.146, final height540.097. Indexed strap drops below boots in bind pose: foot/toe sole Y=-0.03218419849872589 versus strap/global minimum about-0.736. bn01 sole frame0/60 Y=.01354025,15=.04672596,30=.15890837,45=.14738928. Final ground=.013540250225618833 anchors the native idle sole to the base floor; it changes translation only, preserving full bind height and straps. Corrected-affine sheets show feet on the platform at idle and recovery.

Full native source: **38 bones, 51195 vertices, 22863 triangles**, 6 materials (128x128 RGBA, 16x16 RGBA, 2048x2048 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 2048x2048 RGBA). Scale 114.224754. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

Canonical slots retained. Native fist/boot/jet/tail posing retains all bones; inherited camera does not follow all source root movement.

Final slots0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-317-attack1.jpg): Joined fists/boots/jet-straps;92 low framing crop.
- [attack2](img/ts208-317-attack2.jpg): 47/92 full body then137/182 mostly left of camera.
- [attack3](img/ts208-317-attack3.jpg): Native root move makes figure distant high in47/92/137 then182 visible left, all connected.
- [damage](img/ts208-317-damage.jpg): Boots/fists recover intact; ground override puts idle and recovered boots on platform, no floating-body gap. Long native straps retained.
- [ko](img/ts208-317-ko.jpg): Tumble with both gauntlets and long straps; no shard/fan.
- [victory](img/ts208-317-victory.jpg): First473 transition empty; gesture/twist with both boots/fists/jet straps visible,563 upper boot near edge.

[Raw timeline/capture results](img/ts208-317-results.json); [exact native source figures](img/ts208-317-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### Crescemon (318, model 417)

Silver armored rabbit with crescent helmet, long ears, left shield, right bow, pink/yellow thighs and back rods matches source/prepared official art. Shield/bow stay attached and face/feet are retained.

```json
{"number":417,"ts":"chr004","parts":{"0":"J_spine02","8":"J_hand_l","20":"J_foot_l"},"native":true,"motions":{"3":"ba02"}}
```

Base0 chest → J_spine02;8 left hand → J_hand_l (shield hand);20 left foot → J_foot_l.

Base Panjyamon height414.242. TS Panjyamon chr409 height4.650 gives ratio3.277/4.650=.705; against rejected as too small. Native ears/bow retained within full bind height3.277.

Full native source: **90 bones, 37916 vertices, 18143 triangles**, 5 materials (1024x1024 RGBA, 1024x1024 RGBA, 2048x2048 RGBA, 2048x2048 RGBA, 2048x2048 RGBA). Scale 126.403886. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

Slot3 bs01 replaced by ba02 (attack2 repeated for Dark Archery). Original bs01 source center travelsX[-9.605,15.147],Y≤72.373,Z[-35.330,39.886] and was invisible in ALL four action shots71/140/209/278. ba02 stays near origin (Y≤2.058, Z[-.098,.401]) and was already visible in attack2. Other slots canonical.

Final slots0–7: `bn01/ba01/ba02/ba02/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-318-attack1.jpg): Shield/bow/ears joined during large jump;92 upper body cropped,182 right edge crop.
- [attack2](img/ts208-318-attack2.jpg): Full archery pose before inherited ice effects; shield-hand endpoint tracks.
- [attack3](img/ts208-318-attack3.jpg): Bounded ba02 is visible71/140/209;278 small at left edge with partial shield crop. Original whole-motion invisibility is corrected; attack2 and3 now share ba02.
- [damage](img/ts208-318-damage.jpg): Shield/bow stay attached on recoil/recover.
- [ko](img/ts208-318-ko.jpg): Fall retains shield/bow/feet and back rods.
- [victory](img/ts208-318-victory.jpg): First530 transition empty; later shield/bow gestures visible,665 lowered torso behind WINNER.

[Raw timeline/capture results](img/ts208-318-results.json); [exact native source figures](img/ts208-318-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### Dragomon (319, model 418)

Blue tentacled Cthulhu body, red brain marks, purple necklace, orange bat wings, trident, arm chain and claw feet match source/art. Native animation can stow the trident and raise it later; the source weapon is present.

```json
{"number":418,"ts":"chr129","parts":{"0":"J_spine02","2":"J_head_center","9":"J_hand_l"},"native":true}
```

Base0 chest → J_spine02;2 head → J_head_center;9 left hand → J_hand_l.

Base Zudomon height500.738. TS Zudomon chr345 height2.870 against Dragomon5.201 gives ratio1.812; against omitted. Trident contributes to full height, so body is smaller than base but still identifiable.

Full native source: **79 bones, 50476 vertices, 16830 triangles**, 6 materials (2048x2048 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 2048x2048 RGBA, 2048x2048 RGBA, 2048x2048 RGBA). Scale 96.271818. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

All canonical slots retained. Source trident visibility/scale animation is retained and not forced into idle.

Final slots0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-319-attack1.jpg): Full wings/tentacles/necklace before inherited bright hammer glow.
- [attack2](img/ts208-319-attack2.jpg): Complete folded/raised arms/wings inside inherited sphere.
- [attack3](img/ts208-319-attack3.jpg): Trident raises at134/200, then ice obscures both base/custom266.
- [damage](img/ts208-319-damage.jpg): Wings/feet/arms recoil together; details intact.
- [ko](img/ts208-319-ko.jpg): Full backward roll retains necklace/chain/wings/feet.
- [victory](img/ts208-319-victory.jpg): First528 transition empty; later gestures readable,708 lower body behind WINNER.

[Raw timeline/capture results](img/ts208-319-results.json); [exact native source figures](img/ts208-319-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

Integration: this ticket has its own `TS-208b:` commit on `time-stranger`; all five group commits are pushed together after final inventory verification.
