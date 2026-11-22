"""styles/install.py · give a customer's brand a look from the style library, as their own copy.

  python styles/install.py <style> <brand folder>

Copies styles/<style>/look/ into <brand folder>/look/, writes the style's style.md there as look.md (the rules every later part keeps),
records the origin in look/notes.md, and sets "look": "/brand/look/" in brand.json. From then on the look is the customer's: later
changes go into their folder, never back into the library.
It refuses when <brand folder>/look/ already exists, and deletes nothing: move the old look aside yourself if it is to be replaced.
"""
import datetime, json, os, shutil, sys
sys.stdout.reconfigure(encoding='utf8')
KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

def main():
    if len(sys.argv) != 3: sys.exit(__doc__)
    style, brand = sys.argv[1], os.path.abspath(sys.argv[2])
    src = os.path.join(KIT, 'styles', style)
    if not os.path.isdir(os.path.join(src, 'look')): sys.exit(f'no style called "{style}": see {os.path.join(KIT, "styles", "index.json")}.')
    bj = os.path.join(brand, 'brand.json')
    if not os.path.isfile(bj): sys.exit(f'not a brand folder (no brand.json): {brand}. Run the setup skill\'s identity step first.')
    dst = os.path.join(brand, 'look')
    if os.path.exists(dst): sys.exit(f'{dst} already exists. Nothing was changed: move it aside (for example to look-old) and run this again.')
    shutil.copytree(os.path.join(src, 'look'), dst)
    shutil.copyfile(os.path.join(src, 'style.md'), os.path.join(dst, 'look.md'))
    with open(os.path.join(dst, 'notes.md'), 'a', encoding='utf8') as f:
        f.write(f'# Notes\n\n{datetime.date.today().isoformat()}: look installed from the kit\'s style library, style "{style}". '
                'It is this brand\'s own copy now; changes are made here.\n')
    b = json.load(open(bj, encoding='utf8')); b['look'] = '/brand/look/'
    json.dump(b, open(bj, 'w', encoding='utf8'), ensure_ascii=False, indent=2)
    print(f'installed "{style}" into {dst}. Next: python {os.path.join(KIT, "tools", "brand_check.py")} {brand} --preview')

if __name__ == '__main__': main()
