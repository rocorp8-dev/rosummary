#!/usr/bin/env python3
"""
RoDicta — Ícono premium v3
Diseño 100% programático: sin imágenes externas, sin fondos blancos.
Estilo: glassmorphism dark + cyan glow, micrófono geométrico, tipografía de marca.
"""
import os, math
from PIL import Image, ImageDraw, ImageFilter

# ── Paleta de marca ──────────────────────────────────────────────
NAVY_DEEP   = (6,   6,  21)
NAVY_MID    = (18,  12, 55)
NAVY_LIGHT  = (26,  16, 72)
CYAN        = (0,  200, 220)
CYAN_BRIGHT = (0,  230, 255)
CYAN_DIM    = (0,  120, 140)
WHITE       = (255, 255, 255)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def draw_icon(SIZE=1024):
    img  = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = SIZE // 2, SIZE // 2

    # ── 1. Fondo degradado navy ──────────────────────────────────
    for y in range(SIZE):
        t = y / SIZE
        c = lerp(NAVY_DEEP, NAVY_MID, t)
        draw.line([(0, y), (SIZE, y)], fill=(*c, 255))

    # ── 2. Esquinas redondeadas (macOS style) ────────────────────
    r = int(SIZE * 0.225)
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, SIZE-1, SIZE-1], radius=r, fill=255)
    img.putalpha(mask)

    # ── 3. Glow radial cyan (capas concéntricas) ─────────────────
    for radius_pct, alpha in [(0.50, 18), (0.38, 35), (0.26, 55), (0.16, 80)]:
        gr = int(SIZE * radius_pct)
        glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        gd   = ImageDraw.Draw(glow)
        gd.ellipse([cx - gr, cy - gr - int(SIZE*0.03),
                    cx + gr, cy + gr - int(SIZE*0.03)],
                   fill=(*CYAN, alpha))
        glow_blur = glow.filter(ImageFilter.GaussianBlur(int(SIZE * 0.07)))
        img = Image.alpha_composite(img, glow_blur)
        draw = ImageDraw.Draw(img)

    # ── 4. Panel central (vidrio oscuro) ─────────────────────────
    pw = int(SIZE * 0.44)
    ph = int(SIZE * 0.52)
    px0 = cx - pw // 2
    py0 = cy - ph // 2 - int(SIZE * 0.04)
    panel = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    pd    = ImageDraw.Draw(panel)
    pd.rounded_rectangle([px0, py0, px0+pw, py0+ph],
                         radius=int(SIZE * 0.06),
                         fill=(*NAVY_LIGHT, 200))
    pd.rounded_rectangle([px0, py0, px0+pw, py0+ph],
                         radius=int(SIZE * 0.06),
                         outline=(*CYAN, 90), width=int(SIZE * 0.008))
    img = Image.alpha_composite(img, panel)
    draw = ImageDraw.Draw(img)

    # ── 5. Micrófono geométrico ───────────────────────────────────
    mic_cx = cx
    mic_cy = cy - int(SIZE * 0.05)

    # Cuerpo principal del micrófono
    mw  = int(SIZE * 0.105)
    mh  = int(SIZE * 0.20)
    mrx = int(SIZE * 0.052)
    mt  = mic_cy - int(SIZE * 0.125)
    mb  = mic_cy + int(SIZE * 0.075)

    # Sombra / glow del cuerpo
    for gw in range(int(mw * 1.8), mw, -4):
        a = int(60 * (1 - gw / (mw * 1.8)) ** 1.5)
        draw.rounded_rectangle(
            [mic_cx - gw, mt - gw // 2, mic_cx + gw, mb + gw // 2],
            radius=int(gw * 0.55), fill=(*CYAN, a))

    # Cuerpo — degradado simulado con capas
    body_steps = 12
    for i in range(body_steps, 0, -1):
        f  = i / body_steps
        bw = int(mw * (0.7 + 0.3 * f))
        c  = lerp((180, 210, 230), (230, 245, 255), 1 - f)
        draw.rounded_rectangle(
            [mic_cx - bw, mt, mic_cx + bw, mb],
            radius=mrx, fill=(*c, 255))

    # Líneas de rejilla (detalles del micrófono)
    grid_color = (*NAVY_MID, 180)
    grid_lines = 5
    for i in range(1, grid_lines):
        gy = mt + int((mb - mt) * i / grid_lines)
        x0 = mic_cx - int(mw * 0.7) + (2 if i % 2 else 0)
        x1 = mic_cx + int(mw * 0.7) - (2 if i % 2 else 0)
        draw.line([(x0, gy), (x1, gy)], fill=grid_color, width=max(1, int(SIZE * 0.004)))

    # Anillo cyan en el centro del micrófono (marca registrada del diseño)
    ring_y = mic_cy - int(SIZE * 0.018)
    ring_t = int(SIZE * 0.018)
    draw.arc([mic_cx - mw, ring_y - ring_t,
              mic_cx + mw, ring_y + ring_t],
             start=0, end=360, fill=(*CYAN_BRIGHT, 240), width=ring_t)

    # Punto de control (botón central)
    dot_r = int(SIZE * 0.022)
    draw.ellipse([mic_cx - dot_r, mic_cy - dot_r,
                  mic_cx + dot_r, mic_cy + dot_r],
                 fill=(*NAVY_MID, 255), outline=(*CYAN, 200), width=int(SIZE*0.006))

    # ── 6. Soporte del micrófono ─────────────────────────────────
    arm_r   = int(SIZE * 0.14)
    arm_t   = int(SIZE * 0.016)
    arm_cy  = mb + int(SIZE * 0.008)

    # Arco
    draw.arc([mic_cx - arm_r, arm_cy - arm_r // 2,
              mic_cx + arm_r, arm_cy + arm_r // 2],
             start=0, end=180, fill=(*CYAN, 210), width=arm_t)

    # Palo vertical
    stand_t = arm_t
    stand_y0 = arm_cy + arm_r // 4
    stand_y1 = stand_y0 + int(SIZE * 0.065)
    draw.rounded_rectangle(
        [mic_cx - stand_t // 2, stand_y0,
         mic_cx + stand_t // 2, stand_y1],
        radius=stand_t // 2, fill=(*CYAN, 210))

    # Base
    base_w = int(SIZE * 0.115)
    base_h = int(SIZE * 0.018)
    draw.rounded_rectangle(
        [mic_cx - base_w // 2, stand_y1,
         mic_cx + base_w // 2, stand_y1 + base_h],
        radius=base_h // 2, fill=(*CYAN, 190))

    # ── 7. Ondas sonoras (izquierda y derecha) ───────────────────
    for side in (-1, 1):
        for i, (off, h_pct, alpha) in enumerate([(0.19, 0.12, 180), (0.25, 0.18, 130), (0.31, 0.23, 80)]):
            ox  = mic_cx + side * int(SIZE * off)
            oh  = int(SIZE * h_pct)
            ot  = max(2, int(SIZE * 0.013 - i * 2))
            # arco exterior = 270→90 para lado derecho, 90→270 para lado izquierdo
            start_a = 270 if side == 1 else 90
            end_a   = 90  if side == 1 else 270
            draw.arc([ox - ot*2, mic_cy - oh, ox + ot*2, mic_cy + oh],
                     start=start_a, end=end_a, fill=(*CYAN, alpha), width=ot)

    # ── 8. Texto "RoDicta" ───────────────────────────────────────
    # Usamos PIL Draw.text con fuente por defecto (sin dependencias externas)
    # Simulamos el estilo con letras grandes y el punto cyan sobre la "D"
    text_y  = stand_y1 + base_h + int(SIZE * 0.038)
    font_sz = int(SIZE * 0.115)

    # Intentar cargar fuente del sistema
    font = None
    for font_path in [
        "/System/Library/Fonts/Supplemental/Arial Black.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]:
        if os.path.exists(font_path):
            try:
                from PIL import ImageFont
                font = ImageFont.truetype(font_path, font_sz)
                break
            except Exception:
                continue

    if font:
        from PIL import ImageFont
        # Medir texto completo
        text   = "RoDicta"
        bbox   = draw.textbbox((0, 0), text, font=font)
        tw     = bbox[2] - bbox[0]
        tx     = cx - tw // 2

        # "Ro" en blanco
        ro_bbox = draw.textbbox((0, 0), "Ro", font=font)
        ro_w = ro_bbox[2] - ro_bbox[0]
        draw.text((tx, text_y), "Ro", font=font, fill=(*WHITE, 255))

        # "D" en cyan
        d_bbox = draw.textbbox((0, 0), "D", font=font)
        d_w = d_bbox[2] - d_bbox[0]
        draw.text((tx + ro_w, text_y), "D", font=font, fill=(*CYAN_BRIGHT, 255))

        # "icta" en blanco
        draw.text((tx + ro_w + d_w, text_y), "icta", font=font, fill=(*WHITE, 255))

        # Punto cyan sobre la D
        dot_r2 = int(SIZE * 0.018)
        dot_x  = tx + ro_w + d_w // 2
        dot_y  = text_y - int(SIZE * 0.025)
        draw.ellipse([dot_x - dot_r2, dot_y - dot_r2,
                      dot_x + dot_r2, dot_y + dot_r2],
                     fill=(*CYAN_BRIGHT, 255))

        # Subtexto "IA que nunca olvida"
        sub_sz = int(SIZE * 0.045)
        sub_font = ImageFont.truetype(
            [f for f in ["/System/Library/Fonts/Supplemental/Arial.ttf",
                         "/System/Library/Fonts/Helvetica.ttc"] if os.path.exists(f)][0],
            sub_sz) if any(os.path.exists(f) for f in ["/System/Library/Fonts/Supplemental/Arial.ttf",
                                                         "/System/Library/Fonts/Helvetica.ttc"]) else None
        if sub_font:
            sub_text = "IA que nunca olvida"
            sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
            sub_w    = sub_bbox[2] - sub_bbox[0]
            sub_y    = text_y + font_sz + int(SIZE * 0.012)
            draw.text((cx - sub_w // 2, sub_y), sub_text, font=sub_font, fill=(*CYAN, 210))
    else:
        # Fallback sin fuente: bloques de color
        bh = int(SIZE * 0.07)
        bw = int(SIZE * 0.5)
        draw.rounded_rectangle([cx - bw//2, text_y, cx + bw//2, text_y + bh],
                                radius=bh//3, fill=(*CYAN, 180))

    return img


def main():
    out_dir    = os.path.dirname(os.path.abspath(__file__))
    iconset    = os.path.join(out_dir, "RoDicta_v3.iconset")
    os.makedirs(iconset, exist_ok=True)

    print("🎨 Generando ícono RoDicta v3 (premium)…")
    base = draw_icon(1024)

    for s in [16, 32, 64, 128, 256, 512, 1024]:
        resized = base.resize((s, s), Image.LANCZOS)
        resized.save(os.path.join(iconset, f"icon_{s}x{s}.png"))
        if s <= 512:
            base.resize((s*2, s*2), Image.LANCZOS).save(
                os.path.join(iconset, f"icon_{s}x{s}@2x.png"))
        print(f"  ✓ {s}px")

    png_out  = os.path.join(out_dir, "RoDicta_v3.png")
    icns_out = os.path.join(out_dir, "RoDicta_v3.icns")
    base.save(png_out)
    print(f"✅ PNG: {png_out}")

    if os.system(f'iconutil -c icns "{iconset}" -o "{icns_out}"') == 0:
        print(f"✅ ICNS: {icns_out}")

    return png_out, icns_out

if __name__ == "__main__":
    main()
