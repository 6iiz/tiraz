"""test_captions.py · the caption grouping gives the same captions in the tool (tools/captions.py) and in the page (engine/captions.js).

  python tools/test_captions.py

The grouping rules are written twice on purpose, once for the command line and once for the browser. This test feeds both the same made-up
narrations (two dialects, a price, short function words, a long sentence, pauses) and fails when they disagree on any line or any time.
It then checks, for each caption style, that every word is on a page for the whole time it is spoken. Needs node. Exit code 1 on any failure.
"""
import json, os, subprocess, sys
sys.stdout.reconfigure(encoding='utf8')
KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(KIT, 'tools'))
import captions as C

def timed(text, start=0.2, word=0.24, gap=0.04, pauses=None):
    """Made-up word timings: each word lasts `word` seconds; `pauses` = {index of a word: silence after it}."""
    out, t = [], start
    for i, w in enumerate(text.split()):
        out.append({'w': w, 's': round(t, 3), 'e': round(t + word, 3)}); t += word + gap + (pauses or {}).get(i, 0)
    return out

FIXTURES = {
    'levant, a price': timed('الخبزات طالعين هلق من الفرن، مين جوعان؟ ستة أرغفة بـ 12 ريال بس اليوم', pauses={4: 0.5}),
    'gulf, fast': timed('جوعان؟ خل الباقي علينا. رسوم التوصيل 5 ريال، وطلبك يوصلك في 30 دقيقة', word=0.18, gap=0.02, pauses={0: 0.4, 3: 0.45}),
    'one long sentence': timed('هذا سطر طويل جداً ما فيه ولا وقفة ولا علامة ترقيم حتى نشوف كيف تنقسم الكلمات على سطور متوازنة من غير ما تنكسر'),
    'one word': timed('تمام'),
    'function words at the edges': timed('من الصبح إلى المسا ما في غير هذا الخبز على الطاولة يا جيران'),
}
STYLES = ['hold', 'karaoke', 'pop', 'plain']

NODE = r"""
import { groupWords, buildPages } from './engine/captions.js';
let raw = ''; process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;
const fixtures = JSON.parse(raw), out = {};
for (const [name, words] of Object.entries(fixtures)) {
  const captions = groupWords(words);
  out[name] = { groups: captions.groups, pages: Object.fromEntries(%s.map((s) => [s, buildPages(captions, s).map((p) => ({ start: p.start, end: p.end, words: p.lines.flat().map((w) => w.i) }))])) };
}
process.stdout.write(JSON.stringify(out));
""" % json.dumps(STYLES)

fails, passed = [], 0
def check(what, ok, why=''):
    global passed
    if ok: passed += 1; print('ok    ' + what)
    else: fails.append(what); print('FAIL  ' + what + (': ' + why if why else ''))

r = subprocess.run(['node', '--input-type=module', '-e', NODE], input=json.dumps(FIXTURES, ensure_ascii=False), capture_output=True, text=True, encoding='utf8', cwd=KIT)
if r.returncode: sys.exit('the page side of the test did not run (is node installed?):\n' + (r.stderr or r.stdout).strip()[-1200:])
page = json.loads(r.stdout)

text = lambda g: ' | '.join(' '.join(w['w'] for w in line) for line in g['lines'])
for name, words in FIXTURES.items():
    tool, js = C.group_words(words)['groups'], page[name]['groups']
    same_text = [text(g) for g in tool] == [text(g) for g in js]
    check(f'{name}: the tool and the page make the same {len(tool)} caption(s)', same_text,
          'tool: ' + ' // '.join(text(g) for g in tool) + '   page: ' + ' // '.join(text(g) for g in js))
    if same_text:
        off = [f'caption {i + 1}: {a["t0"]}..{a["t1"]} against {b["t0"]}..{b["t1"]}' for i, (a, b) in enumerate(zip(tool, js))
               if abs(a['t0'] - b['t0']) > 0.0011 or abs(a['t1'] - b['t1']) > 0.0011]
        check(f'{name}: the same start and end times', not off, '; '.join(off[:3]))
    long = [text(g) for g in tool for line in g['lines'] if sum(C.text_len(w['w']) for w in line) + len(line) - 1 > C.MAX_CHARS and len(line) > 1]
    check(f'{name}: no line of several words is longer than {C.MAX_CHARS} characters', not long, '; '.join(long[:2]))
    ends = [text(g) for g in tool for line in g['lines'][:-1] if C.glued(line[-1]['w'])] + \
           [text(g) for g in tool[:-1] if len(g['lines'][-1]) and C.glued(g['lines'][-1][-1]['w']) and not C.ends_sentence(g['lines'][-1][-1]['w'])]
    check(f'{name}: no line ends on a short function word or a bare number', not ends, '; '.join(ends[:2]))
    for style in STYLES:
        pages = page[name]['pages'][style]; missing = []
        for i, w in enumerate(words):
            if not any(i in p['words'] and p['start'] <= w['s'] + 1e-9 and w['e'] <= p['end'] + 1e-9 for p in pages): missing.append(w['w'])
        check(f'{name}, {style}: every word is on screen for the whole time it is spoken', not missing, 'not covered: ' + ' '.join(missing[:6]))

print(f'\n{passed} checks passed, {len(fails)} failed.')
sys.exit(1 if fails else 0)
