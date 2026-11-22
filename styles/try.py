"""styles/try.py · render a style from the library on a sample brand, to look at it before offering it to a customer.

  python styles/try.py <style> [--brand <brand folder>] [--full]

Copies the style's look/ into a scratch brand under out/styles/<style>/brand/look/ (with the sample brand below, or the brand folder you
give), writes the style's preview.json as a reel, and runs tools/make_reel.py: stills and a sheet by default, the whole reel with --full.
Nothing is written into the style itself. The scratch folder is rebuilt on every run.
"""
import json, os, shutil, subprocess, sys
sys.stdout.reconfigure(encoding='utf8')
KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SAMPLE = {                                           # a neutral sample identity: not any real customer
  "name": "مقهى الزاوية", "shortName": "الزاوية", "handle": "@zawiya.cafe", "platform": "instagram", "dir": "rtl",
  "slogan": ["قهوة على مهلك"],
  "colors": { "bg": "#16181D", "text": "#F1EEE6", "accent": "#FF5A36" },
  "fonts": {
    "display": { "family": "Kufam", "file": "/assets/fonts/Kufam/Kufam[wght].ttf", "weight": "400 900" },
    "mono": { "family": "JetBrains Mono", "file": "/assets/fonts/JetBrains Mono/JetBrainsMono[wght].ttf", "weight": "100 800" }
  },
  "logo": { "path": "M32 32H224V224H32ZM72 72V184H184V128H128V72Z", "box": 256, "rule": "evenodd" },
  "look": "/brand/look/"
}

def main():
    a = sys.argv[1:]
    if not a or a[0].startswith('--'): sys.exit(__doc__)
    style = a[0]; src = os.path.join(KIT, 'styles', style, 'look')
    if not os.path.isdir(src): sys.exit(f'no style called "{style}": the styles are the folders in {os.path.join(KIT, "styles")} that hold a look/ folder.')
    out = os.path.join(KIT, 'out', 'styles', style); brand = os.path.join(out, 'brand'); reel = os.path.join(out, 'reel')
    if os.path.isdir(out): shutil.rmtree(out)                 # our own scratch folder, rebuilt each run
    os.makedirs(reel)
    if '--brand' in a:
        given = os.path.abspath(a[a.index('--brand') + 1]); shutil.copytree(given, brand, ignore=shutil.ignore_patterns('look'))
        b = json.load(open(os.path.join(brand, 'brand.json'), encoding='utf8')); b['look'] = '/brand/look/'
    else:
        os.makedirs(brand); b = SAMPLE
    json.dump(b, open(os.path.join(brand, 'brand.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=2)
    shutil.copytree(src, os.path.join(brand, 'look'))
    prev = json.load(open(os.path.join(src, 'preview.json'), encoding='utf8'))
    stills = prev.pop('stills', [0.5, 2, 4]); prev.setdefault('cover', stills[0])
    json.dump(prev, open(os.path.join(reel, 'spec.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=2)
    if '--brand' not in a:                            # the sample brand's facts are the preview's own sample numbers, so the check can pass
        nums = []
        def walk(v):
            if isinstance(v, bool): return
            if isinstance(v, (int, float)): nums.append(v)
            elif isinstance(v, str): nums.extend(float(x) if '.' in x else int(x) for x in __import__('re').findall(r'\d+(?:\.\d+)?', v))
            elif isinstance(v, list): [walk(x) for x in v]
            elif isinstance(v, dict): [walk(x) for x in v.values()]
        for s in prev['scenes']: walk((s.get('spec') or {}).get('says', {}))
        rows = ''.join(f'| sample number in the style preview | {n} | sample for styles/try.py | today |\n' for n in dict.fromkeys(nums))
        open(os.path.join(brand, 'facts.md'), 'w', encoding='utf8').write('# Facts\n\n| Fact | Value | Source | Date |\n|---|---|---|---|\n' + rows)
        os.makedirs(os.path.join(reel, 'publish'), exist_ok=True)
        open(os.path.join(reel, 'publish', 'caption.txt'), 'w', encoding='utf8').write(f'معاينة أسلوب {style}')
    cmd = [sys.executable, os.path.join(KIT, 'tools', 'make_reel.py'), reel, '--brand', brand]
    if '--full' not in a: cmd += ['--stills', ','.join(str(s) for s in stills)]
    sys.exit(subprocess.run(cmd).returncode)

if __name__ == '__main__': main()
