#!/usr/bin/env python3
"""Generate default OG image for Lunovel (1200x630)."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "og-default.png")

# Solid dark navy + accent glow corners via ellipse overlay
img = Image.new("RGB", (W, H), (15, 18, 35))
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
for cx, cy, r, color, alpha in [
    (100, 100, 280, (237, 78, 8), 60),
    (1100, 530, 320, (250, 204, 21), 50),
    (1100, 100, 160, (237, 78, 8), 45),
    (100, 530, 180, (99, 102, 241), 40),
]:
    od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
img.paste(overlay, (0, 0), overlay)

draw = ImageDraw.Draw(img)

def load_font(size, bold=False):
    candidates = [
        "/system/fonts/Roboto-Bold.ttf" if bold else "/system/fonts/Roboto-Regular.ttf",
        "/system/fonts/DroidSans-Bold.ttf" if bold else "/system/fonts/DroidSans.ttf",
        "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSerif-Bold.ttf" if bold else "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSerif.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

font_brand = load_font(140, bold=True)
font_tagline = load_font(48)
font_sub = load_font(32)

def center_text(text, font, y, fill=(255, 255, 255)):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) / 2, y), text, font=font, fill=fill)

center_text("🌙 Lunovel", font_brand, 180)
center_text("Baca Novel Gratis Online", font_tagline, 360)
center_text("Terjemahan · Original · Update Setiap Hari", font_sub, 440)
center_text("lunovel.vercel.app", font_sub, 540, fill=(250, 204, 21))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "PNG", optimize=True)
print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes)")
