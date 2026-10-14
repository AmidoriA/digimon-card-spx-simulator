"""Read a Digimon Story Time Stranger motion (.anim).

Usage (run with tools/.venv python):
  python -I ts_anim_read.py <file.anim> [...]            one line each: frames, length, channels
  python -I ts_anim_read.py <file.anim> --tracks         the keys of every channel
  python -I ts_anim_read.py <file.anim> --png out.png --geom chrNNN.geom [--frame N]
                                                        draw the model in that frame's pose

The loader in the executable is 0x1402dcd60 (Steam build 23514637): it reads <name>.anim
whole. The layout below was worked out from the files, not from a routine; README, "Time
Stranger motions", says how each part was checked. Offsets in the header that are marked
"rel" count from the field that holds them.

  +0x00 "80AE"            +0x04 float length in seconds      +0x08 float frames a second
  +0x0e u16 bones         +0x10 u16 frames                   +0x12 u16 chunks
  +0x16 u16 x8: the number of channels that do not change (rotation, position, scale,
        float) and of those that do (the same four)
  +0x38 rel chunk table, 8 bytes a chunk: u32, u32 offset of the chunk
  +0x3c rel chunk frames, 4 bytes a chunk: u16 first frame, u16 frames after it
  +0x40, +0x44, +0x48 rel the values of the unchanging rotations (6 bytes each),
        positions and scales (3 floats each)
  +0x60 the bone of each channel, u16, one list for each of the eight counts in their
        order; a list is filled up with the bone count to a multiple of 4 entries (the
        first list to a multiple of 8)
  chunk: 8 u32 sizes (first-frame rotations, positions, scales, floats; later rotations,
        positions, scales, floats; the scale and float sizes take in the padding), then
        those blocks in that order with a table of bits before the "later" ones. The
        table has, channel after channel, one bit for each frame after the chunk's
        first, highest bit of a byte first: set where the channel has a value stored.
  rotation: 6 bytes read as one 48-bit number, highest byte first: the lowest 2 bits tell
        which of x y z w was left out (the largest, taken positive), above them three
        15-bit numbers n for the others in their order, each (n - 16383) / 16384 /
        sqrt(2); the highest bit is not used.
A position is added to the bone's rest position, and a rotation is made after the bone's
rest rotation (rest x motion): both are what the motion changes of the rest pose. Data:
nearly every bone's rest rotation is none, so the rotation looks like the bone's whole
rotation, which this reader took it for until TS-207. Guilmon's right ear has a rest
rotation (half a turn about x; the left ear has none) and the same stored values as the
left: taken whole, the right ear hangs down in every motion; made after the rest rotation
it is the left ear's mirror image to three decimals in every frame tried, and the other
order (motion x rest) is not. Between two stored values the reader interpolates in a
straight line, which is this reader's choice, not something read.
"""
import os
import struct
import sys

import numpy as np

KINDS = ("rotation", "position", "scale", "float")


def quat(b):
    """6 bytes -> x, y, z, w."""
    v = int.from_bytes(b, "big")
    which = v & 3
    c = [((v >> s & 0x7FFF) - 16383) / 16384.0 * 0.7071067811865476 for s in (32, 17, 2)]
    c.insert(which, max(0.0, 1.0 - c[0] * c[0] - c[1] * c[1] - c[2] * c[2]) ** 0.5)
    return tuple(c)


def read(path):
    d = open(path, "rb").read()
    if d[:4] != b"80AE":
        raise ValueError("not an 80AE file")
    length, fps = struct.unpack_from("<ff", d, 4)
    nbone, nframe, nchunk = struct.unpack_from("<HHH", d, 0x0E)
    cnt = struct.unpack_from("<8H", d, 0x16)
    rel = lambda o: o + struct.unpack_from("<I", d, o)[0]
    if cnt[3]:
        raise ValueError("unchanging float channels: not read")
    o = 0x60
    bones = []
    for i, c in enumerate(cnt):
        pad = 8 if i == 0 else 4
        n = (c + pad - 1) // pad * pad
        vals = struct.unpack_from("<%dH" % n, d, o)
        if i < 7 and (any(v >= nbone for v in vals[:c]) or any(v != nbone for v in vals[c:])):
            raise ValueError("channel list %d does not read" % i)
        bones.append(list(vals[:c]))
        o += 2 * n
    static = {}
    p = rel(0x40)
    for i, b in enumerate(bones[0]):
        static[("rotation", b)] = quat(d[p + 6 * i:p + 6 * i + 6])
    for kind, field, lst in (("position", 0x44, bones[1]), ("scale", 0x48, bones[2])):
        p = rel(field)
        for i, b in enumerate(lst):
            static[(kind, b)] = struct.unpack_from("<3f", d, p + 12 * i)
    nrot, nloc, nscl, nflt = cnt[4:]
    chan = [("rotation", b) for b in bones[4]] + [("position", b) for b in bones[5]] + \
           [("scale", b) for b in bones[6]] + [("float", b) for b in bones[7]]
    keys = {c: [] for c in chan}
    ctab, cfr = rel(0x38), rel(0x3C)
    total = 0
    for c in range(nchunk):
        off = struct.unpack_from("<I", d, ctab + 8 * c + 4)[0]
        end = struct.unpack_from("<I", d, ctab + 8 * c + 12)[0] if c + 1 < nchunk else len(d)
        first, more = struct.unpack_from("<HH", d, cfr + 4 * c)
        total += more + 1
        h = struct.unpack_from("<8I", d, off)
        nbytes = (more * len(chan) + 7) // 8
        if h[0] != nrot * 6 or h[1] != nloc * 12 or not nscl * 12 <= h[2] < nscl * 12 + 4 or \
                0x20 + sum(h) + nbytes != end - off:
            raise ValueError("chunk %d: its sizes do not add up" % c)
        p0 = off + 0x20
        bits = np.unpackbits(np.frombuffer(d, np.uint8, nbytes, p0 + sum(h[:4])))[:more * len(chan)].reshape(len(chan), more)
        size = [6] * nrot + [12] * (nloc + nscl) + [4] * nflt
        # where each kind's first-frame block and later block start
        start0 = [p0, p0 + h[0], p0 + h[0] + h[1], p0 + h[0] + h[1] + h[2]]
        later = p0 + sum(h[:4]) + nbytes
        start1 = [later, later + h[4], later + h[4] + h[5], later + h[4] + h[5] + h[6]]
        group = [0] * nrot + [1] * nloc + [2] * nscl + [3] * nflt
        used = [0, 0, 0, 0]
        seen0 = [0, 0, 0, 0]
        for ci, ch in enumerate(chan):
            g, s = group[ci], size[ci]

            def value(at):
                if g == 0:
                    return quat(d[at:at + 6])
                return struct.unpack_from("<3f" if g < 3 else "<f", d, at)

            keys[ch].append((first, value(start0[g] + seen0[g])))
            seen0[g] += s
            for fr in np.nonzero(bits[ci])[0]:
                keys[ch].append((first + 1 + int(fr), value(start1[g] + used[g])))
                used[g] += s
        if used[0] != h[4] or used[1] != h[5] or not used[2] <= h[6] < used[2] + 4 or not used[3] <= h[7] < used[3] + 16:
            raise ValueError("chunk %d: the bit table does not match the stored sizes" % c)
    if total != nframe:
        raise ValueError("the chunks hold %d frames, the header says %d" % (total, nframe))
    return {"length": length, "fps": fps, "bones": nbone, "frames": nframe, "chunks": nchunk,
            "static": static, "keys": keys, "counts": cnt}


def sample(anim, frame):
    """{(kind, bone): value} at a frame, straight-line between the stored values."""
    out = dict(anim["static"])
    for ch, ks in anim["keys"].items():
        prev = nxt = None
        for k in ks:
            if k[0] <= frame:
                prev = k
            elif nxt is None:
                nxt = k
                break
        if prev is None:
            out[ch] = nxt[1]
        elif nxt is None or prev[0] == frame:
            out[ch] = prev[1]
        else:
            t = (frame - prev[0]) / (nxt[0] - prev[0])
            a, b = np.array(prev[1]), np.array(nxt[1])
            if ch[0] == "rotation":
                if a @ b < 0:
                    b = -b
                v = a + (b - a) * t
                out[ch] = tuple(v / np.linalg.norm(v))
            else:
                out[ch] = tuple(a + (b - a) * t)
    return out


def turned(a, b):
    """The rotation b made after a, both (x, y, z, w): a x b."""
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return (aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz)


def posed(g, pose):
    """The model's bones with a sampled pose laid over the rest pose."""
    bones = []
    for i, b in enumerate(g["bones"]):
        nb = dict(b)
        if ("rotation", i) in pose:
            nb["rotation"] = turned(b["rotation"], pose[("rotation", i)])
        if ("position", i) in pose:
            nb["position"] = tuple(np.array(b["position"]) + np.array(pose[("position", i)]))
        if ("scale", i) in pose:
            nb["scale"] = pose[("scale", i)]
        bones.append(nb)
    return bones


def draw_pose(geom, anim, frame, out):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import ts_model_read as t
    g = t.read_geom(geom)
    world = t.rest_world(posed(g, sample(anim, frame)))
    skin = [w @ b["inverse_bind"] for w, b in zip(world, g["bones"])]
    for m in g["meshes"]:
        a = m["attributes"]
        p = np.concatenate([a["POSITION"][:, :3].astype(np.float64), np.ones((m["vertices"], 1))], 1)
        pal = m["palette"]
        if "BLENDINDICES" in a:
            w = a["BLENDWEIGHT"].astype(np.float64)
            w /= np.maximum(w.sum(1, keepdims=True), 1e-9)
            res = np.zeros((m["vertices"], 3))
            for k in range(w.shape[1]):
                mats = np.stack([skin[pal[j]] for j in a["BLENDINDICES"][:, k]])
                res += w[:, k:k + 1] * np.einsum("nij,nj->ni", mats, p)[:, :3]
        else:
            mats = np.stack([skin[int(b)] for b in t.rigid_bones(m)])
            res = np.einsum("nij,nj->ni", mats, p)[:, :3]
        a["POSITION"] = res.astype(np.float32)
    images = os.path.join(os.path.dirname(os.path.abspath(geom)), "images")
    return t.draw(g, images, out, False, True)


def main():
    args = sys.argv[1:]
    opts, files = {}, []
    i = 0
    while i < len(args):
        if args[i] in ("--png", "--geom", "--frame"):
            opts[args[i][2:]] = args[i + 1]
            i += 1
        elif args[i] == "--tracks":
            opts["tracks"] = True
        else:
            files.append(args[i])
        i += 1
    if not files:
        sys.exit(__doc__)
    for f in files:
        a = read(f)
        c = a["counts"]
        print("%-22s %3d frames %6.3f s at %g a second, %d bones; unchanging %d rotations %d positions %d scales; "
              "changing %d rotations %d positions %d scales %d floats" % (
                  os.path.basename(f), a["frames"], a["length"], a["fps"], a["bones"], c[0], c[1], c[2], c[4], c[5], c[6], c[7]))
        if opts.get("tracks"):
            for ch, v in sorted(a["static"].items()):
                print("  %-8s bone %3d unchanging %s" % (ch[0], ch[1], " ".join("%.4f" % x for x in v)))
            for ch, ks in a["keys"].items():
                print("  %-8s bone %3d %d values at frames %s" % (ch[0], ch[1], len(ks), " ".join(str(k[0]) for k in ks[:24])))
        if "png" in opts:
            draw_pose(opts["geom"], a, float(opts.get("frame", 0)), opts["png"])
            print("  drew frame %s to %s" % (opts.get("frame", 0), opts["png"]))


if __name__ == "__main__":
    main()
