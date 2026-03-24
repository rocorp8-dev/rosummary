#!/usr/bin/env python3
"""
Genera el ícono de RoSummary para macOS Dock.
Diseño: fondo degradado violeta-índigo oscuro, ondas de audio, micrófono IA.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def draw_icon(size=1024):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # ── Fondo: degradado vertical violeta oscuro → índigo
    bg_top    = (15, 10, 40)      # violeta muy oscuro
    bg_bottom = (30, 20, 80)      # índigo
    for y in range(size):
        t = y / size
        color = lerp_color(bg_top, bg_bottom, t)
        draw.line([(0, y), (size, y)], fill=(*color, 255))

    # ── Rounded rectangle mask para esquinas redondeadas (app icon macOS)
    radius = int(size * 0.225)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)

    # ── Aplicar máscara al fondo
    img.putalpha(mask)

    # ── Círculo central con glow (halo violeta)
    cx, cy = size // 2, size // 2
    glow_r = int(size * 0.32)
    for g in range(glow_r, 0, -4):
        alpha = int(60 * (1 - g / glow_r) ** 2)
        color = (120, 80, 220, alpha)
        draw.ellipse([cx - g, cy - g, cx + g, cy + g], fill=color)

    # ── Disco central (fondo del micrófono)
    disc_r = int(size * 0.22)
    disc_color = (35, 28, 75, 240)
    draw.ellipse([cx - disc_r, cy - disc_r, cx + disc_r, cy + disc_r], fill=disc_color)
    # borde brillante
    draw.ellipse([cx - disc_r, cy - disc_r, cx + disc_r, cy + disc_r],
                 outline=(140, 100, 255, 200), width=int(size * 0.012))

    # ── Micrófono
    mic_w  = int(size * 0.095)
    mic_h  = int(size * 0.165)
    mic_rx = int(size * 0.045)
    mic_top_y    = cy - int(size * 0.105)
    mic_bottom_y = cy + int(size * 0.055)

    # cuerpo del micrófono
    draw.rounded_rectangle(
        [cx - mic_w // 2, mic_top_y, cx + mic_w // 2, mic_bottom_y],
        radius=mic_rx,
        fill=(200, 170, 255, 255),
        outline=(255, 255, 255, 180),
        width=int(size * 0.008)
    )

    # arco inferior del micrófono (soporte)
    arc_r = int(size * 0.115)
    arc_y_center = mic_bottom_y - int(size * 0.005)
    arc_thick = int(size * 0.014)
    draw.arc(
        [cx - arc_r, arc_y_center - arc_r // 2,
         cx + arc_r, arc_y_center + arc_r // 2],
        start=0, end=180,
        fill=(200, 170, 255, 230), width=arc_thick
    )
    # línea vertical del soporte
    stand_x = cx
    stand_top_y = arc_y_center + arc_r // 4
    stand_bottom_y = stand_top_y + int(size * 0.06)
    draw.line([stand_x, stand_top_y, stand_x, stand_bottom_y],
              fill=(200, 170, 255, 220), width=arc_thick)
    # base
    base_w = int(size * 0.1)
    draw.rounded_rectangle(
        [stand_x - base_w // 2, stand_bottom_y,
         stand_x + base_w // 2, stand_bottom_y + arc_thick],
        radius=arc_thick // 2,
        fill=(200, 170, 255, 220)
    )

    # ── Ondas de audio (izquierda y derecha del micrófono)
    wave_color = (100, 220, 255, 200)  # cyan
    wave_x_offsets = [int(size * 0.16), int(size * 0.21), int(size * 0.26)]
    for i, offset in enumerate(wave_x_offsets):
        h = int(size * (0.08 + 0.04 * i))
        thick = int(size * (0.012 - 0.002 * i))
        alpha = 200 - i * 40
        c = (100, 220, 255, alpha)
        # onda derecha
        draw.arc([cx + offset - thick * 2, cy - h,
                  cx + offset + thick * 2, cy + h],
                 start=270, end=90, fill=c, width=thick)
        # onda izquierda
        draw.arc([cx - offset - thick * 2, cy - h,
                  cx - offset + thick * 2, cy + h],
                 start=90, end=270, fill=c, width=thick)

    # ── Puntos de IA (línea inferior decorativa)
    dot_y = cy + int(size * 0.34)
    dot_count = 5
    dot_r = int(size * 0.018)
    dot_spacing = int(size * 0.06)
    for i in range(dot_count):
        dx = cx + (i - dot_count // 2) * dot_spacing
        brightness = 1.0 if i == dot_count // 2 else 0.5
        c = (int(140 * brightness), int(100 * brightness), int(255 * brightness), 255)
        draw.ellipse([dx - dot_r, dot_y - dot_r, dx + dot_r, dot_y + dot_r], fill=c)

    return img

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(out_dir, "RoSummary.iconset")
    os.makedirs(icons_dir, exist_ok=True)

    sizes = [16, 32, 64, 128, 256, 512, 1024]

    print("🎨 Generando ícono RoSummary...")
    base = draw_icon(1024)

    for s in sizes:
        img = base.resize((s, s), Image.LANCZOS)
        fname = f"icon_{s}x{s}.png"
        img.save(os.path.join(icons_dir, fname))
        # macOS iconset también necesita @2x para algunos tamaños
        if s <= 512:
            fname2x = f"icon_{s}x{s}@2x.png"
            img2 = base.resize((s * 2, s * 2), Image.LANCZOS)
            img2.save(os.path.join(icons_dir, fname2x))
        print(f"  ✓ {fname}")

    # Guardar PNG de alta resolución también
    png_path = os.path.join(out_dir, "RoSummary.png")
    base.save(png_path)
    print(f"\n✅ PNG guardado: {png_path}")

    # Generar .icns con iconutil (solo macOS)
    icns_path = os.path.join(out_dir, "RoSummary.icns")
    result = os.system(f'iconutil -c icns "{icons_dir}" -o "{icns_path}"')
    if result == 0:
        print(f"✅ ICNS guardado: {icns_path}")
    else:
        print("⚠️  iconutil falló (normal en macOS < Ventura). Usa el PNG directamente.")

    return png_path, icns_path

if __name__ == "__main__":
    main()
