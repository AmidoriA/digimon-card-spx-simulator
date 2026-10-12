"""Look at what a custom card is made from, and try a recolour, before build_custom.py.

Usage (venv python):
  custom_look.py model <web_dir> <model number> <out.png>
        The model's texture as the model wears it: every texel in the palette of the triangle
        that uses it, 6x (a texel no triangle uses is magenta). Prints each palette row's
        colours with hue, saturation and value: what a recolour rule selects by.
  custom_look.py art <extracted_dir> <card number> <recolour name> <out.png>
        The game's two pictures of a card (64x64 and 40x40), as they are and under a recolour
        of custom_cards.json, enlarged without ComfyUI.
  custom_look.py script <extracted_dir> <card number> <recolour name>
        The colours the card's attack and hit scripts create their objects in, and what the
        recolour makes of each.
"""
import colorsys
import gzip
import os
import struct
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import custom  # noqa: E402


def hsv(c):
    h, s, v = colorsys.rgb_to_hsv(c[0] / 255.0, c[1] / 255.0, c[2] / 255.0)
    return "%3d,%3d,%3d  hue %3d sat %.2f val %.2f" % (c[0], c[1], c[2], round(h * 360), s, v)


def model(web, num, out):
    base = os.path.join(web, "assets", "models", "%03d" % int(num))
    tex, pal = Image.open(base + ".png"), Image.open(base + "p.png").convert("RGBA")
    d = gzip.decompress(open(base + ".bin.gz", "rb").read())
    w = struct.unpack("<%dh" % (len(d) // 2), d)
    parts, nv, nt = w[2], w[4] & 0xFFFF, (w[5] & 0xFFFF) + (w[6] & 0xFFFF)
    o = 10 + parts * 4
    verts = [w[o + i * 13:o + i * 13 + 13] for i in range(nv)]
    rows = Image.new("L", tex.size, 255)                 # which palette row each texel is drawn in
    draw, plain = ImageDraw.Draw(rows), set()
    for i in range(nt):
        a, b, c = [x & 0xFFFF for x in w[o + nv * 13 + i * 3:o + nv * 13 + i * 3 + 3]]
        if verts[a][9] < 0:
            plain.add(tuple(x & 0xFFFF for x in verts[a][6:9]))
            continue
        draw.polygon([(verts[k][9], verts[k][10]) for k in (a, b, c)], fill=verts[a][12], outline=verts[a][12])
    sheet = Image.new("RGBA", tex.size, (255, 0, 255, 255))
    tp, rp, used = tex.load(), rows.load(), {}
    for y in range(tex.height):
        for x in range(tex.width):
            if rp[x, y] != 255:
                c = pal.getpixel((tp[x, y], rp[x, y]))
                sheet.putpixel((x, y), c)
                used.setdefault(rp[x, y], set()).add(c[:3])
    sheet.resize((tex.width * 6, tex.height * 6), Image.NEAREST).save(out)
    for r in sorted(used):
        print("palette row %d" % r)
        for c in sorted(used[r], key=lambda c: colorsys.rgb_to_hsv(*c)):
            print("   ", hsv(c))
    if plain:
        print("untextured triangles' colours")
        for c in sorted(plain):
            print("   ", hsv(c))
    print("written", out)


def art(ext, card, name, out):
    import tim
    import upscale_assets as ua
    f = custom.recolour(custom.load()["recolours"][name])
    big = tim.decode(open(os.path.join(ext, "drv", "B", "CARD", "LC%03d.TIM" % int(card)), "rb").read())[0].convert("RGB")
    small = tim.decode(ua.arc_members(open(os.path.join(ext, "drv", "B", "M_CARD.ARC"), "rb").read())[int(card)])[0].convert("RGB")
    sheet = Image.new("RGB", (384 * 4, 384))
    for k, im in enumerate((big, custom.recolour_image(big, f), small, custom.recolour_image(small, f))):
        sheet.paste(im.resize((384, 384), Image.NEAREST), (384 * k, 0))
    sheet.save(out)
    print("written", out)


def script(ext, card, name):
    import build_battle
    import build_data
    f = custom.recolour(custom.load()["recolours"][name])
    cards = build_data.build_cards(open(os.path.join(ext, "drv", "B", "CARD2.CDD"), "rb").read())
    scripts = build_battle.all_scripts(ext)
    kinds = {0: "screen rectangle", 3: "light change", 13: "ring", 17: "particles"}
    for a in cards[int(card)]["atk"]:
        for sid in (a["script"], a["hit"]):
            seen = []
            for typ, cols in custom.created(scripts[sid]):
                for vals, full in cols:
                    rgb = custom._bytes(vals, full)[0]
                    if (typ, rgb) not in seen:
                        seen.append((typ, rgb))
            print("%s, script %d" % (a["name"], sid))
            for typ, rgb in seen:
                print("    %-16s %s  ->  %3d,%3d,%3d" % ((kinds[typ], hsv(rgb)) + f(*rgb)))


if __name__ == "__main__":
    {"model": model, "art": art, "script": script}[sys.argv[1]](*sys.argv[2:])
