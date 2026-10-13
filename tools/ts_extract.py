"""Unpack Digimon Story Time Stranger's .mvgl archives (Steam, Windows).

Usage (run with tools/.venv python; needs the lz4 package of requirements.txt):
  python -I ts_extract.py <install> <out>                 unpack every archive
  python -I ts_extract.py <install> <out> --only <glob>   only paths matching, e.g. "*.geom"
  python -I ts_extract.py <install> <out> --archive app_0 only that archive (may repeat)
  python -I ts_extract.py <install> --list                print the tables, write nothing
  python -I ts_extract.py <install> --test                read and inflate every file, write nothing

<install> is the game's folder; its archives are read from <install>/gamedata and never
written. Each archive goes to <out>/<archive name>/, with <out>/_manifest.tsv listing
every file. The archives are not layered here: the same path in two archives is kept twice.

Layout, read from "Digimon Story Time Stranger.exe" (Steam build 23514637, image base
0x140000000; addresses are virtual addresses):

  header, 0x20 bytes. Read and checked at 0x1402c3f40: the first four bytes are compared
  with "MDB1" at 0x1402c40d2.
    +0x00 4s   "MDB1"
    +0x04 u32  number of tree nodes
    +0x08 u32  number of names
    +0x0c u32  number of data entries
    +0x10 u64  offset of the file data
    +0x18 u64  size of the archive (equals the file's size in every archive of this build;
               the routines read here do not use it)
  tables. Read at 0x1402c4240: nodes (16 bytes each) and names (0x80 bytes each) in one
  read at 0x20, then the data entries (24 bytes each) right after them.
    node  +0 s32 bit to test, +4 u32 data entry, +8 u32 left node, +12 u32 right node
          Node n belongs to name n. Node 0 is the root and names no file. The tree is
          walked by 0x1402cb030 (bit b of the key is bit b&7 of byte b>>3; the walk ends
          when the bit number stops growing) and the key is then compared with the name;
          the node's data entry is returned.
    name  +0 4s extension, padded with spaces, +4 124s path without the extension, with
          backslashes, NUL padded. The key is built the same way and lowercased at
          0x1402c4c60.
    data  +0 u64 offset from the file data, +8 u64 size, +16 u64 stored size
  file data. Read at 0x1402c46d0: stored size equal to size means the bytes are the file
  (0x1402c4813); otherwise they are one LZ4 block (0x140e31400 calls the decoder at
  0x140e33170 and takes the result only if it gives exactly `size` bytes).

Nothing is encrypted: the header is compared as read (fopen "rb", fseek, fread in
0x1402bfdb0) and the tables and data are used as read.
"""
import fnmatch
import os
import re
import struct
import sys

MAGIC = b"MDB1"
HEAD, NODE, NAME, DATA = 0x20, 16, 0x80, 24
NONE = 0xFFFFFFFF


def text(b):
    return b.split(b"\0")[0].decode("ascii", "replace")


def read_tables(f):
    """Yield (path, offset in the archive, size, stored size) for every file."""
    head = f.read(HEAD)
    if head[:4] != MAGIC:
        raise ValueError("not an MDB1 archive")
    nnode, nname, ndata = struct.unpack_from("<III", head, 4)
    start = struct.unpack_from("<Q", head, 0x10)[0]
    nodes = f.read(nnode * NODE)
    names = f.read(nname * NAME)
    data = f.read(ndata * DATA)
    for n in range(1, min(nnode, nname)):
        entry = struct.unpack_from("<I", nodes, n * NODE + 4)[0]
        if entry == NONE or entry >= ndata:
            continue
        rec = names[n * NAME:(n + 1) * NAME]
        ext = rec[:4].decode("ascii", "replace").rstrip(" \0")
        path = text(rec[4:]).replace("\\", "/")
        off, size, stored = struct.unpack_from("<QQQ", data, entry * DATA)
        yield (path + "." + ext if ext else path), start + off, size, stored


def read_file(f, off, size, stored):
    f.seek(off)
    raw = f.read(stored)
    if len(raw) != stored:
        raise ValueError("file data cut short")
    if stored == size:
        return raw
    import lz4.block
    out = lz4.block.decompress(raw, uncompressed_size=size)
    if len(out) != size:
        raise ValueError("LZ4 block gave %d bytes, table says %d" % (len(out), size))
    return out


def safe(path):
    """A relative path under the output folder, whatever the archive says."""
    parts = [re.sub(r'[<>:"|?*\x00-\x1f]', "_", p) for p in path.split("/")]
    return [p for p in parts if p and p not in (".", "..")]


def main():
    args = sys.argv[1:]
    only, archives, mode, pos = None, [], "unpack", []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--only":
            only = args[i + 1].lower()
            i += 1
        elif a == "--archive":
            archives.append(args[i + 1].lower())
            i += 1
        elif a in ("--list", "--test"):
            mode = a[2:]
        else:
            pos.append(a)
        i += 1
    if len(pos) != (2 if mode == "unpack" else 1):
        sys.exit(__doc__)
    gamedata = os.path.join(pos[0], "gamedata")
    out = pos[1] if mode == "unpack" else None
    man = None
    if out:
        os.makedirs(out, exist_ok=True)
        man = open(os.path.join(out, "_manifest.tsv"), "w", encoding="utf-8", newline="\n")
        man.write("archive\tpath\toffset\tsize\tstored\n")
    total = files = failed = 0
    for fn in sorted(os.listdir(gamedata)):
        if not fn.lower().endswith(".mvgl"):
            continue
        name = fn.split(".")[0]
        if archives and name.lower() not in archives:
            continue
        with open(os.path.join(gamedata, fn), "rb") as f:
            n = 0
            for path, off, size, stored in list(read_tables(f)):
                if only and not fnmatch.fnmatch(path.lower(), only):
                    continue
                n += 1
                total += size
                row = "%s\t%s\t%d\t%d\t%d" % (name, path, off, size, stored)
                if mode == "list":
                    print(row)
                    continue
                try:
                    body = read_file(f, off, size, stored)
                except Exception as e:  # keep going: one bad file must not hide the rest
                    failed += 1
                    print("FAILED %s/%s: %s" % (name, path, e), file=sys.stderr)
                    continue
                if out:
                    dst = os.path.join(out, name, *safe(path))
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    with open(dst, "wb") as o:
                        o.write(body)
                    man.write(row + "\n")
            files += n
            if mode != "list":
                print("%-22s %7d files" % (name, n), file=sys.stderr)
    if man:
        man.close()
    print("%d files, %d bytes, %d failed" % (files, total, failed), file=sys.stderr)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
