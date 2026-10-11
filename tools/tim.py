"""PlayStation TIM decoding (4/8/16 bpp) to PIL images."""
import struct

from PIL import Image


def _rgba(c, transparent_black=True):
    r = (c & 31) << 3
    g = ((c >> 5) & 31) << 3
    b = ((c >> 10) & 31) << 3
    r |= r >> 5
    g |= g >> 5
    b |= b >> 5
    a = 255
    if transparent_black and c == 0:
        a = 0
    return (r, g, b, a)


def decode(data, off=0, clut_index=0, transparent_black=False):
    """Decode one TIM at data[off:]. Returns (PIL.Image, bytes_consumed) or (None, 0)."""
    if len(data) < off + 20 or struct.unpack_from("<I", data, off)[0] != 0x10:
        return None, 0
    flags = struct.unpack_from("<I", data, off + 4)[0]
    bpp_mode = flags & 7
    has_clut = flags & 8
    p = off + 8
    palettes = []
    if has_clut:
        blen, _, _, cw, ch = struct.unpack_from("<IHHHH", data, p)
        cols = struct.unpack_from("<%dH" % (cw * ch), data, p + 12)
        for i in range(ch):
            palettes.append([_rgba(c, transparent_black) for c in cols[i * cw:(i + 1) * cw]])
        p += blen
    blen, _, _, w, h = struct.unpack_from("<IHHHH", data, p)
    px = data[p + 12:p + blen]
    end = p + blen
    if bpp_mode == 0:
        width = w * 4
        pal = palettes[min(clut_index, len(palettes) - 1)]
        img = Image.new("RGBA", (width, h))
        out = []
        for b in px[:w * 2 * h]:
            out.append(pal[b & 15])
            out.append(pal[b >> 4])
        img.putdata(out)
    elif bpp_mode == 1:
        width = w * 2
        pal = palettes[min(clut_index, len(palettes) - 1)]
        img = Image.new("RGBA", (width, h))
        img.putdata([pal[b] for b in px[:width * h]])
    elif bpp_mode == 2:
        width = w
        img = Image.new("RGBA", (width, h))
        vals = struct.unpack_from("<%dH" % (width * h), px, 0)
        img.putdata([_rgba(c, transparent_black) for c in vals])
    else:
        return None, 0
    return img, end - off
