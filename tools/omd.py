"""Digimon 3D models and motions of the Polygon Battle (F:\\NNN.PAK, G:\\NNN.PAK).

PAK chunk types (pak.py): 0 = model, 1 = motion (LZH-packed), 2 = battle script (MSCD),
5 = texture (TIM).

Model chunk (set up by 0x8002386c):
  +0x10 u16 part count, +0x14 32 bytes parent part of each part (0xff = none),
  +0x34 one 12-byte record per part {i32 parent, s16 x, y, z offset from the parent},
  then one "OMD0" block per part: {"OMD0", u32 mapped, u32 objects}, 24-byte objects with the
  mesh offset at +0x14.
Mesh (drawn by 0x800202d8 / 0x8001f3c0 / 0x8001f94c): u32 groups; each group is
  u32 nverts, nverts x {s16 x, y, z, pad}
  u32 ncolours; each entry a u32: low byte 0 -> one flat colour (r, g, b in the other bytes),
      else low byte = n, r g b = base colour, followed by n normals {s16 x, y, z, pad} that
      are lit into n colours
  primitive blocks until a zero word. Block header: low byte = GPU code (0x08 quad,
      0x04 textured, 0x10 gouraud), bits 20.. = fan entries, bits 8..19 = strip entries.
      Entry: u16 runs, u16 length; each run is one full primitive (3 or 4 vertex words, then as
      many texture words if textured) and length-1 continuations (1 vertex + 1 texture word for
      triangles, 2 + 2 for quads). Vertex word: u16 colour offset, u16 vertex offset into the
      work buffer (vertices 8 bytes each, colours 4 bytes each after them). Texture word:
      u8 u, v, then CLUT id / texture page / 0 as in a GPU packet.

Motion chunk (0x80023148, 0x80022100): u32 keys; each key 772 bytes: s16 duration,
  s16 sound + 1, then 32 records of 24 bytes {s16 rot x, y, z, s16 show, s16 move x, y, z,
  s16 ?, s16 scale x, y, z, s16 next}. Record i drives part i; record `parts` is the whole
  model. The model eases from its current pose to the key over 2 x duration frames.
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pak  # noqa: E402


def parse_mesh(d, pos):
    """-> (groups, end). group = {verts, colours: [(r,g,b, normal|None)], tris: [[(vi, ci, u, v, clut, tpage)]*3]}"""
    ng = struct.unpack_from("<I", d, pos)[0]
    pos += 4
    groups = []
    for _ in range(ng):
        nv = struct.unpack_from("<I", d, pos)[0]
        verts = [struct.unpack_from("<3h", d, pos + 4 + i * 8) for i in range(nv)]
        pos += 4 + nv * 8
        ns = struct.unpack_from("<I", d, pos)[0]
        pos += 4
        colours = []
        for _ in range(ns):
            w = struct.unpack_from("<I", d, pos)[0]
            pos += 4
            rgb = ((w >> 8) & 255, (w >> 16) & 255, (w >> 24) & 255)
            n = w & 255
            if n == 0:
                colours.append(rgb + (None,))
            for i in range(n):
                colours.append(rgb + (struct.unpack_from("<3h", d, pos + i * 8),))
            pos += n * 8
        tris = []

        def vword(p):
            c, v = struct.unpack_from("<HH", d, p)
            ci, vi = (c - nv * 8) // 4, v // 8
            if not (0 <= vi < nv and 0 <= ci < len(colours) and v % 8 == 0 and (c - nv * 8) % 4 == 0):
                raise ValueError("bad vertex word at %#x" % p)
            return vi, ci

        while True:
            hdr = struct.unpack_from("<I", d, pos)[0]
            pos += 4
            if hdr == 0:
                break
            code = hdr & 255
            quad, tex = bool(code & 8), bool(code & 4)
            n0 = 4 if quad else 3
            n1 = 2 if quad else 1
            for fan, entries in ((True, hdr >> 20), (False, (hdr >> 8) & 0xFFF)):
                for _ in range(entries):
                    runs, length = struct.unpack_from("<HH", d, pos)
                    pos += 4
                    for _ in range(runs):
                        vs = [vword(pos + 4 * i) for i in range(n0)]
                        pos += 4 * n0
                        uv = [struct.unpack_from("<BBH", d, pos + 4 * i) for i in range(n0)] if tex else [(0, 0, 0)] * n0
                        pos += 4 * n0 if tex else 0
                        clut, tpage = (uv[0][2], uv[1][2]) if tex else (None, None)
                        seq = [(vs[i][0], vs[i][1], uv[i][0], uv[i][1]) for i in range(n0)]
                        for _ in range(length - 1):
                            ev = [vword(pos + 4 * i) for i in range(n1)]
                            pos += 4 * n1
                            eu = [struct.unpack_from("<BBH", d, pos + 4 * i) for i in range(n1)] if tex else [(0, 0, 0)] * n1
                            pos += 4 * n1 if tex else 0
                            seq += [(ev[i][0], ev[i][1], eu[i][0], eu[i][1]) for i in range(n1)]
                        if quad:      # every pair of vertices adds a quad: (a, b, c, d) -> abc, bdc
                            order = [(i, i + 1, i + 2) if k == 0 else (i + 1, i + 3, i + 2) for i in range(0, len(seq) - 2, 2) for k in (0, 1)]
                        elif fan:     # pivot seq[0], rim seq[2], seq[1], seq[3], seq[4], ...
                            rim = [2, 1] + list(range(3, len(seq)))
                            order = [(0, rim[i], rim[i + 1]) for i in range(len(rim) - 1)]
                        else:         # strip
                            order = [(i, i + 1, i + 2) if i % 2 == 0 else (i + 1, i, i + 2) for i in range(len(seq) - 2)]
                        for o in order:
                            tris.append({"v": [seq[i] for i in o], "clut": clut, "tpage": tpage, "gouraud": bool(code & 0x10), "code": code})
        groups.append({"verts": verts, "colours": colours, "tris": tris})
    return groups, pos


def parse_model(c):
    n = struct.unpack_from("<H", c, 0x10)[0]
    parents = [p if p != 255 else -1 for p in c[0x14:0x14 + n]]
    offsets = [struct.unpack_from("<3h", c, 0x34 + i * 12 + 4) for i in range(n)]
    pos = 0x34 + n * 12
    parts = []
    for i in range(n):
        b = c.find(b"OMD0", pos)
        if b < 0:
            raise ValueError("part %d: no OMD0 block" % i)
        nobj = struct.unpack_from("<I", c, b + 8)[0]
        groups = []
        end = b + 12 + 24 * nobj
        for k in range(nobj):
            flag, off = struct.unpack_from("<I", c, b + 12 + 24 * k)[0], struct.unpack_from("<I", c, b + 12 + 24 * k + 0x14)[0]
            if flag:
                raise ValueError("part %d: object kind %d not handled" % (i, flag))
            g, end = parse_mesh(c, b + off)
            groups += g
        parts.append(groups)
        pos = end
    return {"n": n, "parents": parents, "offsets": offsets, "parts": parts}


def parse_motion(m, nparts):
    nk = struct.unpack_from("<I", m, 0)[0]
    if len(m) != 4 + nk * 772:
        raise ValueError("motion size %d for %d keys" % (len(m), nk))
    keys = []
    for k in range(nk):
        b = 4 + k * 772
        dur, snd = struct.unpack_from("<hh", m, b)
        recs = []
        for i in range(nparts + 1):
            r = struct.unpack_from("<12h", m, b + 4 + i * 24)
            recs.append({"rot": r[0:3], "show": r[3], "move": r[4:7], "scale": r[8:11], "next": r[11]})
        keys.append({"dur": dur, "snd": snd, "recs": recs})
    return keys


def load(path):
    """-> (model, motions {id: keys}, tims {id: bytes}, scripts {id: bytes})"""
    model, motions, tims, scripts = None, {}, {}, {}
    for typ, cid, b in pak.chunks(open(path, "rb").read()):
        if typ == 0 and model is None:
            model = parse_model(b)
        elif typ == 1:
            motions[cid] = b
        elif typ == 5:
            tims[cid] = b
        elif typ == 2:
            scripts[cid] = b
    if model:
        motions = {k: parse_motion(pak.unpack(v), model["n"]) for k, v in motions.items()}
    return model, motions, tims, scripts


if __name__ == "__main__":
    import collections
    import glob
    ok, bad, codes = 0, [], collections.Counter()
    for f in sorted(glob.glob(os.path.join(sys.argv[1], "drv", "[FG]", "[0-9]*.PAK"))):
        try:
            model, motions, tims, scripts = load(f)
            for p in model["parts"]:
                for g in p:
                    for t in g["tris"]:
                        codes[t["code"]] += 1
            ok += 1
        except Exception as e:  # noqa: BLE001
            bad.append((os.path.basename(f), str(e)[:70]))
    print("parsed", ok, "failed", len(bad), bad[:12])
    print("primitive codes:", sorted(codes.items()))
