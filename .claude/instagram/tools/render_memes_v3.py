"""Illustrated meme reels (v3), built on ChatGPT-drawn assets.

  python3 render_memes_v3.py reading spec.json out.mp4 cover.jpg
  python3 render_memes_v3.py talk    spec.json out.mp4 cover.jpg

reading spec: {"bg": "bg_table.jpg", "back": "card_back.jpg", "question": "...",
               "cards": [["card_tower.jpg", "Башня", "Всё рухнет. Опять"], ...],
               "final": "...", "final2": "..."}
talk spec:    {"setup": "...", "img1": "char_annoyed.jpg", "img2": "char_shocked.jpg",
               "card_msgs": ["...", "..."], "user_msg": "...", "punch": "..."}
Asset paths are relative to ../assets.
"""
import json, math, os, random, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(__file__))
from render_reel_v2 import W, H, FPS, serif, sans, gold_text_layer, wrap, sparkle, GOLD_MID, GOLD_TOP, LILAC, ease

ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")


def asset(name):
    return Image.open(os.path.join(ASSETS, name)).convert("RGB")


def cover_fit(im, w, h):
    s = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    l, t = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((l, t, l + w, t + h))


def rounded(im, r):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=r, fill=255)
    out = im.convert("RGBA")
    out.putalpha(m)
    return out


def encoder(out_path, total):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                             "-r", str(FPS), "-i", "-", "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",
                             "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                             "-c:a", "aac", "-shortest", "-movflags", "+faststart", out_path], stdin=subprocess.PIPE)


def bg_frame(big, gt, total, zoom=0.06, shake=(0, 0)):
    BW, BH = big.size
    z = 1.0 + zoom * gt / total
    cw, ch = BW / (1.06 * z), BH / (1.06 * z)
    cx, cy = BW / 2 + shake[0], BH / 2 + shake[1]
    cx = min(max(cx, cw / 2), BW - cw / 2)
    cy = min(max(cy, ch / 2), BH - ch / 2)
    return big.resize((W, H), Image.BILINEAR, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)).convert("RGBA")


def flicker(frame, gt):
    k = 0.035 * math.sin(gt * 11.3) + 0.025 * math.sin(gt * 17.1 + 1) + 0.02 * math.sin(gt * 5.7 + 2)
    lay = Image.new("RGBA", (W, H), (255, 170, 80, int(max(0, k) * 255 * 0.9)) if k > 0 else (10, 0, 30, int(-k * 255 * 0.9)))
    frame.alpha_composite(lay)


def make_fog(seed=2):
    rnd = np.random.default_rng(seed)
    small = rnd.random((24, 14)).astype(np.float32)
    f = Image.fromarray((small * 255).astype(np.uint8)).resize((W, H * 2), Image.BICUBIC).filter(ImageFilter.GaussianBlur(40))
    a = np.asarray(f, np.float32) / 255
    a = np.clip((a - 0.45) * 1.6, 0, 1) * 70
    fog = Image.new("RGBA", (W, H * 2), (230, 210, 255, 0))
    fog.putalpha(Image.fromarray(a.astype(np.uint8)))
    return fog


def shake_at(gt, t0, dur=0.35, amp=22):
    if 0 <= gt - t0 < dur:
        k = 1 - (gt - t0) / dur
        return (math.sin(gt * 90) * amp * k, math.cos(gt * 77) * amp * k)
    return (0, 0)


def shadow_text(frame, text, font, y, fill, alpha=1.0, maxw=920, lh=None, chars=None):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    lines = wrap(text, font, maxw)
    lh = lh or int(font.size * 1.25)
    left = chars if chars is not None else 10 ** 9
    for i, ln in enumerate(lines):
        vis = ln[:max(0, left)]
        left -= len(ln)
        if not vis:
            continue
        # keep line centred on its full width so typing does not jitter
        full = d.textlength(ln, font=font)
        x = W / 2 - full / 2
        d.text((x + 2, y + i * lh + 3), vis, font=font, fill=(0, 0, 0, 190), anchor="lm")
        d.text((x, y + i * lh), vis, font=font, fill=fill, anchor="lm")
    if alpha < 1:
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * alpha)))
    frame.alpha_composite(lay)


def top_scrim(h=640, strength=200):
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arr = np.zeros((H, W, 4), np.uint8)
    arr[..., 0], arr[..., 1], arr[..., 2] = 12, 4, 30
    for y in range(h):
        arr[y, :, 3] = int(strength * (1 - y / h) ** 1.4)
    return Image.fromarray(arr, "RGBA")


def place(frame, img, cx, cy, w, h, sx=1.0, glow=False):
    ww = max(2, int(w * abs(sx)))
    im = img.resize((ww, int(h)), Image.BICUBIC)
    sh = Image.new("RGBA", (ww + 60, int(h) + 60), (0, 0, 0, 0))
    m = Image.new("L", sh.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((30, 30, 30 + ww, 30 + int(h)), radius=18, fill=150)
    sh.putalpha(m.filter(ImageFilter.GaussianBlur(16)))
    frame.alpha_composite(sh, (int(cx - ww / 2 - 30 + 10), int(cy - h / 2 - 30 + 22)))
    if glow:
        g = Image.new("RGBA", sh.size, (255, 200, 110, 0))
        g.putalpha(m.filter(ImageFilter.GaussianBlur(26)))
        frame.alpha_composite(g, (int(cx - ww / 2 - 30), int(cy - h / 2 - 30)))
    frame.alpha_composite(im, (int(cx - ww / 2), int(cy - h / 2)))


def lerp(a, b, t):
    return a + (b - a) * t


def reading(s, out_path, cover_path):
    big = cover_fit(asset(s["bg"]), int(W * 1.12), int(H * 1.12))
    back = rounded(asset(s["back"]), 40)
    faces = [rounded(asset(f), 40) for f, _, _ in s["cards"]]
    fog = make_fog()
    scrim = top_scrim()
    head = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    qf = serif(68, 700)
    g = gold_text_layer(wrap(s["question"], qf, 940), qf, 82, W)
    head.alpha_composite(g, (0, 250))
    SW, SH = 270, 405
    slots = [(W / 2 - 310, 830), (W / 2, 830), (W / 2 + 310, 830)]
    BWc, BHc = 500, 750
    BIG = (W / 2, 835)
    intro, per, outro = 1.4, 3.6, 3.4
    total = intro + per * len(faces) + outro
    rnd = random.Random(1)
    n = int(total * FPS)
    ff = encoder(out_path, total)
    cover = None
    for i in range(n):
        gt = i / FPS
        k_act, lt = None, 0
        for k in range(len(faces)):
            t0 = intro + k * per
            if t0 <= gt < t0 + per:
                k_act, lt = k, gt - t0
        shake = shake_at(lt, 0.75) if k_act is not None else (0, 0)
        frame = bg_frame(big, gt, total, shake=shake)
        flicker(frame, gt)
        off = int((gt * 40) % H)
        frame.alpha_composite(fog.crop((0, H - off, W, 2 * H - off)))
        frame.alpha_composite(scrim)
        frame.alpha_composite(head)
        # cards resting in slots (face up once revealed)
        for k in range(len(faces)):
            t0 = intro + k * per
            if k == k_act and 0.0 <= lt < per - 0.05:
                continue
            img = faces[k] if gt >= t0 + per - 0.05 else back
            dy = 0 if gt > 0.6 + k * 0.15 else (1 - ease((gt - k * 0.15) / 0.6)) * 900
            place(frame, img, slots[k][0], slots[k][1] + dy, SW, SH)
        if k_act is not None:
            k = k_act
            sx0, sy0 = slots[k]
            if lt < 0.45:  # fly to centre, still face down
                t = ease(lt / 0.45)
                place(frame, back, lerp(sx0, BIG[0], t), lerp(sy0, BIG[1], t), lerp(SW, BWc, t), lerp(SH, BHc, t))
            elif lt < 0.9:  # flip
                t = (lt - 0.45) / 0.45
                if t < 0.5:
                    place(frame, back, *BIG, BWc, BHc, sx=1 - 2 * t)
                else:
                    place(frame, faces[k], *BIG, BWc, BHc, sx=2 * t - 1, glow=True)
            elif lt < per - 0.5:  # hold big
                z = 1 + 0.04 * (lt - 0.9)
                place(frame, faces[k], BIG[0], BIG[1], BWc * z, BHc * z, glow=True)
                name = s["cards"][k][1].upper()
                a = ease((lt - 0.9) / 0.3)
                ng = gold_text_layer([name], serif(64, 700), 70, W)
                if a < 1:
                    ng.putalpha(ng.getchannel("A").point(lambda v: int(v * a)))
                frame.alpha_composite(ng, (0, 1225))
                txt = s["cards"][k][2]
                chars = int(max(0, lt - 1.15) * 28)
                shadow_text(frame, txt, sans("SemiBold", 54), 1350, (255, 255, 255, 255), chars=chars)
            else:  # back to slot
                t = ease((lt - (per - 0.5)) / 0.45)
                place(frame, faces[k], lerp(BIG[0], sx0, t), lerp(BIG[1], sy0, t), lerp(BWc, SW, t), lerp(BHc, SH, t))
            if 0.6 < lt < 1.1:  # flash + sparkle burst
                a = 1 - (lt - 0.6) / 0.5
                frame.alpha_composite(Image.new("RGBA", (W, H), (255, 235, 200, int(150 * a))))
                od = ImageDraw.Draw(frame)
                for j in range(16):
                    ang = j / 16 * math.tau
                    r = 300 + (lt - 0.6) * 700
                    sparkle(od, BIG[0] + math.cos(ang) * r * .8, BIG[1] + math.sin(ang) * r, 14, GOLD_TOP + (int(255 * a),))
        end_t = intro + per * len(faces)
        if gt >= end_t:
            a = ease((gt - end_t) / 0.4)
            shadow_text(frame, s["final"], serif(66, 700), 1180, GOLD_TOP + (255,), a)
            shadow_text(frame, s["final2"], sans("Medium", 44), 1290, LILAC + (255,), a, lh=56)
        rgb = frame.convert("RGB")
        if i == int((intro + 2.0) * FPS):
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, round(total, 1))


def bubble(text, font, maxw, fill, tcol, tail="left", chars=None):
    d0 = ImageDraw.Draw(Image.new("L", (1, 1)))
    lines = wrap(text, font, maxw)
    lh = int(font.size * 1.3)
    tw = max(d0.textlength(l, font=font) for l in lines)
    bw, bh = int(tw + 64), int(lh * len(lines) + 40)
    im = Image.new("RGBA", (bw + 30, bh + 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0 = 15
    d.rounded_rectangle((x0, 0, x0 + bw, bh), radius=36, fill=fill)
    if tail == "left":
        d.polygon([(x0 + 26, bh - 6), (x0 + 4, bh + 22), (x0 + 60, bh - 4)], fill=fill)
    else:
        d.polygon([(x0 + bw - 26, bh - 6), (x0 + bw - 4, bh + 22), (x0 + bw - 60, bh - 4)], fill=fill)
    left = chars if chars is not None else 10 ** 9
    for i, ln in enumerate(lines):
        vis = ln[:max(0, left)]
        left -= len(ln)
        d.text((x0 + 32, 20 + lh / 2 + i * lh), vis, font=font, fill=tcol, anchor="lm")
    return im


def pop(im, a):
    if a >= 1:
        return im
    s = 0.6 + 0.4 * a
    r = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.BICUBIC)
    r.putalpha(r.getchannel("A").point(lambda v: int(v * min(1, a * 1.5))))
    return r


def talk(s, out_path, cover_path):
    img1 = cover_fit(asset(s["img1"]), int(W * 1.1), int(H * 1.1))
    img2 = cover_fit(asset(s["img2"]), int(W * 1.1), int(H * 1.1))
    scrim = top_scrim(560, 170)
    setup = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sf = sans("Bold", 58)
    sd = ImageDraw.Draw(setup)
    for i, ln in enumerate(wrap(s["setup"], sf, 940)):
        sd.text((W / 2 + 2, 290 + i * 72 + 3), ln, font=sf, fill=(0, 0, 0, 200), anchor="mm")
        sd.text((W / 2, 290 + i * 72), ln, font=sf, fill=(255, 255, 255, 255), anchor="mm")
    bf = sans("SemiBold", 48)
    cut = s.get("cut_at", 5.2)
    total = s.get("dur", 8.2)
    msgs = s["card_msgs"]
    t_msgs = [0.7, 2.2]
    t_user = 3.8
    n = int(total * FPS)
    ff = encoder(out_path, total)
    cover = None
    for i in range(n):
        gt = i / FPS
        if gt < cut:
            frame = bg_frame(img1, gt, cut, zoom=0.05)
        else:
            frame = bg_frame(img2, gt - cut, total - cut, zoom=0.03, shake=shake_at(gt, cut, 0.45, 30))
        frame.alpha_composite(scrim)
        frame.alpha_composite(setup)
        y = 420
        if gt < cut:
            for k, m in enumerate(msgs):
                if gt >= t_msgs[k]:
                    lt = gt - t_msgs[k]
                    b = bubble(m, bf, 880, (255, 255, 255, 245), (40, 20, 70, 255), "left", chars=int(lt * 30))
                    b = pop(b, ease(lt / 0.25))
                    frame.alpha_composite(b, (70, y))
                    y += b.height + 26
            if gt >= t_user:
                lt = gt - t_user
                b = bubble(s["user_msg"], bf, 820, (124, 77, 255, 245), (255, 255, 255, 255), "right", chars=int(lt * 30))
                b = pop(b, ease(lt / 0.25))
                frame.alpha_composite(b, (W - 70 - b.width, y + 10))
        else:
            lt = gt - cut
            if lt < 0.25:
                frame.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(220 * (1 - lt / 0.25)))))
            b = bubble(s["punch"], sans("ExtraBold", 60), 860, (255, 255, 255, 250), (200, 30, 90, 255), "left")
            b = pop(b, ease((lt - 0.1) / 0.25))
            frame.alpha_composite(b, (int(W / 2 - b.width / 2), 480))
        rgb = frame.convert("RGB")
        if i == int((t_user + 0.9) * FPS):
            cover = rgb
        ff.stdin.write(rgb.tobytes())
    ff.stdin.close()
    ff.wait()
    cover.save(cover_path, quality=95)
    print(out_path, total)


if __name__ == "__main__":
    mode, spec, out, cov = sys.argv[1:5]
    s = json.load(open(spec, encoding="utf-8"))
    (reading if mode == "reading" else talk)(s, out, cov)
