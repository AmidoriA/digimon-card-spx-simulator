"""Turn a Time Stranger model into a DDCB model file (TS-205).

Usage (run with tools/.venv python):
  python -I ts_model.py <file.geom> <web dir> <base model number> <out dir> <number>
        [--part N=<bone> ...] [--images <dir>] [--preview out.png]

Writes <out dir>/NNN.bin.gz, NNN.png and NNNp.png in the format of tools/build_models.py,
within the figures of the base model web/assets/models/<base>.bin.gz: no more parts,
triangles, texture area or palette rows than it has, standing as tall as the base stands
in its standing motion and facing the way it faces. The eight motions are the bind pose
held still, each as long as the base's motion in that slot (the motions are TS-206's).

--part N=<bone> gives a bone's part the number N. The base's battle scripts hang effects
on parts by number (docs/time-stranger/motion-slots.md, the "Parts" columns), so the part
that plays that role in the new model has to carry it.

How it is made. None of this is the PlayStation game's doing: the choices are this
project's, made to fit what the disc's models are (rigid parts, 16-colour palette rows,
every triangle inside one part; measured over the 211 card models in web/assets/models).
  1. parts: a vertex goes with the bone that weighs most on it. The bone with the fewest
     vertices is merged into its parent until there are no more parts than the base has.
  2. fewer triangles: edges are collapsed onto one of their ends, cheapest first by the
     distance the surface moves (quadric error), until the base's triangle count. An edge
     is left alone where its collapse would tear the texture mapping at a seam or turn a
     triangle over. The eyes' triangles weigh more, so that they are not the first to go.
  3. texture: the pieces of the texture mapping that are still used are laid out again in
     one sheet of the base's size; pieces that use the same texels share them. All are
     shrunk by one factor across and one down. The pieces are sorted into as many groups
     as the base has palette rows by their colour, and each group's used texels are
     reduced to 16 colours.
  4. size and place: the model is scaled to the height of the base in key 0 of its
     standing motion and stood on the same ground, turned to face the same way (the
     disc's models have y downward and face -z).
  The eyes' two overlay textures are laid over each other as ts_model_read.py --overlays
  does; how the game's shader mixes them was not read.
"""
import gzip
import heapq
import math
import os
import struct
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ts_model_read as T

EYE_WEIGHT = 30.0


# ---- the base: what a disc model costs, how it stands -----------------------------------

def rot_yxz(r):
    """The port's rotYXZ (web/js/battle3d.js): angles in 4096ths of a turn."""
    sx, cx, sy, cy, sz, cz = [f(a * math.pi / 2048) for a in r for f in (math.sin, math.cos)]
    return np.array([[cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx],
                     [cx * sz, cx * cz, -sx],
                     [-sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx]])


def read_dm(path):
    w = np.frombuffer(gzip.decompress(open(path, "rb").read()), "<i2").astype(np.int64)
    n, nmot, nv, nop, nbl, tw, th, npal = [int(x) & 0xFFFF for x in w[2:10]]
    p = 10
    parts = w[p:p + 4 * n].reshape(n, 4)
    p += 4 * n
    v = w[p:p + 13 * nv].reshape(nv, 13)
    p += 13 * nv + 3 * (nop + nbl) + nbl
    motions = []
    for _ in range(nmot):
        keys = []
        nk = int(w[p])
        p += 1
        for _ in range(nk):
            keys.append({"dur": int(w[p]), "snd": int(w[p + 1]), "recs": w[p + 2:p + 2 + 11 * (n + 1)].reshape(n + 1, 11).copy()})
            p += 2 + 11 * (n + 1)
        motions.append(keys)
    # the model in key 0 of its standing motion (slot 0), as Actor.resolve poses it
    recs = motions[0][0]["recs"]
    mats, at = [None] * n, [None] * n

    def place(i):
        if mats[i] is None:
            pm, pt = place(parts[i, 0]) if parts[i, 0] >= 0 else (np.eye(3), np.zeros(3))
            r = recs[i]
            mats[i] = pm @ (rot_yxz(r[0:3]) * (r[7:10] / 4096.0))
            at[i] = pm @ (parts[i, 1:4] + r[4:7]) + pt
        return mats[i], at[i]

    for i in range(n):
        place(i)
    pos = np.array([mats[k] @ v[i, 0:3] + at[k] for i, k in enumerate(v[:, 11])])
    return {"parts": n, "triangles": nop + nbl, "width": tw, "height": th, "rows": npal,
            "lo": pos.min(0), "hi": pos.max(0), "motions": motions, "pos": pos, "v": v,
            "tris": w[10 + 4 * n + 13 * nv:10 + 4 * n + 13 * nv + 3 * (nop + nbl)].reshape(-1, 3)}


# ---- the source mesh -------------------------------------------------------------------

def source(g, images):
    """Corners of every drawn triangle: position, normal, bone, texture, texture coordinates."""
    pos, nrm, bone, uv, src, tris, weight = [], [], [], [], [], [], []
    pictures = {}
    wrapped = 0
    for m in T.drawn(g, False):
        a = m["attributes"]
        mat = g["materials"][m["material"]]
        over = T.param(mat, "OverlayColorSampler2") and T.param(mat, "OverlayColorSampler") and "TEXCOORD2" in a
        if over:
            key = "overlay:" + T.param(mat, "OverlayColorSampler2") + "+" + T.param(mat, "OverlayColorSampler")
            if key not in pictures:
                lid = np.asarray(T.load_image(images, T.param(mat, "OverlayColorSampler2"))).astype(np.float64)
                eye = np.asarray(T.load_image(images, T.param(mat, "OverlayColorSampler")).resize(lid.shape[1::-1])).astype(np.float64)
                k = (eye[..., 3:] / 255.0) * (1 - lid[..., 3:] / 255.0)
                pictures[key] = (lid[..., :3] * (1 - k) + eye[..., :3] * k).astype(np.uint8)
            coords = a["TEXCOORD2"].astype(np.float64)
        else:
            key = T.param(mat, "ColorSampler")
            if key not in pictures:
                pictures[key] = np.asarray(T.load_image(images, key))[..., :3].copy()
            coords = a["TEXCOORD0"].astype(np.float64)
        palette = np.array(m["palette"])
        if "BLENDINDICES" in a:
            heavy = palette[a["BLENDINDICES"][np.arange(m["vertices"]), a["BLENDWEIGHT"].argmax(1)]]
        else:
            heavy = np.full(m["vertices"], palette[0])
        for t in m["triangles"]:
            c = coords[t]
            base = np.floor(c.min(0) + 1e-6)
            if (c - base).max() > 1 + 1e-6:
                wrapped += 1
            for k in range(3):
                pos.append(a["POSITION"][t[k], :3])
                nrm.append(a["NORMAL"][t[k]])
                bone.append(heavy[t[k]])
                uv.append(c[k] - base)
                src.append(key)
            tris.append((len(pos) - 3, len(pos) - 2, len(pos) - 1))
            weight.append(EYE_WEIGHT if over else 1.0)
    return (np.array(pos, np.float64), np.array(nrm, np.float64), np.array(bone), np.array(uv), src,
            np.array(tris), np.array(weight), pictures, wrapped)


def weld(pos, uv, src, bone, tris):
    """Corners that are the same point with the same texture coordinates become one wedge;
    wedges at the same point share a place."""
    names = {s: i for i, s in enumerate(sorted(set(src)))}
    sid = np.array([names[s] for s in src])
    key = np.concatenate([np.round(pos, 5), np.round(uv, 5), sid[:, None], bone[:, None]], 1)
    _, first, wedge = np.unique(key, axis=0, return_index=True, return_inverse=True)
    _, place = np.unique(np.round(pos[first], 5), axis=0, return_inverse=True)
    return first, wedge.reshape(-1)[tris], place.reshape(-1)


# ---- fewer triangles -------------------------------------------------------------------

def decimate(P, place, tris, weight, want, log):
    """Half-edge collapses on the places (welded points), wedges following along.
    P: position of each wedge; place: its place; tris: wedge triples. Returns the triangles left."""
    nplace = place.max() + 1
    ppos = np.zeros((nplace, 3))
    ppos[place] = P
    tri = [tuple(int(x) for x in t) for t in tris]
    alive = [True] * len(tri)
    around = [set() for _ in range(nplace)]          # place -> triangles
    for ti, t in enumerate(tri):
        for w in t:
            around[place[w]].add(ti)
    Q = np.zeros((nplace, 4, 4))
    edge_use = {}
    for ti, t in enumerate(tri):
        a, b, c = (ppos[place[w]] for w in t)
        n = np.cross(b - a, c - a)
        area = np.linalg.norm(n)
        ps = [place[w] for w in t]
        for i in range(3):
            edge_use.setdefault((min(ps[i], ps[(i + 1) % 3]), max(ps[i], ps[(i + 1) % 3])), []).append(ti)
        if area < 1e-12:
            continue
        pl = np.append(n / area, -(n / area) @ a)
        k = np.outer(pl, pl) * area / 2 * weight[ti]
        for q in ps:
            Q[q] += k
    for (a, b), users in edge_use.items():           # open edges: hold them in place
        if len(users) == 1:
            t = tri[users[0]]
            n = np.cross(ppos[place[t[1]]] - ppos[place[t[0]]], ppos[place[t[2]]] - ppos[place[t[0]]])
            d = ppos[b] - ppos[a]
            m = np.cross(d, n)
            ln = np.linalg.norm(m)
            if ln > 1e-12:
                pl = np.append(m / ln, -(m / ln) @ ppos[a])
                k = np.outer(pl, pl) * (d @ d) * 10 * weight[users[0]]
                Q[a] += k
                Q[b] += k
    version = [0] * nplace
    heap = []

    def neighbours(p):
        return {place[w] for ti in around[p] for w in tri[ti]} - {p}

    def push(a, b):
        v = np.append(ppos[b], 1.0)
        heapq.heappush(heap, (float(v @ (Q[a] + Q[b]) @ v), a, b, version[a], version[b]))

    for (a, b) in edge_use:
        push(a, b)
        push(b, a)
    left = sum(alive)
    refused = 0
    while left > want and heap:
        cost, a, b, va, vb = heapq.heappop(heap)
        if version[a] != va or version[b] != vb:
            continue
        shared = [ti for ti in around[a] if any(place[w] == b for w in tri[ti])]
        if not shared or len(neighbours(a) & neighbours(b)) > len(shared):
            refused += 1
            continue
        # every wedge at a must have a wedge at b on a common triangle: its texture mapping goes there
        to = {}
        for ti in shared:
            t = tri[ti]
            wa = [w for w in t if place[w] == a][0]
            wb = [w for w in t if place[w] == b][0]
            if to.setdefault(wa, wb) != wb:
                to = None
                break
        if to is None or any(w not in to for ti in around[a] for w in tri[ti] if place[w] == a):
            refused += 1
            continue
        flip = False
        for ti in around[a]:
            if ti in shared:
                continue
            t = tri[ti]
            before = [ppos[place[w]] for w in t]
            after = [ppos[b] if place[w] == a else ppos[place[w]] for w in t]
            n0 = np.cross(before[1] - before[0], before[2] - before[0])
            n1 = np.cross(after[1] - after[0], after[2] - after[0])
            if n0 @ n1 <= 0.2 * np.linalg.norm(n0) * np.linalg.norm(n1):
                flip = True
                break
        if flip:
            refused += 1
            continue
        for ti in shared:
            alive[ti] = False
            for w in tri[ti]:
                around[place[w]].discard(ti)
        left -= len(shared)
        for ti in list(around[a]):
            tri[ti] = tuple(to.get(w, w) for w in tri[ti])
            around[b].add(ti)
        around[a] = set()
        Q[b] += Q[a]
        version[a] += 1
        version[b] += 1
        for n in neighbours(b):
            push(b, n)
            push(n, b)
    log("triangles %d -> %d (%d collapses refused for a seam, an overturned triangle or the mesh's shape)" % (
        len(tri), left, refused))
    keep = [i for i, ok in enumerate(alive) if ok]
    return np.array([tri[i] for i in keep]), weight[keep]


# ---- parts -----------------------------------------------------------------------------

def chain(parent, p):
    out = []
    while p >= 0:
        out.append(p)
        p = parent[p]
    return out


def choose_parts(bones, bone_of, limit, fixed, log):
    """Merge the bone with the fewest vertices into its parent until `limit` parts are left.
    fixed: {part number: bone} that must stay parts with those numbers.
    Returns {bone: part number} for every bone in use and the bone of each part."""
    parent = [b["parent"] for b in bones]
    count = {}
    for b in bone_of:
        count[int(b)] = count.get(int(b), 0) + 1
    for b in fixed.values():
        count.setdefault(b, 0)
    into = {b: b for b in count}

    def tops():
        out = set()
        for p in count:
            q = parent[p]
            while q >= 0 and q not in count:
                q = parent[q]
            if q < 0:
                out.add(p)
        return out

    while True:
        roots = tops()
        if len(roots) > 1:                             # one root: the bone all of them hang under
            chains = [chain(parent, r)[::-1] for r in roots]
            common = -1
            for level in zip(*chains):
                if len(set(level)) == 1:
                    common = level[0]
            if common < 0:
                raise ValueError("the bones have no common root")
            count.setdefault(common, 0)
            into.setdefault(common, common)
            continue
        if len(count) <= limit:
            break
        root = next(iter(roots))
        free = [p for p in count if p != root and p not in fixed.values()]
        small = min(free, key=lambda p: (count[p], p))
        q = parent[small]
        while q not in count:
            q = parent[q]
        log("part %s (%d vertices) joins %s" % (bones[small]["name"], count[small], bones[q]["name"]))
        count[q] += count.pop(small)
        for k, v in into.items():
            if v == small:
                into[k] = q
    order = [None] * len(count)
    for n, b in fixed.items():
        if n >= len(order):
            raise ValueError("part number %d asked for, the model has %d parts" % (n, len(order)))
        order[n] = b
    rest = sorted((p for p in count if p not in fixed.values()), key=lambda p: (len(chain(parent, p)), p))
    for i in range(len(order)):
        if order[i] is None:
            order[i] = rest.pop(0)
    return {b: order.index(into[b]) for b in into}, order


# ---- texture ---------------------------------------------------------------------------

def islands(tris):
    """Groups of triangles joined through shared wedges: the pieces of the texture mapping."""
    owner = {}

    def find(x):
        while owner.setdefault(x, x) != x:
            owner[x] = owner[owner[x]]
            x = owner[x]
        return x

    for t in tris:
        a = find(int(t[0]))
        for w in t[1:]:
            owner[find(int(w))] = a
    out = {}
    for ti, t in enumerate(tris):
        out.setdefault(find(int(t[0])), []).append(ti)
    return list(out.values())


def pack(sizes, width, height, sx, sy):
    """Shelf packing of (w, h) boxes scaled by sx, sy, one texel apart. None if they do not fit."""
    boxes = sorted(((max(2, int(math.ceil(w * sx))), max(2, int(math.ceil(h * sy))), i) for i, (w, h) in enumerate(sizes)),
                   key=lambda b: -b[1])
    x = y = shelf = 0
    out = {}
    for w, h, i in boxes:
        if w > width:
            return None
        if x + w > width:
            x, y, shelf = 0, y + shelf + 1, 0
        if y + h > height:
            return None
        out[i] = (x, y, w, h)
        x += w + 1
        shelf = max(shelf, h)
    return out


def sixteen(pixels):
    """16 colours for these pixels: the farthest-apart ones first, then k-means."""
    px = pixels.astype(np.float64)
    uniq, counts = np.unique(pixels, axis=0, return_counts=True)
    u = uniq.astype(np.float64)
    centres = [u[counts.argmax()]]
    dist = ((u - centres[0]) ** 2).sum(1)
    while len(centres) < min(16, len(u)):
        centres.append(u[(dist * np.sqrt(counts)).argmax()])
        dist = np.minimum(dist, ((u - centres[-1]) ** 2).sum(1))
    centres = np.array(centres)
    for _ in range(12):
        near = ((u[:, None] - centres[None]) ** 2).sum(2).argmin(1)
        for c in range(len(centres)):
            if (near == c).any():
                centres[c] = (u[near == c] * counts[near == c, None]).sum(0) / counts[near == c].sum()
    out = np.zeros((16, 3))
    out[:len(centres)] = centres
    return np.round(out).astype(np.uint8)


def bake(tris, wuv, wsrc, pictures, width, height, rows, log):
    """-> texel coordinates of each wedge, palette row of each triangle, index sheet, palette rows."""
    isl = islands(tris)
    box = []
    for group in isl:
        ws = sorted({int(w) for ti in group for w in tris[ti]})
        pic = pictures[wsrc[ws[0]]]
        px = wuv[ws] * pic.shape[1::-1]
        lo, hi = np.floor(px.min(0)), np.ceil(px.max(0))
        box.append([wsrc[ws[0]], lo, np.maximum(hi, lo + 1)])
    # pieces that lie over each other in the same picture share their texels
    team = list(range(len(isl)))

    def find(i):
        while team[i] != i:
            team[i] = team[team[i]]
            i = team[i]
        return i

    for i in range(len(isl)):
        for j in range(i):
            a, b = box[i], box[j]
            if a[0] == b[0] and (a[1] < b[2]).all() and (b[1] < a[2]).all():
                team[find(i)] = find(j)
    teams = {}
    for i in range(len(isl)):
        teams.setdefault(find(i), []).append(i)
    rects = []
    for members in teams.values():
        lo = np.min([box[i][1] for i in members], 0)
        hi = np.max([box[i][2] for i in members], 0)
        rects.append({"src": box[members[0]][0], "lo": lo, "hi": hi, "tris": [ti for i in members for ti in isl[i]]})
    sizes = [(r["hi"][0] - r["lo"][0], r["hi"][1] - r["lo"][1]) for r in rects]
    best = None
    for aspect in (1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0):   # texels may be shrunk more one way than the other
        lo_s, hi_s = 0.0, 1.0
        for _ in range(30):
            mid = (lo_s + hi_s) / 2
            if pack(sizes, width, height, mid * aspect, mid):
                lo_s = mid
            else:
                hi_s = mid
        if lo_s > 0 and (best is None or lo_s * lo_s * aspect > best[0]):
            best = (lo_s * lo_s * aspect, lo_s * aspect, lo_s)
    if best is None:
        raise ValueError("the texture pieces do not fit the sheet at any size")
    where = pack(sizes, width, height, best[1], best[2])
    log("%d texture pieces in %d groups of shared texels, shrunk to %.3f across and %.3f down, in a sheet of %dx%d" % (
        len(isl), len(rects), best[1], best[2], width, height))
    sheet = np.zeros((height, width, 3), np.uint8)
    texel = np.zeros((len(wuv), 2))
    covered = np.full((height, width), -1)
    means = []
    for i, r in enumerate(rects):
        x, y, w, h = where[i]
        pic = pictures[r["src"]]
        ph, pw = pic.shape[:2]
        lo, hi = r["lo"], r["hi"]
        tile = np.tile(pic, (3, 3, 1))                 # coordinates may run past the picture's edge
        crop = tile[int(lo[1]) % ph + ph:int(lo[1]) % ph + ph + int(hi[1] - lo[1]), int(lo[0]) % pw + pw:int(lo[0]) % pw + pw + int(hi[0] - lo[0])]
        sheet[y:y + h, x:x + w] = np.asarray(Image.fromarray(crop).resize((w, h), Image.BOX))
        for wd in {int(wd) for ti in r["tris"] for wd in tris[ti]}:
            p = wuv[wd] * (pw, ph)
            texel[wd] = (x + (p[0] - lo[0]) / (hi[0] - lo[0]) * (w - 1) + 0.5, y + (p[1] - lo[1]) / (hi[1] - lo[1]) * (h - 1) + 0.5)
        # the texels the triangles of this group touch (one texel around them too)
        mask = np.zeros((height, width), bool)
        for ti in r["tris"]:
            t = texel[tris[ti]]
            x0, x1 = int(max(t[:, 0].min() - 1, x)), int(min(t[:, 0].max() + 1, x + w - 1))
            y0, y1 = int(max(t[:, 1].min() - 1, y)), int(min(t[:, 1].max() + 1, y + h - 1))
            gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
            den = (t[1, 1] - t[2, 1]) * (t[0, 0] - t[2, 0]) + (t[2, 0] - t[1, 0]) * (t[0, 1] - t[2, 1])
            if abs(den) < 1e-9:
                mask[y0:y1 + 1, x0:x1 + 1] = True
                continue
            w0 = ((t[1, 1] - t[2, 1]) * (gx - t[2, 0]) + (t[2, 0] - t[1, 0]) * (gy - t[2, 1])) / den
            w1 = ((t[2, 1] - t[0, 1]) * (gx - t[2, 0]) + (t[0, 0] - t[2, 0]) * (gy - t[2, 1])) / den
            near = 1.5 / max(math.sqrt(abs(den)), 1e-6)
            mask[y0:y1 + 1, x0:x1 + 1] |= (w0 >= -near) & (w1 >= -near) & (1 - w0 - w1 >= -near)
        covered[mask] = i
        r["area"] = int(mask.sum())
        means.append(sheet[mask].reshape(-1, 3).mean(0) if mask.any() else np.zeros(3))
        r["rect"] = (x, y, w, h)
    # palette groups: k-means on the groups' mean colours, weighted by their texels
    cols, wts = np.array(means), np.array([r["area"] for r in rects], np.float64) + 1e-6
    k = min(rows, len(rects))
    centres = cols[np.argsort(-wts)[:k]].astype(np.float64)
    for _ in range(20):
        group = ((cols[:, None] - centres[None]) ** 2).sum(2).argmin(1)
        for c in range(k):
            if (group == c).any():
                centres[c] = (cols[group == c] * wts[group == c, None]).sum(0) / wts[group == c].sum()
    group = ((cols[:, None] - centres[None]) ** 2).sum(2).argmin(1)
    tri_row = np.zeros(len(tris), np.int64)
    index = np.zeros((height, width), np.uint8)
    palette = np.zeros((k, 256, 4), np.uint8)
    for c in range(k):
        members = [i for i in range(len(rects)) if group[i] == c]
        mask = np.isin(covered, members)
        if not mask.any():
            continue
        pal = sixteen(sheet[mask].reshape(-1, 3))
        palette[c, :16, :3] = pal
        palette[c, :16, 3] = 255
        for i in members:                               # every texel of the group's boxes, used or not
            x, y, w, h = rects[i]["rect"]
            block = sheet[y:y + h, x:x + w].astype(np.float64)
            index[y:y + h, x:x + w] = ((block[:, :, None] - pal[None, None].astype(np.float64)) ** 2).sum(3).argmin(2)
            tri_row[rects[i]["tris"]] = c
        log("palette row %d: %d texels in use, %s" % (c, int(mask.sum()), " ".join("%02x%02x%02x" % tuple(x) for x in pal)))
    return texel, tri_row, index, palette


# ---- the file --------------------------------------------------------------------------

def convert(geom, images, base, fixed_names, log):
    g = T.read_geom(geom)
    names = {b["name"]: i for i, b in enumerate(g["bones"])}
    fixed = {}
    for n, name in fixed_names.items():
        if name not in names:
            raise ValueError("no bone %s; the bones are %s" % (name, " ".join(names)))
        fixed[n] = names[name]
    pos, nrm, bone, uv, src, tris, weight, pictures, wrapped = source(g, images)
    if wrapped:
        log("%d triangles run across the edge of the texture; their mapping is cut there" % wrapped)
    first, wtris, place = weld(pos, uv, src, bone, tris)
    wpos, wnrm, wuv, wbone = pos[first], nrm[first], uv[first], bone[first]
    wsrc = [src[i] for i in first]
    log("source: %d triangles, %d wedges at %d points, %d bones in use" % (len(wtris), len(first), place.max() + 1, len(set(wbone.tolist()))))
    wtris, weight = decimate(wpos, place, wtris, weight, base["triangles"], log)
    log("of them %d are the eyes'" % int((weight > 1).sum()))
    used = np.unique(wtris)
    part_of_bone, order = choose_parts(g["bones"], wbone[used], base["parts"], fixed, log)
    world = T.rest_world(g["bones"])
    joint = np.array([world[b][:3, 3] for b in order])
    texel, tri_row, index, palette = bake(wtris, wuv, wsrc, pictures, base["width"], base["height"], base["rows"], log)
    # as tall as the base stands, on its ground; y downward and facing -z as the disc's models
    lo, hi = wpos[used].min(0), wpos[used].max(0)
    scale = (base["hi"][1] - base["lo"][1]) / (hi[1] - lo[1])
    flip = np.array([-1.0, -1.0, -1.0])
    shift = np.array([0.0, base["hi"][1] - (-lo[1] * scale), 0.0])
    log("scale %.2f: %.3f high there, %d here (the base stands from y %d to %d)" % (scale, hi[1] - lo[1], round((hi[1] - lo[1]) * scale), base["lo"][1], base["hi"][1]))

    def to_dm(p):
        return p * flip * scale + shift

    par = [b["parent"] for b in g["bones"]]
    parents, offsets = [], []
    for b in order:
        q = par[b]
        while q >= 0 and q not in order:
            q = par[q]
        parents.append(order.index(q) if q >= 0 else -1)
        offsets.append(to_dm(joint[order.index(b)]) - (to_dm(joint[order.index(q)]) if q >= 0 else 0))
    offsets = np.round(np.array(offsets)).astype(np.int64)
    centre = [None] * len(order)

    def placed(i):                                      # the rounded offsets added up: where the part really is
        if centre[i] is None:
            centre[i] = offsets[i] + (placed(parents[i]) if parents[i] >= 0 else 0)
        return centre[i]

    for i in range(len(order)):
        placed(i)
    centre = np.array(centre, np.float64)
    verts, where, out_tris = [], {}, []
    for ti, t in enumerate(wtris):
        ps = [part_of_bone[int(wbone[w])] for w in t]
        part = max(set(ps), key=ps.count)               # the whole triangle goes with one part
        ids = []
        for w in t:
            key = (int(w), part, int(tri_row[ti]))
            if key not in where:
                where[key] = len(verts)
                p = np.round(to_dm(wpos[w]) - centre[part])
                n = wnrm[w] * flip
                n = np.round(n / max(np.linalg.norm(n), 1e-9) * 4096)
                verts.append([p[0], p[1], p[2], n[0], n[1], n[2], 128, 128, 128,
                              int(texel[w][0]), int(texel[w][1]), part, int(tri_row[ti])])
            ids.append(where[key])
        out_tris.append(ids if flip.prod() > 0 else ids[::-1])
    return {"parts": [(parents[i], offsets[i]) for i in range(len(order))],
            "names": [g["bones"][b]["name"] for b in order], "verts": np.array(verts, np.int64),
            "tris": np.array(out_tris), "index": index, "palette": palette}


def still_motions(m, base):
    """The bind pose held still in each of the base's slots, as long as the base's motion:
    one key of a quarter of its frames (a motion lasts 2 x d0 + the sum of 2 x d). The
    camera record is the base's own from key 0 of that slot. A motion of the base that
    goes round goes round here too (on its one key); one that stops, stops. The fields are
    filled as the base's are: show 0 for a part that is drawn, scale 4096, next 0."""
    n = len(m["parts"])
    out = []
    for keys in base["motions"]:
        frames = 2 * keys[0]["dur"] + sum(2 * k["dur"] for k in keys)
        recs = np.zeros((n + 1, 11), np.int64)
        recs[:n, 7:10] = 4096
        recs[n] = keys[0]["recs"][-1]
        recs[0, 10] = -1 if keys[0]["recs"][0][10] < 0 else 0
        out.append([{"dur": max(1, frames // 4), "snd": 0, "recs": recs}])
    return out


def write(m, motions, out_dir, num):
    w = [0x4D44, 1, len(m["parts"]), len(motions), len(m["verts"]), len(m["tris"]), 0, m["index"].shape[1], m["index"].shape[0], len(m["palette"])]
    for parent, off in m["parts"]:
        w += [parent] + [int(x) for x in off]
    w += [int(x) for x in m["verts"].reshape(-1)]
    if max(abs(x) for x in w[10:]) > 32767:
        raise ValueError("a coordinate does not fit 16 bits")
    w += [int(x) for x in m["tris"].reshape(-1)]
    for keys in motions:
        w.append(len(keys))
        for k in keys:
            w += [k["dur"], k["snd"]] + [int(x) for x in k["recs"].reshape(-1)]
    data = struct.pack("<%dH" % len(w), *[x & 0xFFFF for x in w])
    os.makedirs(out_dir, exist_ok=True)
    open(os.path.join(out_dir, "%03d.bin.gz" % num), "wb").write(gzip.compress(data, 9, mtime=0))
    Image.fromarray(m["index"], "L").save(os.path.join(out_dir, "%03d.png" % num), optimize=True)
    Image.fromarray(m["palette"].reshape(len(m["palette"]), 256, 4), "RGBA").save(os.path.join(out_dir, "%03dp.png" % num), optimize=True)


def raster(canvas, p, tris, colour, x_off, size, mid, span, right, toward):
    col = np.full((size, size, 3), 235.0)
    depth = np.full((size, size), -1e18)
    sx = ((p - mid) @ right / span + 0.5) * size
    sy = ((p - mid)[:, 1] / span + 0.5) * size
    sz = (p - mid) @ toward
    for ti, t in enumerate(tris):
        x, y, z = sx[t], sy[t], sz[t]
        x0, x1 = max(int(np.floor(x.min())), 0), min(int(np.ceil(x.max())), size - 1)
        y0, y1 = max(int(np.floor(y.min())), 0), min(int(np.ceil(y.max())), size - 1)
        den = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
        if x0 > x1 or y0 > y1 or abs(den) < 1e-9:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        w0 = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / den
        w1 = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / den
        w2 = 1 - w0 - w1
        zz = w0 * z[0] + w1 * z[1] + w2 * z[2]
        sub = depth[y0:y1 + 1, x0:x1 + 1]
        inside = (w0 >= 0) & (w1 >= 0) & (w2 >= 0) & (zz > sub)
        if inside.any():
            sub[inside] = zz[inside]
            col[y0:y1 + 1, x0:x1 + 1][inside] = colour(ti, t, w0, w1, w2)[inside]
    canvas[:, x_off:x_off + size] = col.astype(np.uint8)


def preview(m, base, web, base_num, out, size=240):
    """The base as it stands (left pair) and the written model (right pair), front and side,
    each drawn as its file says: texels through the palette rows, no lighting."""
    centre = [None] * len(m["parts"])

    def placed(i):
        if centre[i] is None:
            centre[i] = m["parts"][i][1] + (placed(m["parts"][i][0]) if m["parts"][i][0] >= 0 else 0)
        return centre[i]

    for i in range(len(m["parts"])):
        placed(i)
    v = m["verts"]
    p = v[:, 0:3] + np.array(centre)[v[:, 11]]
    bidx = np.asarray(Image.open(os.path.join(web, "assets", "models", "%03d.png" % base_num)))
    bpal = np.asarray(Image.open(os.path.join(web, "assets", "models", "%03dp.png" % base_num)))
    both = np.concatenate([p, base["pos"]])
    mid, span = (both.min(0) + both.max(0)) / 2, (both.max(0) - both.min(0)).max() * 1.1
    canvas = np.full((size, size * 4, 3), 235, np.uint8)

    def look(verts, index, pal):
        def colour(ti, t, w0, w1, w2):
            u = np.clip((w0 * verts[t[0], 9] + w1 * verts[t[1], 9] + w2 * verts[t[2], 9]).astype(int), 0, index.shape[1] - 1)
            tv = np.clip((w0 * verts[t[0], 10] + w1 * verts[t[1], 10] + w2 * verts[t[2], 10]).astype(int), 0, index.shape[0] - 1)
            return pal[verts[t[0], 12]][index[tv, u]][..., :3]
        return colour

    views = ((np.array([-1.0, 0, 0]), np.array([0, 0, -1.0])), (np.array([0, 0, -1.0]), np.array([1.0, 0, 0])))
    for k, (right, toward) in enumerate(views):
        raster(canvas, base["pos"], base["tris"], look(base["v"], bidx, bpal), k * size, size, mid, span, right, toward)
        raster(canvas, p, m["tris"], look(v, m["index"], m["palette"]), (2 + k) * size, size, mid, span, right, toward)
    Image.fromarray(canvas).save(out)


def main():
    args = sys.argv[1:]
    opts, pos, fixed = {}, [], {}
    i = 0
    while i < len(args):
        if args[i] in ("--images", "--preview"):
            opts[args[i][2:]] = args[i + 1]
            i += 1
        elif args[i] == "--part":
            n, name = args[i + 1].split("=")
            fixed[int(n)] = name
            i += 1
        else:
            pos.append(args[i])
        i += 1
    if len(pos) != 5:
        sys.exit(__doc__)
    geom, web, base_num, out_dir, num = pos[0], pos[1], int(pos[2]), pos[3], int(pos[4])
    base = read_dm(os.path.join(web, "assets", "models", "%03d.bin.gz" % base_num))
    print("base %03d: %d parts, %d triangles, texture %dx%d, %d palette rows" % (
        base_num, base["parts"], base["triangles"], base["width"], base["height"], base["rows"]))
    images = opts.get("images") or os.path.join(os.path.dirname(os.path.abspath(geom)), "images")
    m = convert(geom, images, base, fixed, lambda s: print("  " + s))
    write(m, still_motions(m, base), out_dir, num)
    print("wrote %03d: %d parts, %d vertices, %d triangles, texture %dx%d, %d palette rows, %d still motions" % (
        num, len(m["parts"]), len(m["verts"]), len(m["tris"]), m["index"].shape[1], m["index"].shape[0], len(m["palette"]), len(base["motions"])))
    print("  parts: " + " ".join("%d=%s" % (i, n) for i, n in enumerate(m["names"])))
    if "preview" in opts:
        preview(m, base, web, base_num, opts["preview"])
        print("preview: " + opts["preview"])


if __name__ == "__main__":
    main()
