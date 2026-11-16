#!/usr/bin/env python3
"""Generate compressed, original hub images from our own game art."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path("/workspace/game-hub")
ASSETS = ROOT / "assets"
GAMES = ASSETS / "games"
ICONS = ASSETS / "icons"

TRAYORA_THUMB = Path("/workspace/game-lab/prototype/submission/poki/thumbnail-1024.png")
TRAYORA_SHOTS = [
    Path("/workspace/game-lab/prototype/submission/poki/screenshot-1.png"),
    Path("/workspace/game-lab/prototype/submission/poki/screenshot-2.png"),
    Path("/workspace/game-lab/prototype/submission/poki/screenshot-3.png"),
]
SWING_SRC = Path("/workspace/game-lab/game2/shots/gameplay-landscape-en.png")

BG = (7, 8, 15)
BG_ELEV = (16, 18, 30)
GOLD = (240, 195, 74)
CYAN = (126, 224, 208)
VIOLET = (139, 124, 255)
TEXT = (243, 241, 234)
MUTED = (154, 160, 180)

FONT_DISPLAY = Path("/usr/share/fonts/truetype/sand-box/custom/Big Shoulders Display/BigShouldersDisplay[wght].ttf")
FONT_PRETENDARD_B = Path("/usr/share/fonts/truetype/sand-box/custom/Pretendard/Pretendard-Bold.otf")
FONT_PRETENDARD_M = Path("/usr/share/fonts/truetype/sand-box/custom/Pretendard/Pretendard-Medium.otf")
FONT_PRETENDARD_S = Path("/usr/share/fonts/truetype/sand-box/custom/Pretendard/Pretendard-SemiBold.otf")
FONT_SAUCE_BLK = Path("/usr/share/fonts/truetype/sand-box/custom/Open Sauce Sans/OpenSauceSans-Black.ttf")


def font(path: Path, size: int, weight: int | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(path), size=size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            try:
                f.set_variation_by_name("Black")
            except Exception:
                pass
    return f


def save_webp(im: Image.Image, dest: Path, max_kb: int = 150, quality: int = 86) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    q = quality
    while q >= 60:
        im.save(dest, "WEBP", quality=q, method=6)
        size = dest.stat().st_size
        if size <= max_kb * 1024:
            print(f"  {dest.name}: {size} bytes @ q={q} {im.size}")
            return
        q -= 6
    print(f"  WARN {dest.name}: {dest.stat().st_size} bytes (over budget)")


def save_png(im: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True)
    print(f"  {dest.name}: {dest.stat().st_size} bytes {im.size}")


def checkerboard(size: tuple[int, int], cell: int = 32) -> Image.Image:
    w, h = size
    im = Image.new("RGB", size, (14, 16, 28))
    px = im.load()
    c1, c2 = (14, 16, 28), (20, 23, 40)
    for y in range(h):
        for x in range(w):
            if ((x // cell) + (y // cell)) % 2 == 0:
                px[x, y] = c1
            else:
                px[x, y] = c2
    return im


def rounded(im: Image.Image, radius: int) -> Image.Image:
    im = im.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, im.width, im.height), radius=radius, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, mask=mask)
    return out


def fit_cover(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(im, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.52))


def draw_vignette(im: Image.Image, strength: float = 0.45) -> Image.Image:
    im = im.convert("RGBA")
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = im.size
    # radial-ish by stacking ellipses
    for i in range(24, 0, -1):
        alpha = int(strength * 255 * (1 - i / 24) ** 2)
        pad_x = int(w * 0.04 * i)
        pad_y = int(h * 0.06 * i)
        d.rectangle((0, 0, w, h), outline=(0, 0, 0, alpha), width=max(pad_x, pad_y) // 8)
    # simpler gradient frame
    frame = Image.new("L", im.size, 0)
    fd = ImageDraw.Draw(frame)
    for i in range(80):
        a = int(255 * (i / 80) ** 1.6 * strength)
        fd.rectangle((i, i, w - 1 - i, h - 1 - i), outline=a)
    dark = Image.new("RGBA", im.size, (0, 0, 0, 255))
    dark.putalpha(frame)
    return Image.alpha_composite(im, dark)


def trayora_thumb() -> None:
    src = Image.open(TRAYORA_THUMB).convert("RGB")
    # 16:9 panel with Trayora-style checker and the iconic board centered
    canvas = checkerboard((1280, 720), cell=40)
    # soft inner glow
    glow = Image.new("RGB", canvas.size, (12, 14, 26))
    canvas = Image.blend(canvas, glow, 0.25)
    board = src.resize((640, 640), Image.Resampling.LANCZOS)
    board = rounded(board, 28)
    # drop shadow
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    x, y = (1280 - 640) // 2, (720 - 640) // 2
    sd.rounded_rectangle((x + 8, y + 18, x + 640 + 8, y + 640 + 18), 28, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    out = canvas.convert("RGBA")
    out = Image.alpha_composite(out, shadow)
    out.paste(board, (x, y), board)
    save_webp(out.convert("RGB"), GAMES / "trayora-thumb.webp")
    # also a compact square for icons / future use
    sq = src.resize((640, 640), Image.Resampling.LANCZOS)
    save_webp(sq, GAMES / "trayora-thumb-square.webp")


def trayora_shots() -> None:
    for i, path in enumerate(TRAYORA_SHOTS, 1):
        im = Image.open(path).convert("RGB")
        im = im.resize((1280, 720), Image.Resampling.LANCZOS)
        save_webp(im, GAMES / f"trayora-shot-{i}.webp")


def swingloom_thumb() -> None:
    src = Image.open(SWING_SRC).convert("RGB")
    w, h = src.size
    # Drop the top HUD (~14% ) and take a 16:9 window focused on Pip (left-of-center).
    top = int(h * 0.13)
    body = src.crop((0, top, w, h))
    bw, bh = body.size
    target_ratio = 16 / 9
    # body is wider than 16:9; crop width, bias slightly left toward Pip
    new_w = int(bh * target_ratio)
    # Pip is around 0.40 of full width; after HUD crop, same x
    cx = int(w * 0.42)
    left = max(0, min(bw - new_w, cx - new_w // 2))
    crop = body.crop((left, 0, left + new_w, bh))
    cover = crop.resize((1280, 720), Image.Resampling.LANCZOS)
    save_webp(cover, GAMES / "swingloom-thumb.webp")


def og_image() -> None:
    W, H = 1200, 630
    canvas = Image.new("RGB", (W, H), BG)
    dtmp = ImageDraw.Draw(canvas)

    # background atmosphere
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # orbs
    def orb(cx, cy, r, color, a):
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        blob = Image.new("L", (r * 2, r * 2), 0)
        bd = ImageDraw.Draw(blob)
        for i in range(r, 0, -1):
            alpha = int(a * (i / r) ** 2)
            bd.ellipse((r - i, r - i, r + i, r + i), fill=alpha)
        tint = Image.new("RGBA", (r * 2, r * 2), color + (0,))
        tint.putalpha(blob)
        layer.paste(tint, (cx - r, cy - r), tint)
        return layer

    overlay = Image.alpha_composite(overlay, orb(180, 120, 260, (40, 70, 140), 90))
    overlay = Image.alpha_composite(overlay, orb(200, 500, 220, (90, 50, 160), 70))
    overlay = Image.alpha_composite(overlay, orb(1000, 80, 280, (40, 120, 110), 80))
    overlay = Image.alpha_composite(overlay, orb(980, 540, 240, (160, 110, 40), 70))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    # faint grid
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, 40):
        gd.line((x, 0, x, H), fill=(255, 255, 255, 14))
    for y in range(0, H, 40):
        gd.line((0, y, W, y), fill=(255, 255, 255, 14))
    canvas = Image.alpha_composite(canvas, grid)

    # game stills on the right, overlapping
    tray = Image.open(TRAYORA_SHOTS[0]).convert("RGB")
    swing = Image.open(SWING_SRC).convert("RGB")
    # crop swing similarly
    sw, sh = swing.size
    top = int(sh * 0.13)
    body = swing.crop((0, top, sw, sh))
    swing = ImageOps.fit(body, (560, 315), method=Image.Resampling.LANCZOS, centering=(0.42, 0.45))
    tray = ImageOps.fit(tray, (560, 315), method=Image.Resampling.LANCZOS, centering=(0.35, 0.5))

    def framed(im, radius=22):
        pad = 6
        base = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
        # border glow
        bd = ImageDraw.Draw(base)
        bd.rounded_rectangle((0, 0, base.width - 1, base.height - 1), radius + 4, fill=(255, 255, 255, 28))
        inner = rounded(im, radius)
        base.paste(inner, (pad, pad), inner)
        return base

    t = framed(tray)
    s = framed(swing)

    def drop(card, xy, blur=16):
        shad = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        mask = card.split()[-1]
        blob = Image.new("RGBA", card.size, (0, 0, 0, 180))
        shad.paste(blob, (xy[0], xy[1] + 10), mask)
        shad = shad.filter(ImageFilter.GaussianBlur(blur))
        return shad

    pos_s = (620, 300)
    pos_t = (640, 78)
    canvas = Image.alpha_composite(canvas, drop(t, pos_t))
    canvas.paste(t, pos_t, t)
    canvas = Image.alpha_composite(canvas, drop(s, pos_s))
    canvas.paste(s, pos_s, s)

    draw = ImageDraw.Draw(canvas)

    # mark (2x2 blocks)
    mark = draw_mark(88)
    canvas.paste(mark, (72, 78), mark)

    # typography
    try:
        f_display = font(FONT_DISPLAY, 118, weight=800)
    except Exception:
        f_display = font(FONT_SAUCE_BLK, 86)
    f_ko = font(FONT_PRETENDARD_B, 36)
    f_sub = font(FONT_PRETENDARD_M, 26)
    f_by = font(FONT_PRETENDARD_S, 22)

    draw.text((72, 188), "GAME HUB", font=f_display, fill=TEXT)
    draw.text((76, 318), "게임 허브", font=f_ko, fill=GOLD)
    draw.text((76, 380), "Original browser games", font=f_sub, fill=MUTED)
    draw.text((76, 424), "Trayora  ·  Swingloom", font=f_sub, fill=CYAN)
    draw.text((76, 546), "BeomMin Park", font=f_by, fill=(180, 184, 200))

    out = canvas.convert("RGB")
    dest = ASSETS / "og-image.png"
    # compress reasonably
    out.save(dest, "PNG", optimize=True)
    print(f"  {dest.name}: {dest.stat().st_size} bytes {out.size}")
    # jpeg fallback for picky crawlers
    jpg = ASSETS / "og-image.jpg"
    out.save(jpg, "JPEG", quality=90, optimize=True, subsampling=1)
    print(f"  {jpg.name}: {jpg.stat().st_size} bytes {out.size}")


def draw_mark(size: int) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # rounded back plate
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22), fill=(16, 18, 32, 255), outline=(255, 255, 255, 30), width=max(1, size // 32))
    colors = [
        (110, 200, 255, 255),
        (240, 210, 74, 255),
        (143, 209, 138, 255),
        (192, 132, 252, 255),
    ]
    pad = size * 0.16
    gap = size * 0.07
    tile = (size - pad * 2 - gap) / 2
    r = max(3, int(size * 0.08))
    coords = [
        (pad, pad),
        (pad + tile + gap, pad),
        (pad, pad + tile + gap),
        (pad + tile + gap, pad + tile + gap),
    ]
    for (x, y), c in zip(coords, colors):
        d.rounded_rectangle((x, y, x + tile, y + tile), radius=r, fill=c)
    return im


def icons() -> None:
    for size, name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
        mark = draw_mark(size)
        # on solid bg for apple/pwa
        bg = Image.new("RGBA", (size, size), BG + (255,))
        if name.startswith("favicon"):
            save_png(mark, ICONS / name)
        else:
            bg.alpha_composite(mark)
            save_png(bg.convert("RGB").convert("RGBA") if False else bg.convert("RGB"), ICONS / name)
            # actually apple touch should be opaque
            opaque = Image.new("RGB", (size, size), BG)
            opaque.paste(mark, mask=mark)
            save_png(opaque, ICONS / name)


def favicon_svg() -> None:
    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Game Hub">
  <rect width="32" height="32" rx="8" fill="#101220"/>
  <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="rgba(255,255,255,0.12)"/>
  <rect x="5" y="5" width="9.5" height="9.5" rx="2.2" fill="#6ec8ff"/>
  <rect x="17.5" y="5" width="9.5" height="9.5" rx="2.2" fill="#f0d24a"/>
  <rect x="5" y="17.5" width="9.5" height="9.5" rx="2.2" fill="#8fd18a"/>
  <rect x="17.5" y="17.5" width="9.5" height="9.5" rx="2.2" fill="#c084fc"/>
</svg>
"""
    dest = ASSETS / "favicon.svg"
    dest.write_text(svg, encoding="utf-8")
    print(f"  {dest.name}: {dest.stat().st_size} bytes")


def main() -> None:
    GAMES.mkdir(parents=True, exist_ok=True)
    ICONS.mkdir(parents=True, exist_ok=True)
    print("Building assets…")
    favicon_svg()
    icons()
    trayora_thumb()
    trayora_shots()
    swingloom_thumb()
    og_image()
    print("done")


if __name__ == "__main__":
    main()
