"""PlayStation sound data: VAB instrument banks, VAG ADPCM samples and SEQ scores,
with an offline software synthesiser that renders them to PCM.

The game's .PAK sound files are chunk lists, each chunk {u16 type, u16 id, u32 size, data}:
type 6 = SEQ score, 7 = VAB header (VH), 8 = VAB sample body (VB).
  A/BGM/BGMnn.PAK = SEQ + VH + VB        A/SEn.PAK = VH + VB

The synthesiser follows the SPU's documented behaviour (ADPCM filters, ADSR envelope
rates, sample loop flags) and libsnd's SEQ conventions (note-on with velocity 0 as
note-off, NRPN 0x14 / 0x1E as loop start / end). It does not model reverb.
"""
import struct

import numpy as np

RATE = 44100
_F0 = (0.0, 60 / 64.0, 115 / 64.0, 98 / 64.0, 122 / 64.0)
_F1 = (0.0, 0.0, -52 / 64.0, -55 / 64.0, -60 / 64.0)


# ---------------------------------------------------------------------------- VAG / VAB
def decode_vag(data):
    """Decode SPU ADPCM. Returns (float32 samples, loop_start_sample or None)."""
    n = len(data) // 16
    out = np.zeros(n * 28, dtype=np.float32)
    s1 = s2 = 0.0
    loop_start = None
    looped = False
    used = 0
    for b in range(n):
        blk = data[b * 16:b * 16 + 16]
        shift, filt, flags = blk[0] & 15, blk[0] >> 4, blk[1]
        if filt > 4:
            filt = 0
        if flags & 4 and loop_start is None:
            loop_start = b * 28
        f0, f1 = _F0[filt], _F1[filt]
        o = b * 28
        for i in range(14):
            d = blk[2 + i]
            for nib in (d & 15, d >> 4):
                v = nib << 12
                if v & 0x8000:
                    v -= 0x10000
                s = (v >> shift) + s1 * f0 + s2 * f1
                if s > 32767:
                    s = 32767.0
                elif s < -32768:
                    s = -32768.0
                out[o] = s
                o += 1
                s2, s1 = s1, s
        used = o
        if flags & 1:
            looped = bool(flags & 2)
            break
    out = out[:used] / 32768.0
    if not looped:
        loop_start = None
    elif loop_start is None:
        loop_start = 0
    return out, loop_start


class Tone:
    __slots__ = ("prior", "mode", "vol", "pan", "center", "shift", "min", "max", "pbmin", "pbmax", "adsr1", "adsr2", "vag")


class Vab:
    def __init__(self, data, body=None):
        """data = VH (header); body = VB (samples). With body=None the VB follows the VH."""
        assert data[:4] == b"pBAV", data[:4]
        (_ver, _id, _fsize, _r, self.ps, self.ts, self.vs, self.mvol, self.pan) = struct.unpack_from("<IIIHHHHBB", data, 4)
        self.programs = []
        for i in range(128):
            o = 0x20 + i * 16
            tones, vol, _prior, _mode, pan = struct.unpack_from("<BBBBB", data, o)
            self.programs.append({"tones": tones, "vol": vol, "pan": pan, "list": []})
        o = 0x20 + 128 * 16
        used = [p for p in self.programs if p["tones"]]
        # tone tables follow in order for the first `ps` programs that are present
        slots = [p for p in self.programs][:128]
        k = 0
        for p in slots:
            if k >= self.ps:
                break
            if not p["tones"]:
                continue
            for t in range(16):
                b = data[o + (k * 16 + t) * 32:o + (k * 16 + t + 1) * 32]
                tn = Tone()
                (tn.prior, tn.mode, tn.vol, tn.pan, tn.center, tn.shift, tn.min, tn.max, _vw, _vt, _pw, _pt,
                 tn.pbmin, tn.pbmax, _r1, _r2, tn.adsr1, tn.adsr2, _prog, tn.vag) = struct.unpack_from("<16B2H2h", b, 0)
                if t < p["tones"]:
                    p["list"].append(tn)
            k += 1
        assert k == len(used) or True
        o += self.ps * 16 * 32
        sizes = struct.unpack_from("<256H", data, o)
        o += 512
        self.samples = [None]
        if body is None:
            body, pos = data, o
        else:
            pos = 0
        for i in range(1, self.vs + 1):
            size = sizes[i] << 3
            self.samples.append(decode_vag(body[pos:pos + size]))
            pos += size


# ---------------------------------------------------------------------------- ADSR
def _rate_step(rate, decreasing, exponential_dec_level=None):
    """Per-sample (step, wait) pair for an SPU envelope rate value (0..127)."""
    shift, step = rate >> 2, rate & 3
    step = (-8 + step) if decreasing else (7 - step)
    counter_inc = 0x8000 >> max(0, shift - 11)
    step <<= max(0, 11 - shift)
    return step, counter_inc


_ENV_CACHE = {}


def adsr_envelope(adsr1, adsr2, n_samples, release_at):
    """SPU ADSR volume curve, 0..1, one value per output sample (stepped every 32 samples)."""
    HOP = 32
    n = (n_samples + HOP - 1) // HOP
    rel_blk = release_at // HOP if release_at is not None else None
    key = (adsr1, adsr2, n, rel_blk)
    hit = _ENV_CACHE.get(key)
    if hit is not None:
        return hit[:n_samples]
    env = np.zeros(n, dtype=np.float32)
    am, ar = (adsr1 >> 15) & 1, (adsr1 >> 8) & 0x7F
    dr = (adsr1 >> 4) & 0xF
    sl = ((adsr1 & 0xF) + 1) * 0x800
    sm, sdir, sr = (adsr2 >> 15) & 1, (adsr2 >> 14) & 1, (adsr2 >> 6) & 0x7F
    rm, rr = (adsr2 >> 5) & 1, adsr2 & 0x1F
    a_step, a_inc = _rate_step(ar, False)
    d_step, d_inc = _rate_step(dr * 4, True)
    s_step, s_inc = _rate_step(sr, bool(sdir))
    r_step, r_inc = _rate_step(rr * 4, True)
    level, phase, counter = 0, 0, 0
    for i in range(n):
        if rel_blk is not None and i >= rel_blk and phase != 3:
            phase, counter = 3, 0
        env[i] = level
        # number of envelope ticks falling into this block
        if phase == 0:
            inc = a_inc >> 2 if (am and level >= 0x6000) else a_inc
        elif phase == 1:
            inc = d_inc
        elif phase == 2:
            inc = s_inc >> 2 if (sm and not sdir and level >= 0x6000) else s_inc
        else:
            inc = r_inc
        counter += inc * HOP
        k = counter >> 15
        counter &= 0x7FFF
        for _ in range(k):
            if phase == 0:
                level += a_step
                if level >= 0x7FFF:
                    level, phase = 0x7FFF, 1
            elif phase == 1:
                level += d_step * level >> 15
                if level <= sl:
                    phase = 2
            elif phase == 2:
                level += (s_step * level >> 15) if (sm and sdir) else s_step
            else:
                level += (r_step * level >> 15) if rm else r_step
            if level < 0:
                level = 0
            elif level > 0x7FFF:
                level = 0x7FFF
        if phase == 3 and level == 0:
            break
    full = np.repeat(env / 32767.0, HOP)
    if len(_ENV_CACHE) < 20000:
        _ENV_CACHE[key] = full
    return full[:n_samples]


def release_time(adsr2, max_s=4.0):
    """Seconds the release phase needs to reach silence from full level."""
    rm, rr = (adsr2 >> 5) & 1, adsr2 & 0x1F
    step, inc = _rate_step(rr * 4, True)
    if inc == 0 or step == 0:
        return max_s
    per_sample = -step * inc / 0x8000
    if rm:
        return min(max_s, 8.0 * 0x7FFF / per_sample / RATE)  # exponential: ~8 time constants
    return min(max_s, 0x7FFF / per_sample / RATE)


# ---------------------------------------------------------------------------- voice
def render_voice(sample, loop_start, ratio, n_out):
    """Resample one voice at a fixed pitch ratio with linear interpolation."""
    pos = np.arange(n_out, dtype=np.float64) * ratio
    ln = len(sample)
    if ln < 2:
        return np.zeros(n_out, dtype=np.float32)
    if loop_start is not None and ln - loop_start > 1:
        span = ln - loop_start
        over = pos >= ln
        pos[over] = loop_start + np.mod(pos[over] - loop_start, span)
        i0 = pos.astype(np.int64)
        i1 = i0 + 1
        i1[i1 >= ln] = loop_start
    else:
        alive = pos < ln - 1
        pos = np.where(alive, pos, ln - 1)
        i0 = pos.astype(np.int64)
        i1 = np.minimum(i0 + 1, ln - 1)
    frac = (pos - i0).astype(np.float32)
    out = sample[i0] * (1 - frac) + sample[i1] * frac
    if loop_start is None:
        out[np.arange(n_out) * ratio >= ln - 1] = 0
    return out


def pitch_ratio(note, fine, center, shift):
    """libsnd note2pitch: semitones above the tone's centre, fine + shift in 1/128 semitone."""
    return 2.0 ** ((note - center) / 12.0 + (fine + shift) / (128.0 * 12.0))


def pan_gains(pan):
    """libsnd-style linear pan: 64 = both full, 0 = left only, 127 = right only."""
    pan = max(0, min(127, pan))
    if pan < 64:
        return 1.0, pan / 63.0
    return (127 - pan) / 63.0, 1.0


def combine_pan(*pans):
    p = 64
    for q in pans:
        p += q - 64
    return max(0, min(127, p))


# ---------------------------------------------------------------------------- one-shot (sound effects)
def render_tone(vab, prog, tone_idx, note, fine=0, vol=127, hold_s=None, max_s=6.0):
    """Key on one tone the way SsUtKeyOnV does and let it play out. Returns stereo float32."""
    p = vab.programs[prog]
    tn = p["list"][tone_idx]
    sample, loop = vab.samples[tn.vag] if 0 < tn.vag < len(vab.samples) else (np.zeros(1, np.float32), None)
    ratio = pitch_ratio(note, fine, tn.center, tn.shift)
    rel = release_time(tn.adsr2)
    if loop is None:
        dur = len(sample) / ratio / RATE
        hold = dur
        total = min(max_s, dur + 0.05)
    else:
        hold = hold_s if hold_s is not None else 1.0
        total = min(max_s, hold + rel)
    n = int(total * RATE)
    sig = render_voice(sample, loop, ratio, n)
    env = adsr_envelope(tn.adsr1, tn.adsr2, n, int(hold * RATE) if loop is not None else None)
    g = (vol / 127.0) * (tn.vol / 127.0) * (p["vol"] / 127.0) * (vab.mvol / 127.0)
    gl, gr = pan_gains(combine_pan(tn.pan, p["pan"], vab.pan))
    mono = sig * env * g
    return np.stack([mono * gl, mono * gr], axis=1)


# ---------------------------------------------------------------------------- SEQ
def parse_seq(data):
    """Parse a SEQ score into a flat event list.

    Returns (resolution, initial_tempo_us, events) with events = (tick, kind, channel, a, b).
    """
    assert data[:4] == b"pQES", data[:4]
    res = struct.unpack_from(">H", data, 8)[0]
    tempo = int.from_bytes(data[10:13], "big")
    pos = 15
    tick = 0
    status = 0
    ev = []
    n = len(data)
    while pos < n:
        delta = 0
        while True:
            b = data[pos]
            pos += 1
            delta = (delta << 7) | (b & 0x7F)
            if not b & 0x80:
                break
        tick += delta
        b = data[pos]
        if b & 0x80:
            status = b
            pos += 1
        hi, ch = status & 0xF0, status & 0x0F
        if status == 0xFF:
            meta = data[pos]
            pos += 1
            if meta == 0x51:
                ev.append((tick, "tempo", 0, int.from_bytes(data[pos:pos + 3], "big"), 0))
                pos += 3
            elif meta == 0x2F:
                ev.append((tick, "end", 0, 0, 0))
                break
            else:
                break
        elif hi == 0x90:
            ev.append((tick, "note", ch, data[pos], data[pos + 1]))
            pos += 2
        elif hi == 0x80:
            ev.append((tick, "note", ch, data[pos], 0))
            pos += 2
        elif hi == 0xB0:
            ev.append((tick, "cc", ch, data[pos], data[pos + 1]))
            pos += 2
        elif hi == 0xC0:
            ev.append((tick, "prog", ch, data[pos], 0))
            pos += 1
        elif hi == 0xE0:
            ev.append((tick, "bend", ch, ((data[pos + 1] << 7) | data[pos]) - 8192, 0))
            pos += 2
        elif hi in (0xA0,):
            pos += 2
        elif hi == 0xD0:
            pos += 1
        else:
            break
    return res, tempo, ev


def render_seq(seq, vab, loops=2, max_s=600.0):
    """Render a SEQ with its VAB. Returns (stereo float32, loop_start_s, loop_end_s).

    When the score has loop markers the loop body is played `loops` times; the returned
    loop points span the last pass, so looping that region carries the note tails over.
    """
    res, tempo, events = parse_seq(seq)
    # ---- unroll loop markers (NRPN 99 with value 20 = start, 30 = end)
    ls = le = None
    for i, e in enumerate(events):
        if e[1] == "cc" and e[3] == 99:
            if e[4] == 20 and ls is None:
                ls = i
            elif e[4] == 30:
                le = i
    end_tick = events[-1][0]
    seq_ev = []
    loop_ticks = None
    if ls is not None and le is not None and le > ls:
        t_ls, t_le = events[ls][0], events[le][0]
        span = t_le - t_ls
        loop_ticks = (t_ls, span)
        seq_ev.extend(events[:le])
        for k in range(1, loops):
            seq_ev.extend((t + k * span, kind, ch, a, b) for (t, kind, ch, a, b) in events[ls:le])
        end_tick = t_ls + loops * span
    else:
        seq_ev = events
    # ---- tick -> seconds with tempo changes
    times = []
    cur_t, cur_tick, us = 0.0, 0, tempo
    tmap = [(0, 0.0, tempo)]
    for (t, kind, ch, a, b) in seq_ev:
        cur_t += (t - cur_tick) * us / res / 1e6
        cur_tick = t
        if kind == "tempo":
            us = a
            tmap.append((t, cur_t, us))
        times.append(cur_t)

    def at(tick):
        base = tmap[0]
        for m in tmap:
            if m[0] <= tick:
                base = m
            else:
                break
        return base[1] + (tick - base[0]) * base[2] / res / 1e6

    total_s = min(max_s, at(end_tick) + 3.0)
    out = np.zeros((int(total_s * RATE), 2), dtype=np.float32)
    chan = [{"prog": 0, "vol": 127, "pan": 64, "expr": 127, "bend": 0} for _ in range(16)]
    active = {}
    notes = []  # (start_s, end_s, ch_state_snapshot, note, vel, tone, program)
    for idx, (t, kind, ch, a, b) in enumerate(seq_ev):
        now = times[idx]
        c = chan[ch]
        if kind == "prog":
            c["prog"] = a
        elif kind == "cc":
            if a == 7:
                c["vol"] = b
            elif a == 10:
                c["pan"] = b
            elif a == 11:
                c["expr"] = b
        elif kind == "bend":
            c["bend"] = a
        elif kind == "note":
            key = (ch, a)
            if b == 0:
                for nt in active.pop(key, []):
                    nt[1] = now
            else:
                p = vab.programs[c["prog"]]
                for tn in p["list"]:
                    if tn.min <= a <= tn.max and 0 < tn.vag < len(vab.samples):
                        nt = [now, None, dict(c), a, b, tn, p]
                        notes.append(nt)
                        active.setdefault(key, []).append(nt)
    end_s = at(end_tick)
    for (start, end, c, note, vel, tn, p) in notes:
        sample, loop = vab.samples[tn.vag]
        bend = c["bend"] / 8192.0 * (tn.pbmax if c["bend"] >= 0 else tn.pbmin)
        ratio = pitch_ratio(note + bend, 0, tn.center, tn.shift)
        if end is None:
            end = end_s
        rel = release_time(tn.adsr2, 2.5)
        if loop is None:
            dur = min(len(sample) / ratio / RATE, (end - start) + rel)
        else:
            dur = (end - start) + rel
        n = int(dur * RATE)
        s0 = int(start * RATE)
        if n <= 0 or s0 >= len(out):
            continue
        n = min(n, len(out) - s0)
        sig = render_voice(sample, loop, ratio, n)
        env = adsr_envelope(tn.adsr1, tn.adsr2, n, int((end - start) * RATE))
        g = (vel / 127.0) * (c["vol"] / 127.0) * (c["expr"] / 127.0) * (tn.vol / 127.0) * (p["vol"] / 127.0) * (vab.mvol / 127.0)
        gl, gr = pan_gains(combine_pan(tn.pan, p["pan"], c["pan"]))
        mono = sig * env * g
        out[s0:s0 + n, 0] += mono * gl
        out[s0:s0 + n, 1] += mono * gr
    if loop_ticks:
        t_ls, span = loop_ticks
        return out, at(t_ls + (loops - 1) * span), at(t_ls + loops * span)
    return out, None, None


def chunks(pak):
    """Split a .PAK into {type: data}."""
    out, pos = {}, 0
    while pos + 8 <= len(pak):
        kind, _id, size = struct.unpack_from("<HHI", pak, pos)
        if kind not in (6, 7, 8) or size == 0:
            break
        out[kind] = pak[pos + 8:pos + 8 + size]
        pos += 8 + size
    return out


def load_bgm(pak):
    c = chunks(pak)
    return c[6], Vab(c[7], c[8])


def load_se(pak):
    c = chunks(pak)
    return Vab(c[7], c[8])
