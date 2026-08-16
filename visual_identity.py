from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "visual-identity.webp"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

try:
    regular = ImageFont.truetype(FONT, 18)
    small = ImageFont.truetype(FONT, 14)
    label = ImageFont.truetype(BOLD, 17)
    heading = ImageFont.truetype(BOLD, 19)
except OSError:
    regular = small = label = heading = ImageFont.load_default()

avatar = Image.open(SOURCE).convert("RGB")
profiles = {
    "light": {"bg": "#f6f8ff", "panel": "#ffffff", "panel2": "#eef2ff", "stroke": "#9aa5d4", "accent": "#2563eb", "accent2": "#7c3aed", "text": "#1f2937", "muted": "#526071", "scan": "#06b6d4"},
    "dark": {"bg": "#070b1d", "panel": "#0d1028", "panel2": "#11163a", "stroke": "#2d3f88", "accent": "#39ffe7", "accent2": "#c36dff", "text": "#e9e7ff", "muted": "#a7acd5", "scan": "#39ffe7"},
}

for theme, c in profiles.items():
    image = Image.new("RGB", (1400, 760), c["bg"])
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((18, 18, 1382, 742), radius=24, fill=c["panel"], outline=c["accent2"], width=2)
    draw.rounded_rectangle((34, 34, 1366, 76), radius=13, fill=c["panel2"], outline=c["stroke"], width=1)
    for x, color in ((60, "#ff5f57"), (83, "#febc2e"), (106, "#28c840")):
        draw.ellipse((x - 7, 48, x + 7, 62), fill=color)
    draw.text((132, 46), "vedant@devos ~ % ./profile.sh --live", font=regular, fill=c["muted"])
    draw.text((1260, 48), "SCANNING", font=small, fill=c["accent"])

    draw.rounded_rectangle((42, 102, 622, 708), radius=18, fill=c["panel"], outline=c["stroke"], width=1)
    draw.rounded_rectangle((62, 122, 602, 152), radius=9, fill=c["panel2"])
    draw.text((80, 130), "VISUAL.IDENTITY", font=small, fill=c["accent2"])
    avatar_fit = ImageOps.fit(avatar, (522, 522), method=Image.Resampling.LANCZOS)
    mask = Image.new("L", (522, 522), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 521, 521), radius=16, fill=255)
    image.paste(avatar_fit, (58, 148), mask)
    draw.rounded_rectangle((58, 148, 580, 670), radius=16, outline=c["accent"], width=2)

    draw.rounded_rectangle((644, 102, 1358, 708), radius=18, fill=c["panel"], outline=c["stroke"], width=1)
    draw.rounded_rectangle((664, 122, 1338, 152), radius=9, fill=c["panel2"])
    draw.text((682, 130), "SYSTEM.INFO", font=small, fill=c["accent2"])
    draw.text((682, 184), "vedant@devos", font=heading, fill=c["accent"])
    draw.line((682, 212, 1320, 212), fill=c["stroke"], width=1)

    rows = [("Subject:", "Vedant Waze"), ("Role:", "Full-Stack Engineer - AI Builder"), ("Origin:", "Maharashtra, India"), ("Status:", "Building - Learning - Shipping"), ("Toolchain:", "VS Code - Git - Netlify - Supabase")]
    y = 232
    for key, value in rows:
        draw.text((682, y), key, font=label, fill=c["accent2"])
        draw.text((932, y), value, font=regular, fill=c["text"])
        y += 34

    draw.line((682, 408, 1320, 408), fill=c["stroke"], width=1)
    tech = [("Core Lang:", "JavaScript - TypeScript - Python"), ("Core Frontend:", "React - Vite - Tailwind CSS"), ("Core Backend:", "Node.js - Netlify Functions"), ("Core Database:", "Supabase - PostgreSQL"), ("Core Infra:", "Netlify - Vercel - Git")]
    y = 430
    for key, value in tech:
        draw.text((682, y), key, font=label, fill=c["accent"])
        draw.text((932, y), value, font=regular, fill=c["text"])
        y += 34

    draw.line((682, 608, 1320, 608), fill=c["stroke"], width=1)
    draw.text((682, 626), "Contact:", font=label, fill=c["accent2"])
    draw.text((932, 626), "github.com/V3DANT-lab", font=regular, fill=c["text"])
    draw.rectangle((34, 408, 1366, 411), fill=c["scan"])
    image.save(ASSETS / f"visual-identity-{theme}.webp", "WEBP", quality=88, method=6)

print("Generated light and dark visual identity panels.")
