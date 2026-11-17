"""timeline.py · when does each scene of a reel start, and where does each sound fall, in reel seconds?

  python timeline.py <reel folder> --brand <brand folder>

Prints one line per scene (index, scene url, start, end), one line per sound cue (reel time, kind or name, where) and the total.
Problems (a scene without "duration", a spec file that is missing) are printed as sentences and give exit code 1.

Paths inside a spec: /reel/... is a file in the reel folder, /brand/... a file in the brand folder, any other path starting with / is a file in
the kit (for example /engine/scenes/sequence.js), and a path with no leading slash is relative to the folder of the spec file that names it.

A spec with "scenes" is a sequence. Scene i+1 starts at start[i] + duration[i] - gap[i]. The gap is spec.transitions[i] when it is there and not
null, else spec.transition, else a cut (0 seconds). An entry may be a named transition ({ "name": "fade" }) or a brand's own joint module
({ "joint": "/brand/look/joint.js" }); with no "duration" of its own it takes spec.transition's, else 0.5.
Any other spec is one scene: its "duration", or "n" / "fps". A sound cue ("sfx") inside a scene's spec uses that scene's own seconds; cues() adds the
scene's start.

What a viewer reads (read_by_viewer). The rule is one word: "says".
  - In every scene's spec, the words and numbers a viewer reads are written inside its "says" object, for example
        { "duration": 3.2, "at": -0.3, "says": { "label": "السعر", "was": 85, "now": 69, "unit": "ريال" } }
    EVERY string and EVERY number inside "says" (at any depth, lists included) is read and checked. Nothing outside it is.
  - Everything else in a spec is control (times, positions, sizes, switches) and is never read as something a viewer sees.
  - "icon" ids are collected wherever they are, to check that they exist.
  - A string outside "says" that holds Arabic letters or digits is reported as `outside`: it looks like a viewer's text that escaped the check.
"""
import json, os, sys

KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
DEFAULT_GAP = {'name': 'fade', 'duration': 0}        # nothing written: scenes join with a cut (kept the same as engine/scenes/sequence.js)
NAMED_GAP = 0.5                                      # a named transition or a joint with no "duration"
SKIP_STR = {'scene', 'specUrl', 'kind', 'tag', 'icon', 'image', 'frames', 'anchors', 'voice', 'words', 'font', 'family', 'align', 'ease'}
SKIP_TREE = {'transition', 'transitions', 'sfx'}        # names and numbers here are mechanics, not words
NO_DURATION = 'has no "duration": add "duration" (seconds) to its entry in "scenes", or to its spec'


def resolve(url, spec_dir, reel_dir, brand_dir, kit_dir):
    """A path written in a spec -> a file on disk."""
    if url.startswith('/reel/'): return os.path.join(reel_dir, *url[6:].split('/'))
    if url.startswith('/brand/'): return os.path.join(brand_dir, *url[7:].split('/'))
    if url.startswith('/'): return os.path.join(kit_dir, *url[1:].split('/'))
    return os.path.normpath(os.path.join(spec_dir, *url.split('/')))


def scene_url(spec, reel_dir):
    """The scene module that reads a reel's spec: "scene" in the spec when it is a path starting with /, else the sequencer when the spec
    has "scenes", else <reel>/scene.js when that file exists. None when the reel has no scene."""
    if isinstance(spec.get('scene'), str) and spec['scene'].startswith('/'): return spec['scene']
    if 'scenes' in spec: return '/engine/scenes/sequence.js'
    if os.path.isfile(os.path.join(reel_dir, 'scene.js')): return '/reel/scene.js'
    return None

def render_cmd(spec, reel_dir, brand_dir, kit_dir):
    """The renderer's command for a reel, without --out and without the moments: the caller adds those. None when the reel has no scene."""
    scene = scene_url(spec, reel_dir)
    if not scene: return None
    return ['node', os.path.join(kit_dir, 'engine', 'render.mjs'), '--root', kit_dir, '--mount', 'brand=' + brand_dir, '--mount', 'reel=' + reel_dir,
            '--page', f'engine/index.html?scene={scene}&brand=/brand/brand.json&spec=/reel/spec.json']

def _num(v): return isinstance(v, (int, float)) and not isinstance(v, bool)


def _gap(spec, i):
    tr = None
    trs = spec.get('transitions')
    if isinstance(trs, list) and i < len(trs) and trs[i] is not None: tr = trs[i]
    if tr is None: tr = spec.get('transition')
    if tr is None: tr = DEFAULT_GAP
    base = spec.get('transition') if isinstance(spec.get('transition'), dict) else {}
    if isinstance(tr, str): tr = {'name': tr}
    if not isinstance(tr, dict): tr = DEFAULT_GAP
    named = tr.get('name') or tr.get('joint')                    # a named transition or a brand's joint with no length lasts NAMED_GAP seconds
    d = tr.get('duration', base.get('duration', NAMED_GAP if named else DEFAULT_GAP['duration']))
    return {'name': tr.get('joint') or tr.get('name', DEFAULT_GAP['name']), 'duration': d if _num(d) else None, 'joint': tr.get('joint')}

def joints(spec):
    """[(where, url)] for every joint module a sequence names (a brand's own way of joining two scenes)."""
    out = []
    if isinstance(spec.get('transition'), dict) and spec['transition'].get('joint') is not None: out.append(('"transition"', spec['transition']['joint']))
    for i, tr in enumerate(spec.get('transitions') or []):
        if isinstance(tr, dict) and tr.get('joint') is not None: out.append((f'transition {i + 1}', tr['joint']))
    return out


def _load(path, what, problems):
    try:
        with open(path, encoding='utf8') as f: v = json.load(f)
    except FileNotFoundError: problems.append(f'{what} names the spec file {path}, which is not there: create it or fix the path.'); return None
    except Exception as e: problems.append(f'{what}: {path} is not valid JSON ({e}).'); return None
    if not isinstance(v, dict): problems.append(f'{what}: {path} must hold a JSON object.'); return None
    return v


def timeline(spec, reel_dir, brand_dir, kit_dir, spec_dir=None):
    spec_dir = spec_dir or reel_dir
    problems, scenes, transitions = [], [], []
    tl = {'total': None, 'scenes': scenes, 'transitions': transitions, 'problems': problems, 'over': None}
    over = spec.get('over')
    if isinstance(over, dict):                                  # a persistent layer: it has no time of its own, but its words and cues count
        o, f = over.get('spec') if isinstance(over.get('spec'), dict) else None, None
        if o is None and isinstance(over.get('specUrl'), str):
            f = resolve(over['specUrl'], spec_dir, reel_dir, brand_dir, kit_dir); o = _load(f, '"over"', problems)
        tl['over'] = {'scene': over.get('scene'), 'spec': o or {}, 'spec_file': f}
    if isinstance(spec.get('scenes'), list):
        items, kind_ok = spec['scenes'], True
        if not items: problems.append('"scenes" is empty: a sequence needs at least one scene.')
        starts, ends, cur = [], [], 0.0
        for i, it in enumerate(items):
            where = f'scene {i + 1} ({it.get("scene") if isinstance(it, dict) else "?"})'
            if not isinstance(it, dict): problems.append(f'{where} must be an object with "scene" and "spec" or "specUrl".'); scenes.append(None); continue
            cs, sf = it.get('spec') if isinstance(it.get('spec'), dict) else {}, None
            if not cs and isinstance(it.get('specUrl'), str):
                sf = resolve(it['specUrl'], spec_dir, reel_dir, brand_dir, kit_dir); cs = _load(sf, where, problems) or {}
            d = it.get('duration', cs.get('duration'))
            if not _num(d) or d <= 0: problems.append(f'{where} {NO_DURATION}.'); d = None
            scenes.append({'index': i, 'scene': it.get('scene'), 'start': None, 'end': None, 'duration': d, 'spec': cs, 'spec_file': sf})
        if None in scenes: return tl
        n = len(scenes)
        if isinstance(spec.get('transitions'), list) and len(spec['transitions']) > max(0, n - 1):
            problems.append(f'"transitions" has {len(spec["transitions"])} entries but {n} scenes have only {max(0, n - 1)} gaps.')
        t, ok = 0.0, True
        for i, s in enumerate(scenes):
            if s['duration'] is None: ok = False
            if not ok: continue
            s['start'] = round(t, 4); s['end'] = round(t + s['duration'], 4)
            if i < n - 1:
                g = _gap(spec, i)
                if g['duration'] is None or g['duration'] < 0: problems.append(f'transition {i + 1} (between scene {i + 1} and {i + 2}): "duration" must be a number of seconds, 0 or more.'); ok = False; continue
                t += s['duration'] - g['duration']
                transitions.append({'name': g['name'], 'start': round(t, 4), 'end': round(s['end'], 4)})
        if ok: tl['total'] = scenes[-1]['end']
        return tl
    d = spec.get('duration')
    if not _num(d) and _num(spec.get('n')) and _num(spec.get('fps')) and spec['fps'] > 0: d = spec['n'] / spec['fps']
    d = d if _num(d) and d > 0 else None
    scenes.append({'index': 0, 'scene': spec['scene'] if isinstance(spec.get('scene'), str) else None, 'start': 0.0, 'end': d, 'duration': d, 'spec': {}, 'spec_file': None})
    tl['total'] = d
    return tl


def cues(spec, tl):
    """Every sound cue with its time in reel seconds and a 'where' label. Other fields stay as written."""
    out = []
    def add(lst, offset, label):
        if not isinstance(lst, list): return
        for i, c in enumerate(lst):
            if not isinstance(c, dict): continue
            c = dict(c); c['where'] = f'{label}sound cue {i + 1}'
            if _num(c.get('t')): c['t'] = round(c['t'] + offset, 4)
            out.append(c)
    add(spec.get('sfx'), 0.0, '')
    for s in tl['scenes']:
        if s and s.get('start') is not None and s['spec']: add(s['spec'].get('sfx'), s['start'], f'scene {s["index"] + 1}, ')
    if tl.get('over') and tl['over']['spec']: add(tl['over']['spec'].get('sfx'), 0.0, 'over layer, ')
    return out


def read_by_viewer(spec, tl):
    """(texts, icons, outside): what a viewer reads in the spec and in every child spec. The rule is in the module docstring."""
    texts, icons, outside = [], [], []
    looks_like_text = lambda v: any('\u0600' <= ch <= '\u06ff' for ch in v) or any(ch.isdigit() for ch in v)
    def said(o, key=None):                                        # inside "says": everything counts
        if isinstance(o, dict):
            for k, v in o.items(): said(v, k)
        elif isinstance(o, list):
            for v in o: said(v, key)
        elif isinstance(o, str):
            (icons if key == 'icon' else texts).append(o)
        elif _num(o): texts.append(repr(o))
    def walk(o, key=None):                                        # outside "says": only icons, and text that seems to have escaped
        if isinstance(o, dict):
            for k, v in o.items():
                if k == 'says': said(v)
                elif k not in SKIP_TREE: walk(v, k)
        elif isinstance(o, list):
            for v in o: walk(v, key)
        elif isinstance(o, str):
            if key == 'icon': icons.append(o)
            elif key not in SKIP_STR and not o.startswith(('/', '#')) and looks_like_text(o): outside.append(o)
    walk({k: v for k, v in spec.items() if k != 'scenes'})
    for s in tl['scenes']:
        if s and s['spec']: walk(s['spec'])
    if tl.get('over') and tl['over']['spec']: walk(tl['over']['spec'])
    if isinstance(spec.get('scenes'), list):                    # fields written on a sequence entry itself, beside scene/spec/specUrl/duration
        for it in spec['scenes']:
            if isinstance(it, dict): walk({k: v for k, v in it.items() if k not in ('spec', 'specUrl')})
    return texts, icons, outside


def report(reel, brand):
    sp = os.path.join(reel, 'spec.json')
    if not os.path.isfile(sp): return None, [f'spec.json is not in {reel}']
    try: spec = json.load(open(sp, encoding='utf8'))
    except Exception as e: return None, [f'spec.json is not valid JSON: {e}']
    tl = timeline(spec, reel, brand, KIT); return (spec, tl), tl['problems']


def lines(spec, tl):
    out = []
    for s in tl['scenes']:
        if s: out.append(f'scene {s["index"] + 1}  {s["scene"] or "(the page)"}  start {s["start"]}  end {s["end"]}')
    for c in cues(spec, tl): out.append(f'cue {c["t"]}  {c.get("kind") or c.get("name")}  {c["where"]}')
    out.append(f'total {tl["total"]}' if tl['total'] is not None else 'total unknown (no duration is written)')
    return out


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf8')
    av = sys.argv[1:]; bi = av.index('--brand') if '--brand' in av else -1
    pos = [a for i, a in enumerate(av) if not a.startswith('--') and i != bi + 1]
    if len(pos) != 1 or bi < 0 or bi + 1 >= len(av): sys.exit(__doc__)
    got, problems = report(os.path.abspath(pos[0]), os.path.abspath(av[bi + 1]))
    if got: print('\n'.join(lines(*got)))
    for p in problems: print('problem: ' + p)
    sys.exit(1 if problems else 0)
