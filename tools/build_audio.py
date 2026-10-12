"""Render the game's battle music and sound effects for the web game.

Usage (venv python):  build_audio.py <extracted_dir> <web_dir> [--missing]

With --missing only sound effects that have no file yet are rendered and the music is left
alone (the Vorbis encoder does not give the same bytes twice).

  web/assets/audio/bgm/NNN.ogg   battle themes named by the opponent decks (DECK2.DEK byte 104 for
                                 the board, byte 105 for the 3D battle), the free-battle themes
                                 and the end-of-match jingles
  web/assets/audio/se/XX.ogg     sound effects, XX = program*16 + tone in SE0.PAK
  web/js/data/audio.js           loop points and the sound list of every battle effect script

Sound effects are keyed on the way the game does it (0x8002b498): SsUtKeyOnV(voice, vab,
id >> 4, id & 15, note = 60, fine = 60 + (id & 15), 110, 110); 60 is the per-bank value
the loader reads for SE0.
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_battle  # noqa: E402
import effscript  # noqa: E402
import psxsnd as P  # noqa: E402

UI_SE = [0xA0, 0xA1, 0xA2, 0xA3, 0xA4]      # confirm, cancel, cursor, window open, window close
# card object task 0x8003b210: card starts moving, card turned over, card lands;
# 0xAA (number-roll tick, 0x8003e4f0) is already needed by the effect scripts
CARD_SE = [0xA5, 0xA6, 0xA7, 0xAA]
JINGLES = [149, 150]                         # end of match (0x801f2a40)
FREE_BATTLE = [143, 144]                     # 0x8f + rand % 2 when the opponent names no theme
FREE_BATTLE_3D = [147, 148]                  # 0x93 + rand % 2, the 3D battle's theme likewise


def write_ogg(path, pcm, quality=0.4):
    # written in blocks: libsndfile's Vorbis encoder crashes on very large single writes
    with sf.SoundFile(path, "w", samplerate=P.RATE, channels=2, format="OGG", subtype="VORBIS",
                      compression_level=quality) as f:
        for i in range(0, len(pcm), 32768):
            f.write(pcm[i:i + 32768])


def fit(pcm, peak=0.89):
    m = float(np.abs(pcm).max()) if len(pcm) else 0.0
    return pcm * (peak / m) if m > peak else pcm


def main():
    ext, web = sys.argv[1], sys.argv[2]
    missing = "--missing" in sys.argv[3:]
    out = os.path.join(web, "assets", "audio")
    os.makedirs(os.path.join(out, "bgm"), exist_ok=True)
    os.makedirs(os.path.join(out, "se"), exist_ok=True)
    manifest = {"bgm": {}, "se": [], "scripts": [], "frame": 1 / 60}
    old, js = {}, os.path.join(web, "js", "data", "audio.js")
    if missing and os.path.exists(js):
        text = open(js, encoding="utf-8").read()
        old = json.loads(text[text.index("{"):text.rindex("}") + 1])

    # ---- effect scripts and the sounds they need
    scripts = effscript.load(ext)
    need = set(UI_SE + CARD_SE)
    need.update(build_battle.sound_ids(ext))     # sounds the Polygon Battle scripts play
    for cmds in scripts:
        snd = effscript.sounds(cmds)
        manifest["scripts"].append([[t, s] for t, s in snd])
        need.update(s for _, s in snd)

    # ---- sound effects
    se = P.load_se(open(os.path.join(ext, "drv", "A", "SE0.PAK"), "rb").read())
    for sid in sorted(need):
        prog, tone = sid >> 4, sid & 15
        if prog >= len(se.programs) or tone >= len(se.programs[prog]["list"]):
            continue                              # not in this sound bank
        manifest["se"].append(sid)
        if missing and os.path.exists(os.path.join(out, "se", "%02x.ogg" % sid)):
            continue
        pcm = P.render_tone(se, prog, tone, note=60, fine=60 + tone, vol=110, hold_s=1.0)
        pcm = np.concatenate([pcm, np.zeros((int(0.02 * P.RATE), 2), np.float32)])
        write_ogg(os.path.join(out, "se", "%02x.ogg" % sid), np.clip(pcm, -1, 1), 0.5)
        print("  se %02x  %.2fs  peak %.2f" % (sid, len(pcm) / P.RATE, float(np.abs(pcm).max())), flush=True)

    # ---- music
    dek = open(os.path.join(ext, "drv", "B", "DECK2.DEK"), "rb").read()
    themes = set(FREE_BATTLE + FREE_BATTLE_3D)
    for i in range((len(dek) - 8) // 110):
        themes.update(b for b in dek[8 + i * 110 + 104:8 + i * 110 + 106] if b)
    for bid in sorted(themes) + JINGLES:
        path = os.path.join(ext, "drv", "A", "BGM", "BGM%02d.PAK" % bid)
        seq, vab = P.load_bgm(open(path, "rb").read())
        if missing and str(bid) in old.get("bgm", {}) and os.path.exists(os.path.join(out, "bgm", "%03d.ogg" % bid)):
            manifest["bgm"][str(bid)] = old["bgm"][str(bid)]
            continue
        pcm, ls, le = P.render_seq(seq, vab, loops=1)
        if le is not None:
            pcm = pcm[:int((le + 1.5) * P.RATE)]
        else:  # one-shot: trim trailing silence
            nz = np.nonzero(np.abs(pcm).max(axis=1) > 1e-4)[0]
            pcm = pcm[:(nz[-1] + int(0.3 * P.RATE)) if len(nz) else 1]
        pcm = fit(pcm * 0.5)
        write_ogg(os.path.join(out, "bgm", "%03d.ogg" % bid), pcm)
        manifest["bgm"][str(bid)] = {"loopStart": ls, "loopEnd": le}
        print("  bgm %3d  %.1fs  loop %s..%s  peak %.2f  rms %.3f" % (
            bid, len(pcm) / P.RATE, None if ls is None else round(ls, 2), None if le is None else round(le, 2),
            float(np.abs(pcm).max()), float(np.sqrt((pcm ** 2).mean()))), flush=True)

    with open(os.path.join(web, "js", "data", "audio.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by tools/build_audio.py from A/BGM, A/SE0.PAK and B/CBTL_EFF.ARC. Do not edit.\n")
        f.write("window.DDCB_AUDIO = " + json.dumps(manifest, separators=(",", ":")) + ";\n")


if __name__ == "__main__":
    main()
