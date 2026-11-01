"""«Same answer» meme reel: title + 12 signs, every sign gets the same answer.

Usage: python3 render_same_answer.py spec.json bg.jpg out.mp4 cover.jpg
spec: {"title": "...", "answer": "Скорпион", "answer_glyph": "♏",
       "rows": [["♈","Овен"], ...], "last": "только себе", "footer": "...", "dur": 8}
A row whose sign equals the answer gets spec["last"] instead (the twist).
"""
import json, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, serif, sans, gold_text_layer, wrap, divider, photo_bg, GOLD_MID, GOLD_TOP, LILAC, SYM, ease
from render_list_reel import panel


def row_layer(glyph, name, ans, ans_glyph, twist=False):
    L = Image.new("RGBA", (W, 72), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    sym = ImageFont.truetype(SYM, 46)
    nf = sans("SemiBold", 46)
    af = sans("Bold", 46)
    left = f"{name}:"
    d.text((W / 2 - 14, 36), left, font=nf, fill=(255, 255, 255, 255), anchor="rm")
    d.text((W / 2 - 14 - d.textlength(left, font=nf) - 18, 34), glyph, font=sym, fill=GOLD_MID + (255,), anchor="rm")
    col = (255, 150, 200, 255) if twist else GOLD_TOP + (255,)
    d.text((W / 2 + 14, 36), ans, font=af, fill=col, anchor="lm")
    if not twist:
        d.text((W / 2 + 14 + d.textlength(ans, font=af) + 16, 34), ans_glyph, font=sym, fill=GOLD_MID + (255,), anchor="lm")
    return L


def main(spec_path, bg_path, out_path, cover_path):
    s = json.load(open(spec_path, encoding="utf-8"))
    total = s.get("dur", 8)
    BW, BH = int(W * 1.1), int(H * 1.1)
    bg = photo_bg(bg_path, BW, BH)
    static = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tf = serif(60, 700)
    t = gold_text_layer(wrap(s["title"], tf, 960), tf, 74, W)
    static.alpha_composite(t, (0, 262))
    static.alpha_composite(panel(110, 480, 970, 1375))
    sd = ImageDraw.Draw(static)
    rows = []
    for g, n in s["rows"]:
        tw = n == s["answer"]
        rows.append((row_layer(g, n, s["last"] if tw else s["answer"], s["answer_glyph"], tw), tw))
    foot = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(foot).text((W / 2, 1418), s["footer"], font=sans("Medium", 38), fill=LILAC + (240,), anchor="mm")
    rnd = random.Random(4)
    dust = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1.2, 3.0), rnd.uniform(14, 40), rnd.uniform(0, 6.28)] for _ in range(50)]
    n = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-shortest", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    cover = None
    for i in range(n):
        gt = i / FPS
        z = 1.0 + 0.05 * gt / total
        cw, ch = BW / (1.05 * z), BH / (1.05 * z)
        frame = bg.resize((W, H), Image.BILINEAR, box=(BW / 2 - cw / 2, BH / 2 - ch / 2, BW / 2 + cw / 2, BH / 2 + ch / 2)).convert("RGBA")
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for x, y0, sz, sp, ph in dust:
            y = (y0 - gt * sp) % H
            xx = x + math.sin(gt * 0.8 + ph) * 10
            a = int(110 + 100 * (0.5 + 0.5 * math.sin(gt * 2 + ph)))
            od.ellipse((xx - sz, y - sz, xx + sz, y + sz), fill=(255, 225, 160, a))
        frame.alpha_composite(ov)
        frame.alpha_composite(static)
        for k, (r, tw) in enumerate(rows):
            st = 0.35 + k * 0.2
            a = ease((gt - st) / 0.3)
            if a <= 0:
                continue
            im = r if a >= .999 else r.copy()
            if a < .999:
                im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
            frame.alpha_composite(im, (0, 512 + k * 70))
            if tw and 0 < gt - st < 0.5:
                fl = Image.new("RGBA", (W, 72), (255, 220, 150, int(120 * (1 - (gt - st) / 0.5))))
                frame.alpha_composite(fl, (0, 512 + k * 70))
        if gt > 3.0:
            fa = ease((gt - 3.0) / 0.5)
            f2 = foot.copy()
            f2.putalpha(f2.getchannel("A").point(lambda v: int(v * fa)))
            frame.alpha_composite(f2)
        rgb = frame.convert("RGB")
        if i == int(4.5 * FPS):
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, total)


if __name__ == "__main__":
    main(*sys.argv[1:5])
