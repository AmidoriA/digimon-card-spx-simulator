"""Turn a Time Stranger model into a DDCB model file (TS-205) with its motions (TS-206),
as settled on Guilmon (TS-207).

Usage (run with tools/.venv python; tools/build_custom.py calls make() for a card whose
"model" names a Time Stranger model):
  python -I ts_model.py <file.geom> <web dir> <base model number> <out dir> <number>
        [--detail <model number>] [--parts N] [--triangles N] [--width N] [--height N] [--rows N]
        [--against <the base's own .geom>] [--size K] [--part N=<bone> ...] [--motion SLOT=<name> ...]
        [--images <dir>] [--anims <prefix>] [--preview out.png [--show N,N]] [--poses out.png]

Writes <out dir>/NNN.bin.gz, NNN.png and NNNp.png in the format of tools/build_models.py.
The eight motions are made from the model's Time Stranger motions <prefix><name>.anim (the
prefix is the .geom's path without its ending and with "_" unless --anims gives another),
on the keys of the base model web/assets/models/<base>.bin.gz.

--detail names the disc model whose figures the new one may cost: its parts, triangles,
texture size and palette rows (FIGURES). Without it they are the base's. --parts and the
others give single figures; none may be more than the most a disc model has (MOST).
--against names the Time Stranger model of the base's own Digimon: the new model is then
as large against the base as it is in that game. Without it, as tall as the base. The
two games do not size their Digimon alike (Coronamon is a third of Goburimon's height in
Time Stranger), so look at what it gives. --size K makes the model K times as large as
either rule does: a number chosen by eye, to be named in the README.
--part N=<bone> gives a bone's part the number N. The base's battle scripts hang effects
on parts by number (docs/time-stranger/motion-slots.md, the "Parts" columns), so the part
that plays that role in the new model has to carry it.
--motion SLOT=<name> takes another Time Stranger motion for a slot than ROLES names.
--preview draws the base and the written model as they are built, front and side; with
--show N,N the parts of those numbers are painted in plain colours in both (magenta, cyan,
green, yellow), to see what body part a number is in the base and where it lies in the new
model. --poses draws the base (upper row of each slot) and the written model (lower row)
in six keys of every slot, from the side.

How it is made. None of this is the PlayStation game's doing: the choices are this
project's, made to fit what the disc's models are (rigid parts, 16-colour palette rows;
measured over the 211 card models in web/assets/models). In one thing the result is not
what they are: the disc's models keep every triangle inside one part.
  1. fewer triangles: edges are collapsed onto one of their ends, cheapest first by the
     distance the surface moves (quadric error), down to the figure. An edge is left
     alone where its collapse would tear the texture mapping at a seam, turn a triangle
     over, pinch the mesh, or join two bones that no edge of the model joins. The eyes'
     triangles weigh more, so that they are not the first to go.
  2. parts: a vertex goes with the bone that weighs most on it. Bones are merged into
     their parents until there are no more parts than the figure: each time the bone
     whose vertices that moves least, measured over the motions the slots take (a collar
     before an elbow), the two sides of a pair together. A triangle whose corners are in
     different parts keeps them there and is stretched between the parts like skin, so no
     joint opens; web/js/battle3d.js moves a model vertex by vertex and battlehd.js
     refines such a triangle in the model's coordinates.
  3. texture: the pieces of the texture mapping that are still used are laid out again in
     one sheet, each by its own shape, the largest first; pieces on the same texels (the
     two sides of a model painted once) share them. All are shrunk by one factor, the
     eyes' pieces less (EYE_TEXELS). The pieces are sorted into as many groups as there
     are palette rows by their colour, and each group's texels are reduced to 16 colours.
  4. size and place: the model is scaled against the base (--against) or to the height of
     the base in key 0 of its standing motion, stood on the same ground and turned to
     face the same way (the disc's models have y downward and face -z).
  The eyes' two overlay textures are laid over each other as ts_model_read.py --overlays
  does; how the game's shader mixes them was not read.
  5. motions (TS-206): a slot keeps the base's keys: as many, each as long, with the base's
     sound and camera record, so the motion lasts what the base's lasts and every sound and
     camera move comes at the base's moment (a motion lasts 2 x d0 + the sum of 2 x d
     frames; README, "Polygon Battle"). The pose of a key is the Time Stranger motion
     sampled at the key's place in the slot: key 0 its first frame, the last key its last
     frame, the others by their time between the two. A slot that goes round from key 0
     on a Time Stranger motion that ends as it begins is laid on the round instead (the
     way back to key 0 counted in), so it does not stop at the join. A part moves as its
     own bone does; the bones merged into it move with it as one piece. The pose is turned
     into what a key holds for each part (angles in the order Ry Rx Rz, a move added to
     the part's place, a scale) from the bone's matrix in that frame; the angles of a key
     are taken as near the key's before as a turn allows, since the game goes from key to
     key number by number.
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
import ts_anim_read as A
import ts_model_read as T

SHOW = ((255, 0, 255), (0, 255, 255), (0, 255, 0), (255, 255, 0))      # --show: the colours of the parts named
EYE_WEIGHT = 30.0
EYE_TEXELS = 1.5
SHAPE_SIDE = 512       # a texture piece's shape is drawn no larger than this before it is laid out
# What a model costs: the figures the converted model must stay within. They are the base's
# unless given (--parts and so on), and never more than the most any of the disc's 211 card
# models has (measured over web/assets/models; the shader of battle3d.js holds 32 parts).
FIGURES = ("parts", "triangles", "width", "height", "rows")
MOST = {"parts": 31, "triangles": 1246, "width": 256, "height": 216, "rows": 16}

# The Time Stranger motion for each of the game's eight slots (README, "Polygon Battle", has
# what a slot is; "Time Stranger motions" has the names the other game gives its own):
#   0 standing  bn01 MOTION_TYPE_IDLE          4 damage   bd01 MOTION_TYPE_DAMAGE
#   1 attack 1  ba01 MOTION_TYPE_ATTACK        5 KO       bd02 MOTION_TYPE_DOWN
#   2 attack 2  ba02 MOTION_TYPE_COMMON_SKILL  6 victory  bv01 MOTION_TYPE_WIN
#   3 attack 3  bs01 MOTION_TYPE_SPECIAL_SKILL01
#   7 entrance  bn01: Time Stranger's battle table has no motion for coming in; the slot is
#     given the standing motion, the pose the entrance ends in.
# Which of the three attack motions goes to which attack is this project's choice: the
# order the other game numbers them in. A motion the model does not have is replaced by the
# first of FALLBACK it has.
ROLES = {0: "bn01", 1: "ba01", 2: "ba02", 3: "bs01", 4: "bd01", 5: "bd02", 6: "bv01", 7: "bn01"}
FALLBACK = {1: ("ba01", "ba02", "bs01"), 2: ("ba02", "ba01", "bs01"), 3: ("bs01", "ba02", "ba01"),
            5: ("bd02", "bd01"), 6: ("bv01", "fe02")}


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
    return {"parts": n, "triangles": nop + nbl, "width": tw, "height": th, "rows": npal, "raw_parts": parts,
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

def decimate(P, place, tris, weight, want, log, bone=None):
    """Half-edge collapses on the places (welded points), wedges following along.
    P: position of each wedge; place: its place; tris: wedge triples; bone: each wedge's
    bone. Returns the triangles left.
    A collapse may not join two bones by an edge that no edge of the model joins: a
    triangle then never reaches from one part of the body to a far one (from the hips to
    the tail's end), which the parts would pull apart when they move."""
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
    pbone = np.zeros(nplace, np.int64)
    joined = set()
    if bone is not None:
        pbone[place] = bone
        joined = {(min(pbone[a], pbone[b]), max(pbone[a], pbone[b])) for a, b in edge_use}
    apart = 0

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
        if bone is not None and any(pbone[n] != pbone[b] and (min(pbone[n], pbone[b]), max(pbone[n], pbone[b])) not in joined
                                    for n in neighbours(a) if n != b):
            apart += 1
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
    log("triangles %d -> %d (%d collapses refused for a seam, an overturned triangle or the mesh's shape, %d for joining bones that no edge joins)" % (
        len(tri), left, refused, apart))
    keep = [i for i, ok in enumerate(alive) if ok]
    return np.array([tri[i] for i in keep]), weight[keep]


# ---- parts -----------------------------------------------------------------------------

def chain(parent, p):
    out = []
    while p >= 0:
        out.append(p)
        p = parent[p]
    return out


def choose_parts(bones, bone_of, limit, fixed, log, apart=None):
    """Merge bones into their parents until `limit` parts are left: each time the bone whose
    vertices that moves least over the model's motions. apart(b, q) is how far the vertices
    of bone b are from where bone q would carry them, squared and summed over the frames
    (motion_cost); without it the bone with the fewest vertices goes first.
    fixed: {part number: bone} that must stay parts with those numbers.
    Returns {bone: part number} for every bone in use and the bone of each part."""
    parent = [b["parent"] for b in bones]
    count = {}
    for b in bone_of:
        count[int(b)] = count.get(int(b), 0) + 1
    for b in fixed.values():
        count.setdefault(b, 0)
    into = {b: b for b in count}

    def above(p):
        q = parent[p]
        while q not in count:
            q = parent[q]
        return q

    def price(p):
        if apart is None:
            return count[p]
        q = above(p)
        return sum(apart(b, q) - apart(b, p) for b, v in into.items() if v == p)

    def twin(p):
        """The same bone of the other side (J_arm_l and J_arm_r), if it is a part too."""
        name = bones[p]["name"]
        for a, b in (("_l", "_r"), ("_r", "_l"), ("_L", "_R"), ("_R", "_L")):
            if name.endswith(a):
                other = [q for q in count if bones[q]["name"] == name[:-2] + b]
                return other[0] if other else None
        return None

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
        # the two sides of a pair go together, so that the model stays the same on both
        units = {}
        for p in free:
            t = twin(p)
            if t is None or t in free:
                units[min(p, t) if t is not None else p] = [p] if t is None else sorted((p, t))
        if not units:
            raise ValueError("no bone left to merge for %d parts" % limit)
        prices = {p: price(p) for u in units.values() for p in u}
        unit = min(units.values(), key=lambda u: (sum(prices[p] for p in u) / len(u), u[0]))
        for small in unit:
            q = above(small)
            log("part %s (%d vertices) joins %s" % (bones[small]["name"], count[small], bones[q]["name"]) + (
                "" if apart is None else ": %s" % apart(None, prices[small])))
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


def shape_at(shape, w, h):
    """A piece's shape (texels its triangles touch, drawn at SHAPE_SCALE) in a box of w x h
    texels with a rim of one texel around it: where any of it falls, and one texel around."""
    small = np.asarray(Image.fromarray(shape.astype(np.uint8) * 255).resize((w, h), Image.BOX)) > 0
    m = np.pad(small, 1)
    grown = m.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            grown[max(dy, 0):m.shape[0] + min(dy, 0), max(dx, 0):m.shape[1] + min(dx, 0)] |= \
                m[max(-dy, 0):m.shape[0] + min(-dy, 0), max(-dx, 0):m.shape[1] + min(-dx, 0)]
    return grown


def pack(shapes, sizes, width, height, sx, sy):
    """Lay the pieces into the sheet by their shapes, the largest first, each at the first
    free place from the top left (row by row). shapes: shape_at's input for each piece;
    sizes: its (w, h) in texels of its picture, scaled here by sx, sy.
    -> {piece: (x, y, mask)}, the mask with its rim, or None if they do not fit."""
    masks = {}
    for i, (w, h) in enumerate(sizes):
        masks[i] = shape_at(shapes[i], max(1, int(math.ceil(w * sx))), max(1, int(math.ceil(h * sy))))
        if masks[i].shape[1] > width or masks[i].shape[0] > height:
            return None
    taken = np.zeros((height, width))
    out = {}
    fh, fw = 2 * height, 2 * width
    for i in sorted(masks, key=lambda i: (-int(masks[i].sum()), i)):
        m = masks[i]
        h, w = m.shape
        # how many taken texels the piece would lie on, for every place it could have
        hit = np.fft.irfft2(np.fft.rfft2(taken, (fh, fw)) * np.fft.rfft2(m[::-1, ::-1].astype(np.float64), (fh, fw)), (fh, fw))
        free = hit[h - 1:height, w - 1:width] < 0.5
        if not free.any():
            return None
        y, x = np.unravel_index(int(free.argmax()), free.shape)
        taken[y:y + h, x:x + w] += m
        out[i] = (int(x), int(y), m)
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


def bake(tris, wuv, wsrc, pictures, width, height, rows, log, eyes=()):
    """-> texel coordinates of each wedge, palette row of each triangle, index sheet, palette rows."""
    isl = islands(tris)
    box = []
    for group in isl:
        ws = sorted({int(w) for ti in group for w in tris[ti]})
        pic = pictures[wsrc[ws[0]]]
        px = wuv[ws] * pic.shape[1::-1]
        lo, hi = np.floor(px.min(0)), np.ceil(px.max(0))
        box.append([wsrc[ws[0]], lo, np.maximum(hi, lo + 1)])
    # pieces that lie on the same texels of the same picture (the two sides of a model that
    # is painted once) share them; every other piece gets a place of its own in the sheet,
    # so that the sheet is filled and each piece can take the palette row that fits it
    team = list(range(len(isl)))

    def find(i):
        while team[i] != i:
            team[i] = team[team[i]]
            i = team[i]
        return i

    for i in range(len(isl)):
        for j in range(i):
            a, b = box[i], box[j]
            both = np.clip(np.minimum(a[2], b[2]) - np.maximum(a[1], b[1]), 0, None).prod()
            if a[0] == b[0] and both > 0.8 * max((a[2] - a[1]).prod(), (b[2] - b[1]).prod()):
                team[find(i)] = find(j)
    teams = {}
    for i in range(len(isl)):
        teams.setdefault(find(i), []).append(i)
    rects = []
    for members in teams.values():
        lo = np.min([box[i][1] for i in members], 0)
        hi = np.max([box[i][2] for i in members], 0)
        rects.append({"src": box[members[0]][0], "lo": lo, "hi": hi, "tris": [ti for i in members for ti in isl[i]]})
    # the eyes' pieces are laid out EYE_TEXELS times as large each way as the rest: they are
    # a few texels of their picture and what a face is read by
    eyes = set(int(t) for t in eyes)
    sizes = [((r["hi"][0] - r["lo"][0]) * k, (r["hi"][1] - r["lo"][1]) * k)
             for r in rects for k in [EYE_TEXELS if eyes.intersection(r["tris"]) else 1.0]]
    # each piece's shape: the texels of its picture its triangles touch, at SHAPE_SCALE
    shapes = []
    for r in rects:
        bw, bh = r["hi"] - r["lo"]
        pic = pictures[r["src"]]
        ph, pw = pic.shape[:2]
        k = min(1.0, SHAPE_SIDE / max(bw, bh))
        sw, sh = max(1, int(math.ceil(bw * k))), max(1, int(math.ceil(bh * k)))
        shape = np.zeros((sh, sw), bool)
        for ti in r["tris"]:
            t = (wuv[tris[ti]] * (pw, ph) - r["lo"]) * k
            x0, x1 = int(max(math.floor(t[:, 0].min()), 0)), int(min(math.ceil(t[:, 0].max()), sw - 1))
            y0, y1 = int(max(math.floor(t[:, 1].min()), 0)), int(min(math.ceil(t[:, 1].max()), sh - 1))
            gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
            den = (t[1, 1] - t[2, 1]) * (t[0, 0] - t[2, 0]) + (t[2, 0] - t[1, 0]) * (t[0, 1] - t[2, 1])
            if abs(den) < 1e-9:
                shape[y0:y1 + 1, x0:x1 + 1] = True
                continue
            w0 = ((t[1, 1] - t[2, 1]) * (gx - t[2, 0]) + (t[2, 0] - t[1, 0]) * (gy - t[2, 1])) / den
            w1 = ((t[2, 1] - t[0, 1]) * (gx - t[2, 0]) + (t[0, 0] - t[2, 0]) * (gy - t[2, 1])) / den
            near = 1.0 / max(math.sqrt(abs(den)), 1e-6)
            shape[y0:y1 + 1, x0:x1 + 1] |= (w0 >= -near) & (w1 >= -near) & (1 - w0 - w1 >= -near)
        shapes.append(shape)
    best = None
    for aspect in (0.5, 0.67, 0.8, 1.0, 1.25, 1.5, 2.0):     # texels may be shrunk more one way than the other
        lo_s, hi_s = 0.0, 1.0
        for _ in range(14):
            mid = (lo_s + hi_s) / 2
            if pack(shapes, sizes, width, height, mid * aspect, mid):
                lo_s = mid
            else:
                hi_s = mid
        # the most texels, but a sheet shrunk evenly both ways before one shrunk unevenly
        worth = lo_s * lo_s * aspect * min(aspect, 1 / aspect) ** 0.5
        if lo_s > 0 and (best is None or worth > best[0]):
            best = (worth, lo_s * aspect, lo_s)
    if best is None:
        raise ValueError("the texture pieces do not fit the sheet at any size")
    where = pack(shapes, sizes, width, height, best[1], best[2])
    sheet = np.zeros((height, width, 3), np.uint8)
    texel = np.zeros((len(wuv), 2))
    covered = np.full((height, width), -1)
    means = []
    tiles = {}
    for i, r in enumerate(rects):
        x, y, mask = where[i]
        h, w = mask.shape
        pic = pictures[r["src"]]
        ph, pw = pic.shape[:2]
        lo, hi = r["lo"], r["hi"]
        if r["src"] not in tiles:
            tiles[r["src"]] = np.tile(pic, (3, 3, 1))  # coordinates may run past the picture's edge
        tile = tiles[r["src"]]
        crop = tile[int(lo[1]) % ph + ph:int(lo[1]) % ph + ph + int(hi[1] - lo[1]), int(lo[0]) % pw + pw:int(lo[0]) % pw + pw + int(hi[0] - lo[0])]
        # the piece inside its rim; the rim repeats the piece's outermost texels, so that a
        # smoothed lookup at the edge (battlehd.js) does not reach into the next piece
        inner = np.asarray(Image.fromarray(crop).resize((w - 2, h - 2), Image.BOX))
        sheet[y:y + h, x:x + w][mask] = np.pad(inner, ((1, 1), (1, 1), (0, 0)), mode="edge")[mask]
        covered[y:y + h, x:x + w][mask] = i
        for wd in {int(wd) for ti in r["tris"] for wd in tris[ti]}:
            p = wuv[wd] * (pw, ph)
            texel[wd] = (x + 1 + (p[0] - lo[0]) / (hi[0] - lo[0]) * (w - 2), y + 1 + (p[1] - lo[1]) / (hi[1] - lo[1]) * (h - 2))
        r["area"] = int(mask.sum())
        means.append(sheet[y:y + h, x:x + w][mask].reshape(-1, 3).mean(0))
    log("%d texture pieces, %d after those on the same texels are joined, shrunk to %.3f across and %.3f down, in a sheet of %dx%d (%d%% of it used)" % (
        len(isl), len(rects), best[1], best[2], width, height, round(100 * (covered >= 0).mean())))
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
        index[mask] = ((sheet[mask].astype(np.float64)[:, None] - pal[None].astype(np.float64)) ** 2).sum(2).argmin(1)
        for i in members:
            tri_row[rects[i]["tris"]] = c
        log("palette row %d: %d texels in use, %s" % (c, int(mask.sum()), " ".join("%02x%02x%02x" % tuple(x) for x in pal)))
    return texel, tri_row, index, palette


# ---- the file --------------------------------------------------------------------------

def motion_cost(g, anims, pos, bone_of, area, log):
    """-> apart(b, q) for choose_parts: the squared distance, summed over the vertices of
    bone b and over every second frame of the model's motions, between where b carries them
    and where q would; a vertex counts by the surface around it (area: a third of its
    triangles'). apart(None, cost) puts a cost into words. None without motions."""
    frames = []
    for anim in anims:
        for f in range(0, anim["frames"], 2):
            world = T.rest_world(A.posed(g, A.sample(anim, f)))
            frames.append(np.array([w @ b["inverse_bind"] for w, b in zip(world, g["bones"])]))
    if not frames:
        return None
    S = np.array(frames)                                 # frame, bone, 4, 4
    high = pos[:, 1].max() - pos[:, 1].min()
    at, cache = {}, {}
    for b in set(bone_of.tolist()):
        at[b] = (np.concatenate([pos[bone_of == b], np.ones(((bone_of == b).sum(), 1))], 1), area[bone_of == b])

    def apart(b, q):
        if b is None:
            return "that moves the surface %.2f%% of the model's height from its place (all of it, all frames together)" % (
                100 * math.sqrt(max(q, 0.0) / (area.sum() * len(S))) / high)
        if b not in at or b == q:
            return 0.0
        if (b, q) not in cache:
            d = np.einsum("fij,vj->fvi", S[:, b] - S[:, q], at[b][0])[..., :3]
            cache[b, q] = float(((d * d).sum(2) * at[b][1]).sum())
        return cache[b, q]
    log("parts chosen over %d frames of %d motions" % (len(S), len(anims)))
    return apart


def source_height(geom):
    """How tall a Time Stranger model is as it is built (its drawn meshes)."""
    g = T.read_geom(geom)
    y = np.concatenate([m["attributes"]["POSITION"][:, 1] for m in T.drawn(g, False)])
    return float(y.max() - y.min())


def convert(geom, images, base, fixed_names, log, anims=(), figures=None, against=None, size=1.0):
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
    lim = {k: base[k] for k in FIGURES}
    lim.update(figures or {})
    wtris, weight = decimate(wpos, place, wtris, weight, lim["triangles"], log, wbone)
    log("of them %d are the eyes'" % int((weight > 1).sum()))
    used = np.unique(wtris)
    area = np.zeros(len(wpos))
    for t in wtris:
        area[t] += np.linalg.norm(np.cross(wpos[t[1]] - wpos[t[0]], wpos[t[2]] - wpos[t[0]])) / 6
    if len(fixed) and max(fixed) >= lim["parts"]:
        raise ValueError("part %d asked for with %d parts" % (max(fixed), lim["parts"]))
    part_of_bone, order = choose_parts(g["bones"], wbone[used], lim["parts"], fixed, log,
                                       motion_cost(g, anims, wpos[used], wbone[used], area[used], log))
    world = T.rest_world(g["bones"])
    joint = np.array([world[b][:3, 3] for b in order])
    texel, tri_row, index, palette = bake(wtris, wuv, wsrc, pictures, lim["width"], lim["height"], lim["rows"], log,
                                         np.nonzero(weight > 1)[0])
    # as tall as the base stands, on its ground; y downward and facing -z as the disc's models
    lo, hi = wpos[used].min(0), wpos[used].max(0)
    if against:                                         # the base's own model of that game is the measure
        scale = (base["hi"][1] - base["lo"][1]) / against
        log("as large against the base as in Time Stranger: the base's model is %.3f high there, this one %.3f (%.2f times)" % (
            against, hi[1] - lo[1], (hi[1] - lo[1]) / against))
    else:
        scale = (base["hi"][1] - base["lo"][1]) / (hi[1] - lo[1])
    if size != 1.0:
        scale *= size
        log("and %.2f times that size, as asked" % size)
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
        ids = []
        for w in t:
            # a corner stays with its own bone's part: a triangle between two parts is
            # stretched by them like skin (the disc's models have none; the port moves a
            # model vertex by vertex, battle3d.js, so it can draw one)
            part = part_of_bone[int(wbone[w])]
            key = (int(w), int(tri_row[ti]))
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
            "tris": np.array(out_tris), "index": index, "palette": palette,
            "geom": g, "bones": order, "scale": scale, "flip": flip, "shift": shift, "centre": centre}


# ---- motions (TS-206) --------------------------------------------------------------------

def angles_yxz(R):
    """The angles (4096ths of a turn) rot_yxz makes R from: R = Ry Rx Rz."""
    x = math.asin(max(-1.0, min(1.0, -R[1, 2])))
    if abs(R[1, 2]) > 0.999999:                         # looking straight up or down: z is free
        y, z = math.atan2(-R[2, 0], R[0, 0]), 0.0
    else:
        y, z = math.atan2(R[0, 2], R[2, 2]), math.atan2(R[1, 0], R[1, 1])
    return np.array([x, y, z]) * 2048 / math.pi


def near(a, ref):
    """The same turn as a, written as near ref as it can be (whole turns added, or the
    other three angles that make the same turn)."""
    best = None
    for c in (a, np.array([2048 - a[0], a[1] + 2048, a[2] + 2048])):
        c = c + np.round((ref - c) / 4096) * 4096
        d = np.abs(c - ref).sum()
        if best is None or d < best[0]:
            best = (d, c)
    return best[1]


def part_pose(m, anim, frame):
    """What a key holds for each part with the Time Stranger motion at `frame`:
    (angles, move, scale) a part, as Actor.resolve of web/js/battle3d.js uses them."""
    g, order = m["geom"], m["bones"]
    world = T.rest_world(A.posed(g, A.sample(anim, frame)))
    F, shift = np.diag(m["flip"]), m["shift"]
    Mw, Tw = [], []
    for i, b in enumerate(order):
        S = world[b] @ g["bones"][b]["inverse_bind"]    # where the bone takes a point of the bind pose
        a = F @ S[:3, :3] @ F
        Mw.append(a)
        Tw.append(a @ (m["centre"][i] - shift) + F @ S[:3, 3] * m["scale"] + shift)
    out = []
    for i in range(len(order)):
        parent, off = m["parts"][i]
        if parent >= 0:
            inv = np.linalg.inv(Mw[parent])
            L, move = inv @ Mw[i], inv @ (Tw[i] - Tw[parent]) - off
        else:
            L, move = Mw[i], Tw[i] - off
        scale = np.linalg.norm(L, axis=0)
        u, _, vt = np.linalg.svd(L / scale)
        out.append((angles_yxz(u @ vt), move, scale))
    return out


def key_frames(keys, anim, m, log, name):
    """The frame of the Time Stranger motion each key of the base's slot takes its pose from."""
    last = anim["frames"] - 1
    d = [2 * k["dur"] for k in keys]
    after0 = np.cumsum([0] + d[1:])                     # frames from key 0 to each key
    if len(keys) == 1 or last == 0:
        return [0.0] * len(keys), "one pose"
    loop = int(keys[0]["recs"][0][10])
    if loop == 0:
        a, b = part_pose(m, anim, 0), part_pose(m, anim, last)
        apart = max(max(np.abs(near(x[0], y[0]) - y[0]).max() / 4096 * 360, np.abs(x[1] - y[1]).max() / 10) for x, y in zip(a, b))
        if apart < 3:                                    # ends as it begins: lay it on the round
            return list(after0 / (after0[-1] + d[0]) * last), "round, the way back to key 0 counted in"
        log("%s goes round in the base but does not end as it begins (%.1f apart): the join is a blend" % (name, apart))
    return list(after0 / after0[-1] * last), "first frame to last"


def slot_names(slot, chosen):
    """The Time Stranger motions to try for a slot, first choice first."""
    if slot in chosen:
        return [chosen[slot]]
    return [ROLES.get(slot, "bn01")] + [x for x in FALLBACK.get(slot, ()) if x != ROLES.get(slot)] + ["bn01"]


def slot_anims(base, prefix, chosen):
    """The motions the model's slots will take, each once."""
    out, seen = [], set()
    for slot in range(len(base["motions"])):
        name = next((x for x in slot_names(slot, chosen) if os.path.exists(prefix + x + ".anim")), None)
        if name and name not in seen:
            seen.add(name)
            out.append(A.read(prefix + name + ".anim"))
    return out


def motions(m, base, prefix, chosen, log):
    """The eight motions on the base's keys. -> motions, [what was done for each slot]"""
    n = len(m["parts"])
    out, notes, cache = [], [], {}

    def load(name):
        if name not in cache:
            path = prefix + name + ".anim"
            cache[name] = A.read(path) if os.path.exists(path) else None
        return cache[name]

    stand = None
    for slot, keys in enumerate(base["motions"]):
        names = slot_names(slot, chosen)
        name = next((x for x in names if load(x)), None)
        if name is None:
            log("slot %d: none of %s is there; the bind pose held still" % (slot, " ".join(names)))
            out.append(still_motions(m, base)[slot])
            notes.append({"slot": slot, "motion": None})
            continue
        if name != names[0]:
            log("slot %d: no %s; %s takes its place" % (slot, names[0], name))
        anim = load(name)
        frames, how = key_frames(keys, anim, m, log, "slot %d (%s)" % (slot, name))
        made, ref = [], stand
        for k, f in zip(keys, frames):
            recs = np.zeros((n + 1, 11), np.int64)
            pose = part_pose(m, anim, f)
            turned = []
            for i, (ang, move, scale) in enumerate(pose):
                ang = near(ang, ref[i] if ref is not None else np.zeros(3))
                turned.append(ang)
                recs[i, 0:3] = np.round(ang)
                recs[i, 4:7] = np.round(move)
                recs[i, 7:10] = np.round(scale * 4096)
            ref = turned
            if stand is None:
                stand = turned                          # every motion starts near the standing pose's numbers
            recs[n] = k["recs"][-1]
            made.append({"dur": k["dur"], "snd": k["snd"], "recs": recs})
        made[0]["recs"][0, 10] = keys[0]["recs"][0][10]
        if np.abs(np.array([x["recs"][:n, 0:10] for x in made])).max() > 32767:
            raise ValueError("slot %d: a value does not fit 16 bits" % slot)
        far = np.abs(np.array(ref) - np.array(stand)).max()
        if far > 2048:
            log("slot %d (%s) ends more than half a turn from the standing pose in its numbers (%d): the way back will swing round" % (slot, name, far))
        out.append(made)
        total = 2 * keys[0]["dur"] + sum(2 * k["dur"] for k in keys)
        notes.append({"slot": slot, "motion": name, "source": anim["frames"], "fps": anim["fps"], "keys": len(keys),
                      "frames": total, "how": how, "at": [round(float(f), 1) for f in frames]})
        log("slot %d: %s, %d frames at %g a second, on %d keys over %d frames here (%s)" % (
            slot, name, anim["frames"], anim["fps"], len(keys), total, how))
    return out, notes


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


def posed_dm(parts, verts, recs):
    """The vertices of a model file with a key's records laid on its parts (Actor.resolve)."""
    n = len(parts)
    mats, at = [None] * n, [None] * n

    def place(i):
        if mats[i] is None:
            parent, off = parts[i]
            pm, pt = place(parent) if parent >= 0 else (np.eye(3), np.zeros(3))
            r = recs[i]
            mats[i] = pm @ (rot_yxz(r[0:3]) * (r[7:10] / 4096.0))
            at[i] = pm @ (np.array(off) + r[4:7]) + pt
        return mats[i], at[i]

    for i in range(n):
        place(i)
    return np.array([mats[k] @ v[0:3] + at[k] for v, k in zip(verts, verts[:, 11])])


def poses(m, made, base, web, base_num, out, size=110, across=6):
    """Each slot in `across` of its keys from the side: the base above, the written model below."""
    bidx = np.asarray(Image.open(os.path.join(web, "assets", "models", "%03d.png" % base_num)))
    bpal = np.asarray(Image.open(os.path.join(web, "assets", "models", "%03dp.png" % base_num)))
    bparts = [(int(p[0]), p[1:4]) for p in base["raw_parts"]]
    canvas = np.full((size * 2 * len(made), size * across, 3), 235, np.uint8)
    mid = (base["lo"] + base["hi"]) / 2
    span = (base["hi"] - base["lo"]).max() * 1.9
    right, toward = np.array([0, 0, -1.0]), np.array([1.0, 0, 0])

    def look(verts, index, pal):
        def colour(ti, t, w0, w1, w2):
            u = np.clip((w0 * verts[t[0], 9] + w1 * verts[t[1], 9] + w2 * verts[t[2], 9]).astype(int), 0, index.shape[1] - 1)
            tv = np.clip((w0 * verts[t[0], 10] + w1 * verts[t[1], 10] + w2 * verts[t[2], 10]).astype(int), 0, index.shape[0] - 1)
            return pal[verts[t[0], 12]][index[tv, u]][..., :3]
        return colour

    for slot, keys in enumerate(made):
        pick = [round(i * (len(keys) - 1) / (across - 1)) for i in range(across)]
        for col, k in enumerate(pick):
            for row, (parts, verts, tris, recs, colour) in enumerate((
                    (bparts, base["v"], base["tris"], base["motions"][slot][k]["recs"], look(base["v"], bidx, bpal)),
                    (m["parts"], m["verts"], m["tris"], keys[k]["recs"], look(m["verts"], m["index"], m["palette"])))):
                cell = np.zeros((size, size, 3), np.uint8)
                raster(cell, posed_dm(parts, verts, recs), tris, colour, 0, size, mid, span, right, toward)
                canvas[(slot * 2 + row) * size:(slot * 2 + row + 1) * size, col * size:(col + 1) * size] = cell
    Image.fromarray(canvas).save(out)


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


def preview(m, base, web, base_num, out, size=240, show=()):
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
            c = pal[verts[t[0], 12]][index[tv, u]][..., :3]
            hit = [SHOW[show.index(int(verts[i, 11])) % len(SHOW)] for i in t if int(verts[i, 11]) in show]
            return c if not hit else np.broadcast_to(np.array(hit[0], np.uint8), c.shape)   # --show: the part in a plain colour
        return colour

    views = ((np.array([-1.0, 0, 0]), np.array([0, 0, -1.0])), (np.array([0, 0, -1.0]), np.array([1.0, 0, 0])))
    for k, (right, toward) in enumerate(views):
        raster(canvas, base["pos"], base["tris"], look(base["v"], bidx, bpal), k * size, size, mid, span, right, toward)
        raster(canvas, p, m["tris"], look(v, m["index"], m["palette"]), (2 + k) * size, size, mid, span, right, toward)
    Image.fromarray(canvas).save(out)


def make(geom, web, base_num, out_dir, num, fixed=None, chosen=None, images=None, anims=None, log=print, figures=None,
         detail=None, against=None, size=1.0):
    """Convert <geom> on the keys of the base model and write it as model <num>
    (tools/build_custom.py calls this for a card whose "model" names a Time Stranger model).
    detail: the disc model whose figures it may cost (the base's without it); figures:
    single figures given outright; against: the .geom of the base's own Time Stranger model;
    size: a factor on the size that comes of that."""
    base = read_dm(os.path.join(web, "assets", "models", "%03d.bin.gz" % base_num))
    log("base %03d: %d parts, %d triangles, texture %dx%d, %d palette rows" % (
        base_num, base["parts"], base["triangles"], base["width"], base["height"], base["rows"]))
    if detail is not None:
        like = read_dm(os.path.join(web, "assets", "models", "%03d.bin.gz" % detail))
        figures = dict({k: like[k] for k in FIGURES}, **(figures or {}))
        log("figures of %03d: %d parts, %d triangles, texture %dx%d, %d palette rows" % (
            detail, like["parts"], like["triangles"], like["width"], like["height"], like["rows"]))
    images = images or os.path.join(os.path.dirname(os.path.abspath(geom)), "images")
    prefix, chosen = anims or os.path.splitext(geom)[0] + "_", chosen or {}
    for k, v in (figures or {}).items():
        if k not in FIGURES or not 0 < v <= MOST[k]:
            raise ValueError("%s %s: the disc's models have at most %s" % (k, v, MOST.get(k, "no such figure")))
    m = convert(geom, images, base, fixed or {}, lambda s: log("  " + s), slot_anims(base, prefix, chosen), figures,
                source_height(against) if against else None, size)
    made, notes = motions(m, base, prefix, chosen, lambda s: log("  " + s))
    write(m, made, out_dir, num)
    return m, made, notes, base


def main():
    args = sys.argv[1:]
    opts, pos, fixed, chosen, figures = {}, [], {}, {}, {}
    i = 0
    while i < len(args):
        if args[i] in ("--images", "--preview", "--anims", "--poses", "--detail", "--against", "--show", "--size"):
            opts[args[i][2:]] = args[i + 1]
            i += 1
        elif args[i][2:] in FIGURES:
            figures[args[i][2:]] = int(args[i + 1])
            i += 1
        elif args[i] == "--part":
            n, name = args[i + 1].split("=")
            fixed[int(n)] = name
            i += 1
        elif args[i] == "--motion":
            n, name = args[i + 1].split("=")
            chosen[int(n)] = name
            i += 1
        else:
            pos.append(args[i])
        i += 1
    if len(pos) != 5:
        sys.exit(__doc__)
    geom, web, base_num, out_dir, num = pos[0], pos[1], int(pos[2]), pos[3], int(pos[4])
    m, made, notes, base = make(geom, web, base_num, out_dir, num, fixed, chosen, opts.get("images"), opts.get("anims"),
                                figures=figures, detail=int(opts["detail"]) if "detail" in opts else None,
                                against=opts.get("against"), size=float(opts.get("size", 1)))
    print("wrote %03d: %d parts, %d vertices, %d triangles, texture %dx%d, %d palette rows, %d motions" % (
        num, len(m["parts"]), len(m["verts"]), len(m["tris"]), m["index"].shape[1], m["index"].shape[0], len(m["palette"]), len(made)))
    print("  parts: " + " ".join("%d=%s" % (i, n) for i, n in enumerate(m["names"])))
    for x in notes:
        if x["motion"]:
            print("  slot %d %s: keys at its frames %s" % (x["slot"], x["motion"], " ".join("%g" % f for f in x["at"])))
    if "poses" in opts:
        poses(m, made, base, web, base_num, opts["poses"])
        print("poses: " + opts["poses"])
    if "preview" in opts:
        preview(m, base, web, base_num, opts["preview"], show=[int(x) for x in opts.get("show", "").split(",") if x])
        print("preview: " + opts["preview"])


if __name__ == "__main__":
    main()
