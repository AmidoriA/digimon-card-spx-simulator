"""Read a Digimon Story Time Stranger table file (.mbe).

Usage (run with tools/.venv python):
  python -I ts_mbe.py <file.mbe>                 list its tables: columns, rows
  python -I ts_mbe.py <file.mbe> <table> [text]  print the rows (those holding the text)

Layout. The reader in the executable is 0x140dcf480 (Steam build 23514637): it checks
"EXPA" at 0x140dcf6cf and "CHNK" at 0x140dcf992, and takes the row size from the file.
  "EXPA", u32 tables, then for each table:
    u32 length of the name, the name (NUL padded to that length)
    u32 columns, a u32 type for each
    u32 row size, u32 rows; the rows start at the next multiple of 8, and each row takes
    its size rounded up to a multiple of 8
  "CHNK", u32 entries, then for each: u32 offset in the file, u32 length, the string
    (NUL padded to that length). The string belongs to the 8 bytes at that offset, which
    lie in a row.
Walked this way all 740 .mbe files of app_0/data reach "CHNK" right after their last table.

Column types, worked out from how the rows are laid out, not read from the executable
(data: with these sizes the columns fill the row size and every CHNK offset falls on a
string column in 2,787 of the 2,788 tables of app_0/data; the one left has type 0):
  2 a 32-bit integer; 3 a 16-bit integer; 4 a byte; 5 a float;
  6, 7 and 8 a string, 8 bytes filled through CHNK;
  9 one bit: a run of such columns shares 32-bit words. Which bit of the word is the
    first column was not checked; this reads the lowest first.
  10 nothing: the column takes no room in the row.
  A column starts at a multiple of its own size; unused bytes hold 0xcc.
A table with a column of type 0 is listed but its rows are not read.
"""
import struct
import sys

SIZE = {2: 4, 3: 2, 4: 1, 5: 4, 6: 8, 7: 8, 8: 8, 10: 0}
FORMAT = {2: "<i", 3: "<h", 4: "<b", 5: "<f"}


def columns(types):
    """(offset, bit or None) of each column, and the bytes they take."""
    out, o, bit = [], 0, 32
    for t in types:
        if t == 9:
            if bit == 32:
                o = (o + 3) & ~3
                o += 4
                bit = 0
            out.append((o - 4, bit))
            bit += 1
            continue
        bit = 32
        if SIZE[t]:
            o = (o + SIZE[t] - 1) & ~(SIZE[t] - 1)
        out.append((o, None))
        o += SIZE[t]
    return out, o


def read(path):
    """{table: (types, rows)}; a row has a value for each column (None for type 10).
    rows is None for a table with a column type that is not known."""
    d = open(path, "rb").read()
    if d[:4] != b"EXPA":
        raise ValueError("not an EXPA file")
    ntab = struct.unpack_from("<I", d, 4)[0]
    p = 8
    heads = []
    for _ in range(ntab):
        nlen = struct.unpack_from("<I", d, p)[0]
        name = d[p + 4:p + 4 + nlen].split(b"\0")[0].decode("ascii")
        p += 4 + nlen
        ncol = struct.unpack_from("<I", d, p)[0]
        types = struct.unpack_from("<%dI" % ncol, d, p + 4)
        p += 4 + 4 * ncol
        rowsize, nrow = struct.unpack_from("<II", d, p)
        p = (p + 8 + 7) & ~7
        stride = (rowsize + 7) & ~7
        heads.append((name, types, rowsize, nrow, p, stride))
        p += stride * nrow
    if d[p:p + 4] != b"CHNK":
        raise ValueError("no CHNK after the tables")
    strings = {}
    n = struct.unpack_from("<I", d, p + 4)[0]
    p += 8
    for _ in range(n):
        off, ln = struct.unpack_from("<II", d, p)
        strings[off] = d[p + 8:p + 8 + ln].split(b"\0")[0].decode("utf-8", "replace")
        p += 8 + ln
    tables = {}
    for name, types, rowsize, nrow, base, stride in heads:
        if any(t != 9 and t not in SIZE for t in types):
            tables[name] = (types, None)
            continue
        cols, o = columns(types)
        if o != rowsize and (o + 3) & ~3 != rowsize and (o + 7) & ~7 != rowsize:
            raise ValueError("table %s: the columns take 0x%x bytes, the row is 0x%x" % (name, o, rowsize))
        rows = []
        for r in range(nrow):
            at = base + r * stride
            row = []
            for t, (off, bit) in zip(types, cols):
                if t == 9:
                    row.append(struct.unpack_from("<I", d, at + off)[0] >> bit & 1)
                elif t in FORMAT:
                    row.append(struct.unpack_from(FORMAT[t], d, at + off)[0])
                elif SIZE[t] == 8:
                    row.append(strings.get(at + off, ""))
                else:
                    row.append(None)
            rows.append(row)
        tables[name] = (types, rows)
    return tables


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    tables = read(sys.argv[1])
    if len(sys.argv) == 2:
        for name, (types, rows) in tables.items():
            print("%s: %s, columns %s" % (name, "%d rows" % len(rows) if rows is not None else "not read",
                                          " ".join(str(t) for t in types)))
        return
    types, rows = tables[sys.argv[2]]
    if rows is None:
        sys.exit("this table has a column type that is not known")
    want = sys.argv[3].lower() if len(sys.argv) > 3 else None
    for i, row in enumerate(rows):
        cells = ["" if v is None else ("%g" % v if isinstance(v, float) else str(v)) for v in row]
        if want is None or any(want in c.lower() for c in cells):
            sys.stdout.buffer.write(("%d\t%s\n" % (i, "\t".join(cells))).encode("utf-8"))


if __name__ == "__main__":
    main()
