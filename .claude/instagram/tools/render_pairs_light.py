"""Light «aesthetic» list reel: sunlit curtain background, cream card, dark serif text.

Usage: python3 render_pairs_light.py spec.json out.mp4 cover.jpg
spec: {"bg": "hand_ace_pentacles.jpg", "bg_crop": [680, 100, 941, 564],
       "title": "...", "pairs": [["♈","Овен","♓","Рыб"], ...], "sep": "—",
       "cta1": "...", "cta2": "...", "dur": 10}
bg_crop picks a curtain-only area of a photo (x0, y0, x1, y1); omit to use the whole image.
"""
import json, math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, serif, sans, wrap, sparkle, SYM, ease
from render_memes_v3 import asset, cover_fit, encoder

INK = (58, 42, 36, 255)
GOLDM = (176, 132, 64, 255)
CREAM = (252, 247, 240)


def main(spec_path, out_path, cover_path):
    s = json.load(open(spec_path, encoding="utf-8"))
    total = s.get("dur", 10)
    src = asset(s["bg"])
    if s.get("bg_crop"):
        src = src.crop(tuple(s["bg_crop"]))
    BW, BH = int(W * 1.08), int(H * 1.08)
    bg = cover_fit(src, BW, BH).filter(ImageFilter.GaussianBlur(6))
    # card
    n = len(s["pairs"])
    tf = serif(76, 700)
    tlines = wrap(s["title"], tf, 800)
    card_top, card_bot = 300, 1440
    card = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((110, card_top + 18, 970, card_bot + 18), radius=46, fill=(90, 60, 40, 90))
    card.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26)))
    cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((100, card_top, 980, card_bot), radius=46, fill=CREAM + (238,))
    cd.rounded_rectangle((122, card_top + 22, 958, card_bot - 22), radius=34, outline=GOLDM[:3] + (110,), width=2)
    y = card_top + 90
    for ln in tlines:
        cd.text((W / 2, y), ln, font=tf, fill=INK, anchor="mm")
        y += 88
    y += 4
    cd.line((W / 2 - 130, y, W / 2 - 24, y), fill=GOLDM, width=2)
    cd.line((W / 2 + 24, y, W / 2 + 130, y), fill=GOLDM, width=2)
    sparkle(cd, W / 2, y, 12, GOLDM)
    rows_top = y + 34
    cta_h = 120
    rh = int(min(68, (card_bot - 40 - cta_h - rows_top) / n))
    sep = s.get("sep", "—")
    nf = sans("Medium", 44)
    sym = ImageFont.truetype(SYM, 42)
    rows = []
    for k, (g1, n1, g2, n2) in enumerate(s["pairs"]):
        L = Image.new("RGBA", (W, rh), (0, 0, 0, 0))
        d = ImageDraw.Draw(L)
        cy = rh / 2
        d.text((W / 2, cy), sep, font=nf, fill=GOLDM, anchor="mm")
        d.text((W / 2 - 40, cy), n1, font=nf, fill=INK, anchor="rm")
        d.text((W / 2 - 40 - d.textlength(n1, font=nf) - 16, cy - 2), g1, font=sym, fill=GOLDM, anchor="rm")
        d.text((W / 2 + 40, cy), n2, font=nf, fill=INK, anchor="lm")
        d.text((W / 2 + 40 + d.textlength(n2, font=nf) + 16, cy - 2), g2, font=sym, fill=GOLDM, anchor="lm")
        rows.append((L, rows_top + k * rh))
    cta = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ct = ImageDraw.Draw(cta)
    cy0 = rows_top + n * rh + 34
    ct.text((W / 2, cy0), s["cta1"], font=sans("SemiBold", 40), fill=INK, anchor="mm")
    ct.text((W / 2, cy0 + 50), s["cta2"], font=sans("Regular", 32), fill=(120, 95, 80, 255), anchor="mm")
    rnd = random.Random(4)
    motes = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1.5, 3.5), rnd.uniform(8, 22), rnd.uniform(0, 6.28)] for _ in range(36)]
    frames = int(total * FPS)
    ff = encoder(out_path, total)
    cover = None
    for i in range(frames):
        gt = i / FPS
        z = 1.0 + 0.05 * gt / total
        cw, chh = BW / (1.08 * z), BH / (1.08 * z)
        cx, cyy = BW / 2 + math.sin(gt * 0.5) * 8, BH / 2
        frame = bg.resize((W, H), Image.BILINEAR, box=(cx - cw / 2, cyy - chh / 2, cx + cw / 2, cyy + chh / 2)).convert("RGBA")
        k = 0.5 + 0.5 * math.sin(gt * 1.2)
        frame.alpha_composite(Image.new("RGBA", (W, H), (255, 236, 205, int(20 * k))))
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for x, y0, sz, sp, ph in motes:
            yy = (y0 - gt * sp) % H
            xx = x + math.sin(gt * 0.7 + ph) * 12
            a = int(60 + 60 * (0.5 + 0.5 * math.sin(gt * 2 + ph)))
            od.ellipse((xx - sz, yy - sz, xx + sz, yy + sz), fill=(255, 248, 230, a))
        frame.alpha_composite(ov.filter(ImageFilter.GaussianBlur(1)))
        ca = ease(gt / 0.4)
        c2 = card if ca >= 1 else card.copy()
        if ca < 1:
            c2.putalpha(c2.getchannel("A").point(lambda v: int(v * ca)))
        frame.alpha_composite(c2)
        for j, (r, ry) in enumerate(rows):
            a = ease((gt - 0.5 - j * 0.22) / 0.3)
            if a <= 0:
                continue
            im = r if a >= 1 else r.copy()
            if a < 1:
                im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
            frame.alpha_composite(im, (int((1 - a) * -20), ry))
        a = ease((gt - (0.5 + n * 0.22 + 0.4)) / 0.4)
        if a > 0:
            c3 = cta.copy()
            c3.putalpha(c3.getchannel("A").point(lambda v: int(v * a)))
            frame.alpha_composite(c3)
        rgb = frame.convert("RGB")
        if i == frames - 1:
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, total, "row", rh)


if __name__ == "__main__":
    main(*sys.argv[1:4])
