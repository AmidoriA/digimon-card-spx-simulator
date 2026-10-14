"""Make the files of the custom cards (tools/custom_cards.json, see custom.py).

Usage (venv python):  build_custom.py <extracted_dir> <web_dir> [data] [model] [battle] [art] [card numbers...]
                                      [--ts <dir>]

  data    web/js/data/cards.js               the game's cards and decks with the custom cards
                                             after them (build_data.py)
  model   web/assets/models/NNN.*            the base card's model, its palettes and vertex
                                             colours changed by the card's recolour; or, for a
                                             card whose model names a Time Stranger model
                                             ("ts"), native full source geometry/skin/RGBA with
                                             base key times (ts_native_model.py), or optional
                                             legacy reduction (ts_model.py)
  battle  web/assets/battle/scripts.json.gz  the game's scripts and the custom cards' (the
                                             base's attack and hit scripts with other colours)
          web/assets/battle/fx/N.bin.gz      the effect files of those scripts: sprites,
                                             textures and effect models with other colours
  art     web/assets/art/NNN.webp, mini/     the game's two pictures of the base card,
                                             recoloured, 4x through the local ComfyUI
          web/assets/art2/NNN.webp, mini2/   the picture named by "new" for "New card art"

With no part named, all four are made. `art` needs ComfyUI (http://127.0.0.1:8188,
RealESRGAN_x4plus); the others need only the unpacked disc. Card numbers limit model,
battle's effect files and art to those cards.

--ts <dir> is where the Time Stranger files are (tools/ts_extract.py); without it,
extracted_ts/app_0 beside <extracted_dir>. They are another game's files: run this with
python -I when it reads them. A card that needs them is left as it is when they are missing.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_battle  # noqa: E402
import build_data  # noqa: E402
import build_models  # noqa: E402
import custom  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
PARTS = ("data", "model", "battle", "art")


def do_ts_model(web, c, base, ts_dir):
    """A Time Stranger model on the figures and keys of the base's (ts_model.py, TS-205 to TS-207)."""
    import ts_model
    m = c["model"]
    geom = os.path.join(ts_dir, m["ts"] + ".geom")
    if not os.path.exists(geom):
        print("  %s: model %d LEFT AS IT IS: no %s" % (c["name"], m["number"], geom))
        return
    against = os.path.join(ts_dir, m["against"] + ".geom") if "against" in m else None
    if against and not os.path.exists(against):
        print("  %s: model %d LEFT AS IT IS: no %s" % (c["name"], m["number"], against))
        return
    lines = []
    if m.get("native"):
        import ts_native_model
        made, stats = ts_native_model.make(geom, web, base["model"], os.path.join(web, "assets", "models"), m["number"],
                                          {int(k): v for k, v in m.get("parts", {}).items()},
                                          {int(k): v for k, v in m.get("motions", {}).items()},
                                          against=against, size=m.get("size", 1.0), ground=m.get("ground"), log=lines.append)
        print("  %s: native model %d from %s, %d bones, %d vertices, %d triangles, %d native RGBA materials" % (
            c["name"], m["number"], m["ts"], stats["bones"], stats["vertices"], stats["triangles"], len(stats["materials"])))
        for x in lines:
            print("   " + x)
        return
    made = ts_model.make(geom, web, base["model"], os.path.join(web, "assets", "models"), m["number"],
                         {int(k): v for k, v in m.get("parts", {}).items()},
                         {int(k): v for k, v in m.get("motions", {}).items()}, log=lines.append,
                         figures=m.get("figures"), detail=m.get("detail", custom.TS_DETAIL), against=against,
                         size=m.get("size", 1.0), preserve_seams=m.get("preserve_seams", False), no_decimate=m.get("no_decimate", False))[0]
    print("  %s: model %d from Time Stranger %s on the keys of %d, %d parts, %d vertices, %d triangles, texture %dx%d, %d palette rows" % (
        c["name"], m["number"], m["ts"], base["model"], len(made["parts"]), len(made["verts"]), len(made["tris"]),
        made["index"].shape[1], made["index"].shape[0], len(made["palette"])))
    for x in lines:
        if any(k in x for k in ("swing round", "takes its place", "held still", "as large against", "times that size", "scale ",
                                "texture pieces", "does not end as it begins", "seam wedges", "no decimation")):
            print("   " + x.strip())


def do_model(ext, web, c, base, rules, ts_dir):
    if "ts" in c["model"]:
        return do_ts_model(web, c, base, ts_dir)
    f = custom.recolour(rules[c["model"]["recolour"]])
    src = os.path.join(ext, "drv", "F", "%03d.PAK" % base["model"])
    nv, nt, size, wh = build_models.export(src, os.path.join(web, "assets", "models"), c["model"]["number"],
                                           lambda data, pal: (custom.recolour_model(data, f), custom.recolour_palette(pal, f)))
    print("  %s: model %d from %d, %d vertices, %d triangles" % (c["name"], c["model"]["number"], base["model"], nv, nt))


def do_fx(ext, web, c, base, rules):
    b = c["battle"]
    f = custom.recolour(rules[b["recolour"]])

    def change(index, blob):
        blob = bytearray(blob)
        for t in list(index["tims"].values()) + list(index["models"].values()):
            n = 1024 * t["rows"]
            blob[t["pal"]:t["pal"] + n] = custom.recolour_palette(bytes(blob[t["pal"]:t["pal"] + n]), f)
        for m in index["models"].values():
            blob[m["off"]:m["off"] + m["len"]] = custom.recolour_model(bytes(blob[m["off"]:m["off"] + m["len"]]), f)
        return blob

    done = set()
    for a in base["atk"]:
        for sid in (a["script"], a["hit"]):
            src = os.path.join(ext, "drv", "E", "%d.PAK" % sid)
            if sid in done or not os.path.exists(src):
                continue
            done.add(sid)
            packed, index, _ = build_battle.export_fx(src, change)
            open(os.path.join(web, "assets", "battle", "fx", "%d.bin.gz" % (sid + b["offset"])), "wb").write(packed)
            print("  %s: effect file %d from %d, %d textures, %d models" % (
                c["name"], sid + b["offset"], sid, len(index["tims"]), len(index["models"])))


def new_art_source(ext, entry):
    """Resolve one modern picture; file coordinates retain the existing behaviour."""
    from PIL import Image
    kinds = [key for key in ('file', 'card', 'ref') if key in entry]
    if len(kinds) != 1:
        raise ValueError('art.new needs exactly one of file, card or ref')
    if 'edited' in entry:
        if kinds[0] == 'file':
            raise ValueError('recorded edited cache needs its official card/ref source')
        from prepare_time_stranger_art import edited_source
        return edited_source(entry, os.path.join(ext, 'newart'))
    if kinds[0] in ('card', 'ref'):
        import build_new_art
        return build_new_art.source(entry, os.path.join(ext, 'newart'))
    x, y, size = entry['crop']
    return Image.open(os.path.join(HERE, entry['file'])).convert('RGB').crop((x, y, x + size, y + size))


def do_shared_art(ext, web, c):
    """Owner's TS-101 choice: use the prepared native crop in both art modes.

    No new restoration or enlargement is performed; edited sources still pass
    the recorded-source/hash checks in new_art_source.
    """
    from PIL import Image
    src = new_art_source(ext, c["art"]["new"])
    name = "%03d.webp" % c["id"]
    for folders, im in ((("art", "art2"), src),
                        (("mini", "mini2"), src.resize((160, 160), Image.LANCZOS))):
        for folder in folders:
            im.save(os.path.join(web, "assets", folder, name), "WEBP", quality=88, method=6)
    print("  %s: shared native picture %s (%dx%d)" % (c["name"], name, *src.size))


def do_art(ext, web, c, base, rules):
    if c["art"].get("shared"):
        return do_shared_art(ext, web, c)
    import comfy
    import tim
    import upscale_assets as ua
    from PIL import Image
    art, name = c["art"], "%03d.webp" % c["id"]
    f = custom.recolour(rules[art["recolour"]])
    big = tim.decode(open(os.path.join(ext, "drv", "B", "CARD", "LC%03d.TIM" % base["id"]), "rb").read())[0]
    small = tim.decode(ua.arc_members(open(os.path.join(ext, "drv", "B", "M_CARD.ARC"), "rb").read())[base["id"]])[0]
    for src, folder in ((big, "art"), (small, "mini")):
        im = ua.upscale_tiles([custom.recolour_image(src, f)], 1, "custom_%s_%03d" % (folder, c["id"]))[0]
        im.save(os.path.join(web, "assets", folder, name), "WEBP", quality=88, method=6)
    new = art.get("new")
    if new:                                        # as build_new_art.py does for the game's cards
        src = new_art_source(ext, new)
        up = comfy.upscale(src, ua.MODEL, "custom_new_%03d" % c["id"])
        up.resize((512, 512), Image.LANCZOS).save(os.path.join(web, "assets", "art2", name), "WEBP", quality=88, method=6)
        src.resize((160, 160), Image.LANCZOS).save(os.path.join(web, "assets", "mini2", name), "WEBP", quality=88, method=6)
    print("  %s: pictures %s%s" % (c["name"], name, " and new art" if new else ""))


def main():
    ext, web = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    ts_dir = os.path.join(os.path.dirname(os.path.abspath(ext)), "extracted_ts", "app_0")
    if "--ts" in rest:
        ts_dir = rest[rest.index("--ts") + 1]
        del rest[rest.index("--ts"):rest.index("--ts") + 2]
    what = [a for a in rest if a in PARTS] or list(PARTS)
    only = {int(a) for a in rest if a.isdigit()}
    d = custom.load()
    game = build_data.build_cards(open(os.path.join(ext, "drv", "B", "CARD2.CDD"), "rb").read())
    if "data" in what:
        sys.argv = [sys.argv[0], ext, web]
        build_data.main()
    if "battle" in what:
        for line in build_battle.write_scripts(ext, web):
            print(" ", line)
    for c in d["cards"]:
        if only and c["id"] not in only:
            continue
        base = custom.base_of(c, game)
        if "model" in what and "model" in c:
            do_model(ext, web, c, base, d["recolours"], ts_dir)
        if "battle" in what and "battle" in c:
            do_fx(ext, web, c, base, d["recolours"])
        if "art" in what and "art" in c:
            do_art(ext, web, c, base, d["recolours"])


if __name__ == "__main__":
    main()
