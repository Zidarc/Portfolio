"""Builds the hero portrait: square head-and-shoulders crop with the background removed.

Usage (needs `pip install "rembg[cpu]" pillow`, ideally in a virtualenv):
    python scripts/make-portrait.py art/ali-original.jpg public/ali.webp

Tweak CENTER_X / TOP / SIDE if a new photo frames the face differently.
"""

import sys

from PIL import Image, ImageOps
from rembg import new_session, remove

CENTER_X, TOP, SIDE = 1250, 1150, 1800  # crop box in source-image pixels
OUT_SIZE = 800

src, dst = sys.argv[1], sys.argv[2]
image = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
left = max(0, CENTER_X - SIDE // 2)
crop = image.crop((left, TOP, min(image.width, left + SIDE), TOP + SIDE))
crop = crop.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)

cutout = remove(crop, session=new_session("isnet-general-use"))
cutout.save(dst, quality=86, method=6)
print(f"wrote {dst}")
