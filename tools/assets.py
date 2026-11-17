#!/usr/bin/env python3
"""assets.py - find, inspect and render the icons and emoji of Tiraz, and add more sets or fonts.

  python tools/assets.py find "<words>" [--set tabler] [--kind icon|emoji] [--limit 12]    English or Arabic
  python tools/assets.py info <id>                  e.g. tabler:shopping-cart
  python tools/assets.py svg <id> [--color #hex] [--out file.svg]
  python tools/assets.py sheet <ids...> --out sheet.png [--brand brand.json]
  python tools/assets.py fonts                      list the font families and the path to write in brand.json
  python tools/assets.py fonts --sheet out.png --families "A,B,C" [--text "a line"] [--weight 800] [--colors "#ground,#text,#accent"]   see up to six of them
  python tools/assets.py webfont <font.ttf> [more ...] [--out <folder>]   the same font as WOFF2, for a site: smaller, nothing else changed
  python tools/assets.py add <set> --from <folder>  copy an Iconify JSON set (icons.json + info.json) into assets/icons/
  python tools/assets.py add-fonts --from <folder> [--skip dir,dir]   copy Google Fonts style folders (TTF + OFL.txt) into assets/fonts/
  python tools/assets.py reindex                    rebuild index.json, sets.json, fonts/index.json and LICENSES.md from what is on disk

Standard library only, plus fontTools for the font commands (and brotli for webfont). Every message that ends a command is a plain sentence.
"""
import argparse, json, re, shutil, subprocess, sys, tempfile, unicodedata
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent
ICONS = KIT / 'assets' / 'icons'
FONTS = KIT / 'assets' / 'fonts'
LICENSES = KIT / 'assets' / 'LICENSES.md'
# Same list as ARCHITECTURE.md rule 4: only these may be bundled.
PERMISSIVE = {'MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'Zlib', 'Unlicense', 'CC0-1.0', '0BSD', 'OFL-1.1'}
VARIANT_WORDS = {'thin', 'light', 'bold', 'fill', 'duotone', 'rounded', 'sharp', 'outline', 'filled'}

for stream in (sys.stdout, sys.stderr):
    try: stream.reconfigure(encoding='utf-8')
    except Exception: pass


def die(msg):
    print('assets: ' + msg, file=sys.stderr)
    sys.exit(1)


def read_json(path, what):
    try: return json.loads(Path(path).read_text(encoding='utf-8'))
    except FileNotFoundError: die(f'{what} was not found at {path}.')
    except json.JSONDecodeError as e: die(f'{what} at {path} is not valid JSON ({e.msg}, line {e.lineno}).')


# ---------------------------------------------------------------- Arabic -> English search terms
def norm_ar(s):
    """Fold the spellings people mix: diacritics and tatweel go, alef forms become ا, ى becomes ي, ة becomes ه."""
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    s = s.replace('ـ', '')
    for a in 'أإآٱ': s = s.replace(a, 'ا')
    return s.replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي').strip()


def load_ar():
    path = ICONS / 'ar-keywords.json'
    raw = read_json(path, 'The Arabic keyword file') if path.exists() else {}
    return {norm_ar(k): v.split() if isinstance(v, str) else list(v) for k, v in raw.items() if not k.startswith('_')}


ARABIC = re.compile('[؀-ۿ]')
STOP = {'في', 'من', 'على', 'الى', 'عن', 'مع', 'و', 'او'}


def ar_terms(word, table):
    w = norm_ar(word)
    for cand in (w, w[2:] if w.startswith('ال') and len(w) > 3 else None,
                 w[1:] if w.startswith('و') and len(w) > 3 else None, w[:-2] if w.endswith('ات') and len(w) > 4 else None):
        if cand and cand in table: return table[cand]
    return None


def query_groups(text):
    """A query becomes a list of groups; an icon must match every group, through any one of the group's alternatives."""
    groups, unknown = [], []
    words, table, k = text.split(), load_ar(), 0
    while k < len(words):
        word = words[k]; k += 1
        if ARABIC.search(word):
            if norm_ar(word) in STOP: continue
            if k < len(words) and ARABIC.search(words[k]) and norm_ar(word) + '-' + norm_ar(words[k]) in table:   # a two-word phrase such as رسم بياني
                word = word + '-' + words[k]; k += 1
            terms = ar_terms(word, table)
            if terms: groups.append([t.lower() for t in terms])
            else: unknown.append(word)
        else:
            w = word.lower().strip(',.;')
            if w: groups.append([w])
    return groups, unknown


# ---------------------------------------------------------------- the store
def sets_list():
    p = ICONS / 'sets.json'
    return read_json(p, 'The icon set list') if p.exists() else []


def set_info(set_id):
    for s in sets_list():
        if s['id'] == set_id: return s
    names = ', '.join(s['id'] for s in sets_list()) or 'none'
    die(f'There is no icon set called "{set_id}" in this kit. Sets here: {names}.')


_cache = {}


def set_data(set_id):
    if set_id not in _cache:
        set_info(set_id)
        _cache[set_id] = read_json(ICONS / set_id / 'icons.json', f'The {set_id} icons')
    return _cache[set_id]


def resolve(id_):
    """Return (set, name, icon dict with body/width/height/left/top and the flip or rotate of an alias applied)."""
    if ':' not in id_: die(f'"{id_}" is not an asset id. An id looks like tabler:shopping-cart (set, colon, name). Use "find" to search.')
    sid, name = id_.split(':', 1)
    data = set_data(sid)
    icons, aliases = data['icons'], data.get('aliases', {})
    flips = {'hFlip': False, 'vFlip': False, 'rotate': 0}
    seen = 0
    while name not in icons and name in aliases and seen < 8:
        a = aliases[name]; seen += 1
        flips['hFlip'] ^= bool(a.get('hFlip')); flips['vFlip'] ^= bool(a.get('vFlip')); flips['rotate'] = (flips['rotate'] + a.get('rotate', 0)) % 4
        name = a['parent']
    if name not in icons: die(f'There is no icon "{id_.split(":", 1)[1]}" in {sid}. Try: python tools/assets.py find "{id_.split(":", 1)[1].replace("-", " ")}" --set {sid}')
    ic = dict(icons[name])
    ic.setdefault('width', data.get('width', 24)); ic.setdefault('height', data.get('height', 24))
    ic.setdefault('left', 0); ic.setdefault('top', 0)
    if flips['hFlip'] or flips['vFlip'] or flips['rotate']:   # same wrapper as engine/assets.js
        cx, cy = ic['left'] + ic['width'] / 2, ic['top'] + ic['height'] / 2
        t = f'translate({cx} {cy})' + (f' rotate({flips["rotate"] * 90})' if flips['rotate'] else '') \
            + (f' scale({-1 if flips["hFlip"] else 1} {-1 if flips["vFlip"] else 1})' if flips['hFlip'] or flips['vFlip'] else '') + f' translate({-cx} {-cy})'
        ic['body'] = f'<g transform="{t}">{ic["body"]}</g>'
        if flips['rotate'] % 2: ic['width'], ic['height'] = ic['height'], ic['width']
    return sid, name, ic


def build_svg(ic, color=None):
    body = ic['body'].replace('currentColor', color) if color else ic['body']
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{ic["left"]} {ic["top"]} {ic["width"]} {ic["height"]}" '
            f'width="{ic["width"]}" height="{ic["height"]}">{body}</svg>')


# ---------------------------------------------------------------- find
def load_index():
    p = ICONS / 'index.json'
    if not p.exists(): die('The icon index is missing. Run: python tools/assets.py reindex')
    return read_json(p, 'The icon index')['entries']


def score_entry(groups, name, parts, extras):
    total = 0
    for alts in groups:
        best = 0
        for pos, a in enumerate(alts):
            if a == name: s = 100
            elif '-' in a and a in name: s = 70 if re.search(r'(^|-)' + re.escape(a) + r'(-|$)', name) else 45
            elif a in parts: s = 60
            elif len(a) >= 3 and any(p.startswith(a) for p in parts): s = 35
            elif a in extras: s = 25
            elif len(a) >= 3 and a in name: s = 20
            elif len(a) >= 3 and any(e.startswith(a) for e in extras): s = 12
            else: s = 0
            if s: s += max(0, 8 - 2 * pos)      # the first alternative of an Arabic word is the one that fits best
            best = max(best, s)
        if best == 0: return 0, False
        total += best
    return total, True


def cmd_find(a):
    groups, unknown = query_groups(a.words)
    if unknown and not groups:
        die('I do not know the Arabic word ' + ' and '.join(f'«{w}»' for w in unknown) + ' yet. Try the English word, or a close Arabic word such as سلة or جوال.')
    if unknown: print('assets: skipped ' + ' and '.join(f'«{w}»' for w in unknown) + ' (not in the Arabic keyword list).', file=sys.stderr)
    if not groups: die('Give some words to search for, for example: find "shopping cart".')
    if ARABIC.search(a.words): print('assets: searched as ' + ' | '.join('/'.join(g) for g in groups), file=sys.stderr)
    kinds = {s['id']: s['kind'] for s in sets_list()}
    if a.set and a.set not in kinds: set_info(a.set)
    results = []
    for entry in load_index():
        id_ = entry[0]; sid, name = id_.split(':', 1)
        if a.set and sid != a.set: continue
        if a.kind and kinds.get(sid) != a.kind: continue
        parts = name.split('-'); extras = entry[1].split() if len(entry) > 1 else []
        s, _ = score_entry(groups, name, parts, extras)
        if s: results.append((-(s - 1.5 * len(parts) - (6 if any(p in VARIANT_WORDS for p in parts) else 0)), len(name), id_))
    if not results: die(f'Nothing matched "{a.words}". Try fewer or simpler words, for example one noun.')
    results.sort()
    for _, _, id_ in results[:a.limit]: print(id_)


# ---------------------------------------------------------------- info, svg
def kind_style(sid):
    s = set_info(sid); return s['kind'], s['style']


def plain_paths(body):
    """The outline path data when the icon is nothing but <path> elements (what a scene can trace), else None."""
    tags = re.findall(r'<\s*([a-zA-Z]+)', body)
    if not tags or any(t != 'path' for t in tags): return None
    return re.findall(r'\sd="([^"]+)"', body)


def cmd_info(a):
    sid, name, ic = resolve(a.id)
    s = set_info(sid); paths = plain_paths(ic['body'])
    print(f'id:        {sid}:{name}' + ('' if a.id == f'{sid}:{name}' else f'   (alias {a.id})'))
    print(f'set:       {s["name"]} ({s["kind"]}, {s["style"]})')
    print(f'licence:   {s["license"]}  {s["licenseUrl"]}')
    print(f'author:    {s["author"]}')
    print(f'size:      {ic["width"]} x {ic["height"]} units, {len(ic["body"])} bytes of SVG')
    print(f'traceable: ' + (f'yes, {len(paths)} plain path(s)' if paths else 'no (has shapes other than paths, or is empty)'))
    extra = next((e[1] for e in load_index() if e[0] == f'{sid}:{name}' and len(e) > 1), '')
    if extra: print(f'also known as: {extra}')


def cmd_svg(a):
    sid, name, ic = resolve(a.id)
    if a.color and not re.fullmatch(r'#[0-9a-fA-F]{3,8}', a.color): die(f'The colour "{a.color}" is not a hex colour such as #E8A23B.')
    svg = build_svg(ic, a.color)
    if a.out:
        Path(a.out).write_text(svg, encoding='utf-8'); print(f'Wrote {a.out} ({len(svg)} bytes).')
    else: print(svg)


# ---------------------------------------------------------------- sheet (through the engine)
def render_url_args(brand_arg):
    """The brand file is served from its own path when it is inside the kit, else its folder is mounted as /brand/. With no brand, the neutral tool brand is used."""
    if brand_arg:
        b = Path(brand_arg).resolve()
        if not b.exists(): die(f'The brand file {brand_arg} was not found.')
    else:
        b = Path.cwd() / 'brand.json'
        if not b.exists(): b = KIT / 'engine' / 'tool-brand.json'
        if not b.exists(): die('No brand to draw with. Pass --brand <path to brand.json>.')
    try: return '/' + b.relative_to(KIT).as_posix(), []
    except ValueError: return '/brand/' + b.name, ['--mount', f'brand={b.parent}']


def run_render(page, out_dir, mounts):
    node = shutil.which('node')
    if not node: die('Node.js was not found. The sheet is drawn by the engine, which needs Node. Install it from nodejs.org.')
    cmd = [node, 'engine/render.mjs', '--root', '.', '--page', page, '--out', str(out_dir), '--at', '0', '--png', *mounts]
    r = subprocess.run(cmd, cwd=KIT, capture_output=True, text=True, encoding='utf-8')
    return r


def cmd_sheet(a):
    if not a.ids: die('Give at least one id, for example: sheet tabler:heart fluent-emoji-flat:fire --out sheet.png')
    if len(a.ids) > 120: die('A sheet holds at most 120 icons. Split the list in two.')
    for i in a.ids: resolve(i)           # every unknown id is named before a browser starts
    brand_url, mounts = render_url_args(a.brand)
    from urllib.parse import quote
    page = f'engine/index.html?scene=/engine/scenes/assets-sheet.js&brand={quote(brand_url)}&ids={quote(",".join(a.ids), safe=",:")}'
    with tempfile.TemporaryDirectory() as tmp:
        r = run_render(page, tmp, mounts)
        if r.returncode: die('The sheet could not be drawn.\n' + (r.stderr or r.stdout).strip())
        shots = sorted(Path(tmp).glob('*.png'))
        if not shots: die('The renderer finished but wrote no picture.')
        out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(shots[0], out)
    print(f'Wrote {out} with {len(a.ids)} assets.')


# ---------------------------------------------------------------- add / reindex (icons)
# ARCHITECTURE.md: brand logos and product marks of other companies never go in the store. The packs contain some, so `add` drops them.
# The generic words are company names that are never also an everyday word; the per-set rules cover each pack's own naming.
BRAND_WORDS = set('''facebook instagram twitter tiktok youtube whatsapp telegram snapchat linkedin pinterest reddit discord slack github gitlab bitbucket paypal visa
mastercard stripe amazon netflix spotify microsoft chrome chromium firefox safari figma dropbox twitch skype vimeo tumblr wordpress shopify uber airbnb behance dribbble
codepen codesandbox trello playstation xbox nintendo wechat gmail google android framer'''.split())
LUCIDE_BRANDS = {'apple', 'pocket'}
TABLER_BRAND_FIRST = {'apple', 'playstation', 'xbox', 'steam', 'lego', 'yarn'}
MATERIAL_BRAND_FIRST = {'android', 'bitbucket', 'gitlab', 'gmail', 'google', 'youtube', 'chrome', 'php'}


def is_brand(set_id, name):
    parts = name.split('-')
    if any(p in BRAND_WORDS for p in parts): return True
    if set_id == 'tabler': return parts[0] == 'brand' or parts[0] in TABLER_BRAND_FIRST or name.startswith('device-nintendo')
    if set_id == 'ph': return 'logo' in parts
    if set_id == 'lucide': return name in LUCIDE_BRANDS
    if set_id == 'material-symbols': return parts[0] in MATERIAL_BRAND_FIRST or name == 'ios'
    return False


def detect_style(icons, palette):
    if palette: return 'colour'
    sample = list(icons.values())[:300]
    return 'stroke' if sum('stroke="currentColor"' in v['body'] for v in sample) > len(sample) / 2 else 'fill'


def cmd_add(a):
    src = Path(a.src)
    for f in ('icons.json', 'info.json'):
        if not (src / f).exists(): die(f'The folder {src} has no {f}. Point --from at an Iconify JSON package folder (for example the one that holds icons.json and info.json).')
    info = read_json(src / 'info.json', 'info.json')
    if info.get('prefix') != a.set: die(f'That folder is the set "{info.get("prefix")}", not "{a.set}". Use: add {info.get("prefix")} --from {src}')
    spdx = (info.get('license') or {}).get('spdx', '')
    if spdx not in PERMISSIVE:
        die(f'{info.get("name", a.set)} is under the licence "{spdx or "unknown"}", which the kit may not bundle (allowed: {", ".join(sorted(PERMISSIVE))}). Nothing was copied.')
    data = read_json(src / 'icons.json', 'icons.json')
    gone = {n for n in data['icons'] if is_brand(a.set, n)}
    data['icons'] = {n: v for n, v in data['icons'].items() if n not in gone}
    data['aliases'] = {n: v for n, v in data.get('aliases', {}).items() if not is_brand(a.set, n) and v['parent'] not in gone}
    dest = ICONS / a.set; dest.mkdir(parents=True, exist_ok=True)
    (dest / 'icons.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    shutil.copyfile(src / 'info.json', dest / 'info.json')
    if (src / 'metadata.json').exists(): shutil.copyfile(src / 'metadata.json', dest / 'metadata.json')
    pkg = read_json(src / 'package.json', 'package.json') if (src / 'package.json').exists() else {}
    (dest / 'source.json').write_text(json.dumps({'package': pkg.get('name'), 'version': pkg.get('version'), 'homepage': pkg.get('homepage'), 'excludedBrandMarks': len(gone)}, indent=1), encoding='utf-8')
    print(f'Copied {a.set}: {len(data["icons"])} icons' + (f' ({len(gone)} company logos left out).' if gone else '.'))
    reindex_icons()


def reindex_icons():
    sets, entries = [], []
    for d in sorted(p for p in ICONS.iterdir() if (p / 'icons.json').exists()):
        info = read_json(d / 'info.json', 'info.json'); data = read_json(d / 'icons.json', 'icons.json')
        src = read_json(d / 'source.json', 'source.json') if (d / 'source.json').exists() else {}
        meta = read_json(d / 'metadata.json', 'metadata.json') if (d / 'metadata.json').exists() else {}
        palette = bool(info.get('palette')) or 'emoji' in (info.get('category') or '').lower()
        author = info.get('author', {}); lic = info.get('license', {})
        sets.append({'id': d.name, 'name': info.get('name', d.name), 'author': author.get('name', ''), 'authorUrl': author.get('url', ''),
                     'license': lic.get('spdx', ''), 'licenseUrl': lic.get('url', ''), 'package': src.get('package'), 'version': src.get('version'),
                     'upstreamVersion': info.get('version'), 'count': len(data['icons']), 'aliases': len(data.get('aliases', {})),
                     'excludedBrandMarks': src.get('excludedBrandMarks', 0), 'kind': 'emoji' if palette else 'icon', 'style': detect_style(data['icons'], palette), 'height': data.get('height', 24)})
        extras = {}
        for alias, a in data.get('aliases', {}).items(): extras.setdefault(a['parent'], set()).update(alias.split('-'))
        for cat, names in (meta.get('categories') or {}).items():
            for n in names:
                if n in data['icons']: extras.setdefault(n, set()).update(re.split(r'[\s\-_/&,]+', cat.lower()))
        for name in data['icons']:
            own = set(name.split('-'))
            toks = sorted(t for t in extras.get(name, ()) if t and t not in own and not t.isdigit())
            entries.append([f'{d.name}:{name}', ' '.join(toks)] if toks else [f'{d.name}:{name}'])
    (ICONS / 'sets.json').write_text(json.dumps(sets, ensure_ascii=False, indent=1), encoding='utf-8')
    lines = ',\n'.join(json.dumps(e, ensure_ascii=False, separators=(',', ':')) for e in entries)
    (ICONS / 'index.json').write_text('{"version":1,"entries":[\n' + lines + '\n]}\n', encoding='utf-8')
    print(f'Index: {len(entries)} assets in {len(sets)} sets.')
    write_licenses()


# ---------------------------------------------------------------- fonts
FAMILY_CATEGORY = {
    'Cairo': 'sans', 'Tajawal': 'sans', 'Almarai': 'sans', 'IBM Plex Sans Arabic': 'sans', 'Noto Sans Arabic': 'sans', 'Readex Pro': 'sans',
    'Alexandria': 'sans', 'Beiruti': 'sans', 'Changa': 'sans', 'Vazirmatn': 'sans', 'Fustat': 'sans', 'Zain': 'sans', 'Rubik': 'sans', 'Alan Sans': 'sans',
    'Reem Kufi': 'kufi', 'Noto Kufi Arabic': 'kufi', 'Kufam': 'kufi',
    'Lalezar': 'display', 'Qahiri': 'display', 'Baloo Bhaijaan 2': 'display', 'Marhey': 'display', 'Lemonada': 'display', 'Blaka': 'display',
    'Rakkas': 'display', 'Jomhuria': 'display', 'El Messiri': 'display',
    'Playpen Sans Arabic': 'hand', 'Handjet': 'pixel',
    'Amiri': 'naskh', 'Noto Naskh Arabic': 'naskh', 'Markazi Text': 'naskh', 'Aref Ruqaa': 'ruqaa', 'JetBrains Mono': 'mono',
}
SAMPLE = 'أَبجد هوَّز حُطّي · 123 · Tiraz'
GF_SLUG = {'JetBrains Mono': 'jetbrainsmono'}


def font_facts(path):
    from fontTools.ttLib import TTFont
    f = TTFont(str(path), lazy=True)
    cmap = f.getBestCmap() or {}
    wght = None
    if 'fvar' in f:
        for ax in f['fvar'].axes:
            if ax.axisTag == 'wght': wght = [round(ax.minValue), round(ax.maxValue)]
    italic = bool(f['OS/2'].fsSelection & 1) or bool(getattr(f['post'], 'italicAngle', 0))
    return {'weight': wght or [f['OS/2'].usWeightClass, f['OS/2'].usWeightClass], 'variable': wght is not None, 'italic': italic,
            'arabic': all(c in cmap for c in (0x0627, 0x0628, 0x0645, 0x0646)), 'latin': all(c in cmap for c in (*range(0x41, 0x5B), *range(0x61, 0x7B))),
            'family': f['name'].getDebugName(16) or f['name'].getDebugName(1)}


def reindex_fonts():
    fams = []
    for d in sorted(p for p in FONTS.iterdir() if p.is_dir()):
        ttfs = sorted(d.glob('*.ttf'))
        if not ttfs: continue
        facts = [(t, font_facts(t)) for t in ttfs]
        family = d.name          # folders are named by the family, as ARCHITECTURE.md lays out
        lo = min(x['weight'][0] for _, x in facts); hi = max(x['weight'][1] for _, x in facts)
        fams.append({'family': family, 'folder': d.name, 'files': [{'file': t.name, 'weight': x['weight'], 'style': 'italic' if x['italic'] else 'normal'} for t, x in facts],
                     'variable': any(x['variable'] for _, x in facts), 'weightRange': [lo, hi], 'arabic': all(x['arabic'] for _, x in facts),
                     'latin': all(x['latin'] for _, x in facts), 'category': FAMILY_CATEGORY.get(family, 'sans'), 'sample': SAMPLE,
                     'license': 'OFL-1.1', 'hasOFL': (d / 'OFL.txt').exists()})
    fams.sort(key=lambda f: (f['category'], f['family']))
    (FONTS / 'index.json').write_text(json.dumps({'version': 1, 'sample': SAMPLE, 'families': fams}, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'Font index: {len(fams)} families.')
    write_licenses()
    return fams


def cmd_add_fonts(a):
    src = Path(a.src)
    manifest = read_json(src / 'manifest.json', 'The font manifest')
    skip = set(filter(None, (a.skip or '').split(',')))
    added, skipped = [], []
    for e in manifest:
        if e['dir'] in skip: skipped.append((e['family'], 'left out on request')); continue
        if e.get('license') != 'OFL' or not e.get('ofl_file') or not (src / e['dir'] / 'OFL.txt').exists():
            skipped.append((e['family'], 'its licence is not OFL or OFL.txt is missing')); continue
        dest = FONTS / e['family']
        if dest.exists(): skipped.append((e['family'], 'a folder of that name already exists, left unchanged')); continue
        dest.mkdir(parents=True)
        for t in e['ttf']: shutil.copyfile(src / e['dir'] / t, dest / t)
        shutil.copyfile(src / e['dir'] / 'OFL.txt', dest / 'OFL.txt')
        (dest / 'SOURCE.md').write_text(f'# {e["family"]}\nSource: https://github.com/google/fonts/tree/main/ofl/{e["dir"]}\nLicence: SIL Open Font License 1.1 (OFL.txt)\n', encoding='utf-8')
        added.append(e['family'])
    print(f'Added {len(added)} families: ' + ', '.join(added))
    for f, why in skipped: print(f'Skipped {f}: {why}.')
    reindex_fonts()


# ---------------------------------------------------------------- LICENSES.md
def section(name, body):
    return f'<!-- {name}:start -->\n{body.rstrip()}\n<!-- {name}:end -->'


def write_licenses():
    old = LICENSES.read_text(encoding='utf-8') if LICENSES.exists() else ''
    parts = {}
    for name in ('icons', 'fonts'):
        m = re.search(rf'<!-- {name}:start -->.*?<!-- {name}:end -->', old, re.S)
        parts[name] = m.group(0) if m else None
    if (ICONS / 'sets.json').exists():
        rows = ['## Icons and emoji', '',
                'Everything under `assets/icons/<set>/` is a copy of an Iconify JSON package with two changes: whitespace is removed from `icons.json`, and icons that are company logos or product marks are left out (counted below). '
                'The drawings themselves are not edited. Licence text of each set: the URL below, taken from the set\'s own `info.json`.', '']
        for s in sets_list():
            rows += [f'### {s["name"]} (`{s["id"]}`)',
                     f'- Source: npm package `{s.get("package") or "?"}` {s.get("version") or ""}' + (f', upstream version {s["upstreamVersion"]}' if s.get('upstreamVersion') else ''),
                     f'- Author: {s["author"]} ({s["authorUrl"]})',
                     f'- Licence: {s["license"]} ({s["licenseUrl"]})',
                     f'- Licence sentence in info.json: "{(read_json(ICONS / s["id"] / "info.json", "info.json").get("license") or {}).get("title", "")}" (info.json carries only the licence name and a link, no longer sentence).',
                     f'- Taken: {s["count"]} {s["kind"]}s ({s["style"]}) plus {s["aliases"]} aliases (company logos left out: {s["excludedBrandMarks"]}), `icons.json`, `info.json`' + (', `metadata.json`' if (ICONS / s['id'] / 'metadata.json').exists() else ''), '']
        parts['icons'] = section('icons', '\n'.join(rows))
    if (FONTS / 'index.json').exists():
        idx = read_json(FONTS / 'index.json', 'The font index')['families']
        rows = ['## Fonts', '', 'Each folder under `assets/fonts/` holds the font files and its `OFL.txt` (SIL Open Font License 1.1), as downloaded from the Google Fonts repository (the folder named in Source, main branch, November 2026; no commit hash was recorded). '
                'The reserved font names stay with their authors; the fonts are bundled unmodified and not sold on their own.', '',
                '| Family | Folder | Source | Licence | Copyright (first line of OFL.txt) |', '|---|---|---|---|---|']
        for f in idx:
            ofl = FONTS / f['folder'] / 'OFL.txt'
            first = ofl.read_text(encoding='utf-8', errors='replace').splitlines()[0].lstrip('﻿').replace('|', '/') if ofl.exists() else 'OFL.txt MISSING'
            slug = GF_SLUG.get(f['family'], f['folder'].lower().replace(' ', ''))
            src = f'https://github.com/google/fonts/tree/main/ofl/{slug}' if f['folder'] != 'JetBrains Mono' else 'https://github.com/JetBrains/JetBrainsMono'
            rows.append(f'| {f["family"]} | `{f["folder"]}` | {src} | OFL-1.1 | {first} |')
        parts['fonts'] = section('fonts', '\n'.join(rows))
    head = '# Licences of the bundled assets\n\nEvery third-party file in `assets/` has its licence recorded here (ARCHITECTURE.md rule 4). `tools/assets.py reindex` rewrites the two marked sections.\n\n'
    LICENSES.write_text(head + '\n\n'.join(p for p in (parts['icons'], parts['fonts']) if p) + '\n', encoding='utf-8')


def cmd_reindex(a):
    reindex_icons(); reindex_fonts()


def cmd_fonts(a):
    """Lists the font families, or draws up to six of them with a line of your own, to choose a brand's typeface by looking."""
    fams = json.loads((FONTS / 'index.json').read_text(encoding='utf-8'))['families']
    if not a.sheet:
        print(f'{len(fams)} font families in assets/fonts ({sum(1 for f in fams if f["arabic"])} with Arabic letters), all under the SIL Open Font License.')
        for f in sorted(fams, key=lambda x: (x['category'], x['family'])):
            lo, hi = f['weightRange']; weights = str(lo) if lo == hi else f'{lo}-{hi}'
            scripts = ' + '.join(s for s, on in (('Arabic', f['arabic']), ('Latin', f['latin'])) if on)
            upright = next((x for x in f['files'] if x.get('style') == 'normal'), f['files'][0])      # the path to write in brand.json
            print(f"  {f['family']:<22} {f['category']:<10} weights {weights:<8} {scripts:<15} /assets/fonts/{f['folder']}/{upright['file']}")
        print('See some of them with a line of your own:\n  python tools/assets.py fonts --sheet out.png --families "Family A,Family B,Family C" --text "your line"')
        return
    names = [n.strip() for n in (a.families or '').split(',') if n.strip()]
    if not names: die('Name the families to draw: --families "Family A,Family B,Family C" (python tools/assets.py fonts lists them).')
    if len(names) > 6: die('A sheet holds at most six families. Draw the rest on a second sheet.')
    known = {f['family'].lower() for f in fams}; unknown = [n for n in names if n.lower() not in known]
    if unknown: die('No font family called ' + ', '.join(f'"{n}"' for n in unknown) + '. python tools/assets.py fonts lists the names.')
    colours = ''
    if a.colors:
        cs = [c.strip() for c in a.colors.split(',')]
        if len(cs) != 3 or not all(re.fullmatch(r'#[0-9a-fA-F]{6}', c) for c in cs): die('--colors takes three colours as #RRGGBB: the ground, the text and the accent, for example --colors "#F4EBDD,#3A2A1E,#C8552B".')
        colours = f'&bg={cs[0][1:]}&fg={cs[1][1:]}&accent={cs[2][1:]}'
    brand_url, mounts = render_url_args(a.brand)
    from urllib.parse import quote
    page = (f'engine/index.html?scene=/engine/scenes/font-specimen.js&brand={quote(brand_url)}&families={quote(",".join(names), safe=",")}'
            + (f'&text={quote(a.text)}' if a.text else '') + colours + (f'&weight={a.weight}' if a.weight else ''))
    with tempfile.TemporaryDirectory() as tmp:
        r = run_render(page, tmp, mounts)
        if r.returncode: die('The font sheet could not be drawn.\n' + (r.stderr or r.stdout).strip())
        shots = sorted(Path(tmp).glob('*.png'))
        if not shots: die('The renderer finished but wrote no picture.')
        out = Path(a.sheet); out.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(shots[0], out)
    print(f'Wrote {out} with {len(names)} families.')


def cmd_webfont(a):
    """Writes each font again as WOFF2: the packing every current browser reads, smaller on the wire. Nothing is taken out: every
    glyph, every weight of a variable font and all the shaping rules stay, so Arabic joins exactly as it did."""
    try:
        from fontTools.ttLib import TTFont
        import brotli  # noqa: F401   fontTools packs WOFF2 with it
    except ImportError as e:
        die(f'webfont needs fontTools and brotli, and "{e.name}" is not installed. Run: pip install fonttools brotli   (the page works without it: the .ttf stays where it is).')
    done = []
    for name in a.fonts:
        src = Path(name)
        if not src.is_file(): die(f'the font {src} was not found.')
        if src.suffix.lower() not in ('.ttf', '.otf'): die(f'{src.name} is not a .ttf or .otf font file.')
        dst = (Path(a.out) if a.out else src.parent) / (src.stem + '.woff2')
        dst.parent.mkdir(parents=True, exist_ok=True)
        font = TTFont(str(src)); glyphs = font['maxp'].numGlyphs
        font.flavor = 'woff2'; font.save(str(dst))
        if TTFont(str(dst))['maxp'].numGlyphs != glyphs: die(f'{dst} does not hold the same glyphs as {src.name}: keep the .ttf.')
        done.append((src, dst))
    for src, dst in done:
        was, now = src.stat().st_size, dst.stat().st_size
        print(f'{dst}  {max(1, round(now / 1024))} KB, {round(100 * (1 - now / was))}% smaller than {src.name} ({max(1, round(was / 1024))} KB)')
    print('Same font, packed as WOFF2. In @font-face, name the .woff2 with format("woff2"), and keep the licence file beside it.')


def main():
    p = argparse.ArgumentParser(prog='assets.py', description='Find, inspect and render the kit\'s icons, emoji and fonts.')
    sub = p.add_subparsers(dest='cmd', required=True)
    f = sub.add_parser('find', help='search by English or Arabic words'); f.add_argument('words'); f.add_argument('--set'); f.add_argument('--kind', choices=['icon', 'emoji']); f.add_argument('--limit', type=int, default=12); f.set_defaults(fn=cmd_find)
    i = sub.add_parser('info', help='what an asset is'); i.add_argument('id'); i.set_defaults(fn=cmd_info)
    s = sub.add_parser('svg', help='print or write an asset as SVG'); s.add_argument('id'); s.add_argument('--color'); s.add_argument('--out'); s.set_defaults(fn=cmd_svg)
    sh = sub.add_parser('sheet', help='render assets on a flat brand-coloured sheet to a PNG'); sh.add_argument('ids', nargs='*'); sh.add_argument('--out', required=True); sh.add_argument('--brand'); sh.set_defaults(fn=cmd_sheet)
    ad = sub.add_parser('add', help='copy an Iconify JSON set into the kit'); ad.add_argument('set'); ad.add_argument('--from', dest='src', required=True); ad.set_defaults(fn=cmd_add)
    af = sub.add_parser('add-fonts', help='copy OFL font families into the kit'); af.add_argument('--from', dest='src', required=True); af.add_argument('--skip'); af.set_defaults(fn=cmd_add_fonts)
    ri = sub.add_parser('reindex', help='rebuild the indexes and LICENSES.md'); ri.set_defaults(fn=cmd_reindex)
    fo = sub.add_parser('fonts', help='list the font families, or draw some with a line of your own'); fo.add_argument('--sheet', help='write a picture of the chosen families to this PNG'); fo.add_argument('--families', help='comma-separated family names (up to six)'); fo.add_argument('--text', help='the line to show in each family'); fo.add_argument('--weight', type=int, help='the weight to draw at, 100 to 1000 (default 700); a family without it is drawn at its nearest'); fo.add_argument('--colors', help='"#ground,#text,#accent": draw the sheet on these colours (a customer\'s own) instead of the tool\'s'); fo.add_argument('--brand', help='a brand.json to take the colours and the label font from, instead of the tool\'s own'); fo.set_defaults(fn=cmd_fonts)
    wf = sub.add_parser('webfont', help='write a font again as WOFF2, for a site'); wf.add_argument('fonts', nargs='+', help='.ttf or .otf files'); wf.add_argument('--out', help='folder to write into (default: beside each font)'); wf.set_defaults(fn=cmd_webfont)
    a = p.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
