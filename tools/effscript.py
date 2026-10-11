"""Battle effect scripts (B/CBTL_EFF.ARC, "MSCD" streams).

Each member is packed with the game's LZSS+Huffman scheme (lzh.py). A script is a small
program for the reader at 0x80020f54, run once per frame by the interpreter at 0x801f663c
on a block of 190 s32 variables:

  05 00 | u16 0 | u32 offset                      jump (offset from the end of the 16-byte header)
  07 00 | u16 var | u16 op | u16 ind | s32 val    var = var <op> val (or var[val] if ind);
                                                  op 0 set, 1 add, 2 sub, 3 mul, 4 div, 5 mod,
                                                  6 rand() % (val + 1)
  09 00 | u16 var | u16 op | u16 ind | s32 val    test; when it holds the next command is skipped
  0a 00 | u16 sub                                 host command, no argument
  0b 00 | u16 sub | (u16 ind, u16 val)            host command, 1 argument
  0c 00 | u16 sub | (u16 ind, u16 val) x 2        host command, 2 arguments

Host commands (interpreter): 0b/0 play sound, 0b/4 and 0b/5 switch an effect slot on and off,
0b/6 wait n frames, 0c/0 create an effect object (slot, type) from the current variables, the
rest place effects on cards or tint cards. See web/js/effects.js for the object types.

Usage: effscript.py <extracted_dir>            list the host commands of every script
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lzh  # noqa: E402

SIZE = {5: 8, 7: 12, 9: 12, 0x0A: 4, 0x0B: 8, 0x0C: 12, 0x0D: 16, 0x0E: 20}


def members(arc):
    first = struct.unpack_from("<I", arc, 0)[0]
    offs = [o for o in struct.unpack_from("<%dI" % (first // 4), arc, 0) if o < len(arc)]
    return [arc[o:(offs[i + 1] if i + 1 < len(offs) else len(arc))] for i, o in enumerate(offs)]


def parse(o):
    """-> list of commands; jump targets are command indices."""
    assert o[:4] == b"MSCD"
    pos, out, at = 16, [], {}
    while pos + 4 <= len(o):
        c, sub = struct.unpack_from("<HH", o, pos)
        at[pos] = len(out)
        if c in (7, 9):
            op, ind, val = struct.unpack_from("<HHi", o, pos + 4)
            out.append([c, sub, op, ind, val])
        elif c == 5:
            out.append([5, struct.unpack_from("<I", o, pos + 4)[0]])
        elif c in (0x0A, 0x0B, 0x0C):
            n = c - 0x0A
            out.append([c, sub] + list(struct.unpack_from("<%dH" % (2 * n), o, pos + 4)))
        else:
            raise ValueError("unknown command %#x at %#x" % (c, pos))
        pos += SIZE[c]
    for cmd in out:
        if cmd[0] == 5:
            cmd[1] = at[cmd[1] + 16]
    return out


def sounds(cmds):
    """[(frame, se_id)] on the straight-line path, using the wait command as the clock."""
    t, out = 0, []
    for c in cmds:
        if c[0] == 0x0B and c[1] == 6:
            t += c[3]
        elif c[0] == 0x0B and c[1] == 0:
            out.append((t, c[3]))
    return out


def load(ext):
    arc = open(os.path.join(ext, "drv", "B", "CBTL_EFF.ARC"), "rb").read()
    return [parse(lzh.decompress(m)) for m in members(arc)]


if __name__ == "__main__":
    for i, cmds in enumerate(load(sys.argv[1])):
        host = ["%x.%d(%s)" % (c[0], c[1], ",".join(str(v) for v in c[3::2])) for c in cmds if c[0] >= 0x0A]
        print("script %#04x: %s" % (i, " ".join(host)))
