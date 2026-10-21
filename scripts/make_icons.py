"""Generate BeeYardLog app icons.
Usage:  python make_icons.py [path/to/your-square-image.png]
No argument = simple placeholder (green tile, hexagon, YB).
With an image: it is fitted inside the maskable safe zone (centre 70%) on the green tile,
so nothing gets cropped on Android home screens."""
import sys, math, os
from PIL import Image, ImageDraw, ImageFont
GREEN=(29,158,117,255); CREAM=(250,249,246,255)
OUT=sys.argv[2] if len(sys.argv)>2 else "."
def master(size=1024, src=None):
    im=Image.new("RGBA",(size,size),GREEN)
    if src:
        s=Image.open(src).convert("RGBA"); box=int(size*0.70)
        s.thumbnail((box,box), Image.LANCZOS)
        im.alpha_composite(s,((size-s.width)//2,(size-s.height)//2))
        return im
    d=ImageDraw.Draw(im); c=size/2; r=size*0.30
    pts=[(c+r*math.cos(math.radians(a)), c+r*math.sin(math.radians(a))) for a in range(-90,270,60)]
    d.polygon(pts,outline=CREAM,width=int(size*0.035))
    try: f=ImageFont.truetype("DejaVuSans-Bold.ttf",int(size*0.20))
    except: f=ImageFont.load_default()
    d.text((c,c),"YB",fill=CREAM,font=f,anchor="mm")
    return im
m=master(src=sys.argv[1] if len(sys.argv)>1 and sys.argv[1]!="-" else None)
for name,px in [("icon-512.png",512),("icon-192.png",192),("apple-touch-icon.png",180),("favicon-32.png",32)]:
    m.resize((px,px),Image.LANCZOS).convert("RGB").save(os.path.join(OUT,name))
print("icons written to",os.path.abspath(OUT))
