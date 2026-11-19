#!/usr/bin/env python3
"""Build assets/og-image.png (1200x630) in the hub's dark store style, from games.json thumbnails."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
BG = (15, 17, 21); PANEL = (23, 26, 33); TEXT = (235, 231, 222); MUTED = (154, 159, 171)
AMBER = (255, 181, 71); CORAL = (255, 107, 87)
DISPLAY = "/usr/share/fonts/truetype/sand-box/google/Black Han Sans/BlackHanSans-Regular.ttf"
BOLD = "/usr/share/fonts/truetype/sand-box/custom/Pretendard/Pretendard-Bold.otf"
MED = "/usr/share/fonts/truetype/sand-box/custom/Pretendard/Pretendard-Medium.otf"
f = lambda p, s: ImageFont.truetype(p, s)

data = json.loads((ROOT / "games.json").read_text())["games"]
live = [g for g in data if g.get("status") == "live"]
live.sort(key=lambda g: g.get("released") or "", reverse=True)
W, H = 1200, 630
im = Image.new("RGB", (W, H), BG)
glow = Image.new("RGB", (W, H), BG)
gd = ImageDraw.Draw(glow)
gd.ellipse((520, -360, 1500, 420), fill=(70, 52, 24))
im = Image.blend(im, glow.filter(ImageFilter.GaussianBlur(120)), 0.9)
d = ImageDraw.Draw(im)

def mark(size):
    m = Image.new("RGBA", (size, size), (0, 0, 0, 0)); md = ImageDraw.Draw(m)
    md.rounded_rectangle((0, 0, size - 1, size - 1), int(size * 0.22), fill=(16, 18, 32))
    cols = [(110, 200, 255), (240, 210, 74), (143, 209, 138), (192, 132, 252)]
    pad, gap = size * 0.16, size * 0.07; t = (size - pad * 2 - gap) / 2
    for i, c in enumerate(cols):
        x = pad + (i % 2) * (t + gap); y = pad + (i // 2) * (t + gap)
        md.rounded_rectangle((x, y, x + t, y + t), int(size * 0.08), fill=c)
    return m

mk = mark(64); im.paste(mk, (60, 62), mk)
d.text((140, 60), "게임 허브", font=f(DISPLAY, 58), fill=TEXT)
d.text((62, 150), "GAME HUB", font=f(DISPLAY, 34), fill=AMBER)
d.text((62, 206), "범민 공방이 직접 만든", font=f(MED, 30), fill=MUTED)
d.text((62, 246), "무료 브라우저 게임", font=f(BOLD, 40), fill=TEXT)
y = 318
for line in ["설치 없이 바로 · 회원가입 없음", "휴대폰 · PC"]:
    d.text((62, y), line, font=f(MED, 26), fill=(205, 200, 190)); y += 40
# price/play strip
d.rectangle((62, 448, 452, 512), fill=(10, 11, 14))
d.text((82, 464), "무료", font=f(BOLD, 26), fill=TEXT)
d.rectangle((160, 454, 446, 506), fill=AMBER)
d.text((303, 480), f"게임 {len(live)}개 플레이", font=f(BOLD, 24), fill=(29, 19, 5), anchor="mm")
d.text((62, 548), "parkbeommin.github.io/game-hub", font=f(MED, 22), fill=MUTED)

def card(g, w, h):
    return ImageOps.fit(Image.open(ROOT / g["thumbnail"]).convert("RGB"), (w, h), Image.LANCZOS)

if live:
    bx, by, bw, bh = 520, 70, 620, 349
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle((bx + 10, by + 18, bx + bw + 10, by + bh + 18), fill=(0, 0, 0, 170))
    im.paste(sh.filter(ImageFilter.GaussianBlur(16)), (0, 0), sh.filter(ImageFilter.GaussianBlur(16)))
    im.paste(card(live[0], bw, bh), (bx, by))
    d.polygon([(bx, by + 18), (bx + 96, by + 18), (bx + 84, by + 54), (bx, by + 54)], fill=CORAL)
    d.text((bx + 14, by + 22), "신작", font=f(BOLD, 24), fill=(255, 255, 255))
    d.rectangle((bx, by + bh, bx + bw, by + bh + 52), fill=PANEL)
    d.text((bx + 16, by + bh + 8), live[0]["name"]["ko"], font=f(DISPLAY, 32), fill=TEXT)
    d.text((bx + bw - 16, by + bh + 26), "무료", font=f(BOLD, 22), fill=AMBER, anchor="rm")
    rest = live[1:3]
    for i, g in enumerate(rest):
        w2 = (bw - 12) // 2; x = bx + i * (w2 + 12); y2 = by + bh + 66
        im.paste(card(g, w2, 108), (x, y2))
im.save(ROOT / "assets/og-image.png", optimize=True)
print("og-image.png", (ROOT / "assets/og-image.png").stat().st_size, [g["id"] for g in live])
