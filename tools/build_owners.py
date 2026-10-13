"""Export the pictures of the deck owners from the screen the game shows before a battle.

Usage (venv python):  build_owners.py <extracted_dir> <web_dir> [--upscale]

  web/assets/owner/NNN.webp      the owner of deck NNN (B/MATCH/NNN.ARC, member 12)
  web/assets/owner/player.webp   the player (member 11, the same in every archive)
  web/assets/owner/player2.webp  the second player of a free battle (B/MATCH/999.ARC, member 12)

The "VS" screen is set up by the task at 0x801eda84 (KAWSEG). It loads B:\\MATCH\\%3.3d.ARC
and sends every member to video memory at the place its own header names (0x8001b438). The
number is the opponent's deck number: byte 4 of the opponent block, which 0x80041794 fills
together with the DECK2.DEK record of that number. A free battle (first argument 0) loads
999 instead. Deck 76 has no archive.

Which member is which was read from the files, not from the drawing code: members 11 and
12 are the two 128x112, 8-bit pictures (video memory 320,0 and 320,112); 11 is the same in
all 142 archives and 12 changes with the owner. The whole texture is taken as the picture;
what part of it the screen draws was not read. Member 13 is the owner's name as a picture.

Several decks of one owner share a picture, so a picture is written once, under the lowest
deck number that has it; pictures() says which file each deck uses and build_data.py puts
that number into cards.js as "pic".

Without --upscale the pictures are written at the game's own 128x112. With it they go 4x
through the local ComfyUI like the card art (upscale_assets.py).
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tim  # noqa: E402

PLAYER, OWNER = 11, 12
FREE = 999  # the archive of a battle without an opponent of the game


def members(d):
    first = struct.unpack_from("<I", d, 0)[0]
    offs = [o for o in struct.unpack_from("<%dI" % (first // 4), d, 0) if o < len(d)]  # last entry = end
    return [d[o:(offs[i + 1] if i + 1 < len(offs) else len(d))] for i, o in enumerate(offs)]


def archives(ext):
    """-> {archive number: its members}"""
    src = os.path.join(ext, "drv", "B", "MATCH")
    out = {}
    for name in sorted(os.listdir(src)):
        if name.upper().endswith(".ARC"):
            out[int(name[:3])] = members(open(os.path.join(src, name), "rb").read())
    return out


def pictures(ext):
    """-> {deck number: the number its owner's picture is filed under}"""
    first, out = {}, {}
    for n, mem in sorted(archives(ext).items()):
        if n != FREE:
            out[n] = first.setdefault(mem[OWNER], n)
    return out


def main():
    ext, web = sys.argv[1], sys.argv[2]
    arcs, pic = archives(ext), pictures(ext)
    names = ["%03d" % n for n in sorted(set(pic.values()))] + ["player", "player2"]
    tiles = [tim.decode(arcs[int(n)][OWNER])[0].convert("RGB") for n in names[:-2]]
    tiles += [tim.decode(arcs[FREE][PLAYER])[0].convert("RGB"), tim.decode(arcs[FREE][OWNER])[0].convert("RGB")]
    # archive 84 (Shurimon) is one row taller than the rest, its last row twice
    assert all(t.size in ((128, 112), (128, 113)) for t in tiles)
    tiles = [t.crop((0, 0, 128, 112)) for t in tiles]
    assert all(mem[PLAYER] == arcs[FREE][PLAYER] for mem in arcs.values())
    out = os.path.join(web, "assets", "owner")
    os.makedirs(out, exist_ok=True)
    if "--upscale" in sys.argv[3:]:
        import upscale_assets
        tiles = upscale_assets.upscale_tiles(tiles, 6, "owner")
    for n, im in zip(names, tiles):
        if im.size == (128, 112):
            im.save(os.path.join(out, n + ".webp"), "WEBP", lossless=True, method=6)
        else:
            im.save(os.path.join(out, n + ".webp"), "WEBP", quality=88, method=6)
    print("owner pictures:", len(names), "for", len(pic), "decks,", "%dx%d" % tiles[0].size)


if __name__ == "__main__":
    main()
