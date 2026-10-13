"""Check that every file the site asks for is in the repository under exactly that name.

Usage:  python tools/check_paths.py        (from the repository; needs git and node)
        python tools/check_paths.py --working-tree   (include uncommitted new files)

A host with case-sensitive names (GitHub Pages) serves a file only under its exact name,
and Windows hides a mismatch. The site is published from git, so the names that count are
the ones git has, not the ones on this disk. Checked:

  - no two files in web/ whose names differ only by case
  - the names on disk are the names in git, and nothing in web/ is left out of git
  - every path the page names outright (index.html, the style sheet, the scripts)
  - every path the scripts put together: card pictures (the game's and the new art), the
    deck owners' pictures, UI pieces, models, arenas and their
    previews, attack effect files, sounds and music, taken from the same data the page reads

Sounds that scripts ask for but the sound bank does not have are not errors: the page stays
silent for those.
"""
import gzip
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "web")


def tracked():
    out = subprocess.run(["git", "-C", ROOT, "ls-files", "-z", "web"], capture_output=True, check=True).stdout
    return {p[len("web/"):] for p in out.decode("utf-8").split("\0") if p}


def on_disk():
    found = set()
    for d, _, files in os.walk(WEB):
        for f in files:
            found.add(os.path.relpath(os.path.join(d, f), WEB).replace(os.sep, "/"))
    return found


def page_data():
    """Card ids and models, and the sound list, read the way the page reads them."""
    js = r"""
      const path = require('path'), fs = require('fs'), web = process.argv[1];
      const E = require(path.join(web, 'js', 'engine.js'));
      const window = {};
      new Function('window', fs.readFileSync(path.join(web, 'js', 'data', 'audio.js'), 'utf8'))(window);
      console.log(JSON.stringify({
        cards: E.CARDS.map((c) => c.id),
        digimon: E.CARDS.filter((c) => c.type === 'digimon').map((c) => c.id),
        models: E.CARDS.filter((c) => c.model != null).map((c) => c.model),
        pics: E.DATA.decks.filter((d) => d.pic != null).map((d) => d.pic),
        se: window.DDCB_AUDIO.se, bgm: Object.keys(window.DDCB_AUDIO.bgm).map(Number)
      }));
    """
    return json.loads(subprocess.run(["node", "-e", js, WEB], capture_output=True, check=True).stdout)


def wanted():
    """-> {path relative to web/: where it is asked for}"""
    want = {}

    def add(p, why):
        want.setdefault(os.path.normpath(p).replace(os.sep, "/"), why)

    for page in ("index.html", "battle-preview.html"):
        html = open(os.path.join(WEB, page), encoding="utf-8").read()
        for m in re.finditer(r'(?:src|href)="([^"#:]+)"', html):
            add(m.group(1).split("?")[0], page)
    manifest = json.load(open(os.path.join(WEB, "manifest.webmanifest"), encoding="utf-8"))
    for icon in manifest["icons"]:
        add(icon["src"], "manifest.webmanifest")
    add("sw.js", "the service worker that index.html registers")
    css = open(os.path.join(WEB, "css", "style.css"), encoding="utf-8").read()
    for m in re.finditer(r"url\(([^)]+)\)", css):
        add(os.path.join("css", m.group(1).strip("'\"")), "css/style.css")
    names = set()
    for f in sorted(os.listdir(os.path.join(WEB, "js"))):
        if not f.endswith(".js"):
            continue
        src = open(os.path.join(WEB, "js", f), encoding="utf-8").read()
        for m in re.finditer(r"assets/[\w./-]+\.(?:png|webp|ogg|json\.gz|bin\.gz|json)", src):
            add(m.group(0), "js/" + f)
        names |= set(re.findall(r"tex: '(\w+)'", src)) | set(re.findall(r"tex\('(\w+)'", src))
    for n in sorted(names):
        add("assets/ui/%s.png" % n, "a UI piece named in js/ui.js")

    d = page_data()
    for i in d["cards"]:
        add("assets/mini/%03d.webp" % i, "card %d" % i)
        add("assets/art/%03d.webp" % i, "card %d" % i)
    for i in d["digimon"]:                                    # the new art, Digimon cards only
        add("assets/mini2/%03d.webp" % i, "new art of card %d" % i)
        add("assets/art2/%03d.webp" % i, "new art of card %d" % i)
    for i in sorted(set(d["pics"])):                          # the deck owners' pictures
        add("assets/owner/%03d.webp" % i, "owner picture %d" % i)
    for n in ("player", "player2"):
        add("assets/owner/%s.webp" % n, "the players' pictures in js/ui.js")
    for m in sorted(set(d["models"])):
        for ext in (".bin.gz", ".png", "p.png"):
            add("assets/models/%03d%s" % (m, ext), "model %d" % m)
    for i in d["se"]:
        add("assets/audio/se/%02x.ogg" % i, "sound %#x in js/data/audio.js" % i)
    for i in d["bgm"]:
        add("assets/audio/bgm/%03d.ogg" % i, "music %d in js/data/audio.js" % i)
    for a in json.load(open(os.path.join(WEB, "assets", "battle", "arenas.json"))):
        for ext in (".bin.gz", ".png", "p.png"):
            add("assets/models/bg%d%s" % (a["file"], ext), "arena %d" % a["file"])
        add("assets/battle/arena/%d.webp" % a["file"], "preview of arena %d" % a["file"])
        for ext in (".webp", ".json"):
            add("assets/battle/arena-hd/%d%s" % (a["file"], ext), "4x texture atlas of arena %d" % a["file"])
    scripts = json.loads(gzip.open(os.path.join(WEB, "assets", "battle", "scripts.json.gz")).read())
    for sid, cmds in scripts.items():
        for c in cmds:
            if c[0] == 0x0B and c[1] == 16 and not c[2]:      # the script's asset file
                add("assets/battle/fx/%d.bin.gz" % c[3], "battle script %s" % sid)
                break
    return want


def main():
    git, disk, want = tracked(), on_disk(), wanted()
    if "--working-tree" in sys.argv:
        git |= disk  # Local development: include new, deliberately uncommitted files.
    lower, problems = {}, []
    for p in sorted(git):
        if p.lower() in lower:
            problems.append("two names that differ only by case: %s and %s" % (lower[p.lower()], p))
        lower[p.lower()] = p
    for p in sorted(disk - git):
        other = lower.get(p.lower())
        problems.append("on disk as %s but in git as %s" % (p, other) if other else "not in git: %s" % p)
    for p in sorted(git - disk):
        if p.lower() not in {q.lower() for q in disk}:
            problems.append("in git but not on disk: %s" % p)
    for p, why in sorted(want.items()):
        if p not in git:
            other = lower.get(p.lower())
            problems.append(("asked for as %s but named %s (%s)" % (p, other, why)) if other else "missing: %s (%s)" % (p, why))
    inventory = "working tree" if "--working-tree" in sys.argv else "git"
    print("%d files in %s under web/, %d asked for by the page" % (len(git), inventory, len(want)))
    unused = sorted(git - set(want))
    print("%d files in %s that this check does not see asked for" % (len(unused), inventory))
    if "-v" in sys.argv:
        for p in unused:
            print("   ", p)
    for p in problems:
        print("PROBLEM", p)
    print("ok" if not problems else "%d problems" % len(problems))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
