"""Cache/replay TS-002 source crops and ComfyUI edits; does not build game assets.

Usage: python tools/prepare_time_stranger_art.py extracted [--only 303] [--force]
       python tools/prepare_time_stranger_art.py extracted --review

The manifest and recipes are committed; downloaded/edited images stay under extracted/newart.
Coordinates refer to build_new_art.py's normalized 430x600 card image. Masks use those
same coordinates. Only masked pixels change; output is a square at the crop's native size.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw
import build_new_art
import comfy

TOOLS = Path(__file__).resolve().parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def edit(source, mask, recipe, tag):
    output = comfy.inpaint(source, mask, recipe['prompt'], workflow=TOOLS / recipe['workflow'],
                           tag='ts002_' + tag, **{key: recipe[key] for key in
                           ('seed','model','steps','cfg','sampler_name','scheduler','denoise')})
    return output, output.info['comfy_prompt_id']

def make_mask(entry, recipe):
    canvas = Image.new('L', (430, 600), 0)
    draw = ImageDraw.Draw(canvas)
    for shape in recipe['mask']:
        getattr(draw, shape['type'])(shape['box'] if 'box' in shape else [tuple(p) for p in shape['points']], fill=255)
    x, y, size = entry['crop']
    return canvas.crop((x, y, x + size, y + size))

def edit_identity(source, mask, recipe):
    return {'source_pixels_sha256': digest(source.tobytes()), 'mask_pixels_sha256': digest(mask.tobytes()),
            'recipe_sha256': digest(json.dumps(recipe, sort_keys=True).encode()),
            'workflow_sha256': digest((TOOLS / recipe['workflow']).read_bytes())}

def edited_source(entry, cache):
    """Load a recorded native edited crop, refusing missing, mismatched or stale results."""
    cache = Path(cache).resolve()
    output = (cache / entry['edited']).resolve()
    if not output.is_relative_to(cache):
        raise ValueError('edited art must be inside extracted/newart')
    recipes = json.loads((TOOLS / 'new_art_edits.json').read_text(encoding='utf8'))
    matches = [r for r in recipes if r['output'] == entry['edited']]
    source_entry = {key: entry[key] for key in ('card','ref','crop') if key in entry}
    if len(matches) != 1 or matches[0]['source'] != source_entry:
        raise ValueError('edited art does not match its recorded source and crop')
    if not output.exists() or not output.with_suffix('.json').exists():
        raise FileNotFoundError('Prepare the edited art with tools/prepare_time_stranger_art.py first')
    recipe = matches[0]
    source = build_new_art.source(entry, str(cache))
    mask = make_mask(entry, recipe)
    identity = edit_identity(source, mask, recipe)
    saved = json.loads(output.with_suffix('.json').read_text(encoding='utf8'))
    picture = Image.open(output).convert('RGB')
    if picture.size != source.size or any(saved.get(key) != value for key, value in identity.items()) or saved.get('output_pixels_sha256') != digest(picture.tobytes()):
        raise ValueError('Edited art cache is stale or damaged; rerun tools/prepare_time_stranger_art.py')
    return picture

def prepare(entry, recipe, cache, force=False):
    source = build_new_art.source(entry, str(cache))
    out = cache / recipe['output']
    meta = out.with_suffix('.json')
    mask = make_mask(entry, recipe)
    identity = edit_identity(source, mask, recipe)
    if out.exists() and meta.exists() and not force:
        saved = json.loads(meta.read_text())
        if all(saved.get(key) == value for key, value in identity.items()):
            picture = Image.open(out).convert('RGB')
            if saved.get('output_pixels_sha256') == digest(picture.tobytes()):
                print(str(entry['id']) + ' cached', flush=True)
                return
    out.parent.mkdir(parents=True, exist_ok=True)
    source.save(out.with_name(out.stem + '-before.png'))
    mask.save(out.with_name(out.stem + '-mask.png'))
    picture, prompt_id = edit(source, mask, recipe, str(entry['id']))
    picture.save(out)
    identity.update({'id': entry['id'], 'source': entry['card'], 'crop': entry['crop'], 'prompt_id': prompt_id,
                     'output_pixels_sha256': digest(picture.tobytes())})
    meta.write_text(json.dumps(identity, indent=2) + '\n', encoding='utf8')
    print(str(entry['id']) + ' edited ' + identity['output_pixels_sha256'], flush=True)

def review(entries, recipes, cache):
    target = cache / 'ts002-review'
    target.mkdir(parents=True, exist_ok=True)
    for start in range(0, len(entries), 15):
        rows = entries[start:start+15]
        sheet = Image.new('RGB', (5*300, 3*335), '#eeeeee')
        draw = ImageDraw.Draw(sheet)
        for idx, entry in enumerate(rows):
            source = cache / recipes[entry['id']]['output'] if entry['id'] in recipes else cache / 'ref' / (entry['ref']+'.jpg')
            picture = Image.open(source).convert('RGB'); picture.thumbnail((290,290))
            x,y = idx%5*300,idx//5*335
            sheet.paste(picture,(x,y+40))
            draw.text((x+5,y+5),str(entry['id'])+' '+entry['name'],fill='black')
            draw.text((x+5,y+20),entry.get('card','ref '+entry.get('ref','')),fill='black')
        sheet.save(target / ('review-%d.jpg'%(start//15)), quality=95)
    print('Review sheets: ' + str(target))

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('extracted',type=Path)
    parser.add_argument('--only',type=int,nargs='+')
    parser.add_argument('--force',action='store_true')
    parser.add_argument('--review',action='store_true')
    args=parser.parse_args()
    entries=json.loads((TOOLS/'time_stranger_art.json').read_text(encoding='utf8'))
    recipes={r['id']:r for r in json.loads((TOOLS/'new_art_edits.json').read_text(encoding='utf8'))}
    if args.only: entries=[e for e in entries if e['id'] in args.only]
    cache=args.extracted/'newart'
    if args.review:
        review(entries,recipes,cache)
    else:
        for entry in entries:
            if entry['id'] in recipes:
                prepare(entry,recipes[entry['id']],cache,args.force)
            else:
                build_new_art.source(entry,str(cache))
                print(str(entry['id'])+' reference cached',flush=True)

if __name__=='__main__': main()
