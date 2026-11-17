# check_device.py · can this machine render our Blender (Cycles) films?   python check_device.py   -> JSON on stdout
# Reads only: GPU name and memory, RAM, free disk, Blender install. Changes nothing, sends nothing.
# Verdicts: ok / weak / unfit. The thresholds are our first estimate (2026-11-16), not measured on customer machines yet.
import ctypes, glob, json, os, platform, re, shutil, subprocess, sys
sys.stdout.reconfigure(encoding='utf8')
def run(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=20).stdout.strip()
    except Exception: return ''
def ram_gb():
    if os.name == 'nt':
        class M(ctypes.Structure):
            _fields_ = [('len', ctypes.c_ulong), ('load', ctypes.c_ulong)] + [(n, ctypes.c_ulonglong) for n in ('total', 'avail', 'tp', 'ap', 'tv', 'av', 'ex')]
        m = M(); m.len = ctypes.sizeof(M); ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m)); return m.total / 2**30
    if sys.platform == 'darwin': return int(run(['sysctl', '-n', 'hw.memsize']) or 0) / 2**30
    return os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES') / 2**30
def gpus():
    out = run(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader,nounits'])
    if out: return [{'name': a.strip(), 'vram_gb': round(float(b) / 1024, 1), 'kind': 'nvidia'} for a, b in (l.split(',') for l in out.splitlines())]
    if sys.platform == 'darwin':
        chip = run(['sysctl', '-n', 'machdep.cpu.brand_string'])
        return [{'name': chip, 'vram_gb': None, 'kind': 'apple' if 'Apple' in chip else 'other'}]
    if os.name == 'nt':                                             # no NVIDIA tool: names only, Windows reports the memory of other cards unreliably
        out = run(['powershell', '-NoProfile', '-Command', '(Get-CimInstance Win32_VideoController).Name'])
        return [{'name': n.strip(), 'vram_gb': None, 'kind': 'amd' if re.search('radeon|amd', n, re.I) else 'intel' if 'intel' in n.lower() else 'other'} for n in out.splitlines() if n.strip()]
    return []
def blender():
    p = shutil.which('blender')
    cands = [p] if p else sorted(glob.glob(r'C:\Program Files\Blender Foundation\Blender*\blender.exe')) + glob.glob('/Applications/Blender.app/Contents/MacOS/Blender')
    if not cands: return None
    v = re.search(r'Blender (\d+\.\d+)', run([cands[-1], '--version']))
    return {'path': cands[-1], 'version': v.group(1) if v else None}
ram, g, b = ram_gb(), gpus(), blender(); free = shutil.disk_usage(os.path.expanduser('~')).free / 2**30
best = max(g, key=lambda x: x['vram_gb'] or 0) if g else None; why = []
if not best or best['kind'] in ('intel', 'other'): verdict = 'unfit'; why.append('no dedicated graphics card found')
elif best['kind'] == 'apple': verdict = 'ok' if ram >= 16 else 'weak'; why.append(f'Apple chip with {ram:.0f} GB shared memory')
elif best['vram_gb'] is None: verdict = 'weak'; why.append('graphics memory could not be read; ask the owner for the card model')
elif best['vram_gb'] >= 8: verdict = 'ok'
elif best['vram_gb'] >= 4: verdict = 'weak'; why.append(f"{best['vram_gb']} GB graphics memory: renders, slowly, large scenes may fail")
else: verdict = 'unfit'; why.append(f"{best['vram_gb']} GB graphics memory is below what the scenes need")
if ram < 8: verdict = 'unfit'; why.append(f'{ram:.0f} GB RAM')
elif ram < 16 and verdict == 'ok': verdict = 'weak'; why.append(f'{ram:.0f} GB RAM')
if free < 20: why.append(f'only {free:.0f} GB free disk; one film writes several GB of frames')
if not b: why.append('Blender is not installed (free, blender.org); needed before any 3D work')
print(json.dumps({'verdict': verdict, 'why': why, 'os': platform.platform(), 'ram_gb': round(ram, 1), 'free_disk_gb': round(free), 'gpus': g, 'blender': b}, ensure_ascii=False, indent=1))
