"""Small MIPS (PS1, little-endian) disassembly helper for the game's EXE and overlays.

Usage (run with tools/.venv python):
  mips.py dis <addr> [count]        disassemble count instructions at addr
  mips.py func <addr>               disassemble the function containing addr
  mips.py xref <addr>               list jal callers and lui/addiu|ori|load refs to addr
  mips.py find16 <value>            list instructions using a 16-bit immediate value
  mips.py str <addr>                print C string at addr
  mips.py words <addr> [count]      dump u32 words

Images: SLUS_013.28 at 0x80010000 (file offset 0x800) plus one overlay (env OVL,
default KAWSEG) at 0x801DDF38.
"""
import os
import struct
import sys

import capstone

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "extracted")
EXE = os.path.join(ROOT, "disc", "SLUS_013.28")
OVL_BASE = 0x801DDF38


class Mem:
    def __init__(self, ovl="KAWSEG"):
        exe = open(EXE, "rb").read()
        self.segs = [(struct.unpack_from("<I", exe, 0x18)[0], exe[0x800:])]
        if ovl:
            self.segs.append((OVL_BASE, open(os.path.join(ROOT, "drv", "P", ovl + ".BIN"), "rb").read()))

    def seg(self, addr):
        for base, data in self.segs:
            if base <= addr < base + len(data):
                return base, data
        return None, None

    def read(self, addr, n):
        base, data = self.seg(addr)
        if data is None:
            return None
        return data[addr - base:addr - base + n]

    def u32(self, addr):
        b = self.read(addr, 4)
        return struct.unpack("<I", b)[0] if b and len(b) == 4 else None

    def cstr(self, addr, maxlen=200):
        b = self.read(addr, maxlen)
        if b is None:
            return None
        return b.split(b"\0")[0].decode("ascii", "replace")


md = capstone.Cs(capstone.CS_ARCH_MIPS, capstone.CS_MODE_MIPS32 | capstone.CS_MODE_LITTLE_ENDIAN)


def fmt(mem, ins, lui_state):
    """Annotate lui+addiu/ori/load pairs and jal targets."""
    note = ""
    w = struct.unpack("<I", ins.bytes)[0]
    op = w >> 26
    rs, rt = (w >> 21) & 31, (w >> 16) & 31
    imm = w & 0xFFFF
    simm = imm - 0x10000 if imm & 0x8000 else imm
    if op == 0x0F:  # lui
        lui_state[rt] = imm << 16
    elif op in (0x09, 0x0D) and rs in lui_state:  # addiu / ori
        val = (lui_state[rs] + simm) & 0xFFFFFFFF if op == 0x09 else lui_state[rs] | imm
        note = "  ; = 0x%08x" % val
        s = mem.cstr(val, 60) if mem.seg(val)[1] is not None else None
        if s and len(s) >= 3 and all(31 < ord(c) < 127 or c == "\n" for c in s):
            note += "  %r" % s
        if rt == rs:
            lui_state[rt] = val
        elif rt in lui_state:
            del lui_state[rt]
    elif op in (0x20, 0x21, 0x23, 0x24, 0x25, 0x28, 0x29, 0x2B) and rs in lui_state:
        note = "  ; [0x%08x]" % ((lui_state[rs] + simm) & 0xFFFFFFFF)
    return "%08x: %-8s %s%s" % (ins.address, ins.mnemonic, ins.op_str, note)


def disasm(mem, addr, count):
    base, data = mem.seg(addr)
    code = data[addr - base:addr - base + count * 4]
    st = {}
    out = []
    pos = addr
    for i in range(0, len(code), 4):
        chunk = code[i:i + 4]
        got = list(md.disasm(chunk, pos))
        if got:
            out.append(fmt(mem, got[0], st))
        else:
            out.append("%08x: .word    0x%08x" % (pos, struct.unpack("<I", chunk)[0]))
        pos += 4
    return out


def func_bounds(mem, addr):
    """Walk back to the 'addiu sp, sp, -N' prologue and forward to 'jr ra' (+ delay slot)."""
    a = addr & ~3
    while True:
        w = mem.u32(a)
        if w is None:
            break
        if (w & 0xFFFF8000) == 0x27BD8000:  # addiu sp,sp,-N
            break
        a -= 4
        if addr - a > 0x4000:
            break
    start = a
    a = addr & ~3
    while True:
        w = mem.u32(a)
        if w is None or w == 0x03E00008:
            break
        a += 4
        if a - start > 0x8000:
            break
    return start, a + 8


def xrefs(mem, target):
    res = []
    for base, data in mem.segs:
        lui = {}
        for off in range(0, len(data) - 3, 4):
            w = struct.unpack_from("<I", data, off)[0]
            pc = base + off
            op = w >> 26
            rs, rt = (w >> 21) & 31, (w >> 16) & 31
            imm = w & 0xFFFF
            simm = imm - 0x10000 if imm & 0x8000 else imm
            if op == 3 and ((pc & 0xF0000000) | ((w & 0x3FFFFFF) << 2)) == target:
                res.append((pc, "jal"))
            elif op == 2 and ((pc & 0xF0000000) | ((w & 0x3FFFFFF) << 2)) == target:
                res.append((pc, "j"))
            elif op == 0x0F:
                lui[rt] = (imm << 16, pc)
            elif op in (0x09, 0x0D, 0x20, 0x21, 0x23, 0x24, 0x25, 0x28, 0x29, 0x2B) and rs in lui:
                hi, lpc = lui[rs]
                if pc - lpc <= 64:
                    val = (hi + simm) & 0xFFFFFFFF if op != 0x0D else hi | imm
                    if val == target:
                        res.append((pc, "ref op=%02x" % op))
            if w == target and off % 4 == 0:
                res.append((pc, "data word"))
    return res


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    mem = Mem(os.environ.get("OVL", "KAWSEG"))
    cmd = sys.argv[1]
    if cmd == "dis":
        a = int(sys.argv[2], 16)
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 40
        print("\n".join(disasm(mem, a, n)))
    elif cmd == "func":
        s, e = func_bounds(mem, int(sys.argv[2], 16))
        print("; function %08x..%08x" % (s, e))
        print("\n".join(disasm(mem, s, (e - s) // 4)))
    elif cmd == "xref":
        for pc, kind in xrefs(mem, int(sys.argv[2], 16)):
            print("%08x %s" % (pc, kind))
    elif cmd == "find16":
        v = int(sys.argv[2], 0) & 0xFFFF
        for base, data in mem.segs:
            for off in range(0, len(data) - 3, 4):
                w = struct.unpack_from("<I", data, off)[0]
                if (w & 0xFFFF) == v and (w >> 26) in (0x09, 0x0D, 0x0A, 0x0B, 0x0C, 0x08):
                    print("\n".join(disasm(mem, base + off, 1)))
    elif cmd == "str":
        print(repr(mem.cstr(int(sys.argv[2], 16), 400)))
    elif cmd == "words":
        a = int(sys.argv[2], 16)
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 16
        for i in range(n):
            w = mem.u32(a + i * 4)
            s = mem.cstr(w, 40) if w and mem.seg(w)[1] is not None else ""
            print("%08x: %08x  %r" % (a + i * 4, w, s))


if __name__ == "__main__":
    main()
