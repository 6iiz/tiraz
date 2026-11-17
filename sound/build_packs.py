"""Curate recorded sounds from the licence-checked CC0 source folders into packs/<pack>/.

Developer tool: people who use the kit never run it, they only use the packs it wrote. It is kept
here so anyone can see how each file was chosen and what was done to it. It reads audio and
licence text only; nothing in the source folders is executed. Selection is by measurement
(duration, spectral centroid, noise floor, steadiness) and by file name, never by ear.

    python build_packs.py <sources>     the folder that holds the source checkouts named in the rules
                                        below: uisfx, soundcn, the-libre-sample-pack, sonic-pi-samples
                                        (or set TIRAZ_SOUND_SOURCES). Then run plink.py and build_index.py.
"""
import glob
import json
import os
import re
import sys

import numpy as np

import soundlib as S

LIB = os.environ.get("TIRAZ_SOUND_SOURCES", "")

# longest a sound of each kind may be (longer files are cut with a long fade), shortest allowed
MAXLEN = {"click": 0.6, "tick": 0.4, "pop": 0.6, "toggle": 0.8, "type": 0.3, "swish": 0.6, "whoosh": 2.5,
          "riser": 4.5, "swell": 4.5, "drop": 2.5, "impact": 3.5, "thump": 0.8, "shimmer": 3.0, "sparkle": 1.5,
          "success": 2.5, "error": 1.5, "notify": 1.8, "ding": 2.0, "glitch": 1.5, "rustle": 1.5,
          "scratch": 2.5, "bed": 12.0}

STYLES = ["arcade", "cinematic", "dreamy", "glass", "mechanical", "minimal", "organic", "rubber", "scifi", "soft", "studio", "zen"]

# ---- rules ------------------------------------------------------------------------------------
# uisfx: cue -> (kind, tags, styles to take). Styles are listed by hand so each kind gets a spread.
UI = [
    ("press", "click", [], ["minimal", "soft", "mechanical"]),
    ("snap", "click", ["snap"], ["minimal", "organic"]),
    ("hover", "tick", [], ["minimal", "glass", "mechanical"]),
    ("progress-step", "tick", ["step"], ["scifi", "zen"]),
    ("reaction", "pop", [], ["soft", "rubber", "glass"]),
    ("toggle-on", "toggle", ["on"], ["minimal", "soft"]),
    ("toggle-off", "toggle", ["off"], ["minimal", "soft"]),
    ("typing", "type", [], ["minimal", "mechanical", "soft", "organic", "studio", "scifi"]),
    ("notification", "notify", [], ["glass", "soft", "studio"]),
    ("mention", "notify", ["bright"], ["dreamy"]),
    ("success", "success", [], ["glass", "studio", "soft"]),
    ("complete", "success", ["resolve"], ["cinematic", "dreamy"]),
    ("error", "error", [], ["soft", "mechanical", "scifi"]),
    ("blocked", "error", ["short"], ["glass"]),
    ("reward", "sparkle", [], ["glass", "dreamy"]),
    ("bonus", "sparkle", [], ["organic"]),
    ("badge", "ding", [], ["glass", "organic"]),
    ("swipe", "swish", [], ["minimal", "soft", "glass"]),
]

# other sources: (pack, source glob relative to LIB, kind, tags, how many to keep, extra filters)
# filters: dmin/dmax seconds after trimming, cmin/cmax spectral centroid Hz
# changes: "reverse": True plays the file backwards (a cymbal backwards is the classic swell that peaks at its
#          last moment); "loop": seconds makes a seamless loop with a crossfade that long, and "steady": dB is
#          how far the level may move inside a file that is to loop; "prefix" goes before the file name
K_IF = "soundcn/assets/kenney_interface-sounds"
K_DG = "soundcn/assets/kenney_digital-audio"
LB = "the-libre-sample-pack"
SP = "sonic-pi-samples/etc/samples"
FILES = [
    ("kenney", K_IF + "/click_*.ogg", "click", ["kenney"], 3, {}),
    ("kenney", K_IF + "/tick_*.ogg", "tick", ["kenney"], 2, {}),
    ("kenney", K_IF + "/toggle_00[1-4].ogg", "toggle", ["kenney"], 2, {}),
    ("kenney", K_IF + "/confirmation_*.ogg", "success", ["kenney"], 3, {}),
    ("kenney", K_IF + "/error_00[1-8].ogg", "error", ["kenney"], 3, {}),
    ("kenney", K_IF + "/glitch_*.ogg", "glitch", ["kenney"], 3, {}),
    ("kenney", K_IF + "/glass_*.ogg", "ding", ["kenney", "glass"], 3, {}),
    ("kenney", K_IF + "/bong_*.ogg", "ding", ["kenney"], 1, {}),
    ("kenney", K_IF + "/pluck_*.ogg", "pop", ["kenney", "high"], 2, {}),
    ("kenney", K_IF + "/drop_*.ogg", "pop", ["kenney", "low"], 2, {}),
    ("kenney", K_IF + "/scratch_*.ogg", "scratch", ["kenney"], 5, {}),
    ("kenney", K_IF + "/question_*.ogg", "notify", ["kenney"], 2, {}),
    ("kenney", K_DG + "/powerUp*.ogg", "success", ["kenney", "retro"], 2, {}),
    ("kenney", K_DG + "/pepSound*.ogg", "pop", ["kenney", "retro", "mid"], 2, {}),
    ("kenney", K_DG + "/phaserUp*.ogg", "swish", ["kenney", "retro"], 2, {}),
    ("kenney", K_DG + "/*Down*.ogg", "drop", ["kenney", "retro", "short"], 2, {}),
    ("kenney", K_DG + "/threeTone*.ogg", "notify", ["kenney", "retro"], 2, {}),
    ("kenney", K_DG + "/spaceTrash*.ogg", "glitch", ["kenney", "retro"], 2, {}),
    ("libre", LB + "/fx/uplifters/long sweep*.wav", "riser", ["libre", "long"], 4, {"dmin": 1.0}),
    ("libre", LB + "/fx/uplifters/short sweep*.wav", "riser", ["libre"], 3, {"dmin": 0.5}),
    ("libre", LB + "/fx/uplifters/sweepup*.wav", "riser", ["libre", "retro"], 1, {"dmin": 0.5}),
    ("libre", LB + "/fx/downlifters/impact*.wav", "impact", ["libre"], 4, {}),
    ("libre", LB + "/fx/downlifters/tonalimpact*.wav", "impact", ["libre", "tonal"], 1, {}),
    ("libre", LB + "/fx/downlifters/Metal-Crash*.wav", "impact", ["libre", "metal"], 1, {}),
    ("libre", LB + "/fx/downlifters/sub drop*.wav", "drop", ["libre", "sub"], 3, {}),
    ("libre", LB + "/fx/others/asmr transient*.wav", "tick", ["libre", "asmr"], 3, {"dmax": 0.4}),
    ("libre", LB + "/fx/others/asmr crack*.wav", "click", ["libre", "asmr"], 2, {}),
    ("libre", LB + "/drums/one shot/hi hats/ch *.wav", "tick", ["libre", "hat"], 3, {"dmax": 0.4}),
    ("libre", LB + "/drums/one shot/rimshots/*.wav", "click", ["libre", "rim"], 2, {}),
    ("sonicpi", SP + "/ambi_*woosh.flac", "whoosh", ["sonicpi", "long"], 1, {}),
    ("sonicpi", SP + "/ambi_swoosh.flac", "whoosh", ["sonicpi", "long"], 1, {}),
    ("sonicpi", SP + "/perc_sw*sh.flac", "whoosh", ["sonicpi", "short"], 2, {}),
    ("sonicpi", SP + "/ambi_glass_*.flac", "shimmer", ["sonicpi", "glass"], 2, {}),
    ("sonicpi", SP + "/elec_chime.flac", "ding", ["sonicpi"], 1, {}),
    ("sonicpi", SP + "/elec_bell.flac", "ding", ["sonicpi"], 1, {}),
    ("sonicpi", SP + "/perc_bell*.flac", "ding", ["sonicpi"], 2, {}),
    ("sonicpi", SP + "/elec_pl*p.flac", "pop", ["sonicpi", "high"], 1, {}),
    ("sonicpi", SP + "/elec_pop.flac", "pop", ["sonicpi", "mid"], 1, {}),
    ("sonicpi", SP + "/elec_bl*.flac", "pop", ["sonicpi", "mid"], 2, {}),
    ("sonicpi", SP + "/elec_tick.flac", "tick", ["sonicpi"], 1, {}),
    ("sonicpi", SP + "/misc_cineboom.flac", "impact", ["sonicpi", "big"], 1, {}),
    ("sonicpi", SP + "/perc_impact*.flac", "impact", ["sonicpi"], 2, {}),
    ("sonicpi", SP + "/bass_drop_c.flac", "drop", ["sonicpi", "sub"], 1, {}),
    ("sonicpi", SP + "/glitch_perc*.flac", "glitch", ["sonicpi"], 3, {}),
    ("sonicpi", SP + "/glitch_robot*.flac", "glitch", ["sonicpi", "robot"], 2, {}),
    ("sonicpi", SP + "/vinyl_[brs]*.flac", "scratch", ["sonicpi", "vinyl"], 3, {}),
    ("sonicpi", SP + "/perc_snap*.flac", "click", ["sonicpi", "snap"], 1, {}),
    ("sonicpi", SP + "/drum_cymbal_*.flac", "swell", ["sonicpi", "reversed", "cymbal"], 3, {"reverse": True, "dmin": 0.6, "prefix": "reversed-"}),
    ("sonicpi", SP + "/drum_splash_*.flac", "swell", ["sonicpi", "reversed", "cymbal"], 2, {"reverse": True, "dmin": 0.6, "prefix": "reversed-"}),
    ("sonicpi", SP + "/elec_cymbal.flac", "swell", ["sonicpi", "reversed", "cymbal"], 1, {"reverse": True, "dmin": 0.4, "prefix": "reversed-"}),
    ("sonicpi", SP + "/ambi_drone.flac", "bed", ["sonicpi", "loop", "low"], 1, {"loop": 0.5, "prefix": "loop-"}),
    ("sonicpi", SP + "/ambi_haunted_hum.flac", "bed", ["sonicpi", "loop", "tension"], 1, {"loop": 0.5, "prefix": "loop-"}),
    ("sonicpi", SP + "/ambi_soft_buzz.flac", "bed", ["sonicpi", "loop", "tech"], 1, {"loop": 0.5, "prefix": "loop-"}),
    ("sonicpi", SP + "/ambi_lunar_land.flac", "bed", ["sonicpi", "loop", "air"], 1, {"loop": 0.5, "prefix": "loop-"}),
    ("sonicpi", SP + "/tbd_fxbed_loop.flac", "bed", ["sonicpi", "loop"], 1, {"loop": 0.5, "prefix": "loop-"}),
    ("sonicpi", SP + "/tbd_pad_*.flac", "bed", ["sonicpi", "loop", "pad"], 2, {"loop": 0.5, "prefix": "loop-"}),
    ("sonicpi", SP + "/elec_soft_kick.flac", "thump", ["sonicpi", "soft"], 1, {}),
]


def spread(items, n):
    """n items spread evenly over the list, so a rule takes the whole range, not just the first n."""
    if len(items) <= n:
        return items
    idx = sorted({int(round(i * (len(items) - 1) / (n - 1))) for i in range(n)}) if n > 1 else [0]
    return [items[i] for i in idx]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def level_spread_db(x, win=0.25):
    """How far the level moves inside the file: loudest minus quietest quarter-second, in dB."""
    n = int(win * S.SR)
    r = [np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x) - n + 1, n)]
    r = [v for v in r if v > 0]
    return 99.0 if len(r) < 2 else float(S.db(max(r)) - S.db(min(r)))


def make_loop(x, fade_s):
    """A seamless loop: the last fade_s seconds are folded over the first with an equal-power crossfade,
    so the sample after the end is the first sample again."""
    f = int(fade_s * S.SR)
    if len(x) < 4 * f:
        return None
    w = np.linspace(0.0, 1.0, f)
    out = x[:len(x) - f].copy()
    out[:f] = x[:f] * np.sqrt(w) + x[len(x) - f:] * np.sqrt(1.0 - w)
    return out


def process(path, kind, f):
    """Decode, clean, gate. Returns (samples, measures) or (None, reason)."""
    try:
        raw = S.decode(path)
    except RuntimeError as e:
        return None, str(e)
    pk_in = np.max(np.abs(raw)) if len(raw) else 0
    if pk_in < 1e-4:
        return None, "silent"
    if f.get("reverse"):
        raw = raw[::-1].copy()
    if f.get("loop"):
        x = S.clean(raw, max_seconds=MAXLEN[kind] + 2 * f["loop"], fade_ms=25.0)
        if x is None:
            return None, "empty after trim"
        edge = int(0.06 * S.SR)
        x = x[edge:len(x) - edge]            # without the cleaner's own fade-in and fade-out
        moves = level_spread_db(x)
        if moves > f.get("steady", 8.0):
            return None, "the level moves %.0f dB inside the file: not steady enough to loop" % moves
        x = make_loop(x, f["loop"])
        if x is None:
            return None, "too short to loop"
        x = x * (10 ** (-14 / 20) / np.max(np.abs(x)))      # a bed sits low, at the level of the rendered loops
    else:
        x = S.clean(raw, max_seconds=MAXLEN[kind], fade_ms=25.0, keep_end=kind in ("riser", "swell"))
    if x is None:
        return None, "empty after trim"
    boost = -3.0 - S.db(pk_in)
    secs = len(x) / S.SR
    cen = S.centroid_hz(x)
    nf = S.noise_floor_db(x)
    if boost > 30:
        return None, "needs %+.0f dB of gain, would raise noise" % boost
    if secs < f.get("dmin", 0.0) or secs > f.get("dmax", 99.0):
        return None, "duration %.2f s outside the rule" % secs
    if cen < f.get("cmin", 0) or cen > f.get("cmax", 1e9):
        return None, "centroid %.0f Hz outside the rule" % cen
    return x, {"seconds": secs, "centroid": cen, "noise": nf}


def tag_by_sound(kind, tags, secs, cen):
    t = set(tags)
    if kind == "pop" and not t & {"low", "mid", "high"}:
        t.add("low" if cen < 700 else "mid" if cen < 1800 else "high")
    if kind in ("whoosh", "riser", "swell", "drop", "shimmer", "sparkle", "impact", "success", "error", "notify", "ding"):
        if not t & {"short", "long", "small", "big", "medium", "1s", "2s", "3s", "4s"}:
            t.add("short" if secs < 1.0 else "long")
    if kind in ("riser", "swell"):
        t -= {"1s", "2s", "3s", "4s"}
        t.add("%ds" % min(4, max(1, int(round(secs)))))      # the measured length to the nearest second, never the file's name
    if kind != "pop":
        t.add("dark" if cen < 1200 else "bright" if cen > 3500 else "mid-tone")
    return sorted(t)


def build(lib=LIB):
    out_root = os.path.join(S.HERE, "packs")
    meta = {}      # pack -> file -> info
    rejected = []
    used_kind = {}

    def save(pack, name, kind, tags, x, source, m, anchor=None):
        anchor = anchor or ("end" if kind in ("riser", "swell") else "start")     # these peak at their last moment
        fn = "%s.wav" % name
        S.write_wav(os.path.join(out_root, pack, fn), x)
        meta.setdefault(pack, {})[fn] = {"kind": kind, "tags": tag_by_sound(kind, tags, m["seconds"], m["centroid"]),
                                        "anchor": anchor, "source": source}
        used_kind[kind] = used_kind.get(kind, 0) + 1

    for pack in ("ui", "kenney", "libre", "sonicpi"):
        d = os.path.join(out_root, pack)
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.endswith(".wav") or f == "pack.json":
                    os.remove(os.path.join(d, f))

    # uisfx
    ui_dir = lib + "/uisfx/packages/uisfx/sounds"
    for cue, kind, tags, styles in UI:
        for st in styles:
            p = "%s/%s/%s.ogg" % (ui_dir, st, cue)
            if not os.path.exists(p):
                rejected.append((p, "file missing"))
                continue
            x, m = process(p, kind, {})
            if x is None:
                rejected.append((p, m))
                continue
            save("ui", "%s_%s" % (cue, st), kind, tags + [st], x, "uisfx %s/%s" % (st, cue), m)

    # the rest
    for pack, pat, kind, tags, n, f in FILES:
        cands = sorted(glob.glob(lib + "/" + pat))
        cands = [c for c in cands if "/wow" not in c.replace("\\", "/").lower() and "oculus" not in c.lower()]
        if not cands:
            rejected.append((pat, "no file matches this pattern"))
            continue
        good = []
        for c in cands:
            x, m = process(c, kind, f)
            if x is None:
                rejected.append((c, m))
            else:
                good.append((c, x, m))
        for c, x, m in spread(good, n):
            rel = c.replace("\\", "/").split(lib + "/")[-1]
            how = " (played backwards)" if f.get("reverse") else " (looped with a %.1f s crossfade)" % f["loop"] if f.get("loop") else ""
            save(pack, f.get("prefix", "") + slug(os.path.splitext(os.path.basename(c))[0]) + "_" + slug(os.path.basename(os.path.dirname(c)))[:12],
                 kind, tags, x, rel + how, m)

    for pack, files in meta.items():
        with open(os.path.join(out_root, pack, "pack.json"), "w", encoding="utf-8") as fh:
            json.dump(files, fh, indent=1, sort_keys=True)
    with open(os.path.join(S.HERE, "packs", "rejected.json"), "w", encoding="utf-8") as fh:
        json.dump([{"file": a.split("/sound/")[-1] if "/sound/" in a else a, "why": b} for a, b in rejected], fh, indent=1)
    return {p: len(v) for p, v in meta.items()}, used_kind, rejected


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else LIB
    if not src or not os.path.isdir(src):
        sys.exit("Give the folder that holds the source checkouts: python build_packs.py <sources>  (or set TIRAZ_SOUND_SOURCES)")
    counts, kinds, rej = build(src.replace(chr(92), "/").rstrip("/"))
    print("files per pack:", counts)
    print("files per kind:", dict(sorted(kinds.items())))
    print("rejected: %d (see packs/rejected.json)" % len(rej))
