"""Dump every TIM inside the B/*.ARC archives (and loose B/*.TIM) to PNG for inspection.

Usage: extract_ui.py <extracted_dir> <out_dir>
ARC layout: u32 offset table (first entry = table size), each member a TIM (or raw data).
"""
import os, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tim

def members(d):
    first = struct.unpack_from("<I", d, 0)[0]
    if first < 4 or first > len(d) or first % 4:
        return []
    offs = list(struct.unpack_from("<%dI" % (first // 4), d, 0))
    offs = [o for o in offs if 0 < o <= len(d)]
    out = []
    for i, o in enumerate(offs):
        e = offs[i + 1] if i + 1 < len(offs) else len(d)
        if e > o:
            out.append((o, e))
    return out

def main():
    ext, out = sys.argv[1], sys.argv[2]
    names = sys.argv[3:] or ["CBTL_SYS", "BG", "M_CARD", "P_CARD", "BCARD", "FONT", "CBTL_EFF", "SYSTEM", "CARD_F"]
    bdir = os.path.join(ext, "drv", "B")
    for n in names:
        p = os.path.join(bdir, n + ".ARC")
        if os.path.exists(p):
            d = open(p, "rb").read()
            mem = members(d)
        else:
            d = open(os.path.join(bdir, n + ".TIM"), "rb").read()
            mem = [(0, len(d))]
        os.makedirs(os.path.join(out, n), exist_ok=True)
        for i, (o, e) in enumerate(mem):
            chunk = d[o:e]
            if chunk[:4] != b"\x10\0\0\0":
                print("%s[%d] off=%x size=%d not TIM: %s" % (n, i, o, e - o, chunk[:8].hex()))
                continue
            flags = struct.unpack_from("<I", chunk, 4)[0]
            nclut = 1
            if flags & 8:
                cw, ch = struct.unpack_from("<HH", chunk, 16)
                nclut = ch
            for c in range(min(nclut, 16)):
                img, _ = tim.decode(chunk, 0, c, transparent_black=True)
                if img is None:
                    break
                img.save(os.path.join(out, n, "%02d_c%02d.png" % (i, c)))
            pos = struct.unpack_from("<HH", chunk, 8 + (struct.unpack_from("<I", chunk, 8)[0] if flags & 8 else 0) + 4)
            print("%s[%d] bpp=%d cluts=%d size=%s vram=%s" % (n, i, [4, 8, 16][flags & 3], nclut, img.size if img else None, pos))

main()
