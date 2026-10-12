"""Build compact 4x arena texture atlases from the original indexed PS1 textures.

Uses the owner's local ComfyUI RealESRGAN_x4plus, via comfy.py. Only texture regions
actually referenced by the arena are packed. Original palettes, transparency, UVs and
polygon order remain available for Original PS1. Run with --missing to resume a batch.
"""
import argparse
import gzip
import json
import math
import struct
from pathlib import Path

from PIL import Image
from comfy import upscale

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "web/assets/models"
OUT = ROOT / "web/assets/battle/arena-hd"
PAD, SCALE = 4, 4


def regions(number):
    raw = gzip.decompress((SOURCE / f"bg{number}.bin.gz").read_bytes())
    words = struct.unpack(f"<{len(raw)//2}h", raw)
    _, _, parts, _, nv, opaque, blend, width, height, pals = words[:10]
    vertices = words[10 + parts * 4:10 + parts * 4 + nv * 13]
    indices = words[10 + parts * 4 + nv * 13:10 + parts * 4 + nv * 13 + (opaque + blend) * 3]
    boxes = {}
    for idx in indices:
        u, v, _, pal = vertices[idx * 13 + 9:idx * 13 + 13]
        if u < 0:
            continue
        u, v = min(width - 1, u), max(0, min(height - 1, v))
        box = boxes.setdefault(pal, [u, v, u + 1, v + 1])
        box[:] = [min(box[0], u), min(box[1], v), max(box[2], u + 1), max(box[3], v + 1)]
    return boxes, width, height, pals


def build(number):
    boxes, width, height, pals = regions(number)
    indexed = Image.open(SOURCE / f"bg{number}.png").convert("L")
    palette = Image.open(SOURCE / f"bg{number}p.png").convert("RGBA")
    # Four source pixels of padding become sixteen upscaled pixels, isolating AI edges
    # and providing safe linear-filtering borders without joining unrelated surfaces.
    placed, x, y, row_height = {}, 0, 0, 0
    atlas_width = 512
    for pal, box in sorted(boxes.items(), key=lambda p: -(p[1][3] - p[1][1])):
        w, h = box[2] - box[0], box[3] - box[1]
        if x + w + PAD * 2 > atlas_width:
            x, y, row_height = 0, y + row_height, 0
        placed[pal] = [x + PAD, y + PAD, w, h]
        x += w + PAD * 2
        row_height = max(row_height, h + PAD * 2)
    atlas_height = 2 ** math.ceil(math.log2(max(1, y + row_height)))
    rgb = Image.new("RGB", (atlas_width, atlas_height))
    alpha = Image.new("L", rgb.size)
    for pal, box in boxes.items():
        lookup = [palette.getpixel((i, pal)) for i in range(256)]
        crop = indexed.crop(box)
        decoded = Image.new("RGBA", crop.size)
        decoded.putdata([lookup[i] for i in crop.tobytes()])
        dx, dy, w, h = placed[pal]
        rgb.paste(decoded.convert("RGB"), (dx, dy))
        alpha.paste(decoded.getchannel("A"), (dx, dy))
        # Extrude edge colours/alpha into the gutter, preventing dark seams on UV edges.
        for target in (rgb, alpha):
            tile = target.crop((dx, dy, dx + w, dy + h))
            for offset in range(1, PAD + 1):
                target.paste(tile.crop((0, 0, 1, h)), (dx - offset, dy))
                target.paste(tile.crop((w - 1, 0, w, h)), (dx + w - 1 + offset, dy))
            strip = target.crop((dx - PAD, dy, dx + w + PAD, dy + h))
            for offset in range(1, PAD + 1):
                target.paste(strip.crop((0, 0, w + PAD * 2, 1)), (dx - PAD, dy - offset))
                target.paste(strip.crop((0, h - 1, w + PAD * 2, h)), (dx - PAD, dy + h - 1 + offset))
    print(f"Upscaling arena {number}: {rgb.width}x{rgb.height}, {len(boxes)} palette regions", flush=True)
    result = upscale(rgb, tag=f"arena_{number}_4x")
    if result.size != (atlas_width * SCALE, atlas_height * SCALE):
        raise RuntimeError(f"Unexpected upscale size for {number}: {result.size}")
    result.putalpha(alpha.resize(result.size, Image.Resampling.NEAREST))
    result.save(OUT / f"{number}.webp", quality=94, method=6, exact=True)
    transforms = [[0, 0, 0, 0] for _ in range(pals)]
    for pal, (dx, dy, w, h) in placed.items():
        box = boxes[pal]
        transforms[pal] = [(dx - box[0]) / atlas_width, (dy - box[1]) / atlas_height,
                           width / atlas_width, height / atlas_height]
    info = {"file": number, "width": result.width, "height": result.height,
            "sourceWidth": width, "sourceHeight": height, "scale": SCALE, "uv": transforms,
            "upscaler": "RealESRGAN_x4plus.safetensors"}
    (OUT / f"{number}.json").write_text(json.dumps(info, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Saved {number}: {result.width}x{result.height}, {(OUT/f'{number}.webp').stat().st_size//1024} KiB", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--missing", action="store_true")
    parser.add_argument("--arena", type=int, choices=range(900, 924))
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    for number in ([args.arena] if args.arena else range(900, 924)):
        if args.missing and (OUT / f"{number}.json").exists() and (OUT / f"{number}.webp").exists():
            continue
        build(number)


if __name__ == "__main__":
    main()
