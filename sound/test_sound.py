"""One command that checks the whole sound module:  python test_sound.py

Checks every index entry (file exists, 48 kHz, peak <= -1 dBFS, onset within 10 ms, known kind,
allowed licence, no forbidden source in the path), that every WAV in packs/ is indexed, that every
kind has enough sounds, that beds loop without a click, that risers and swells end on their time,
that pick is deterministic, that your own sounds are tried before the kit's, and that plink renders
the same bytes twice. Then prints counts per kind and total size.
All failures are listed together; exit code 1 if there is any.
"""
import json
import os
import shutil
import sys
import tempfile

import numpy as np
import soundfile as sf

import plink
import pick as P
import soundlib as S

HERE = S.HERE
fails = []


def fail(msg):
    fails.append(msg)


def own_sounds():
    """A folder of your own sounds is tried first: by file name, or by its pack.json; legacy.json maps older names."""
    tmp = tempfile.mkdtemp(prefix="tiraz-own-")
    try:
        tone = 0.2 * np.sin(2 * np.pi * 440 * np.arange(4800) / 48000)
        for name in ("pop.wav", "pop-2.wav", "whoosh_long.wav", "swell.wav", "jingle.wav"):
            sf.write(os.path.join(tmp, name), tone, 48000)
        first = P.pick("pop", own=tmp)
        if first["pack"] != "own" or os.path.basename(first["path"]) != "pop-2.wav":      # name order: "pop-2.wav" sorts before "pop.wav"
            fail("own sounds: pick('pop') gave %s, expected your own pop-2.wav first." % first["id"])
        if P.pick("pop", variant=1, own=tmp)["id"] != "own/pop":
            fail("own sounds: variant 1 of 'pop' should be your second file.")
        if P.pick("pop", variant=2, own=tmp)["pack"] == "own":
            fail("own sounds: variant 2 of 'pop' should be the kit's first choice, after your two files.")
        if P.pick("pop", variant=2, own=tmp)["id"] != P.pick("pop")["id"]:
            fail("own sounds: after your files the kit's order must be unchanged.")
        if P.pick("whoosh", tag="long", own=tmp)["id"] != "own/whoosh_long":
            fail("own sounds: 'whoosh_long.wav' should answer the tag 'long'.")
        if P.pick("swell", own=tmp)["anchor"] != "end":
            fail("own sounds: a swell of your own must end on its time like the kit's.")
        if any(e["file"] == "jingle.wav" for e in P.own_entries(tmp)):
            fail("own sounds: 'jingle.wav' does not start with a kind and must not answer one.")
        if P.pick("click", own=tmp)["pack"] == "own":
            fail("own sounds: a kind you have no file for must come from the kit.")
        with open(os.path.join(tmp, "legacy.json"), "w", encoding="utf-8") as f:
            json.dump({"old-whoosh": {"kind": "whoosh", "tag": "long"}}, f)
        if P.pick_legacy("old-whoosh", own=tmp)["id"] != "own/whoosh_long":
            fail("own sounds: legacy.json in your folder should map an older cue name to a kind.")
        try:
            P.pick_legacy("no-such-name", own=tmp)
            fail("own sounds: an unknown cue name must be refused with a sentence.")
        except P.PickError:
            pass
        # a second folder that describes its files in pack.json instead of by name
        tmp2 = os.path.join(tmp, "described")
        os.makedirs(tmp2)
        sf.write(os.path.join(tmp2, "a.wav"), tone, 48000)
        sf.write(os.path.join(tmp2, "b.wav"), tone, 48000)
        with open(os.path.join(tmp2, "pack.json"), "w", encoding="utf-8") as f:
            json.dump({"a.wav": {"kind": "ding", "tags": ["soft"]}, "b.wav": {"kind": "ding", "tags": ["hard"]}}, f)
        with open(os.path.join(tmp2, "defaults.json"), "w", encoding="utf-8") as f:
            json.dump({"ding": ["b"]}, f)
        if P.pick("ding", own=tmp2)["id"] != "own/b" or P.pick("ding", tag="soft", own=tmp2)["id"] != "own/a":
            fail("own sounds: pack.json and defaults.json in your folder should give kinds, tags and order.")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    kinds = S.load_json("kinds.json")
    index = S.load_json("index.json")

    if len(kinds) < 20:
        fail("kinds.json has %d kinds; at least 20 are expected." % len(kinds))
    for k, line in kinds.items():
        if not isinstance(line, str) or len(line) < 10:
            fail("kinds.json: kind '%s' needs a one-line description." % k)

    ids = [e["id"] for e in index]
    if len(ids) != len(set(ids)):
        fail("index.json has duplicate ids.")
    needed = {"id", "kind", "file", "pack", "licence", "seconds", "peak_db", "tags"}
    on_disk = set()
    for root, _, files in os.walk(os.path.join(HERE, "packs")):
        for f in files:
            if f.endswith(".wav"):
                on_disk.add(os.path.relpath(os.path.join(root, f), HERE).replace("\\", "/"))
    indexed = set()
    total_bytes = 0
    per_kind = {}
    for e in index:
        eid = e.get("id", "?")
        missing = needed - set(e)
        if missing:
            fail("%s: index entry lacks %s." % (eid, ", ".join(sorted(missing))))
            continue
        indexed.add(e["file"])
        path = os.path.join(HERE, e["file"])
        per_kind[e["kind"]] = per_kind.get(e["kind"], 0) + 1
        if e["kind"] not in kinds:
            fail("%s: kind '%s' is not in kinds.json." % (eid, e["kind"]))
        if not e["licence"].startswith(("CC0", "MIT", "Unlicense")):
            fail("%s: licence '%s' is not CC0, MIT or Unlicense." % (eid, e["licence"]))
        low = (e["file"] + " " + e.get("source", "")).lower()
        if "wow" in low or "oculus" in low:
            fail("%s: path or source mentions a forbidden pack (wow/oculus)." % eid)
        if not os.path.exists(path):
            fail("%s: file %s does not exist." % (eid, e["file"]))
            continue
        total_bytes += os.path.getsize(path)
        m = S.measure(path)
        if m["sr"] != 48000:
            fail("%s: sample rate is %d, not 48000." % (eid, m["sr"]))
        if m["peak_db"] > -1.0:
            fail("%s: peak %.2f dBFS is above -1." % (eid, m["peak_db"]))
        if abs(m["peak_db"] - e["peak_db"]) > 0.1 or abs(m["seconds"] - e["seconds"]) > 0.002:
            fail("%s: index says %.2f dB / %.3f s but the file measures %.2f dB / %.3f s. Rebuild the index." % (
                eid, e["peak_db"], e["seconds"], m["peak_db"], m["seconds"]))
        if m["onset_ms"] > S.ONSET_MAX_MS:
            fail("%s: first sound starts at %.1f ms (limit %.0f)." % (eid, m["onset_ms"], S.ONSET_MAX_MS))
        if e["kind"] in P.ENDS_ON_T and e.get("anchor") != "end":
            fail("%s: a %s peaks at its last moment, so its anchor must be \"end\" (it is placed to end on the cue's time)." % (eid, e["kind"]))
        if e["kind"] == "bed":
            # the assembler repeats a bed end to start: the step from the last sample back to the first must be no
            # bigger than the steps the sound makes anyway, or every repeat clicks
            x, _ = sf.read(path)
            x = x if x.ndim == 1 else x.mean(axis=1)
            wrap, usual = abs(x[0] - x[-1]), float(np.percentile(np.abs(np.diff(x)), 99.9))
            if wrap > 1.5 * usual + 1e-4:
                fail("%s: this bed clicks where it repeats (the step from its end to its start is %.4f, the sound's own largest steps are %.4f)." % (eid, wrap, usual))
    for f in sorted(on_disk - indexed):
        fail("%s is in packs/ but not in index.json." % f)
    for k in kinds:
        if per_kind.get(k, 0) < 6:
            fail("kind '%s' has only %d sounds; at least 6 variants are expected." % (k, per_kind.get(k, 0)))
    if total_bytes > 60 * 1024 * 1024:
        fail("packs are %.1f MB; the limit is 60 MB." % (total_bytes / 1048576))
    for kind, prefixes in S.load_json("defaults.json").items():
        if kind.startswith("_"):
            continue
        for prefix in prefixes:
            if not any(e["id"].startswith(prefix) and e["kind"] == kind for e in index):
                fail("defaults.json: no '%s' sound has an id that starts with '%s'." % (kind, prefix))

    # pick: same arguments, same file
    for k in kinds:
        for v in range(8):
            try:
                a, b = P.pick(k, None, v), P.pick(k, None, v)
            except P.PickError as err:
                fail("pick(%s, variant %d): %s" % (k, v, err))
                break
            if a["id"] != b["id"]:
                fail("pick(%s, variant %d) is not deterministic." % (k, v))
        ids6 = {P.pick(k, None, v)["id"] for v in range(min(6, per_kind.get(k, 0)))} if per_kind.get(k) else set()
        if per_kind.get(k, 0) >= 6 and len(ids6) < 6:
            fail("pick(%s): variants 0 to 5 do not give 6 different files." % k)

    own_sounds()

    # plink: same seed, same bytes (only where a plinkfx checkout is at hand)
    cat = {e["name"]: e["sound"] for e in plink.load_catalogue()} if plink.DEFAULT_SRC and os.path.isdir(plink.DEFAULT_SRC) else {}
    for name in ("click", "coin", "toggle-on"):
        if name in cat:
            a, b = plink.render(cat[name], 3), plink.render(cat[name], 3)
            if not np.array_equal(a, b):
                fail("plink render of '%s' is not deterministic." % name)

    print("Sounds per kind:")
    for k in kinds:
        print("  %-8s %3d" % (k, per_kind.get(k, 0)))
    print("Total: %d sounds in %d files on disk, %.1f MB" % (len(index), len(on_disk), total_bytes / 1048576))
    if fails:
        print("\n%d problem(s):" % len(fails))
        for f in fails:
            print(" - " + f)
        return 1
    print("\nAll sound checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
