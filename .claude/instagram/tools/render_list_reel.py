"""Short looping «list» reel (e.g. «Кто кому подходит») on a photo background.

Usage: python3 render_list_reel.py spec.json bg.jpg out.mp4 cover.jpg
spec: {"title": "...", "rows": [["♈","Овен","♐","Стрелец"], ...], "note": "...",
       "cta1": "...", "cta2": "...", "dur": 9}
"""
import json, math, random, subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import (W, H, FPS, serif, sans, gold_text_layer, divider, photo_bg,
                            GOLD_MID, GOLD_TOP, LILAC, SYM, ease)


def panel(x0, y0, x1, y1):
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).rounded_rectangle((x0, y0, x1, y1), radius=48, fill=255)
    f = Image.new("RGBA", (W, H), (16, 8, 40, 0))
    f.putalpha(m.point(lambda v: int(v * 0.66)))
    L.alpha_composite(f)
    d = ImageDraw.Draw(L)
    d.rounded_rectangle((x0, y0, x1, y1), radius=48, outline=GOLD_MID + (200,), width=2)
    d.rounded_rectangle((x0 + 14, y0 + 14, x1 - 14, y1 - 14), radius=38, outline=GOLD_MID + (80,), width=1)
    return L


def row_layer(row):
    g1, n1, g2, n2 = row
    L = Image.new("RGBA", (W, 110), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    sym = ImageFont.truetype(SYM, 64)
    nf = sans("SemiBold", 56)
    heart = ImageFont.truetype(SYM, 46)
    d.text((W / 2, 55), "♥", font=heart, fill=(255, 120, 180, 255), anchor="mm")
    d.text((W / 2 - 60, 55), n1, font=nf, fill=(255, 255, 255, 255), anchor="rm")
    w1 = d.textlength(n1, font=nf)
    d.text((W / 2 - 60 - w1 - 24, 52), g1, font=sym, fill=GOLD_MID + (255,), anchor="rm")
    d.text((W / 2 + 60, 55), n2, font=nf, fill=(255, 255, 255, 255), anchor="lm")
    w2 = d.textlength(n2, font=nf)
    d.text((W / 2 + 60 + w2 + 24, 52), g2, font=sym, fill=GOLD_MID + (255,), anchor="lm")
    return L


def main(spec_path, bg_path, out_path, cover_path):
    spec = json.load(open(spec_path, encoding="utf-8"))
    total = spec.get("dur", 9)
    BW, BH = int(W * 1.1), int(H * 1.1)
    bg = photo_bg(bg_path, BW, BH)
    # static layer: title, panel, note
    static = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tf = serif(92, 700)
    t = gold_text_layer([spec["title"]], tf, 104, W)
    static.alpha_composite(t, (0, 300))
    d = ImageDraw.Draw(static)
    divider(d, 300 + t.height + 30, 140)
    static.alpha_composite(panel(100, 520, 980, 1400))
    rows = [row_layer(r) for r in spec["rows"]]
    cta = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cta)
    divider(cd, 1240, 120)
    cd.text((W / 2, 1298), spec["cta1"], font=sans("SemiBold", 44), fill=(255, 255, 255, 255), anchor="mm")
    cd.text((W / 2, 1352), spec["cta2"], font=sans("Medium", 40), fill=LILAC + (255,), anchor="mm")
    note = spec.get("note")
    if note:
        cd.text((W / 2, 1428), note, font=sans("Regular", 30), fill=LILAC + (200,), anchor="mm")
    rnd = random.Random(3)
    dust = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1.2, 3.2), rnd.uniform(14, 40), rnd.uniform(0, 6.28)] for _ in range(55)]
    n = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-shortest", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    cover = None
    for i in range(n):
        gt = i / FPS
        p = gt / total
        z = 1.0 + 0.05 * p
        cw, ch = BW / (1.05 * z), BH / (1.05 * z)
        box = (BW / 2 - cw / 2, BH / 2 - ch / 2, BW / 2 + cw / 2, BH / 2 + ch / 2)
        frame = bg.resize((W, H), Image.BILINEAR, box=box).convert("RGBA")
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for x, y0, s, sp, ph in dust:
            y = (y0 - gt * sp) % H
            xx = x + math.sin(gt * 0.8 + ph) * 10
            a = int(110 + 100 * (0.5 + 0.5 * math.sin(gt * 2 + ph)))
            od.ellipse((xx - s * 2, y - s * 2, xx + s * 2, y + s * 2), fill=(240, 190, 110, a // 5))
            od.ellipse((xx - s, y - s, xx + s, y + s), fill=(255, 225, 160, a))
        frame.alpha_composite(ov)
        frame.alpha_composite(static)
        for k, r in enumerate(rows):
            start = 0.35 + k * 0.32
            a = ease((gt - start) / 0.4)
            if a <= 0:
                continue
            tmp = r if a >= 0.999 else r.copy()
            if a < 0.999:
                tmp.putalpha(tmp.getchannel("A").point(lambda v: int(v * a)))
            frame.alpha_composite(tmp, (int((1 - a) * -30), 575 + k * 105))
        ca = ease((gt - 2.6) / 0.5)
        if ca > 0:
            tmp = cta.copy()
            tmp.putalpha(tmp.getchannel("A").point(lambda v: int(v * ca)))
            frame.alpha_composite(tmp)
        rgb = frame.convert("RGB")
        if i == int(4 * FPS):
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, total)


if __name__ == "__main__":
    main(*sys.argv[1:5])
