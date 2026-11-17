"""selftest.py · one command that proves the whole chain on the test card (tools/fixtures/testcard/).

  python selftest.py

Copies the test card's brand/ and reel/ into a temporary folder, then: checks the brand, renders its preview, prints the timeline, renders
stills, renders the whole reel (frames, sound, cover, check), reads check.json, and proves two failures on copies (a number that is not in
facts.md; a scene file that does not exist). One line per check. Exit code 1 when any check failed. The temporary folder is removed at the end.
Takes a minute or two: it renders a 6 second reel.
"""
import json, os, re, shutil, subprocess, sys, tempfile
sys.stdout.reconfigure(encoding='utf8')
KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
FIX = os.path.join(KIT, 'tools', 'fixtures', 'testcard')
PY = sys.executable
results = []

def sh(*cmd, timeout=1200):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf8', errors='replace', timeout=timeout)
    return r.returncode, (r.stdout or '') + (r.stderr or '')

def step(name):
    def deco(fn):
        try: ok, why = fn()
        except Exception as e: ok, why = False, f'{type(e).__name__}: {e}'
        results.append(ok); print(('ok    ' if ok else 'FAIL  ') + name + (f'  ({why})' if why else '')); return ok
    return deco

def near(a, b): return a is not None and abs(a - b) < 0.011

def main():
    if not os.path.isfile(os.path.join(FIX, 'reel', 'spec.json')): sys.exit(f'the test card is missing: {FIX}\\reel\\spec.json')
    tmp = tempfile.mkdtemp(prefix='tiraz-selftest-')
    try:
        brand, reel = os.path.join(tmp, 'brand'), os.path.join(tmp, 'reel')
        shutil.copytree(os.path.join(FIX, 'brand'), brand); shutil.copytree(os.path.join(FIX, 'reel'), reel)
        T = lambda name: os.path.join(KIT, 'tools', name)

        @step('brand_check: the test card brand is ok')
        def _():
            code, out = sh(PY, T('brand_check.py'), brand); j = json.loads(out)
            return j['ok'] and code == 0, '; '.join(j['problems']) or ''

        @step('brand_check --preview: preview.jpg is written')
        def _():
            code, out = sh(PY, T('brand_check.py'), brand, '--preview'); j = json.loads(out)
            return j['ok'] and os.path.isfile(os.path.join(brand, 'preview.jpg')), '; '.join(j['problems'])

        @step('make_reel --timeline: starts 0, 1.7, 3.9; total 5.9; cues at 2.1 and 4.4')
        def _():
            code, out = sh(PY, T('make_reel.py'), reel, '--brand', brand, '--timeline')
            starts = [float(m) for m in re.findall(r'^scene \d+ .*? start ([\d.]+)', out, re.M)]
            total = re.search(r'^total ([\d.]+)', out, re.M); cue = {m[1]: float(m[0]) for m in re.findall(r'^cue ([\d.]+)\s+(\w+)', out, re.M)}
            ok = code == 0 and len(starts) == 3 and all(map(near, starts, (0, 1.7, 3.9))) and total and near(float(total.group(1)), 5.9) and near(cue.get('tick'), 2.1) and near(cue.get('ding'), 4.4)
            return ok, '' if ok else out.strip()[-400:]

        first_json = lambda out: json.JSONDecoder().raw_decode(out[out.index('{'):])[0]

        @step('make_reel --stills: the sheet exists, the files are listed, the text was measured and none is outside the safe area')
        def _():
            code, out = sh(PY, T('make_reel.py'), reel, '--brand', brand, '--stills', '0.1,2.5,4.5')
            if code: return False, out.strip()[-400:]
            j = first_json(out); why = []
            if not os.path.isfile(os.path.join(reel, 'stills', 'sheet.jpg')): why.append('no sheet.jpg')
            if [os.path.basename(f) for f in j.get('files', [])] != ['at_000.10.png', 'at_002.50.png', 'at_004.50.png']: why.append(f'files: {j.get("files")}')
            if not j.get('texts_measured'): why.append('no text was measured')
            if j.get('outside_safe_area'): why.append('outside: ' + '; '.join(j['outside_safe_area']))
            return not why, ' / '.join(why)

        @step('make_reel --stills: a line pushed under the safe area is named')
        def _():
            low = os.path.join(tmp, 'reel_low'); shutil.copytree(reel, low, ignore=shutil.ignore_patterns('frames', 'stills', 'publish'))
            p = os.path.join(low, 'spec.json'); s = json.load(open(p, encoding='utf8')); s['scenes'][0]['spec']['y'] = 1400
            json.dump(s, open(p, 'w', encoding='utf8'), ensure_ascii=False)
            code, out = sh(PY, T('make_reel.py'), low, '--brand', brand, '--stills', '0.1')
            if code: return False, out.strip()[-400:]
            said = first_json(out).get('outside_safe_area', [])
            ok = len(said) == 1 and 'below the safe area' in said[0] and 'اختبار' in said[0]
            return ok, '' if ok else f'reported: {said}'

        full = {}
        @step('make_reel: reel.mp4 and cover.jpg exist')
        def _():
            full['code'], full['out'] = sh(PY, T('make_reel.py'), reel, '--brand', brand)
            ok = all(os.path.isfile(os.path.join(reel, 'publish', f)) for f in ('reel.mp4', 'cover.jpg'))
            return ok, '' if ok else full['out'].strip()[-600:]

        @step('check.json: ok, the number 42 is marked as in facts, only "not approved" warned')
        def _():
            c = json.load(open(os.path.join(reel, 'check.json'), encoding='utf8'))
            extra = [w for w in c['warnings'] if not re.search(r'not (been )?approved', w)]
            n = c.get('numbers', {}).get('42')
            why = []
            if not c['ok']: why.append('problems: ' + '; '.join(c['problems']))
            if not (n and n['in_facts']): why.append('42 is not marked as in facts.md')
            if extra: why.append('unexpected warnings: ' + ' | '.join(extra))
            sa = c.get('safe_area') or {}
            if not sa.get('texts_measured') or sa.get('outside'): why.append(f'safe area: {sa}')
            return not why, ' / '.join(why)

        @step('reel_check: the digits of a date in facts.md are not allowed numbers')
        def _():
            bad = os.path.join(tmp, 'reel_date'); shutil.copytree(reel, bad, ignore=shutil.ignore_patterns('frames', 'stills'))
            p = os.path.join(bad, 'spec.json'); s = json.load(open(p, encoding='utf8')); s['scenes'][0]['spec']['says']['text'] += ' 17'
            json.dump(s, open(p, 'w', encoding='utf8'), ensure_ascii=False)
            code, out = sh(PY, T('reel_check.py'), bad, '--brand', brand); j = json.loads(out)
            ok = code == 1 and any(re.search(r'number 17\b', x) for x in j['problems'])
            return ok, '' if ok else f'exit {code}, problems: {j["problems"]}'

        @step('reel_check: a number that is not in facts.md fails and is named')
        def _():
            bad = os.path.join(tmp, 'reel_number'); shutil.copytree(reel, bad, ignore=shutil.ignore_patterns('frames', 'stills'))
            p = os.path.join(bad, 'spec.json'); s = json.load(open(p, encoding='utf8')); s['scenes'][0]['spec']['says']['text'] += ' 99'
            json.dump(s, open(p, 'w', encoding='utf8'), ensure_ascii=False)
            code, out = sh(PY, T('reel_check.py'), bad, '--brand', brand); j = json.loads(out)
            ok = code == 1 and not j['ok'] and any(re.search(r'number 99\b', x) for x in j['problems'])
            return ok, '' if ok else f'exit {code}, problems: {j["problems"]}'

        @step('reel_check counts flashes: five in a second, three in a second, and none in a slow wave')
        def _():
            import reel_check as R
            def clip(name, lum, seconds):
                f = os.path.join(tmp, name)
                sh('ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f"color=c=black:s=270x480:r=60:d={seconds},geq=lum='{lum}':cb=128:cr=128", '-pix_fmt', 'yuv420p', f)
                return R.flashes(f, float(seconds))
            five, three, slow = clip('f5.mp4', 'if(lt(mod(N,12),6),235,16)', 2), clip('f3.mp4', 'if(lt(mod(N,20),10),235,16)', 2), clip('fs.mp4', '16+219*0.5*(1-cos(2*PI*N/240))', 4)
            got = tuple(x and x['most_in_a_second'] for x in (five, three, slow))
            return got == (5, 3, 0), '' if got == (5, 3, 0) else f'counted {got}, expected (5, 3, 0)'

        @step('a fading Arabic word stays one shape: no seams at the joins (and plain fillText, the control, does show them)')
        def _():
            # the upper line goes through the kit at half opacity; the lower one is plain fillText at half opacity, to prove the measurement sees seams
            js = ("export function create({ W, H, brand, kit }) {\n"
                  "  const f = kit.fit('والتوصيل متصل', { size: 150, weight: 800, maxW: 940 });\n"
                  "  return { duration: 1, draw(ctx) {\n"
                  "    ctx.fillStyle = brand.colors.bg; ctx.fillRect(0, 0, W, H);\n"
                  "    kit.drawText(ctx, f, { x0: 70, x1: 1010, y: 500, each: (w, i, box, c) => { c.globalAlpha = 0.5; } });\n"
                  "    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = brand.colors.text; ctx.font = `800 ${f.size}px \"${f.family}\"`; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';\n"
                  "    ctx.fillText('والتوصيل متصل', W / 2, 1100); ctx.restore();\n"
                  "  } };\n}\n")
            open(os.path.join(reel, 'alpha_test.js'), 'w', encoding='utf8').write(js)
            out = os.path.join(tmp, 'alpha')
            code, o = sh('node', os.path.join(KIT, 'engine', 'render.mjs'), '--root', KIT, '--mount', 'brand=' + brand, '--mount', 'reel=' + reel,
                         '--page', 'engine/index.html?scene=/reel/alpha_test.js&brand=/brand/brand.json', '--out', out, '--at', '0', '--png')
            os.remove(os.path.join(reel, 'alpha_test.js'))
            if code: return False, o.strip()[-300:]
            import numpy as np
            from PIL import Image
            c = json.load(open(os.path.join(brand, 'brand.json'), encoding='utf8'))['colors']
            rgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)
            bg, axis = rgb(c['bg']), rgb(c['text']) - rgb(c['bg'])
            im = np.asarray(Image.open(os.path.join(out, 'at_000.00.png')).convert('RGB'), dtype=float)
            p = ((im - bg) @ axis) / (axis @ axis)                 # 0 on the ground, 0.5 on a half-opaque fill, more where two letters overlap
            seams = lambda y0, y1: int((p[y0:y1] > 0.58).sum()); body = lambda y0, y1: int(((p[y0:y1] > 0.44) & (p[y0:y1] < 0.56)).sum())
            kit_seams, kit_body, plain_seams = seams(350, 650), body(350, 650), seams(950, 1250)
            ok = kit_seams == 0 and kit_body > 2000 and plain_seams > 20
            return ok, '' if ok else f'through the kit: {kit_seams} seam pixels, {kit_body} text pixels; plain fillText: {plain_seams} seam pixels'

        @step('make_reel: a missing scene file stops with a sentence')
        def _():
            bad = os.path.join(tmp, 'reel_scene'); shutil.copytree(reel, bad, ignore=shutil.ignore_patterns('frames', 'stills', 'publish'))
            p = os.path.join(bad, 'spec.json'); s = json.load(open(p, encoding='utf8')); s['scenes'][1]['scene'] = '/brand/look/parts/missing.js'
            json.dump(s, open(p, 'w', encoding='utf8'), ensure_ascii=False)
            code, out = sh(PY, T('make_reel.py'), bad, '--brand', brand)
            ok = code != 0 and 'missing.js' in out and 'Traceback' not in out and not os.path.isdir(os.path.join(bad, 'frames'))
            return ok, '' if ok else f'exit {code}: {out.strip()[-300:]}'
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f'{sum(results)} of {len(results)} checks passed'); sys.exit(0 if all(results) else 1)

if __name__ == '__main__': main()
