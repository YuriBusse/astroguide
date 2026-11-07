"""Procedural sunlit sheer-curtain background (cream folds + window-frame and leaf shadows).

Usage: python3 make_curtain_bg.py out.jpg [seed]
"""
import math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1188, 2112  # 1.1x reel size so the renderer can slowly zoom


def main(out, seed=3):
    rnd = random.Random(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # warm light from the upper right
    light = 0.90 + 0.14 * np.clip(1 - np.hypot((xx - W * 0.85) / W, (yy - H * 0.15) / H) * 1.1, 0, 1)
    # vertical folds of a sheer curtain
    folds = np.zeros_like(xx)
    for _ in range(9):
        f, ph, a = rnd.uniform(4, 11), rnd.uniform(0, 6.28), rnd.uniform(0.012, 0.035)
        folds += a * np.sin(xx / W * f * math.tau + ph + np.sin(yy / H * 2.0 + ph) * 0.4)
    base = np.clip(light + folds, 0, 1.1)
    # shadow mask: window mullions (diagonal) + blurred leaves
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    ang = math.radians(-14)
    for k in range(-2, 5):
        x0 = W * 0.18 + k * W * 0.34
        pts = [(x0, -100), (x0 + 70, -100), (x0 + 70 + math.tan(ang) * -H * 1.2, H + 100), (x0 + math.tan(ang) * -H * 1.2, H + 100)]
        d.polygon(pts, fill=150)
    for k in range(-1, 6):
        y0 = H * 0.08 + k * H * 0.26
        d.polygon([(-50, y0), (W + 50, y0 - 120), (W + 50, y0 - 70), (-50, y0 + 50)], fill=150)
    for _ in range(140):  # leaves in the right half
        cx, cy = rnd.uniform(W * 0.45, W * 1.05), rnd.uniform(-50, H * 0.75)
        r = rnd.uniform(14, 44)
        a = rnd.uniform(0, 6.28)
        pts = [(cx + math.cos(a + t) * r * (1 if t % math.pi < 1.6 else 0.45), cy + math.sin(a + t) * r * 0.55) for t in np.linspace(0, 6.28, 14)]
        d.polygon(pts, fill=170)
    m = m.filter(ImageFilter.GaussianBlur(18))
    sh = np.asarray(m, np.float32) / 255 * 0.30
    v = base * (1 - sh)
    warm = np.array([255, 236, 212], np.float32)
    img = np.clip(v[..., None] * warm, 0, 255).astype(np.uint8)
    out_im = Image.fromarray(img, "RGB").filter(ImageFilter.GaussianBlur(1.5))
    noise = Image.fromarray(np.random.default_rng(seed).integers(118, 138, (H, W), dtype=np.uint8), "L")
    out_im = Image.blend(out_im, Image.merge("RGB", [noise] * 3), 0.03)
    out_im.save(out, quality=93)
    print(out)


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 3)
