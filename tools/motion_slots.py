"""What the eight motions of a Digimon model are for, how long each lasts and when the battle
scripts start them. Made for the converter of the Time Stranger models (TS-204, TS-206): a
converted model has to fill the same slots with motions of the same lengths.

Usage (venv python):
  motion_slots.py <extracted_dir> <out.json>                 every card model
  motion_slots.py <extracted_dir> <out.json> <roster.md> <out.md>
                                                             and a table of the roster's bases

The slots (the chunk id of the motion in F:\\NNN.PAK is the slot number):
  0  standing      started by the director for whoever a script is about to play on
                   (0x801ee00c), for the attacker once the hit script is over (0x801ee86c,
                   0x801ee9ec), for a target that is still alive (0x801ee904, 0x801eea8c,
                   0x801eeabc), for an attack that does no damage (0x801eee50), after the
                   entrance (0x801ed934); and by the scripts themselves (command b.2 [0])
  1-3  attack 1-3  started by the card's attack script (b.2 [1..3]); for an attack that is
                   countered, by the director (0x801ee774 -> 0x801eebec: attack number + 1)
  4  damage        started by the hit script (b.2 [4])
  5  KO            never named: the interpreter turns 4 into 5 when the Digimon's HP is 0 or
                   less (0x801e8920 .. 0x801e896c, HP at 0x801ef9a4)
  6  victory       started by the director for the winner (0x801eeb0c)
  7  entrance      the one motion unpacked when the model is loaded, and the pose the model
                   is given then (0x8002de18 .. 0x8002de54); started by script 999 of
                   A:\\BATTLE.PAK (b.1 [7], then b.2 [7]), which the director plays on each
                   Digimon when the battle opens (0x801ee4e8, 0x801ee6b8)

How long a motion lasts (0x80022d34, 0x80022100, the task 0x80022b98; checked by running
these routines in an emulator on Agumon's attack 1: 240 frames for keys that add up to 216):
  The start (0x80022d34) aims the model at key 0 from the pose it is in, over 2 x the key's
  duration; this is the lead. Then the task takes the keys in turn, key 0 once more first,
  each over 2 x its duration. So a motion lasts  2 x d0 + sum(2 x d)  frames, and key k is
  reached at  2 x d0 + sum(2 x d[0..k])  frames after the start. After the last key the
  motion goes on at the key named in the "next" field of key 0's first record (its loop
  key), or stops there when that is -1; a stopped motion leaves the model in its last pose.
  A key's sound (field + 2, the sound number + 1) is played with 0x8002b498 when the model
  starts towards the key (0x80022184); for key 0 that happens twice, at the start and at the
  end of the lead. A model that is hidden is not moved on (0x80022bd0).
  Starting a motion always starts it from its first key, also when it is the one playing
  (0x8002daac only skips unpacking it again).

The scripts never wait for a motion: they wait a number of frames (b.10) and nothing in the
Digimon files reads the state of an object. The director waits for a motion in two places:
the target's damage or KO motion has to end before it goes on (0x801ee87c, 0x801ee9fc), and
the entrance has to end before the Digimon stands (0x801ed920).

JSON: {model number: {cards, parts, slots: [8 x {keys, durations, lead, frames, loop,
  loopFrames, sounds: [[frame, sound]]}], scripts: {id: {frames, starts: [[frame, who, slot]],
  parts: [[who, part]]}}, attacks: [3 x {card, script, hit}]}}
  frames: from the start of the motion to the frame after its last key is reached (lead
  included); loopFrames: the length of one repeat; who: 0 the script's own Digimon, 1 the
  other one; parts: the body parts the script hangs its objects on.
"""
import json
import os
import random
import re
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bscript  # noqa: E402
import omd  # noqa: E402
import pak  # noqa: E402

MEANING = ["standing", "attack 1", "attack 2", "attack 3", "damage", "KO", "victory", "entrance"]
N_DIGI = 191


def slot(keys):
    """keys (omd.parse_motion) -> the measures of one motion"""
    if not keys:
        return None
    d = [k["dur"] for k in keys]
    lead, loop = 2 * d[0], keys[0]["recs"][0]["next"]
    at = [lead + 2 * sum(d[:k]) for k in range(len(d))]         # the frame the model starts towards key k
    sounds = [[0, keys[0]["snd"] - 1]] if keys[0]["snd"] else []
    sounds += [[at[k], keys[k]["snd"] - 1] for k in range(len(d)) if keys[k]["snd"]]
    return {"keys": len(d), "durations": d, "lead": lead, "frames": lead + 2 * sum(d), "loop": loop,
            "loopFrames": 2 * sum(d[loop:]) if loop >= 0 else 0, "sounds": sounds}


def trace(script, seed=1):
    """Play a battle script without its objects (interpreter 0x801e8678, one frame 0x801e8500):
    -> {frames, starts: [[frame, who, slot]], parts: [[who, part]]}"""
    nv, cmds = bscript.parse(script)
    rnd = random.Random(seed)
    v, pc, skip, wait, ready, frames = [0] * max(nv, 460), 0, False, 0, False, 0
    starts, parts = [], set()

    def arg(c, i):
        x = v[c[3 + 2 * i]] if c[2 + 2 * i] else c[3 + 2 * i]
        x &= 0xFFFF
        return x - 65536 if x > 32767 else x

    while frames < 4000:
        v[0] = 1
        if wait:
            wait -= 1
        else:
            n = 0
            while pc < len(cmds) and n < 200000:
                n += 1
                c = cmds[pc]
                pc += 1
                if skip:
                    skip = False
                    continue
                if c[0] == 7:
                    _, var, op, ind, val = c
                    x = v[val] if ind else val
                    if op == 0: v[var] = x
                    elif op == 1: v[var] += x
                    elif op == 2: v[var] -= x
                    elif op == 3: v[var] *= x
                    elif op == 4: v[var] = int(v[var] / x) if x else 0
                    elif op == 5: v[var] = int(v[var] - x * int(v[var] / x)) if x else 0
                    elif op == 6: v[var] = rnd.randrange(32768) % (x + 1)
                elif c[0] == 9:
                    _, var, op, ind, val = c
                    x, y = (v[val] if ind else val), v[var]
                    skip = [y == x, y != x, y < x, y > x, y <= x, y >= x][op]
                elif c[0] == 5:
                    pc = c[1]
                elif c[0] == 0x0B and c[1] == 2:
                    starts.append([frames, v[0x1BE], arg(c, 0)])
                elif (c[0] == 0x0C and c[1] == 0 and arg(c, 1) not in (0, 3)) or (c[0] == 0x0B and c[1] == 6):
                    # 0x801e9494: the new object hangs on a body part (a light change, type 3,
                    # and a screen rectangle, type 0, hang on nothing)
                    if v[0x1B9] >= 0 and v[0x1BE] in (0, 1):
                        parts.add((v[0x1BE], v[0x1B9]))
                elif c[0] == 0x0B and c[1] == 10:                 # wait; not before the script is set up
                    if not ready:
                        if v[0] != -1:
                            continue
                        ready = True
                    wait = arg(c, 0) - 1
                    break
        frames += 1
        if v[0] == 0:
            break
    return {"frames": frames, "starts": starts, "parts": sorted(map(list, parts))}


def cards(ext):
    """-> [(card id, name, model, [(attack script, hit script)] x 3)] from B/CARD2.CDD"""
    cdd = open(os.path.join(ext, "drv", "B", "CARD2.CDD"), "rb").read()
    out = []
    for i in range(N_DIGI):
        r = cdd[8 + i * 316:8 + (i + 1) * 316]
        name = r[3:24].split(b"\0")[0].decode("ascii", "replace")
        out.append((i, name, r[0xE5], [struct.unpack_from("<HH", r, 0x22 + k * 28) for k in range(3)]))
    return out


def model(ext, num, users):
    """users: the cards() entries that name this model"""
    path = os.path.join(ext, "drv", "F", "%03d.PAK" % num)
    m, motions, _, scripts = omd.load(path)

    def script(sid):
        # 0x8002dc30: from the Digimon's own file, else E:\SKILL\SKILLn.MSD
        if sid in scripts:
            return scripts[sid]
        f = os.path.join(ext, "drv", "E", "SKILL", "SKILL%d.MSD" % sid)
        return open(f, "rb").read() if os.path.exists(f) else None

    out = {"cards": [u[0] for u in users], "parts": m["n"], "slots": [slot(motions.get(k)) for k in range(8)],
           "scripts": {}, "attacks": []}
    for cid, _, _, atks in users:
        for a, h in atks:
            out["attacks"].append({"card": cid, "script": a, "hit": h})
            for sid in (a, h):
                b = script(sid)
                if b is not None and str(sid) not in out["scripts"]:
                    out["scripts"][str(sid)] = trace(b)
    return out


def build(ext):
    by = {}
    for c in cards(ext):
        by.setdefault(c[2], []).append(c)
    return {str(num): model(ext, num, users) for num, users in sorted(by.items())
            if os.path.exists(os.path.join(ext, "drv", "F", "%03d.PAK" % num))}


def table(data, names, roster):
    """The bases named in roster.md ("Name (id)" in its Base column) -> markdown"""
    ids = []
    for line in open(roster, encoding="utf-8"):
        cols = [c.strip() for c in line.split("|")]
        if len(cols) > 6 and cols[1].isdigit():
            b = int(re.search(r"\((\d+)\)", cols[5]).group(1))
            if b not in ids:
                ids.append(b)
    ids.sort()
    of = {c: (num, d) for num, d in data.items() for c in d["cards"]}
    out = ["# Motion slots of the bases", "",
           "Made by `tools/motion_slots.py` from the disc (TS-204); the same numbers for every card",
           "model are in [motion-slots.json](motion-slots.json). Do not edit by hand.", "",
           "All numbers are frames (one step of the game's motion task and of a script). A slot's",
           "length runs from the command that starts it to the frame its last key is reached, the",
           "lead included (the first 2 x d0 frames, in which the model moves from the pose it was in",
           "to key 0). `↻n` = after the last key it goes on at key n, one repeat lasting the frames in",
           "brackets; without it the motion stops in its last pose. What each slot is and who starts",
           "it is in the README, \"Polygon Battle\".", "",
           "## Slot lengths", "",
           "| Base (id) | Model | Parts | 0 standing | 1 attack 1 | 2 attack 2 | 3 attack 3 | 4 damage | 5 KO | 6 victory | 7 entrance |",
           "|---|---|---|---|---|---|---|---|---|---|---|"]
    for b in ids:
        num, d = of[b]
        cells = []
        for s in d["slots"]:
            cells.append("%d%s" % (s["frames"], " ↻%d (%d)" % (s["loop"], s["loopFrames"]) if s["loop"] >= 0 else ""))
        out.append("| %s (%d) | %s | %d | %s |" % (names[b], b, num, d["parts"], " | ".join(cells)))
    out += ["", "## Where the scripts start them", "",
            "For each attack: the attack script, the frame of the script at which it starts the attack",
            "motion, how long the script runs, and the frames at which it puts its Digimon back to",
            "standing (slot 0). Then the hit script, which plays on the target: the frame at which it",
            "starts the target's damage motion (slot 4, or 5 at 0 HP) and how long it runs. When the hit",
            "script is over the director waits for that motion to end. Parts: the body parts of its own",
            "Digimon the script hangs objects on, by their number in the model (no script of a base",
            "hangs one on the other Digimon). The game does not check the number: one at or above the",
            "model's part count is not a body part.", "",
            "| Base (id) | Attack | Script | Starts slot at | Script frames | Standing at | Parts | Hit script | Damage at | Hit frames | Hit parts |",
            "|---|---|---|---|---|---|---|---|---|---|---|"]

    def parts(t):
        own = [str(p) for w, p in t["parts"] if w == 0]
        other = [str(p) for w, p in t["parts"] if w == 1]
        return (", ".join(own) + (" t: " + ", ".join(other) if other else "")).strip() or "-"

    for b in ids:
        num, d = of[b]
        for k, a in enumerate([x for x in d["attacks"] if x["card"] == b]):
            t, h = d["scripts"].get(str(a["script"])), d["scripts"].get(str(a["hit"]))
            atk = [f for f, w, s in t["starts"] if w == 0 and s == k + 1]
            idle = [str(f) for f, w, s in t["starts"] if w == 0 and s == 0]
            dmg = [str(f) for f, w, s in h["starts"] if s == 4] if h else []
            out.append("| %s (%d) | %d | %d | %s | %d | %s | %s | %s | %s | %s | %s |" % (
                names[b], b, k + 1, a["script"], ", ".join(map(str, atk)) or "-", t["frames"], ", ".join(idle) or "-", parts(t),
                a["hit"] if h else "-", ", ".join(dmg) or "-", h["frames"] if h else "-", parts(h) if h else "-"))
    return "\n".join(out) + "\n"


def main():
    ext, out = sys.argv[1], sys.argv[2]
    data = build(ext)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write("{\n" + ",\n".join(' "%s": %s' % (k, json.dumps(v, separators=(",", ":"))) for k, v in data.items()) + "\n}\n")
    print("%d models written to %s" % (len(data), out))
    if len(sys.argv) > 4:
        names = {c[0]: c[1] for c in cards(ext)}
        with open(sys.argv[4], "w", encoding="utf-8", newline="\n") as f:
            f.write(table(data, names, sys.argv[3]))
        print("table written to", sys.argv[4])


if __name__ == "__main__":
    main()
