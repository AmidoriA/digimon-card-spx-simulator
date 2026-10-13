"""Make the app icons of the installable site from the game's card back.

Usage:  python tools/build_icons.py        (from the repository; needs Pillow)

Reads web/assets/ui/card_back.png (the game's card back, texture 9 of B/CBTL_SYS.ARC, already
enlarged 4x) and writes web/icons/:

  icon-192.png, icon-512.png   the card back, upright, on the page's dark colour
  icon-maskable-512.png        the same, smaller, inside the central 80% that a launcher may
                               crop to a circle or a rounded square
  apple-touch-icon.png         180x180, for iOS home screens (they ignore the manifest icons)

The card is placed by this project, not by the game: see "Not from the game code" in README.md.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = (10, 16, 24, 255)    # --bg of web/css/style.css; the manifest's background_color is the same


def icon(size, card_h):
    src = Image.open(os.path.join(ROOT, "web", "assets", "ui", "card_back.png")).convert("RGBA")
    card_w = round(src.width * card_h / src.height)
    card = src.resize((card_w, card_h), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), BG)
    out.alpha_composite(card, ((size - card_w) // 2, (size - card_h) // 2))
    return out


def main():
    d = os.path.join(ROOT, "web", "icons")
    os.makedirs(d, exist_ok=True)
    icon(192, 150).save(os.path.join(d, "icon-192.png"), optimize=True)
    icon(512, 400).save(os.path.join(d, "icon-512.png"), optimize=True)
    icon(512, 300).save(os.path.join(d, "icon-maskable-512.png"), optimize=True)
    icon(180, 140).convert("RGB").save(os.path.join(d, "apple-touch-icon.png"), optimize=True)


if __name__ == "__main__":
    main()
