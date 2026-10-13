"""Build the web game's data from the extracted disc files.

Usage (venv python):  build_data.py <extracted_dir> <web_dir>

Reads  B/CARD2.CDD  (card database), B/DECK2.DEK (deck lists) and which B/MATCH archive
holds each deck owner's picture (build_owners.py).
Writes <web>/js/data/cards.js. Card art is produced separately by upscale_assets.py.
The custom cards of tools/custom_cards.json (custom.py) follow the game's 301, and its
custom decks the game's 159.

Record layouts were recovered from the files and from the loader at 0x800457fc in
SLUS_013.28 (table pointers 0x801d8408 / 0x801d8400 / 0x801d8404):
  header   "0ACD", u16 digimon count (191), u8 option count (102) ...
  digimon  316 bytes   option 226 bytes   digivolve 112 bytes
"""
import json
import os
import re
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_owners  # noqa: E402
import custom  # noqa: E402

N_DIGI, N_OPT, N_EVO = 191, 102, 8
SPEC = ["Fire", "Ice", "Nature", "Darkness", "Rare"]
ATK = ["○", "△", "✕"]
TOKENS = {
    "*a0": "Fire", "*a1": "Ice", "*a2": "Nature", "*a3": "Darkness", "*a4": "Rare",
    "*b0": ATK[0], "*b1": ATK[1], "*b2": ATK[2],
    "*e1": "I", "*e2": "II", "*e3": "R", "*e4": "C", "*e5": "U", "*ea": "A",
}


def cstr(b):
    return b.split(b"\0")[0].decode("ascii", "replace")


def detok(s):
    s = re.sub(r"\*[abe][0-9a]", lambda m: TOKENS.get(m.group(), m.group()), s)
    # the data drops the '*' on a few level tokens ("Level e3", "is ea,")
    s = re.sub(r"\b(e3|e4|e5|ea)\b", lambda m: TOKENS["*" + m.group()], s)
    s = re.sub(r"\b(b0|b1|b2)\b", lambda m: TOKENS["*" + m.group()], s)
    return s


def text_lines(b):
    lines = [cstr(b[i * 21:(i + 1) * 21]).strip() for i in range(4)]
    return detok(" ".join(l for l in lines if l)).replace("  ", " ").strip()


def parse_effect(b):
    """b = 2 condition blocks (32 bytes each) + 3 action blocks (16 bytes each)."""
    conds, acts = [], []
    for k in range(2):
        c = b[k * 32:(k + 1) * 32]
        if not c[0]:
            continue
        conds.append({
            "v": list(struct.unpack_from("<6h", c, 2)),
            "i": list(struct.unpack_from("<6h", c, 14)),
            "op": c[26],
            "m": [c[27], c[28], c[29], c[30]],
        })
    for k in range(3):
        a = b[64 + k * 16:64 + (k + 1) * 16]
        if not a[0]:
            continue
        acts.append({
            "op": a[1],
            "v": list(struct.unpack_from("<3h", a, 2)),
            "i": list(struct.unpack_from("<3h", a, 8)),
            "m1": a[14],
            "m2": a[15],
        })
    return conds, acts


def build_cards(cdd):
    assert cdd[:4] == b"0ACD"
    cards = []
    base = 8
    for i in range(N_DIGI):
        r = cdd[base + i * 316:base + (i + 1) * 316]
        assert struct.unpack_from("<H", r, 0)[0] == i and r[2] == 0
        conds, acts = parse_effect(r[0x74:0xE4])
        atk = []
        for k in range(3):
            o = 0x20 + k * 28
            # +2 / +4: the Polygon Battle scripts of this attack (the attack itself, and what
            # happens to the target), read by the loader at 0x8002dea0
            atk.append({"name": cstr(r[o + 6:o + 28]), "power": struct.unpack_from("<H", r, o)[0],
                        "script": struct.unpack_from("<H", r, o + 2)[0], "hit": struct.unpack_from("<H", r, o + 4)[0]})
        cards.append({
            "id": i, "type": "digimon", "name": detok(cstr(r[3:24])),
            "spec": r[0x1A] >> 4, "level": r[0x1A] & 15,
            "dp": r[0x1B], "pp": struct.unpack_from("<H", r, 0x1C)[0],
            "hp": struct.unpack_from("<H", r, 0x1E)[0],
            "atk": atk, "xfx": r[0xE4],
            # Polygon Battle model: F:\NNN.PAK (see build_models.py)
            "model": r[0xE5],
            "prio": r[0xE6], "conds": conds, "acts": acts,
            "text": text_lines(r[0xE7:0xE7 + 84]),
        })
    base += N_DIGI * 316
    for i in range(N_OPT):
        r = cdd[base + i * 226:base + (i + 1) * 226]
        assert struct.unpack_from("<H", r, 0)[0] == N_DIGI + i and r[2] == 1
        conds, acts = parse_effect(r[0x1C:0x8C])
        cards.append({
            "id": N_DIGI + i, "type": "option", "name": detok(cstr(r[3:24])),
            "prio": r[0x8C], "conds": conds, "acts": acts,
            "text": text_lines(r[0x8D:0x8D + 84]),
        })
    base += N_OPT * 226
    for i in range(N_EVO):
        r = cdd[base + i * 112:base + (i + 1) * 112]
        assert struct.unpack_from("<H", r, 0)[0] == N_DIGI + N_OPT + i and r[2] == 2
        cards.append({
            "id": N_DIGI + N_OPT + i, "type": "digivolve", "name": cstr(r[3:24]),
            "dtype": r[0x1A], "text": text_lines(r[0x1B:0x1B + 84]),
        })
    return cards


def build_decks(dek, pics):
    assert dek[:4] == b"30KD"
    n = (len(dek) - 8) // 110
    decks = []
    for i in range(n):
        r = dek[8 + i * 110:8 + (i + 1) * 110]
        decks.append({
            # the owner's name runs to its NUL: the battle start copies it whole from byte
            # 79 as the opponent's name (the strcpy at 0x8003fdd4); the longest is 19 letters
            "id": i, "name": cstr(r[60:79]), "owner": cstr(r[79:100]),
            "cards": list(struct.unpack_from("<30H", r, 0)),
            "rank": r[108],
            # which armor form the deck's partner Rookie can take (0 = none); see the
            # partner/armor id tables at 0x8006e518 / 0x8006e520 in the EXE
            "armor": r[109],
            # battle music: BGM number the battle start routine (0x801f1aa8) loads for
            # this opponent; 0 = none named (free battle picks 143 or 144)
            "bgm": r[104],
            # the second track the same routine loads, started when the screen changes to
            # the 3D battle (0x8002e26c); 0 = none named (free battle picks 147 or 148)
            "bgm3d": r[105],
        })
        # the owner's picture on the screen before the battle: web/assets/owner/NNN.webp
        # (build_owners.py). The game loads B:\MATCH\NNN.ARC by the deck's number; decks
        # that are never an opponent have none
        if i in pics:
            decks[-1]["pic"] = pics[i]
    return decks


def main():
    ext, web = sys.argv[1], sys.argv[2]
    cards = build_cards(open(os.path.join(ext, "drv", "B", "CARD2.CDD"), "rb").read())
    cards += custom.cards(cards)
    assert [c["id"] for c in cards] == list(range(len(cards)))
    decks = build_decks(open(os.path.join(ext, "drv", "B", "DECK2.DEK"), "rb").read(), build_owners.pictures(ext))
    decks += custom.decks(decks, cards)
    os.makedirs(os.path.join(web, "js", "data"), exist_ok=True)
    os.makedirs(os.path.join(web, "assets"), exist_ok=True)
    with open(os.path.join(web, "js", "data", "cards.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by tools/build_data.py from CARD2.CDD / DECK2.DEK and tools/custom_cards.json. Do not edit.\n")
        f.write("(function (root) {\n")
        f.write("var DATA = {\n  cards: [\n")
        f.write(",\n".join("    " + json.dumps(c, ensure_ascii=False, separators=(",", ":")) for c in cards))
        f.write("\n  ],\n  decks: [\n")
        f.write(",\n".join("    " + json.dumps(d, ensure_ascii=False, separators=(",", ":")) for d in decks))
        f.write("\n  ]\n};\n")
        f.write("if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else root.DDCB_DATA = DATA;\n")
        f.write("})(typeof self !== 'undefined' ? self : this);\n")
    print("cards:", len(cards), "decks:", len(decks))


if __name__ == "__main__":
    main()
