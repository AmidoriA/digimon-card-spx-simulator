---
name: import-ts-model
description: Give a custom card the 3D model and motions of its Digimon from Digimon Story Time Stranger, in place of its recoloured disc model. Use when a Time Stranger card's model is to be converted (the TS-208 tickets), when a converted model looks wrong in the battle, or when the converter tools/ts_model.py is changed.
---

# Giving a custom card its Time Stranger model

A custom card starts with its base's model in other colours (the `create-card` skill). This
replaces that model with the Digimon's own from Time Stranger: its mesh, its texture and
its motions, cut down to what a model of the disc costs and laid on the base's keys, so
that the base's battle scripts still run on it.

**None of this is the PlayStation game's.** Guilmon (card 302, model 401) is the worked
example: TS-207's log in `docs/time-stranger/TS-207-pilot-guilmon.md` has what it looked
like at each step, and the README, "Time Stranger models as DDCB models", has every rule
the converter follows. Read both before the first model.

| File | What |
|---|---|
| `tools/custom_cards.json` | The card's `model` entry: the only thing you write by hand |
| `tools/build_custom.py` | Converts every card whose `model` has `"ts"` |
| `tools/ts_model.py` | The converter. Run by itself it writes somewhere else and draws what it made |
| `tools/ts_mbe.py` | Reads Time Stranger's tables (which model is which Digimon) |
| `tools/sheet_server.py`, `tools/model_sheet.js` | Pictures of the model in the battle, frame by frame |
| `docs/time-stranger/roster.md` | Each card's base and Time Stranger model |
| `docs/time-stranger/motion-slots.md` | The body parts each base's scripts hang effects on |

You need the unpacked disc (`extracted/`), the unpacked Time Stranger files
(`extracted_ts/`, 49 GB, never committed) and `tools/.venv/Scripts/python`. In a worktree
all three are only in the main checkout: use their full paths. Time Stranger's files are
another game's: run every tool that reads them with `python -I`. The examples below write
`extracted`, `extracted_ts` and `tools/.venv/Scripts/python` for those paths.

## 1. Look up what the card is made of

- **The roster row** (`roster.md`): the card's number, its base, its model number and its
  Time Stranger model `chrNNN`.
- **The base's model number**:

```bash
node -e "const c=require('./web/js/data/cards.js').cards;const x=c.find(c=>c.id===303);console.log(x.name,'base card',x.custom,'base model',c[x.custom].model)"
```

- **The parts the base's scripts name**: `motion-slots.md`, "Where the scripts start
  them", the base's three rows, column **Parts**. A script hangs its fire or its glow on
  those body parts of its own Digimon, by number. The new model needs the right body part
  under each of those numbers (step 3). **Part 0 matters for every model**: other cards'
  hit scripts hang objects on part 0 of whoever is hit.
- **The base's own Digimon in Time Stranger**, if it has one (for the size, step 3). The
  keys are the Japanese names, so look the English one up first:

```bash
tools/.venv/Scripts/python -I tools/ts_mbe.py extracted_ts/app_text01/text/char_name.mbe Sheet1 Goblimon
```

```bash
tools/.venv/Scripts/python -I tools/ts_mbe.py extracted_ts/app_0/data/char_info.mbe char_info char_GOBURIMON
```

  The first gives the key (`char_GOBURIMON`), the second its model in the fourth column
  (`chr111`). Time Stranger spells some names differently (Goblimon, Tailmon); search for
  a part of the name.

## 2. Convert it once to look

Not into `web/` yet. Give a scratch directory, and name the parts you want to see:

```bash
tools/.venv/Scripts/python -I tools/ts_model.py extracted_ts/app_0/chr136.geom web 80 <scratch dir> 402 --detail 170 --preview look.png --show 0,6 --poses poses.png
```

`chr136.geom` the Time Stranger model, `80` the base's model number, `402` the card's.
Read what it prints:

- `source: … triangles, … bones in use` and each `part X joins Y`: the bones that were
  merged to come down to 30 parts, cheapest first. The percentage is how far that moves
  the surface. Nails, collars and hair ends should go first; if a knee or an elbow goes,
  say so in the log and look at that joint in the battle.
- `slot N: no ba02; bs01 takes its place`: the model lacks a motion. See step 3.
- `slot N … ends more than half a turn from the standing pose`: the way back to standing
  will swing round. After a KO nothing follows; after an attack look at the frames where
  the script puts the Digimon back to standing.
- `parts: 0=J_center 1=J_leg_l …`: the bone of each part number. These are the names
  `--part` takes.
- `texture pieces … shrunk to 0.15… (65% of it used)`: how much of the picture is left.

`look.png` shows the base and the new model as built, front and side, with the parts of
`--show` in plain colours (magenta, cyan, green, yellow, in that order): what body part a
number is in the base, and where that number lies in the new model. `poses.png` shows
every slot in six keys, the base above the new model.

## 3. Choose what the tool cannot

Each of these is a choice of this project's. Write down which you made and why.

- **Part numbers.** For every number the base's scripts name, find the bone of the new
  model that is that body part (`look.png`, the `parts:` line) and give it the number:
  `--part 6=J_hand_r`. Left and right: the base and the new model face the same way in
  the picture, so the hand on the same side of the picture is the same hand. Leave part 0
  on the body (the root bone or the chest) unless the base's part 0 is something else.
- **Size.** Without anything the model is as tall as the base. That is wrong where the
  height is ears, horns, a raised weapon or a flame: Guilmon's ears made its body small.
  `--against <the base's own .geom>` sizes it against the base as the two are sized in
  Time Stranger; Guilmon is 1.24 times Agumon there and it fitted. **Look at the number
  it prints**: the two games do not size their Digimon alike, and Coronamon comes out a
  third of Goburimon's height. Take `--against` when it gives about 0.8 to 1.3 and looks
  right beside the base; else keep the base's height, or give `--size K` and name K as a
  number chosen by eye. The camera of the base's scripts was made for the base's shape:
  a model much larger or smaller is cut by its close-ups.
- **Motions.** A missing motion is replaced by the next of its kind, printed. If the
  replacement makes two attacks alike or a slot wrong, name another: `--motion 3=ba02`.
  The names a model has are its `chrNNN_<name>.anim` files; what each is for is in the
  README, "Time Stranger motions".
- **Figures.** `--detail 170` is Angewomon's model: 30 parts, 976 triangles, 256×128, 14
  palette rows. That is the owner's choice for every converted model (2026-10-14);
  `build_custom.py` uses it without being told. Give another model or single figures
  (`--triangles 800`, the card's `detail` or `figures`) only when the owner asks, or when
  a model cannot be made within them, and say so.

Run step 2 again with your choices until `look.png` and `poses.png` are right.

## 4. Write the card's entry and build

In `tools/custom_cards.json` the card's `model` loses its `recolour` and names the model.
Remove the recolour's rules from `"recolours"` too if nothing else uses them.

```json
"model": {"number": 402, "ts": "chr136", "parts": {"6": "J_hand_r"}}
```

`against` (the base's `chrNNN`), `size`, `motions` (`{"3": "ba02"}`), `detail` and
`figures` are the options of step 3; `tools/custom.py` lists them. Then:

```bash
tools/.venv/Scripts/python -I tools/build_custom.py extracted web model 303
```

`303` is the card: without a number the model of every custom card is built again. It prints what
it made and the lines of step 2 that matter. `git status` must show the three files of
the model (`web/assets/models/402.bin.gz`, `.png`, `p.png`) and `custom_cards.json`, and
nothing else of `web/`: `cards.js` holds only the model's number, which does not change.
Building twice gives the same bytes; a card whose Time Stranger files are not there is
left as it is, with a line that says so.

## 5. Check it

```bash
node tools/battletest.js
```

It plays every card's three attacks in the three styles and checks the refined meshes of
every model, also that the new corners of a triangle between two parts lie on its sides.
Then the five checks of `CLAUDE.md`.

Then look at it. A converted model that passes every test can still be torn, tiny, or
turned the wrong way. `.claude/launch.json` has the server `model-sheets` (port 8766; it
serves `web/` of the checkout it is started in, without caching, and keeps pictures in
`sheets/`, which git ignores). Open `http://localhost:8766/battle-preview.html`, load the
helper and make a sheet of each case, the base beside the new card:

```js
await new Promise((ok, no) => { const s = document.createElement('script'); s.src = '/sheet.js?' + Date.now(); s.onload = ok; s.onerror = no; document.head.appendChild(s); });
```

```js
JSON.stringify(await modelSheet({ cards: ['Goburimon', 'Coronamon'], attack: 0, frames: [30, 110, 150, 195, 230], out: 'coronamon-attack1.jpg' }))
```

| Case | Options | Frames |
|---|---|---|
| Attacks 1 to 3 | `attack: 0`, `1`, `2` | five over the attack's slot; its length is in `motion-slots.md`, and the motion starts at frame 2 |
| Damage | `defend: 1` | the damage motion, from the frame the timeline gives |
| KO | `defend: 1, ko: true` | the KO motion likewise |
| Victory | `attack: 0, win: true` | the victory motion likewise |

Call a case once with one far frame (`frames: [900]`) to get its `timeline`: the frames at
which the card's model changes motion (`[307, 5, "runs"]`: slot 5 starts at frame 307;
`"ended"`: its last key is reached). That call draws nothing, since the scene is over
before frame 900. Then name five frames inside the motion. A sheet's result must have
`sameTimeline: true` (the new model's motions start and end at the base's frames in all
three styles), `errors: 0` and as many `shots` as `wanted`. Read every sheet
(`sheets/<name>.jpg`) and look for:

- a body that is whole in all three styles: no gaps at joints, no shards, no fans;
- the model on the ground, upright, facing the opponent, about the base's size;
- the script's effects at the body part they belong to;
- the face: do the eyes and markings read?

After a rebuild, load the page again before the next sheet: the page keeps models it has
loaded.

## 6. Write it down

- `README.md`, "Not from the game code": the card now wears its Time Stranger model, and
  every number you chose (a `size`, another motion, other figures) with its reason.
- `docs/time-stranger/roster.md`: the card's Phase 2 status.
- The ticket's log: the command, the figures it printed, the choices of step 3, what you
  saw in each sheet, what is not right, and what you did not look at. Put the sheets the
  log shows into `docs/time-stranger/img/`.
- Trello: tick the Digimon on its ticket's checklist.

## What is known to be not right

Do not report these as new, and do not hide them:

- **The strike is not on the script's moment.** The keys of a slot are spread evenly over
  the Time Stranger motion. The base's script fires when the base would strike. When a
  Time Stranger motion strikes was not looked for in that game's files.
- **The scripts and the camera are the base's.** A fireball can come under a claw
  attack's name, and a close-up made for the base can cut the new model.
- **The colours are the texture's own.** How Time Stranger's shader lights them was not
  read; they can look dull beside the disc's models. A recolour on top of a converted
  model is not built.
- **Bones merged into one part move as one piece.**

## Traps

- **Do not give a triangle whole to one part** to match the disc's models. That was the
  first try (TS-205): every joint tore open as soon as a motion played. The converted
  models have triangles between parts on purpose, and `refine` in `web/js/battlehd.js`
  knows about them. A change there must leave every other model's mesh as it was;
  `battletest.js` checks the converted ones.
- **A fan or a shard in Enhanced or Smooth only** is a triangle that reaches between far
  parts: its refined corners go with one end. The thinning refuses to join bones that no
  edge of the model joins; if you see one all the same, find the triangle before touching
  the refining.
- **The browser keeps old files.** Use the `model-sheets` server, not a plain one, and
  load the page again after every build.
- **A number in `--against`'s line far from 1** means the two games size those Digimon
  differently. Do not ship a model a third of its base's size because a rule said so.
- **`python -I` and the script's own directory.** The tools add their directory to the
  path themselves; a helper script of yours that imports them has to do the same.
- **A long shell here-document with quotes in it fails on this machine.** Write a script
  to a file and run that.
- **The Time Stranger files are never committed**, the converted model's three files are.
- **Smooth must fit 16-bit indices**: no more triangles than the most a disc model has
  (1,246). The tool refuses more.
