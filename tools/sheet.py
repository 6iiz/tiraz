"""sheet.py · images side by side with a label above each one: for comparing design directions.

  python sheet.py <out.jpg> [--height 640] [--cols N] <label>=<image> ...

Each image is scaled to the height; labels are plain ASCII, written in a strip above their image. After N images the sheet wraps to a new row.
From Python: sheet(out, [(label, path), ...], height=640, cols=None) -> the output path.
"""
import os, sys

def sheet(out, items, height=640, cols=None):
    from PIL import Image, ImageDraw, ImageFont
    if not items: raise ValueError('sheet needs at least one label=image')
    gap, strip, pad = 12, 30, 12
    tiles = []
    for label, path in items:
        if not os.path.isfile(path): raise FileNotFoundError(f'the image for "{label}" does not exist: {path}')
        im = Image.open(path).convert('RGB'); tiles.append((str(label), im.resize((max(1, round(im.width * height / im.height)), height), Image.LANCZOS)))
    cols = max(1, cols or len(tiles)); rows = [tiles[i:i + cols] for i in range(0, len(tiles), cols)]
    widths = [sum(t.width for _, t in r) + gap * (len(r) - 1) for r in rows]
    W = max(widths) + 2 * pad; H = len(rows) * (strip + height) + (len(rows) - 1) * gap + 2 * pad
    sh = Image.new('RGB', (W, H), (24, 24, 24)); d = ImageDraw.Draw(sh); font = ImageFont.load_default()
    y = pad
    for r in rows:
        x = pad
        for label, t in r:
            d.text((x + 4, y + 9), label, fill=(235, 235, 235), font=font); sh.paste(t, (x, y + strip)); x += t.width + gap
        y += strip + height + gap
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True); sh.save(out, quality=90); return out

if __name__ == '__main__':
    av = sys.argv[1:]; h, cols, pos, i = 640, None, [], 0
    while i < len(av):
        if av[i] == '--height' and i + 1 < len(av): h = int(av[i + 1]); i += 2
        elif av[i] == '--cols' and i + 1 < len(av): cols = int(av[i + 1]); i += 2
        else: pos.append(av[i]); i += 1
    if len(pos) < 2 or any('=' not in a for a in pos[1:]): sys.exit(__doc__)
    try: print(sheet(pos[0], [tuple(a.split('=', 1)) for a in pos[1:]], h, cols))
    except (ValueError, FileNotFoundError) as e: sys.exit(str(e))
