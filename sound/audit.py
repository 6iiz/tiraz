"""Draw audit.png: a grid of small waveforms (about 48 files across all kinds) to check the trims by eye.

    python audit.py

Each cell shows the whole file left to right with the same height scale (full scale = cell height),
the file's kind, id, length, peak and measured onset. A good trim has the hit touching the left edge
and no wave still running at the right edge (a clipped tail would show as a wall at the edge).
"""
import os

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw

import pick as P
import soundlib as S

COLS, CW, CH = 6, 320, 120
BG, FG, GRID, TXT = (18, 20, 24), (110, 200, 255), (60, 64, 72), (225, 225, 230)


def choose():
    kinds = list(S.load_json("kinds.json"))
    out = []
    for k in kinds:
        for v in (0, 3):
            out.append(P.pick(k, None, v))
    for k, v in (("riser", 1), ("riser", 2), ("impact", 1), ("impact", 2)):
        out.append(P.pick(k, None, v))
    seen, uniq = set(), []
    for e in out:
        if e["id"] not in seen:
            seen.add(e["id"])
            uniq.append(e)
    return uniq


def cell(e):
    img = Image.new("RGB", (CW, CH), BG)
    d = ImageDraw.Draw(img)
    x, _ = sf.read(os.path.join(S.HERE, e["file"]))
    x = x if x.ndim == 1 else x.mean(axis=1)
    top, bot = 16, CH - 4
    mid = (top + bot) // 2
    half = (bot - top) // 2
    d.line([(0, mid), (CW, mid)], fill=GRID)
    d.line([(0, top), (CW, top)], fill=GRID)
    d.line([(0, bot), (CW, bot)], fill=GRID)
    n = len(x)
    for px in range(CW):
        a, b = int(px * n / CW), max(int((px + 1) * n / CW), int(px * n / CW) + 1)
        seg = x[a:b]
        if len(seg):
            d.line([(px, mid - int(seg.max() * half)), (px, mid - int(seg.min() * half))], fill=FG)
    m = S.measure(os.path.join(S.HERE, e["file"]))
    d.text((3, 2), "%s  %s  %.2fs %.1fdB on %.1fms" % (e["kind"], e["id"].split("/")[-1][:26], m["seconds"], m["peak_db"], m["onset_ms"]), fill=TXT)
    return img


def main():
    es = choose()
    rows = (len(es) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * CW, rows * CH), BG)
    for i, e in enumerate(es):
        sheet.paste(cell(e), ((i % COLS) * CW, (i // COLS) * CH))
    path = os.path.join(S.HERE, "audit.png")
    sheet.save(path)
    print("wrote %s with %d waveforms" % (path, len(es)))


if __name__ == "__main__":
    main()
