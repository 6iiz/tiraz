"""How a mix sounds on a phone speaker, by two numbers.

    python phone_check.py <wav or mp4>

1. Integrated loudness (LUFS, EBU R128) after a 250 Hz high-pass, which is roughly what a phone
   speaker plays. Measured by ffmpeg's ebur128 filter.
2. The share of the file's energy above 250 Hz, from an FFT over the whole mix (mono).
A mix that lives below 250 Hz sounds empty on a phone: if the share is low, or the high-passed
loudness is much lower than the full-range loudness, add mid-range body (see kind 'impact').
Exit code 0 always when the file could be read; the numbers are information, not a verdict,
except the printed warnings.
"""
import re
import subprocess
import sys

import numpy as np

SR = 48000


def _ebur128(path, hp):
    af = ("highpass=f=250," if hp else "") + "ebur128=peak=true"
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vn", "-af", af, "-f", "null", "-"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg could not read '%s': %s" % (path, r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "unknown error"))
    tail = r.stderr.split("Summary:")[-1]
    m = re.search(r"I:\s+(-?[\d.]+|-inf)\s+LUFS", tail)
    if not m:
        raise RuntimeError("ffmpeg gave no loudness for '%s' (is there an audio track?)." % path)
    return -120.0 if m.group(1) == "-inf" else float(m.group(1))


def _samples(path):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    if r.returncode != 0 or not r.stdout:
        raise RuntimeError("ffmpeg found no audio in '%s'." % path)
    return np.frombuffer(r.stdout, dtype="<f4").astype(np.float64)


def energy_share_above(x, hz=250.0):
    """Fraction (0..1) of signal energy above hz, summed over 1 s blocks so very long files stay light."""
    blk = SR
    f = np.fft.rfftfreq(blk, 1.0 / SR)
    hi = tot = 0.0
    for i in range(0, max(len(x) - blk + 1, 1), blk):
        seg = x[i:i + blk]
        if len(seg) < blk:
            seg = np.pad(seg, (0, blk - len(seg)))
        p = np.abs(np.fft.rfft(seg * np.hanning(blk))) ** 2
        hi += p[f > hz].sum()
        tot += p.sum()
    return hi / tot if tot > 0 else 0.0


def check(path):
    full = _ebur128(path, False)
    phone = _ebur128(path, True)
    share = energy_share_above(_samples(path))
    return {"lufs_full": full, "lufs_after_250hz_highpass": phone, "share_above_250hz": share}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python phone_check.py <wav or mp4>", file=sys.stderr)
        sys.exit(2)
    try:
        r = check(sys.argv[1])
    except RuntimeError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
    print("Loudness, full range:            %6.1f LUFS" % r["lufs_full"])
    print("Loudness after 250 Hz high-pass: %6.1f LUFS" % r["lufs_after_250hz_highpass"])
    print("Energy above 250 Hz:             %6.1f %%" % (100 * r["share_above_250hz"]))
    if r["share_above_250hz"] < 0.35:
        print("Warning: most of this mix lives below 250 Hz and will sound thin or empty on a phone.")
    if r["lufs_full"] - r["lufs_after_250hz_highpass"] > 6:
        print("Warning: the phone-range loudness is more than 6 LU under the full mix.")
