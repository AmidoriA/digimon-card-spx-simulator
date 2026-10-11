"""Polygon Battle scripts (MSCD chunks, type 2, in F/NNN.PAK and other PAKs): parser.
Same VM as the board effect scripts (effscript.py) with 454 variables; adds command classes
0x0d/0x0e (3 and 4 arguments), 6 (skip n bytes) and 8 (inline data)."""
import struct


def parse(o):
    """-> (nvars, commands). Commands as lists; arguments are (indirect, value) pairs flattened."""
    assert o[:4] == b"MSCD"
    nvars = struct.unpack_from("<I", o, 12)[0]
    pos, out, at = 16, [], {}
    while pos + 4 <= len(o):
        c, sub = struct.unpack_from("<HH", o, pos)
        at[pos] = len(out)
        if c in (7, 9):
            op, ind, val = struct.unpack_from("<HHi", o, pos + 4)
            out.append([c, sub, op, ind, val]); pos += 12
        elif c == 5:
            out.append([5, struct.unpack_from("<I", o, pos + 4)[0]]); pos += 8
        elif c == 6:
            out.append([6]); pos += sub + 4
        elif c == 8:
            n = struct.unpack_from("<H", o, pos + 4)[0]
            out.append([8, sub, list(o[pos + 6:pos + 6 + n])]); pos += n + 6
        elif 0x0A <= c <= 0x0E:
            n = c - 0x0A
            out.append([c, sub] + list(struct.unpack_from("<%dH" % (2 * n), o, pos + 4))); pos += 4 + 4 * n
        else:
            raise ValueError("unknown command %#x at %#x" % (c, pos))
        pos = (pos + 3) & ~3
    for cmd in out:
        if cmd[0] == 5:
            cmd[1] = at[cmd[1] + 16]
    return nvars, out
