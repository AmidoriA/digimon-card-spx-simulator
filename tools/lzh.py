"""Decompressor for the game's packed archive members (routine at 0x8001bdec).

LZSS with a 4096-byte ring buffer whose symbols (256 literals + 16 match lengths) are
Huffman coded; the code tree is re-sent every 0x1000 symbols. Bits are read MSB first.
"""


class _Bits:
    def __init__(self, data):
        self.d, self.p, self.cur, self.n = data, 0, 0, 0

    def bit(self):
        if self.n == 0:
            self.cur = self.d[self.p] if self.p < len(self.d) else 0
            self.p += 1
            self.n = 8
        self.n -= 1
        return (self.cur >> self.n) & 1

    def bits(self, k):
        v = 0
        for _ in range(k):
            v = (v << 1) | self.bit()
        return v


def decompress(data):
    br = _Bits(data)
    size = (br.bits(16) << 16) | br.bits(16)
    left, right = {}, {}
    state = {"n": 0x110}

    def tree():
        if br.bit():
            node = state["n"]
            state["n"] += 1
            left[node] = tree()
            right[node] = tree()
            return node
        return br.bits(9)

    out = bytearray()
    ring = bytearray(4096)
    r = 0xFEE
    count, root = 0x1000, 0
    while len(out) < size:
        if count == 0x1000:
            state["n"] = 0x110
            left.clear()
            right.clear()
            root = tree()
            count = 0
        s = root
        while s >= 0x110:
            s = right[s] if br.bit() else left[s]
        count += 1
        if s < 0x100:
            out.append(s)
            ring[r] = s
            r = (r + 1) & 0xFFF
        else:
            ln = s - 0xFD
            pos = br.bits(12)
            for k in range(ln):
                c = ring[(pos + k) & 0xFFF]
                out.append(c)
                ring[r] = c
                r = (r + 1) & 0xFFF
    return bytes(out[:size])
