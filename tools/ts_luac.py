"""List what a compiled Time Stranger script (.lua, Lua 5.2 bytecode) sets and holds.

Usage:
  python -I ts_luac.py <file.lua>            the globals its main chunk sets to a constant
  python -I ts_luac.py <file.lua> --consts   every constant of every function, in order

The files are standard Lua 5.2 bytecode ("\\x1bLua", version 0x52, 4-byte int, 8-byte
size_t, 4-byte instructions, 8-byte numbers): nothing of this format is the game's own.
A global set to a constant is the instruction SETTABUP (opcode 8) with both its key and
its value taken from the function's constants.
"""
import struct
import sys


class Reader:
    def __init__(self, d):
        self.d, self.p = d, 18
        if d[:6] != b"\x1bLuaR\0" or d[6:12] != bytes([1, 4, 8, 4, 8, 0]):
            raise ValueError("not Lua 5.2 bytecode of the expected sizes")

    def take(self, fmt):
        v = struct.unpack_from(fmt, self.d, self.p)
        self.p += struct.calcsize(fmt)
        return v[0] if len(v) == 1 else v

    def string(self):
        n = self.take("<Q")
        s = self.d[self.p:self.p + n]
        self.p += n
        return s[:-1].decode("utf-8", "replace") if n else None

    def function(self):
        self.take("<iiBBB")
        code = [self.take("<I") for _ in range(self.take("<i"))]
        consts = []
        for _ in range(self.take("<i")):
            t = self.take("<B")
            consts.append(None if t == 0 else bool(self.take("<B")) if t == 1 else
                          self.take("<d") if t == 3 else self.string())
        protos = [self.function() for _ in range(self.take("<i"))]
        for _ in range(self.take("<i")):
            self.take("<BB")
        self.string()
        lines = self.take("<i")
        self.p += 4 * lines
        for _ in range(self.take("<i")):
            self.string()
            self.take("<ii")
        for _ in range(self.take("<i")):
            self.string()
        return {"code": code, "consts": consts, "protos": protos}


def read(path):
    return Reader(open(path, "rb").read()).function()


def globals_set(fn):
    """[(name, constant)] for each SETTABUP with a constant key and a constant value."""
    out = []
    for ins in fn["code"]:
        op, c, b = ins & 0x3F, ins >> 14 & 0x1FF, ins >> 23 & 0x1FF
        if op == 8 and b >= 256 and c >= 256:
            out.append((fn["consts"][b - 256], fn["consts"][c - 256]))
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    fn = read(sys.argv[1])
    if "--consts" in sys.argv:
        def walk(f, depth):
            print("  " * depth + "function: " + ", ".join(repr(c) for c in f["consts"]))
            for q in f["protos"]:
                walk(q, depth + 1)
        walk(fn, 0)
        return
    for name, value in globals_set(fn):
        print("%s\t%s" % (name, int(value) if isinstance(value, float) and value == int(value) else value))


if __name__ == "__main__":
    main()
