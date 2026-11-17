"""Renderer for plinkfx sound definitions (CC0 definitions, MIT code), ported to numpy/Python.

The definition format is plain data: a list of layers (oscillator or noise, pitch sweep, ADSR-ish
envelope, filters, FM, arpeggio, modal and plucked voices) plus echo, small reverb, bit crush and a
limiter. This file follows plinkfx/src/core/synth.ts step by step (same random generator, same
order of random draws, same filters), so a seed reproduces the same take. Differences: samples are
float64 here (the original keeps layers in float32), and the output is written at 48 kHz directly
by rendering with sample_rate=48000 instead of resampling 44.1 kHz.

    python plink.py [plinkfx_dir]    render the mapped catalogue into packs/plink/
"""
import json
import math
import os
import re
import sys

import numpy as np

import soundlib as S

TAU = 2 * math.pi
METAL = [1, 1.483, 1.8, 2.546, 2.63, 3.897]
DEFAULT_SRC = os.environ.get("TIRAZ_PLINK_SRC", "")      # a local copy of github.com/maximilianfeix/plinkfx; only needed to rebuild packs/plink

# every field the renderer understands; a definition using anything else is refused, not approximated
LAYER_FIELDS = {"wave", "freq", "to", "sweep", "curve", "arp", "arpRate", "loop", "vib", "fm", "modes", "damp",
                "blend", "formant", "kt", "duty", "at", "a", "h", "d", "shape", "lp", "lpTo", "hp", "hpTo",
                "bp", "bpTo", "q", "drive", "gain"}
SOUND_FIELDS = {"layers", "gain", "vary", "varyF", "varyG", "echo", "verb", "bits", "limit", "rate", "loop"}
WAVES = {"sine", "triangle", "square", "saw", "noise", "pink", "brown", "crunch", "metal", "modal", "pluck"}


def _imul(a, b):
    return ((a & 0xFFFFFFFF) * (b & 0xFFFFFFFF)) & 0xFFFFFFFF


def rng(seed):
    """mulberry32, 32-bit exactly as in the original."""
    state = [int(seed) & 0xFFFFFFFF]

    def nxt():
        state[0] = (state[0] + 0x6D2B79F5) & 0xFFFFFFFF
        s = state[0]
        t = _imul(s ^ (s >> 15), 1 | s)
        t = ((t + _imul(t ^ (t >> 7), 61 | t)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0
    return nxt


def _round(x):
    return math.floor(x + 0.5)


def _blep(t, dt):
    if t < dt:
        t /= dt
        return t + t - t * t - 1
    if t > 1 - dt:
        t = (t - 1) / dt
        return t * t + t + t + 1
    return 0.0


class _Svf:
    """Zero-delay-feedback state variable filter; mode 0 low, 1 band, 2 high."""

    def __init__(self, sr, q, mode):
        self.sr, self.k, self.mode, self.s1, self.s2 = sr, 1.0 / q, mode, 0.0, 0.0

    def __call__(self, x, fc):
        sr, k = self.sr, self.k
        g = math.tan(math.pi * min(max(fc, 10.0), sr * 0.45) / sr)
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        v3 = x - self.s2
        v1 = a1 * self.s1 + a2 * v3
        v2 = self.s2 + a2 * self.s1 + g * a2 * v3
        self.s1 = 2 * v1 - self.s1
        self.s2 = 2 * v2 - self.s2
        if self.mode == 0:
            return v2
        return k * v1 if self.mode < 2 else x - k * v1 - v2


def _layer(L, out, sr, stretch, noise, fv=1.0, gv=1.0, pitch=1.0):
    wave = L.get("wave") or "sine"
    f0 = (L.get("freq") or 440) * pitch
    a = max(L.get("a", 0.002), 0.001)
    h = L.get("h") or 0
    d = L.get("d", 0.2) * stretch
    ln = a + h + d
    sweep = L.get("sweep") or ln
    curve = L.get("curve") or 1
    shape = L.get("shape") or 2
    duty = L.get("duty") or 0.5
    arp_rate = L.get("arpRate") or 0.06
    gain = L.get("gain", 1) * gv
    drive = L.get("drive") or 0
    fm = L.get("fm")
    start = _round((L.get("at") or 0) * sr)
    n = min(_round(ln * sr), len(out) - start)
    if n <= 0:
        return
    q = L.get("q") or 0.707
    arp = L.get("arp")
    filters = []
    for m, key in enumerate(("lp", "bp", "hp")):
        if L.get(key):
            filters.append((_Svf(sr, q, m), L[key] * fv, (L.get(key + "To") or L[key]) * fv))
    phase = mod = held = b0 = b1 = b2 = br = 0.0
    ph = [noise() for _ in range(8)]
    modes = list(L.get("modes") or [1, 2.756, 5.404, 8.933])[:8]
    ks = [0.0] * (n + 1) if wave == "pluck" else None
    fmt = [(_Svf(sr, 8, 1), F * fv) for F in (L.get("formant") or [])]
    f_start = L.get("freq") or 440
    to = L.get("to")
    damp = L.get("damp", 0.998)
    blend = L.get("blend", 0.5)
    kt_exp = L.get("kt")
    exp_neg = shape < 0
    e_shape = math.exp(shape) if exp_neg else 0.0
    for i in range(n):
        t = i / sr
        f = f0
        if to:
            p = min(t / sweep, 1.0)
            if curve != 1:
                p = 1 - (1 - p) ** curve
            f *= (to / f_start) ** p
        if arp:
            k = math.floor(t / arp_rate)
            idx = (k % len(arp)) if L.get("loop") else min(k, len(arp) - 1)
            f *= 2 ** (arp[idx] / 12)
        vib = L.get("vib")
        if vib:
            f *= 2 ** ((vib[1] * math.sin(TAU * vib[0] * t)) / 12)
        dt = f / sr
        p = phase
        if fm:
            p += (fm[1] * math.exp(-t / (fm[2] if len(fm) > 2 and fm[2] else 9)) * math.sin(TAU * mod)) / TAU
            mod = (mod + dt * fm[0]) % 1
            p -= math.floor(p)
        w = noise() * 2 - 1
        if wave == "triangle":
            s = 1 - 4 * abs(((p + 0.25) % 1) - 0.5)
        elif wave == "saw":
            s = 2 * p - 1 - _blep(p, dt)
        elif wave == "square":
            s = (1.0 if p < duty else -1.0) + _blep(p, dt) - _blep((p + 1 - duty) % 1, dt)
        elif wave == "pluck":
            kk = i - sr / f
            j = int(kk)  # JS `k | 0` truncates toward zero
            fr = kk - j
            if j < 1:
                s = w
            else:
                s = blend * ((1 - fr) * (ks[j] + ks[j - 1]) + fr * (ks[j + 1] + ks[j])) * damp
            ks[i] = s
        elif wave == "noise":
            s = w
        elif wave == "pink":
            b0 = 0.99765 * b0 + w * 0.099046
            b1 = 0.963 * b1 + w * 0.2965164
            b2 = 0.57 * b2 + w * 1.0526913
            s = (b0 + b1 + b2 + w * 0.1848) * 0.25
        elif wave == "brown":
            br = (br + 0.02 * w) / 1.02
            s = br * 3.5
        elif wave == "crunch":
            if phase + dt >= 1 or i == 0:
                held = w
            s = held
        elif wave == "modal":
            s = 0.0
            for j, mr in enumerate(modes):
                ph[j] = (ph[j] + dt * mr) % 1
                s += math.sin(TAU * ph[j]) * math.exp((-t * mr * 4) / d) / (j + 1)
        elif wave == "metal":
            s = 0.0
            for j in range(6):
                ph[j] = (ph[j] + dt * METAL[j]) % 1
                s += (1.0 if ph[j] < 0.5 else -1.0) + _blep(ph[j], dt * METAL[j]) - _blep((ph[j] + 0.5) % 1, dt * METAL[j])
            s /= 6
        else:
            s = math.sin(TAU * p)
        phase = (phase + dt) % 1
        u = i / n
        kt = (f / f0) ** kt_exp if kt_exp else 1.0
        for fn, f_from, f_to in filters:
            s = fn(s, f_from * (f_to / f_from) ** u * kt)
        if fmt:
            v = 0.0
            for fn, F in fmt:
                v += fn(s, F * kt)
            s = v
        if t < a:
            e = t / a
        elif t < a + h:
            e = 1.0
        elif exp_neg:
            e = (math.exp((shape * (t - a - h)) / d) - e_shape) / (1 - e_shape)
        else:
            e = max(0.0, 1 - (t - a - h) / d) ** shape
        s *= e
        if drive:
            s = math.tanh(s * (1 + drive)) / math.tanh(1 + drive)
        out[start + i] += s * gain


def check_supported(sound):
    """Return a list of reasons this definition cannot be rendered faithfully (empty = fully supported)."""
    why = []
    for k in sound:
        if k not in SOUND_FIELDS:
            why.append("unknown sound field '%s'" % k)
    for L in sound.get("layers", []):
        for k in L:
            if k not in LAYER_FIELDS:
                why.append("unknown layer field '%s'" % k)
        if (L.get("wave") or "sine") not in WAVES:
            why.append("unknown wave '%s'" % L.get("wave"))
    if not sound.get("layers"):
        why.append("no layers")
    return why


def render(sound, seed=0, sample_rate=S.SR):
    """Render one definition to a float64 mono array. Same definition, seed and rate give the same samples."""
    why = check_supported(sound)
    if why:
        raise ValueError("Cannot render this sound faithfully: " + "; ".join(sorted(set(why))) + ".")
    sr = sample_rate
    r = rng(seed * 7919 + 17)
    vary = sound.get("vary", 0.4)
    pitch = 2 ** (((r() * 2 - 1) * vary) / 12) if seed else 1.0
    vf = sound.get("varyF", 0)
    vg = sound.get("varyG", 0)
    layers = []
    for L in sound["layers"]:
        stretch = 1 + (r() * 2 - 1) * 0.07 if (seed and L.get("d")) else 1.0
        fv = pitch * 2 ** (((r() * 2 - 1) * vf) / 12) if seed else 1.0
        gv = 10 ** (((r() * 2 - 1) * vg) / 20) if seed else 1.0
        layers.append((L, stretch, fv, gv))
    end = 0.0
    for L, s, _, _ in layers:
        end = max(end, (L.get("at") or 0) + max(L.get("a", 0.002), 0.001) + (L.get("h") or 0) + L.get("d", 0.2) * s)
    echo, verb = sound.get("echo"), sound.get("verb")
    tail = 0.0
    if echo:
        tail += min(echo[0] * math.ceil(math.log(0.001) / math.log(echo[1] or 0.01)), 1.5)
    if verb:
        tail += 0.2 + verb[0] * 1.8
    N = math.ceil((end + tail) * sr) + 1
    x = [0.0] * N
    for i, (L, s, fv, gv) in enumerate(layers):
        _layer(L, x, sr, s, rng(seed * 1009 + i * 31 + 7), fv, gv, pitch)

    if sound.get("rate") or sound.get("bits"):
        hold = sr / sound["rate"] if sound.get("rate") else 1
        q = 2 ** (sound["bits"] - 1) if sound.get("bits") else 0
        c, v = 0.0, 0.0
        for i in range(N):
            c += 1
            if c >= hold or i == 0:
                c -= hold if hold > 1 else c
                v = x[i]
            x[i] = _round(v * q) / q if q else v
    if echo:
        D = _round(echo[0] * sr)
        w = [0.0] * N
        lp = 0.0
        for i in range(D, N):
            lp += 0.5 * (x[i - D] + echo[1] * w[i - D] - lp)
            w[i] = lp
        for i in range(N):
            x[i] += w[i] * echo[2]
    if verb:
        k = sr / 44100
        fb = 0.7 + verb[0] * 0.28
        wet = [0.0] * N
        for ln in (1116, 1188, 1277, 1356):
            L = _round(ln * k)
            buf = [0.0] * L
            j, damp = 0, 0.0
            for i in range(N):
                y = buf[j]
                damp += 0.6 * (y - damp)
                buf[j] = x[i] + damp * fb
                wet[i] += y / 4
                j = (j + 1) % L
        for ln in (556, 441):
            L = _round(ln * k)
            buf = [0.0] * L
            j = 0
            for i in range(N):
                y = buf[j]
                v = wet[i]
                buf[j] = v + y * 0.5
                wet[i] = y - v
                j = (j + 1) % L
        for i in range(N):
            x[i] += wet[i] * verb[1]

    R = 1 - (TAU * 20) / sr
    g = sound.get("gain", 1)
    px = py = 0.0
    last = 0
    for i in range(N):
        py = x[i] - px + R * py
        px = x[i]
        x[i] = py * g
        if abs(x[i]) > 3e-4:
            last = i
    if sound.get("limit"):
        gl = [1.0] * N
        A, Rl = sr * 0.0015, sr * 0.05
        for i in range(N - 1, -1, -1):
            gl[i] = min(0.84 / max(abs(x[i]), 1e-9), 1.0, gl[i + 1] + 1 / A if i + 1 < N else 1.0)
        prev = 0.0
        for i in range(N):
            gl[i] = min(gl[i], prev + 1 / Rl if i else 1.0)
            prev = gl[i]
            x[i] *= gl[i]
    arr = np.array(x, dtype=np.float64)
    if sound.get("loop"):
        X = _round(sr / 4)
        Ln = _round(end * sr) - 2 * X
        i = np.arange(X)
        arr[:X] = arr[:X] * (i / X) ** 0.75 + arr[Ln:Ln + X] * (1 - i / X) ** 0.75
        return arr[:Ln]
    arr = arr[:last + 1]
    fade = min(_round(sr * 0.005), len(arr))
    if fade > 1:
        arr[len(arr) - fade:] *= (np.arange(fade)[::-1]) / fade
    return arr


def load_catalogue(src=DEFAULT_SRC):
    """Read src/sounds.gen.ts (baked JSON literals) and library/catalog.gen.json. Data only, nothing is executed."""
    with open(os.path.join(src, "library", "catalog.gen.json"), encoding="utf-8") as f:
        cat = json.load(f)
    by_id = {}
    with open(os.path.join(src, "src", "sounds.gen.ts"), encoding="utf-8") as f:
        for line in f:
            m = re.match(r"export const (\w+): Sound = (\{.*\});\s*$", line)
            if m:
                by_id[m.group(1)] = json.loads(m.group(2))
    out = []
    for s in cat["sounds"]:
        out.append({"name": s["name"], "cat": s["cat"], "desc": s["desc"], "sound": by_id.get(s["id"])})
    return out


# name -> (kind, tags). Anything not listed is skipped with the reason in SKIP_REASON below.
MAP = {
    "click": ("click", []), "click-soft": ("click", ["soft"]), "click-hard": ("click", ["hard"]),
    "select": ("click", []), "button": ("click", []),
    
    
    "hover": ("tick", ["soft"]), "tick": ("tick", []), "countdown": ("tick", []), 
    
    "pop": ("pop", ["mid"]), "pop-down": ("pop", ["low"]), "bubble": ("pop", ["mid"]),
    "pickup-item": ("pop", ["high"]), 
    "toggle-on": ("toggle", ["on"]), "toggle-off": ("toggle", ["off"]),
    "type": ("type", []),
    "swipe": ("swish", []), "swing": ("swish", []),
    "dash": ("swish", ["fast"]), "magic-missile": ("swish", ["bright"]),
    "whoosh": ("whoosh", ["short"]), "speed-up": ("whoosh", ["short"]), "teleport": ("whoosh", ["long"]),
    "boost": ("whoosh", ["long"]),
    "charge-up": ("riser", ["1s"]),
    "fall-whistle": ("drop", ["long"]), "power-down": ("drop", ["short"]), "shutdown": ("drop", ["long"]),
    "implosion": ("drop", ["long"]), "shield-off": ("drop", ["short"]),
    "hit": ("impact", []), "hit-heavy": ("impact", ["big"]), "punch": ("impact", []), 
    "explosion-small": ("impact", ["small"]), "explosion": ("impact", ["big"]),
    "explosion-big": ("impact", ["big", "long"]), 
    
    "hit-light": ("thump", ["soft"]), "stomp": ("thump", []), "bonk": ("thump", []), "kick": ("thump", []),
    "thud": ("thump", []), "land-heavy": ("thump", []),
    "shield-on": ("shimmer", []), "heal": ("shimmer", ["long"]), "spell-cast": ("shimmer", ["long"]),
    "enchant": ("shimmer", []), "dispel": ("shimmer", []), 
    "sparkle": ("sparkle", []), "gem": ("sparkle", []), "star": ("sparkle", []), "xp-orb": ("sparkle", []),
    "combo-chain": ("sparkle", []), 
    "confirm": ("success", []), "success": ("success", []), "powerup": ("success", []), 
    "level-up": ("success", ["long"]), 
    "victory": ("success", ["resolve", "long"]), 
    "achievement": ("success", ["resolve"]), "puzzle-solved": ("success", ["resolve"]), 
    "access-granted": ("success", ["digital"]),
    "match": ("success", []), 
    "error": ("error", []), "deny": ("error", []), "buzzer-wrong": ("error", []),
    "access-denied": ("error", ["digital"]), "game-over": ("error", ["long"]), 
    "alarm": ("error", ["long"]),
    "notify": ("notify", []), "message": ("notify", []), "quest-new": ("notify", ["long"]),
    "timer-done": ("notify", []), "radar-ping": ("notify", ["long"]), 
    "plink": ("ding", []), "coin": ("ding", []), "coin-soft": ("ding", ["soft"]), "coin-double": ("ding", []),
    "ka-ching": ("ding", []), 
    
    "glitch": ("glitch", []), "static-burst": ("glitch", []), "robot-chatter": ("glitch", []),
    "leaf-rustle": ("rustle", []), "card-shuffle": ("rustle", []), "page-turn": ("rustle", []),
    "slide": ("rustle", ["ground"]), "dig": ("rustle", ["grit"]), "toss": ("rustle", ["air"]), "card-deal": ("rustle", ["short"]),
    "force-field": ("bed", ["loop", "tech"]), "wind-loop": ("bed", ["loop", "air"]), "rain-loop": ("bed", ["loop", "air"]),
}
SKIP_REASON = {
    "footstep": "footsteps do not belong in a reel kit; no matching kind",
    "creature": "animal and monster voices; no matching kind",
    "shoot": "weapons and lasers; no matching kind",
    "farm": "game-world actions; no matching kind",
    "vehicle": "vehicle sounds; no matching kind",
}


def build(src=DEFAULT_SRC, out_dir=None, seeds=(0,)):
    out_dir = out_dir or os.path.join(S.HERE, "packs", "plink")
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        if f.endswith(".wav"):
            os.remove(os.path.join(out_dir, f))
    meta, skipped = {}, []
    for e in load_catalogue(src):
        name, snd = e["name"], e["sound"]
        if snd is None:
            skipped.append((name, "definition not found in sounds.gen.ts"))
            continue
        why = check_supported(snd)
        if why:
            skipped.append((name, "unsupported: " + "; ".join(why)))
            continue
        if name not in MAP:
            skipped.append((name, SKIP_REASON.get(e["cat"], "no fitting kind for a reel (category %s)" % e["cat"])))
            continue
        kind, tags = MAP[name]
        for seed in seeds:
            x = render(snd, seed)
            if snd.get("loop"):
                x = x * (10 ** (-14 / 20) / np.max(np.abs(x)))
            else:
                x = S.clean(x, fade_ms=8.0)
            if x is None:
                skipped.append((name, "rendered silent"))
                continue
            fn = "%s_s%d.wav" % (name, seed)
            S.write_wav(os.path.join(out_dir, fn), x)
            meta[fn] = {"kind": kind, "tags": sorted(set(tags + ["plink", e["cat"]])), "anchor": "end" if kind in ("riser", "swell") else "start",
                        "source": "plinkfx %s (%s) seed %d" % (name, e["desc"], seed)}
    with open(os.path.join(out_dir, "pack.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=1, sort_keys=True)
    with open(os.path.join(out_dir, "skipped.json"), "w", encoding="utf-8") as f:
        json.dump([{"name": n, "reason": r} for n, r in skipped], f, indent=1)
    return len(meta), skipped


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    n, sk = build(src)
    print("rendered %d plink files, skipped %d definitions" % (n, len(sk)))
