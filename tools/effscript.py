"""Battle effect scripts (B/CBTL_EFF.ARC, "MSCD" streams run by 0x801f663c).

A script is a flat command stream after a 16-byte header:
  07 00 kk 00 | u32 0 | s32 value       set property kk
  0a 00 ss 00                           class 0x0a command
  0b 00 ss 00 | u16 0 | u16 param       class 0x0b command; ss = 0 plays sound effect `param`,
                                        ss = 6 waits `param` frames
  0c 00 ss 00 | u16 | u16 | u16 | u16   class 0x0c command
  09 00 ss 00 | 4 x s32                 class 0x09 command
Usage: effscript.py <extracted_dir>   prints the sound effects of every script.
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lzh  # noqa: E402


def members(arc):
    first = struct.unpack_from("<I", arc, 0)[0]
    offs = [o for o in struct.unpack_from("<%dI" % (first // 4), arc, 0) if o < len(arc)]
    return [arc[o:(offs[i + 1] if i + 1 < len(offs) else len(arc))] for i, o in enumerate(offs)]


def parse(o):
    assert o[:4] == b"MSCD"
    pos, out = 16, []
    while pos + 4 <= len(o):
        c, sub = struct.unpack_from("<HH", o, pos)
        if c == 7:
            out.append((7, sub, struct.unpack_from("<i", o, pos + 8)[0]))
            pos += 12
        elif c == 0x0A:
            out.append((0x0A, sub, 0))
            pos += 4
        elif c == 0x0B:
            out.append((0x0B, sub, struct.unpack_from("<H", o, pos + 6)[0]))
            pos += 8
        elif c == 0x0C:
            out.append((0x0C, sub, struct.unpack_from("<4H", o, pos + 4)))
            pos += 12
        elif c == 0x09:
            out.append((0x09, sub, struct.unpack_from("<4i", o, pos + 4)))
            pos += 20
        else:
            raise ValueError("unknown command class %#x at %#x" % (c, pos))
    return out


def sounds(cmds):
    """[(frame, se_id)] using the class 0x0b wait command (sub 6) as the clock."""
    t, out = 0, []
    for c, sub, p in cmds:
        if c == 0x0B and sub == 6:
            t += p
        elif c == 0x0B and sub == 0:
            out.append((t, p))
    return out


def load(ext):
    arc = open(os.path.join(ext, "drv", "B", "CBTL_EFF.ARC"), "rb").read()
    return [parse(lzh.decompress(m)) for m in members(arc)]


if __name__ == "__main__":
    for i, cmds in enumerate(load(sys.argv[1])):
        print("script %2d (%#04x): %s" % (i, i, " ".join("t%d:%02x" % s for s in sounds(cmds)) or "-"))
