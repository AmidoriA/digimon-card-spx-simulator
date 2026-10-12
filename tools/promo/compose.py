"""Compose the promo video from the captured frames.

usage (from the work folder that holds the captures, see make.sh):
  python3 compose.py out.mp4                 the video, without sound
  python3 compose.py outdir --preview N      every Nth frame as JPEGs
"""
import json, math, os, subprocess, sys
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance, ImageChops

TOOL = os.path.dirname(os.path.abspath(__file__))
HERE = os.getcwd()
WEB = os.path.normpath(os.path.join(TOOL, '..', '..', 'web'))
W, H, FPS = 1920, 1080, 30
os.chdir(HERE)

BG = (7, 11, 22)
TEAL = (45, 212, 191)
GOLD = (255, 196, 64)
WHITE = (240, 246, 255)
MUTED = (160, 178, 205)

FONT_DIR = '/usr/share/fonts/opentype/inter/'
@lru_cache(None)
def font(weight, size):
    name = {'black': 'Inter-Black.otf', 'xbold': 'Inter-ExtraBold.otf', 'bold': 'Inter-Bold.otf',
            'semi': 'Inter-SemiBold.otf', 'med': 'Inter-Medium.otf', 'reg': 'Inter-Regular.otf',
            'dbold': 'InterDisplay-Bold.otf', 'dblack': 'InterDisplay-Black.otf'}[weight]
    path = FONT_DIR + name
    if not os.path.exists(path):
        path = FONT_DIR + 'Inter-Bold.otf'
    return ImageFont.truetype(path, size)

# ------------------------------------------------------------------ helpers
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease(x): x = clamp(x); return x * x * (3 - 2 * x)
def ease_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def ease_in_out(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def ramp(f, a, b): return clamp((f - a) / max(1, b - a))
def fade_window(f, a, b, fin=10, fout=10):
    """1 inside [a, b], easing in over fin frames and out over fout frames."""
    if f < a or f > b: return 0.0
    return ease(min((f - a) / max(1, fin), (b - f) / max(1, fout), 1.0))

@lru_cache(maxsize=64)
def load(path, size=None):
    im = Image.open(path).convert('RGB')
    if size and im.size != size:
        im = im.resize(size, Image.LANCZOS)
    return im

def frames_of(d):
    if not os.path.isdir(d): return []
    return sorted(os.path.join(d, f) for f in os.listdir(d) if f.endswith('.png'))

def blur_bg(im, dark=0.35):
    small = im.resize((96, 54), Image.BILINEAR).filter(ImageFilter.GaussianBlur(4))
    big = small.resize((W, H), Image.BILINEAR)
    return ImageEnhance.Brightness(big).enhance(dark)

def fit43_on_blur(im, dark=0.35):
    """A 4:3 frame centred on a 16:9 canvas over a blurred copy of itself."""
    can = blur_bg(im, dark)
    fr = im.resize((1440, 1080), Image.LANCZOS) if im.size != (1440, 1080) else im
    can.paste(fr, (240, 0))
    return can

def fill169(im, zoom=1.0, cx=0.5, cy=0.5):
    """Crop a 4:3 frame to fill 16:9, with optional zoom around (cx, cy)."""
    w, h = im.size
    cw = w / zoom; ch = cw * 9 / 16
    x0 = clamp(cx * w - cw / 2, 0, w - cw); y0 = clamp(cy * h - ch / 2, 0, h - ch)
    return im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))

VIGN = None
def vignette(im, strength=0.55):
    global VIGN
    if VIGN is None:
        g = Image.radial_gradient('L').resize((W, H), Image.BILINEAR)   # 0 centre .. 255 edge
        VIGN = g.point(lambda v: int(255 - clamp((v - 90) / 165) ** 1.6 * 255))
    dark = Image.new('RGB', (W, H), (0, 0, 0))
    m = VIGN.point(lambda v: int(255 - (255 - v) * strength))
    return Image.composite(im, dark, m)

def overlay_color(im, color, alpha):
    if alpha <= 0: return im
    return Image.blend(im, Image.new('RGB', im.size, color), clamp(alpha))

@lru_cache(maxsize=256)
def text_layer(text, weight, size, fill, spacing=0, shadow=True, stroke=0):
    f = font(weight, size)
    # measure with letter spacing
    if spacing:
        widths = [f.getlength(ch) for ch in text]
        tw = int(sum(widths) + spacing * (len(text) - 1)) + 4
    else:
        tw = int(f.getlength(text)) + 4
    asc, desc = f.getmetrics()
    th = asc + desc + 4
    pad = 24 if shadow else 4
    lay = Image.new('RGBA', (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    def draw(dd, col):
        if spacing:
            x = pad
            for ch, wch in zip(text, widths):
                dd.text((x, pad), ch, font=f, fill=col, stroke_width=stroke, stroke_fill=col)
                x += wch + spacing
        else:
            dd.text((pad, pad), text, font=f, fill=col, stroke_width=stroke, stroke_fill=col)
    if shadow:
        sh = Image.new('RGBA', lay.size, (0, 0, 0, 0))
        draw(ImageDraw.Draw(sh), (0, 0, 0, 200))
        sh = sh.filter(ImageFilter.GaussianBlur(8))
        lay = Image.alpha_composite(lay, sh)
        d = ImageDraw.Draw(lay)
    draw(d, fill + (255,))
    return lay, pad, tw, th

def put_text(im, text, xy, weight='bold', size=48, fill=WHITE, alpha=1.0, anchor='l', spacing=0,
             shadow=True, dx=0, dy=0):
    if alpha <= 0.002 or not text: return
    lay, pad, tw, th = text_layer(text, weight, size, fill, spacing, shadow)
    x, y = xy
    if anchor == 'c': x -= tw / 2
    elif anchor == 'r': x -= tw
    x += dx; y += dy
    if alpha < 1:
        a = lay.getchannel('A').point(lambda v: int(v * alpha))
        lay = lay.copy(); lay.putalpha(a)
    im.paste(lay, (int(x - pad), int(y - pad)), lay)

def pill(im, box, fill, alpha=0.75, radius=14, outline=None):
    if alpha <= 0: return
    x0, y0, x1, y1 = [int(v) for v in box]
    lay = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle((0, 0, x1 - x0 - 1, y1 - y0 - 1), radius, fill=fill + (int(255 * alpha),),
                                          outline=(outline + (int(255 * alpha),)) if outline else None, width=2)
    im.paste(lay, (x0, y0), lay)

def text_w(text, weight, size, spacing=0):
    f = font(weight, size)
    return f.getlength(text) + spacing * (len(text) - 1)

SCAN = None
def scanlines(im, strength=0.18):
    global SCAN
    if SCAN is None:
        SCAN = Image.new('L', (W, H), 255)
        d = ImageDraw.Draw(SCAN)
        for y in range(0, H, 4):
            d.line((0, y, W, y), fill=int(255 * (1 - strength)))
            d.line((0, y + 1, W, y + 1), fill=int(255 * (1 - strength)))
    return ImageChops.multiply(im, Image.merge('RGB', (SCAN, SCAN, SCAN)))

# ------------------------------------------------------------------ sources
WAR_L, WAR_U = frames_of('f_war_l'), frames_of('f_war_u')
NWAR = min(len(WAR_L), len(WAR_U))
OPEN = frames_of('f_open_l')
OMNI_L, OMNI_U = frames_of('f_omni_l'), frames_of('f_omni')
CLIPS = [  # dir, digimon, attack, start frame
    ('f_phx', 'Phoenixmon', 'Crimson Flame', None),
    ('f_omni', 'Omnimon', 'Transcendent Sword', None),
    ('f_imp', 'Imperialdramon', 'Mega Fire', None),
    ('f_mgar', 'MetalGarurumon', 'Giga Cross Freezer', None),
    ('f_sera', 'Seraphimon', 'Seventh Heaven', None),
]
CLIP_START = json.load(open(os.path.join(TOOL, 'clip_starts.json')))
BOARD_T = json.load(open('rb/times.json'))
BOARD_T0 = BOARD_T[0]
def board_frame(sec):
    # last screencast frame at or before this moment
    target = BOARD_T0 + sec
    lo, hi = 0, len(BOARD_T) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if BOARD_T[mid] <= target: lo = mid
        else: hi = mid - 1
    return 'rb/%05d.jpg' % lo

DATA = json.load(open('cards.json'))   # [{id, name, spec}] Digimon with both art sets

# ------------------------------------------------------------------ scenes
# Each scene: (length in frames, render(f) -> Image)
def scene_open(f, n):
    src = OPEN[min(f, len(OPEN) - 1)]
    im = load(src)
    can = fit43_on_blur(im, 0.25)
    can = ImageEnhance.Color(can).enhance(0.75)
    can = ImageEnhance.Brightness(can).enhance(0.55 + 0.1 * ease(ramp(f, 0, 20)))
    can = scanlines(can, 0.22)
    can = vignette(can, 0.8)
    can = overlay_color(can, (0, 0, 0), 1 - ease(ramp(f, 0, 14)))
    a1 = fade_window(f, 8, n - 1, 14, 6)
    put_text(can, 'PLAYSTATION', (W / 2, 420), 'semi', 30, MUTED, a1, 'c', spacing=10, dy=(1 - ease_out(ramp(f, 8, 30))) * 12)
    a2 = fade_window(f, 26, n - 1, 14, 6)
    put_text(can, 'You remember it like this.', (W / 2, 470), 'bold', 72, WHITE, a2, 'c', dy=(1 - ease_out(ramp(f, 26, 48))) * 16)
    return can

MOSAIC = None
def mosaic_strip():
    global MOSAIC
    if MOSAIC is None:
        ids = [c['id'] for c in DATA]
        tile, gap = 168, 12
        rows = []
        for r in range(7):
            row = Image.new('RGB', (len(ids) // 2 * (tile + gap), tile), BG)
            sel = ids[r * 23 % len(ids):] + ids[:r * 23 % len(ids)]
            for i in range(len(ids) // 2):
                row.paste(load(f'{WEB}/assets/mini2/{sel[i]:03d}.webp', (tile, tile)), (i * (tile + gap), 0))
            rows.append(row)
        MOSAIC = rows
    return MOSAIC

def mosaic_bg(f, bright=0.22):
    rows = mosaic_strip()
    can = Image.new('RGB', (W, H), BG)
    tile, gap = 168, 12
    y0 = -60
    for r, row in enumerate(rows):
        speed = 1.6 if r % 2 else -1.6
        off = int((f * speed + r * 137) % (row.width - W - 400))
        can.paste(row.crop((off, 0, off + W, tile)), (0, y0 + r * (tile + gap)))
    can = ImageEnhance.Brightness(can).enhance(bright)
    return vignette(can, 0.9)

def scene_title(f, n):
    can = mosaic_bg(f + 40, 0.20)
    flash = 1 - ease_out(ramp(f, 0, 12))
    s = 1.0 + 0.04 * (1 - ease_out(ramp(f, 0, 40)))
    a = ease(ramp(f, 2, 16))
    put_text(can, 'DIGIMON', (W / 2, 330), 'bold', 40, TEAL, a, 'c', spacing=22)
    put_text(can, 'Digital Card Battle', (W / 2, 390), 'black', int(132 * s), WHITE, a, 'c')
    a3 = ease(ramp(f, 22, 36))
    put_text(can, 'Rebuilt from the original disc. Remastered for your browser.', (W / 2, 580), 'semi', 40, MUTED, a3, 'c',
             dy=(1 - ease_out(ramp(f, 22, 44))) * 14)
    can = overlay_color(can, (255, 255, 255), flash * 0.9)
    can = overlay_color(can, (0, 0, 0), ease(ramp(f, n - 6, n)) * 0.6)
    return can

VIEW = (336, 72, 1584, 1008)   # 1248 x 936
def spec_column(can, x, align, title, color, lines, alpha, f0, f):
    put_text(can, title[0], (x, 150), 'black', 46, color, alpha, align)
    put_text(can, title[1], (x, 204), 'black', 46, color, alpha, align)
    for i, line in enumerate(lines):
        a = alpha * ease(ramp(f, f0 + 8 + i * 6, f0 + 20 + i * 6))
        put_text(can, line, (x, 300 + i * 54), 'semi', 28, WHITE if i == 0 else MUTED, a, align)

def scene_compare(f, n):
    i = min(f, NWAR - 1)
    L = load(WAR_L[i]); U = load(WAR_U[i])
    can = blur_bg(U, 0.22)
    vw, vh = VIEW[2] - VIEW[0], VIEW[3] - VIEW[1]
    Lr = L.resize((vw, vh), Image.NEAREST); Ur = U.resize((vw, vh), Image.LANCZOS)
    # divider: all PS1 -> centre -> holds -> all Ultra at the end
    p = 1.0 - 0.5 * ease_in_out(ramp(f, 18, 54))
    p -= 0.5 * ease_in_out(ramp(f, n - 34, n - 4))
    p += 0.035 * math.sin(f / 22) * ease(ramp(f, 54, 70)) * (1 - ease(ramp(f, n - 40, n - 34)))
    split = int(vw * clamp(p))
    view = Ur.copy()
    if split > 0:
        view.paste(Lr.crop((0, 0, split, vh)), (0, 0))
    can.paste(view, VIEW[:2])
    ImageDraw.Draw(can).rectangle(VIEW, outline=(53, 69, 104), width=2)
    sx = VIEW[0] + split
    if 2 < split < vw - 2:
        d = ImageDraw.Draw(can)
        glow = Image.new('RGBA', (40, vh), (0, 0, 0, 0))
        ImageDraw.Draw(glow).rectangle((17, 0, 22, vh), fill=(255, 255, 255, 160))
        glow = glow.filter(ImageFilter.GaussianBlur(6))
        can.paste(glow, (sx - 20, VIEW[1]), glow)
        d.rectangle((sx - 1, VIEW[1], sx + 1, VIEW[3]), fill=(255, 255, 255))
        cy = (VIEW[1] + VIEW[3]) // 2
        d.ellipse((sx - 26, cy - 26, sx + 26, cy + 26), fill=(255, 255, 255))
        d.polygon([(sx - 16, cy), (sx - 6, cy - 9), (sx - 6, cy + 9)], fill=BG)
        d.polygon([(sx + 16, cy), (sx + 6, cy - 9), (sx + 6, cy + 9)], fill=BG)
    aL = ease(ramp(f, 4, 18)) * (1 - ease(ramp(f, n - 30, n - 12)))
    aR = ease(ramp(f, 30, 46))
    spec_column(can, 312, 'r', ('ORIGINAL', 'PS1'), MUTED,
                ['320 × 240', 'Original lighting', 'Original polygons', 'Original textures'], aL, 4, f)
    spec_column(can, 1608, 'l', ('ENHANCED', 'ULTRA'), GOLD,
                ['1280 × 960', 'Per-pixel lighting', 'Surface shadows', 'Smoothed models', '4× arena textures', 'Denser particles'], aR, 30, f)
    put_text(can, 'Same animation, same frame — read from the game data', (W / 2, 1022), 'semi', 26, MUTED,
             ease(ramp(f, 40, 56)) * (1 - ease(ramp(f, n - 12, n))), 'c', shadow=False)
    can = overlay_color(can, (0, 0, 0), 1 - ease(ramp(f, 0, 6)))
    return can

def scene_detail(f, n):
    k = DETAIL_FRAME
    L = load(OMNI_L[min(k, len(OMNI_L) - 1)]); U = load(OMNI_U[k])
    z = 1.0 + 0.55 * ease_in_out(ramp(f, 0, n))
    cx, cy = 0.5, 0.42
    # PS1 picture stays pixel-sharp when enlarged
    w, h = L.size
    cw = w / z; ch = cw * 9 / 16
    x0 = clamp(cx * w - cw / 2, 0, w - cw); y0 = clamp(cy * h - ch / 2, 0, h - ch)
    l = L.resize((W, H), Image.NEAREST, box=(x0, y0, x0 + cw, y0 + ch))
    u = U.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
    p = ease_in_out(ramp(f, 14, n - 26))
    split = int(W * p)
    can = l.copy()
    if split > 0:
        can.paste(u.crop((0, 0, split, H)), (0, 0))
    if 2 < split < W - 2:
        d = ImageDraw.Draw(can)
        glow = Image.new('RGBA', (60, H), (0, 0, 0, 0))
        ImageDraw.Draw(glow).rectangle((26, 0, 33, H), fill=(255, 255, 255, 170))
        glow = glow.filter(ImageFilter.GaussianBlur(9))
        can.paste(glow, (split - 30, 0), glow)
        d.rectangle((split - 1, 0, split + 1, H), fill=(255, 255, 255))
    can = vignette(can, 0.5)
    a = fade_window(f, 10, n, 12, 8)
    put_text(can, 'ORIGINAL PS1', (W - 70, 60), 'black', 34, MUTED, a * (1 - p), 'r', spacing=4)
    put_text(can, 'ENHANCED ULTRA', (70, 60), 'black', 34, GOLD, a * p, 'l', spacing=4)
    a2 = fade_window(f, 40, n, 14, 8)
    put_text(can, '24 arenas upscaled 4× from the game\'s own textures', (W / 2, 948), 'bold', 40, WHITE, a2, 'c',
             dy=(1 - ease_out(ramp(f, 40, 60))) * 12)
    return can

def scene_montage(f, n):
    per = n // len(CLIPS)
    c = min(f // per, len(CLIPS) - 1)
    g = f - c * per
    d, name, atk, _ = CLIPS[c]
    fr = frames_of_cached(d)
    s = CLIP_START.get(d, 0)
    im = load(fr[min(s + g, len(fr) - 1)])
    z = 1.0 + 0.06 * g / per
    can = fill169(im, z, 0.5, 0.5)
    can = vignette(can, 0.45)
    # lower third
    a = fade_window(g, 4, per, 8, 6)
    sl = (1 - ease_out(ramp(g, 4, 16))) * -40
    put_text(can, name.upper(), (80, 900), 'black', 54, WHITE, a, 'l', dx=sl)
    put_text(can, atk, (82, 966), 'semi', 32, GOLD, a, 'l', dx=sl * 1.4)
    if c == 0 or c == 1:
        # headline during the first two clips
        a2 = fade_window(f, 6, 2 * per - 4, 12, 10)
        put_text(can, '191 Digimon · 3 attacks each · 24 arenas', (W - 80, 70), 'black', 46, WHITE, a2, 'r',
                 dy=(1 - ease_out(ramp(f, 6, 22))) * -12)
        put_text(can, 'Every one playable in Enhanced Ultra', (W - 80, 130), 'semi', 30, GOLD, a2, 'r')
    # cut flash
    can = overlay_color(can, (255, 255, 255), (1 - ease_out(ramp(g, 0, 7))) * (0.75 if c else 0.9))
    return can

_FC = {}
def frames_of_cached(d):
    if d not in _FC: _FC[d] = frames_of(d)
    return _FC[d]

SPEC_COL = [(232, 72, 72), (70, 140, 240), (72, 190, 96), (120, 120, 130), (240, 200, 60)]
def card_tile(cid, spec, new, size):
    key = (cid, new, size)
    if key in _TILES: return _TILES[key]
    art = load(f'{WEB}/assets/{"art2" if new else "art"}/{cid:03d}.webp', (size - 16, size - 16))
    t = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    d.rounded_rectangle((0, 0, size - 1, size - 1), 14, fill=SPEC_COL[spec % 5] + (255,))
    m = Image.new('L', art.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, art.size[0] - 1, art.size[1] - 1), 9, fill=255)
    t.paste(art, (8, 8), m)
    _TILES[key] = t
    return t
_TILES = {}

def scene_cards(f, n):
    can = Image.new('RGB', (W, H), BG)
    g = Image.radial_gradient('L').resize((W, H)).point(lambda v: int(clamp(1 - v / 255) * 60))
    can = Image.composite(Image.new('RGB', (W, H), (20, 40, 70)), can, g)
    cols, rows, size, gap = 8, 3, 196, 22
    gw = cols * size + (cols - 1) * gap
    x0 = (W - gw) / 2 - 30 + f * 0.35
    y0 = 300
    for r in range(rows):
        for c in range(cols):
            idx = r * cols + c
            card = PICK[idx]
            # a wave across the grid turns each card over to the new art
            t0 = 34 + (c + r * 1.5) * 5
            u = ramp(f, t0, t0 + 12)
            new = u >= 0.5
            sx = abs(math.cos(u * math.pi))
            tile = card_tile(card['id'], card['spec'], new, size)
            w = max(2, int(size * sx))
            if w < size:
                tile = tile.resize((w, size), Image.BILINEAR)
            px = int(x0 + c * (size + gap) + (size - w) / 2); py = int(y0 + r * (size + gap))
            can.paste(tile, (px, py), tile)
            if 0.5 <= u < 1:
                k = 0.55 * (1 - (u - .5) * 2)
                m = tile.getchannel('A').point(lambda v: int(v * k))
                can.paste(Image.new('RGB', tile.size, (255, 255, 255)), (px, py), m)
    a = ease(ramp(f, 4, 18))
    put_text(can, 'NEW CARD ART', (W / 2, 120), 'bold', 34, TEAL, a, 'c', spacing=14)
    put_text(can, 'Fresh illustrations for every Digimon card', (W / 2, 168), 'black', 64, WHITE, a, 'c',
             dy=(1 - ease_out(ramp(f, 4, 24))) * 14)
    a2 = ease(ramp(f, 70, 86))
    put_text(can, 'One switch brings back the original pictures.', (W / 2, 1000), 'semi', 32, MUTED, a2, 'c')
    can = overlay_color(can, (0, 0, 0), (1 - ease(ramp(f, 0, 8))) + ease(ramp(f, n - 6, n)) * 0.5)
    return can

BOARD_CROP = (96, 0, 1524, 1080)
BOARD_CLIPS = [  # start second, frames, caption
    (27.4, 78, 'Rules traced from the game\'s own code'),
    (59.9, 66, 'Support cards, effects, Deadly Attacks'),
    (78.9, 78, 'Digivolve — just like on PlayStation'),
]
def scene_board(f, n):
    edit_n = n - sum(c[1] for c in BOARD_CLIPS)
    acc = 0
    for (s, m, cap) in BOARD_CLIPS:
        if f < acc + m:
            g = f - acc
            im = load(board_frame(s + g / FPS))
            crop = im.crop(BOARD_CROP)
            can = blur_bg(crop, 0.25)
            z = (900 / 1080) * (1.0 + 0.03 * g / m)
            vw, vh = int(1428 * z), int(1080 * z)
            fr = crop.resize((vw, vh), Image.LANCZOS)
            can.paste(fr, ((W - vw) // 2, 470 - vh // 2))
            can = vignette(can, 0.35)
            a = fade_window(g, 3, m, 8, 6)
            tw = text_w(cap, 'bold', 40)
            pill(can, (W / 2 - tw / 2 - 34, 960, W / 2 + tw / 2 + 34, 1036), (8, 12, 24), 0.82 * a, 38, outline=TEAL)
            put_text(can, cap, (W / 2, 975), 'bold', 40, WHITE, a, 'c', shadow=False)
            can = overlay_color(can, (0, 0, 0), 1 - ease(ramp(g, 0, 5)))
            return can
        acc += m
    g = f - acc
    im = load('editor.png')
    z = 1.12 - 0.08 * ease_in_out(ramp(g, 0, edit_n))
    can = im.resize((W, H), Image.LANCZOS, box=(
        W / 2 - W / 2 / z, H / 2 - H / 2 / z - 40 * (1 - g / edit_n), W / 2 + W / 2 / z, H / 2 + H / 2 / z - 40 * (1 - g / edit_n)))
    can = vignette(can, 0.35)
    a = fade_window(g, 3, edit_n, 8, 8)
    cap = 'Deck editor · computer opponents · two players at one screen'
    tw = text_w(cap, 'bold', 40)
    pill(can, (W / 2 - tw / 2 - 34, 960, W / 2 + tw / 2 + 34, 1036), (8, 12, 24), 0.88 * a, 38, outline=TEAL)
    put_text(can, cap, (W / 2, 975), 'bold', 40, WHITE, a, 'c', shadow=False)
    can = overlay_color(can, (0, 0, 0), 1 - ease(ramp(g, 0, 5)))
    return can

def scene_end(f, n):
    U = load(WAR_U[END_FRAME])
    can = fill169(U, 1.08 + 0.05 * f / n, 0.5, 0.45).filter(ImageFilter.GaussianBlur(10))
    can = ImageEnhance.Brightness(can).enhance(0.32)
    can = vignette(can, 0.9)
    a = ease(ramp(f, 4, 18))
    put_text(can, 'DIGIMON', (W / 2, 280), 'bold', 36, TEAL, a, 'c', spacing=20)
    put_text(can, 'Digital Card Battle', (W / 2, 330), 'black', 120, WHITE, a, 'c',
             dy=(1 - ease_out(ramp(f, 4, 26))) * 16)
    a2 = ease(ramp(f, 16, 30))
    put_text(can, 'Play free in your browser — no install', (W / 2, 520), 'semi', 40, GOLD, a2, 'c')
    a3 = ease(ramp(f, 26, 40))
    url = 'amidoria.github.io/digimon-card-spx-simulator'
    tw = text_w(url, 'bold', 44)
    pill(can, (W / 2 - tw / 2 - 40, 610, W / 2 + tw / 2 + 40, 700), (12, 20, 38), 0.9 * a3, 45, outline=TEAL)
    put_text(can, url, (W / 2, 628), 'bold', 44, WHITE, a3, 'c', shadow=False)
    a4 = ease(ramp(f, 36, 50))
    put_text(can, 'A browser remake of the PlayStation game Digimon Digital Card Battle', (W / 2, 790), 'med', 26, MUTED, a4, 'c', shadow=False)
    can = overlay_color(can, (0, 0, 0), 1 - ease(ramp(f, 0, 8)))
    can = overlay_color(can, (0, 0, 0), ease(ramp(f, n - 24, n)))
    return can

PICK = None
DETAIL_FRAME = 24
END_FRAME = 150
def build():
    global PICK
    import random
    rnd = random.Random(7)
    favs = json.load(open(os.path.join(TOOL, 'pick.json')))
    pool = [c for c in DATA]
    PICK = [next(c for c in DATA if c['name'] == nm) for nm in favs] if favs else rnd.sample(pool, 24)
    return [
        (105, scene_open),
        (75, scene_title),
        (NWAR, scene_compare),
        (120, scene_detail),
        (66 * len(CLIPS), scene_montage),
        (190, scene_cards),
        (sum(c[1] for c in BOARD_CLIPS) + 80, scene_board),
        (165, scene_end),
    ]

def main():
    out = sys.argv[1]
    every = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[2] == '--preview' else 0
    scenes = build()
    total = sum(n for n, _ in scenes)
    print('frames', total, 'seconds', total / FPS, [n for n, _ in scenes])
    if every:
        os.makedirs(out, exist_ok=True)
        k = 0
        for si, (n, fn) in enumerate(scenes):
            for f in range(0, n, every):
                fn(f, n).save(f'{out}/s{si}_{f:04d}.jpg', quality=85); k += 1
        return
    proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                             '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                             '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    done = 0
    for n, fn in scenes:
        for f in range(n):
            im = fn(f, n)
            assert im.size == (W, H), (fn.__name__, im.size)
            proc.stdin.write(im.convert('RGB').tobytes())
            done += 1
            if done % 150 == 0: print('frame', done, '/', total, flush=True)
    proc.stdin.close(); proc.wait()
    json.dump({'total': total, 'scenes': [[fn.__name__, n] for n, fn in scenes]}, open('timeline.json', 'w'))

if __name__ == '__main__':
    main()
