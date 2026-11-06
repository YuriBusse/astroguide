"""«3 ред-флага <знак>» reel: big sign header, three numbered flags appear one by one.

Usage: python3 render_flags.py spec.json bg.jpg out.mp4 cover.jpg
spec: {"kind": "ред-флага", "glyph": "♏", "sign": "Скорпион", "flags": ["...", "...", "..."],
       "flag_color": [235, 70, 90], "cta": "...", "per": 2.4}
"""
import json, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, serif, sans, gold_text_layer, wrap, divider, photo_bg, GOLD_MID, LILAC, SYM, ease
from render_list_reel import panel
from render_memes_v3 import encoder, shake_at


def flag_icon(d, x, y, col, s=1.0):
    d.line((x, y - 26 * s, x, y + 28 * s), fill=(235, 230, 240, 255), width=int(5 * s))
    d.polygon([(x + 2, y - 26 * s), (x + 40 * s, y - 16 * s), (x + 2, y - 4 * s)], fill=tuple(col) + (255,))


def item_layer(k, text, col):
    f = sans("SemiBold", 46)
    lines = wrap(text, f, 700)
    lh = 58
    h = max(96, lh * len(lines) + 20)
    L = Image.new("RGBA", (W, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    flag_icon(d, 180, h / 2, col, 1.2)
    d.text((250, h / 2), f"{k}", font=serif(64, 700), fill=GOLD_MID + (255,), anchor="mm")
    for i, ln in enumerate(lines):
        y = h / 2 - (len(lines) - 1) * lh / 2 + i * lh
        d.text((292, y + 3), ln, font=f, fill=(0, 0, 0, 160), anchor="lm")
        d.text((290, y), ln, font=f, fill=(255, 255, 255, 255), anchor="lm")
    return L


def main(spec_path, bg_path, out_path, cover_path):
    s = json.load(open(spec_path, encoding="utf-8"))
    per = s.get("per", 2.4)
    col = s.get("flag_color", [235, 70, 90])
    intro = 1.3
    total = intro + per * len(s["flags"]) + 2.6
    BW, BH = int(W * 1.1), int(H * 1.1)
    bg = photo_bg(bg_path, BW, BH)
    head = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(head)
    kf = sans("ExtraBold", 66)
    label = f"3 {s['kind'].upper()}"
    lw = hd.textlength(label, font=kf)
    hd.rounded_rectangle((W / 2 - lw / 2 - 34, 255, W / 2 + lw / 2 + 34, 345), radius=20, fill=tuple(col) + (235,))
    hd.text((W / 2, 300), label, font=kf, fill=(255, 255, 255, 255), anchor="mm")
    g = gold_text_layer([s["sign"].upper()], serif(104, 800), 112, W)
    head.alpha_composite(g, (0, 372))
    hd = ImageDraw.Draw(head)
    gl = ImageFont.truetype(SYM, 96)
    hd.text((W / 2, 590), s["glyph"], font=gl, fill=GOLD_MID + (255,), anchor="mm")
    items = [item_layer(k + 1, t, col) for k, t in enumerate(s["flags"])]
    ys, y = [], 705
    for it in items:
        ys.append(y)
        y += it.height + 26
    cy0 = y + 20
    head.alpha_composite(panel(90, 670, 990, cy0 + 135))
    cta = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cta)
    divider(cd, cy0, 110)
    cd.text((W / 2, cy0 + 45), s["cta"], font=sans("SemiBold", 42), fill=(255, 255, 255, 255), anchor="mm")
    cd.text((W / 2, cy0 + 95), "Натальная карта бесплатно · ссылка в профиле", font=sans("Medium", 32), fill=LILAC + (255,), anchor="mm")
    rnd = random.Random(6)
    dust = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1.2, 3), rnd.uniform(14, 40), rnd.uniform(0, 6.28)] for _ in range(45)]
    n = int(total * FPS)
    ff = encoder(out_path, total)
    cover = None
    for i in range(n):
        gt = i / FPS
        z = 1.0 + 0.05 * gt / total
        sh = (0, 0)
        for k in range(len(items)):
            dx, dy = shake_at(gt, intro + k * per, 0.25, 12)
            sh = (sh[0] + dx, sh[1] + dy)
        cw, ch = BW / (1.05 * z), BH / (1.05 * z)
        cx, cy = BW / 2 + sh[0], BH / 2 + sh[1]
        frame = bg.resize((W, H), Image.BILINEAR, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)).convert("RGBA")
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for x, y0, sz, sp, ph in dust:
            yy = (y0 - gt * sp) % H
            a = int(110 + 100 * (0.5 + 0.5 * math.sin(gt * 2 + ph)))
            od.ellipse((x - sz, yy - sz, x + sz, yy + sz), fill=(255, 225, 160, a))
        frame.alpha_composite(ov)
        frame.alpha_composite(head)
        for k, it in enumerate(items):
            t0 = intro + k * per
            a = ease((gt - t0) / 0.3)
            if a <= 0:
                continue
            im = it if a >= 1 else it.copy()
            if a < 1:
                im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
            frame.alpha_composite(im, (int((1 - a) * 60), ys[k]))
            if 0 < gt - t0 < 0.35:
                frame.alpha_composite(Image.new("RGBA", (W, H), tuple(col) + (int(60 * (1 - (gt - t0) / 0.35)),)))
        ct = intro + per * len(items)
        if gt > ct:
            a = ease((gt - ct) / 0.4)
            c2 = cta.copy()
            c2.putalpha(c2.getchannel("A").point(lambda v: int(v * a)))
            frame.alpha_composite(c2)
        rgb = frame.convert("RGB")
        if i == n - 1:
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, round(total, 1))


if __name__ == "__main__":
    main(*sys.argv[1:5])
