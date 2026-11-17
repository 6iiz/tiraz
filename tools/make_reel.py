"""make_reel.py · one reel folder -> stills to look at first, then the finished reel.

  python make_reel.py <reel folder> --brand <brand folder> --stills 0.5,3,6      a few moments as images and one sheet, before the long render
  python make_reel.py <reel folder> --brand <brand folder> [--sfx <sound folder>]      the whole reel, then the check
  python make_reel.py <reel folder> --brand <brand folder> --timeline      print when each scene starts and where each sound falls, then stop

A reel folder holds spec.json and whatever it names (film frames, a narration, a word-timing file). The scene that reads the spec is:
"scene" in the spec when it is a path starting with / (for example /brand/look/parts/line.js); else /engine/scenes/sequence.js when the spec has
"scenes"; else <reel folder>/scene.js when that file exists (choreography written for this reel alone). Anything else stops with a sentence.
The reel is exactly as long as its scenes: nothing is added at the end, so the ending is the last scene of the sequence.
"cover": <seconds> in the spec picks the cover moment (default 1.0). The finished reel lands in <reel folder>/publish/ (reel.mp4, cover.jpg);
caption.txt is written by hand beside them. Sound comes from the kit's sound engine by kind (see assemble.py); --sfx or <brand folder>/sfx adds the
customer's own files. After the full render reel_check.py runs and writes check.json and sheet.jpg. Nothing here publishes anything.
"""
import json, os, re, shutil, subprocess, sys
sys.stdout.reconfigure(encoding='utf8')
KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(KIT, 'tools'))
import timeline as TL

def run(cmd, what):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf8', errors='replace')
    if r.returncode: sys.exit(f'{what} failed:\n' + (r.stderr or r.stdout).strip()[-1500:])
    return r.stdout.strip()
def clear(folder, pattern):                                    # removes only this tool's own earlier output
    if os.path.isdir(folder):
        for f in os.listdir(folder):
            if re.fullmatch(pattern, f): os.remove(os.path.join(folder, f))

def which_scene(S, reel):
    return TL.scene_url(S, reel) or sys.exit(f'the reel has no scene: write {os.path.join(reel, "scene.js")}, or give "scenes" (a list of scenes) in spec.json.')

def main():
    args = sys.argv[1:]; opt = lambda k: args[args.index(k) + 1] if k in args and args.index(k) + 1 < len(args) else None
    pos = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] not in ('--brand', '--stills', '--sfx'))]
    if len(pos) != 1 or not opt('--brand'): sys.exit(__doc__)
    reel, brand = os.path.abspath(pos[0]), os.path.abspath(opt('--brand')); sp = os.path.join(reel, 'spec.json')
    for f in (sp, os.path.join(brand, 'brand.json')):
        if not os.path.isfile(f): sys.exit(f'not found: {f}')
    try: S = json.load(open(sp, encoding='utf8'))
    except Exception as e: sys.exit(f'spec.json is not valid JSON: {e}')
    scene = which_scene(S, reel); tl = TL.timeline(S, reel, brand, KIT)
    if '--timeline' in args:
        print('\n'.join(TL.lines(S, tl)))
        for p in tl['problems']: print('problem: ' + p)
        sys.exit(1 if tl['problems'] else 0)
    if tl['problems']: sys.exit('the reel timeline has problems:\n- ' + '\n- '.join(tl['problems']))
    # every scene module must exist before the long render starts
    wanted = [('the reel', scene)] + [(f'scene {s["index"] + 1}', s['scene']) for s in tl['scenes'] if s and s['scene'] and 'scenes' in S] + ([('"over"', tl['over']['scene'])] if tl.get('over') and tl['over']['scene'] else []) + [(f'{who} (its joint)', u) for who, u in TL.joints(S)]
    missing = []
    for who, u in wanted:
        if not isinstance(u, str) or not u.startswith('/'): missing.append(f'{who} needs "scene": a path starting with / (for example /brand/look/parts/line.js)'); continue
        f = TL.resolve(u, reel, reel, brand, KIT)
        if not os.path.isfile(f): missing.append(f'{who} uses the scene module {u}, but the file {f} does not exist: write it or fix the path')
    if missing: sys.exit('the scenes are not all there:\n- ' + '\n- '.join(missing))
    render = TL.render_cmd(S, reel, brand, KIT)

    if opt('--stills'):
        out = os.path.join(reel, 'stills'); clear(out, r'at_[\d.]+\.png|sheet\.jpg|boxes\.json')
        run(render + ['--out', out, '--at', opt('--stills'), '--png', '--boxes'], 'the stills')
        from PIL import Image
        import safe
        shots = sorted(f for f in os.listdir(out) if f.startswith('at_')); sheet = Image.new('RGB', (540 * len(shots), 960))
        for i, f in enumerate(shots): sheet.paste(Image.open(os.path.join(out, f)).convert('RGB').resize((540, 960), Image.LANCZOS), (540 * i, 0))
        sheet.save(os.path.join(out, 'sheet.jpg'), quality=90)
        # every text the kit drew at these moments, held against the safe area (text a scene drew by itself is not measured unless it reported it)
        said, measured = safe.outside(safe.read(os.path.join(out, 'boxes.json')) or {})
        print(json.dumps({'stills': os.path.join(out, 'sheet.jpg'), 'moments': opt('--stills'), 'files': [os.path.join(out, f) for f in shots],
                          'texts_measured': measured, 'outside_safe_area': said}, ensure_ascii=False, indent=1))
        if said: print('outside the safe area (x 70 to 1010, y 270 to 1248). Move each one in, or draw it with decor: true if it is decoration:\n- ' + '\n- '.join(said))
        elif not measured: print('no text was measured against the safe area: these scenes draw their text without kit.drawText or kit.number and do not report it with kit.rec. Check the stills by eye.')
        return

    frames, pub = os.path.join(reel, 'frames'), os.path.join(reel, 'publish'); clear(frames, r'\d{5}\.jpg'); os.makedirs(pub, exist_ok=True)
    print(run(render + ['--out', frames], 'the render'), flush=True)
    sfx = opt('--sfx') or (os.path.join(brand, 'sfx') if os.path.isdir(os.path.join(brand, 'sfx')) else None)     # optional: the customer's own sound files
    print(run([sys.executable, os.path.join(KIT, 'assemble.py'), '--frames', frames, '--spec', sp, '--brand', os.path.join(brand, 'brand.json'),
               '--out', os.path.join(pub, 'reel.mp4')] + (['--sfx', sfx] if sfx else []), 'the assembly'), flush=True)
    tmp = os.path.join(reel, '.cover'); t = float(S.get('cover', 1.0))
    run(render + ['--out', tmp, '--at', str(t)], 'the cover'); shutil.move(os.path.join(tmp, 'at_' + f'{t:.2f}'.zfill(6) + '.jpg'), os.path.join(pub, 'cover.jpg')); shutil.rmtree(tmp)
    r = subprocess.run([sys.executable, os.path.join(KIT, 'tools', 'reel_check.py'), reel, '--brand', brand], capture_output=True, text=True, encoding='utf8', errors='replace')
    print(r.stdout.strip() or r.stderr.strip()); sys.exit(r.returncode)

if __name__ == '__main__': main()
