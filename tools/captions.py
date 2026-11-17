"""captions.py · caption groups from a narration's word timings.

  python captions.py build <words.json> --out captions.json [--script script.txt] [--max-chars 24] [--max-lines 2]
  python captions.py check captions.json [--max-chars 24] [--max-lines 2]

words.json is what voice/vo.py writes: [{"w": "word", "s": start, "e": end}, ...] in seconds.
build groups the words into captions of one or two lines. A group ends at a pause of 0.35 s or more, after sentence punctuation,
at a break the script forces with "/", or when it would be too long. Lines never split a word, never end on a short function word,
keep a number with its unit, and are balanced. With --script, "*word*" marks a key word.
The grouping rules are written a second time in engine/captions.js for the browser; tools/test_captions.py checks that both agree,
so a rule changed here must be changed there in the same words.
check reads the result and reports, in plain sentences, what would be hard to read. Exit code 1 when it finds anything.
"""
import argparse, difflib, json, re, sys
sys.stdout.reconfigure(encoding='utf8')
sys.stderr.reconfigure(encoding='utf8')

PAUSE, MAX_CHARS, MAX_LINES = 0.35, 24, 2
LEAD_IN, TAIL = 0.06, 0.4
MIN_SHOWN, MAX_RATE = 0.6, 17

# ---------- text helpers (kept identical to engine/captions.js) ----------
DIAC = re.compile(r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]')      # Arabic marks and the tatweel stretch
_MAP = str.maketrans({'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي'})
def norm(w): return ''.join(ch for ch in DIAC.sub('', w).translate(_MAP) if ch.isalnum())
def text_len(w): return len(DIAC.sub('', w))
_LEAD = r'\s"“”«»()\[\]'
def trim(w): return re.sub(r'^[' + _LEAD + r']+|[\s.,،؟?!…؛;:"“”«»()\[\]]+$', '', w)
def ends_sentence(w): return re.search(r'[،,.؟?!…؛;:]$', re.sub(r'[' + _LEAD + r']+$', '', w)) is not None
def is_number(w): return re.fullmatch(r'[0-9٠-٩۰-۹]+([.,٫٬][0-9٠-٩۰-۹]+)*', trim(w)) is not None
FUNC = {norm(x) for x in 'من في على إلى عن مع يا ما لا هل لو إذا بس أو و ثم حتى كل أي هذا هذه هاد هاي اللي يلي إنو أن إن قد'.split()}
def glued(w): return norm(w) in FUNC or is_number(w)         # a function word or a number never ends a line

# ---------- grouping ----------
def atoms_of(words):
    atoms, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        if i == len(words) - 1 or not glued(w['w']): atoms.append(cur); cur = []
    return atoms

def span(atoms, i, j):
    words = chars = 0
    for a in range(i, j):
        for w in atoms[a]: words += 1; chars += text_len(w['w'])
    return words, chars + words - 1

def split_lines(atoms, max_chars, max_lines, alone):
    """Best way to break one group into lines: balanced, none over the limit, no lone word on a line."""
    n = len(atoms); total = span(atoms, 0, n)[1]; best = None
    for L in range(1, min(max_lines, n) + 1):
        ideal = total / L; memo = {}
        def line_cost(i, j):
            words, ln = span(atoms, i, j)
            c = (ln - ideal) ** 2 + 1000 * max(0, ln - max_chars)
            if words == 1 and not (n == 1 and alone): c += 2000
            return c
        def f(i, k):
            if k == 1: return line_cost(i, n), []
            if (i, k) in memo: return memo[(i, k)]
            b = None
            for j in range(i + 1, n - (k - 1) + 1):
                rc, rcuts = f(j, k - 1); cost = line_cost(i, j) + rc
                if b is None or cost < b[0]: b = (cost, [j] + rcuts)
            memo[(i, k)] = b
            return b
        rc, cuts = f(0, L); cost = rc + 25 * (L - 1)
        if best is None or cost < best[0]: best = (cost, cuts)
    lines, frm = [], 0
    for c in best[1] + [n]:
        lines.append([w for a in atoms[frm:c] for w in a]); frm = c
    return best[0], lines

def group_phrase(words, max_chars, max_lines):
    """A phrase becomes one group if it fits, else the cheapest set of balanced groups."""
    atoms = atoms_of(words); n = len(atoms); cap = max_chars * max_lines; alone = len(words) == 1
    inf = float('inf'); g = [inf] * (n + 1); frm = [0] * (n + 1); made = [None] * (n + 1); g[0] = 0
    for j in range(1, n + 1):
        for i in range(j - 1, -1, -1):
            ln = span(atoms, i, j)[1]
            if ln > cap and j - i > 1: break
            cost, lines = split_lines(atoms[i:j], max_chars, max_lines, alone)
            cost = g[i] + 40 + cost + 0.5 * max(0, cap - ln) ** 2
            if cost < g[j]: g[j] = cost; frm[j] = i; made[j] = lines
    out, j = [], n
    while j > 0: out.insert(0, made[j]); j = frm[j]
    return out

def group_words(words, max_chars=MAX_CHARS, max_lines=MAX_LINES, pause=PAUSE):
    ws = [{'w': x['w'], 's': x['s'], 'e': x['e'], 'key': bool(x.get('key')), 'brk': bool(x.get('brk'))} for x in words if x['w']]
    phrases, cur = [], []
    for i, w in enumerate(ws):
        cur.append(w)
        nxt = ws[i + 1] if i + 1 < len(ws) else None
        if nxt is None or ends_sentence(w['w']) or nxt['s'] - w['e'] >= pause - 1e-9 or nxt['brk']: phrases.append(cur); cur = []
    groups = []
    for p in phrases:
        for lines in group_phrase(p, max_chars, max_lines):
            clean = [[{'w': w['w'], 's': w['s'], 'e': w['e'], 'key': w['key']} for w in l] for l in lines]
            groups.append({'t0': max(0, clean[0][0]['s'] - LEAD_IN), 't1': 0, 'lines': clean})
    for i, g in enumerate(groups):                                  # a group never starts before the word before it is finished
        if i: g['t0'] = min(g['lines'][0][0]['s'], max(g['t0'], groups[i - 1]['lines'][-1][-1]['e']))
    for i, g in enumerate(groups):
        last_e = g['lines'][-1][-1]['e']
        nxt = groups[i + 1]['t0'] if i + 1 < len(groups) else float('inf')
        g['t1'] = max(last_e, min(nxt, last_e + TAIL))             # never cut a word short
    for g in groups: g['t0'] = round(g['t0'], 3); g['t1'] = round(g['t1'], 3)
    return {'groups': groups}

# ---------- the script: "*key*" words and "/" breaks ----------
def parse_script(text):
    """-> [{'w', 'key', 'brk'}] in reading order."""
    out, key, brk = [], False, False
    for tok in text.replace('/', ' / ').split():
        if tok == '/': brk = True; continue
        lead, trail = len(tok) - len(tok.lstrip('*')), len(tok) - len(tok.rstrip('*'))
        if lead == len(tok): key = not key if lead % 2 else key; continue   # a lone "*" only toggles
        if lead % 2: key = not key
        out.append({'w': tok.strip('*'), 'key': key, 'brk': brk}); brk = False
        if trail % 2: key = not key
    return out

def apply_script(words, script):
    """Gives the timed words the script's spelling, key marks and forced breaks; stops with a sentence where the two disagree."""
    sw = parse_script(script)
    a = [norm(x['w']) for x in sw]; b = [norm(x['w']) for x in words]
    ops = difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
    out = [dict(x) for x in words]
    for tag, i1, i2, j1, j2 in ops:
        if tag == 'equal':
            for k in range(i2 - i1): out[j1 + k].update(w=sw[i1 + k]['w'], key=sw[i1 + k]['key'], brk=sw[i1 + k]['brk'])
        elif tag == 'replace' and i2 - i1 == j2 - j1 and all(difflib.SequenceMatcher(None, a[i1 + k], b[j1 + k]).ratio() >= 0.6 for k in range(i2 - i1)):
            for k in range(i2 - i1): out[j1 + k].update(w=sw[i1 + k]['w'], key=sw[i1 + k]['key'], brk=sw[i1 + k]['brk'])   # a spelling variant
        else:
            sa = ' '.join(x['w'] for x in sw[i1:i2][:4]) or '(nothing)'; sb = ' '.join(x['w'] for x in words[j1:j2][:4]) or '(nothing)'
            raise SystemExit(f'The script and the timings stop agreeing at script word {i1 + 1} and timed word {j1 + 1}: '
                             f'the script says "{sa}" but the timings have "{sb}". Fix the script or run the narration again.')
    return out

# ---------- commands ----------
def load_words(path):
    try: data = json.load(open(path, encoding='utf8'))
    except FileNotFoundError: raise SystemExit(f'{path} does not exist. Give the words file the narration tool wrote (voice/vo.py).')
    except json.JSONDecodeError as e: raise SystemExit(f'{path} is not valid JSON ({e}).')
    if not isinstance(data, list) or not data: raise SystemExit(f'{path} must be a list of words like {{"w": "word", "s": 0.0, "e": 0.4}}.')
    bad, prev = [], 0.0
    for i, x in enumerate(data):
        if not isinstance(x, dict) or not isinstance(x.get('w'), str) or not isinstance(x.get('s'), (int, float)) or not isinstance(x.get('e'), (int, float)):
            bad.append(f'word {i + 1} needs "w" (text), "s" and "e" (seconds)')
        elif x['e'] < x['s']: bad.append(f'word {i + 1} ("{x["w"]}") ends before it starts')
        elif x['s'] + 1e-9 < prev: bad.append(f'word {i + 1} ("{x["w"]}") starts before the word before it')
        else: prev = x['s']
    if bad: raise SystemExit(f'{path} has problems: ' + '; '.join(bad[:5]) + ('.' if len(bad) <= 5 else f'; and {len(bad) - 5} more.'))
    return data

def build(a):
    words = load_words(a.words)
    if a.script:
        try: script = open(a.script, encoding='utf8').read()
        except FileNotFoundError: raise SystemExit(f'{a.script} does not exist.')
        words = apply_script(words, script)
    res = group_words(words, a.max_chars, a.max_lines)
    json.dump(res, open(a.out, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(f'{len(res["groups"])} groups from {len(words)} words -> {a.out}')

def check(a):
    try: data = json.load(open(a.captions, encoding='utf8'))
    except FileNotFoundError: raise SystemExit(f'{a.captions} does not exist. Run build first.')
    except json.JSONDecodeError as e: raise SystemExit(f'{a.captions} is not valid JSON ({e}).')
    groups = data.get('groups') if isinstance(data, dict) else None
    if not groups: raise SystemExit(f'{a.captions} has no "groups". Run build to make it.')
    problems = []
    for i, g in enumerate(groups):
        name = 'Group %d at %.2f s ("%s")' % (i + 1, g['t0'], ' '.join(w['w'] for l in g['lines'] for w in l)[:30])
        shown = g['t1'] - g['t0']
        if shown < MIN_SHOWN: problems.append(f'{name} is on screen for only {shown:.2f} s: too short to read ({MIN_SHOWN} s is the least).')
        chars = sum(text_len(w['w']) for l in g['lines'] for w in l) + sum(len(l) - 1 for l in g['lines'])
        if shown > 0 and chars / shown > MAX_RATE: problems.append(f'{name} needs {chars / shown:.1f} characters per second to read; over {MAX_RATE} is too fast.')
        if len(g['lines']) > a.max_lines: problems.append(f'{name} has {len(g["lines"])} lines; the limit is {a.max_lines}.')
        for l in g['lines']:
            ln = sum(text_len(w['w']) for w in l) + len(l) - 1
            if ln > a.max_chars: problems.append(f'{name} has a line of {ln} characters; the limit is {a.max_chars}.')
        words = [w for l in g['lines'] for w in l]
        if len(words) == 1:
            prev = groups[i - 1]['lines'][-1][-1] if i else None; nxt = groups[i + 1]['lines'][0][0] if i + 1 < len(groups) else None
            apart = lambda p, w: p is None or ends_sentence(p['w']) or w['s'] - p['e'] >= PAUSE - 1e-9
            if not (apart(prev, words[0]) and (nxt is None or ends_sentence(words[0]['w']) or nxt['s'] - words[0]['e'] >= PAUSE - 1e-9)):
                problems.append(f'{name} is a single word cut out of a sentence; it should have a neighbour.')
        elif any(len(l) == 1 for l in g['lines']):
            problems.append(f'{name} leaves one word alone on a line.')
    for p in problems: print(p)
    print(f'{len(groups)} groups checked: ' + (f'{len(problems)} problem(s).' if problems else 'nothing to fix.'))
    sys.exit(1 if problems else 0)

def main():
    ap = argparse.ArgumentParser(description='Caption groups from word timings.'); sub = ap.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build'); b.add_argument('words'); b.add_argument('--out', required=True); b.add_argument('--script')
    c = sub.add_parser('check'); c.add_argument('captions')
    for p in (b, c): p.add_argument('--max-chars', type=int, default=MAX_CHARS); p.add_argument('--max-lines', type=int, default=MAX_LINES)
    a = ap.parse_args()
    {'build': build, 'check': check}[a.cmd](a)

if __name__ == '__main__': main()
