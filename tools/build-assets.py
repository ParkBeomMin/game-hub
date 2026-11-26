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
    # favicon.svg and assets/icons/*.png now come from tools/build-og.py (2026-11 redesign mark).
    trayora_thumb()
    trayora_shots()
    swingloom_thumb()
    print("done")


if __name__ == "__main__":
    main()
