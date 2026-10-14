# TS-208c: Nature models from Time Stranger

| | |
|---|---|
| Trello | https://trello.com/c/Clemd8tm |
| Phase | 2 Models |
| Feature branch | `time-stranger` (all 45 new cards complete before merging to `main`) |
| Depends on | TS-207, TS-209, TS-103 |

## Goal

Convert the nine Nature Digimon to their model numbers: Renamon (419), Terriermon (420), Lalamon (421), Kyubimon (422), Gargomon (423), Sunflowmon (424), Taomon (425), Rapidmon (426), Lilamon (427).

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

- [x] Nine models written by `build_custom.py` from their card entries: each `model` names `ts`, none of these cards has a `model.recolour` left; card entries otherwise unchanged.
- [x] The log has, for each Digimon: its entry, the figures the tool printed, its part numbers, its size rule (with the `against` ratio or the `size` chosen), any motion that was replaced, its sheets, and what is not right.
- [x] All checks of CLAUDE.md and `battletest.js` pass.
- [x] Browser check reported as the skill's step 5 asks: every sheet read, `sameTimeline`, no page errors.
- [x] README ("Not from the game code") and roster.md updated; the Digimon ticked on Trello.
- [x] One commit, `TS-208c: …`, pushed.

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

### Renamon (320, model 419)

```json
{"number":419,"ts":"chr391","native":true,"parts":{"0":"J_spine","9":"J_toeR","11":"J_toeL"},"against":"chr092"}
```

Full source: **33 bones, 5592 vertices, 8868 triangles**; 419-0.png: 1024×1024 RGBA, 419-1.png: 1024×1024 RGBA, 419-2.png: 1024×1024 RGBA.

Site height 190.448883; scale 109.072928; against chr092; size 1. Anchors: 0 → J_spine, 9 → J_toeR, 11 → J_toeL. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-320-attack1.jpg), [attack2](img/ts208-320-attack2.jpg), [attack3](img/ts208-320-attack3.jpg), [damage](img/ts208-320-damage.jpg), [ko](img/ts208-320-ko.jpg), [victory](img/ts208-320-victory.jpg). [Capture/timeline results](img/ts208-320-results.json); [full native figures](img/ts208-320-native-stats.json).

Gatomon parts9/11 are right/left feet. Source-relative ratio against chr092 is 0.975. All anatomy remains whole. Source leaps leave the inherited camera during attack1/2; attack3 upper body can cross the top edge; KO final491 body drops below the frame.

### Terriermon (321, model 420)

```json
{"number":420,"ts":"chr701","native":true,"parts":{"0":"J_center","4":"J_ear03_r","7":"J_ear03_l"}}
```

Full source: **35 bones, 13070 vertices, 6046 triangles**; 420-0.png: 1024×1024 RGBA, 420-1.png: 1024×1024 RGBA, 420-2.png: 1024×1024 RGBA.

Site height 208.085693; scale 186.160635; fit to base height; size 1. Anchors: 0 → J_center, 4 → J_ear03_r, 7 → J_ear03_l. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-321-attack1.jpg), [attack2](img/ts208-321-attack2.jpg), [attack3](img/ts208-321-attack3.jpg), [damage](img/ts208-321-damage.jpg), [ko](img/ts208-321-ko.jpg), [victory](img/ts208-321-victory.jpg). [Capture/timeline results](img/ts208-321-results.json); [full native figures](img/ts208-321-native-stats.json).

Patamon parts4/7 are ears. Source-relative ratio against chr096 was 0.547 and was rejected for base height. Full long ears and body remain visible; wide ears make the torso relatively small in some inherited close-ups.

### Lalamon (322, model 421)

```json
{"number":421,"ts":"chr056","native":true,"parts":{"0":"J_center","6":"J_joint13","9":"J_joint9"},"against":"chr348"}
```

Full source: **12 bones, 4578 vertices, 1553 triangles**; 421-0.png: 1024×1024 RGBA, 421-1.png: 1024×1024 RGBA, 421-2.png: 1024×1024 RGBA, 421-3.png: 1024×1024 RGBA.

Site height 387.820801; scale 277.174313; against chr348; size 1. Anchors: 0 → J_center, 6 → J_joint13, 9 → J_joint9. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-322-attack1.jpg), [attack2](img/ts208-322-attack2.jpg), [attack3](img/ts208-322-attack3.jpg), [damage](img/ts208-322-damage.jpg), [ko](img/ts208-322-ko.jpg), [victory](img/ts208-322-victory.jpg). [Capture/timeline results](img/ts208-322-results.json); [full native figures](img/ts208-322-native-stats.json).

Palmon parts6/9 are hands. Source-relative ratio against chr348 is 1.3004. Full petals/limbs retained. Late attack1/3 can crop the upper face under the inherited camera.

### Kyubimon (323, model 422)

```json
{"number":422,"ts":"chr395","native":true,"parts":{"0":"J_spine1","1":"J_neck","2":"J_head","3":"J_mouth"}}
```

Full source: **67 bones, 24898 vertices, 11890 triangles**; 422-0.png: 2048×2048 RGBA, 422-1.png: 2048×2048 RGBA, 422-2.png: 1024×1024 RGBA, 422-3.png: 1024×1024 RGBA, 422-4.png: 256×256 RGBA.

Site height 477.451324; scale 300.970190; fit to base height; size 1. Anchors: 0 → J_spine1, 1 → J_neck, 2 → J_head, 3 → J_mouth. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-323-attack1.jpg), [attack2](img/ts208-323-attack2.jpg), [attack3](img/ts208-323-attack3.jpg), [damage](img/ts208-323-damage.jpg), [ko](img/ts208-323-ko.jpg), [victory](img/ts208-323-victory.jpg). [Capture/timeline results](img/ts208-323-results.json); [full native figures](img/ts208-323-native-stats.json).

Unimon parts1/2/3 are neck/head/mouth. Source-relative ratio against chr548 was 0.6797 and was rejected for base height. Nine tails, chains and bells remain present. Some close-ups crop tail edges without removing them.

### Gargomon (324, model 423)

```json
{"number":423,"ts":"chr710","native":true,"parts":{"0":"J_spine02","5":"J_weapon_r","8":"J_weapon_l"}}
```

Full source: **47 bones, 38118 vertices, 12706 triangles**; 423-0.png: 1024×1024 RGBA, 423-1.png: 1024×1024 RGBA, 423-2.png: 1024×1024 RGBA, 423-3.png: 1024×1024 RGBA, 423-4.png: 1024×1024 RGBA.

Site height 414.241913; scale 191.509206; fit to base height; size 1. Anchors: 0 → J_spine02, 5 → J_weapon_r, 8 → J_weapon_l. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-324-attack1.jpg), [attack2](img/ts208-324-attack2.jpg), [attack3](img/ts208-324-attack3.jpg), [damage](img/ts208-324-damage.jpg), [ko](img/ts208-324-ko.jpg), [victory](img/ts208-324-victory.jpg). [Capture/timeline results](img/ts208-324-results.json); [full native figures](img/ts208-324-native-stats.json).

Leomon parts5/8 are right fist and left weapon/hand. Source-relative ratio against chr072 was 0.465 and was rejected. Source bs01 is visible earlier but leaves the camera at194/258; victory jump495 crosses the top edge. Full ears/guns/body retained.

### Sunflowmon (325, model 424)

```json
{"number":424,"ts":"chr058","native":true,"parts":{"0":"J_chest","4":"J_hand_r","7":"J_hand_l"},"against":"chr349"}
```

Full source: **28 bones, 7526 vertices, 3356 triangles**; 424-0.png: 1024×1024 RGBA, 424-1.png: 1024×1024 RGBA, 424-2.png: 1024×1024 RGBA.

Site height 447.960022; scale 181.373322; against chr349; size 1. Anchors: 0 → J_chest, 4 → J_hand_r, 7 → J_hand_l. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-325-attack1.jpg), [attack2](img/ts208-325-attack2.jpg), [attack3](img/ts208-325-attack3.jpg), [damage](img/ts208-325-damage.jpg), [ko](img/ts208-325-ko.jpg), [victory](img/ts208-325-victory.jpg). [Capture/timeline results](img/ts208-325-results.json); [full native figures](img/ts208-325-native-stats.json).

Togemon parts4/7 are hands. Source-relative ratio against chr349 is 1.1466. Face, flower, stalk and limbs remain intact; first victory493 crops the head above the screen, later sampled poses show the flower body.

### Taomon (326, model 425)

```json
{"number":425,"ts":"chr405","native":true,"parts":{"0":"J_spine2","5":"J_handR","9":"J_handL","13":"J_center"}}
```

Full source: **46 bones, 29772 vertices, 13556 triangles**; 425-0.png: 2048×2048 RGBA, 425-1.png: 1024×1024 RGBA, 425-2.png: 1024×1024 RGBA, 425-3.png: 2048×2048 RGBA, 425-4.png: 2048×2048 RGBA, 425-5.png: 2048×2048 RGBA.

Site height 448.746002; scale 141.379729; fit to base height; size 1. Anchors: 0 → J_spine2, 5 → J_handR, 9 → J_handL, 13 → J_center. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-326-attack1.jpg), [attack2](img/ts208-326-attack2.jpg), [attack3](img/ts208-326-attack3.jpg), [damage](img/ts208-326-damage.jpg), [ko](img/ts208-326-ko.jpg), [victory](img/ts208-326-victory.jpg). [Capture/timeline results](img/ts208-326-results.json); [full native figures](img/ts208-326-native-stats.json).

Angewomon parts5/9 are hands; part13 is a lower wing segment, confirmed by a colored original-base part drawing. Taomon has no corresponding wing: part13 intentionally uses J_center as a body effect fallback, not a skeleton remap. Source-relative ratio against chr148 was 0.6866 and was rejected. Brush, cloth and full body retained; close-ups can crop feet/brush tips.

### Rapidmon (327, model 426)

```json
{"number":426,"ts":"chr722","native":true,"parts":{"0":"J_spine03","15":"J_weapon_l","20":"J_foot_r","25":"J_spine03"},"against":"chr101"}
```

Full source: **36 bones, 31236 vertices, 10770 triangles**; 426-0.png: 2048×2048 RGBA, 426-1.png: 2048×2048 RGBA, 426-2.png: 1024×1024 RGBA, 426-3.png: 1024×1024 RGBA.

Site height 461.020264; scale 183.863101; against chr101; size 1. Anchors: 0 → J_spine03, 15 → J_weapon_l, 20 → J_foot_r, 25 → J_spine03. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-327-attack1.jpg), [attack2](img/ts208-327-attack2.jpg), [attack3](img/ts208-327-attack3.jpg), [damage](img/ts208-327-damage.jpg), [ko](img/ts208-327-ko.jpg), [victory](img/ts208-327-victory.jpg). [Capture/timeline results](img/ts208-327-results.json); [full native figures](img/ts208-327-native-stats.json).

MagnaAngemon part15 is left hand, part20 right foot; part25 is outside the original 25-part inventory and used the original core fallback. It explicitly aliases J_spine03. Source-relative ratio against chr101 is 0.88948. Full guns/ears/legs retained. Attack3 late126/188/250 shows mostly feet/lower body under inherited camera; late victory descends behind the WINNER view.

### Lilamon (328, model 427)

```json
{"number":427,"ts":"chr073","native":true,"parts":{"0":"J_chest","7":"J_hand_r","10":"J_hand_l"},"size":1.8}
```

Full source: **50 bones, 15665 vertices, 5898 triangles**; 427-0.png: 2048×2048 RGBA, 427-1.png: 2048×2048 RGBA, 427-2.png: 2048×2048 RGBA, 427-3.png: 1024×1024 RGBA, 427-4.png: 1024×1024 RGBA, 427-5.png: 2048×2048 RGBA.

Site height 911.484680; scale 230.625753; fit to base height; size 1.8. Anchors: 0 → J_chest, 7 → J_hand_r, 10 → J_hand_l. Slots 0–7: `bn01/ba01/ba02/bs01/bd01/bd02/bv01/bn01`.

Final reviewed sheets: [attack1](img/ts208-328-attack1.jpg), [attack2](img/ts208-328-attack2.jpg), [attack3](img/ts208-328-attack3.jpg), [damage](img/ts208-328-damage.jpg), [ko](img/ts208-328-ko.jpg), [victory](img/ts208-328-victory.jpg). [Capture/timeline results](img/ts208-328-results.json); [full native figures](img/ts208-328-native-stats.json).

Lillymon parts7/10 are hands. Ratio against chr359 was 1.5798 and was rejected. Source bind height3.952224 versus idle height1.968302 explains the small first fit; size1.8 makes full face, flower/wings and legs readable. No limbs are removed. Attack3 late182/242 descends below the camera with inherited bright effects.

Integration: this ticket has its own `TS-208c:` commit on `time-stranger`; all five group commits are pushed together after final inventory verification.
