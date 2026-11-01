"""Tarot meme reel: caption on top, shuffling deck, flash, card flips to a punchline.

Usage: python3 render_tarot_meme.py spec.json bg.jpg out.mp4 cover.jpg
spec: {"caption": "...", "punch": "Я ЖЕ\\nГОВОРИЛА", "card_title": "...", "flip_at": 3.5, "dur": 9}
"""
import json, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import (W, H, FPS, serif, sans, gold_text_layer, wrap, photo_bg, sparkle,
                            GOLD_MID, GOLD_TOP, GOLD_BOT, LILAC, ease)

CW, CH = 330, 550


def card_back():
    c = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((0, 0, CW - 1, CH - 1), radius=26, fill=(52, 26, 120, 255), outline=GOLD_MID + (255,), width=5)
    d.rounded_rectangle((16, 16, CW - 17, CH - 17), radius=18, outline=GOLD_MID + (150,), width=2)
    cx, cy = CW / 2, CH / 2
    d.ellipse((cx - 80, cy - 80, cx + 80, cy + 80), fill=GOLD_MID + (255,))
    d.ellipse((cx - 50, cy - 95, cx + 110, cy + 65), fill=(52, 26, 120, 255))
    for k in range(10):
        a = k / 10 * math.tau
        r = 140
        sparkle(d, cx + math.cos(a) * r * .9, cy + math.sin(a) * r * 1.35, 9, GOLD_TOP + (230,))
    sparkle(d, cx + 40, cy - 30, 18, GOLD_TOP + (255,))
    return c


def card_face(title, punch):
    c = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((0, 0, CW - 1, CH - 1), radius=26, fill=(250, 240, 222, 255), outline=GOLD_MID + (255,), width=6)
    d.rounded_rectangle((16, 16, CW - 17, CH - 17), radius=18, outline=GOLD_BOT + (200,), width=2)
    d.text((CW / 2, 52), "XIX", font=serif(34, 700), fill=GOLD_BOT + (255,), anchor="mm")
    cx, cy = CW / 2, 175
    for k in range(16):
        a = k / 16 * math.tau
        d.line((cx + math.cos(a) * 58, cy + math.sin(a) * 58, cx + math.cos(a) * 92, cy + math.sin(a) * 92),
               fill=GOLD_MID + (255,), width=6)
    d.ellipse((cx - 50, cy - 50, cx + 50, cy + 50), fill=GOLD_MID + (255,), outline=GOLD_BOT + (255,), width=3)
    pf = serif(44, 800)
    lines = punch.split("\n")
    for i, ln in enumerate(lines):
        d.text((CW / 2, 330 + i * 62), ln, font=pf, fill=(70, 30, 120, 255), anchor="mm")
    d.text((CW / 2, CH - 50), title, font=sans("SemiBold", 26), fill=GOLD_BOT + (255,), anchor="mm")
    return c


def place(frame, card, cx, cy, scale=1.0, sx=1.0, rot=0.0, alpha=1.0, shadow=True):
    w, h = max(2, int(CW * scale * abs(sx))), max(2, int(CH * scale))
    im = card.resize((w, h), Image.BICUBIC)
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
    if shadow:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        sh.putalpha(im.getchannel("A").point(lambda v: int(v * 0.45)))
        sh = sh.filter(ImageFilter.GaussianBlur(14))
        frame.alpha_composite(sh, (int(cx - im.width / 2 + 10), int(cy - im.height / 2 + 18)))
    frame.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def main(spec_path, bg_path, out_path, cover_path):
    spec = json.load(open(spec_path, encoding="utf-8"))
    total, flip = spec.get("dur", 9), spec.get("flip_at", 3.5)
    BW, BH = int(W * 1.1), int(H * 1.1)
    bg = photo_bg(bg_path, BW, BH)
    dark = Image.new("RGBA", (W, H), (8, 2, 24, 90))
    cap = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cf = sans("SemiBold", 54)
    cd = ImageDraw.Draw(cap)
    for i, ln in enumerate(wrap(spec["caption"], cf, 900)):
        y = 300 + i * 70
        cd.text((W / 2 + 2, y + 3), ln, font=cf, fill=(0, 0, 0, 170), anchor="mm")
        cd.text((W / 2, y), ln, font=cf, fill=(255, 255, 255, 255), anchor="mm")
    back, face = card_back(), card_face(spec.get("card_title", "AstroGuide"), spec["punch"])
    rnd = random.Random(9)
    burst = [(rnd.uniform(0, math.tau), rnd.uniform(260, 620), rnd.uniform(8, 20)) for _ in range(26)]
    n = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-shortest", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    cover = None
    CX, CY = W / 2, 1000
    for i in range(n):
        gt = i / FPS
        z = 1.0 + (0.0 if gt < flip else 0.06 * ease((gt - flip) / (total - flip)))
        cw, ch = BW / (1.05 * z), BH / (1.05 * z)
        box = (BW / 2 - cw / 2, BH / 2 - ch / 2, BW / 2 + cw / 2, BH / 2 + ch / 2)
        frame = bg.resize((W, H), Image.BILINEAR, box=box).convert("RGBA")
        frame.alpha_composite(dark)
        if gt < flip:
            # riffle shuffle: deck of 3, top card slides out and tucks back under
            ph = (gt % 0.6) / 0.6
            side = -1 if int(gt / 0.6) % 2 == 0 else 1
            place(frame, back, CX + 6, CY + 8, rot=-4)
            place(frame, back, CX - 4, CY + 4, rot=3)
            off = math.sin(ph * math.pi) * 230 * side
            place(frame, back, CX + off, CY - math.sin(ph * math.pi) * 30, rot=side * 12 * math.sin(ph * math.pi))
        else:
            t = gt - flip
            ft = min(1.0, t / 0.45)
            scale = 1.0 + 0.25 * ease(t / 0.6)
            if ft < 0.5:
                place(frame, back, CX, CY, scale=scale, sx=1 - ft * 2)
            else:
                place(frame, face, CX, CY, scale=scale, sx=(ft - 0.5) * 2)
            if t < 0.6:  # flash + burst
                fl = Image.new("RGBA", (W, H), (255, 240, 210, int(200 * max(0, 1 - t / 0.35))))
                frame.alpha_composite(fl)
            od = ImageDraw.Draw(frame)
            for a, r, s in burst:
                k = ease(t / 1.2)
                x, y = CX + math.cos(a) * r * k, CY + math.sin(a) * r * k * 1.2
                al = int(255 * max(0.25, 1 - t / 3))
                sparkle(od, x, y, s * (0.6 + 0.4 * math.sin(gt * 6 + a)), GOLD_TOP + (al,))
        frame.alpha_composite(cap)
        rgb = frame.convert("RGB")
        if abs(gt - (flip + 1.5)) < 0.5 / FPS:
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    (cover or rgb).save(cover_path, quality=95)
    print(out_path, total)


if __name__ == "__main__":
    main(*sys.argv[1:5])
