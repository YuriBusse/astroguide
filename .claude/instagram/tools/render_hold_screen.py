"""«Зажми экран» reel: intro caption, then a fast slideshow of images each with a number/word.

Usage: python3 render_hold_screen.py spec.json out.mp4 cover.jpg
spec: {"intro_bg": "bg_moon.jpg", "intro": ["Скажи:", "«...»", "и зажми экран"], "intro_dur": 2.6,
       "slides": [["bg_window.jpg", "111"], ...], "slide_dur": 0.2, "cycles": 3}
"""
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, serif, sans, gold_text_layer
from render_memes_v3 import asset, cover_fit, encoder


def outlined(d, xy, text, font, fill, stroke=4):
    d.text(xy, text, font=font, fill=fill, anchor="mm", stroke_width=stroke, stroke_fill=(0, 0, 0, 220))


def main(spec_path, out_path, cover_path):
    s = json.load(open(spec_path, encoding="utf-8"))
    intro_dur = s.get("intro_dur", 2.6)
    sd = s.get("slide_dur", 0.2)
    slides = []
    for img, label in s["slides"]:
        im = cover_fit(asset(img), W, H).convert("RGBA")
        im.alpha_composite(Image.new("RGBA", (W, H), (10, 4, 30, 50)))
        g = gold_text_layer([label], serif(150, 700), 160, W)
        im.alpha_composite(g, (0, int(H * 0.46 - g.height / 2)))
        slides.append(im.convert("RGB"))
    intro_bg = cover_fit(asset(s["intro_bg"]), int(W * 1.06), int(H * 1.06))
    cap = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cap)
    y = 760
    for k, ln in enumerate(s["intro"]):
        big = 0 < k < len(s["intro"]) - 1
        f = sans("ExtraBold" if big else "Bold", 64 if big else 54)
        outlined(cd, (W / 2, y), ln, f, (255, 255, 255, 255))
        y += 96
    n_slides = len(slides) * s.get("cycles", 3)
    total = intro_dur + n_slides * sd
    n = int(total * FPS)
    ff = encoder(out_path, total)
    cover = None
    for i in range(n):
        gt = i / FPS
        if gt < intro_dur:
            z = 1 + 0.05 * gt / intro_dur
            BW, BH = intro_bg.size
            cw, ch = BW / (1.06 * z), BH / (1.06 * z)
            frame = intro_bg.resize((W, H), Image.BILINEAR, box=(BW / 2 - cw / 2, BH / 2 - ch / 2, BW / 2 + cw / 2, BH / 2 + ch / 2)).convert("RGBA")
            # pulsing hint ring where the thumb goes
            p = 0.5 + 0.5 * math.sin(gt * 5)
            ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            rd = ImageDraw.Draw(ring)
            r = 60 + 18 * p
            rd.ellipse((W / 2 - r, 1250 - r, W / 2 + r, 1250 + r), outline=(255, 230, 170, int(120 + 120 * p)), width=6)
            rd.ellipse((W / 2 - 24, 1226, W / 2 + 24, 1274), fill=(255, 230, 170, 200))
            frame.alpha_composite(ring)
            frame.alpha_composite(cap)
            rgb = frame.convert("RGB")
            if cover is None and gt > 1.0:
                cover = rgb
        else:
            k = int((gt - intro_dur) / sd) % len(slides)
            rgb = slides[k]
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, round(total, 2))


if __name__ == "__main__":
    main(*sys.argv[1:4])
