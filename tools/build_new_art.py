"""New card art for the Digimon cards: illustrations of the Digimon Card Game (2020), cut out
of the card pictures on the official card list, in place of the game's own 64x64 art.

Usage (venv python):  build_new_art.py <extracted_dir> <web_dir> [--plain]

  web/assets/art2/NNN.webp    512x512  card illustration
  web/assets/mini2/NNN.webp   160x160  board-size card art

Only Digimon cards get new art; option cards keep the game's. Which picture each card uses
is in tools/new_art.json, one entry per Digimon card:

  {"id", "name", "card": "BT1-018", "crop": [x, y, size]}   a card of the modern game, and the
                                                            square of its 430x600 picture to keep
  {"id", "name", "ref": "yammamon"}                         no such card exists: the picture of
                                                            the Digimon Reference Book instead

The crops are centred on the Digimon. Part of a card's own print (a cost circle at the left
edge, a line of rules text) may show at the edge of one; the "SAMPLE" mark the card list
prints across recent cards is kept out. Pictures are downloaded once into
<extracted_dir>/newart and reused. The crop goes through the local ComfyUI for a 4x upscale
(as upscale_assets.py does) and is then brought to size; --plain skips ComfyUI and resamples.
"""
import io
import json
import os
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comfy  # noqa: E402
from PIL import Image  # noqa: E402

CARD_URL = "https://world.digimoncard.com/images/cardlist/card/%s.png"
REF_URL = "https://digimon.net/cimages/digimon/%s.jpg"
MODEL = "RealESRGAN_x4plus.safetensors"
ART, MINI = 512, 160


def fetch(url, path):
    """Download once; the copy on disk is used from then on."""
    if not (os.path.exists(path) and os.path.getsize(path) > 2000):
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (card battle fan project)"})
        data = urllib.request.urlopen(req, timeout=60).read()
        Image.open(io.BytesIO(data)).verify()      # an error page instead of a picture stops here
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        time.sleep(0.2)
    return Image.open(path).convert("RGB")


def source(entry, cache):
    """-> the square picture an entry stands for, at the size it comes in."""
    if "ref" in entry:
        return fetch(REF_URL % entry["ref"], os.path.join(cache, "ref", entry["ref"] + ".jpg"))
    im = fetch(CARD_URL % entry["card"], os.path.join(cache, "cards", entry["card"] + ".png"))
    if im.size != (430, 600):                      # a few pictures are 430x601
        im = im.resize((430, 600), Image.LANCZOS)
    x, y, s = entry["crop"]
    return im.crop((x, y, x + s, y + s))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ext, web = args[0], args[1]
    plain = "--plain" in sys.argv
    table = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "new_art.json"), encoding="utf-8"))
    cache = os.path.join(ext, "newart")
    out = {n: os.path.join(web, "assets", n) for n in ("art2", "mini2")}
    for d in out.values():
        os.makedirs(d, exist_ok=True)
    for k, e in enumerate(table):
        src = source(e, cache)
        big = src if plain else comfy.upscale(src, MODEL, "newart_%03d" % e["id"])
        name = "%03d.webp" % e["id"]
        big.resize((ART, ART), Image.LANCZOS).save(os.path.join(out["art2"], name), "WEBP", quality=88, method=6)
        src.resize((MINI, MINI), Image.LANCZOS).save(os.path.join(out["mini2"], name), "WEBP", quality=88, method=6)
        if k % 20 == 19 or k == len(table) - 1:
            print("  new art: %d/%d" % (k + 1, len(table)), flush=True)


if __name__ == "__main__":
    main()
