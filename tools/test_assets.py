#!/usr/bin/env python3
"""test_assets.py - one command that checks the asset store and the font pack.   python tools/test_assets.py
Checks: index integrity, a permissive licence recorded for every set and font, English and Arabic sample queries, and real renders through the engine
(a sheet of 24 icons and 12 emoji in the tool brand, and the font specimen pages, which prove each family drew in its own font).
Pictures go to out/test-assets/ so a person can open them. Exit code 1 when anything fails; every failure is a sentence."""
import json, re, shutil, subprocess, sys
from pathlib import Path
from urllib.parse import quote

KIT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KIT / 'tools'))
import assets as A                      # the module under test; its helpers resolve ids exactly as the CLI does

OUT = KIT / 'out' / 'test-assets'
CLI = [sys.executable, str(KIT / 'tools' / 'assets.py')]
BRAND = '/engine/tool-brand.json'
fails, passes = [], 0


def check(name, ok, detail=''):
    global passes
    if ok: passes += 1; print(f'  ok    {name}')
    else: fails.append(f'{name}: {detail}'); print(f'  FAIL  {name}: {detail}')


def cli(*args):
    r = subprocess.run([*CLI, *args], capture_output=True, text=True, encoding='utf-8', cwd=KIT)
    return r.returncode, r.stdout.strip().splitlines(), r.stderr.strip()


def render(scene_query, out_dir):
    cmd = ['node', 'engine/render.mjs', '--root', '.', '--page', f'engine/index.html?scene=/engine/scenes/{scene_query}', '--out', str(out_dir), '--at', '0', '--png']
    return subprocess.run(cmd, cwd=KIT, capture_output=True, text=True, encoding='utf-8')


def store_png(tmp, dest):
    shots = sorted(Path(tmp).glob('*.png'))
    if shots: shutil.copyfile(shots[0], dest)
    return dest if shots else None


# ------------------------------------------------------------------ 1. integrity
def test_integrity():
    print('index integrity')
    sets = json.loads((KIT / 'assets/icons/sets.json').read_text(encoding='utf-8'))
    index = json.loads((KIT / 'assets/icons/index.json').read_text(encoding='utf-8'))['entries']
    ids = [e[0] for e in index]
    check('sets.json lists the five shipped sets', {s['id'] for s in sets} == {'tabler', 'lucide', 'ph', 'material-symbols', 'fluent-emoji-flat'}, str([s['id'] for s in sets]))
    check('no id appears twice in index.json', len(ids) == len(set(ids)), f'{len(ids) - len(set(ids))} duplicates')
    check('index.json holds every icon of every set', len(ids) == sum(s['count'] for s in sets), f'{len(ids)} entries, sets say {sum(s["count"] for s in sets)}')
    bad = []
    for s in sets:
        data = json.loads((KIT / 'assets/icons' / s['id'] / 'icons.json').read_text(encoding='utf-8'))
        if len(data['icons']) != s['count']: bad.append(f'{s["id"]} count')
        if not all('body' in v for v in data['icons'].values()): bad.append(f'{s["id"]} body')
        names = {e[0].split(':', 1)[1] for e in index if e[0].startswith(s['id'] + ':')}
        if names != set(data['icons']): bad.append(f'{s["id"]} index names differ from icons.json')
        if s['kind'] not in ('icon', 'emoji') or s['style'] not in ('stroke', 'fill', 'colour'): bad.append(f'{s["id"]} kind/style')
    check('each set folder matches its count, entries and kind/style', not bad, '; '.join(bad))
    brands = [i for i in ids if A.is_brand(i.split(':')[0], i.split(':', 1)[1])]
    check('no company logo or product mark is in the index', not brands, ', '.join(brands[:8]))
    size = (KIT / 'assets/icons/index.json').stat().st_size
    check('index.json stays under 2 MB', size < 2_000_000, f'{size} bytes')
    ar = json.loads((KIT / 'assets/icons/ar-keywords.json').read_text(encoding='utf-8'))
    words = {k: v for k, v in ar.items() if not k.startswith('_')}
    check('ar-keywords.json has about 300 or more Arabic words', len(words) >= 300, f'{len(words)} words')
    # in-process, because 600 separate runs would be slow: a word is alive when one of its English terms matches some entry
    table = A.load_ar(); entries = [(e[0].split(':', 1)[1], e[1].split() if len(e) > 1 else []) for e in index]; seen = {}
    def alive(term):
        if term not in seen:
            seen[term] = any(A.score_entry([[term]], n, n.split('-'), x)[0] >= 20 for n, x in entries)
        return seen[term]
    dead = [k for k in words if not any(alive(t) for t in table[A.norm_ar(k)])]
    check('every Arabic keyword finds at least one asset', not dead, 'no result for: ' + ' '.join(dead[:10]))
    fonts = json.loads((KIT / 'assets/fonts/index.json').read_text(encoding='utf-8'))['families']
    arabic = [f for f in fonts if f['arabic']]
    check('the font index has 28 families, 27 of them Arabic', len(fonts) == 28 and len(arabic) == 27, f'{len(fonts)} in all, {len(arabic)} Arabic')
    miss = [f'{f["folder"]}/{x["file"]}' for f in fonts for x in f['files'] if not (KIT / 'assets/fonts' / f['folder'] / x['file']).exists()]
    check('every font file named in the index exists', not miss, ', '.join(miss[:5]))
    noar = [f['family'] for f in fonts if not f['arabic'] and f['category'] != 'mono']
    check('every Arabic family covers Arabic letters', not noar, ', '.join(noar))
    cats = {f['category'] for f in fonts}
    check('the font categories are the expected ones', cats <= {'sans', 'kufi', 'display', 'hand', 'pixel', 'naskh', 'ruqaa', 'mono'}, str(cats))
    return sets, fonts


# ------------------------------------------------------------------ 2. licences
def test_licences(sets, fonts):
    print('licences')
    text = (KIT / 'assets/LICENSES.md').read_text(encoding='utf-8')
    for s in sets:
        info = json.loads((KIT / 'assets/icons' / s['id'] / 'info.json').read_text(encoding='utf-8'))
        spdx = info['license']['spdx']
        check(f'{s["id"]}: licence {spdx} is permissive and written in LICENSES.md', spdx in A.PERMISSIVE and spdx == s['license'] and f'(`{s["id"]}`)' in text and f'Licence: {spdx}' in text, f'spdx {spdx}')
    for f in fonts:
        ofl = KIT / 'assets/fonts' / f['folder'] / 'OFL.txt'
        check(f'font {f["family"]}: OFL.txt present and listed', ofl.exists() and f'| {f["family"]} |' in text, 'OFL.txt or its LICENSES.md row is missing')
    code, _, err = cli('add', 'tabler', '--from', str(KIT / 'assets/icons/ph'))
    check('add refuses a folder that is a different set, in a sentence', code == 1 and 'not "tabler"' in err, err)


# ------------------------------------------------------------------ 3. queries
def test_queries():
    print('queries')
    for q, expect in [('shopping cart', 'shopping-cart'), ('heart', 'heart'), ('truck', 'truck'), ('phone', 'phone'), ('credit card', 'credit-card'), ('gift', 'gift')]:
        code, out, err = cli('find', q)
        check(f'English "{q}" finds {expect}', code == 0 and any(expect in o for o in out), err or str(out[:4]))
    for q, expect in [('سلة', 'cart'), ('جوال', 'phone'), ('موبايل', 'phone'), ('قلب', 'heart'), ('نجمة', 'star'), ('دفع', 'credit-card'),
                      ('توصيل', 'truck'), ('خصم', 'percent'), ('وقت', 'clock'), ('أمان', 'shield'), ('هدية', 'gift')]:
        code, out, err = cli('find', q)
        check(f'Arabic «{q}» finds {expect}', code == 0 and any(expect in o for o in out), err or str(out[:4]))
    a = cli('find', 'أمان')[1]; b = cli('find', 'امان')[1]
    check('alef forms give the same result (أمان = امان)', a == b and a, f'{a[:3]} vs {b[:3]}')
    a = cli('find', 'هدية')[1]; b = cli('find', 'هديّه')[1]
    check('taa marbuta and diacritics give the same result (هدية = هديّه)', a == b and a, f'{a[:3]} vs {b[:3]}')
    a = cli('find', 'سلة')[1]; b = cli('find', 'السلة')[1]
    check('the article ال is ignored (سلة = السلة)', a == b and a, f'{a[:3]} vs {b[:3]}')
    code, out, _ = cli('find', 'heart', '--kind', 'emoji')
    check('--kind emoji returns only emoji', code == 0 and out and all(o.startswith('fluent-emoji-flat:') for o in out), str(out[:3]))
    code, out, _ = cli('find', 'heart', '--kind', 'icon')
    check('--kind icon returns no emoji', code == 0 and out and not any(o.startswith('fluent-emoji-flat:') for o in out), str(out[:3]))
    code, out, _ = cli('find', 'heart', '--set', 'lucide', '--limit', '3')
    check('--set and --limit are respected', code == 0 and 0 < len(out) <= 3 and all(o.startswith('lucide:') for o in out), str(out))
    code, _, err = cli('find', 'زززز')
    check('an unknown Arabic word fails with a sentence', code == 1 and err.startswith('assets: I do not know'), err)
    code, _, err = cli('find', 'qqzzqq')
    check('a query with no match fails with a sentence', code == 1 and 'Nothing matched' in err, err)
    code, _, err = cli('info', 'tabler:no-such-icon-xyz')
    check('an unknown icon fails with a sentence', code == 1 and 'no icon' in err, err)
    code, out, err = cli('svg', 'tabler:heart', '--color', '#E8A23B')
    check('svg returns a coloured svg', code == 0 and out and out[0].startswith('<svg') and '#E8A23B' in out[0] and 'currentColor' not in out[0], err)


# ------------------------------------------------------------------ 4. renders
def count_pixels(img, pred):
    raw = img.convert('RGB').tobytes()
    return sum(1 for p in zip(raw[0::3], raw[1::3], raw[2::3]) if pred(p))


def test_renders():
    print('renders through the engine')
    from PIL import Image
    OUT.mkdir(parents=True, exist_ok=True)
    brand = json.loads((KIT / 'engine/tool-brand.json').read_text(encoding='utf-8'))['colors']['accent']
    accent = tuple(int(brand[i:i + 2], 16) for i in (1, 3, 5))
    # the 24 icons come from four sets, the 12 emoji from the emoji set
    icons = ('tabler:shopping-cart tabler:heart lucide:phone lucide:truck ph:star ph:credit-card material-symbols:percent material-symbols:schedule '
             'tabler:shield-lock lucide:gift ph:rocket-launch material-symbols:home tabler:chart-line lucide:map-pin ph:coffee tabler:bell '
             'lucide:camera ph:lock-key material-symbols:wifi tabler:discount-2 lucide:mail ph:users-three tabler:bolt lucide:search').split()
    emoji = ('fluent-emoji-flat:fire fluent-emoji-flat:red-heart fluent-emoji-flat:star fluent-emoji-flat:rocket fluent-emoji-flat:money-bag fluent-emoji-flat:wrapped-gift '
             'fluent-emoji-flat:delivery-truck fluent-emoji-flat:shopping-cart fluent-emoji-flat:hot-beverage fluent-emoji-flat:glowing-star '
             'fluent-emoji-flat:party-popper fluent-emoji-flat:mobile-phone').split()
    check('24 icons and 12 emoji are chosen', len(icons) == 24 and len(emoji) == 12, f'{len(icons)} and {len(emoji)}')
    sheet = OUT / 'sheet-icons-emoji.png'
    code, out, err = cli('sheet', *icons, *emoji, '--out', str(sheet), '--brand', str(KIT / 'engine/tool-brand.json'))
    check('tools/assets.py sheet draws 36 assets', code == 0 and sheet.exists(), err)
    if sheet.exists():
        im = Image.open(sheet)
        check('the sheet is a full 1080x1920 frame', im.size == (1080, 1920), str(im.size))
        n_accent = count_pixels(im, lambda p: sum(abs(a - b) for a, b in zip(p, accent)) < 24)
        n_red = count_pixels(im, lambda p: p[0] > 200 and p[1] < 80 and p[2] < 90)
        check('icons are drawn in the brand accent', n_accent > 8000, f'{n_accent} accent pixels')
        check('emoji keep their own colours (red pixels from the heart and fire)', n_red > 600, f'{n_red} red pixels')
    # a bad id is named before any browser starts
    code, _, err = cli('sheet', 'tabler:heart', 'tabler:no-such-icon-xyz', '--out', str(OUT / 'never.png'), '--brand', str(KIT / 'engine/tool-brand.json'))
    check('sheet names an unknown id in a sentence', code == 1 and 'no-such-icon-xyz' in err and not (OUT / 'never.png').exists(), err)
    # the paths contract: ph:star is plain paths, fluent fire is made of groups
    plain = [i for i in icons if A.plain_paths(A.resolve(i)[2]['body'])][:4]
    shapes = [i for i in icons if not A.plain_paths(A.resolve(i)[2]['body'])][:4] + emoji[:2]
    q = f'assets-sheet.js&brand={BRAND}&ids={quote(",".join(plain + shapes), safe=",:")}&expectPaths={quote(",".join(plain), safe=",:")}&expectNoPaths={quote(",".join(shapes), safe=",:")}'
    r = render(q, OUT / '_paths')
    check('loadAsset().paths is a list for plain-path icons and null for the rest', r.returncode == 0, r.stderr.strip())
    shutil.rmtree(OUT / '_paths', ignore_errors=True)
    # fonts: one page per six families, then a control run that must be caught
    fonts = json.loads((KIT / 'assets/fonts/index.json').read_text(encoding='utf-8'))['families']
    pages = -(-len(fonts) // 6)
    for p in range(pages):
        tmp = OUT / f'_font{p}'
        r = render(f'font-specimen.js&brand={BRAND}&page={p}&per=6', tmp)
        png = store_png(tmp, OUT / f'font-specimen-{p + 1}.png'); shutil.rmtree(tmp, ignore_errors=True)
        names = ', '.join(f['family'] for f in fonts[p * 6:p * 6 + 6])
        check(f'font specimen page {p + 1} drew in the families\' own fonts ({names})', r.returncode == 0 and png is not None, (r.stderr or r.stdout).strip())
    r = render(f'font-specimen.js&brand={BRAND}&page=0&per=6&sabotage=1', OUT / '_sab')
    shutil.rmtree(OUT / '_sab', ignore_errors=True)
    check('the font check catches a family that did not load (control run)', r.returncode == 1 and fonts[0]['family'] in r.stderr and 'own font' in r.stderr, r.stderr.strip()[:200])
    # every family differs from the others: widths of the Arabic part on the printed sheets would all be equal only if the same font drew them
    sigs = set()
    for p in range(pages):
        f = OUT / f'font-specimen-{p + 1}.png'
        if f.exists(): sigs.add(Image.open(f).convert('L').resize((54, 96)).tobytes())
    check('the specimen pages are different pictures', len(sigs) == pages, f'{len(sigs)} distinct of {pages}')


# ------------------------------------------------------------------ 5. a font for a site
def test_webfont():
    print('webfont')
    src = KIT / 'assets/fonts/Cairo/Cairo[slnt,wght].ttf'; folder = OUT / 'webfont'; dst = folder / 'Cairo[slnt,wght].woff2'
    try:
        import brotli  # noqa: F401
        from fontTools.ttLib import TTFont
    except ImportError:
        code, _, err = cli('webfont', str(src), '--out', str(folder))
        check('webfont says what to install when fontTools or brotli is missing', code == 1 and 'pip install fonttools brotli' in err, err)
        return
    if dst.exists(): dst.unlink()
    code, _, err = cli('webfont', str(src), '--out', str(folder))
    check('webfont writes the font again as WOFF2, at less than half the size', code == 0 and dst.exists() and dst.stat().st_size < src.stat().st_size / 2, err or 'no smaller file was written')
    if dst.exists():
        a, b = TTFont(str(src)), TTFont(str(dst))
        same = (a['maxp'].numGlyphs == b['maxp'].numGlyphs and a.getBestCmap() == b.getBestCmap()
                and all(a.getTableData(t) == b.getTableData(t) for t in ('GSUB', 'GPOS', 'fvar', 'name') if t in a) and set(a.keys()) == set(b.keys()))
        check('the WOFF2 holds the same glyphs, letters, weights and shaping rules as the font it came from', same, 'a table differs between the two files')
    code, _, err = cli('webfont', str(KIT / 'README.md'))
    check('webfont refuses a file that is not a font, in a sentence', code == 1 and 'not a .ttf or .otf' in err, err)


def main():
    sets, fonts = test_integrity()
    test_licences(sets, fonts)
    test_queries()
    test_webfont()
    if shutil.which('node'): test_renders()
    else: check('Node.js is installed for the render checks', False, 'node was not found on the PATH')
    print(f'\n{passes} checks passed, {len(fails)} failed.')
    if fails:
        print('Problems:'); [print('  - ' + f) for f in fails]
        sys.exit(1)


if __name__ == '__main__':
    main()
