"""Export the Polygon Battle scripts and attack effect assets for the web game.

Usage (venv python):  build_battle.py <extracted_dir> <web_dir> [pak numbers...]

  web/assets/battle/scripts.json.gz   every battle script by id (attack and hit scripts from
                                      the Digimon files F/NNN.PAK, 998/999 from A/BATTLE.PAK);
                                      commands as bscript.py parses them
  web/assets/battle/fx/NNN.bin.gz     one file per E/NNN.PAK: its sprites, textures and
                                      effect models. u32 length, a JSON index of that length,
                                      then the data the index points into:
     sprites  id -> {tim, loop, frames: [[frames, u0, u1, v0, v1, w, h, blend, bright, clut,
                     ox, oy], ...]}        (sprite chunk, type 3, see battle3d.js)
     tims     id -> {w, h, off, rows, pal} one byte per pixel at off, rows x 256 RGBA at pal
     models   id -> {off, len, tw, th, tex, rows, pal}   a model as in build_models.py

  web/assets/battle/arenas.json       the arena table of the EXE (0x8006e0c0, 8 bytes each:
                                      file number - 900, palettes, palette period, flags,
                                      back colour r g b, brightness) for the 24 free-battle
                                      arenas, entries 32..55
  web/assets/models/bgNNN.*           those arenas (F/BGNNN.PAK) as models, like the Digimon

A card's attack k names its attack script and hit script in its CARD2.CDD record
(build_data.py: `script`, `hit`).
"""
import glob
import gzip
import json
import os
import re
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bscript  # noqa: E402
import build_models as bm  # noqa: E402
import omd  # noqa: E402
import pak  # noqa: E402


def all_scripts(ext):
    out = {}
    files = sorted(glob.glob(os.path.join(ext, "drv", "F", "[0-9][0-9][0-9].PAK"))) + [os.path.join(ext, "drv", "A", "BATTLE.PAK")]
    for f in files:
        for typ, cid, b in pak.chunks(open(f, "rb").read()):
            if typ == 2 and b[:4] == b"MSCD" and cid not in out:
                out[cid] = bscript.parse(b)[1]
    return out


def sound_ids(ext):
    """Sound effects the battle scripts play (b.3 and c.3 with constant arguments)."""
    ids = set()
    for cmds in all_scripts(ext).values():
        for c in cmds:
            if c[0] == 0x0B and c[1] == 3 and not c[2]:
                ids.add(c[3])
            elif c[0] == 0x0C and c[1] == 3 and not c[4]:
                ids.add(c[5])
    return sorted(i for i in ids if 0 < i < 0x100)


def parse_sprite(b):
    n, loop = struct.unpack_from("<Ib", b, 0x14)
    frames = []
    for i in range(n):
        o = 0x24 + i * 20
        if o + 20 > len(b):
            break
        dur, u0, u1, v0, v1, w, h, blend, bright, clut, _, _, ox, oy = struct.unpack_from("<I4B2hh2B2B2b", b, o)
        frames.append([dur, u0, u1, v0, v1, w, h, blend, bright, clut, ox, oy])
    return {"loop": loop, "frames": frames}


def export_fx(path):
    chunks = pak.chunks(open(path, "rb").read())
    tims, raw_tims = {}, {}
    for typ, cid, b in chunks:
        if typ == 5 and cid not in tims:
            try:
                tims[cid] = bm.read_tim(b)
            except Exception:  # noqa: BLE001
                pass
    index, blob = {"sprites": {}, "tims": {}, "models": {}}, bytearray()

    def put(data):
        off = len(blob)
        blob.extend(data)
        blob.extend(b"\0" * (-len(blob) % 4))
        return off

    for typ, cid, b in chunks:
        if typ == 3 and str(cid) not in index["sprites"]:
            s = parse_sprite(b)
            s["tim"] = cid if cid in tims else (next(iter(tims)) if tims else -1)
            index["sprites"][str(cid)] = s
    for cid in sorted({s["tim"] for s in index["sprites"].values()} - {-1}):
        t = tims[cid]
        pal = bytearray()
        for row in t.get("clut", [[0x7FFF] * 16]):
            for c in ([bm.rgba(x) for x in row] + [(0, 0, 0, 0)] * 256)[:256]:
                pal += bytes(c)
        index["tims"][str(cid)] = {"w": t["w"], "h": t["h"], "off": put(bytes(i for row in t["pix"] for i in row)),
                                   "rows": len(t.get("clut", [0])), "pal": put(pal)}
    bad = 0
    motions = {cid: b for typ, cid, b in chunks if typ == 1}
    for typ, cid, b in chunks:
        if typ != 0 or str(cid) in index["models"]:
            continue
        try:
            model = omd.parse_model(b)
            mots, k = [], cid
            while k in motions:
                mots.append(omd.parse_motion(pak.unpack(motions[k]), model["n"]))
                k += 1
            data, tex, pal, _ = bm.convert(model, mots, list(tims.values()))
        except Exception:  # noqa: BLE001
            bad += 1
            continue
        index["models"][str(cid)] = {"off": put(data), "len": len(data), "tw": tex[0], "th": tex[1], "tex": put(tex[2]),
                                     "rows": pal[0], "pal": put(pal[1])}
    head = json.dumps(index, separators=(",", ":")).encode()
    head += b" " * (-len(head) % 4)
    return gzip.compress(struct.pack("<I", len(head)) + head + bytes(blob), 9, mtime=0), index, bad


def export_arenas(ext, web):
    """The arenas the game picks from when none is named (0x8002e42c: rand % 12 + 44) and the
    rest of the free-battle block. An arena is a one-part model drawn around the camera."""
    exe = open(os.path.join(ext, "disc", "SLUS_013.28"), "rb").read()
    base = struct.unpack_from("<I", exe, 0x18)[0]
    off = 0x8006E0C0 - base + 0x800
    out, mdir = [], os.path.join(web, "assets", "models")
    for i in range(32, 56):
        num, pals, period, flags, r, g, b, bright = struct.unpack_from("<bBBbBBBB", exe, off + i * 8)
        f = os.path.join(ext, "drv", "F", "BG%d.PAK" % (900 + num))
        model, tims = None, []
        for typ, cid, data in pak.chunks(open(f, "rb").read()):
            if typ == 0 and model is None:
                model = omd.parse_model(data)
            elif typ == 5:
                tims.append(bm.read_tim(pak.unpack(data)))
        data, tex, pal, _ = bm.convert(model, [], tims)
        bm.Image.frombytes("L", (tex[0], tex[1]), tex[2]).save(os.path.join(mdir, "bg%d.png" % (900 + num)), optimize=True)
        bm.Image.frombytes("RGBA", (256, pal[0]), pal[1]).save(os.path.join(mdir, "bg%dp.png" % (900 + num)), optimize=True)
        open(os.path.join(mdir, "bg%d.bin.gz" % (900 + num)), "wb").write(gzip.compress(data, 9, mtime=0))
        out.append({"index": i, "file": 900 + num, "back": [r, g, b], "bright": bright})
    json.dump(out, open(os.path.join(web, "assets", "battle", "arenas.json"), "w"), separators=(",", ":"))
    return len(out)


def main():
    ext, web = sys.argv[1], sys.argv[2]
    only = {int(a) for a in sys.argv[3:]}
    out = os.path.join(web, "assets", "battle")
    os.makedirs(os.path.join(out, "fx"), exist_ok=True)
    if not only:
        scripts = all_scripts(ext)
        data = gzip.compress(json.dumps({str(k): v for k, v in sorted(scripts.items())}, separators=(",", ":")).encode(), 9, mtime=0)
        open(os.path.join(out, "scripts.json.gz"), "wb").write(data)
        print("scripts:", len(scripts), "- %.2f MB" % (len(data) / 1e6))
        print("arenas:", export_arenas(ext, web))
    total = n = bad = nm = ns = 0
    for f in sorted(glob.glob(os.path.join(ext, "drv", "E", "*.PAK"))):
        m = re.match(r"^(\d+)\.PAK$", os.path.basename(f))
        if not m or (only and int(m.group(1)) not in only):
            continue
        packed, index, b = export_fx(f)
        open(os.path.join(out, "fx", "%d.bin.gz" % int(m.group(1))), "wb").write(packed)
        total += len(packed); n += 1; bad += b
        nm += len(index["models"]); ns += len(index["sprites"])
        if only:
            print("  %s: %d sprites, %d textures, %d models (%d not parsed), %d bytes" % (
                m.group(1), len(index["sprites"]), len(index["tims"]), len(index["models"]), b, len(packed)))
    print("fx files:", n, "- %.1f MB;" % (total / 1e6), ns, "sprites,", nm, "models,", bad, "models not parsed")


if __name__ == "__main__":
    main()
