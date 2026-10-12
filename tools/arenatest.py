"""Check all 24 upscaled arena assets, palette UV mapping and original transparency."""
import json
from PIL import Image
from upscale_arenas import OUT, SOURCE, regions

total = 0
pixels = 0
for number in range(900, 924):
    info = json.loads((OUT / f"{number}.json").read_text())
    atlas = Image.open(OUT / f"{number}.webp").convert("RGBA")
    source = Image.open(SOURCE / f"bg{number}.png").convert("L")
    palette = Image.open(SOURCE / f"bg{number}p.png").convert("RGBA")
    boxes, w, h, pals = regions(number)
    assert info["file"] == number and info["scale"] == 4
    assert atlas.size == (info["width"], info["height"])
    assert atlas.width <= 2048 and atlas.height <= 2048
    assert len(info["uv"]) == pals
    alpha = atlas.getchannel("A")
    for pal, box in boxes.items():
        dx, dy, sx, sy = info["uv"][pal]
        for y in range(box[1], box[3]):
            for x in range(box[0], box[2]):
                ax = int(((x + 0.5) / w * sx + dx) * atlas.width)
                ay = int(((y + 0.5) / h * sy + dy) * atlas.height)
                assert 0 <= ax < atlas.width and 0 <= ay < atlas.height, (number, pal, x, y)
                assert alpha.getpixel((ax, ay)) == palette.getpixel((source.getpixel((x, y)), pal))[3], (number, pal, x, y)
                pixels += 1
    total += (OUT / f"{number}.webp").stat().st_size
print(f"PASS: 24 arenas, {pixels:,} source pixels mapped with original alpha; {total / 1024 / 1024:.2f} MiB total textures.")
