"""Upscale the game's card art and battle-screen textures 4x through a local ComfyUI
(RealESRGAN_x4plus) and write the web assets.

Usage (venv python):  upscale_assets.py <extracted_dir> <web_dir> [art] [mini] [ui]

  web/assets/art/NNN.webp    256x256  card illustration  (B/CARD/LCnnn.TIM, 64x64)
  web/assets/mini/NNN.webp   160x160  board-size card art (B/M_CARD.ARC, 40x40)
  web/assets/ui/<name>.png   battle screen pieces         (B/CBTL_SYS.ARC)

Tiles are packed into sheets with replicated-edge padding so neighbours do not bleed
into each other, upscaled in one pass per sheet, then cut apart again.
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comfy  # noqa: E402
import tim  # noqa: E402
from PIL import Image  # noqa: E402

MODEL = "RealESRGAN_x4plus.safetensors"
PAD = 8
SCALE = 4


def pad_edge(img, pad):
    """Extend an RGB image by `pad` pixels on every side, repeating the border pixels."""
    w, h = img.size
    out = Image.new("RGB", (w + 2 * pad, h + 2 * pad))
    out.paste(img, (pad, pad))
    out.paste(img.crop((0, 0, 1, h)).resize((pad, h)), (0, pad))
    out.paste(img.crop((w - 1, 0, w, h)).resize((pad, h)), (w + pad, pad))
    top = out.crop((0, pad, w + 2 * pad, pad + 1)).resize((w + 2 * pad, pad))
    bot = out.crop((0, h + pad - 1, w + 2 * pad, h + pad)).resize((w + 2 * pad, pad))
    out.paste(top, (0, 0))
    out.paste(bot, (0, h + pad))
    return out


def upscale_tiles(tiles, per_row, tag):
    """tiles: list of equally sized RGB images. Returns the list upscaled 4x."""
    w, h = tiles[0].size
    cw, ch = w + 2 * PAD, h + 2 * PAD
    out = []
    per_sheet = per_row * per_row
    for s in range(0, len(tiles), per_sheet):
        chunk = tiles[s:s + per_sheet]
        rows = (len(chunk) + per_row - 1) // per_row
        sheet = Image.new("RGB", (cw * per_row, ch * rows))
        for i, t in enumerate(chunk):
            sheet.paste(pad_edge(t, PAD), ((i % per_row) * cw, (i // per_row) * ch))
        big = comfy.upscale(sheet, MODEL, "%s_%02d" % (tag, s // per_sheet))
        assert big.size == (sheet.width * SCALE, sheet.height * SCALE), big.size
        for i in range(len(chunk)):
            x = ((i % per_row) * cw + PAD) * SCALE
            y = ((i // per_row) * ch + PAD) * SCALE
            out.append(big.crop((x, y, x + w * SCALE, y + h * SCALE)))
        print("  %s: %d/%d" % (tag, min(s + per_sheet, len(tiles)), len(tiles)), flush=True)
    return out


def arc_members(d):
    first = struct.unpack_from("<I", d, 0)[0]
    offs = [o for o in struct.unpack_from("<%dI" % (first // 4), d, 0) if o < len(d)]  # last entry = end
    return [d[o:(offs[i + 1] if i + 1 < len(offs) else len(d))] for i, o in enumerate(offs)]


def do_art(ext, web):
    src = os.path.join(ext, "drv", "B", "CARD")
    tiles = [tim.decode(open(os.path.join(src, "LC%03d.TIM" % i), "rb").read())[0].convert("RGB") for i in range(301)]
    out = os.path.join(web, "assets", "art")
    os.makedirs(out, exist_ok=True)
    for i, im in enumerate(upscale_tiles(tiles, 8, "art")):
        im.save(os.path.join(out, "%03d.webp" % i), "WEBP", quality=88, method=6)


def do_mini(ext, web):
    mem = arc_members(open(os.path.join(ext, "drv", "B", "M_CARD.ARC"), "rb").read())
    tiles = [tim.decode(m)[0].convert("RGB") for m in mem]
    assert len(tiles) == 301, len(tiles)
    out = os.path.join(web, "assets", "mini")
    os.makedirs(out, exist_ok=True)
    for i, im in enumerate(upscale_tiles(tiles, 10, "mini")):
        im.save(os.path.join(out, "%03d.webp" % i), "WEBP", quality=88, method=6)


# CBTL_SYS member index -> (name, clut)
UI = {
    0: ("bg", 0), 3: ("tray_blue", 0), 4: ("tray_orange", 0), 5: ("panel_blue", 0), 6: ("panel_orange", 0),
    7: ("info", 0), 9: ("card_back", 0), 1: ("support_blue", 0), 2: ("support_orange", 0),
    22: ("first_tag", 0), 24: ("pipe_orange", 0), 25: ("pipe_blue", 0),
    13: ("atk_panel", 0),  # attack / special-effect panel shown while choosing an attack
}


def do_ui(ext, web):
    mem = arc_members(open(os.path.join(ext, "drv", "B", "CBTL_SYS.ARC"), "rb").read())
    out = os.path.join(web, "assets", "ui")
    os.makedirs(out, exist_ok=True)
    for idx, (name, clut) in sorted(UI.items()):
        rgba, _ = tim.decode(mem[idx], 0, clut, transparent_black=True)
        alpha = rgba.split()[3]
        # give transparent pixels a neutral colour so they do not darken the edges
        flat = Image.new("RGB", rgba.size, (96, 96, 96))
        flat.paste(rgba.convert("RGB"), (0, 0), alpha)
        big = comfy.upscale(pad_edge(flat, PAD), MODEL, "ui_" + name)
        big = big.crop((PAD * SCALE, PAD * SCALE, big.width - PAD * SCALE, big.height - PAD * SCALE))
        res = big.convert("RGBA")
        if alpha.getextrema()[0] < 255:
            a = alpha.resize(big.size, Image.BICUBIC).point(lambda v: 255 if v >= 128 else 0)
            res.putalpha(a)
        res.save(os.path.join(out, name + ".png"), optimize=True)
        print("  ui: %s %s" % (name, res.size), flush=True)


def main():
    ext, web = sys.argv[1], sys.argv[2]
    what = sys.argv[3:] or ["art", "mini", "ui"]
    if "ui" in what:
        do_ui(ext, web)
    if "mini" in what:
        do_mini(ext, web)
    if "art" in what:
        do_art(ext, web)


if __name__ == "__main__":
    main()
