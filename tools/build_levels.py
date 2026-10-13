"""Cut the level letters (R, A, C, U and the partner Rookies' "RP") out of the game's own
board pictures, for the cards that are shown with new art.

Usage (venv python):  build_levels.py <extracted_dir> <web_dir>

  web/assets/ui/level_r.png, level_a.png, level_c.png, level_u.png, level_rp.png   80x64

The game has no separate picture of these letters on the board: each Digimon card's 40x40
board picture (B/M_CARD.ARC) has the letter of its level painted into its upper left corner.
The new art (build_new_art.py) replaces the whole picture, and the letter goes with it.

The letter is the one thing the pictures of a level share. For every pixel of the corner
this takes the darkest value any card of the level has there: where the letter is, every
card is white, and everywhere else some card is dark. That value is the letter's opacity;
its colour is the game's white. It is taken from the pictures as upscale_assets.py already
enlarged them (web/assets/mini, 4x through ComfyUI), so the letters are the enlarged ones
and nothing is enlarged here. The corner is 80x64 of the 160x160 picture.

Six Rookies, the partners (the id table at 0x8006e518), carry a small P after the R. They
are too few for the darkest value alone to clear the background, so for them a pixel also
has to be bright in the game's 40x40 pictures of all six.
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_data  # noqa: E402
import tim  # noqa: E402
from PIL import Image, ImageChops, ImageFilter  # noqa: E402

W, H, SCALE = 80, 64, 4
NAMES = {0: "r", 1: "a", 2: "c", 3: "u"}
PARTNERS = [175, 182, 190, 184, 183, 187]   # engine.js PARTNERS; 0x8006e518 in the EXE
LOW, HIGH = 96, 232                         # darkest values taken as clear and as solid


def darkest(ims):
    out = ims[0]
    for im in ims[1:]:
        out = ImageChops.darker(out, im)
    return out


def corner(path):
    """the corner of a picture as the lowest of its three colour parts: white stays white"""
    r, g, b = Image.open(path).convert("RGB").crop((0, 0, W, H)).split()
    return ImageChops.darker(ImageChops.darker(r, g), b)


def letter(alpha):
    alpha = alpha.point(lambda v: 0 if v <= LOW else 255 if v >= HIGH else (v - LOW) * 255 // (HIGH - LOW))
    out = Image.new("RGBA", alpha.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    return out


def main():
    ext, web = sys.argv[1], sys.argv[2]
    cards = build_data.build_cards(open(os.path.join(ext, "drv", "B", "CARD2.CDD"), "rb").read())
    mini, out = os.path.join(web, "assets", "mini"), os.path.join(web, "assets", "ui")
    by = {}
    for c in cards:
        if c["type"] == "digimon":
            by.setdefault(c["level"], []).append(c["id"])
    for lv, ids in sorted(by.items()):
        a = darkest([corner(os.path.join(mini, "%03d.webp" % i)) for i in ids])
        letter(a).save(os.path.join(out, "level_%s.png" % NAMES[lv]), optimize=True)
        print("  level %s: %d cards" % (NAMES[lv].upper(), len(ids)))

    # the partners' "RP": also bright in all six of the game's own pictures, widened a little
    d = open(os.path.join(ext, "drv", "B", "M_CARD.ARC"), "rb").read()
    first = struct.unpack_from("<I", d, 0)[0]
    offs = [o for o in struct.unpack_from("<%dI" % (first // 4), d, 0) if o < len(d)]
    small = []
    for i in PARTNERS:
        r, g, b = tim.decode(d, offs[i])[0].convert("RGB").crop((0, 0, W // SCALE, H // SCALE)).split()
        small.append(ImageChops.darker(ImageChops.darker(r, g), b))
    keep = darkest(small).point(lambda v: 255 if v >= 150 else 0).resize((W, H), Image.NEAREST).filter(ImageFilter.MaxFilter(5))
    a = ImageChops.darker(darkest([corner(os.path.join(mini, "%03d.webp" % i)) for i in PARTNERS]), keep)
    letter(a).save(os.path.join(out, "level_rp.png"), optimize=True)
    print("  level RP: %d cards" % len(PARTNERS))


if __name__ == "__main__":
    main()
