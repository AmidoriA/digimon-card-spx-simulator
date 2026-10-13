"""Make the app icons of the installable site from the card sleeve picture the owner supplied.

Usage:  python tools/build_icons.py        (from the repository; needs Pillow)

Reads tools/icon_source.jpg (a 554x554 picture of a card back, supplied by the owner) and
writes web/icons/:

  icon-192.png, icon-512.png   the middle of the card back, cropped square
  icon-maskable-512.png        a wider view, so the globe and arrows lie inside the central 80%
                               that a launcher may crop to a circle or a rounded square
  apple-touch-icon.png         180x180, for iOS home screens (they ignore the manifest icons)

The picture is not from the game: see "Not from the game code" in README.md.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# squares centred on the globe in the middle of the card back (the card spans x 106..447 and
# y 39..513 of the picture): the plain icons stop short of the lettering at the top and bottom;
# the maskable one is wider, so that what a launcher crops away is only filler and the globe
# and arrows stay inside the central 80%
CENTRE = (277, 273)
HALF, HALF_MASK = 148, 168


def icon(size, half):
    src = Image.open(os.path.join(ROOT, "tools", "icon_source.jpg")).convert("RGB")
    cx, cy = CENTRE
    return src.crop((cx - half, cy - half, cx + half, cy + half)).resize((size, size), Image.LANCZOS)


def main():
    d = os.path.join(ROOT, "web", "icons")
    os.makedirs(d, exist_ok=True)
    icon(192, HALF).save(os.path.join(d, "icon-192.png"), optimize=True)
    icon(512, HALF).save(os.path.join(d, "icon-512.png"), optimize=True)
    icon(512, HALF_MASK).save(os.path.join(d, "icon-maskable-512.png"), optimize=True)
    icon(180, HALF).save(os.path.join(d, "apple-touch-icon.png"), optimize=True)


if __name__ == "__main__":
    main()
