"""«Это твой знак» reel: photo of a hand with a tarot card, title + white text box.

Usage: python3 render_sign_card.py spec.json photo.jpg out.mp4 cover.jpg
spec: {"title": "Это твой знак", "text": "...", "bold": ["7"], "dur": 7}
"""
import json, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, sans, wrap, sparkle, ease
from render_memes_v3 import cover_fit, encoder


def main(spec_path, photo, out_path, cover_path):
    s = json.load(open(spec_path, encoding="utf-8"))
    total = s.get("dur", 7)
    big = cover_fit(Image.open(photo).convert("RGB"), int(W * 1.08), int(H * 1.08))
    # title with dark outline, like the original
    title = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tf = sans("Bold", 74)
    td = ImageDraw.Draw(title)
    tw = td.textlength(s["title"], font=tf)
    tx, ty = W / 2 - 34, s.get("title_y", 250)
    for dx in range(-4, 5, 2):
        for dy in range(-4, 5, 2):
            td.text((tx + dx, ty + dy), s["title"], font=tf, fill=(30, 30, 30, 255), anchor="mm")
    td.text((tx, ty), s["title"], font=tf, fill=(255, 255, 255, 255), anchor="mm")
    sparkle(td, tx + tw / 2 + 50, ty - 4, 26, (255, 215, 110, 255))
    sparkle(td, tx + tw / 2 + 78, ty - 30, 11, (255, 215, 110, 255))
    # white text box
    bf = sans("Medium", 52)
    lines = wrap(s["text"], bf, 860)
    lh = 66
    bh = lh * len(lines) + 44
    box = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(box)
    y0 = s.get("box_y", 330)
    bd.rectangle((70, y0, W - 70, y0 + bh), fill=(255, 255, 255, 245))
    bold = sans("Bold", 52)
    for i, ln in enumerate(lines):
        y = y0 + 22 + lh / 2 + i * lh
        words = ln.split(" ")
        widths = [bd.textlength(w_, font=bold if w_.strip(".,") in s.get("bold", []) else bf) for w_ in words]
        sp = bd.textlength(" ", font=bf)
        x = W / 2 - (sum(widths) + sp * (len(words) - 1)) / 2
        for w_, wd in zip(words, widths):
            f = bold if w_.strip(".,") in s.get("bold", []) else bf
            bd.text((x, y), w_, font=f, fill=(20, 20, 20, 255), anchor="lm")
            x += wd + sp
    rnd = random.Random(2)
    motes = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1.5, 3.5), rnd.uniform(8, 25), rnd.uniform(0, 6.28)] for _ in range(40)]
    n = int(total * FPS)
    ff = encoder(out_path, total)
    cover = None
    for i in range(n):
        gt = i / FPS
        z = 1.0 + 0.06 * gt / total
        BW, BH = big.size
        cw, ch = BW / (1.08 * z), BH / (1.08 * z)
        cx, cy = BW / 2 + math.sin(gt * 0.6) * 6, BH / 2 + math.cos(gt * 0.5) * 5
        frame = big.resize((W, H), Image.BILINEAR, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)).convert("RGBA")
        # sunlight breathing + floating dust in the light
        k = 0.5 + 0.5 * math.sin(gt * 1.3)
        frame.alpha_composite(Image.new("RGBA", (W, H), (255, 236, 200, int(18 * k))))
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for x, y0_, sz, sp, ph in motes:
            yy = (y0_ - gt * sp) % H
            xx = x + math.sin(gt * 0.7 + ph) * 14
            a = int(70 + 70 * (0.5 + 0.5 * math.sin(gt * 2 + ph)))
            od.ellipse((xx - sz, yy - sz, xx + sz, yy + sz), fill=(255, 245, 220, a))
        frame.alpha_composite(ov.filter(ImageFilter.GaussianBlur(1)))
        frame.alpha_composite(title)
        a = ease((gt - 0.25) / 0.35)
        if a > 0:
            b2 = box if a >= 1 else box.copy()
            if a < 1:
                b2.putalpha(b2.getchannel("A").point(lambda v: int(v * a)))
            frame.alpha_composite(b2)
        rgb = frame.convert("RGB")
        if i == int(2 * FPS):
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, total)


if __name__ == "__main__":
    main(*sys.argv[1:5])
