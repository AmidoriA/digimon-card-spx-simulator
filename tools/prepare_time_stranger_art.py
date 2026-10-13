"""Cache/replay TS-002 source crops and ComfyUI edits; does not build game assets.

Usage: python tools/prepare_time_stranger_art.py extracted [--only 303] [--force]
       python tools/prepare_time_stranger_art.py extracted --review

The manifest and recipes are committed; downloaded/edited images stay under extracted/newart.
Coordinates refer to build_new_art.py's normalized 430x600 card image. Masks use those
same coordinates. Only masked pixels change; output is a square at the crop's native size.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import time
import urllib.parse
import uuid

from PIL import Image, ImageDraw, ImageFilter, ImageOps
import build_new_art
import comfy

TOOLS = Path(__file__).resolve().parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def edit(source, mask, recipe, tag):
    # Native crop is resized only for the model, then composited at native size.
    model_image = source.resize((512, 512), Image.Resampling.LANCZOS).convert('RGBA')
    model_mask = mask.resize((512, 512), Image.Resampling.NEAREST)
    model_image.putalpha(ImageOps.invert(model_mask))
    name = comfy._upload(model_image, 'ts002_' + tag + '_' + uuid.uuid4().hex + '.png')
    graph = json.loads((TOOLS / recipe['workflow']).read_text(encoding='utf8'))
    graph['1']['inputs']['image'] = name
    graph['2']['inputs']['ckpt_name'] = recipe['model']
    graph['3']['inputs']['text'] = recipe['prompt']
    graph['6']['inputs'].update({key: recipe[key] for key in ('seed', 'steps', 'cfg', 'sampler_name', 'scheduler', 'denoise')})
    graph['8']['inputs']['filename_prefix'] = 'ddcb/ts002_' + tag
    pid = comfy._post_json('/prompt', {'prompt': graph, 'client_id': 'ddcb-ts002'})['prompt_id']
    started = time.monotonic()
    while time.monotonic() - started < 600:
        history = json.loads(comfy._get('/history/' + pid))
        if pid in history:
            result = history[pid]
            if result.get('status', {}).get('status_str') == 'error':
                raise RuntimeError('ComfyUI failed: ' + json.dumps(result['status']))
            outputs = result.get('outputs', {}).get('8', {}).get('images', [])
            if outputs:
                query = urllib.parse.urlencode({key: outputs[0][key] for key in ('filename', 'subfolder', 'type')})
                generated = Image.open(io.BytesIO(comfy._get('/view?' + query))).convert('RGB')
                generated = generated.resize(source.size, Image.Resampling.LANCZOS)
                # A 1px soft seam stays entirely within the declared mask.
                feather = mask.filter(ImageFilter.GaussianBlur(1))
                feather = Image.composite(feather, Image.new('L', mask.size), mask)
                return Image.composite(generated, source, feather), pid
        time.sleep(0.5)
    raise TimeoutError('ComfyUI did not finish ' + tag)

def make_mask(entry, recipe):
    canvas = Image.new('L', (430, 600), 0)
    draw = ImageDraw.Draw(canvas)
    for shape in recipe['mask']:
        getattr(draw, shape['type'])(shape['box'] if 'box' in shape else [tuple(p) for p in shape['points']], fill=255)
    x, y, size = entry['crop']
    return canvas.crop((x, y, x + size, y + size))

def prepare(entry, recipe, cache, force=False):
    source = build_new_art.source(entry, str(cache))
    out = cache / recipe['output']
    meta = out.with_suffix('.json')
    mask = make_mask(entry, recipe)
    identity = {'source_pixels_sha256': digest(source.tobytes()), 'mask_pixels_sha256': digest(mask.tobytes()),
                'recipe_sha256': digest(json.dumps(recipe, sort_keys=True).encode()),
                'workflow_sha256': digest((TOOLS / recipe['workflow']).read_bytes())}
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
