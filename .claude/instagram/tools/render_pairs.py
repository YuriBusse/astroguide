"""Compact «who matches whom» reel: many pairs, optional highlighted twist rows.

Usage: python3 render_pairs.py spec.json bg.jpg out.mp4 cover.jpg
spec: {"title": "...", "pairs": [["♈","Овен","♌","Лев"], ["♋","Рак","♒","Водолей","вопреки звёздам"], ...],
       "cta1": "...", "cta2": "...", "dur": 11}
A 5th element marks a twist row: drawn in pink with a small label under it.
"""
import json, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, serif, sans, gold_text_layer, wrap, divider, photo_bg, GOLD_MID, GOLD_TOP, LILAC, SYM, ease
from render_list_reel import panel

PINK = (255, 140, 190, 255)


def pair_row(p, rh, sep="♥"):
    g1, n1, g2, n2 = p[:4]
    twist = p[4] if len(p) > 4 else None
    L = Image.new("RGBA", (W, rh), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    sym = ImageFont.truetype(SYM, 44)
    nf = sans("Bold" if twist else "SemiBold", 44)
    col = PINK if twist else (255, 255, 255, 255)
    cy = rh / 2 - (8 if twist else 0)
    d.text((W / 2, cy), sep, font=(ImageFont.truetype(SYM, 38) if sep == "♥" else sans("SemiBold", 44)), fill=(PINK if sep == "♥" else GOLD_MID + (255,)), anchor="mm")
    d.text((W / 2 - 44, cy), n1, font=nf, fill=col, anchor="rm")
    d.text((W / 2 - 44 - d.textlength(n1, font=nf) - 18, cy - 2), g1, font=sym, fill=GOLD_MID + (255,), anchor="rm")
    d.text((W / 2 + 44, cy), n2, font=nf, fill=col, anchor="lm")
    d.text((W / 2 + 44 + d.textlength(n2, font=nf) + 18, cy - 2), g2, font=sym, fill=GOLD_MID + (255,), anchor="lm")
    if twist:
        d.text((W / 2, cy + 38), twist, font=sans("Medium", 28), fill=(255, 190, 220, 230), anchor="mm")
    return L


def main(spec_path, bg_path, out_path, cover_path):
    s = json.load(open(spec_path, encoding="utf-8"))
    total = s.get("dur", 11)
    BW, BH = int(W * 1.1), int(H * 1.1)
    bg = photo_bg(bg_path, BW, BH)
    static = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tf = serif(80, 700)
    t = gold_text_layer(wrap(s["title"], tf, 940), tf, 90, W)
    static.alpha_composite(t, (0, 250))
    divider(ImageDraw.Draw(static), 250 + t.height + 18, 130)
    top, bottom = max(450, 250 + t.height + 60), 1420
    static.alpha_composite(panel(90, top, 990, bottom))
    n = len(s["pairs"])
    twists = sum(1 for p in s["pairs"] if len(p) > 4)
    avail = (bottom - top - 40) - 125  # leave room for the CTA inside the panel
    rh = int(min(70, avail / (n + 0.5 * twists)))
    rows, y = [], top + 22
    for p in s["pairs"]:
        h = int(rh * (1.5 if len(p) > 4 else 1))
        rows.append((pair_row(p, h, s.get("sep", "♥")), y, len(p) > 4))
        y += h
    cta = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cta)
    cy = bottom - 112
    divider(cd, cy, 110)
    cd.text((W / 2, cy + 40), s["cta1"], font=sans("SemiBold", 40), fill=(255, 255, 255, 255), anchor="mm")
    cd.text((W / 2, cy + 86), s["cta2"], font=sans("Medium", 34), fill=LILAC + (255,), anchor="mm")
    rnd = random.Random(8)
    dust = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1.2, 3.0), rnd.uniform(14, 40), rnd.uniform(0, 6.28)] for _ in range(50)]
    frames = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-shortest", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    step = s.get("step", 0.22)
    cover = None
    for i in range(frames):
        gt = i / FPS
        z = 1.0 + 0.05 * gt / total
        cw, ch = BW / (1.05 * z), BH / (1.05 * z)
        frame = bg.resize((W, H), Image.BILINEAR, box=(BW / 2 - cw / 2, BH / 2 - ch / 2, BW / 2 + cw / 2, BH / 2 + ch / 2)).convert("RGBA")
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for x, y0, sz, sp, ph in dust:
            yy = (y0 - gt * sp) % H
            xx = x + math.sin(gt * 0.8 + ph) * 10
            a = int(110 + 100 * (0.5 + 0.5 * math.sin(gt * 2 + ph)))
            od.ellipse((xx - sz, yy - sz, xx + sz, yy + sz), fill=(255, 225, 160, a))
        frame.alpha_composite(ov)
        frame.alpha_composite(static)
        for k, (r, ry, tw) in enumerate(rows):
            st = 0.35 + k * step + (0.4 if tw else 0)
            a = ease((gt - st) / 0.3)
            if a <= 0:
                continue
            im = r if a >= .999 else r.copy()
            if a < .999:
                im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
            frame.alpha_composite(im, (int((1 - a) * -24), ry))
            if tw and 0 < gt - st < 0.6:
                fl = Image.new("RGBA", (r.width, r.height), (255, 160, 210, int(110 * (1 - (gt - st) / 0.6))))
                frame.alpha_composite(fl, (0, ry))
        ca_t = 0.35 + n * step + 0.8
        ca = ease((gt - ca_t) / 0.5)
        if ca > 0:
            c2 = cta.copy()
            c2.putalpha(c2.getchannel("A").point(lambda v: int(v * ca)))
            frame.alpha_composite(c2)
        rgb = frame.convert("RGB")
        if i == int((total - 1.5) * FPS):
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, total, "row h", rh)


if __name__ == "__main__":
    main(*sys.argv[1:5])
