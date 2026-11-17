"""Shared helpers for the sound engine: measuring, cleaning and writing WAV files.

Everything here is numpy + soundfile only (ARCHITECTURE rule 7). The same measure()
is used by the builders and by test_sound.py, so "onset" and "peak" mean one thing.
"""
import json
import os
import subprocess

import numpy as np
import soundfile as sf

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
TARGET_PEAK_DB = -3.0
ONSET_REL_DB = -50.0   # onset = first sample within 50 dB of the file's own peak
ONSET_MAX_MS = 10.0


def db(x):
    return 20.0 * np.log10(max(float(x), 1e-12))


def peak_db(x):
    return db(np.max(np.abs(x))) if len(x) else -120.0


def onset_ms(x):
    """Milliseconds until the first sample that is within ONSET_REL_DB of the peak."""
    a = np.abs(x)
    if a.ndim > 1:
        a = a.max(axis=1)
    pk = a.max() if len(a) else 0.0
    if pk <= 0:
        return 0.0
    hit = np.nonzero(a >= pk * 10 ** (ONSET_REL_DB / 20.0))[0]
    return float(hit[0]) * 1000.0 / SR


def centroid_hz(x):
    """Spectral centroid of the loudest 0.5 s, in Hz (rough brightness measure)."""
    n = min(len(x), SR // 2)
    if n < 64:
        return 0.0
    i0 = int(np.argmax(np.abs(x)))
    i0 = max(0, min(i0 - n // 8, len(x) - n))
    seg = x[i0:i0 + n] * np.hanning(n)
    mag = np.abs(np.fft.rfft(seg))
    f = np.fft.rfftfreq(n, 1.0 / SR)
    s = mag.sum()
    return float((mag * f).sum() / s) if s > 0 else 0.0


def noise_floor_db(x, win_ms=10):
    """5th percentile of short-window RMS, in dBFS: what the file sits at between its sounds."""
    w = max(1, int(SR * win_ms / 1000))
    n = len(x) // w
    if n < 3:
        return -120.0
    r = np.sqrt((x[:n * w].reshape(n, w) ** 2).mean(axis=1))
    return db(np.percentile(r, 5))


def decode(path, channels=1):
    """Any audio file -> float32 mono at 48 kHz, through ffmpeg (the resampler is ffmpeg's)."""
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-ac", str(channels), "-ar", str(SR),
           "-f", "f32le", "-"]
    out = subprocess.run(cmd, capture_output=True)
    if out.returncode != 0:
        raise RuntimeError("ffmpeg could not read %s: %s" % (path, out.stderr.decode(errors="replace")[:200]))
    return np.frombuffer(out.stdout, dtype="<f4").astype(np.float64)


def clean(x, max_seconds=None, fade_ms=25.0, target_db=TARGET_PEAK_DB, rel_tail_db=-60.0, keep_end=False):
    """Trim lead and tail silence, fade the tail, normalise the peak. Returns float64 or None if empty.

    Lead: cut to 1 ms before the first sample within -50 dB of the peak (so the hit lands
    inside 10 ms), with a 1 ms fade-in so the cut cannot click.
    Tail: cut where the signal stays under -60 dB of the peak, then cosine fade.
    keep_end: when the sound is longer than max_seconds keep its LAST max_seconds (risers and
    swells peak at their end, so cutting the end would cut the point of the sound).
    """
    x = np.asarray(x, dtype=np.float64)
    if len(x) == 0:
        return None
    x = x - x.mean()
    pk = np.max(np.abs(x))
    if pk < 1e-5:
        return None
    a = np.abs(x)
    first = int(np.nonzero(a >= pk * 10 ** (ONSET_REL_DB / 20.0))[0][0])
    start = max(0, first - int(0.001 * SR))
    x = x[start:]
    a = np.abs(x)
    loud = np.nonzero(a >= pk * 10 ** (rel_tail_db / 20.0))[0]
    end = int(loud[-1]) + 1 if len(loud) else len(x)
    x = x[:end]
    cut_hard = False
    lead_fade = int(0.001 * SR)
    if max_seconds is not None and len(x) > int(max_seconds * SR):
        if keep_end:
            x = x[-int(max_seconds * SR):]
            lead_fade = int(0.006 * SR)   # starts mid-rise: a short ease-in that still keeps the onset under 10 ms
        else:
            x = x[:int(max_seconds * SR)]
            cut_hard = True
    # a cut can leave the loudest point elsewhere than before, so trim the lead again against the new peak
    a = np.abs(x)
    first2 = int(np.nonzero(a >= a.max() * 10 ** (ONSET_REL_DB / 20.0))[0][0])
    if first2 > int(0.001 * SR):
        x = x[first2 - int(0.001 * SR):]
    nf = min(len(x) // 2, int(SR * (fade_ms * (5 if cut_hard else 1)) / 1000))
    if nf > 1:
        x[-nf:] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, nf)))
    fi = min(len(x) // 4, lead_fade)
    if fi > 1:
        x[:fi] *= np.linspace(0, 1, fi)
    pk = np.max(np.abs(x))
    if pk < 1e-5:
        return None
    return x * (10 ** (target_db / 20.0) / pk)


def write_wav(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sf.write(path, np.clip(np.asarray(x, dtype=np.float64), -1, 1), SR, subtype="PCM_16")


def measure(path):
    x, sr = sf.read(path, dtype="float64", always_2d=False)
    mono = x if x.ndim == 1 else x.mean(axis=1)
    return {
        "sr": sr,
        "seconds": round(len(x) / sr, 3),
        "peak_db": round(peak_db(x), 2),
        "onset_ms": round(onset_ms(x), 2),
        "centroid_hz": round(centroid_hz(mono)),
        "noise_floor_db": round(noise_floor_db(mono), 1),
    }


def load_json(rel):
    with open(os.path.join(HERE, rel), encoding="utf-8") as f:
        return json.load(f)
