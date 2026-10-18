"""Single bold bee. Writes bee-icon.png (bee on a cream hexagon, for the app
icons) and bee-only.png (transparent, for the header)."""
import math, sys
from PIL import Image, ImageDraw

S = 2048
CREAM = (250, 249, 246, 255)
HONEY = (245, 176, 46, 255)
BEE_YEL = (255, 206, 40, 255)
BEE_DARK = (45, 32, 20, 255)
WING = (225, 238, 252, 235)
WING_EDGE = (110, 130, 160, 255)


def draw_bee(img, bx, by, k):
    """Draw a bee centred at (bx, by); k scales everything (1 = 620px body)."""
    bw, bh = int(620 * k), int(400 * k)
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)

    # wings, upright then rotated about the body
    for ang, off in ((-26, -30), (22, 80)):
        wing = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        wd = ImageDraw.Draw(wing)
        ox = int(off * k)
        wd.ellipse([bx - int(80 * k) + ox, by - int(560 * k),
                    bx + int(190 * k) + ox, by - int(50 * k)],
                   fill=WING, outline=WING_EDGE, width=int(12 * k))
        layer.alpha_composite(wing.rotate(ang, center=(bx + ox, by - int(40 * k))))

    # striped body
    body = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.ellipse([bx - bw // 2, by - bh // 2, bx + bw // 2, by + bh // 2], fill=BEE_YEL)
    for sx in (-90, 60, 190):
        x0 = bx + int(sx * k)
        bd.rectangle([x0, by - bh // 2, x0 + int(72 * k), by + bh // 2], fill=BEE_DARK)
    m = Image.new("L", (S, S), 0)
    ImageDraw.Draw(m).ellipse([bx - bw // 2, by - bh // 2, bx + bw // 2, by + bh // 2], fill=255)
    clipped = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    clipped.paste(body, (0, 0), m)
    layer.alpha_composite(clipped)
    ld = ImageDraw.Draw(layer)
    ld.ellipse([bx - bw // 2, by - bh // 2, bx + bw // 2, by + bh // 2],
               outline=BEE_DARK, width=int(18 * k))

    # head, eye, antennae, stinger
    hr = int(150 * k)
    hx, hy = bx - bw // 2 - int(30 * k), by - int(10 * k)
    ld.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=BEE_DARK)
    ld.ellipse([hx - int(70 * k), hy - int(60 * k), hx - int(10 * k), hy], fill=(255, 255, 255, 255))
    ld.ellipse([hx - int(52 * k), hy - int(44 * k), hx - int(24 * k), hy - int(14 * k)], fill=BEE_DARK)
    lw = int(20 * k)
    ld.line([(hx - int(40 * k), hy - hr + 10), (hx - int(150 * k), hy - hr - int(120 * k))], fill=BEE_DARK, width=lw)
    ld.line([(hx + int(30 * k), hy - hr + 5), (hx - int(20 * k), hy - hr - int(140 * k))], fill=BEE_DARK, width=lw)
    for (cx, cy) in ((hx - int(150 * k), hy - hr - int(120 * k)), (hx - int(20 * k), hy - hr - int(140 * k))):
        r = int(30 * k)
        ld.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BEE_DARK)
    sx = bx + bw // 2
    ld.polygon([(sx - 8, by - int(40 * k)), (sx + int(130 * k), by), (sx - 8, by + int(40 * k))], fill=BEE_DARK)
    img.alpha_composite(layer)


# 1) bee on a cream hexagon with a honey rim (for the app icons)
icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(icon)
c, r = S // 2, 900
hexpts = [(c + r * math.cos(math.radians(a)), c + r * math.sin(math.radians(a)))
          for a in range(-90, 270, 60)]
d.polygon(hexpts, fill=CREAM, outline=HONEY, width=40)
draw_bee(icon, c + 20, c + 60, 1.25)
icon.resize((1024, 1024), Image.LANCZOS).save(sys.argv[1])

# 2) bee alone, cropped tight, transparent (for the header)
solo = Image.new("RGBA", (S, S), (0, 0, 0, 0))
draw_bee(solo, S // 2, S // 2 + 120, 1.6)
bbox = solo.getbbox()
solo.crop(bbox).save(sys.argv[2])
print("wrote", sys.argv[1], sys.argv[2])
