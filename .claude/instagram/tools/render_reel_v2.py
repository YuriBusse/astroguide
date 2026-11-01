"""AstroGuide «вайб» reel renderer: drifting nebula, gold dust, glass arch card,
gold serif headings. Faceless text reel, 1080x1920, 30 fps, silent track.

Usage: python3 render_reel_v2.py spec.json out.mp4 cover.jpg [--bg photo.jpg]

spec.json: {"part_label", "hook_small", "cards": [
  {"kind": "hook", "dur", "text"},
  {"kind": "sign", "dur", "glyph", "name", "text"},
  {"kind": "end",  "dur", "title", "sub"}]}
Fonts: set ASTRO_FONTS to a folder with PlayfairDisplay[wght].ttf (falls back to DejaVu Serif).
"""
import json, math, os, random, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
FONT_DIR = os.environ.get("ASTRO_FONTS", os.path.join(os.path.dirname(__file__), "fonts"))
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"
SYM = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
GOLD_TOP, GOLD_MID, GOLD_BOT = (255, 241, 196), (236, 196, 110), (184, 134, 47)
LILAC = (233, 222, 252)


def serif(size, weight=700):
    p = os.path.join(FONT_DIR, "PlayfairDisplay[wght].ttf")
    if os.path.exists(p):
        f = ImageFont.truetype(p, size)
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
        return f
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", size)


def sans(weight, size):
    return ImageFont.truetype(INTER.format(weight), size)


# ---------- background ----------
def fractal_noise(w, h, seed, octaves=6):
    rnd = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = 2 ** (o + 2)
        small = rnd.random((max(2, h * s // w), s)).astype(np.float32)
        layer = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
        acc += layer * amp
        tot += amp
        amp *= 0.55
    acc /= tot
    return (acc - acc.min()) / (acc.max() - acc.min() + 1e-6)


def nebula(w, h, seed=11):
    n1 = fractal_noise(w, h, seed)
    n2 = fractal_noise(w, h, seed + 7)
    n3 = fractal_noise(w, h, seed + 13, octaves=4)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w * 0.5, h * 0.42
    r = np.sqrt(((xx - cx) / w) ** 2 + ((yy - cy) / h) ** 2)
    glow = np.clip(1.15 - r * 1.9, 0, 1)
    base = np.array([10, 6, 30], np.float32)
    violet = np.array([96, 52, 200], np.float32)
    magenta = np.array([186, 70, 160], np.float32)
    gold = np.array([230, 170, 90], np.float32)
    a = np.clip((n1 - 0.38) * 2.2, 0, 1)[..., None] * glow[..., None]
    b = np.clip((n2 - 0.55) * 2.6, 0, 1)[..., None] * glow[..., None]
    c = np.clip((n3 - 0.72) * 3.0, 0, 1)[..., None] * glow[..., None] * 0.35
    img = base + violet * a * 0.9 + magenta * b * 0.55 + gold * c
    img = img * (0.55 + 0.45 * glow[..., None])
    # vignette
    vig = np.clip(1.25 - r * 1.25, 0.25, 1)[..., None]
    img = np.clip(img * vig, 0, 255).astype(np.uint8)
    out = Image.fromarray(img, "RGB").filter(ImageFilter.GaussianBlur(1.2))
    d = ImageDraw.Draw(out)
    rnd = random.Random(seed)
    for _ in range(900):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        s = rnd.choice([0.6, 0.8, 1.0, 1.0, 1.3, 1.8])
        v = rnd.randint(150, 255)
        d.ellipse((x - s, y - s, x + s, y + s), fill=(v, v, min(255, v + 20)))
    for _ in range(14):  # bright stars with flare
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        L = rnd.uniform(14, 34)
        d.line((x - L, y, x + L, y), fill=(255, 240, 210), width=1)
        d.line((x, y - L, x, y + L), fill=(255, 240, 210), width=1)
        d.ellipse((x - 2.5, y - 2.5, x + 2.5, y + 2.5), fill=(255, 250, 235))
    return out


def photo_bg(path, w, h):
    im = Image.open(path).convert("RGB")
    s = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    l, t = (im.width - w) // 2, (im.height - h) // 2
    im = im.crop((l, t, l + w, t + h))
    tint = Image.new("RGB", (w, h), (24, 12, 60))
    return Image.blend(im, tint, 0.35)


# ---------- text helpers ----------
def gold_text_layer(text_lines, font, line_h, width, glow=True):
    """Return RGBA layer with centered gold-gradient text lines."""
    hgt = int(line_h * len(text_lines) + font.size * 0.6)
    mask = Image.new("L", (width, hgt), 0)
    md = ImageDraw.Draw(mask)
    for i, ln in enumerate(text_lines):
        md.text((width / 2, font.size * 0.55 + i * line_h), ln, font=font, fill=255, anchor="mm")
    grad = np.zeros((hgt, width, 3), np.float32)
    for row in range(hgt):
        t = (row % line_h) / line_h if line_h else 0
        c = [GOLD_TOP[k] * (1 - t) + GOLD_MID[k] * t if t < 0.5 else GOLD_MID[k] * (1 - (t - .5) * 2) + GOLD_BOT[k] * ((t - .5) * 2) for k in range(3)]
        grad[row, :, :] = c
    layer = Image.fromarray(grad.astype(np.uint8), "RGB").convert("RGBA")
    layer.putalpha(mask)
    if glow:
        g = Image.new("RGBA", layer.size, (240, 190, 100, 0))
        g.putalpha(mask.filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.55)))
        g.alpha_composite(layer)
        layer = g
    return layer


def wrap(text, font, maxw):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    out = []
    for para in text.split("\n"):
        cur = ""
        for w_ in para.split():
            t = (cur + " " + w_).strip()
            if d.textlength(t, font=font) <= maxw or not cur:
                cur = t
            else:
                out.append(cur)
                cur = w_
        out.append(cur)
    return out


def spaced(draw, xy, text, font, fill, spacing=6):
    total = sum(draw.textlength(ch, font=font) for ch in text) + spacing * (len(text) - 1)
    x = xy[0] - total / 2
    for ch in text:
        draw.text((x, xy[1]), ch, font=font, fill=fill, anchor="lm")
        x += draw.textlength(ch, font=font) + spacing


def arch_panel(x0, y0, x1, y1):
    """Glass arch with thin gold border, returned as full-frame RGBA."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    r = (x1 - x0) / 2
    shape = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(shape)
    sd.pieslice((x0, y0, x1, y0 + 2 * r), 180, 360, fill=255)
    sd.rounded_rectangle((x0, y0 + r - 1, x1, y1), radius=36, fill=255)
    sd.rectangle((x0, y0 + r - 1, x1, y1 - 40), fill=255)
    fill = Image.new("RGBA", (W, H), (18, 8, 44, 150))
    fill.putalpha(shape.point(lambda v: int(v * 0.62)))
    layer.alpha_composite(fill)
    edge = shape.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
    border = Image.new("RGBA", (W, H), GOLD_MID + (0,))
    border.putalpha(edge.point(lambda v: 210 if v > 40 else 0))
    layer.alpha_composite(border)
    inner = shape.filter(ImageFilter.MinFilter(29))
    edge2 = inner.filter(ImageFilter.FIND_EDGES)
    b2 = Image.new("RGBA", (W, H), GOLD_MID + (0,))
    b2.putalpha(edge2.point(lambda v: 90 if v > 40 else 0))
    layer.alpha_composite(b2)
    return layer


def sparkle(draw, x, y, s, fill):
    pts = [(x, y - s), (x + s * .22, y - s * .22), (x + s, y), (x + s * .22, y + s * .22),
           (x, y + s), (x - s * .22, y + s * .22), (x - s, y), (x - s * .22, y - s * .22)]
    draw.polygon(pts, fill=fill)


def divider(draw, y, half=150):
    draw.line((W / 2 - half, y, W / 2 - 22, y), fill=GOLD_MID + (200,), width=2)
    draw.line((W / 2 + 22, y, W / 2 + half, y), fill=GOLD_MID + (200,), width=2)
    sparkle(draw, W / 2, y, 13, GOLD_TOP + (255,))


# ---------- cards (pre-rendered once) ----------
def card_layer(card, spec):
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    kind = card["kind"]
    if kind == "hook":
        f = serif(96, 700)
        lines = wrap(card["text"], f, 900)
        g = gold_text_layer(lines, f, 118, W)
        top = 900 - g.height // 2
        L.alpha_composite(g, (0, top))
        divider(d, top + g.height + 40)
        spaced(d, (W / 2, top + g.height + 110), spec["part_label"].upper(), sans("SemiBold", 34), LILAC + (235,), 8)
        return L
    # header
    hf = serif(50, 600)
    hl = wrap(spec["hook_small"], hf, 900)
    g = gold_text_layer(hl, hf, 62, W, glow=False)
    L.alpha_composite(g, (0, 250))
    spaced(d, (W / 2, 250 + g.height + 26), spec["part_label"].upper(), sans("Medium", 28), LILAC + (210,), 7)
    L.alpha_composite(arch_panel(130, 520, 950, 1400))
    d = ImageDraw.Draw(L)
    if kind == "sign":
        cy = 800
        d.ellipse((W / 2 - 112, cy - 112, W / 2 + 112, cy + 112), outline=GOLD_MID + (220,), width=3)
        d.ellipse((W / 2 - 98, cy - 98, W / 2 + 98, cy + 98), outline=GOLD_MID + (90,), width=1)
        gl = Image.new("L", (W, 300), 0)
        ImageDraw.Draw(gl).text((W / 2, 150), card["glyph"], font=ImageFont.truetype(SYM, 150), fill=255, anchor="mm")
        gold = Image.new("RGBA", (W, 300), GOLD_MID + (0,))
        gold.putalpha(gl)
        glow = Image.new("RGBA", (W, 300), (240, 190, 100, 0))
        glow.putalpha(gl.filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(v * .6)))
        L.alpha_composite(glow, (0, cy - 150))
        L.alpha_composite(gold, (0, cy - 150))
        nf = serif(92, 700)
        ng = gold_text_layer([card["name"]], nf, 100, W)
        L.alpha_composite(ng, (0, 960))
        d = ImageDraw.Draw(L)
        divider(d, 1100, 120)
        tf = sans("Medium", 54)
        for i, ln in enumerate(wrap(card["text"], tf, 760)):
            y = 1180 + i * 68
            d.text((W / 2 + 2, y + 3), ln, font=tf, fill=(5, 0, 20, 150), anchor="mm")
            d.text((W / 2, y), ln, font=tf, fill=(255, 255, 255, 255), anchor="mm")
    elif kind == "end":
        tf = serif(78, 700)
        g1 = gold_text_layer(wrap(card["title"], tf, 700), tf, 92, W)
        L.alpha_composite(g1, (0, 700))
        d = ImageDraw.Draw(L)
        y = 700 + g1.height + 10
        for ln in wrap(card["sub"], sans("SemiBold", 52), 700):
            d.text((W / 2, y + 20), ln, font=sans("SemiBold", 52), fill=(255, 255, 255, 255), anchor="mm")
            y += 66
        divider(d, y + 50, 120)
        d.text((W / 2, y + 130), "Натальная карта", font=sans("Medium", 48), fill=LILAC + (255,), anchor="mm")
        d.text((W / 2, y + 192), "бесплатно · ссылка в профиле", font=sans("Medium", 44), fill=LILAC + (255,), anchor="mm")
        ag = gold_text_layer(["AstroGuide"], serif(56, 600), 60, W, glow=False)
        L.alpha_composite(ag, (0, 1290))
    return L


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def main(spec_path, out_path, cover_path, bg_path=None):
    spec = json.load(open(spec_path, encoding="utf-8"))
    BW, BH = int(W * 1.14), int(H * 1.14)
    bg = photo_bg(bg_path, BW, BH) if bg_path else nebula(BW, BH)
    cards = [(c, card_layer(c, spec)) for c in spec["cards"]]
    times, t = [], 0.0
    for c, _ in cards:
        times.append(t)
        t += c["dur"]
    total = t
    rnd = random.Random(5)
    dust = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1.2, 3.6), rnd.uniform(14, 46), rnd.uniform(0, math.tau)] for _ in range(70)]
    grain = [Image.fromarray(np.random.default_rng(i).integers(0, 255, (H // 2, W // 2), dtype=np.uint8), "L").resize((W, H)) for i in range(4)]
    n = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-shortest", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    cover = None
    for i in range(n):
        gt = i / FPS
        p = gt / total
        z = 1.0 + 0.08 * p
        cw, ch = BW / (1.06 * z), BH / (1.06 * z)
        cx = BW / 2 + math.sin(gt * 0.25) * 30
        cy = BH / 2 + 30 - p * 60
        cx = min(max(cx, cw / 2), BW - cw / 2)
        cy = min(max(cy, ch / 2), BH - ch / 2)
        box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
        frame = bg.resize((W, H), Image.BILINEAR, box=box).convert("RGBA")
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for dpart in dust:
            x, y0, s, sp, ph = dpart
            y = (y0 - gt * sp) % H
            xx = x + math.sin(gt * 0.8 + ph) * 12
            a = int(120 + 110 * (0.5 + 0.5 * math.sin(gt * 2 + ph)))
            od.ellipse((xx - s * 2.2, y - s * 2.2, xx + s * 2.2, y + s * 2.2), fill=(240, 190, 110, a // 5))
            od.ellipse((xx - s, y - s, xx + s, y + s), fill=(255, 225, 160, a))
        frame.alpha_composite(ov)
        for idx, (c, layer) in enumerate(cards):
            s, e = times[idx], times[idx] + c["dur"]
            if s <= gt < e:
                lt = gt - s
                a = 1.0 if idx == 0 else ease(lt / 0.35)
                if e - gt < 0.18 and idx < len(cards) - 1:
                    a *= (e - gt) / 0.18
                if a >= 0.999:
                    frame.alpha_composite(layer)
                else:
                    tmp = layer.copy()
                    tmp.putalpha(tmp.getchannel("A").point(lambda v: int(v * a)))
                    off = int((1 - a) * 24)
                    frame.alpha_composite(tmp, (0, off))
                break
        rgb = frame.convert("RGB")
        rgb = Image.blend(rgb, Image.merge("RGB", [grain[i % 4]] * 3), 0.035)
        if i == 0:
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(f"{out_path}: {total:.1f}s")


if __name__ == "__main__":
    a = sys.argv[1:]
    bgp = None
    if "--bg" in a:
        k = a.index("--bg"); bgp = a[k + 1]; del a[k:k + 2]
    main(a[0], a[1], a[2], bgp)
