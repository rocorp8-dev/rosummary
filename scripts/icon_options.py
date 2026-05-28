#!/usr/bin/env python3
"""Dos opciones de ícono RoDicta — usuario elige cuál aplicar."""
import os, math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

NAVY  = (6, 6, 21)
NAVY2 = (16, 10, 45)
NAVY3 = (26, 16, 72)
CYAN  = (0, 200, 220)
CYANB = (0, 230, 255)
WHITE = (255, 255, 255)
SILV  = (200, 215, 230)
SILV2 = (240, 248, 255)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def rounded_bg(SIZE):
    """Fondo navy con esquinas macOS."""
    img  = Image.new("RGBA", (SIZE, SIZE), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    for y in range(SIZE):
        t = y / SIZE
        c = lerp(NAVY, NAVY2, t * 1.2)
        draw.line([(0,y),(SIZE,y)], fill=(*c,255))
    r = int(SIZE * 0.225)
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0,0,SIZE-1,SIZE-1], radius=r, fill=255)
    img.putalpha(mask)
    return img

def add_text(img, SIZE):
    """Agrega RoDicta + lema al fondo del ícono."""
    draw = ImageDraw.Draw(img)
    font_sz = int(SIZE * 0.108)
    sub_sz  = int(SIZE * 0.042)
    font, sub_font = None, None

    for fp in ["/System/Library/Fonts/Supplemental/Arial Black.ttf",
               "/Library/Fonts/Arial Bold.ttf",
               "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_sz)
                sub_font = ImageFont.truetype(fp, sub_sz)
                break
            except: pass

    if not font:
        return img

    cx = SIZE // 2
    text_y = int(SIZE * 0.76)

    # "Ro" blanco
    ro_b = draw.textbbox((0,0), "Ro", font=font)
    ro_w = ro_b[2] - ro_b[0]
    # "D" cyan
    d_b  = draw.textbbox((0,0), "D",  font=font)
    d_w  = d_b[2] - d_b[0]
    # "icta" blanco
    ic_b = draw.textbbox((0,0), "icta", font=font)
    ic_w = ic_b[2] - ic_b[0]

    total_w = ro_w + d_w + ic_w
    tx = cx - total_w // 2

    draw.text((tx,        text_y), "Ro",   font=font, fill=(*WHITE, 255))
    draw.text((tx+ro_w,   text_y), "D",    font=font, fill=(*CYANB, 255))
    draw.text((tx+ro_w+d_w, text_y), "icta", font=font, fill=(*WHITE, 255))

    # Punto cyan sobre D
    dr = int(SIZE * 0.016)
    dx = tx + ro_w + d_w // 2
    dy = text_y - int(SIZE * 0.022)
    draw.ellipse([dx-dr, dy-dr, dx+dr, dy+dr], fill=(*CYANB, 255))

    # Subtexto
    if sub_font:
        sub = "IA que nunca olvida"
        sb  = draw.textbbox((0,0), sub, font=sub_font)
        sw  = sb[2] - sb[0]
        sy  = text_y + font_sz + int(SIZE * 0.01)
        draw.text((cx - sw//2, sy), sub, font=sub_font, fill=(*CYAN, 200))

    return img


# ═══════════════════════════════════════════════════════════════
# OPCIÓN A — Condensador clásico, grande, limpio, sin ondas
# ═══════════════════════════════════════════════════════════════
def make_option_a(SIZE=1024):
    img  = rounded_bg(SIZE)
    draw = ImageDraw.Draw(img)
    cx, cy = SIZE//2, SIZE//2 - int(SIZE*0.06)

    # ── Glow suave detrás del micrófono ──
    for gr, alpha in [(int(SIZE*0.28), 25), (int(SIZE*0.20), 50), (int(SIZE*0.13), 80)]:
        g = Image.new("RGBA", (SIZE,SIZE), (0,0,0,0))
        gd = ImageDraw.Draw(g)
        gd.ellipse([cx-gr, cy-gr, cx+gr, cy+gr], fill=(*CYAN, alpha))
        img = Image.alpha_composite(img, g.filter(ImageFilter.GaussianBlur(int(SIZE*0.05))))
        draw = ImageDraw.Draw(img)

    # ── Cápsula del micrófono (cuerpo principal) ──
    cap_w  = int(SIZE * 0.165)   # ancho
    cap_h  = int(SIZE * 0.325)   # altura total de la cápsula
    cap_rx = cap_w               # radio = ancho → semicircular arriba
    cap_x0 = cx - cap_w
    cap_y0 = cy - int(SIZE * 0.26)
    cap_x1 = cx + cap_w
    cap_y1 = cap_y0 + cap_h

    # Sombra/glow de la cápsula
    for off in range(14, 0, -3):
        a = int(55 * (1 - off/14))
        draw.rounded_rectangle([cap_x0-off, cap_y0-off, cap_x1+off, cap_y1+off],
                                radius=cap_rx+off//2, fill=(*CYAN, a))

    # Fondo metalizado (degradado simulado con capas horizontales)
    for y in range(cap_y0, cap_y1):
        t   = (y - cap_y0) / (cap_y1 - cap_y0)
        col = lerp(SILV2, SILV, t)
        draw.line([(cap_x0+2, y),(cap_x1-2, y)], fill=col)

    # Contorno rounded
    draw.rounded_rectangle([cap_x0, cap_y0, cap_x1, cap_y1],
                            radius=cap_rx, fill=None,
                            outline=(*SILV2, 220), width=int(SIZE*0.007))

    # ── Rejilla (mesh lines) ──
    mesh_top  = cap_y0 + int(cap_h * 0.08)
    mesh_bot  = cap_y0 + int(cap_h * 0.72)
    mesh_n    = 9
    for i in range(mesh_n):
        t  = i / (mesh_n - 1)
        gy = int(mesh_top + t * (mesh_bot - mesh_top))
        margin = int(cap_w * (0.12 + 0.15 * abs(t - 0.5)))
        draw.line([(cap_x0 + margin, gy),(cap_x1 - margin, gy)],
                  fill=(*NAVY3, 180), width=max(1, int(SIZE*0.004)))

    # ── Reflejo lateral (brillo izquierdo) ──
    shine_w = int(cap_w * 0.3)
    for sx in range(cap_x0 + int(cap_w*0.25), cap_x0 + int(cap_w*0.25) + shine_w):
        a = int(130 * (1 - abs(sx - (cap_x0 + cap_w*0.4)) / shine_w))
        draw.line([(sx, cap_y0 + int(cap_h*0.1)),(sx, cap_y0 + int(cap_h*0.65))],
                  fill=(255,255,255, a))

    # ── Anillo cyan (sello de la marca) ──
    ring_y0 = cap_y0 + int(cap_h * 0.72)
    ring_y1 = ring_y0 + int(cap_h * 0.11)
    ring_mid = (ring_y0 + ring_y1) // 2
    draw.rectangle([cap_x0, ring_y0, cap_x1, ring_y1], fill=(*CYAN, 255))
    # brillo en el anillo
    draw.rectangle([cap_x0, ring_y0, cap_x1, ring_y0 + int((ring_y1-ring_y0)*0.4)],
                   fill=(*CYANB, 180))

    # Botón central en el anillo
    btn_r = int(cap_h * 0.045)
    draw.ellipse([cx-btn_r, ring_mid-btn_r, cx+btn_r, ring_mid+btn_r],
                 fill=(*NAVY3, 255), outline=(*WHITE, 120), width=int(SIZE*0.005))

    # ── Base/cuello de la cápsula ──
    neck_w = int(cap_w * 0.25)
    neck_y0 = cap_y1
    neck_y1 = neck_y0 + int(SIZE * 0.045)
    draw.rounded_rectangle([cx-neck_w, neck_y0, cx+neck_w, neck_y1],
                            radius=neck_w//2, fill=(*SILV, 255))

    # ── Soporte (arco + palo + base) ──
    arm_r  = int(cap_w * 1.35)
    arm_cy = neck_y1 + int(SIZE * 0.005)
    arm_t  = int(SIZE * 0.014)
    draw.arc([cx-arm_r, arm_cy - arm_r//2, cx+arm_r, arm_cy + arm_r//2],
             start=0, end=180, fill=(*SILV, 200), width=arm_t)

    pole_t  = arm_t
    pole_y0 = arm_cy + arm_r//4
    pole_y1 = pole_y0 + int(SIZE * 0.045)
    draw.rounded_rectangle([cx-pole_t//2, pole_y0, cx+pole_t//2, pole_y1],
                            radius=pole_t//2, fill=(*SILV, 200))

    base_w = int(cap_w * 1.1)
    base_h = int(SIZE * 0.016)
    draw.ellipse([cx-base_w, pole_y1, cx+base_w, pole_y1+base_h],
                 fill=(*SILV, 180), outline=(*SILV2,120), width=2)

    img = add_text(img, SIZE)
    return img


# ═══════════════════════════════════════════════════════════════
# OPCIÓN B — Micrófono sobre círculo neón, estilo app moderna
# ═══════════════════════════════════════════════════════════════
def make_option_b(SIZE=1024):
    img  = rounded_bg(SIZE)
    draw = ImageDraw.Draw(img)
    cx, cy = SIZE//2, SIZE//2 - int(SIZE*0.055)

    # ── Círculo de fondo con neón ──
    circle_r = int(SIZE * 0.295)
    # Capas de glow
    for gr, a in [(circle_r+60,15),(circle_r+40,28),(circle_r+20,45),(circle_r,80)]:
        g = Image.new("RGBA",(SIZE,SIZE),(0,0,0,0))
        ImageDraw.Draw(g).ellipse([cx-gr,cy-gr,cx+gr,cy+gr], fill=(*CYAN,a))
        img = Image.alpha_composite(img, g.filter(ImageFilter.GaussianBlur(int(SIZE*0.04))))
    draw = ImageDraw.Draw(img)

    # Círculo relleno oscuro
    draw.ellipse([cx-circle_r, cy-circle_r, cx+circle_r, cy+circle_r],
                 fill=(*NAVY3, 240), outline=(*CYAN, 160), width=int(SIZE*0.01))
    # Brillo interno arriba
    shine_r = int(circle_r * 0.92)
    draw.arc([cx-shine_r, cy-shine_r, cx+shine_r, cy+shine_r],
             start=210, end=330, fill=(*CYANB, 70), width=int(SIZE*0.006))

    # ── Micrófono dentro del círculo ──
    mw  = int(SIZE * 0.105)
    mh  = int(SIZE * 0.22)
    mrx = mw
    mt  = cy - int(SIZE * 0.18)
    mb  = mt + mh

    # Cuerpo blanco/plateado
    for step in range(10, 0, -2):
        f = step / 10
        w = int(mw * (0.5 + 0.5*f))
        c = lerp(SILV, SILV2, 1-f)
        draw.rounded_rectangle([cx-w, mt, cx+w, mb], radius=mrx, fill=(*c,255))

    # Bordes y reflejos
    draw.rounded_rectangle([cx-mw, mt, cx+mw, mb], radius=mrx,
                            fill=None, outline=(*WHITE, 150), width=int(SIZE*0.006))

    # Grille lines
    for i in range(6):
        t  = i / 5
        gy = int(mt + int(mh*0.1) + t * int(mh*0.6))
        m  = int(mw * (0.15 + 0.2*abs(t-0.5)))
        draw.line([(cx-mw+m, gy),(cx+mw-m, gy)], fill=(*NAVY2,160), width=max(1,int(SIZE*0.004)))

    # Anillo cyan
    ry0 = mb - int(mh*0.24)
    ry1 = mb - int(mh*0.12)
    draw.rectangle([cx-mw+2, ry0, cx+mw-2, ry1], fill=(*CYAN,255))

    # Arco + soporte
    arm_r2 = int(mw * 1.3)
    arm_cy2 = mb + int(SIZE*0.006)
    arm_t2  = int(SIZE*0.013)
    draw.arc([cx-arm_r2, arm_cy2-arm_r2//2, cx+arm_r2, arm_cy2+arm_r2//2],
             start=0, end=180, fill=(*WHITE,180), width=arm_t2)
    p0 = arm_cy2 + arm_r2//4
    p1 = p0 + int(SIZE*0.035)
    draw.rounded_rectangle([cx-arm_t2//2, p0, cx+arm_t2//2, p1],
                            radius=arm_t2//2, fill=(*WHITE,180))
    bw2 = int(mw*0.95)
    draw.ellipse([cx-bw2, p1-2, cx+bw2, p1+int(SIZE*0.013)], fill=(*WHITE,160))

    img = add_text(img, SIZE)
    return img


# ── Generar ambas ──────────────────────────────────────────────
def main():
    out = os.path.dirname(os.path.abspath(__file__))
    print("Generando opciones de ícono…")

    a = make_option_a(1024)
    b = make_option_b(1024)

    path_a = os.path.join(out, "OPCION_A.png")
    path_b = os.path.join(out, "OPCION_B.png")
    a.save(path_a)
    b.save(path_b)
    print(f"✅ OPCION_A.png — Condensador clásico, limpio, sin ondas")
    print(f"✅ OPCION_B.png — Micrófono sobre círculo neón")

if __name__ == "__main__":
    main()
