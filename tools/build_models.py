"""Export the Polygon Battle Digimon models, textures and motions for the web game.

Usage (venv python):  build_models.py <extracted_dir> <web_dir> [model numbers...]

For every F:\\NNN.PAK writes web/assets/models/NNN.bin.gz, NNN.png (the textures as colour
indices, stacked) and NNNp.png (one 256-colour row per palette used). The card's model number is byte 0xE5 of its CARD2.CDD
record (build_data.py puts it in cards.js as `model`).

NNN.bin.gz (gzip), little-endian 16-bit words:
  header  'DM', version, parts, motions, vertices, opaque triangles, blended triangles,
          texture width, texture height, palette rows
  parts x (parent, x, y, z)
  vertices x (x, y, z, nx, ny, nz, r, g, b, u, v, part, palette row)
          normal 0 = colour used as is; u < 0 = untextured
  triangles x (a, b, c), opaque ones first; blended x (blend mode 0..3)
  motions x (keys, then keys x (duration, sound, (parts + 1) x
          (rot x, y, z, show, move x, y, z, scale x, y, z, next)))
"""
import glob
import gzip
import os
import struct
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import omd  # noqa: E402


def read_tim(b):
    """-> dict(bpp, cx, cy, cw, ch, clut (list of rows of RGBA), x, y, w (pixels), h, pix (rows of indices))"""
    flags = struct.unpack_from("<I", b, 4)[0]
    mode, pos, t = flags & 7, 8, {}
    if flags & 8:
        n, cx, cy, cw, ch = struct.unpack_from("<I4H", b, pos)
        raw = struct.unpack_from("<%dH" % (cw * ch), b, pos + 12)
        t.update(cx=cx, cy=cy, cw=cw, ch=ch, clut=[raw[r * cw:(r + 1) * cw] for r in range(ch)])
        pos += n
    n, x, y, w, h = struct.unpack_from("<I4H", b, pos)
    data = b[pos + 12:pos + n]
    if mode == 0:
        pix = [[(data[(r * w * 2) + i // 2] >> (4 * (i & 1))) & 15 for i in range(w * 4)] for r in range(h)]
        wp = w * 4
    elif mode == 1:
        pix = [list(data[r * w * 2:(r + 1) * w * 2]) for r in range(h)]
        wp = w * 2
    else:
        raise ValueError("TIM mode %d" % mode)
    t.update(mode=mode, x=x, y=y, w=wp, w16=w, h=h, pix=pix)
    return t


def rgba(c):
    if c == 0:
        return (0, 0, 0, 0)
    return ((c & 31) * 255 // 31, ((c >> 5) & 31) * 255 // 31, ((c >> 10) & 31) * 255 // 31, 255)


def export(path, out_dir, num):
    model, motions, tims, _ = omd.load(path)
    tims = [read_tim(b) for b in tims.values()]
    tiles, order, pals = {}, [], []      # texture -> y in the stacked image; palette rows

    def tile(clut, tpage):
        px, py = (tpage & 15) * 64, ((tpage >> 4) & 1) * 256
        cx, cy = (clut & 63) * 16, clut >> 6
        for ti, t in enumerate(tims):
            if "clut" in t and t["cy"] <= cy < t["cy"] + t["ch"] and t["cx"] <= cx < t["cx"] + t["cw"] and t["x"] - 256 < px <= t["x"] + t["w16"]:
                if ti not in tiles:
                    tiles[ti] = sum(tims[k]["h"] for k in order)
                    order.append(ti)
                key = (ti, cy - t["cy"], cx - t["cx"])
                if key not in pals:
                    pals.append(key)
                scale = 4 if t["mode"] == 0 else 2
                return tiles[ti], (px - t["x"]) * scale, py - t["y"], pals.index(key)
        # the palette is not in this file (5 models): fall back to the texture's first palette
        for ti, t in enumerate(tims):
            if "clut" in t and t["x"] - 256 < px <= t["x"] + t["w16"]:
                if ti not in tiles:
                    tiles[ti] = sum(tims[k]["h"] for k in order)
                    order.append(ti)
                key = (ti, 0, 0)
                if key not in pals:
                    pals.append(key)
                return tiles[ti], (px - t["x"]) * (4 if t["mode"] == 0 else 2), py - t["y"], pals.index(key)
        raise ValueError("no texture for clut %#x tpage %#x" % (clut, tpage))

    verts, index, opaque, blended = [], {}, [], []
    for pi, groups in enumerate(model["parts"]):
        for gi, g in enumerate(groups):
            for tri in g["tris"]:
                pal = 0
                if tri["clut"] is not None:
                    ty, du, dv, pal = tile(tri["clut"], tri["tpage"])
                ids = []
                for k, (vi, ci, u, v) in enumerate(tri["v"]):
                    if not tri["gouraud"]:
                        ci = tri["v"][0][1]
                    r, g_, b, nrm = g["colours"][ci]
                    if tri["clut"] is None:
                        uu, vv = -1, -1
                    else:
                        uu, vv = u + du, v + dv + ty
                    key = (pi, gi, vi, ci, uu, vv, pal)
                    if key not in index:
                        index[key] = len(verts)
                        x, y, z = g["verts"][vi]
                        verts.append((x, y, z) + (nrm or (0, 0, 0)) + (r, g_, b, uu, vv, pi, pal))
                    ids.append(index[key])
                if tri["code"] & 2:
                    blended.append((ids, ((tri["tpage"] or 0) >> 5) & 3))
                else:
                    opaque.append(ids)
    if len(verts) > 65535:
        raise ValueError("too many vertices")
    width = max([tims[k]["w"] for k in order] or [1])
    height = sum(tims[k]["h"] for k in order) or 1
    img = Image.new("L", (width, height))
    for ti in order:
        t = tims[ti]
        tile_img = Image.new("L", (t["w"], t["h"]))
        tile_img.putdata([i for row in t["pix"] for i in row])
        img.paste(tile_img, (0, tiles[ti]))
    img.save(os.path.join(out_dir, "%03d.png" % num), optimize=True)
    pimg = Image.new("RGBA", (256, max(len(pals), 1)))
    pimg.putdata([c for ti, row, col in pals for c in ([rgba(x) for x in tims[ti]["clut"][row][col:]] + [(0, 0, 0, 0)] * 256)[:256]] or [(0, 0, 0, 0)] * 256)
    pimg.save(os.path.join(out_dir, "%03dp.png" % num), optimize=True)

    mids = sorted(motions)
    w = [0x4D44, 1, model["n"], len(mids), len(verts), len(opaque), len(blended), width, height, len(pals)]
    for i in range(model["n"]):
        w += [model["parents"][i]] + list(model["offsets"][i])
    for v in verts:
        w += list(v)
    for t in opaque:
        w += t
    for t, _ in blended:
        w += t
    w += [m for _, m in blended]
    for mid in mids:
        keys = motions[mid]
        w.append(len(keys))
        for k in keys:
            w += [k["dur"], k["snd"]]
            for r in k["recs"]:
                w += list(r["rot"]) + [r["show"]] + list(r["move"]) + list(r["scale"]) + [r["next"]]
    data = struct.pack("<%dH" % len(w), *[x & 0xFFFF for x in w])
    packed = gzip.compress(data, 9, mtime=0)
    open(os.path.join(out_dir, "%03d.bin.gz" % num), "wb").write(packed)
    return len(verts), len(opaque) + len(blended), len(packed), (width, height)


def main():
    ext, web = sys.argv[1], sys.argv[2]
    only = {int(a) for a in sys.argv[3:]}
    out = os.path.join(web, "assets", "models")
    os.makedirs(out, exist_ok=True)
    total, bad = 0, []
    for f in sorted(glob.glob(os.path.join(ext, "drv", "F", "[0-9][0-9][0-9].PAK"))):
        num = int(os.path.basename(f)[:3])
        if only and num not in only:
            continue
        try:
            nv, nt, size, wh = export(f, out, num)
            total += size
            if only:
                print("  %03d: %d vertices, %d triangles, %d bytes, atlas %dx%d" % (num, nv, nt, size, wh[0], wh[1]))
        except Exception as e:  # noqa: BLE001
            bad.append((num, str(e)[:80]))
    print("models written to", out, "- %.1f MB of .bin.gz, failed:" % (total / 1e6), bad)


if __name__ == "__main__":
    main()
