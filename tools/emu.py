"""Run a routine of the game image under Unicorn (for checking math helpers).
emu.call(addr, a0, a1, a2, a3, writes={addr: bytes}) -> Uc after return."""
import os, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mips
from unicorn import Uc, UC_ARCH_MIPS, UC_MODE_MIPS32, UC_MODE_LITTLE_ENDIAN
from unicorn.mips_const import *
MEM = mips.Mem(os.environ.get("OVL", "KAWSEG"))
RET = 0x80300000
def call(fn, a0=0, a1=0, a2=0, a3=0, writes=None, count=400000):
    mu = Uc(UC_ARCH_MIPS, UC_MODE_MIPS32 | UC_MODE_LITTLE_ENDIAN)
    mu.mem_map(0, 0x400000)  # Unicorn maps kseg0 (0x80000000+) onto physical 0
    for base, data in MEM.segs:
        mu.mem_write(base & 0x1FFFFFFF, data)
    mu.mem_write(RET & 0x1FFFFFFF, struct.pack("<II", 0x1000FFFF, 0))  # b . ; nop
    for k, v in (writes or {}).items():
        mu.mem_write(k & 0x1FFFFFFF, v)
    for r, v in ((UC_MIPS_REG_SP, 0x803F0000), (UC_MIPS_REG_RA, RET), (UC_MIPS_REG_A0, a0), (UC_MIPS_REG_A1, a1), (UC_MIPS_REG_A2, a2), (UC_MIPS_REG_A3, a3)):
        mu.reg_write(r, v)
    try:
        mu.emu_start(fn, RET, count=count)
    except Exception as e:
        raise RuntimeError("%s at pc=%08x" % (e, mu.reg_read(UC_MIPS_REG_PC)))
    return mu
def read(mu, addr, n):
    return bytes(mu.mem_read(addr & 0x1FFFFFFF, n))
