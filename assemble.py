"""assemble.py · rendered frames + sound -> the finished reel (H.264 High, AAC 320k, about -14 LUFS, ready for Instagram and TikTok).

  python assemble.py --frames <dir with 00000.jpg ...> --spec <spec.json> --brand <brand.json> --out <reel.mp4> [--fps 60] [--sfx <folder>]

Sound comes from the spec (a top-level time is seconds from the start of the reel):
  "sfx":   [ { "kind": "pop", "t": 1.2, "gain": -9, "tag"?: "soft", "variant"?: 1, "pan"?, "rate"?, "cut"?, "fade_in"? } ]
           A kind is one of sound/kinds.json; the same kind, tag and variant always give the same file. Risers and swells END on t.
           { "name": "x", ... } asks for one file of your own: a WAV called x in the --sfx folder (or a name its legacy.json maps to a kind).
  --sfx    a folder of your own sounds (make_reel.py passes <brand folder>/sfx). A WAV whose name starts with a kind (pop.wav,
           whoosh-long.wav, bed.wav) is tried before the kit's sounds for that kind; the words after the kind are its tags.
  "bed":   -24  or  { "gain": -24, "variant": 0, "dips": [ { "t": 5.2, "for": 1.5, "by": -8 } ] }   a quiet looping layer under the whole reel
           (null for none). A dip lowers it by that many dB from second t of the reel for that long: under a price being read, before the payoff.
  "voice": "voice.mp3"  (path relative to the spec)  the narration; "voice_gain"?: dB, "voice_at"?: seconds. The bed steps down 12 dB
           while words are spoken ("words": the word-timing file, or the whole length of the voice).
The reel's length is the frames' length. A sound cue ("sfx") inside a scene's spec (in "scenes", or in the file its "specUrl" names) uses that
scene's own seconds: the scene's start in the reel is added (tools/timeline.py). The reel ends where its last scene ends: there is nothing appended.
Needs numpy, soundfile and ffmpeg.
"""
import argparse, json, os, re, subprocess, sys
import numpy as np, soundfile as sf

KIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(KIT, 'sound')); sys.path.insert(0, os.path.join(KIT, 'tools'))
import timeline as TL
SR = 48000
db = lambda d: 10 ** (d / 20)
run = lambda *c: subprocess.run(c, capture_output=True, text=True, encoding='utf8', errors='replace')

def loud(f):
    tail = run('ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr.split('Summary:')[-1]
    return {k: float(v) for k, v in re.findall(r'\b(I|Peak):\s+(-?[\d.]+)', tail)}

def clip(path, rate=1.0):
    """A sound file as mono float samples at 48 kHz. Formats soundfile cannot read (mp3, m4a) go through ffmpeg."""
    try: x, sr = sf.read(path)
    except Exception:
        tmp = path + '.assemble.wav'; r = run('ffmpeg', '-v', 'error', '-y', '-i', path, '-ar', str(SR), '-ac', '1', tmp)
        if r.returncode: sys.exit(f'this sound could not be read: {path}\n' + r.stderr[-300:])
        x, sr = sf.read(tmp); os.remove(tmp)
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = np.interp(np.arange(0, len(x), sr / SR), np.arange(len(x)), x)
    return np.interp(np.arange(0, len(x), rate), np.arange(len(x)), x) if rate != 1.0 else x

def main():
    sys.stdout.reconfigure(encoding='utf8')
    p = argparse.ArgumentParser(); [p.add_argument('--' + k, required=True) for k in ('frames', 'spec', 'brand', 'out')]
    p.add_argument('--fps', type=int, default=60); p.add_argument('--sfx'); a = p.parse_args()
    for f in (a.spec, a.brand):
        if not os.path.isfile(f): sys.exit(f'not found: {f}')
    if a.sfx and not os.path.isdir(a.sfx): sys.exit(f'the --sfx folder does not exist: {a.sfx}')
    S, B = json.load(open(a.spec, encoding='utf8')), json.load(open(a.brand, encoding='utf8')); here = os.path.dirname(os.path.abspath(a.spec))
    frames = sorted(f for f in os.listdir(a.frames) if re.fullmatch(r'\d{5}\.(jpg|png)', f)) if os.path.isdir(a.frames) else []
    if not frames: sys.exit(f'no frames (00000.jpg ...) in {a.frames}')
    ext = frames[0][-3:]; TOTAL = len(frames) / a.fps           # the frames decide the length
    reel_dir, brand_dir = os.path.dirname(os.path.abspath(a.spec)), os.path.dirname(os.path.abspath(a.brand))
    tl = TL.timeline(S, reel_dir, brand_dir, KIT)
    if tl['problems']: sys.exit('the reel timeline has problems:\n- ' + '\n- '.join(tl['problems']))
    if tl['total'] is not None and abs(tl['total'] - TOTAL) > 0.05: sys.exit(f'the spec makes {tl["total"]:.2f} s, but {len(frames)} frames at {a.fps} fps are {TOTAL:.2f} s. Render the whole reel first.')

    MAIN = int(SR * TOTAL); mix = np.zeros((int(SR * TOTAL), 2)); notes, problems = [], []
    def put(x, t, gain, pan=0.0, cut=None, fade_in=0.0):
        x = x * db(gain)
        if cut: x = x[:int(cut * SR)]
        if fade_in: n = min(len(x), int(fade_in * SR)); x[:n] *= np.linspace(0, 1, n)
        k = min(len(x), int(.06 * SR)); x[-k:] *= np.linspace(1, 0, k)
        i = int(t * SR)
        if i < 0: x = x[-i:]; i = 0                                           # a lead-in that would start before the reel starts late instead
        n = min(len(x), len(mix) - i)
        if n <= 0: return
        if n < len(x): x = x[:n].copy(); k = min(n, int(.25 * SR)); x[-k:] *= np.linspace(1, 0, k)       # never cut off at the end
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); mix[i:i + n, 0] += x[:n] * l; mix[i:i + n, 1] += x[:n] * r

    try: import pick
    except Exception as e: pick = None; notes.append(f'the sound engine (sound/pick.py) could not be loaded: {e}')
    def resolve(c, where):
        """A cue -> (file, seconds, ends_on_t), or None after recording what is wrong with it."""
        if not isinstance(c.get('t'), (int, float)): problems.append(f'{where} has no time "t"'); return None
        if c.get('name') and a.sfx and os.path.isfile(os.path.join(a.sfx, c['name'] + '.wav')): return os.path.join(a.sfx, c['name'] + '.wav'), None, False
        if not pick: problems.append(f'{where}: the sound engine is missing, and "{c.get("name") or c.get("kind")}" is not a file in the --sfx folder'); return None
        try: e = pick.pick(c['kind'], c.get('tag'), c.get('variant', 0), a.sfx) if c.get('kind') else pick.pick_legacy(c['name'], c.get('variant'), a.sfx) if c.get('name') else None
        except pick.PickError as err: problems.append(f'{where}: {err}'); return None
        if not e: problems.append(f'{where} needs "kind" (see sound/kinds.json) or "name"'); return None
        return e['path'], e['seconds'], e.get('anchor') == 'end'
    used = 0
    for c in TL.cues(S, tl):
        r = resolve(c, c['where'])
        if not r: continue
        path, seconds, ends = r; x = clip(path, c.get('rate', 1.0))
        put(x, c['t'] - (len(x) / SR if ends else 0), c.get('gain', -9), c.get('pan', 0.0), c.get('cut'), c.get('fade_in', 0.0)); used += 1
    if problems: sys.exit('the sound cues have problems:\n- ' + '\n- '.join(problems))

    # the narration, and where it speaks (the bed steps down there)
    spans = []
    if S.get('voice'):
        vf = os.path.join(here, S['voice'])
        if not os.path.isfile(vf): sys.exit(f'the narration was not found: {vf}')
        v = clip(vf); at = S.get('voice_at', 0.0); put(v, at, S.get('voice_gain', 0.0))
        wf = os.path.join(here, S['words']) if isinstance(S.get('words'), str) else None
        if wf and os.path.isfile(wf): spans = [(w['s'] + at, w['e'] + at) for w in json.load(open(wf, encoding='utf8'))]
        else: spans = [(at, at + len(v) / SR)]
        if at + len(v) / SR > TOTAL + 0.05: notes.append(f'the narration is {at + len(v) / SR:.2f} s long but the reel is {TOTAL:.2f} s: its end is cut off')
    bed = S.get('bed')
    if bed is not None:
        g, variant = (bed.get('gain', -24), bed.get('variant', 0)) if isinstance(bed, dict) else (bed, 0)
        dips = bed.get('dips', []) if isinstance(bed, dict) else []
        ok_dip = lambda d: isinstance(d, dict) and all(isinstance(d.get(k), (int, float)) and not isinstance(d.get(k), bool) for k in ('t', 'for', 'by')) and d['t'] >= 0 and d['for'] > 0 and d['by'] < 0
        if not isinstance(dips, list) or not all(ok_dip(d) for d in dips):
            sys.exit('the bed\'s "dips" must be a list like [ { "t": 5.2, "for": 1.5, "by": -8 } ]: from second t of the reel, for that many seconds, the bed is lower by that many dB (a negative number).')
        kit_bed = os.path.join(a.sfx, 'bed.wav') if a.sfx else None
        src = kit_bed if kit_bed and os.path.isfile(kit_bed) and not pick else (pick.pick('bed', None, variant, a.sfx)['path'] if pick else None)
        if src:
            b = clip(src); b = np.tile(b, int(np.ceil(MAIN / len(b))))[:MAIN] * db(g)
            f = int(.5 * SR); b[:f] *= np.linspace(0, 1, f); b[-f:] *= np.linspace(1, 0, f)
            if spans:                                                         # 12 dB down under speech, with 80 ms ramps so the step is not heard
                duck = np.ones(MAIN); k = int(.08 * SR)
                for s, e in spans: duck[max(0, int(s * SR) - k):min(MAIN, int(e * SR) + k)] = db(-12)
                duck = np.convolve(duck, np.ones(k) / k, mode='same'); b *= duck
            if dips:                                                          # the bed steps aside while a number is read, or clears before the payoff
                env = np.ones(MAIN); k_in, k_out = int(.08 * SR), int(.30 * SR)        # down fast, back up slower
                for d in dips:
                    i0, i1, low = min(MAIN, int(d['t'] * SR)), min(MAIN, int((d['t'] + d['for']) * SR)), db(d['by'])
                    a0, a1 = max(0, i0 - k_in), min(MAIN, i1 + k_out)
                    env[a0:i0] = np.minimum(env[a0:i0], np.linspace(1, low, i0 - a0)); env[i0:i1] = np.minimum(env[i0:i1], low)
                    env[i1:a1] = np.minimum(env[i1:a1], np.linspace(low, 1, a1 - i1))
                b *= env
            mix[:MAIN, 0] += b; mix[:MAIN, 1] += b
        else: notes.append('no bed was added: the sound engine is missing')
    silent = not np.any(mix)
    out = os.path.abspath(a.out); os.makedirs(os.path.dirname(out), exist_ok=True); wav = os.path.splitext(out)[0] + '-sound.wav'
    sf.write(wav, mix, SR, subtype='PCM_24')
    final = wav
    if not silent:                                           # loudnorm lands low on sparse, punchy sound: measure, lift the rest, and hold the peaks with a limiter
        final = os.path.splitext(out)[0] + '-norm.wav'; lift = 0.0
        for _ in range(6):                                   # the ceiling is -2 dB (0.794): AAC adds up to half a dB on sharp hits, and the delivered file must stay under -1
            run('ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', f'loudnorm=I=-14:TP=-2.0:LRA=11,volume={lift:.2f}dB,alimiter=limit=0.794:level=false:attack=2:release=60', '-ar', '48000', '-c:a', 'pcm_s24le', final)
            off = -14.0 - loud(final)['I']
            if abs(off) < 0.3: break
            lift += off
        # A few short sounds over a very quiet bed can only reach -14 by being pressed hard against the ceiling: say so, because it flattens the hits.
        if lift > 6: notes.append(f'the sound is sparse: it had to be lifted {lift:.0f} dB to reach -14 LUFS, which flattens the hits. A louder bed or a few more sounds would sit better.')
        try:                                                 # a mix that lives under 250 Hz sounds empty on a phone speaker
            import phone_check; pc = phone_check.check(final)
            if pc['share_above_250hz'] < 0.35: notes.append(f'only {100 * pc["share_above_250hz"]:.0f}% of the sound energy is above 250 Hz: it will sound thin on a phone. Add a click, tick or thump beside the low hits.')
        except Exception as e: notes.append(f'the phone-speaker check did not run: {e}')
    r = run('ffmpeg', '-v', 'error', '-y', '-framerate', str(a.fps), '-i', os.path.join(a.frames, '%05d.' + ext), '-i', final, '-ar', '48000', '-c:v', 'libx264', '-profile:v', 'high', '-crf', '16', '-preset', 'slow',
            # JPEG frames are full-range BT.601; phones expect limited-range BT.709. Convert and say so in the file, or the picture looks washed or crushed on some players.
            # accurate_rnd: without it the conversion drifts two or three levels, which is a visible change to a brand colour.
            '-vf', ('scale=flags=accurate_rnd+full_chroma_int:in_range=full:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709' if ext == 'jpg' else 'scale=flags=accurate_rnd+full_chroma_int:out_range=tv:out_color_matrix=bt709') + ',format=yuv420p,setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=bt709',
            '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', out)
    if r.returncode: sys.exit('ffmpeg failed:\n' + r.stderr[-800:])
    for f in {wav, final}: os.remove(f)
    L = loud(out)
    probe = lambda sel, entries: run('ffprobe', '-v', '0', *(('-select_streams', sel) if sel else ()), '-show_entries', entries, '-of', 'csv=p=0', out).stdout.strip().replace('\n', ' ')
    vid, aud, length = probe('v:0', 'stream=codec_name,width,height,r_frame_rate').split(','), probe('a:0', 'stream=codec_name,sample_rate,channels').split(','), probe(None, 'format=duration')
    picture = f'{vid[0]} {vid[1]}x{vid[2]} at {vid[3].split("/")[0]} fps' if len(vid) == 4 else 'no picture'
    sound = f'{aud[0]} {aud[1]} Hz, {aud[2]} channels' if len(aud) == 3 else 'no sound'
    print(f'{os.path.basename(out)}: {float(length or 0):.2f} s, {picture}, {sound} | ' + ('SILENT' if silent else f'{L["I"]:.1f} LUFS, peak {L["Peak"]:.1f} dB, {used} sound cues'))
    for n in notes: print('note: ' + n)

if __name__ == '__main__': main()
