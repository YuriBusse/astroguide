"""Render a faceless zodiac text reel in the AstroGuide purple template.

Usage: python3 render_reel.py spec.json out.mp4 cover.png
"""
import json, math, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"
SYM = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
GOLD = (245, 196, 81)
HOOK_YELLOW = (242, 211, 91)
WHITE = (255, 255, 255)

GLYPHS = "♈♉♊♋♌♍♎♏♐♑♒♓"


def font(weight, size):
    return ImageFont.truetype(INTER.format(weight), size)


def background():
    bg = Image.new("RGB", (W, H))
    px = bg.load()
    cx, cy = W / 2, H * 0.45
    maxd = math.hypot(W, H) * 0.62
    for y in range(H):
        for x in range(0, W):
            d = min(1.0, math.hypot(x - cx, y - cy) / maxd)
            t = d ** 1.3
            c0, c1 = (92, 46, 170), (22, 10, 48)
            px[x, y] = tuple(int(c0[i] * (1 - t) + c1[i] * t) for i in range(3))
    return bg


def stars(seed=7, n=260):
    rnd = random.Random(seed)
    return [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(0.6, 2.4),
             rnd.uniform(0, math.tau), rnd.uniform(0.6, 2.0)) for _ in range(n)]


def zodiac_wheel(size=980):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = size / 2
    ring = (200, 170, 255, 70)
    for r, w in ((c - 6, 3), (c - 120, 2), (c - 300, 2)):
        d.ellipse((c - r, c - r, c + r, c + r), outline=ring, width=w)
    f = ImageFont.truetype(SYM, 64)
    for i, g in enumerate(GLYPHS):
        a = math.radians(i * 30 - 90 + 15)
        x, y = c + (c - 63) * math.cos(a), c + (c - 63) * math.sin(a)
        d.text((x, y), g, font=f, fill=(210, 185, 255, 95), anchor="mm")
        a2 = math.radians(i * 30 - 90)
        d.line((c + (c - 120) * math.cos(a2), c + (c - 120) * math.sin(a2),
                c + (c - 6) * math.cos(a2), c + (c - 6) * math.sin(a2)), fill=ring, width=2)
    return img


def wrap(text, f, maxw, draw):
    lines = []
    for para in text.split("\n"):
        cur = ""
        for word in para.split():
            test = (cur + " " + word).strip()
            if draw.textlength(test, font=f) <= maxw or not cur:
                cur = test
            else:
                lines.append(cur)
                cur = word
        lines.append(cur)
    return lines


def text_block(draw, text, f, y, fill, maxw=920, gap=1.22, shadow=True):
    lines = wrap(text, f, maxw, draw)
    lh = f.size * gap
    for i, ln in enumerate(lines):
        yy = y + i * lh
        if shadow:
            draw.text((W / 2 + 3, yy + 4), ln, font=f, fill=(10, 0, 30, 160), anchor="mm")
        draw.text((W / 2, yy), ln, font=f, fill=fill, anchor="mm")
    return y + len(lines) * lh


def eyes(draw, x, y, s=1.0, t=0.0):
    """Draw a small pair of cartoon eyes (stand-in for the 👀 emoji)."""
    look = math.sin(t * 2.2) * 6 * s
    for dx in (-22 * s, 22 * s):
        cx = x + dx
        draw.ellipse((cx - 19 * s, y - 26 * s, cx + 19 * s, y + 26 * s), fill=(255, 255, 255), outline=(40, 20, 70), width=3)
        draw.ellipse((cx - 9 * s + look, y - 6 * s, cx + 9 * s + look, y + 14 * s), fill=(30, 20, 40))


def heart(draw, x, y, s=1.0):
    pts = []
    for k in range(60):
        a = k / 60 * math.tau
        hx = 16 * math.sin(a) ** 3
        hy = -(13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a))
        pts.append((x + hx * 2.2 * s, y + hy * 2.2 * s))
    draw.polygon(pts, fill=(255, 92, 168))


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def render_card(base, card, local_t, global_t, part_label, hook_small, first):
    img = base.copy()
    over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    # the very first card is fully visible at frame 1 (no fade on the hook)
    a = 1.0 if first else ease(local_t / 0.3)
    alpha = int(255 * a)
    rise = 0 if first else int((1 - a) * 30)
    kind = card["kind"]

    if kind == "hook":
        f = font("ExtraBold", 84)
        end = text_block(d, card["text"], f, 800 + rise, WHITE + (alpha,), maxw=900)
        eyes(d, W / 2, end + 40, 1.4, global_t)
        d.text((W / 2, end + 140), part_label, font=font("SemiBold", 50), fill=HOOK_YELLOW + (alpha,), anchor="mm")
    else:
        # persistent header, inside the safe zone (y > 230)
        hf = font("ExtraBold", 54)
        end = text_block(d, hook_small, hf, 300, HOOK_YELLOW + (255,), maxw=860)
        d.text((W / 2, end + 18), part_label, font=font("Medium", 38), fill=(235, 225, 255, 230), anchor="mm")
        if kind == "sign":
            pop = 0.85 + 0.15 * ease(local_t / 0.35)
            gf = ImageFont.truetype(SYM, int(230 * pop))
            d.text((W / 2 + 4, 760 + 6 + rise), card["glyph"], font=gf, fill=(60, 30, 0, int(alpha * 0.6)), anchor="mm")
            d.text((W / 2, 760 + rise), card["glyph"], font=gf, fill=GOLD + (alpha,), anchor="mm")
            d.text((W / 2 + 3, 960 + 4 + rise), card["name"], font=font("ExtraBold", 92), fill=(40, 15, 0, int(alpha * 0.6)), anchor="mm")
            d.text((W / 2, 960 + rise), card["name"], font=font("ExtraBold", 92), fill=GOLD + (alpha,), anchor="mm")
            text_block(d, card["text"], font("SemiBold", 60), 1085 + rise, WHITE + (alpha,), maxw=920)
        elif kind == "end":
            y = text_block(d, card["title"], font("ExtraBold", 74), 760 + rise, WHITE + (alpha,))
            y = text_block(d, card["sub"], font("ExtraBold", 66), y + 20, GOLD + (alpha,))
            y = text_block(d, "Натальная карта бесплатно", font("SemiBold", 56), y + 70, (235, 225, 255, alpha))
            y = text_block(d, "ссылка в профиле ↑", font("SemiBold", 56), y + 6, (235, 225, 255, alpha))
            d.text((W / 2, 1360), "AstroGuide", font=font("Bold", 60), fill=(235, 225, 255, int(alpha * 0.85)), anchor="mm")
    img.alpha_composite(over)
    return img


def main(spec_path, out_path, cover_path):
    spec = json.load(open(spec_path, encoding="utf-8"))
    bg = background().convert("RGBA")
    wheel = zodiac_wheel()
    st = stars()
    timeline, t = [], 0.0
    for c in spec["cards"]:
        timeline.append((t, t + c["dur"], c))
        t += c["dur"]
    total = t
    n = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-shortest", "-movflags", "+faststart", out_path],
                          stdin=subprocess.PIPE)
    cover = None
    for i in range(n):
        gt = i / FPS
        frame = bg.copy()
        sd = ImageDraw.Draw(frame)
        for (x, y, r, ph, sp) in st:
            b = 0.45 + 0.55 * (0.5 + 0.5 * math.sin(gt * sp + ph))
            sd.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, int(200 * b)))
        rot = wheel.rotate(-gt * 6, resample=Image.BICUBIC)
        frame.alpha_composite(rot, (int(W / 2 - rot.width / 2), int(H * 0.45 - rot.height / 2)))
        for idx, (s, e, c) in enumerate(timeline):
            if s <= gt < e:
                frame = render_card(frame, c, gt - s, gt, spec["part_label"], spec["hook_small"], idx == 0)
                break
        rgb = frame.convert("RGB")
        if i == 0:
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(f"{out_path}: {total:.1f}s, {n} frames")


if __name__ == "__main__":
    main(*sys.argv[1:4])
