"""PAK chunk lists (models, motions, scripts, textures of the 3D battle).
chunks(data) -> [(type, id, bytes)]; type 1 (models) and others may be LZH-packed: unpack()."""
import os, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lzh


def chunks(d):
    out, pos = [], 0
    while pos + 8 <= len(d):
        t, n = struct.unpack_from("<II", d, pos)
        if n == 0:
            break
        out.append((t & 0xFFFF, t >> 16, d[pos + 8:pos + 8 + n]))
        pos = (pos + 8 + n + 3) & ~3
    return out


def unpack(b):
    """LZH-unpack a chunk if it carries a plausible big-endian size, else return it as is."""
    size = struct.unpack(">I", b[:4])[0]
    if 0 < size < len(b) * 40 and b[:4] != b"MSCD":
        try:
            return lzh.decompress(b)
        except Exception:
            pass
    return b
