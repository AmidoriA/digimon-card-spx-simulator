"""Unpack the game's .DRV archives.

Usage: python -I extract_drv.py <disc_dir> <out_dir>

Layout observed in the disc's DRV files: a table of 32-byte entries
    +0  u8  kind (0x80 = sub-directory, 0x01 = file)
    +1  3s  extension (files only)
    +4  u32 offset, in 2048-byte sectors from the start of the .DRV
    +8  u32 size in bytes (0 for directories)
    +12 u32 timestamp
    +16 16s name, NUL padded
terminated by an all-zero entry.
"""
import os
import re
import struct
import sys

SEC = 2048


def entries(d, pos):
    while pos + 32 <= len(d):
        e = d[pos:pos + 32]
        if e[0] not in (0x01, 0x80):
            return
        off, size, ts = struct.unpack_from("<III", e, 4)
        raw = e[16:32].split(b"\0")[0]
        name = raw.decode("ascii", "replace")
        name = re.sub(r"[^A-Za-z0-9_\-]", "_", name) or "_"
        ext = e[1:4].decode("ascii", "replace") if e[0] == 1 else ""
        yield e[0], ext, off, size, name
        pos += 32


def walk(d, pos, outdir, rel, man, seen):
    if pos in seen:
        return
    seen.add(pos)
    for kind, ext, off, size, name in entries(d, pos):
        if kind == 0x80:
            walk(d, off * SEC, outdir, rel + name + "/", man, seen)
        else:
            path = rel + name + "." + ext
            dst = os.path.join(outdir, *path.split("/"))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, "wb") as o:
                o.write(d[off * SEC:off * SEC + size])
            man.write("%s\t%d\t%d\n" % (path, off * SEC, size))


def main():
    disc, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "_manifest.tsv"), "w") as man:
        man.write("path\toffset\tsize\n")
        for fn in sorted(os.listdir(disc)):
            if not fn.endswith(".DRV"):
                continue
            d = open(os.path.join(disc, fn), "rb").read()
            walk(d, 0, outdir, fn[0] + "/", man, set())


if __name__ == "__main__":
    main()
