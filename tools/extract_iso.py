"""Extract the ISO9660 filesystem from a PS1 MODE2/2352 raw BIN image.

Usage: python -I extract_iso.py <image.bin> <out_dir>

Form 1 sectors yield 2048 data bytes at offset 24. XA/STR files (Form 2,
interleaved audio/video) are dumped as raw 2352-byte sectors with a .raw2352
suffix so nothing is silently truncated.
"""
import os
import struct
import sys

SECTOR = 2352
HDR = 24
DATA = 2048


class Bin:
    def __init__(self, path):
        self.f = open(path, "rb")
        self.size = os.path.getsize(path)
        self.nsec = self.size // SECTOR

    def raw(self, lba):
        self.f.seek(lba * SECTOR)
        return self.f.read(SECTOR)

    def read(self, lba, length):
        out = bytearray()
        n = (length + DATA - 1) // DATA
        self.f.seek(lba * SECTOR)
        for _ in range(n):
            s = self.f.read(SECTOR)
            out += s[HDR:HDR + DATA]
        return bytes(out[:length])


def parse_dir(b, lba, length):
    data = b.read(lba, length)
    i = 0
    entries = []
    while i < len(data):
        rl = data[i]
        if rl == 0:
            # records never span sectors; skip to next sector boundary
            i = (i // DATA + 1) * DATA
            continue
        rec = data[i:i + rl]
        ext_lba = struct.unpack_from("<I", rec, 2)[0]
        size = struct.unpack_from("<I", rec, 10)[0]
        flags = rec[25]
        nl = rec[32]
        name = rec[33:33 + nl]
        # XA attributes live in the system-use area after the (padded) name
        su = 33 + nl + (1 - nl % 2)
        xa_attr = None
        if su + 14 <= rl and rec[su + 6:su + 8] == b"XA":
            xa_attr = struct.unpack_from(">H", rec, su + 4)[0]
        i += rl
        if name in (b"\x00", b"\x01"):
            continue
        entries.append({
            "name": name.decode("ascii", "replace").split(";")[0],
            "lba": ext_lba,
            "size": size,
            "dir": bool(flags & 2),
            "xa": xa_attr,
        })
    return entries


def walk(b, lba, length, prefix, out):
    for e in parse_dir(b, lba, length):
        path = prefix + e["name"]
        if e["dir"]:
            walk(b, e["lba"], e["size"], path + "/", out)
        else:
            e["path"] = path
            out.append(e)


def main():
    img, outdir = sys.argv[1], sys.argv[2]
    b = Bin(img)
    pvd = b.read(16, DATA)
    assert pvd[1:6] == b"CD001", "no ISO9660 PVD"
    print("system:", pvd[8:40].decode().strip(), "| volume:", pvd[40:72].decode().strip())
    root = pvd[156:190]
    root_lba = struct.unpack_from("<I", root, 2)[0]
    root_len = struct.unpack_from("<I", root, 10)[0]
    files = []
    walk(b, root_lba, root_len, "", files)
    files.sort(key=lambda e: e["lba"])
    with open(os.path.join(outdir, "_manifest.tsv"), "w") as man:
        man.write("path\tlba\tsize\txa_attr\tmode\n")
        for e in files:
            # XA attr bit 0x1000 = Form2, 0x4000 = interleaved; 0x0800 = Form1
            form2 = e["xa"] is not None and (e["xa"] & 0x5000)
            dst = os.path.join(outdir, *e["path"].split("/"))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if form2:
                nsec = (e["size"] + DATA - 1) // DATA
                b.f.seek(e["lba"] * SECTOR)
                with open(dst + ".raw2352", "wb") as o:
                    o.write(b.f.read(nsec * SECTOR))
                mode = "form2-raw"
            else:
                with open(dst, "wb") as o:
                    o.write(b.read(e["lba"], e["size"]))
                mode = "form1"
            xa = "%04x" % e["xa"] if e["xa"] is not None else "-"
            man.write("%s\t%d\t%d\t%s\t%s\n" % (e["path"], e["lba"], e["size"], xa, mode))
            print("%-40s lba=%-7d size=%-10d xa=%s %s" % (e["path"], e["lba"], e["size"], xa, mode))
    print("files:", len(files), "| image sectors:", b.nsec)


if __name__ == "__main__":
    main()
