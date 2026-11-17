# doctor.py · is this machine ready for the kit?   python doctor.py   -> JSON on stdout: what is there, what is missing, how to get it.
# Reads only. Installs nothing: the person decides. The 3D check is separate (check_device.py), asked only if they want 3D.
import importlib.util, json, os, shutil, subprocess, sys
sys.stdout.reconfigure(encoding='utf8')
KIT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
def ver(cmd):
    try: return (subprocess.run(cmd, capture_output=True, text=True, timeout=20).stdout.strip().splitlines() or [''])[0]
    except Exception: return None
have, missing = {}, []
def need(name, ok, detail, fix):
    have[name] = detail if ok else None
    if not ok: missing.append({'what': name, 'fix': fix})
node = ver(['node', '--version']); major = int(node[1:].split('.')[0]) if node and node[1:].split('.')[0].isdigit() else 0
need('node', major >= 18, node, 'install Node.js 18 or newer from nodejs.org')
need('python', sys.version_info >= (3, 10), sys.version.split()[0], 'install Python 3.10 or newer from python.org')
ff = ver(['ffmpeg', '-version']); need('ffmpeg', bool(ff), ff, 'install ffmpeg and put it on PATH (ffmpeg.org)')
for mod, pip in (('numpy', 'numpy'), ('soundfile', 'soundfile'), ('PIL', 'pillow')):
    need('python:' + pip, importlib.util.find_spec(mod) is not None, 'installed', f'pip install {pip}')
need('playwright', os.path.isdir(os.path.join(KIT, 'node_modules', 'playwright')), 'installed in the kit', f'run  npm install  in {KIT}')
chrome = next((p for p in (os.environ.get('TIRAZ_CHROMIUM'), 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') if p and os.path.exists(p)), None)
have['browser'] = chrome or 'none found: Playwright will use its own Chromium (run  npx playwright install chromium  in the kit folder)'
have['elevenlabs_key'] = 'set' if os.environ.get('ELEVENLABS_API_KEY') else 'not set (only needed for narration)'      # presence only, never the value
have['webfont'] = 'ready' if all(importlib.util.find_spec(m) for m in ('fontTools', 'brotli')) else 'not ready (only needed to write a site\'s font again as WOFF2:  pip install fonttools brotli)'
print(json.dumps({'ready': not missing, 'missing': missing, 'have': have, 'kit': KIT}, ensure_ascii=False, indent=1))
