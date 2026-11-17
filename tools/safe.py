"""safe.py · which of the texts a frame recorded reach outside the safe area.

  python safe.py <boxes.json>          prints one sentence per text that leaves the safe area; exit code 1 when there is any

boxes.json is written by the renderer's --boxes: for each rendered moment, the box of every text drawn through the kit (kit.drawText,
kit.number) and of everything a scene reported with kit.rec, in frame pixels. Text a scene drew by itself and did not report is not in it,
so an empty answer is not proof that nothing is outside: the count of measured texts is returned with it. A box marked "decor" is decoration
(a huge word bleeding off the frame on purpose) and is not held to the safe area.
"""
import json, sys

SAFE = {'top': 270, 'bottom': 1248, 'left': 70, 'right': 1010}      # engine/safe.js: Meta's published Reels safe zone on a 1080x1920 frame
TOL = 2                                                              # pixels of rounding that are not worth a sentence

def outside(by_moment):
    """{name: {'t': seconds, 'boxes': [{x0,x1,y0,y1,text,decor?}]}} -> (sentences, texts measured). A text is named once, at its first moment."""
    said, seen, texts = [], set(), set()
    for name in sorted(by_moment, key=lambda k: by_moment[k].get('t', 0)):
        frame = by_moment[name]; t = frame.get('t', 0)
        for b in frame.get('boxes', []):
            if b.get('decor'): continue
            text = str(b.get('text', '')).strip(); texts.add(text)
            sides = []
            if b['x0'] < SAFE['left'] - TOL: sides.append(('left', f'starts at x {b["x0"]:.0f}, left of the safe area (it begins at {SAFE["left"]})'))
            if b['x1'] > SAFE['right'] + TOL: sides.append(('right', f'reaches x {b["x1"]:.0f}, right of the safe area (it ends at {SAFE["right"]})'))
            if b['y0'] < SAFE['top'] - TOL: sides.append(('top', f'starts at y {b["y0"]:.0f}, above the safe area (it begins at {SAFE["top"]})'))
            if b['y1'] > SAFE['bottom'] + TOL: sides.append(('bottom', f'reaches y {b["y1"]:.0f}, below the safe area (it ends at {SAFE["bottom"]})'))
            for side, how in sides:
                if (text, side) in seen: continue
                seen.add((text, side)); said.append(f'at {t:.2f} s "{text[:40]}" {how}')
    return said, len(texts)

def read(path):
    try: return json.load(open(path, encoding='utf8'))
    except Exception: return None

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf8')
    if len(sys.argv) != 2: sys.exit(__doc__)
    data = read(sys.argv[1])
    if data is None: sys.exit(f'{sys.argv[1]} could not be read: it is the boxes.json that  node engine/render.mjs ... --boxes  writes beside the pictures.')
    said, n = outside(data)
    print(json.dumps({'texts_measured': n, 'outside': said}, ensure_ascii=False, indent=1)); sys.exit(1 if said else 0)
