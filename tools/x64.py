"""Small x86-64 disassembly helper for Time Stranger's Windows executable.

Usage (run with tools/.venv python):
  x64.py <exe> sections               list the PE sections
  x64.py <exe> dis <va> [count]       disassemble count instructions at va
  x64.py <exe> func <va>              disassemble the function containing va (.pdata)
  x64.py <exe> xref <va>              list rip-relative references and call/jmp to va
  x64.py <exe> find <hex bytes>       list every va where the bytes occur
  x64.py <exe> str <text>             list every va where the ASCII text occurs
  x64.py <exe> imm <value>            list instructions in .text using a 32-bit immediate
  x64.py <exe> bytes <va> [count]     hex dump

Addresses are virtual addresses (image base included), as a debugger shows them.
The executable is read where it is installed; nothing is written.
"""
import struct
import sys

import capstone


class PE:
    def __init__(self, path):
        self.d = d = open(path, "rb").read()
        pe = struct.unpack_from("<I", d, 0x3C)[0]
        assert d[pe:pe + 4] == b"PE\0\0", "not a PE file"
        nsec = struct.unpack_from("<H", d, pe + 6)[0]
        optsz = struct.unpack_from("<H", d, pe + 20)[0]
        opt = pe + 24
        assert struct.unpack_from("<H", d, opt)[0] == 0x20B, "not PE32+"
        self.base = struct.unpack_from("<Q", d, opt + 24)[0]
        self.dirs = [struct.unpack_from("<II", d, opt + 112 + 8 * i) for i in range(16)]
        self.secs = []
        for i in range(nsec):
            s = opt + optsz + 40 * i
            name = d[s:s + 8].rstrip(b"\0").decode("ascii", "replace")
            vsize, va, rsize, raw = struct.unpack_from("<IIII", d, s + 8)
            self.secs.append((name, self.base + va, vsize, raw, rsize))

    def off(self, va):
        for _, sva, vsize, raw, rsize in self.secs:
            if sva <= va < sva + max(vsize, rsize) and va - sva < rsize:
                return raw + va - sva
        return None

    def va(self, off):
        for _, sva, _, raw, rsize in self.secs:
            if raw <= off < raw + rsize:
                return sva + off - raw
        return None

    def read(self, va, n):
        o = self.off(va)
        return None if o is None else self.d[o:o + n]

    def sec(self, name):
        for s in self.secs:
            if s[0] == name:
                return s
        return None

    def cstr(self, va, maxlen=80):
        b = self.read(va, maxlen)
        if not b:
            return None
        s = b.split(b"\0")[0]
        if len(s) >= 3 and all(31 < c < 127 for c in s):
            return s.decode("ascii")
        return None

    def funcs(self):
        """(begin, end) of every function in the exception directory (.pdata)."""
        rva, size = self.dirs[3]
        o = self.off(self.base + rva)
        out = []
        for i in range(size // 12):
            b, e, _ = struct.unpack_from("<III", self.d, o + 12 * i)
            if b:
                out.append((self.base + b, self.base + e))
        return out


md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
md.detail = True


def note(pe, ins):
    """Target of a rip-relative operand or a direct branch, with a string if one is there."""
    t = None
    for op in ins.operands:
        if op.type == capstone.x86.X86_OP_MEM and op.mem.base == capstone.x86.X86_REG_RIP:
            t = ins.address + ins.size + op.mem.disp
        elif op.type == capstone.x86.X86_OP_IMM and ins.group(capstone.CS_GRP_JUMP) | ins.group(capstone.CS_GRP_CALL):
            t = op.imm
    if t is None:
        return ""
    s = pe.cstr(t)
    return "  ; 0x%x%s" % (t, "  %r" % s if s else "")


def dis(pe, va, count=None, end=None):
    code = pe.read(va, (end - va) if end else 16 * (count or 40))
    n = 0
    for ins in md.disasm(code, va):
        print("%x: %-8s %s%s" % (ins.address, ins.mnemonic, ins.op_str, note(pe, ins)))
        n += 1
        if count and n >= count:
            break


def func_of(pe, va):
    for b, e in pe.funcs():
        if b <= va < e:
            return b, e
    return None


def xref(pe, target):
    """Scan .text for rel32 displacements that land on target."""
    name, sva, vsize, raw, rsize = pe.sec(".text")
    d = pe.d
    hits = []
    for o in range(raw, raw + rsize - 4):
        disp = struct.unpack_from("<i", d, o)[0]
        if sva + (o - raw) + 4 + disp == target:
            hits.append(sva + (o - raw))
    return hits


def main():
    pe = PE(sys.argv[1])
    cmd, a = sys.argv[2], sys.argv[3:]
    if cmd == "sections":
        print("image base 0x%x" % pe.base)
        for name, va, vsize, raw, rsize in pe.secs:
            print("%-8s va 0x%x vsize 0x%x raw 0x%x rsize 0x%x" % (name, va, vsize, raw, rsize))
    elif cmd == "dis":
        dis(pe, int(a[0], 16), int(a[1]) if len(a) > 1 else 40)
    elif cmd == "func":
        f = func_of(pe, int(a[0], 16))
        if not f:
            sys.exit("no function there in .pdata")
        print("function 0x%x .. 0x%x" % f)
        dis(pe, f[0], end=f[1])
    elif cmd == "xref":
        for h in xref(pe, int(a[0], 16)):
            f = func_of(pe, h)
            print("0x%x (disp at)  in function %s" % (h, "0x%x" % f[0] if f else "?"))
    elif cmd in ("find", "str"):
        pat = bytes.fromhex("".join(a)) if cmd == "find" else " ".join(a).encode("ascii")
        o = pe.d.find(pat)
        while o >= 0:
            va = pe.va(o)
            print("0x%x (file 0x%x)" % (va, o) if va else "file 0x%x" % o)
            o = pe.d.find(pat, o + 1)
    elif cmd == "imm":
        pat = struct.pack("<I", int(a[0], 16))
        name, sva, vsize, raw, rsize = pe.sec(".text")
        o = pe.d.find(pat, raw, raw + rsize)
        while o >= 0:
            va = sva + o - raw
            f = func_of(pe, va)
            print("0x%x  in function %s" % (va, "0x%x" % f[0] if f else "?"))
            o = pe.d.find(pat, o + 1, raw + rsize)
    elif cmd == "bytes":
        va = int(a[0], 16)
        b = pe.read(va, int(a[1], 0) if len(a) > 1 else 64)
        for i in range(0, len(b), 16):
            row = b[i:i + 16]
            print("%x: %-48s %s" % (va + i, row.hex(" "), "".join(chr(c) if 31 < c < 127 else "." for c in row)))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
