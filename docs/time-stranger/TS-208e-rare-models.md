# TS-208e: Rare models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/7IcLCqJO |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-209, TS-105 |

## Goal

Convert the nine Rare Digimon to their model numbers: Dracomon (437), Bearmon (438), Kudamon (439), Coredramon (Blue) (440), Grizzlymon (441), Reppamon (442), Wingdramon (443), GrapLeomon (444), Chirinmon (445).

## Context

- **The skill `import-ts-model`** (`.claude/skills/import-ts-model/SKILL.md`, TS-209) is the
  whole procedure. Read it first and follow it for each Digimon; the steps below only name
  its steps.
- Guilmon (card 302, model 401) is the worked example: [TS-207](TS-207-pilot-guilmon.md).
- [roster.md](roster.md): each card's base and Time Stranger model.
  [motion-slots.md](motion-slots.md): the body parts each base's scripts name.

## Steps

The owner authorized parallel agents, then changed the requirement to full source shape,
textures and bones on 2026-10-14. The final workflow follows the updated
`import-ts-model` skill with `native: true` and no triangle budget.

1. Read the roster, source identity, base model and script effect parts; inspect source
   bind views and native motion poses beside the card art.
2. Export a full native scratch model, choose anatomical effect aliases and document the
   base-height or accepted `against` source sizing decision.
3. Integrate the native card recipe and build each card with canonical `build_custom.py`.
4. Audit complete source geometry, skeleton, weights, UVs, materials and retimed poses;
   run the integration checks and read all six browser sheets in three rendering styles.
5. Copy final proof images, results and stats, record limitations, and update the project
   documentation and Trello checklist. Commit/push is completed by the integration owner.

## Acceptance criteria

- [x] Nine models written by `build_custom.py` from their card entries: each `model` names `ts`, none of these cards has a `model.recolour` left; card entries otherwise unchanged.
- [x] The log has, for each Digimon: its entry, the figures the tool printed, its part numbers, its size rule (with the `against` ratio or the `size` chosen), any motion that was replaced, its sheets, and what is not right.
- [x] All checks of CLAUDE.md and `battletest.js` pass.
- [x] Browser check reported as the skill's step 5 asks: every sheet read, `sameTimeline`, no page errors.
- [x] README ("Not from the game code") and roster.md updated; the Digimon ticked on Trello.
- [ ] Integration commit containing TS-208e completed and pushed.

## Out of scope

- None.

## Questions for the owner

- None.

## Log


Final corrected affine exports, 2026-10-14. Full source geometry, all original bones and four-weight skin are retained; no triangle, bone, atlas or palette reduction is applied. Native RGBA textures preserve pixel dimensions. Source shader semantics remain unread; eye overlays use the existing documented reader composition heuristic.

Every model was compared to its source bind view, posed source preview and card art. All six final browser sheets were read in Original PS1, Enhanced and Enhanced Ultra (Smooth), comparing five selected frames with the disc base. Each sheet reports saved=true, sameTimeline=true, errors=0 and 30/30 captures at 1600×1440. The eight slots preserve base key duration, sound and camera; native poses remain semantic source motions. Inherited camera cropping, source aerial/depth translation and effect occlusion are recorded below rather than changing source motion to an unrelated skill.

The corrected affine conversion applies root placement once: bone world = C × source bone world × S⁻¹; inverse bind = S × source inverse bind × C⁻¹. Source preservation audit passed for all 45 models, including these models (24 pose checks each). The integration run passed the all-45 source audit (1,078 checked poses) and the full battle suite: 237 attacks / 711 total cases in each of Original, Enhanced and Smooth.

| Card | Model | Source | Base | Bones | Vertices | Triangles | Native textures | Scale |
|---|---|---|---|---:|---:|---:|---|---:|
| 338 Dracomon | 437 | chr208 | ClearAgumon / 98 | 52 | 15580 | 7064 | 6 × 1024×1024 | 272.595515 |
| 339 Bearmon | 438 | chr234 | Psychemon / 82 | 40 | 22042 | 10674 | 2 × 2048×2048, 2 × 1024×1024 | 394.872423 |
| 340 Kudamon | 439 | chr053 | Vi-Elecmon / 208 | 36 | 7326 | 2442 | 4 × 1024×1024 | 371.342757 |
| 341 Coredramon (Blue) | 440 | chr218 | Rockmon / 108 | 66 | 14040 | 6710 | 6 × 1024×1024 | 102.786582 |
| 342 Grizzlymon | 441 | chr235 | Ankylomon / 161 | 31 | 25572 | 11958 | 4 × 1024×1024 | 368.392557 |
| 343 Reppamon | 442 | chr077 | ShimaUnimon / 75 | 42 | 20511 | 9052 | 2 × 1024×1024 | 131.612975 |
| 344 Wingdramon | 443 | chr210 | Gigadramon / 64 | 59 | 36867 | 12289 | 3 × 2048×2048, 2 × 1024×1024 | 112.026666 |
| 345 GrapLeomon | 444 | chr403 | Etemon / 42 | 70 | 51734 | 23980 | 5 × 2048×2048, 2 × 1024×1024 | 139.991944 |
| 346 Chirinmon | 445 | chr084 | MetalGarurumon / 174 | 49 | 37666 | 16872 | 4 × 2048×2048, 2 × 1024×1024 | 82.452556 |

## 338 — Dracomon

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 437,
  "ts": "chr208",
  "native": true,
  "parts": {
    "0": "J_center"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 338 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

Teal body, orange branching horns, small wings, cream belly and white claws match the source/card art. Body anchor 0 uses J_center. Default disc-base height fit is retained.

Logical effect anchors: 0 → J_center.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Breath windup and turning strike retain horns, jaw, wings and tail; inherited fire overlays remain.
- **attack2:** Tail swing retains the complete curved tail and open jaw.
- **attack3:** Jump preserves limbs and wing attachment; the inherited multicolored polygon effect masks the body at 182.
- **damage:** Head recoil keeps horns, face and claws intact.
- **ko:** Tumble/down sequence retains the whole body without detached pieces.
- **victory:** bv01 travels far into depth at 525/570, then grows and lands at 615/660. This source aerial translation remains under the disc camera.

Final QA: [attack1](img/ts208-338-attack1.jpg), [attack2](img/ts208-338-attack2.jpg), [attack3](img/ts208-338-attack3.jpg), [damage](img/ts208-338-damage.jpg), [ko](img/ts208-338-ko.jpg), [victory](img/ts208-338-victory.jpg); [results JSON](img/ts208-338-results.json); [native export stats](img/ts208-338-native-stats.json).


## 339 — Bearmon

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 438,
  "ts": "chr234",
  "native": true,
  "parts": {
    "0": "J_spine01",
    "1": "J_head",
    "2": "J_jaw",
    "9": "J_hand_l"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 339 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

Dark fur, white muzzle/belly, BEARS cap, cuffs, strap, pink cheeks and claws match source/card art. Body/head/jaw use spine01/head/jaw; base part 9 is the left hand (negative site X). Default base height fit is retained.

Logical effect anchors: 0 → J_spine01, 1 → J_head, 2 → J_jaw, 9 → J_hand_l.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Windup and punch keep both paws intact; part 9 follows the left hand.
- **attack2:** Hammer/throw retains face, cap and claws under the close camera; the inherited green flash masks the end at 278.
- **attack3:** bs01 jump leaves the inherited camera at 140 and returns by 278; the multicolored base effect also masks 209. Only one same special exists.
- **damage:** Recoil keeps the cuffs, cap, face and paws attached.
- **ko:** Source lift places feet near the top at 359, followed by a complete back/down pose at 411/515.
- **victory:** Grounded hand gestures preserve both cuffs, cap and face.

Final QA: [attack1](img/ts208-339-attack1.jpg), [attack2](img/ts208-339-attack2.jpg), [attack3](img/ts208-339-attack3.jpg), [damage](img/ts208-339-damage.jpg), [ko](img/ts208-339-ko.jpg), [victory](img/ts208-339-victory.jpg); [results JSON](img/ts208-339-results.json); [native export stats](img/ts208-339-native-stats.json).


## 340 — Kudamon

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 439,
  "ts": "chr053",
  "native": true,
  "parts": {
    "0": "J_center",
    "13": "J_spine",
    "14": "J_spine1",
    "15": "J_spine2",
    "16": "J_spine3",
    "17": "J_spine4",
    "18": "J_spine5",
    "19": "J_spine6",
    "20": "J_spine7",
    "21": "J_spine8"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 340 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

White serpent body, gold rings, yellow eyes, red nose and black ear tips match source/card art. Part 0 uses J_center; parts 13–21 follow spine through spine8 along the coil. Vi-Elecmon has no suitable native source comparison, so default base height fit is retained.

Logical effect anchors: 0 → J_center, 13 → J_spine, 14 → J_spine1, 15 → J_spine2, 16 → J_spine3, 17 → J_spine4, 18 → J_spine5, 19 → J_spine6, 20 → J_spine7, 21 → J_spine8.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Rearing and turning retain the whole narrow serpent contour.
- **attack2:** Coil loop preserves body thickness and gold rings.
- **attack3:** Curved special keeps the head and eyes visible around 92/137 beneath inherited projectiles.
- **damage:** Snaking recoil preserves the continuous coil.
- **ko:** Lowered oval coil is intact, without lost body panels.
- **victory:** Low crawling coils remain partly behind WINNER text; the head and gold marks remain clear.

Final QA: [attack1](img/ts208-340-attack1.jpg), [attack2](img/ts208-340-attack2.jpg), [attack3](img/ts208-340-attack3.jpg), [damage](img/ts208-340-damage.jpg), [ko](img/ts208-340-ko.jpg), [victory](img/ts208-340-victory.jpg); [results JSON](img/ts208-340-results.json); [native export stats](img/ts208-340-native-stats.json).


## 341 — Coredramon (Blue)

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 440,
  "ts": "chr218",
  "native": true,
  "parts": {
    "0": "J_spine01",
    "4": "J_hand_r",
    "7": "J_hand_l"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 341 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

Blue body, cream wing membranes, red horns and white claws match source/card art. Parts 0/4/7 attach to spine01/right hand/left hand. Rigid POSITION.w palette selection keeps teeth and claws on their original bones. Default Rockmon height fit is retained.

Logical effect anchors: 0 → J_spine01, 4 → J_hand_r, 7 → J_hand_l.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Jump/breath retains complete wings and face; source movement puts the actor below the inherited camera at 266.
- **attack2:** Roll/crouch clips the lowest body at 122; upright open jaw and full membranes are visible at 182/242.
- **attack3:** bs01 leap leaves the Rockmon camera at 200 and exposes only upper-edge claws/chest at 266. Same special motion is retained.
- **damage:** Recoil preserves wing membranes, claws and facial details.
- **ko:** Lift and full prone pose retain both wings, tail and jaw.
- **victory:** Native wing spread and turn preserve both membranes and cream chest; WINNER text covers feet.

Final QA: [attack1](img/ts208-341-attack1.jpg), [attack2](img/ts208-341-attack2.jpg), [attack3](img/ts208-341-attack3.jpg), [damage](img/ts208-341-damage.jpg), [ko](img/ts208-341-ko.jpg), [victory](img/ts208-341-victory.jpg); [results JSON](img/ts208-341-results.json); [native export stats](img/ts208-341-native-stats.json).


## 342 — Grizzlymon

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 441,
  "ts": "chr235",
  "native": true,
  "parts": {
    "0": "J_spine02",
    "5": "J_hand_r",
    "11": "J_foot_r",
    "14": "J_foot_l",
    "17": "J_tail"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 342 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

Purple fur, forehead crescent, red cuffs/shoulder plates, gold belts and silver claws match source/card art. Body uses spine02; part 5 right front paw, 11/14 rear right/left feet, 17 tail. Ankylomon source ratio about 0.535 was rejected; default base fit is retained.

Logical effect anchors: 0 → J_spine02, 5 → J_hand_r, 11 → J_foot_r, 14 → J_foot_l, 17 → J_tail.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Inherited close camera crops head/body edges at 72/142/212, similar to the close base framing; complete gauntlets appear in the later crouch.
- **attack2:** Crouch, upright roar and side stance keep the body and claw armor intact.
- **attack3:** Tuck/leap reaches the upper-left boundary near 230, then returns in a crouch behind inherited effects.
- **damage:** Recoil retains face, crescent, shoulder disks and claws.
- **ko:** Lift, roll and side/down pose preserve every cuff and fur surface.
- **victory:** Roaring upright celebration crops the upper head/raised claws at 707 under the unchanged base camera. Earlier poses show the full face and armor.

Final QA: [attack1](img/ts208-342-attack1.jpg), [attack2](img/ts208-342-attack2.jpg), [attack3](img/ts208-342-attack3.jpg), [damage](img/ts208-342-damage.jpg), [ko](img/ts208-342-ko.jpg), [victory](img/ts208-342-victory.jpg); [results JSON](img/ts208-342-results.json); [native export stats](img/ts208-342-native-stats.json).


## 343 — Reppamon

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 442,
  "ts": "chr077",
  "native": true,
  "parts": {
    "0": "spine2",
    "2": "head",
    "3": "mouth"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 343 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

Cream/tan fur, white/orange mane, beads, dark paws and blue/white blade tail with Yin-Yang pattern match source/card art. Body/head/mouth anchors use spine2/head/mouth. No native ShimaUnimon comparison is available; default height fit is retained.

Logical effect anchors: 0 → spine2, 2 → head, 3 → mouth.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Somersault keeps the blade tail and beads bound; full aerial body is visible at 142 before inherited glow masks 282.
- **attack2:** Forepaw slash and rearing pose retain face, paws and blade tail.
- **attack3:** Twisting roll moves below the camera at 215; the complete body returns at 286. Source special semantics are retained.
- **damage:** Recoil preserves both mane sides, face, beads and tail blade.
- **ko:** Tumble and lying pose retain the entire patterned blade and body.
- **victory:** Grounded/rearing celebration preserves mane, beads, paws and tail.

Final QA: [attack1](img/ts208-343-attack1.jpg), [attack2](img/ts208-343-attack2.jpg), [attack3](img/ts208-343-attack3.jpg), [damage](img/ts208-343-damage.jpg), [ko](img/ts208-343-ko.jpg), [victory](img/ts208-343-victory.jpg); [results JSON](img/ts208-343-results.json); [native export stats](img/ts208-343-native-stats.json).


## 344 — Wingdramon

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 443,
  "ts": "chr210",
  "native": true,
  "parts": {
    "0": "J_spain03",
    "5": "J_arm_r",
    "7": "J_hand_r",
    "10": "J_arm_l",
    "11": "J_elbow_l",
    "12": "J_hand_l",
    "13": "J_finger03_l",
    "16": "J_spain01"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 344 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

Blue dragon, pale wing membranes, gold horns/hands/feet, metal chest marks and long tail match source/card art. Body uses source spelling J_spain03; arm/hand/elbow/finger anchors follow original left/right anatomy, part 16 uses J_spain01. Against Gigadramon chr402 ratio about 0.488 was rejected. Size 1 is retained: corrected native affine skin now fully frames idle/default flight and damage. No geometry is removed to fit.

Logical effect anchors: 0 → J_spain03, 5 → J_arm_r, 7 → J_hand_r, 10 → J_arm_l, 11 → J_elbow_l, 12 → J_hand_l, 13 → J_finger03_l, 16 → J_spain01.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Wing spread and breath windup show the whole idle silhouette; source lift clips the head at 209 under the Gigadramon camera.
- **attack2:** Lance windup preserves both membranes, hands and face; inherited flash masks the character at 137.
- **attack3:** Wing Blast rises above the camera at 120/179/238. This is source flight translation; the only same special is retained.
- **damage:** Full flight recoil remains in frame, with complete membranes and tail.
- **ko:** Forward lift and prone flight preserve the entire wing span and tail.
- **victory:** Source celebration flies far back at 591, returns at 636/681, then crosses the right edge at 726. Existing camera is retained.

Final QA: [attack1](img/ts208-344-attack1.jpg), [attack2](img/ts208-344-attack2.jpg), [attack3](img/ts208-344-attack3.jpg), [damage](img/ts208-344-damage.jpg), [ko](img/ts208-344-ko.jpg), [victory](img/ts208-344-victory.jpg); [results JSON](img/ts208-344-results.json); [native export stats](img/ts208-344-native-stats.json).


## 345 — GrapLeomon

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 444,
  "ts": "chr403",
  "native": true,
  "against": "chr311",
  "parts": {
    "0": "J_spine02",
    "5": "J_hand_r",
    "8": "J_hand_l",
    "15": "J_foot_r"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 345 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

Lion face, orange mane, blue headband, silver armor, red arm/shin cylinders and black gloves/boots match source/card art. Parts 0/5/8/15 use spine02/right hand/left hand/right foot. Etemon chr311 source ratio about 1.143 is accepted; no manual size multiplier.

Logical effect anchors: 0 → J_spine02, 5 → J_hand_r, 8 → J_hand_l, 15 → J_foot_r.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Native fist windup and uppercut retain armor and mane; inherited green energy remains on the mapped hands.
- **attack2:** Crouch and rising cyclone kick retain limb cylinders; the close base camera at 254 clips the lower body, as on the base.
- **attack3:** Native nanomachine pose is retained with Etemon music-wave effects; later camera places the actor at the left edge around 224/298.
- **damage:** Recoil retains all armor; lowest body crosses the lower edge at 397.
- **ko:** Back tumble and lying pose retain all limb cylinders and face.
- **victory:** Grounded fist celebration remains whole behind the low WINNER overlay.

Final QA: [attack1](img/ts208-345-attack1.jpg), [attack2](img/ts208-345-attack2.jpg), [attack3](img/ts208-345-attack3.jpg), [damage](img/ts208-345-damage.jpg), [ko](img/ts208-345-ko.jpg), [victory](img/ts208-345-victory.jpg); [results JSON](img/ts208-345-results.json); [native export stats](img/ts208-345-native-stats.json).


## 346 — Chirinmon

Final `model` recipe in `tools/custom_cards.json`:

```json
{
  "number": 445,
  "ts": "chr084",
  "native": true,
  "against": "chr135",
  "parts": {
    "0": "J_spine02",
    "2": "J_head"
  }
}
```

Canonical rebuild:

```powershell
& "D:\Projects\digimon card\tools\.venv\Scripts\python.exe" -I tools/build_custom.py "D:\Projects\digimon card\extracted" web model 346 --ts "D:\Projects\digimon card\extracted_ts\app_0"
```

Green/gold body, red horn, orange mane, white feather wings, whiskers, patterned legs and black hooves match source/card art. Parts 0/2 use spine02/head. MetalGarurumon chr135 ratio about 1.096 is accepted; no manual size multiplier.

Logical effect anchors: 0 → J_spine02, 2 → J_head.

Eight source slots: 0=bn01, 1=ba01, 2=ba02, 3=bs01, 4=bd01, 5=bd02, 6=bv01, 7=bn01.

- **attack1:** Wind Cutter pose retains all feather layers; source low position/camera hides the body near 69, and beam/explosion overlays mask later views.
- **attack2:** Crouch and rearing Knowledge of Swiftness expose the full wings, patterned legs and face before the base projectile overlay.
- **attack3:** Holy Wave aerial rise leaves the camera at 136; inherited dome/ray effects mask 203/270. Only same special is retained.
- **damage:** Recoil keeps wings, whiskers, horn and hooves attached.
- **ko:** Lift and side/down pose retain all feathers and leg patterns.
- **victory:** Airborne celebration remains whole, with both feather wings and face clear.

Final QA: [attack1](img/ts208-346-attack1.jpg), [attack2](img/ts208-346-attack2.jpg), [attack3](img/ts208-346-attack3.jpg), [damage](img/ts208-346-damage.jpg), [ko](img/ts208-346-ko.jpg), [victory](img/ts208-346-victory.jpg); [results JSON](img/ts208-346-results.json); [native export stats](img/ts208-346-native-stats.json).

Integration: this ticket has its own `TS-208e:` commit on `time-stranger`; all five group commits are pushed together after final inventory verification.
