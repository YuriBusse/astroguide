"""Chat-screenshot meme reel: messages pop in one by one, one message can be a photo of a spread.

Usage: python3 render_chat.py spec.json out.mp4 cover.jpg
spec: {"bg": "bg_window.jpg", "msgs": [{"who": "in"|"out", "text": "...", "time": "23:30", "at": 0.3},
       {"who": "out", "cards": ["card_tower.jpg", ...], "table": "bg_table.jpg", "text": "...", "time": "23:32", "at": 2.4}],
       "dur": 11}
"""
import json, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, sans, wrap, ease
from render_memes_v3 import asset, cover_fit, rounded, encoder, pop

IN_FILL, OUT_FILL = (246, 243, 252, 255), (215, 196, 250, 255)
TXT, TIME = (25, 20, 35, 255), (120, 110, 140, 255)
F = None


def text_bubble(m, maxw=820):
    f = sans("Medium", 50)
    tf = sans("Regular", 30)
    d0 = ImageDraw.Draw(Image.new("L", (1, 1)))
    lines = wrap(m["text"], f, maxw - 150)
    lh = 64
    tw = max(d0.textlength(l, font=f) for l in lines)
    timew = d0.textlength(m["time"], font=tf) + (40 if m["who"] == "out" else 0)
    one = len(lines) == 1
    bw = int(min(maxw, tw + 60 + (timew + 30 if one else 0)))
    bw = max(bw, int(timew + 70))
    bh = int(lh * len(lines) + 36 + (0 if one else 36))
    im = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, bw - 1, bh - 1), radius=40, fill=IN_FILL if m["who"] == "in" else OUT_FILL)
    for i, ln in enumerate(lines):
        d.text((30, 18 + lh / 2 + i * lh), ln, font=f, fill=TXT, anchor="lm")
    ty = bh - 26
    tx = bw - 26
    if m["who"] == "out":
        d.text((tx, ty), "✓✓", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26), fill=(110, 80, 200, 255), anchor="rm")
        tx -= 40
    d.text((tx, ty), m["time"], font=tf, fill=TIME, anchor="rm")
    return im


def photo_bubble(m, w=900):
    table = cover_fit(asset(m["table"]), w - 24, 500)
    cards = [rounded(asset(c), 22) for c in m["cards"]]
    cw, ch = 210, 315
    for k, c in enumerate(cards):
        im = c.resize((cw, ch), Image.LANCZOS)
        x = int((w - 24) / 2 + (k - 1) * (cw + 22) - cw / 2)
        sh = Image.new("RGBA", (cw + 40, ch + 40), (0, 0, 0, 0))
        mk = Image.new("L", sh.size, 0)
        ImageDraw.Draw(mk).rounded_rectangle((20, 20, 20 + cw, 20 + ch), radius=22, fill=170)
        sh.putalpha(mk.filter(ImageFilter.GaussianBlur(12)))
        table = table.convert("RGBA")
        table.alpha_composite(sh, (x - 14, 92 - 8))
        table.alpha_composite(im, (x, 92))
    f = sans("Medium", 50)
    capw = text_bubble({"who": "out", "text": m["text"], "time": m["time"]}, w)
    bh = 12 + 500 + capw.height - 6
    out = Image.new("RGBA", (w, bh), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    d.rounded_rectangle((0, 0, w - 1, bh - 1), radius=40, fill=OUT_FILL)
    out.alpha_composite(rounded(table.convert("RGB"), 30), (12, 12))
    # caption row reuses the text bubble's content without its own background
    cap = Image.new("RGBA", (w, capw.height), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cap)
    cd.text((30, capw.height / 2 - 4), m["text"], font=f, fill=TXT, anchor="lm")
    tf = sans("Regular", 30)
    cd.text((w - 66, capw.height - 26), m["time"], font=tf, fill=TIME, anchor="rm")
    cd.text((w - 26, capw.height - 26), "✓✓", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26), fill=(110, 80, 200, 255), anchor="rm")
    out.alpha_composite(cap, (0, 512 - 6))
    return out


def main(spec_path, out_path, cover_path):
    s = json.load(open(spec_path, encoding="utf-8"))
    total = s.get("dur", 11)
    bg = cover_fit(asset(s["bg"]), W, H).filter(ImageFilter.GaussianBlur(18))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (15, 6, 35)), 0.45).convert("RGBA")
    bubbles = [(photo_bubble(m) if "cards" in m else text_bubble(m), m) for m in s["msgs"]]
    gap = 22
    rnd = random.Random(5)
    hearts = [[rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(16, 40), rnd.uniform(10, 30), rnd.uniform(0, 6.28),
               rnd.choice([(255, 150, 200), (160, 200, 255), (255, 210, 120)])] for _ in range(22)]
    hf = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
    n = int(total * FPS)
    ff = encoder(out_path, total)
    cover = None
    for i in range(n):
        gt = i / FPS
        frame = bg.copy()
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for x, y0, sz, sp, ph, col in hearts:
            y = (y0 - gt * sp) % H
            a = int(60 + 60 * (0.5 + 0.5 * math.sin(gt * 1.5 + ph)))
            od.text((x, y), "♥", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", int(sz)), fill=col + (a,), anchor="mm")
        frame.alpha_composite(ov.filter(ImageFilter.GaussianBlur(2)))
        visible = [(b, m) for b, m in bubbles if gt >= m["at"]]
        total_h = sum(b.height for b, _ in visible) + gap * max(0, len(visible) - 1)
        # stack from top; scroll up if the stack is taller than the safe area
        y = 230 - max(0, total_h - (1560 - 230))
        for b, m in visible:
            lt = gt - m["at"]
            im = pop(b, ease(lt / 0.22))
            x = 50 if m["who"] == "in" else W - 50 - im.width
            frame.alpha_composite(im, (int(x), int(y + (b.height - im.height) / 2)))
            y += b.height + gap
        rgb = frame.convert("RGB")
        if i == n - 1:
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, total)


if __name__ == "__main__":
    main(*sys.argv[1:4])
