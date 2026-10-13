"""Custom cards: cards that are not on the disc, made from one that is.

tools/custom_cards.json lists them. A custom card takes the model, the motions, the battle
scripts and the card pictures of a card of the game (its "base") and changes their colours;
its numbers and its effect are written in the list. None of this is from the game: the
README lists every custom card under "Not from the game code".

  {"recolours": {name: [rule, ...]},
   "cards": [{
     "id": 301,                      card number: the game's cards are 0-300, custom ones follow
     "name": "BlackWarGreymon",
     "base": "WarGreymon",           the card of the game it is made from (name or number)
     "spec": "Fire", "level": "U", "dp": 60, "pp": 20, "hp": 1750,
     "attacks": [{"name", "power"} x 3],       circle, triangle, cross
     "xfx": "Nature Foe x3",         the cross attack's effect, by its name in engine.js (XFX)
     "support": {"prio", "conds", "acts", "text"},   the support effect, as in cards.js
     "model":  {"number": 400, "recolour": name},    web/assets/models/400.*
     "battle": {"offset": 10000, "recolour": name, "accent": "dark"},
                                     the base's attack and hit scripts and their effect files,
                                     copied under their number + offset
     "art":    {"recolour": name,                     the game's pictures of the base, recoloured
                "new": {"file": "custom/x.png", "crop": [x, y, size]}}   picture for "New card art"
                or new: {"card": "BT2-009", "crop": [x, y, size]}        official card-list image
                or new: {"ref": "crescemon"}                            official Reference Book image
                                     Choose exactly one source. File crops use native pixels;
                                     card crops use the normalized 430x600 image. Internet
                                     sources cache under <extracted_dir>/newart.
                                     A card/ref source may also name "edited": "edited/ts002/303.png";
                                     the recorded recipe and native edited crop are verified before use.
                shared: true      optional: same prepared native picture in both art modes
   }],
   "decks": [{                      a deck of the game with some of its cards exchanged; it
     "name": "Black Fire Again",    follows the game's 159 decks and keeps the owner, the rank,
     "base": {"name": "Black Fire Heart", "owner": "BK WarGreymon"},     the armor form and
     "replace": {"WarGreymon": "BlackWarGreymon"}                        the music of its base
   }]}

A recolour is a list of rules; the first rule that takes a colour changes it, a colour no
rule takes stays as it is:

  {"hue": [lo, hi],              degrees; lo > hi goes round through 0
   "sat": [min, max],            0..1, default [0.2, 1]: greys are left alone
   "val": [min, max],            0..1, default [0, 1]
   "colours": [[r, g, b], ...],  instead of the three above: exactly these colours
   "to": {"hue": h | [h at lo, h at hi],
          "sat": k | [k, plus],  new saturation = old x k + plus
          "val": k | [k, plus]}}

This module holds what the other exporters need (build_data.py: the card records;
build_battle.py: the scripts). build_custom.py makes the files.
"""
import colorsys
import json
import os
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
SPEC = ["Fire", "Ice", "Nature", "Darkness", "Rare"]
LEVEL = {"R": 0, "A": 1, "C": 2, "U": 3}
# the names of the cross attack's effects, in the order of the game's table (engine.js: XFX)
XFX = ["None", "1st Attack", "○ to 0", "△ to 0", "✕ to 0", "○ Counter", "△ Counter", "✕ Counter", "Crash",
       "Eat-up HP", "Jamming", "Fire Foe x3", "Ice Foe x3", "Nature Foe x3", "Darkness Foe x3", "Rare Foe x3"]
FIRST_ID = 301          # the game's cards end at 300
FIRST_MODEL = 400       # the game's models end at 300


def load():
    with open(os.path.join(HERE, "custom_cards.json"), encoding="utf-8") as f:
        d = json.load(f)
    ids, models, offsets = set(), set(), set()
    for c in d["cards"]:
        assert c["id"] >= FIRST_ID and c["id"] not in ids, "card number %s" % c["id"]
        ids.add(c["id"])
        if "model" in c:
            n = c["model"]["number"]
            assert FIRST_MODEL <= n < 1000 and n not in models, "model number %s" % n
            models.add(n)
        if "battle" in c:
            o = c["battle"]["offset"]
            assert o >= 10000 and o % 10000 == 0 and o not in offsets, "script offset %s" % o
            offsets.add(o)
    assert sorted(ids) == list(range(FIRST_ID, FIRST_ID + len(ids))), "custom card numbers must follow each other from %d" % FIRST_ID
    return d


def base_of(c, cards):
    """The card of the game a custom card is made from."""
    b = c["base"]
    hit = [x for x in cards if x["type"] == "digimon" and (x["id"] == b or x["name"] == b)]
    assert len(hit) == 1, "base card %r" % (b,)
    return hit[0]


def decks(game_decks, all_cards):
    """-> the custom decks as records of cards.js, to follow the game's. all_cards: the
    game's cards and the custom ones."""
    ids = {}
    for c in all_cards:
        ids.setdefault(c["name"], c["id"])
    out = []
    for d in load().get("decks", []):
        base = [x for x in game_decks if x["name"] == d["base"]["name"] and x["owner"] == d["base"]["owner"]]
        assert base, "base deck %r" % (d["base"],)
        base = base[0]
        swap = {ids[a]: ids[b] for a, b in d["replace"].items()}
        assert all(a in base["cards"] for a in swap), "deck %s: a card to replace is not in %s" % (d["name"], base["name"])
        assert len(d["name"]) <= 18 and not any(x["name"] == d["name"] for x in game_decks + out), "deck name %s" % d["name"]
        out.append(dict(base, id=len(game_decks) + len(out), name=d["name"],
                        cards=[swap.get(i, i) for i in base["cards"]],
                        custom=base["id"]))                # not a deck of the game: made from this one
    return out


def cards(game_cards):
    """-> the custom cards as records of cards.js, to follow the game's."""
    out = []
    for c in load()["cards"]:
        base, b, s = base_of(c, game_cards), c.get("battle"), c["support"]
        assert len(c["attacks"]) == 3
        atk = []
        for a, ba in zip(c["attacks"], base["atk"]):
            r = {"name": a["name"], "power": a["power"],
                 "script": ba["script"] + (b["offset"] if b else 0), "hit": ba["hit"] + (b["offset"] if b else 0)}
            if b and b.get("accent"):
                r["accent"] = b["accent"]      # battlehd.js: the enhanced effects' colour family
            atk.append(r)
        out.append({
            "id": c["id"], "type": "digimon", "name": c["name"],
            "spec": SPEC.index(c["spec"]), "level": LEVEL[c["level"]],
            "dp": c["dp"], "pp": c["pp"], "hp": c["hp"], "atk": atk, "xfx": XFX.index(c["xfx"]),
            "model": c["model"]["number"] if "model" in c else base["model"],
            "prio": s["prio"], "conds": s["conds"], "acts": s["acts"], "text": s["text"],
            "custom": base["id"],              # not a card of the game: made from this one
        })
    return out


# ---------------------------------------------------------------- colours
def recolour(rules):
    """-> f(r, g, b) -> (r, g, b), 0..255"""
    memo = {}

    def pair(x):
        return (x[0], x[1]) if isinstance(x, list) else (x, 0)

    def f(r, g, b):
        key = (r, g, b)
        if key in memo:
            return memo[key]
        h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        h *= 360
        out = key
        for rule in rules:
            t = 0.5
            if "colours" in rule:
                if [r, g, b] not in rule["colours"]:
                    continue
            else:
                lo, hi = rule["hue"]
                span = (hi - lo) % 360 or 360
                at = (h - lo) % 360
                smin, smax = rule.get("sat", [0.2, 1])
                vmin, vmax = rule.get("val", [0, 1])
                if at > span or not smin <= s <= smax or not vmin <= v <= vmax:
                    continue
                t = at / span
            to = rule["to"]
            nh = to.get("hue", h)
            if isinstance(nh, list):
                nh = nh[0] + (nh[1] - nh[0]) * t
            sk, sp = pair(to.get("sat", 1))
            vk, vp = pair(to.get("val", 1))
            ns, nv = min(max(s * sk + sp, 0), 1), min(max(v * vk + vp, 0), 1)
            out = tuple(int(round(x * 255)) for x in colorsys.hsv_to_rgb((nh % 360) / 360.0, ns, nv))
            break
        memo[key] = out
        return out
    return f


def five_bit(c):
    """A colour as the PlayStation holds it: 5 bits a channel (build_models.rgba)."""
    return tuple((x * 31 + 127) // 255 * 255 // 31 for x in c)


def recolour_palette(rgba, f):
    """rows of 256 RGBA colours, as build_models.convert gives them; transparent ones stay."""
    out = bytearray(rgba)
    for i in range(0, len(out), 4):
        if out[i + 3]:
            out[i:i + 3] = bytes(five_bit(f(out[i], out[i + 1], out[i + 2])))
    return bytes(out)


def recolour_model(data, f):
    """The vertex colours of a model in the form of build_models.convert (13 words a vertex,
    colour in words 6-8)."""
    w = list(struct.unpack("<%dH" % (len(data) // 2), data))
    assert w[0] == 0x4D44
    o = 10 + w[2] * 4
    for i in range(w[4]):
        k = o + i * 13 + 6
        if max(w[k:k + 3]) < 256:
            w[k:k + 3] = f(*w[k:k + 3])
    return struct.pack("<%dH" % len(w), *w)


def recolour_image(im, f):
    im = im.convert("RGB")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            px[x, y] = f(*px[x, y])
    return im


# ---------------------------------------------------------------- battle scripts
NODE = 0x197                                   # the node variables of a battle script (battle3d.js: MAP)
COLOURS = (0x29, 0x2C, 0x2F)                   # first, second and third colour (r, g, b each)
# The colours an object type is created from, as (first variable, full value): the screen
# rectangle, the ring and the particles (0..255), and the light change, which keeps its two
# colours in the scale and scale-target variables with 4096 for full.
USES = {0: [(v, 255) for v in COLOURS[:2]], 13: [(v, 255) for v in COLOURS], 17: [(v, 255) for v in COLOURS[:2]],
        3: [(NODE + 17, 4096), (NODE + 20, 4096)]}


def _bytes(vals, full):
    """Three values of a script as a colour 0..255, and the value that stands for 255."""
    top = max(max(vals), full)
    return tuple(min(max(int(round(x * 255.0 / top)), 0), 255) for x in vals), top


def recolour_script(cmds, f, offset):
    """A battle script (bscript.parse) whose objects are created in other colours, and whose
    asset file is the one numbered `offset` higher.

    The script is kept as it is but for commands put around each c.0 (create an object): the
    colour variables that object type reads are set to the changed colour just before it and
    back to what they were just after, so nothing else the script does with them changes.
    That needs the values to be known where the object is created. They are followed from
    the top (a variable never set is 0); a variable that is computed, set under a test, or
    set on only one of two ways to the place is not known, and that colour is left alone.
    -> (commands, colours changed, colours left)"""
    targets = {}                                   # command -> the jumps that go to it
    for j, c in enumerate(cmds):
        if c[0] == 5:
            targets.setdefault(c[1], []).append(j)
    sets = [c[1] if c[0] == 7 else None for c in cmds]
    known, before, after, done, left = {}, {}, {}, 0, 0
    for i, c in enumerate(cmds):
        for j in targets.get(i, ()):               # two ways here: what either sets is not known
            for v in sets[min(i, j):max(i, j) + 1]:
                if v is not None:
                    known[v] = None
        if c[0] == 7:
            plain = c[2] == 0 and not c[3] and not (i and cmds[i - 1][0] == 9)
            known[c[1]] = c[4] if plain else None
            continue
        if c[0] != 0x0C or c[1] != 0:
            continue
        typ = known.get(c[5], 0) if c[4] else c[5]
        for var, full in USES.get(typ, ()):
            vals = [known.get(var + k, 0) for k in range(3)]
            if None in vals or min(vals) < 0:
                left += 1
                continue
            rgb, top = _bytes(vals, full)
            new = f(*rgb)
            if new == rgb:
                continue
            res = [int(round(x * top / 255.0)) for x in new]
            k = i
            while k and cmds[k - 1][0] == 9:       # created under a test: set before the test
                k -= 1
            for n in range(3):
                if res[n] != vals[n]:
                    before.setdefault(k, []).append([7, var + n, 0, 0, res[n]])
                    after.setdefault(i, []).append([7, var + n, 0, 0, vals[n]])
            done += 1
    out, at = [], {}
    for i, c in enumerate(cmds):
        at[i] = len(out)                           # a jump to a command lands on what was put before it
        out += before.get(i, [])
        c = list(c)
        if c[0] == 0x0B and c[1] == 16 and not c[2]:
            c[3] += offset                         # b.16: the script's asset file
        out.append(c)
        out += after.get(i, [])
    at[len(cmds)] = len(out)
    for c in out:
        if c[0] == 5:
            c[1] = at[c[1]]
    return out, done, left


def created(cmds, seed=1, limit=200000):
    """Run a battle script without drawing, as btrace.py does, and list what it creates:
    [(object type, [(the three values of a colour, full value), ...])]."""
    import random
    rnd = random.Random(seed)
    v, pc, skip, n, out = [0] * 460, 0, False, 0, []
    while pc < len(cmds) and n < limit:
        n += 1
        c = cmds[pc]
        pc += 1
        if skip:
            skip = False
        elif c[0] == 7:
            _, var, op, ind, val = c
            x = v[val] if ind else val
            if op == 0:
                v[var] = x
            elif op == 1:
                v[var] += x
            elif op == 2:
                v[var] -= x
            elif op == 3:
                v[var] *= x
            elif op == 4:
                v[var] = int(v[var] / x) if x else 0
            elif op == 5:
                v[var] = v[var] % x if x else 0
            elif op == 6:
                v[var] = rnd.randrange(32768) % (x + 1)
        elif c[0] == 9:
            _, var, op, ind, val = c
            x = v[val] if ind else val
            skip = {0: v[var] == x, 1: v[var] != x, 2: v[var] < x, 3: v[var] > x, 4: v[var] <= x, 5: v[var] >= x}[op]
        elif c[0] == 5:
            pc = c[1]
        elif c[0] == 0x0C and c[1] == 0:
            typ = v[c[5]] if c[4] else c[5]
            out.append((typ, [(tuple(v[var:var + 3]), full) for var, full in USES.get(typ, ())]))
    return out


def check_script(old, new, f):
    """Both scripts run with the same random numbers: every object of the new one should be
    created in the changed colours of the old one's. -> (colours as wanted, colours not)"""
    a, b = created(old), created(new)
    assert [t for t, _ in a] == [t for t, _ in b], "the scripts do not create the same objects"
    good = bad = 0
    for (_, ca), (_, cb) in zip(a, b):
        for (va, full), (vb, _) in zip(ca, cb):
            rgb, top = _bytes(va, full)
            got = tuple(min(max(int(round(x * 255.0 / top)), 0), 255) for x in vb)
            if max(abs(x - y) for x, y in zip(f(*rgb), got)) <= 1:
                good += 1
            else:
                bad += 1
    return good, bad


def scripts(game_scripts, game_cards):
    """-> {id: commands} of the custom cards' battle scripts, and a line of counts for each."""
    d = load()
    out, notes = {}, []
    for c in d["cards"]:
        b = c.get("battle")
        if not b:
            continue
        f = recolour(d["recolours"][b["recolour"]])
        for a in base_of(c, game_cards)["atk"]:
            for sid in (a["script"], a["hit"]):
                if sid + b["offset"] in out or sid not in game_scripts:
                    continue
                assert sid + b["offset"] not in game_scripts
                new, done, left = recolour_script(game_scripts[sid], f, b["offset"])
                good, bad = check_script(game_scripts[sid], new, f)
                out[sid + b["offset"]] = new
                notes.append("%s: script %d from %d: %d colours set, %d left; when run %d objects' colours as wanted, %d not" % (
                    c["name"], sid + b["offset"], sid, done, left, good, bad))
    return out, notes
