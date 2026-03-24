#!/usr/bin/env python3
"""Genera el ícono RoDicta para macOS Dock usando el logo oficial."""
import os
from PIL import Image, ImageDraw

def make_icon(size=1024):
    # Base: fondo navy oscuro
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Degradado de fondo navy → azul oscuro
    for y in range(size):
        t = y / size
        r = int(6 + 10 * t)
        g = int(6 + 4 * t)
        b = int(21 + 18 * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Esquinas redondeadas estilo macOS
    radius = int(size * 0.225)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=255)
    img.putalpha(mask)

    # Centrar el hero (micrófono) escalado al 75% del ícono
    hero_path = os.path.join(os.path.dirname(__file__), "..", "public", "rodicta-hero.jpeg")
    hero_path = os.path.normpath(hero_path)
    hero = Image.open(hero_path).convert("RGBA")

    target_h = int(size * 0.68)
    ratio = target_h / hero.height
    target_w = int(hero.width * ratio)
    hero = hero.resize((target_w, target_h), Image.LANCZOS)

    # Centrar horizontalmente, alinear arriba con margen
    x = (size - target_w) // 2
    y = int(size * 0.06)
    img.paste(hero, (x, y), hero)

    # Logo texto en la parte inferior
    logo_path = os.path.join(os.path.dirname(__file__), "..", "public", "rodicta-logo.png")
    logo_path = os.path.normpath(logo_path)
    logo = Image.open(logo_path).convert("RGBA")

    # Quitar fondo blanco/claro del logo
    data = logo.load()
    for py in range(logo.height):
        for px in range(logo.width):
            r, g, b, a = data[px, py]
            if r > 220 and g > 220 and b > 220:
                data[px, py] = (r, g, b, 0)  # transparente

    logo_w = int(size * 0.72)
    ratio = logo_w / logo.width
    logo_h = int(logo.height * ratio)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)

    lx = (size - logo_w) // 2
    ly = size - logo_h - int(size * 0.04)
    img.paste(logo, (lx, ly), logo)

    return img

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    iconset_dir = os.path.join(out_dir, "RoDicta.iconset")
    os.makedirs(iconset_dir, exist_ok=True)

    print("🎨 Generando ícono RoDicta con logo oficial...")
    base = make_icon(1024)

    sizes = [16, 32, 64, 128, 256, 512, 1024]
    for s in sizes:
        img = base.resize((s, s), Image.LANCZOS)
        img.save(os.path.join(iconset_dir, f"icon_{s}x{s}.png"))
        if s <= 512:
            img2 = base.resize((s*2, s*2), Image.LANCZOS)
            img2.save(os.path.join(iconset_dir, f"icon_{s}x{s}@2x.png"))
        print(f"  ✓ {s}x{s}")

    png_path = os.path.join(out_dir, "RoDicta.png")
    base.save(png_path)
    print(f"✅ PNG: {png_path}")

    icns_path = os.path.join(out_dir, "RoDicta.icns")
    if os.system(f'iconutil -c icns "{iconset_dir}" -o "{icns_path}"') == 0:
        print(f"✅ ICNS: {icns_path}")

    return icns_path

if __name__ == "__main__":
    main()
