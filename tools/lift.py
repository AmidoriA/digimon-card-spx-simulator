"""Compact one-line-per-instruction MIPS listing for reading long routines:
drops nops, folds lui pairs, prints loads/stores as C-like expressions.
Usage: lift.py <start> <end>   (hex addresses; env OVL as in mips.py)"""
import os, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mips
R = "0 at v0 v1 a0 a1 a2 a3 t0 t1 t2 t3 t4 t5 t6 t7 s0 s1 s2 s3 s4 s5 s6 s7 t8 t9 k0 k1 gp sp fp ra".split()
LD = {0x20: "s8", 0x21: "s16", 0x23: "", 0x24: "u8", 0x25: "u16"}
ST = {0x28: "8", 0x29: "16", 0x2B: ""}
def s16(x): return x - 0x10000 if x & 0x8000 else x
def lift(mem, lo, hi):
    hi16 = {}
    for pc in range(lo, hi, 4):
        w = mem.u32(pc)
        if w == 0: continue
        op, rs, rt, rd, sh, fn, imm = w >> 26, (w >> 21) & 31, (w >> 16) & 31, (w >> 11) & 31, (w >> 6) & 31, w & 63, w & 0xFFFF
        a, b, d, t = R[rs], R[rt], R[rd], None
        if op == 0:
            if fn == 0x21 or fn == 0x20: t = "%s = %s + %s" % (d, a, b) if rt and rs else "%s = %s" % (d, a if rs else b)
            elif fn == 0x25: t = "%s = %s | %s" % (d, a, b) if rt and rs else "%s = %s" % (d, a if rs else b)
            elif fn == 0x23 or fn == 0x22: t = "%s = %s - %s" % (d, a, b) if rs else "%s = -%s" % (d, b)
            elif fn == 0x24: t = "%s = %s & %s" % (d, a, b)
            elif fn == 0x26: t = "%s = %s ^ %s" % (d, a, b)
            elif fn == 0x27: t = "%s = ~(%s | %s)" % (d, a, b)
            elif fn == 0x00: t = "%s = %s << %d" % (d, b, sh)
            elif fn == 0x02: t = "%s = %s >>> %d" % (d, b, sh)
            elif fn == 0x03: t = "%s = %s >> %d" % (d, b, sh)
            elif fn == 0x04: t = "%s = %s << %s" % (d, b, a)
            elif fn == 0x06: t = "%s = %s >>> %s" % (d, b, a)
            elif fn == 0x07: t = "%s = %s >> %s" % (d, b, a)
            elif fn == 0x18 or fn == 0x19: t = "hi:lo = %s * %s" % (a, b)
            elif fn == 0x1A or fn == 0x1B: t = "lo = %s / %s; hi = %%" % (a, b)
            elif fn == 0x10: t = "%s = hi" % d
            elif fn == 0x12: t = "%s = lo" % d
            elif fn == 0x2A or fn == 0x2B: t = "%s = %s < %s" % (d, a, b)
            elif fn == 0x08: t = "jr %s" % a
            elif fn == 0x09: t = "call %s" % a
            elif fn == 0x0D: t = "break"
        elif op == 0x0F: hi16[rt] = imm << 16; t = "%s = 0x%x0000" % (b, imm)
        elif op in (0x09, 0x08):
            if rs in hi16 and rs == rt: t = "%s = 0x%08x" % (b, (hi16[rs] + s16(imm)) & 0xFFFFFFFF)
            elif rs == 0: t = "%s = %d" % (b, s16(imm))
            else: t = "%s = %s + %d" % (b, a, s16(imm)) if rs != 29 or rt != 29 else "sp += %d" % s16(imm)
        elif op == 0x0D: t = "%s = %s | 0x%x" % (b, a, imm)
        elif op == 0x0C: t = "%s = %s & 0x%x" % (b, a, imm)
        elif op == 0x0E: t = "%s = %s ^ 0x%x" % (b, a, imm)
        elif op in (0x0A, 0x0B): t = "%s = %s < %d" % (b, a, s16(imm))
        elif op in LD:
            if rs in hi16: t = "%s = %s[0x%08x]" % (b, LD[op], (hi16[rs] + s16(imm)) & 0xFFFFFFFF)
            else: t = "%s = %s[%s+0x%x]" % (b, LD[op], a, imm) if not imm & 0x8000 else "%s = %s[%s-0x%x]" % (b, LD[op], a, -s16(imm))
        elif op in ST:
            if rs in hi16: t = "%s[0x%08x] = %s" % (ST[op], (hi16[rs] + s16(imm)) & 0xFFFFFFFF, b)
            else: t = "%s[%s+0x%x] = %s" % (ST[op], a, imm, b) if not imm & 0x8000 else "%s[%s-0x%x] = %s" % (ST[op], a, -s16(imm), b)
        elif op == 3: t = "CALL %08x" % (((w & 0x3FFFFFF) << 2) | 0x80000000)
        elif op == 2: t = "goto %08x" % (((w & 0x3FFFFFF) << 2) | 0x80000000)
        elif op in (4, 5, 6, 7, 1):
            tgt = pc + 4 + (s16(imm) << 2)
            c = {4: "%s == %s" % (a, b), 5: "%s != %s" % (a, b), 6: "%s <= 0" % a, 7: "%s > 0" % a}.get(op) or ("%s >= 0" % a if rt & 1 else "%s < 0" % a)
            t = "if (%s) goto %08x" % (c, tgt)
        elif op == 0x12: t = "cop2 %08x" % w
        elif op in (0x32, 0x3A): t = ("gte%d = [%s+0x%x]" if op == 0x32 else "[%s+0x%x] = gte%d") % ((rt, a, imm) if op == 0x32 else (a, imm, rt))
        if op != 0x0F and op not in (0x09, 0x0D) and rt in hi16 and op not in ST and op not in (4, 5): hi16.pop(rt, None)
        if op == 0 and rd in hi16: hi16.pop(rd, None)
        if t is None: t = "?? %08x" % w
        if op == 0x0F: continue
        if (op in (0x23, 0x2B, 0x21, 0x29)) and rs == 29: 
            if "sp+" in t and ("ra" in t.split("=")[0] + t.split("=")[1] if "=" in t else False) : pass
        print("%05x %s" % (pc & 0xFFFFF, t))
if __name__ == "__main__":
    lift(mips.Mem(os.environ.get("OVL", "KAWSEG")), int(sys.argv[1], 16), int(sys.argv[2], 16))
