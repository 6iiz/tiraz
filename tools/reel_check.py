"""reel_check.py · the gate before a reel is shown to the customer.   python reel_check.py <reel folder> --brand <brand folder>

Measures what a tool can measure, and makes the sheet a person (or Claude) must look at:
  - the file: H.264, 1080x1920, 60 fps, bt709, AAC sound, about -14 LUFS, peaks under -1 dB, and whether the sound survives a phone speaker.
    The whole file is the reel; its length must match the total of the scene timeline (tools/timeline.py) when the spec gives one
  - every number a viewer reads (all strings and numbers in the spec and in every scene's spec, see tools/timeline.py), hears (narration words)
    or finds in the caption appears in the brand's facts.md (a guard against invented prices and counts; it does not prove the number is used
    for the right thing: read the sentence)
  - a narration file that is named exists and its last word ends before the file does; every icon named exists in the asset store
  - the first frame is not flat: the hook must be on screen from frame one (a flat ground has no detail and no variation; any ground may be light or dark)
  - warns about text and numbers written inside scene code (.js in the reel folder and in <brand>/look/): they are not checked against facts.md,
    so keep them in the spec; warns when the brand has no "look" yet, when the caption or cover is missing, when it is not approved
  - facts.md is read as a table: the allowed numbers come from its rows, without the columns headed source or date (a date's digits are not facts)
  - the safe area: at the sheet's moments, every text drawn through the kit is held against x 70..1010, y 270..1248 and what leaves it is named
    (text a scene draws by itself is not measured unless the scene reports it with kit.rec)
  - flashes: more than three whole-frame flashes in any second is a problem (WCAG 2.2, 2.3.1); one big whole-frame flash is a warning
  - sheet.jpg: nine moments of the finished reel, the first frame and the last included
Writes check.json and sheet.jpg in the reel folder. Exit code 1 when there are problems. A clean result is not approval: look at the sheet.
"""
import json, os, re, subprocess, sys
sys.stdout.reconfigure(encoding='utf8')
KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(KIT, 'tools'))
import timeline as TL
NUM = re.compile(r'\d+(?:[.,]\d+)*')
LATIN = str.maketrans('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹٬٫', '01234567890123456789,.')      # Arabic and Persian digits and separators read as Latin ones
run = lambda *c: subprocess.run(c, capture_output=True, text=True, encoding='utf8', errors='replace')
def norm(n):                                                  # 12,400 and 12400 are the same number; 9.99 stays 9.99
    n = re.sub(r'(?<=\d),(?=\d{3}(\D|$))', '', n).rstrip('.,')
    return n[:-2] if n.endswith('.0') else n
numbers = lambda text: {norm(n) for n in NUM.findall(str(text).translate(LATIN))}

# facts.md is a table: one row per thing that may be said. A column whose heading names a source or a date holds where the fact came from,
# not the fact, so its digits (17 November 2026) must not become allowed numbers.
NOT_A_FACT = re.compile(r'\b(source|sources|date|dated|read|checked|as of|when)\b|مصدر|تاريخ|مرجع', re.I)
def allowed_numbers(facts):
    """-> (the numbers facts.md allows, whether it has a table). With no table, every number in the file (a weaker check; the caller warns)."""
    lines = facts.splitlines(); out, skip, tables = set(), set(), 0
    cells = lambda l: [c.strip() for c in l.strip().strip('|').split('|')]
    rule = lambda l: l.strip().startswith('|') and all(re.fullmatch(r':?-{2,}:?', c) for c in cells(l) if c) and any(cells(l))
    for i, l in enumerate(lines):
        if not l.strip().startswith('|'): skip = set(); continue
        if rule(l): continue
        if i + 1 < len(lines) and rule(lines[i + 1]):                # the heading row of a table
            tables += 1; skip = {k for k, c in enumerate(cells(l)) if NOT_A_FACT.search(c)}; continue
        for k, c in enumerate(cells(l)):
            if k not in skip: out |= numbers(c)
    return (out, True) if tables else (numbers(facts), False)

ARABIC = re.compile('[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
BARE_NUMBER = re.compile(r'(?<![\w.#-])\d{2,}(?![\w])')                     # 42 or 12,400 standing as a word, not inside h264 or v2
PATH_DATA = re.compile(r'^[MmLlHhVvCcSsQqTtAaZz][\sMmLlHhVvCcSsQqTtAaZz\d.,\-]*$')

def js_strings(src):
    """The string literals of a JS file (single, double, backtick quoted), comments skipped. Good enough for a warning, not a parser."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if src.startswith('//', i): i = src.find('\n', i); i = n if i < 0 else i
        elif src.startswith('/*', i): i = src.find('*/', i + 2); i = n if i < 0 else i + 2
        elif c in '\'"`':
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == '\\' else 1
                if c != '`' and j < n and src[j] == '\n': break
            out.append(src[i + 1:j]); i = j + 1
        else: i += 1
    return out

def worth_a_warning(t):
    t = t.strip()
    if not t or t.startswith(('/', './', '../', '#', 'rgb', 'hsl')) or '://' in t: return False
    if re.search(r'(\d|\})\s*px\b', t) or PATH_DATA.match(t): return False      # a canvas font, SVG path data
    if re.fullmatch(r'[\w./-]+\.(js|json|png|jpe?g|svg|webp|ttf|otf|woff2?|wav|mp3)', t): return False
    return bool(ARABIC.search(t) or BARE_NUMBER.search(t))

def flashes(mp4, dur):
    """Whole-frame flashes in the finished file. -> {'flashes': [seconds], 'most_in_a_second': n, 'big': [sentences]} or None when it could not be measured.

    The brightness (relative luminance, 0..1) of every frame is taken as the mean of the whole frame and of each quarter of it. A flash is a pair
    of opposite changes of 0.10 or more that completes within a second, with the darker state under 0.80: the general flash of WCAG 2.2 (2.3.1),
    which allows no more than three in any second. Only flashes that fill a quarter of the frame or more are seen; a small flashing detail is not."""
    try:
        import numpy as np
        w, h = 64, 112
        r = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True)
        a = np.frombuffer(r.stdout, dtype=np.uint8); n = a.size // (w * h)
        if n < 3: return None
        v = a[:n * w * h].reshape(n, h, w).astype(np.float32) / 255; lin = np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
        fps = n / dur if dur > 0 else 60.0
        regions = [lin, lin[:, :h // 2, :w // 2], lin[:, :h // 2, w // 2:], lin[:, h // 2:, :w // 2], lin[:, h // 2:, w // 2:]]
        per_region = []                                               # for each region: [(frame where a flash begins, before, middle, after, seconds it took)]
        for reg in regions:
            # turning points of the brightness that are at least 0.10 apart: (level, the frame at which the change towards it was first that large)
            L = reg.reshape(n, -1).mean(1); piv = [(float(L[0]), 0)]; level, since, d = float(L[0]), 0, 0
            for i in range(1, n):
                x = float(L[i])
                if d == 0:
                    if abs(x - piv[0][0]) >= 0.10: d = 1 if x > piv[0][0] else -1; level, since = x, i
                elif (d == 1 and x >= level) or (d == -1 and x <= level): level = x
                elif abs(x - level) >= 0.10: piv.append((level, since)); d = -d; level, since = x, i
            if d != 0: piv.append((level, since))
            mine, k = [], 1
            while k + 1 < len(piv):                                   # a flash is two opposite changes: once paired, both are used up
                (a0, _), (a1, f1), (a2, f2) = piv[k - 1], piv[k], piv[k + 1]; took = (f2 - f1) / fps     # from the first change to the opposite one
                if took <= 1.0 and min(a0, a1, a2) < 0.80: mine.append((f1, a0, a1, a2, took)); k += 2
                else: k += 1
            per_region.append(mine)
        in_a_second = lambda fl: max((sum(1 for u in fl if f[0] <= u[0] < f[0] + fps) for f in fl), default=0)
        worst = max(per_region, key=in_a_second)                      # the part of the frame that flashes most
        big, seen = [], []
        for f1, a0, a1, a2, took in sorted(x for fl in per_region for x in fl):
            if abs(a1 - a0) >= 0.20 and abs(a2 - a1) >= 0.20 and took <= 0.6 and not any(abs(f1 - j) <= fps * 0.25 for j in seen):
                seen.append(f1); big.append(f'at {f1 / fps:.2f} s the brightness goes {a0:.2f} → {a1:.2f} → {a2:.2f} within {took:.2f} s')
        return {'flashes': [round(f[0] / fps, 2) for f in worst], 'most_in_a_second': in_a_second(worst), 'big': big}
    except Exception:
        return None

def scene_code_text(reel, brand):
    """{file: [examples]} for text and numbers written in scene code, in the reel folder and in <brand>/look/."""
    files = []
    for root, dirs, names in os.walk(reel):
        dirs[:] = [d for d in dirs if d not in ('frames', 'stills', 'publish') and not d.startswith('.')]
        files += [os.path.join(root, f) for f in names if f.endswith('.js')]
    for root, dirs, names in os.walk(os.path.join(brand, 'look')):
        dirs[:] = [d for d in dirs if d != 'directions']       # the style frames the customer chose from are a record, not part of any reel
        files += [os.path.join(root, f) for f in names if f.endswith('.js')]
    found = {}
    for f in files:
        try: src = open(f, encoding='utf8').read()
        except Exception: continue
        ex = []
        for t in js_strings(src):
            if worth_a_warning(t) and t.strip() not in ex: ex.append(t.strip())
        if ex: found[f] = ex
    return found

def check(reel, brand):
    bad, warn, info = [], [], {}
    sp, mp4 = os.path.join(reel, 'spec.json'), os.path.join(reel, 'publish', 'reel.mp4')
    if not os.path.isfile(sp): return {'ok': False, 'problems': [f'spec.json is not in {reel}'], 'warnings': []}
    S = json.load(open(sp, encoding='utf8'))
    try: B = json.load(open(os.path.join(brand, 'brand.json'), encoding='utf8'))
    except Exception as e: return {'ok': False, 'problems': [f'brand.json could not be read in {brand}: {e}'], 'warnings': []}
    if not os.path.isfile(mp4): return {'ok': False, 'problems': ['publish/reel.mp4 does not exist yet: run make_reel.py'], 'warnings': []}

    # ---- the file ----
    pr = json.loads(run('ffprobe', '-v', '0', '-show_streams', '-show_format', '-of', 'json', mp4).stdout or '{}')
    v = next((s for s in pr.get('streams', []) if s.get('codec_type') == 'video'), None); au = next((s for s in pr.get('streams', []) if s.get('codec_type') == 'audio'), None)
    if not v: bad.append('the file has no video stream')
    else:
        if v.get('codec_name') != 'h264': bad.append(f'video codec is {v.get("codec_name")}, expected h264')
        if (v.get('width'), v.get('height')) != (1080, 1920): bad.append(f'size is {v.get("width")}x{v.get("height")}, expected 1080x1920')
        if v.get('r_frame_rate') != '60/1': bad.append(f'frame rate is {v.get("r_frame_rate")}, expected 60')
        if v.get('pix_fmt') != 'yuv420p': bad.append(f'pixel format is {v.get("pix_fmt")}, expected yuv420p (other formats fail or look washed on some phones)')
        if v.get('color_space') != 'bt709' or v.get('color_range') != 'tv': bad.append(f'colour is tagged {v.get("color_space")}/{v.get("color_range")}, expected bt709/tv')
    dur = float(pr.get('format', {}).get('duration', 0)); info['duration'] = round(dur, 2)
    tl = TL.timeline(S, reel, brand, KIT); bad.extend(tl['problems'])            # the whole file is the reel; the stated length is the scene timeline's total
    if tl['total'] is not None and abs(tl['total'] - dur) > 0.15: bad.append(f'the reel is {dur:.2f} s but the spec makes {tl["total"]:.2f} s')
    if not au: bad.append('the file has no sound stream')
    else:
        tail = run('ffmpeg', '-hide_banner', '-i', mp4, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr.split('Summary:')[-1]
        L = {k: float(x) for k, x in re.findall(r'\b(I|Peak):\s+(-?[\d.]+)', tail)}; info['lufs'], info['peak_db'] = L.get('I'), L.get('Peak')
        if L.get('I') is None or L['I'] < -60: warn.append('the reel is silent')
        else:
            if not -15.0 <= L['I'] <= -13.0: bad.append(f'loudness is {L["I"]:.1f} LUFS, expected -14 (±1)')
            if L.get('Peak', -99) > -1.0: bad.append(f'peak is {L["Peak"]:.1f} dB, must stay under -1')
            try:
                sys.path.insert(0, os.path.join(KIT, 'sound')); import phone_check
                share = phone_check.check(mp4)['share_above_250hz']; info['share_above_250hz'] = round(share, 2)
                if share < 0.35: warn.append(f'only {100 * share:.0f}% of the sound energy is above 250 Hz: the reel will sound thin on a phone speaker')
            except Exception as e: warn.append(f'the phone-speaker check did not run: {e}')

    # ---- what is said ----
    texts, icons, outside = TL.read_by_viewer(S, tl)
    spoken = []
    if S.get('voice'):
        vf = os.path.join(reel, S['voice'])
        if not os.path.isfile(vf): bad.append(f'the narration "{S["voice"]}" is not in the reel folder')
        wf = os.path.join(reel, S['words']) if isinstance(S.get('words'), str) else None
        if wf and os.path.isfile(wf):
            words = json.load(open(wf, encoding='utf8')); spoken = [w['w'] for w in words]
            if words and words[-1]['e'] + S.get('voice_at', 0.0) > dur + 0.05: bad.append(f'the last narrated word ends at {words[-1]["e"] + S.get("voice_at", 0.0):.2f} s but the file ends at {dur:.2f} s: shorten the narration or lengthen the reel')
        elif wf: bad.append(f'the word-timing file "{S["words"]}" is not in the reel folder')
    cap = os.path.join(reel, 'publish', 'caption.txt'); caption = open(cap, encoding='utf8').read() if os.path.isfile(cap) else ''
    if not caption.strip(): warn.append('publish/caption.txt is missing or empty')
    fp = os.path.join(brand, 'facts.md'); facts = open(fp, encoding='utf8').read() if os.path.isfile(fp) else ''
    if not facts: warn.append('the brand has no facts.md: no number can be checked')
    allowed, had_table = allowed_numbers(facts); used = {}
    if facts and not had_table: warn.append('facts.md has no table, so every number in the file was taken as allowed, the digits of dates included. Write it as a table: what may be said | its exact wording or number | source | date.')
    for where, text in [('on screen', ' '.join(texts)), ('narration', ' '.join(spoken)), ('caption', caption)]:
        for n in sorted(numbers(text)): used.setdefault(n, []).append(where)
    info['numbers'] = {n: {'where': w, 'in_facts': n in allowed} for n, w in sorted(used.items())}
    for n, w in sorted(used.items()):
        if n not in allowed: bad.append(f'the number {n} ({", ".join(w)}) is not in facts.md: remove it or add its source there first')
    for ic in sorted(set(icons)):
        r = run(sys.executable, os.path.join(KIT, 'tools', 'assets.py'), 'info', ic)
        if r.returncode: bad.append(f'the icon "{ic}" is not in the asset store (python tools/assets.py find <words>)')
    if outside: warn.append('text outside "says" is not checked against facts.md: ' + '; '.join(f'"{x}"' for x in outside[:5]) + ('' if len(outside) <= 5 else f' and {len(outside) - 5} more') + '. Write what a viewer reads inside the scene\'s "says".')
    for f, ex in sorted(scene_code_text(reel, brand).items()):
        warn.append(f'{("/brand/" + os.path.relpath(f, brand).replace(os.sep, "/")) if f.startswith(brand + os.sep) else ("/reel/" + os.path.relpath(f, reel).replace(os.sep, "/"))} writes text or numbers inside scene code ({", ".join(json.dumps(e, ensure_ascii=False) for e in ex[:5])}'
                    + (f' and {len(ex) - 5} more' if len(ex) > 5 else '') + '): they are not checked against facts.md. Move them into the spec.')
    if not os.path.isfile(os.path.join(reel, 'publish', 'cover.jpg')): warn.append('publish/cover.jpg is missing')
    if not B.get('look'): warn.append('brand.json has no "look" yet: the brand has no designed look (the setup skill designs one)')
    if not B.get('approved'): warn.append('the brand has not been approved by the customer yet (brand.json has no "approved" date)')

    # ---- the sheet to look at ----
    try:
        from PIL import Image
        times = sorted({0.0,*[round(dur * k / 8, 2) for k in range(1, 8)], max(0.0, round(dur - 0.1, 2))}); tiles = []     # the first frame, seven moments between, and the last thing a viewer sees
        for i, t in enumerate(times):
            f = os.path.join(reel, f'.check_{i}.jpg'); run('ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', mp4, '-frames:v', '1', '-q:v', '3', f)
            if os.path.isfile(f): tiles.append(Image.open(f).convert('RGB').resize((360, 640), Image.LANCZOS)); os.remove(f)
        if tiles:
            # a flat first frame: the ground alone (light or dark) has no pixels that differ much from its median, and little spread overall
            import numpy as np
            lum = np.asarray(tiles[0].convert('L'), dtype=np.float32); med = float(np.median(lum))
            share = float((np.abs(lum - med) > 40).mean()); info['first_frame_detail_share'] = round(share, 4)
            if share < 0.002 or float(lum.std()) < 6: bad.append('the first frame is flat: the hook must be on screen from frame one (give the first element a start at or before 0).')
            sheet = Image.new('RGB', (360 * len(tiles), 640))
            for i, im in enumerate(tiles): sheet.paste(im, (360 * i, 0))
            info['sheet'] = os.path.join(reel, 'sheet.jpg'); sheet.save(info['sheet'], quality=88); info['sheet_times'] = times
    except Exception as e: warn.append(f'the sheet was not made: {e}')

    # ---- flashes: an accessibility rule, not taste (WCAG 2.2, 2.3.1: no more than three flashes in any second) ----
    fl = flashes(mp4, dur) if v else None
    if fl is None: warn.append('flashes were not measured (the frames could not be read)')
    else:
        info['flashes'] = {'count': len(fl['flashes']), 'most_in_a_second': fl['most_in_a_second'], 'at': fl['flashes'][:12]}
        if fl['most_in_a_second'] > 3: bad.append(f'the frame flashes {fl["most_in_a_second"]} times within one second (around {fl["flashes"][0]:.2f} s and after): more than three flashes in a second can trigger seizures. Remove the flashing, or make the changes tonal.')
        if fl['big']: warn.append('the whole frame flashes: ' + '; '.join(fl['big'][:4]) + (f' and {len(fl["big"]) - 4} more' if len(fl['big']) > 4 else '')
                                  + '. A joint or an effect floods the frame with a much lighter or darker colour: make it tonal (close to the ground\'s own brightness), or check that this is what the brand wants.')

    # ---- the safe area: every text the kit drew at the sheet's moments, held against it ----
    cmd = TL.render_cmd(S, reel, brand, KIT) if info.get('sheet_times') else None
    if cmd:
        import shutil, safe
        tmp = os.path.join(reel, '.safe')
        r = run(*cmd, '--out', tmp, '--at', ','.join(f'{t:.2f}' for t in info['sheet_times']), '--boxes')
        data = safe.read(os.path.join(tmp, 'boxes.json')); shutil.rmtree(tmp, ignore_errors=True)
        if data is None: warn.append('the safe area was not measured, because the stills for it did not render: ' + ((r.stderr or r.stdout).strip()[-200:] or 'no message'))
        else:
            said, measured = safe.outside(data); info['safe_area'] = {'texts_measured': measured, 'outside': said}
            if said: warn.append('text outside the safe area (x 70 to 1010, y 270 to 1248), where the app covers it: ' + '; '.join(said[:6])
                                 + (f' and {len(said) - 6} more' if len(said) > 6 else '') + '. Move it in, or draw it with decor: true if it is decoration.')
            elif not measured: warn.append('no text was measured against the safe area: the scenes draw their text without kit.drawText or kit.number and do not report it with kit.rec. Check the sheet by eye.')
    return {'ok': not bad, 'problems': bad, 'warnings': warn, **info}

if __name__ == '__main__':
    av = sys.argv[1:]; bi = av.index('--brand') if '--brand' in av else -1
    args = [a for i, a in enumerate(av) if not a.startswith('--') and i != bi + 1] if bi >= 0 and bi + 1 < len(av) else []
    if len(args) != 1: sys.exit(__doc__)
    reel, brand = os.path.abspath(args[0]), os.path.abspath(av[bi + 1])
    res = check(reel, brand)
    with open(os.path.join(reel, 'check.json'), 'w', encoding='utf8', newline='\n') as f: f.write(json.dumps(res, ensure_ascii=False, indent=1) + '\n')
    print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(0 if res['ok'] else 1)
