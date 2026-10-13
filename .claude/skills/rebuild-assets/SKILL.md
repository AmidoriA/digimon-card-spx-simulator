---
name: rebuild-assets
description: Rebuild the site's generated data and assets from the disc (cards, pictures, sounds, effect scripts, 3D models, arenas, battle overlay). Use after changing a format reader or an exporter in tools/, or when setting the project up from a disc image.
---

# Rebuilding the generated files

Everything under `web/js/data/` and `web/assets/` is made by the tools from the unpacked
disc in `extracted/`. Never edit those files by hand: change the tool and run it again.

## From a disc image

The image must be the one named in the README ("The disc"); `extract_iso.py` says whether
it is. All addresses and offsets in the tools are for that build.

```bash
python tools/extract_iso.py "<path>/Digimon Digital Card Battle.bin" extracted/disc
```

```bash
python tools/extract_drv.py extracted/disc extracted/drv
```

## The exporters

Run only the one whose input or code you changed. All take `extracted web`.

| Tool | Makes | Notes |
|---|---|---|
| `build_data.py` | `web/js/data/cards.js` | cards and decks |
| `build_owners.py` | `web/assets/owner/` | the deck owners' pictures at the game's 128x112; `--upscale` sends them 4x through ComfyUI |
| `build_effects.py` | `web/js/data/effects.js` | board effect scripts |
| `build_audio.py` | `web/assets/audio/`, `web/js/data/audio.js` | pass `--missing`, or every sound file changes |
| `build_models.py` | `web/assets/models/NNN.*` | Digimon models, textures, motions |
| `build_battle.py` | `web/assets/battle/` and `web/assets/models/bgNNN.*` | battle scripts, attack effect files, arenas, overlay |
| `upscale_assets.py` | `web/assets/art/`, `mini/`, `ui/`, `battle/overlay4.png` | needs the owner's ComfyUI running at `http://127.0.0.1:8188`; name a part (`art`, `mini`, `ui`, `overlay`) to do only that |
| `build_custom.py` | the custom cards' models, effect files and pictures, and `cards.js` and `scripts.json.gz` again | `build_data.py` and `build_battle.py` already write the custom cards' records and scripts with the game's; name a part (`data`, `model`, `battle`, `art`), only `art` needs ComfyUI. See the `create-card` skill |
| `arena_previews.py web` | `web/assets/battle/arena/` | serves a page that draws each arena in a browser and saves it; pass `--no-open` and open the address it prints yourself |

```bash
tools/.venv/Scripts/python tools/build_models.py extracted web
```

```bash
tools/.venv/Scripts/python tools/build_battle.py extracted web
```

## Afterwards

- `git status` shows what changed. The model and script exports give the same bytes for
  the same input, so a rebuild that changes hundreds of files means the reader changed;
  one that was not meant to change anything should change nothing. Check a handful of
  files against the old ones before a large re-export if you are not sure.
- A change to `tools/omd.py` touches three things: the Digimon models (`build_models.py`),
  the arenas and the attack effect models (`build_battle.py`), and then the arena previews.
- Run `python tools/check_paths.py`, look at a battle in the browser (see the browser
  skill), and commit the tool and the files it produced together.
