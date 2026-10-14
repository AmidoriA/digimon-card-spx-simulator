# TS-208a: Fire models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/zTdFN9Xd |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-209, TS-101 |

## Goal

Convert the nine Fire Digimon to their model numbers: Guilmon (401), Coronamon (402), Huckmon (403), Growlmon (404), Firamon (405), BaoHuckmon (406), WarGrowlmon (407), Flaremon (408), SaviorHuckmon (409).

## Context

- **The skill `import-ts-model`** (`.claude/skills/import-ts-model/SKILL.md`, TS-209) is the
  whole procedure. Read it first and follow it for each Digimon; the steps below only name
  its steps.
- Guilmon (card 302, model 401) is the worked example: [TS-207](TS-207-pilot-guilmon.md).
- [roster.md](roster.md): each card's base and Time Stranger model.
  [motion-slots.md](motion-slots.md): the body parts each base's scripts name.
- Guilmon (401) was converted in TS-207 and the owner approved it (2026-10-14); eight are left here.

## Steps

For each of the eight Digimon that are left, one after the other, the steps of the skill `import-ts-model`:

1. **Look up** (skill, step 1): its roster row, its base's model number, the parts the
   base's scripts name, and the base's own Time Stranger model if it has one.
2. **Convert once to look, and choose** (steps 2 and 3): into a scratch directory with
   `--preview --show` and `--poses`; then the part numbers, the size (`against`, `size` or
   the base's height) and the motions. The figures stay Angewomon's.
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

- [x] Nine models written by `build_custom.py` from their card entries (Guilmon's in TS-207): each `model` names `ts`, none of these cards has a `model.recolour` left; card entries otherwise unchanged.
- [x] The log has, for each Digimon: its entry, the figures the tool printed, its part numbers, its size rule (with the `against` ratio or the `size` chosen), any motion that was replaced, its sheets, and what is not right.
- [x] All checks of CLAUDE.md and `battletest.js` pass.
- [x] Browser check reported as the skill's step 5 asks: every sheet read, `sameTimeline`, no page errors.
- [x] README ("Not from the game code") and roster.md updated; the Digimon ticked on Trello.
- [x] One commit, `TS-208a: …`, pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log

<!-- Date, what was done, what was found and where (addresses, URLs, commits). -->

### Final owner scope and verification — 2026-10-14

The owner superseded the old 976-triangle rule, the interim 2000 proposal and all texture/bone caps: retain full source geometry, textures and bones for all 45 cards. These nine models were rebuilt canonically from their accepted `custom_cards.json` entries through `build_custom.py`. All non-model card fields remain exactly unchanged. Original card gameplay, art, battle effects, key duration, sounds and camera records remain inherited.

The native format preserves every visible source mesh vertex/triangle, all source bones and parents, all four skin influences, original UV sets and original-resolution RGBA material textures. It uses floating local poses and quaternions instead of reducing the skeleton to script anchor parts. The final exports include the corrected affine inverse-bind basis and one ground translation. [Format and reproducible workflow](native-model-format.md); [all 45 exact-source audits](img/native45-source-audit.json).

Verification passed: selftest (31), decktest (11), simulation (200), fxtest (31 scripts), path inventory, battletest (237 Digimon, 711 attacks in each of three styles), native runtime semantic regressions (9), exporter regressions (8), and all 45 real-source geometry/texture/weighted-pose audits. The native integration received an independent agent review with no actionable findings. Final browser capture: 54 sheets / 1620 captures for this group, all six cases for all nine cards in Original PS1, Enhanced and Enhanced Ultra (Smooth), `saved=true`, `sameTimeline=true`, 30/30 captures per sheet and zero page errors. Every final sheet was visually reviewed after the affine correction. Captures establish sampled visuals and timing, not full-game sound or mobile performance.

Source poses are retimed into the base slots. Camera/effect choreography can crop a source leap or place an inherited hit effect away from the source hand. The source game's reflection/lighting/outline shader semantics remain unread; the existing eye-overlay heuristic is used at full texture resolution. These are documented rendering/choreography limits rather than omitted geometry. Motion replacements below are explicit and remain inside the inherited slot timeline.

### Guilmon (302, model 401)

```json
{"number":401,"ts":"chr090","native":true,"against":"chr050","parts":{"0":"J_spine02"}}
```

Full source: **37 bones, 23262 vertices, 7754 triangles**; 401-0.png: 1024×1024 RGBA, 401-1.png: 1024×1024 RGBA, 401-2.png: 1024×1024 RGBA.

Site height 312.471924; scale 143.983934; against chr050; size 1. Anchors: 0 → J_spine02. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-302-attack1.jpg), [attack2](img/ts208-302-attack2.jpg), [attack3](img/ts208-302-attack3.jpg), [damage](img/ts208-302-damage.jpg), [ko](img/ts208-302-ko.jpg), [victory](img/ts208-302-victory.jpg). [Capture/timeline results](img/ts208-302-results.json); [full native figures](img/ts208-302-native-stats.json).

Guilmon uses source-relative height against Agumon chr050. Full head, claws, tail and body remain joined. Native leap motion can crop under the inherited Agumon camera; its semantic attack remains.

### Coronamon (303, model 402)

```json
{"number":402,"ts":"chr136","parts":{"6":"J_hand_r"},"native":true}
```

Full source: **94 bones, 22435 vertices, 10618 triangles**; 402-0.png: 1024×1024 RGBA, 402-1.png: 1024×1024 RGBA, 402-2.png: 1024×1024 RGBA, 402-3.png: 1024×1024 RGBA, 402-4.png: 256×256 RGBA, 402-5.png: 256×256 RGBA.

Site height 297.854858; scale 297.033990; fit to base height; size 1. Anchors: 6 → J_hand_r. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-303-attack1.jpg), [attack2](img/ts208-303-attack2.jpg), [attack3](img/ts208-303-attack3.jpg), [damage](img/ts208-303-damage.jpg), [ko](img/ts208-303-ko.jpg), [victory](img/ts208-303-victory.jpg). [Capture/timeline results](img/ts208-303-results.json); [full native figures](img/ts208-303-native-stats.json).

### Huckmon (304, model 403)

```json
{"number":403,"ts":"chr687","native":true,"parts":{"0":"J_center","9":"J_te_L"}}
```

Full source: **33 bones, 13254 vertices, 4418 triangles**; 403-0.png: 1024×1024 RGBA, 403-1.png: 1024×1024 RGBA, 403-2.png: 1024×1024 RGBA, 403-3.png: 1024×1024 RGBA.

Site height 253.913574; scale 241.596309; fit to base height; size 1. Anchors: 0 → J_center, 9 → J_te_L. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-304-attack1.jpg), [attack2](img/ts208-304-attack2.jpg), [attack3](img/ts208-304-attack3.jpg), [damage](img/ts208-304-damage.jpg), [ko](img/ts208-304-ko.jpg), [victory](img/ts208-304-victory.jpg). [Capture/timeline results](img/ts208-304-results.json); [full native figures](img/ts208-304-native-stats.json).

Huckmon uses Veemon base height; source-relative fit was rejected. Attack3 bs01 visibly leaves the inherited camera at selected frames (47, 92, 137 and 182), with body/edge visibility varying. The complete source motion and model are retained; this is not a missing-mesh claim.

### Growlmon (305, model 404)

```json
{"number":404,"ts":"chr078","parts":{"0":"J_spine2","2":"J_head","3":"J_mouth"},"native":true}
```

Full source: **40 bones, 37014 vertices, 12338 triangles**; 404-0.png: 1024×1024 RGBA, 404-1.png: 1024×1024 RGBA, 404-2.png: 1024×1024 RGBA.

Site height 454.598755; scale 150.955709; fit to base height; size 1. Anchors: 0 → J_spine2, 2 → J_head, 3 → J_mouth. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-305-attack1.jpg), [attack2](img/ts208-305-attack2.jpg), [attack3](img/ts208-305-attack3.jpg), [damage](img/ts208-305-damage.jpg), [ko](img/ts208-305-ko.jpg), [victory](img/ts208-305-victory.jpg). [Capture/timeline results](img/ts208-305-results.json); [full native figures](img/ts208-305-native-stats.json).

### Firamon (306, model 405)

```json
{"number":405,"ts":"chr137","parts":{"0":"J_spine02","6":"J_hand_l","7":"J_center","18":"J_foot01_r","22":"J_foot01_l"},"motions":{"6":"fe02","3":"ba02"},"native":true}
```

Full source: **107 bones, 38757 vertices, 18168 triangles**; 405-0.png: 1024×1024 RGBA, 405-1.png: 1024×1024 RGBA, 405-2.png: 1024×1024 RGBA, 405-3.png: 1024×1024 RGBA, 405-4.png: 256×256 RGBA.

Site height 451.654602; scale 226.193488; fit to base height; size 1. Anchors: 0 → J_spine02, 6 → J_hand_l, 7 → J_center, 18 → J_foot01_r, 22 → J_foot01_l. Slots 0–7: `bn01/ba01/ba02/ba02/bd01/bd02/fe02/bn01`.

Final reviewed sheets: [attack1](img/ts208-306-attack1.jpg), [attack2](img/ts208-306-attack2.jpg), [attack3](img/ts208-306-attack3.jpg), [damage](img/ts208-306-damage.jpg), [ko](img/ts208-306-ko.jpg), [victory](img/ts208-306-victory.jpg). [Capture/timeline results](img/ts208-306-results.json); [full native figures](img/ts208-306-native-stats.json).

### BaoHuckmon (307, model 406)

```json
{"number":406,"ts":"chr115","parts":{"0":"J_spine03","7":"J_f_leg_r","10":"J_f_leg_l","11":"J_spine01"},"native":true}
```

Full source: **50 bones, 41418 vertices, 13806 triangles**; 406-0.png: 1024×1024 RGBA, 406-1.png: 1024×1024 RGBA, 406-2.png: 1024×1024 RGBA, 406-3.png: 1024×1024 RGBA, 406-4.png: 1024×1024 RGBA, 406-5.png: 1024×1024 RGBA, 406-6.png: 1024×1024 RGBA.

Site height 309.432983; scale 141.751862; fit to base height; size 1. Anchors: 0 → J_spine03, 7 → J_f_leg_r, 10 → J_f_leg_l, 11 → J_spine01. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-307-attack1.jpg), [attack2](img/ts208-307-attack2.jpg), [attack3](img/ts208-307-attack3.jpg), [damage](img/ts208-307-damage.jpg), [ko](img/ts208-307-ko.jpg), [victory](img/ts208-307-victory.jpg). [Capture/timeline results](img/ts208-307-results.json); [full native figures](img/ts208-307-native-stats.json).

### WarGrowlmon (308, model 407)

```json
{"number":407,"ts":"chr134","parts":{"0":"J_breast","6":"J_hand_r"},"native":true}
```

Full source: **41 bones, 15932 vertices, 17498 triangles**; 407-0.png: 2048×2048 RGBA, 407-1.png: 1024×1024 RGBA, 407-2.png: 1024×1024 RGBA.

Site height 646.358398; scale 149.866290; fit to base height; size 1. Anchors: 0 → J_breast, 6 → J_hand_r. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-308-attack1.jpg), [attack2](img/ts208-308-attack2.jpg), [attack3](img/ts208-308-attack3.jpg), [damage](img/ts208-308-damage.jpg), [ko](img/ts208-308-ko.jpg), [victory](img/ts208-308-victory.jpg). [Capture/timeline results](img/ts208-308-results.json); [full native figures](img/ts208-308-native-stats.json).

### Flaremon (309, model 408)

```json
{"number":408,"ts":"chr138","parts":{"0":"J_spine02","12":"J_hand_l","21":"J_foot02_l"},"native":true}
```

Full source: **115 bones, 42636 vertices, 20241 triangles**; 408-0.png: 2048×2048 RGBA, 408-1.png: 2048×2048 RGBA, 408-2.png: 2048×2048 RGBA, 408-3.png: 2048×2048 RGBA, 408-4.png: 2048×2048 RGBA, 408-5.png: 1024×1024 RGBA, 408-6.png: 1024×1024 RGBA, 408-7.png: 256×256 RGBA, 408-8.png: 256×256 RGBA, 408-9.png: 256×256 RGBA.

Site height 525.069763; scale 209.642186; fit to base height; size 1. Anchors: 0 → J_spine02, 12 → J_hand_l, 21 → J_foot02_l. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-309-attack1.jpg), [attack2](img/ts208-309-attack2.jpg), [attack3](img/ts208-309-attack3.jpg), [damage](img/ts208-309-damage.jpg), [ko](img/ts208-309-ko.jpg), [victory](img/ts208-309-victory.jpg). [Capture/timeline results](img/ts208-309-results.json); [full native figures](img/ts208-309-native-stats.json).

### SaviorHuckmon (310, model 409)

```json
{"number":409,"ts":"chr116","parts":{"0":"J_head","7":"J_elbow_l","10":"J_elbow_r","16":"J_knee02_r","28":"J_weapon_l","29":"J_weapon_r"},"native":true}
```

Full source: **52 bones, 59472 vertices, 19824 triangles**; 409-0.png: 2048×2048 RGBA, 409-1.png: 2048×2048 RGBA, 409-2.png: 2048×2048 RGBA, 409-3.png: 2048×2048 RGBA, 409-4.png: 1024×1024 RGBA, 409-5.png: 1024×1024 RGBA, 409-6.png: 2048×2048 RGBA.

Site height 407.350891; scale 137.511238; fit to base height; size 1. Anchors: 0 → J_head, 7 → J_elbow_l, 10 → J_elbow_r, 16 → J_knee02_r, 28 → J_weapon_l, 29 → J_weapon_r. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-310-attack1.jpg), [attack2](img/ts208-310-attack2.jpg), [attack3](img/ts208-310-attack3.jpg), [damage](img/ts208-310-damage.jpg), [ko](img/ts208-310-ko.jpg), [victory](img/ts208-310-victory.jpg). [Capture/timeline results](img/ts208-310-results.json); [full native figures](img/ts208-310-native-stats.json).

### Agent visual review notes

<!-- Final native source review after corrected affine export. Earlier reduced figures are superseded by the user full-source instruction. -->

### Growlmon (305, model 404)

Red face and body, yellow eyes, black bands, white throat/belly, grey mane, paired horns, gold lettering, claws and complete tail match the prepared official art (BT2-013) and full source. Balanced limbs/horns remain joined in the reviewed poses.

```json
{"number":404,"ts":"chr078","parts":{"0":"J_spine2","2":"J_head","3":"J_mouth"},"native":true}
```

Base highlights: part0 chest → J_spine2;2 head → J_head;3 lower jaw → J_mouth.

Base height. TS Greymon chr326 has height4.506 against Growlmon3.011 (ratio0.668), which makes Growlmon too small; against was rejected and full source fitted to Greymon height454.599.

Full native source: **40 bones, 37014 vertices, 12338 triangles**, 3 materials (1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA). Scale 150.955709. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

No substitutions: bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01.

Final slots0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-305-attack1.jpg): Claw swing stays joined; full head/jaw visible; inherited fire can fall below feet at158.
- [attack2](img/ts208-305-attack2.jpg): Forward crouch/charge retains tail and both hands; charge glow at legs.
- [attack3](img/ts208-305-attack3.jpg): Arms-up lean and fire wall retain full body.
- [damage](img/ts208-305-damage.jpg): Recoil then upright, all limbs intact.
- [ko](img/ts208-305-ko.jpg): Tumble then side-on fall, full mane/spikes/tail/claws.
- [victory](img/ts208-305-victory.jpg): First450 transition empty for base and custom; later arm gestures/back lean retain full body and tail; low hands/feet partly behind WINNER.

[Raw timeline/capture results](img/ts208-305-results.json); [exact native source figures](img/ts208-305-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.

### Firamon (306, model 405)

Gold mane, cyan eyes, wing feathers, red/brown four-legged body, paw cuffs/claws and flame pieces match the prepared official art (EX5-008) and full source. Correct rigid POSITION.w bone lookup restores the feet and feathers; the former floating one-sided limb and reduction-damaged wing sheets are not the final output.

```json
{"number":405,"ts":"chr137","parts":{"0":"J_spine02","6":"J_hand_l","7":"J_center","18":"J_foot01_r","22":"J_foot01_l"},"motions":{"6":"fe02","3":"ba02"},"native":true}
```

Base highlights:0 chest → J_spine02;6 cannon/left-side effect endpoint → J_hand_l (left forepaw);7 pelvis → J_center;18 right rear foot → J_foot01_r;22 left rear foot → J_foot01_l. Inherited cannon laser can cross the chest/face because Firamon has no cannon.

Base height451.655. Full native Firamon bind height1.997 / TS Centarumon chr3722.689 =0.743; against omitted. Old reduced height1.742 lost upper wing extent and is superseded. All indexed/full bind positions agree on1.997.

Full native source: **107 bones, 38757 vertices, 18168 triangles**, 5 materials (1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 1024x1024 RGBA, 256x256 RGBA). Scale 226.193488. Source mesh positions, reversed triangle winding, normals, all source UV sets, all original bone names/parents, four skin influences, and full exported RGBA texels were compared exactly against the corrected source reader. No triangle/part reduction or palette/atlas resizing. Real-data posed skin comparison at first/mid/last keys in slots0/1/3/6 passes (<0.001 site-coordinate units; native quaternion normalization accounts for source rounding). Eye materials follow the settled overlay heuristic; original game shader interpretation remains incomplete.

Slot3 bs01 replaced with ba02, repeating attack2 under attack3 name Fira Bomb; native bs01 center rises from idleY.757 to10.863 and endsZ7.116 outside inherited framing. Slot6 bv01 replaced with bounded happy fe02; bv01 beginsZ-3.309 and endsY6.155. Full skin/geometry is preserved in substitutes.

Final slots0–7: `bn01/ba01/ba02/ba02/bd01/bd02/fe02/bn01`. Initial canonical builds used a per-card proposal helper to avoid concurrent shared configuration edits; the final corrected native build was consolidated and rebuilt by the coordinator.

Browser review: six cases, five frames, base/custom beside one another in Original PS1, Enhanced and Enhanced Ultra (Smooth). Every sheet below was opened individually. Final sheets regenerated after the native inverse-bind affine correction were reviewed in all three styles; JSON records saved=true, shots=wanted=30, errors=0, sameTimeline=true for each case.

- [attack1](img/ts208-306-attack1.jpg): Leap/slash: full face/limbs/wings, especially209; inherited laser crosses chest at final shot.
- [attack2](img/ts208-306-attack2.jpg): Crouch then raised face, balanced wings and joined paws.
- [attack3](img/ts208-306-attack3.jpg): Bounded ba02 visible; inherited uppercut camera crops lower body at182.
- [damage](img/ts208-306-damage.jpg): Planted four paws during recoil/recovery; full tail/feathers.
- [ko](img/ts208-306-ko.jpg): Early352 leap partly above frame; later side-on fall complete.
- [victory](img/ts208-306-victory.jpg): First538 transition empty;628 low head/body mostly behind WINNER;718 much of rear body/right wing beyond right edge;583/673 happy pose visible and intact.

[Raw timeline/capture results](img/ts208-306-results.json); [exact native source figures](img/ts208-306-native-stats.json). Native rendering preserves model shape/texture/weights, while disc base key times, sounds, effect scripts and cameras remain inherited. Contact-sheet inspection verifies geometry and sampled timing, not source hit alignment, real-time performance or a played full-board sound test. Idle/end poses can blend where source endpoints differ; native UV/shader effects may not reproduce the original game.


# Full native import review

Final corrected affine exports, 2026-10-14. Full source geometry, all original bones and four-weight skin are retained; no triangle, bone, atlas or palette reduction is applied. Native RGBA textures preserve pixel dimensions. Source shader semantics remain unread; eye overlays use the existing documented reader composition heuristic.

Every model was compared to its source bind view, posed source preview and card art. All six final browser sheets were read in Original PS1, Enhanced and Enhanced Ultra (Smooth), comparing five selected frames with the disc base. Each sheet reports saved=true, sameTimeline=true, errors=0 and 30/30 captures at 1600×1440. The eight slots preserve base key duration, sound and camera; native poses remain semantic source motions. Inherited camera cropping, source aerial/depth translation and effect occlusion are recorded below rather than changing source motion to an unrelated skill.

The corrected affine conversion applies root placement once: bone world = C × source bone world × S⁻¹; inverse bind = S × source inverse bind × C⁻¹. Source preservation audit passed for all 45 models, including these models (24 pose checks each). Full battle tests are parent-owned.

| Card | Model | Source | Base | Bones | Vertices | Triangles | Native textures | Scale |
|---|---|---|---|---:|---:|---:|---|---:|
| 303 Coronamon | 402 | chr136 | Goburimon / 80 | 94 | 22435 | 10618 | 4 × 1024×1024, 2 × 256×256 | 297.033990 |
| 307 BaoHuckmon | 406 | chr115 | Flarerizamon / 69 | 50 | 41418 | 13806 | 7 × 1024×1024 | 141.751862 |
| 308 WarGrowlmon | 407 | chr134 | MetalGreymon / 12 | 41 | 15932 | 17498 | 1 × 2048×2048, 2 × 1024×1024 | 149.866290 |

## 303 — Coronamon

Flame crown, both eyes, cream torso, fists and curved tail match the source and card art. Part 6 is the right hand; the general body anchor remains J_center. Source comparison against Goburimon was too small (about 0.30), so height fitting to the disc base was retained.

Logical effect anchors: 6 → J_hand_r, 0 → J_center.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** ba01 aerial punch is intact; the head passes the top edge at 124/185 before landing at 246.
- **attack2:** ba02 crouch, hop and palm strike retain both fists and face; the inherited close camera fills the frame at 209.
- **attack3:** bs01 rising special keeps the whole silhouette in most selected views; inherited fire/ring effects overlay the body.
- **damage:** Recoil keeps the flame crown, face, fists and tail attached throughout.
- **ko:** Lift, tumble and lying pose retain the complete body.
- **victory:** bv01 aerial celebration leaves the inherited camera at 559 and clips the head at 604; the body returns at 649/694. No second victory clip exists.

Proof files: `docs/time-stranger/img/ts208-303-attack1.jpg`, `docs/time-stranger/img/ts208-303-attack2.jpg`, `docs/time-stranger/img/ts208-303-attack3.jpg`, `docs/time-stranger/img/ts208-303-damage.jpg`, `docs/time-stranger/img/ts208-303-ko.jpg`, `docs/time-stranger/img/ts208-303-victory.jpg`; `ts208-303-results.json`.


## 307 — BaoHuckmon

White facial, shoulder and leg armor, red cape, spikes, long fingers and tail are intact. Parts 7/10 attach to right/left front legs, part 0 to upper spine03 and part 11 to lower spine01. Height fitting is retained without an against source or manual size change. The old reduced shell loss is absent.

Logical effect anchors: 0 → J_spine03, 7 → J_f_leg_r, 10 → J_f_leg_l, 11 → J_spine01.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Dash and cape sweep keep face, claws, leg plates and cape continuous.
- **attack2:** Claw strike retains the complete armor; the 226 close camera crops outer fingers while the body and face remain visible.
- **attack3:** bs01 leap rises above the Flarerizamon camera at 137/182, leaving cape/tail near the top edge. The only same special clip is retained.
- **damage:** Recoil preserves every armor shell and cape attachment.
- **ko:** Slump stays low with the face, cape and claws intact.
- **victory:** Grounded celebration keeps the body intact; WINNER text covers the lowest foreclaws.

Proof files: `docs/time-stranger/img/ts208-307-attack1.jpg`, `docs/time-stranger/img/ts208-307-attack2.jpg`, `docs/time-stranger/img/ts208-307-attack3.jpg`, `docs/time-stranger/img/ts208-307-damage.jpg`, `docs/time-stranger/img/ts208-307-ko.jpg`, `docs/time-stranger/img/ts208-307-victory.jpg`; `ts208-307-results.json`.


## 308 — WarGrowlmon

Both arm blades, red chest marks, back rails, leg straps, tail and cable match the source. Part 0 attaches to J_breast and part 6 to J_hand_r. Virus MetalGreymon chr936 gives an against ratio of about 1.313; base height fitting was retained at size 1.

Logical effect anchors: 0 → J_breast, 6 → J_hand_r.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Blade cross/sweep keeps both arms and rails; the strong inherited flash masks the body around 137.
- **attack2:** Chest blast starts in a low stance and the inherited camera clips the body at 108; the upright finish at 214 exposes both blades.
- **attack3:** Breath/flame overlays mask the body at 137; 182 is the intended opponent camera. Other selected frames retain the full body.
- **damage:** Recoil retains rails, cable, tail and limb straps.
- **ko:** Rear and tumble keep the whole armor and tail attached.
- **victory:** Grounded celebration preserves the face, chest and back rails.

Proof files: `docs/time-stranger/img/ts208-308-attack1.jpg`, `docs/time-stranger/img/ts208-308-attack2.jpg`, `docs/time-stranger/img/ts208-308-attack3.jpg`, `docs/time-stranger/img/ts208-308-damage.jpg`, `docs/time-stranger/img/ts208-308-ko.jpg`, `docs/time-stranger/img/ts208-308-victory.jpg`; `ts208-308-results.json`.


### Native Fire model review: Flaremon 309 and SaviorHuckmon 310

Final proposals are in `sheets/fire-c-config.json`; both use `native: true`. Final reviewed assets are from the root canonical all-45 rebuild after the native inverse-bind affine correction. Local reproducible builds use `sheets/fire-c-native-build.py`, which replaces only these entries in an in-memory parsed configuration and invokes `build_custom.main()`. Full source geometry, all original bones, normalized four-weight skin, native-resolution RGBA textures and floating-point local quaternion/position/scale motion records are retained. No polygon reduction, bone merging, texture atlas shrink or palette quantization is applied. Figures and sampling are recorded in `sheets/fire-c-native-stats.json`.

Flaremon 309 / model 408 / chr138: 115 bones, 42,636 source vertices, 20,241 triangles, 10 material textures (five 2048 x 2048, two 1024 x 1024, three 256 x 256). Garudamon 138 part 0 is torso, 12 left hand, 21 left foot; aliases are J_spine02, J_hand_l, J_foot02_l. Native source height is 2.505; Garudamon chr309 height 4.526 gives ratio 0.55, outside 0.8–1.3, so source-relative scaling was rejected. Base-height scale is 209.642186, height 525.069777; no manual size factor. Source and EX5-012 art agree on orange-brown lion anatomy, long gold mane, dark armor, red forearm armor, paired claws, ears and tail. Browser flame alpha is clean; the source debug raster's orange rectangles are an alpha-renderer limitation.

SaviorHuckmon 310 / model 409 / chr116: 52 bones, 59,472 source vertices, 19,824 triangles, seven material textures (five 2048 x 2048, two 1024 x 1024). Paildramon 166 part aliases: 0 J_head, 7 J_elbow_l, 10 J_elbow_r, 16 J_knee02_r, 28 J_weapon_l, 29 J_weapon_r. The paired blades serve the inherited weapon emitters. Native source height is 2.962; Paildramon chr408 height 4.167 gives ratio 0.71, outside the range. Base-height scale is 137.511238, height 407.350873; no manual size factor. Source and ST12-08 art agree on white armor, paired arm blades, blade feet, long tail and continuous red cape. Full geometry restores armor/cape/feet lost by earlier reduction experiments, which are superseded by these native outputs.

Both models keep standard slots 0/7 bn01, 1 ba01, 2 ba02, 3 bs01, 4 bd01, 5 bd02, 6 bv01. Flaremon slot durations: 112, 332, 236, 244, 124, 244, 220, 124. SaviorHuckmon: 132, 268, 240, 324, 128, 224, 328, 128. Native motions are sampled across the source duration on each base's existing key times; base sounds, camera and effect timing are retained. No substituted motions.

All twelve final corrected-affine browser sheets were regenerated and individually read in Original PS1, Enhanced and Enhanced Ultra (Smooth), side by side with their bases. Every case saved 30 / 30 shots, errors 0, sameTimeline true. Six JPGs and results JSON per card were copied to `docs/time-stranger/img/ts208-ID-*`. Review observations:

| Card | Case and browser frames | Observations in all three styles |
|---|---|---|
| 309 | attack1: 2, 79, 156, 233, 310 | Mane, claws, armor and tail remain attached; frame 79 inherits a mostly offscreen Garudamon camera. Later lion body is intact beneath the flying-base effect. |
| 309 | attack2: 2, 47, 92, 137, 182 | Full anatomy remains intact through the bright frame 137 effect. |
| 309 | attack3: 2, 47, 92, 137, 182 | Charge retains the whole lion; base camera frames the body low. |
| 309 | damage: 307, 336, 365, 394, 423 | Crouch/recovery retains limbs, mane and armor without gaps. |
| 309 | ko: 307, 363, 419, 475, 531 | Ground fall retains mane, tail and limbs. |
| 309 | victory: 561, 606, 651, 696, 741 | Upper body is visible at 606; Garudamon's rising camera cuts most of Flaremon at later frames. Source bv01 is grounded and whole in the fixed-camera native pose evidence. Earlier fe02 comparison also suffered this camera, so default bv01 remains. |
| 310 | attack1: 2, 67, 132, 197, 262 | Full white armor, blade feet and flexible cape remain intact; source cape tips flap at 132. One inherited gun beam is above a blade because base anatomy differs. |
| 310 | attack2: 2, 61, 120, 179, 238 | White armor and cloth remain whole through the charge; camera/effect cuts upper body at 238. |
| 310 | attack3: 2, 47, 92, 137, 182 | Source leap goes offscreen at 47, returns visibly airborne at 92; later camera/effect clips the charge. No cape shards. |
| 310 | damage: 307, 336, 365, 394, 423 | Whole anatomy through recoil; inherited framing puts most of the model below the screen at 394. |
| 310 | ko: 307, 354, 401, 448, 495 | Armor and blade feet remain whole; continuous cape stays raised and flaps during the floor fall without detached fragments. |
| 310 | victory: 527, 572, 617, 662, 707 | Full arm-blade/tail poses and cloth remain visible from 572 onward. |

Fine face details are retained in native textures; small battle views do not establish exact pupil appearance. No empty/cropped shot was accepted as evidence of correct anatomy: source drawings and Flaremon fixed-camera native victory poses provide the complementary check. Remaining limitations are inherited base camera/effect placement and unread Time Stranger material shader behavior. This report supersedes the earlier reduced-mesh reviews.

Integration: this ticket has its own `TS-208a:` commit on `time-stranger`; all five group commits are pushed together after final inventory verification.
