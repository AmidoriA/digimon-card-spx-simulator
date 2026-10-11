"""Trace a Polygon Battle script: prints its host commands in time order with the node
variables each object is created from. Usage: btrace.py <pak file> <script id> [seed]"""
import os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pak, bscript

NODE = ["px", "py", "pz", "tx", "ty", "tz", "spd", "acc", "rx", "ry", "rz", "rvx", "rvy", "rvz", "rax", "ray", "raz",
        "sx", "sy", "sz", "stx", "sty", "stz", "ssx", "ssy", "ssz", "hit", "dur", "fmode", "fstep", "type", "dly",
        "b7", "b8", "parent", "1ba", "1bb", "1bc", "1bd", "who"]
EXTRA = {15: (0x3b, 0x4a, 0x12c, 0x12e, 0x142), 16: (0x3b, 0x4f, 0x142), 3: (),
         0: (0x1e, 0x20, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x48, 0x50, 0x51, 0x52, 0x53),
         17: (0x1bf, 0x1c0, 0x1c1, 0x1c2, 0x1c3, 0x1c4, 0x1c5, 0x64, 0x65, 0x66, 0x67, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e),
         13: (0x41, 0x42, 0x43, 0x44, 0x45, 0x17, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x3b)}


def node(v):
    out = []
    for i, n in enumerate(NODE):
        x = v[0x197 + i]
        if x != (4096 if n in ("sx", "sy", "sz", "stx", "sty", "stz") else 0):
            out.append("%s=%d" % (n, x))
    return " ".join(out)


def run(cmds, nv, out=print, maxcmd=200000):
    v, pc, skip, t, n = [0] * nv, 0, False, 0, 0
    while pc < len(cmds) and n < maxcmd:
        n += 1
        c = cmds[pc]
        pc += 1
        if skip:
            skip = False
            continue
        if c[0] == 7:
            _, var, op, ind, val = c
            x = v[val] if ind else val
            if op == 0: v[var] = x
            elif op == 1: v[var] += x
            elif op == 2: v[var] -= x
            elif op == 3: v[var] *= x
            elif op == 4: v[var] = int(v[var] / x) if x else 0
            elif op == 5: v[var] = v[var] % x if x else 0
            elif op == 6: v[var] = random.randrange(32768) % (x + 1)
        elif c[0] == 9:
            _, var, op, ind, val = c
            x = v[val] if ind else val
            skip = {0: v[var] == x, 1: v[var] != x, 2: v[var] < x, 3: v[var] > x, 4: v[var] <= x, 5: v[var] >= x}[op]
        elif c[0] == 5:
            pc = c[1]
        elif c[0] >= 0xA:
            a = [(v[c[3 + 2 * i]] & 0xFFFF if c[2 + 2 * i] else c[3 + 2 * i]) for i in range(c[0] - 0xA)]
            a = [x - 65536 if x > 32767 else x for x in a]
            if c[0] == 0xB and c[1] == 10:
                t += a[0]
            elif c[0] == 0xC and c[1] == 0:
                out("t%4d NEW slot %d type %d | %s | %s" % (t, a[0], a[1], node(v), " ".join("%x=%d" % (k, v[k]) for k in EXTRA.get(a[1], ()))))
            else:
                out("t%4d %x.%d%s who=%d" % (t, c[0], c[1], a, v[0x1BE]))
    return t


if __name__ == "__main__":
    random.seed(int(sys.argv[3]) if len(sys.argv) > 3 else 1)
    for typ, cid, b in pak.chunks(open(sys.argv[1], "rb").read()):
        if typ == 2 and cid == int(sys.argv[2]):
            nv, cmds = bscript.parse(b)
            print("total frames:", run(cmds, nv))
