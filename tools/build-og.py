#!/usr/bin/env python3
"""Build assets/og-image.png (1200x630) in the hub's paper/pastel style from games.json,
and the PNG app icons (assets/icons/) from the same mark as assets/favicon.svg."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PAPER = (243, 238, 228); DOT = (217, 207, 189); INK = (29, 27, 23); INK2 = (74, 70, 62); MUTE = (138, 131, 118)
CORAL = (255, 91, 58); BUTTER = (255, 216, 77); CARD = (255, 253, 248)
# Keep in sync with TONES in js/hub.js. Unknown ids get a hue from their id, like the site does.
TONES = {"trayora": "#dcd3ff", "swingloom": "#cfe6ff", "rattlecart": "#ffe0c7", "quiltrun": "#d3f0dc", "cuehop": "#ffd8e3"}
FONT = "/usr/share/fonts/truetype/sand-box/custom/Pretendard/Pretendard-{}.otf"
MONO = "/usr/share/fonts/truetype/sand-box/google/IBM Plex Mono/IBMPlexMono-Bold.ttf"
f = lambda w, s: ImageFont.truetype(FONT.format(w), s)
mono = lambda s: ImageFont.truetype(MONO, s)

def hexrgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def tone(g):
    if g["id"] in TONES: return hexrgb(TONES[g["id"]])
    import colorsys
    h = 0
    for c in g["id"]: h = (h * 31 + ord(c)) & 0xFFFFFFFF
    r, gg, b = colorsys.hls_to_rgb((h % 360) / 360, 0.88, 0.75)
    return (int(r * 255), int(gg * 255), int(b * 255))

def mark(size):
    s = size / 32; m = Image.new("RGBA", (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(m)
    d.rounded_rectangle((1.5 * s, 1.5 * s, 30.5 * s, 30.5 * s), int(8 * s), fill=INK)
    d.rounded_rectangle((7 * s, 7 * s, 15 * s, 15 * s), int(2 * s), fill=BUTTER)
    d.rounded_rectangle((17 * s, 7 * s, 25 * s, 15 * s), int(4 * s), fill=(255, 107, 74))
    d.rounded_rectangle((7 * s, 17 * s, 15 * s, 25 * s), int(2 * s), fill=(143, 214, 180))
    d.polygon([(18 * s, 17.5 * s), (25 * s, 21 * s), (18 * s, 24.5 * s)], fill=(185, 166, 255))
    return m

data = json.loads((ROOT / "games.json").read_text())["games"]
live = [dict(g, _i=i) for i, g in enumerate(data) if g.get("status") == "live" and g.get("url")]
live.sort(key=lambda g: (g.get("released") or "", g["_i"]))
for n, g in enumerate(live): g["_no"] = n + 1
newest = next((g for g in live if g.get("featured") is True), live[-1] if live else None)

W, H = 1200, 630
im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
for y in range(11, H, 22):
    for x in range(11, W, 22): d.ellipse((x - 1, y - 1, x + 1, y + 1), fill=DOT)
mk = mark(64); im.paste(mk, (64, 58), mk)
d.text((144, 60), "게임 허브", font=f("Bold", 34), fill=INK)
d.text((145, 100), "한판공방", font=f("Medium", 19), fill=MUTE)
d.text((64, 170), "FREE BROWSER GAMES · NO SIGN-UP", font=mono(18), fill=CORAL)
d.text((62, 204), "누르면 바로 한 판.", font=f("Bold", 60), fill=INK)
d.rectangle((62, 318, 548, 346), fill=BUTTER)
d.text((62, 276), "설치도 가입도 없어요.", font=f("Bold", 60), fill=INK)
d.text((64, 384), "휴대폰이든 PC든 링크만 누르면 그대로 켜져요.", font=f("Medium", 25), fill=INK2)
d.rounded_rectangle((64, 450, 330, 510), 30, fill=INK)
d.text((197, 480), f"게임 {len(live)}개 무료 플레이", font=f("Bold", 23), fill=(255, 255, 255), anchor="mm")
d.text((64, 556), "HANPAN GONGBANG", font=mono(20), fill=MUTE)

if newest:
    # pastel tile with an ink "cartridge" holding the newest game's cover, tilted like the site hero
    tx, ty, tw, th = 640, 62, 500, 440
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((tx + 8, ty + 8, tx + tw + 8, ty + th + 8), 34, fill=INK + (255,))
    im.paste(sh, (0, 0), sh)
    d.rounded_rectangle((tx, ty, tx + tw, ty + th), 34, fill=tone(newest), outline=INK, width=3)
    cw, chh = 380, 262
    cart = Image.new("RGBA", (cw + 24, chh + 52), (0, 0, 0, 0)); cd = ImageDraw.Draw(cart)
    cd.rounded_rectangle((0, 0, cw + 23, chh + 51), 24, fill=INK)
    shot = ImageOps.fit(Image.open(ROOT / newest["thumbnail"]).convert("RGB"), (cw, chh), Image.LANCZOS)
    msk = Image.new("L", (cw, chh), 0); ImageDraw.Draw(msk).rounded_rectangle((0, 0, cw - 1, chh - 1), 12, fill=255)
    cart.paste(shot, (12, 12), msk)
    cd.text((18, chh + 18), "No.%02d" % newest["_no"], font=mono(16), fill=(164, 157, 143))
    cart = cart.rotate(-3, resample=Image.BICUBIC, expand=True)
    im.paste(cart, (tx + (tw - cart.width) // 2, ty + 26), cart)
    d.rounded_rectangle((tx - 16, ty - 18, tx + 96, ty + 22), 20, fill=CORAL, outline=CARD, width=3)
    d.text((tx + 40, ty + 2), "NEW", font=mono(20), fill=(255, 255, 255), anchor="mm")
    d.text((tx + 32, ty + th - 36), newest["name"]["ko"], font=f("Bold", 36), fill=INK, anchor="lm")
    # swatches for the rest of the shelf
    x = tx
    for g in reversed(live[-6:-1] if newest is live[-1] else [g for g in live if g is not newest][-5:]):
        d.rounded_rectangle((x, ty + th + 26, x + 40, ty + th + 66), 10, fill=tone(g), outline=INK, width=2)
        d.text((x + 20, ty + th + 46), "%02d" % g["_no"], font=mono(15), fill=INK, anchor="mm")
        x += 50
im.save(ROOT / "assets/og-image.png", optimize=True)

icons = ROOT / "assets/icons"
for name, size, pad in [("favicon-32.png", 32, 0), ("icon-192.png", 192, 0), ("icon-512.png", 512, 0), ("apple-touch-icon.png", 180, 18)]:
    if pad:  # iOS masks its own corners: full-bleed paper with the mark inset
        out = Image.new("RGB", (size, size), PAPER); m = mark(size - pad * 2); out.paste(m, (pad, pad), m)
    else:
        out = mark(size * 4).resize((size, size), Image.LANCZOS)
    out.save(icons / name, optimize=True)
print("og-image.png", (ROOT / "assets/og-image.png").stat().st_size, "newest:", newest and newest["id"], [g["id"] for g in live])
