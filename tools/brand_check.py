"""brand_check.py · is a customer's brand folder usable, and what does it look like?

  python brand_check.py <brand folder>            checks brand.json, the files it names and the brand's look
  python brand_check.py <brand folder> --preview  also renders preview.jpg in that folder, for the customer to approve

A brand folder holds brand.json (identity values only: name, colours, fonts, logo, slogan) and the customer's own files. Inside brand.json a path
starting with /brand/ is a file in that folder; a path starting with /assets/ is a file shipped with the kit. Any ground, light or dark, is valid.
When brand.json has "look": "/brand/look/", the folder look/ must hold look.md, tokens.json, ground.js, motion.js, ending.js, ending.json (with a "duration")
and preview.json. The preview shows look/preview.json at its "stills" moments (or five evenly spaced ones); a brand without a look gets one still
of the kit's identity card. Every problem is listed at once, in plain words. Prints JSON; exit code 1 on problems.
"""
import json, os, re, shutil, subprocess, sys, tempfile
sys.stdout.reconfigure(encoding='utf8')
KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(KIT, 'tools'))
HEX = re.compile(r'^#[0-9a-fA-F]{6}$')
LOOK_FILES = ('look.md', 'tokens.json', 'ground.js', 'motion.js', 'ending.js', 'ending.json', 'preview.json')

def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]; c = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
def contrast(a, b): la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + .05) / (lb + .05)
def shown(r): return f'{int(r * 100) / 100:.2f}'           # a ratio as it is written in a message: two places, never rounded up

def json_file(path, bad, what):
    try:
        with open(path, encoding='utf8') as f: return json.load(f)
    except FileNotFoundError: return None                       # a missing file is reported by the caller
    except Exception as e: bad.append(f'{what} is not valid JSON: {e}'); return None

def check(folder):
    bad, warn = [], []; p = os.path.join(folder, 'brand.json')
    if not os.path.isfile(p): return None, [f'brand.json is not in {folder}'], warn
    try: b = json.load(open(p, encoding='utf8'))
    except Exception as e: return None, [f'brand.json is not valid JSON: {e}'], warn
    if not isinstance(b, dict): return None, ['brand.json must hold one JSON object'], warn
    def local(u):                                             # a path in brand.json -> the file on disk
        if not isinstance(u, str): return None
        if u.startswith('/brand/'): return os.path.join(folder, *u[7:].split('/'))
        if u.startswith('/assets/'): return os.path.join(KIT, *u[1:].split('/'))
        bad.append(f'"{u}" must start with /brand/ (your files) or /assets/ (files shipped with the kit)'); return None
    c = b.get('colors') or {}
    if not isinstance(c, dict): c = {}; bad.append('colors must be an object like { "bg": "#FFFFFF", "text": "#1A1A1A", "accent": "#D6402B" }')
    for k in ('bg', 'text', 'accent'):
        if not c.get(k): bad.append(f'colors.{k} is missing: write it as #RRGGBB')
    for k, v in c.items():
        if c.get(k) and not HEX.match(str(v)): bad.append(f'colors.{k} ({v}) is not a #RRGGBB colour')
    if not b.get('name'): bad.append('name is missing')
    s = b.get('slogan')
    if s is not None and (not isinstance(s, list) or not 1 <= len(s) <= 2 or not all(isinstance(x, str) and x.strip() for x in s)): bad.append('slogan, when given, must be a list of one or two texts')
    if b.get('dir', 'rtl') not in ('rtl', 'ltr'): bad.append('dir must be "rtl" or "ltr"')
    fonts = b.get('fonts') or {}
    if not isinstance(fonts, dict): fonts = {}; bad.append('fonts must be an object with a "display" entry')
    for role in sorted({'display', *fonts}):
        f = fonts.get(role)
        if not f:
            if role == 'display': bad.append('fonts.display needs a family and a file')
            continue
        if not isinstance(f, dict) or not f.get('family') or not f.get('file'): bad.append(f'fonts.{role} needs a family and a file'); continue
        lf = local(f['file'])
        if lf and not os.path.isfile(lf): bad.append(f'fonts.{role}: file not found: {lf}')
    lg = b.get('logo') or {}
    if not isinstance(lg, dict): lg = {}
    if not lg.get('path') and not lg.get('file'): bad.append('logo needs a file (an image or SVG) or a path (SVG path data)')
    for k in ('file', 'mark'):
        if lg.get(k):
            lf = local(lg[k])
            if lf and not os.path.isfile(lf): bad.append(f'logo.{k} not found: {lf}')
    if lg.get('path'):                                        # a one-colour mark as SVG path data: it takes the colour a scene gives it
        if not isinstance(lg['path'], str) or not re.match(r'\s*[Mm]', lg['path']): bad.append('logo.path must be SVG path data (it starts with M), copied from the logo file')
        if 'box' in lg and not (isinstance(lg['box'], (int, float)) and not isinstance(lg['box'], bool) and lg['box'] > 0): bad.append('logo.box must be the size of the square the path was drawn in (the viewBox of its SVG), for example 256')
        if lg.get('rule', 'nonzero') not in ('nonzero', 'evenodd'): bad.append('logo.rule must be "nonzero" or "evenodd" (evenodd when the mark has holes)')
    if all(HEX.match(str(c.get(k, ''))) for k in ('bg', 'text', 'accent')):
        if contrast(c['text'], c['bg']) < 4.5: warn.append(f'text on the ground has contrast {shown(contrast(c["text"], c["bg"]))}:1; under 4.5:1 it reads poorly on a phone')
        ac = contrast(c['accent'], c['bg'])
        if ac < 3.0: warn.append(f'the accent on the ground has contrast {shown(ac)}:1: under 3:1 it cannot be the colour of any text, large or small, in a reel or on a page. Use it as a mark (an underline, a dot, a line) or as a surface with the text colour written on it, and give drawText a `key` colour that reads (the key word takes the accent unless told otherwise).')
        elif ac < 4.5: warn.append(f'the accent on the ground has contrast {shown(ac)}:1: enough for large text (about 66 px and up on the 1080 frame, or 52 px in bold), not for small text, in a reel or on a page (the site check holds small text to 4.5:1). Keep the accent for the big key word and the price; for small things use it as a mark (an underline, a ring, a dot), or give small accent text its own backing.')

    # ---- the look
    look = b.get('look')
    if look is None: warn.append('the brand has no "look" yet: no designed background, ending or scenes (the setup skill designs one, then brand.json gets "look": "/brand/look/")')
    elif look != '/brand/look/': bad.append(f'"look" must be "/brand/look/", not {json.dumps(look, ensure_ascii=False)}')
    else:
        ld = os.path.join(folder, 'look')
        for name in LOOK_FILES:
            if not os.path.isfile(os.path.join(ld, name)): bad.append(f'look/{name} is missing: the look needs it (see ARCHITECTURE.md, "A brand folder")')
        json_file(os.path.join(ld, 'tokens.json'), bad, 'look/tokens.json')
        e = json_file(os.path.join(ld, 'ending.json'), bad, 'look/ending.json')
        if os.path.isfile(os.path.join(ld, 'ending.json')) and e is not None and not (isinstance(e, dict) and isinstance(e.get('duration'), (int, float)) and e['duration'] > 0): bad.append('look/ending.json needs a "duration" in seconds')
        json_file(os.path.join(ld, 'preview.json'), bad, 'look/preview.json')
    return b, bad, warn

def stills_sheet(out, dst, h=960):
    from PIL import Image
    shots = sorted((f for f in os.listdir(out) if f.startswith('at_') and f.endswith('.png')), key=lambda f: float(f[3:-4]))
    if not shots: return False
    w = round(h * 9 / 16); sheet = Image.new('RGB', (w * len(shots), h))
    for i, f in enumerate(shots): sheet.paste(Image.open(os.path.join(out, f)).convert('RGB').resize((w, h), Image.LANCZOS), (w * i, 0))
    sheet.save(dst, quality=90); return True

def preview(folder, b):
    import timeline as TL
    tmp = tempfile.mkdtemp(prefix='tiraz-preview-')
    try:
        render = ['node', os.path.join(KIT, 'engine', 'render.mjs'), '--root', KIT, '--mount', 'brand=' + folder]
        if b.get('look'):
            pv = json.load(open(os.path.join(folder, 'look', 'preview.json'), encoding='utf8'))
            scene = '/engine/scenes/sequence.js' if 'scenes' in pv else pv.get('scene')
            if not isinstance(scene, str) or not scene.startswith('/'): return None, 'look/preview.json needs "scenes" (a sequence) or "scene" (the path of a scene module).'
            stills = pv.get('stills')
            if not (isinstance(stills, list) and stills and all(isinstance(x, (int, float)) for x in stills)):
                total = TL.timeline(pv, folder, folder, KIT, spec_dir=os.path.join(folder, 'look'))['total'] or pv.get('duration')
                if not total: return None, 'look/preview.json has no "stills" and no length to space five stills over: add "stills": [0.5, 2, 4] or give the scenes a "duration".'
                stills = [round(total * k / 6, 2) for k in range(1, 6)]
            page = f'engine/index.html?scene={scene}&brand=/brand/brand.json&spec=/brand/look/preview.json'
            at = ','.join(str(x) for x in stills)
        else:
            page = 'engine/index.html?scene=/engine/scenes/identity-card.js&brand=/brand/brand.json'; at = '0.5'
            if not os.path.isfile(os.path.join(KIT, 'engine', 'index.html')) or not os.path.isfile(os.path.join(KIT, 'engine', 'scenes', 'identity-card.js')): return None, 'the kit has no engine/scenes/identity-card.js yet, so a brand without a look cannot be previewed.'
        r = subprocess.run(render + ['--page', page, '--out', tmp, '--at', at, '--png'], capture_output=True, text=True, encoding='utf8', errors='replace')
        if r.returncode: return None, (r.stderr or r.stdout).strip()[-1500:]
        dst = os.path.join(folder, 'preview.jpg')
        return (dst, None) if stills_sheet(tmp, dst) else (None, 'the render made no stills.')
    finally: shutil.rmtree(tmp, ignore_errors=True)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1: sys.exit(__doc__)
    folder = os.path.abspath(args[0]); b, bad, warn = check(folder); res = {'ok': not bad, 'problems': bad, 'warnings': warn}
    if not bad and '--preview' in sys.argv:
        res['preview'], err = preview(folder, b)
        if err: res['ok'] = False; res['problems'].append('the preview did not render: ' + err); res.pop('preview')
    print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(0 if res['ok'] else 1)
