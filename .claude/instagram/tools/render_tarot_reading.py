"""Ironic 3-card tarot reading reel, or a 'cards could talk' shuffle meme.

Usage: python3 render_tarot_reading.py spec.json bg.jpg out.mp4 cover.jpg
reading spec: {"mode": "reading", "question": "...", "cards": [["XVI","Башня","Всё рухнет. Опять."], ...],
               "final": "...", "final2": "...", "per_card": 3.0}
talk spec:    {"mode": "talk", "setup": "Карты, если бы умели разговаривать:", "reply": "...", "dur": 6}
"""
import json, math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, serif, sans, gold_text_layer, wrap, divider, photo_bg, sparkle, GOLD_MID, GOLD_TOP, GOLD_BOT, LILAC, ease
import render_tarot_meme as tm


def face(num, title):
    c = Image.new("RGBA", (tm.CW, tm.CH), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    CW, CH = tm.CW, tm.CH
    d.rounded_rectangle((0, 0, CW - 1, CH - 1), radius=26, fill=(250, 240, 222, 255), outline=GOLD_MID + (255,), width=6)
    d.rounded_rectangle((16, 16, CW - 17, CH - 17), radius=18, outline=GOLD_BOT + (200,), width=2)
    d.text((CW / 2, 60), num, font=serif(44, 700), fill=GOLD_BOT + (255,), anchor="mm")
    cx, cy = CW / 2, CH / 2 - 10
    d.ellipse((cx - 95, cy - 95, cx + 95, cy + 95), outline=GOLD_MID + (255,), width=4)
    for k in range(8):
        a = k / 8 * math.tau
        sparkle(d, cx + math.cos(a) * 125, cy + math.sin(a) * 125, 12, GOLD_MID + (255,))
    sparkle(d, cx, cy, 60, GOLD_MID + (255,))
    d.text((CW / 2, CH - 70), title, font=serif(46, 700), fill=(70, 30, 120, 255), anchor="mm")
    return c


def text_block(frame, text, font, y, fill, alpha=1.0, maxw=920, lh=None):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    lh = lh or int(font.size * 1.25)
    for i, ln in enumerate(wrap(text, font, maxw)):
        d.text((W / 2 + 2, y + i * lh + 3), ln, font=font, fill=(0, 0, 0, 170), anchor="mm")
        d.text((W / 2, y + i * lh), ln, font=font, fill=fill, anchor="mm")
    if alpha < 1:
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * alpha)))
    frame.alpha_composite(lay)


def main(spec_path, bg_path, out_path, cover_path):
    s = json.load(open(spec_path, encoding="utf-8"))
    mode = s.get("mode", "reading")
    if mode == "talk":
        total = s.get("dur", 6)
    else:
        total = 1.6 + s.get("per_card", 3.0) * len(s["cards"]) + 3.2
    BW, BH = int(W * 1.1), int(H * 1.1)
    bg = photo_bg(bg_path, BW, BH)
    dark = Image.new("RGBA", (W, H), (8, 2, 24, 80))
    back = tm.card_back()
    faces = [face(n, t) for n, t, _ in s.get("cards", [])]
    head = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if mode == "talk":
        f = sans("SemiBold", 56)
        hd = ImageDraw.Draw(head)
        for i, ln in enumerate(wrap(s["setup"], f, 900)):
            hd.text((W / 2 + 2, 300 + i * 70 + 3), ln, font=f, fill=(0, 0, 0, 170), anchor="mm")
            hd.text((W / 2, 300 + i * 70), ln, font=f, fill=(255, 255, 255, 255), anchor="mm")
        rf = serif(58, 600)
        g = gold_text_layer(wrap(s["reply"], rf, 900), rf, 72, W)
        reply = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        reply.alpha_composite(g, (0, 440))
    else:
        qf = serif(70, 700)
        g = gold_text_layer(wrap(s["question"], qf, 920), qf, 84, W)
        head.alpha_composite(g, (0, 260))
        divider(ImageDraw.Draw(head), 260 + g.height + 26, 130)
    n = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-shortest", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)
    cover = None
    xs = [W / 2 - 330, W / 2, W / 2 + 330]
    for i in range(n):
        gt = i / FPS
        z = 1.0 + 0.05 * gt / total
        cw, ch = BW / (1.05 * z), BH / (1.05 * z)
        frame = bg.resize((W, H), Image.BILINEAR, box=(BW / 2 - cw / 2, BH / 2 - ch / 2, BW / 2 + cw / 2, BH / 2 + ch / 2)).convert("RGBA")
        frame.alpha_composite(dark)
        frame.alpha_composite(head)
        if mode == "talk":
            ph = (gt % 0.6) / 0.6
            side = -1 if int(gt / 0.6) % 2 == 0 else 1
            tm.place(frame, back, W / 2 + 6, 1080 + 8, rot=-4)
            tm.place(frame, back, W / 2 - 4, 1080 + 4, rot=3)
            off = math.sin(ph * math.pi) * 230 * side
            tm.place(frame, back, W / 2 + off, 1080 - math.sin(ph * math.pi) * 30, rot=side * 12 * math.sin(ph * math.pi))
            a = ease((gt - 0.8) / 0.4)
            if a > 0:
                r2 = reply.copy()
                if a < 1:
                    r2.putalpha(r2.getchannel("A").point(lambda v: int(v * a)))
                frame.alpha_composite(r2)
        else:
            per = s.get("per_card", 3.0)
            active = None
            for k in range(len(faces)):
                t0 = 1.6 + k * per
                ft = (gt - t0) / 0.45
                sc = 0.72
                if ft <= 0:
                    tm.place(frame, back, xs[k], 820, scale=sc)
                elif ft < 0.5:
                    tm.place(frame, back, xs[k], 820, scale=sc * (1 + 0.08 * ft), sx=1 - ft * 2)
                elif ft < 1:
                    tm.place(frame, faces[k], xs[k], 820, scale=sc * 1.04, sx=(ft - 0.5) * 2)
                else:
                    tm.place(frame, faces[k], xs[k], 820, scale=sc * 1.04)
                if gt >= t0:
                    active = (k, gt - t0)
                if 0 < gt - t0 < 0.5:
                    od = ImageDraw.Draw(frame)
                    for j in range(10):
                        aa = j / 10 * math.tau
                        rr = 120 + (gt - t0) * 300
                        sparkle(od, xs[k] + math.cos(aa) * rr * .7, 820 + math.sin(aa) * rr, 10, GOLD_TOP + (220,))
            end_t = 1.6 + per * len(faces)
            if active and gt < end_t:
                k, lt = active
                text_block(frame, s["cards"][k][2], sans("SemiBold", 58), 1150, (255, 255, 255, 255), ease((lt - 0.4) / 0.35))
            if gt >= end_t:
                a = ease((gt - end_t) / 0.4)
                text_block(frame, s["final"], serif(62, 700), 1130, GOLD_TOP + (255,), a)
                text_block(frame, s["final2"], sans("Medium", 42), 1300, LILAC + (255,), a)
        rgb = frame.convert("RGB")
        if (mode == "talk" and i == int(2.5 * FPS)) or (mode != "talk" and i == int((total - 1.0) * FPS)):
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    (cover or rgb).save(cover_path, quality=95)
    print(out_path, round(total, 1))


if __name__ == "__main__":
    main(*sys.argv[1:5])
