"""Choose a sound by kind. The same arguments always choose the same file.

    python pick.py --kind pop [--tag soft] [--variant 2]      print the file path
    python pick.py --kind pop --json                          print the whole index entry
    python pick.py --kind pop --own <folder>                  your own sounds first, then the kit's
    python pick.py --legacy whoosh-short --own <folder>       resolve a cue name through that folder's legacy.json
    python pick.py --list [--own <folder>]                    kinds, counts and tags

Importable: pick(kind, tag=None, variant=0, own=None) returns the index entry (a dict) with an extra
"path" (absolute). Candidates are ordered round-robin across packs (packs sorted by name, files
by id), so variants 0, 1, 2 come from different packs and sound different from each other;
variant n wraps around when it passes the number of candidates.

Your own sounds: `own` is a folder of WAV files (a brand's `sfx` folder). A file answers a kind when its name
starts with the kind: `pop.wav`, `pop-2.wav`, `whoosh_long.wav`, `bed.wav`. The words after the kind are its tags
(`whoosh_long.wav` answers the tag "long"). Own sounds come first, in name order, and the kit's follow, so
variant 0 is yours and a variant past your last file is the kit's. Two optional files in that folder say
more: `pack.json` ({"file.wav": {"kind": "pop", "tags": ["low"], "anchor": "end"}}, which replaces the naming
rule) and `defaults.json` ({"pop": ["file-name-start", ...]}, the order to try first).
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENDS_ON_T = ("riser", "swell")      # these peak at their last moment, so they are placed to end on the cue's time
_cache = {}


class PickError(ValueError):
    pass


def _load(name):
    if name not in _cache:
        with open(os.path.join(HERE, name), encoding="utf-8") as f:
            _cache[name] = json.load(f)
    return _cache[name]


def own_entries(folder):
    """The sounds in a folder of your own, as index-like entries (see the module text for the naming rule)."""
    if not folder:
        return []
    folder = os.path.abspath(folder)
    if ("own", folder) in _cache:
        return _cache[("own", folder)]
    if not os.path.isdir(folder):
        raise PickError("The folder of own sounds does not exist: %s" % folder)
    kinds = _load("kinds.json")
    wavs = sorted(f for f in os.listdir(folder) if f.lower().endswith(".wav"))
    meta = None
    pj = os.path.join(folder, "pack.json")
    if os.path.isfile(pj):
        with open(pj, encoding="utf-8") as f:
            meta = json.load(f)
    out = []
    for fn in wavs:
        stem = os.path.splitext(fn)[0]
        if meta is not None:
            m = meta.get(fn)
            if m is None:
                continue                      # pack.json is the whole list: a file it does not name is not a kind
            kind, tags, anchor = m.get("kind"), list(m.get("tags", [])), m.get("anchor")
            if kind not in kinds:
                raise PickError("%s: pack.json gives '%s' the kind '%s'. Known kinds: %s." % (folder, fn, kind, ", ".join(sorted(kinds))))
        else:
            low = stem.lower()
            kind = next((k for k in sorted(kinds, key=len, reverse=True) if low == k or (low.startswith(k) and low[len(k)] in "-_. ")), None)
            if kind is None:
                continue                      # an ordinary file: still reachable by its name, just not by kind
            tags, anchor = [t for t in re.split(r"[-_. ]+", low[len(kind):]) if t], None
        out.append({"id": "own/" + stem, "kind": kind, "file": fn, "pack": "own", "licence": "own", "seconds": None, "peak_db": None,
                    "tags": sorted(set(tags)), "anchor": anchor or ("end" if kind in ENDS_ON_T else "start"),
                    "path": os.path.join(folder, fn)})
    dj = os.path.join(folder, "defaults.json")
    if os.path.isfile(dj):
        with open(dj, encoding="utf-8") as f:
            order = json.load(f)
        first = []
        for kind, prefixes in order.items():
            for prefix in prefixes if isinstance(prefixes, list) else []:
                hit = next((e for e in out if e["kind"] == kind and e["file"].startswith(prefix) and e not in first), None)
                if hit is not None:
                    first.append(hit)
        out = first + [e for e in out if e not in first]
    _cache[("own", folder)] = out
    return out


def _candidates(kind, tag, own=None):
    kinds = _load("kinds.json")
    if kind not in kinds:
        raise PickError("Unknown sound kind '%s'. Known kinds: %s." % (kind, ", ".join(sorted(kinds))))
    mine = [e for e in own_entries(own) if e["kind"] == kind]
    es = [e for e in _load("index.json") if e["kind"] == kind]
    if not es and not mine:
        raise PickError("The kind '%s' has no sounds: none in the kit's index.json and none of your own." % kind)
    if tag is not None:
        mine2, es2 = [e for e in mine if tag in e["tags"]], [e for e in es if tag in e["tags"]]
        if not es2 and not mine2:
            have = sorted({t for e in es + mine for t in e["tags"]})
            raise PickError("No '%s' sound has the tag '%s'. Tags for this kind: %s." % (kind, tag, ", ".join(have)))
        mine, es = mine2, es2
    if not es:
        return mine
    by_pack = {}
    for e in sorted(es, key=lambda e: e["id"]):
        by_pack.setdefault(e["pack"], []).append(e)
    packs = [by_pack[p] for p in sorted(by_pack)]
    out = []
    for i in range(max(len(p) for p in packs)):
        for p in packs:
            if i < len(p):
                out.append(p[i])
    # sound meant to be layered (tag "sub", weak on a phone) comes last unless the caller asked for it;
    # the sort is stable, so the round-robin order is kept inside each group
    out = sorted(out, key=lambda e: "sub" in e["tags"] and tag != "sub")
    # defaults.json names the sounds to try first for each kind (variant 0, 1, 2 ...), so the first
    # choice is a deliberate one and not whichever pack sorts first
    first = []
    for prefix in _load("defaults.json").get(kind, []):
        hit = next((e for e in out if e["id"].startswith(prefix) and e not in first), None)
        if hit is not None:
            first.append(hit)
    return mine + first + [e for e in out if e not in first]


def pick(kind, tag=None, variant=0, own=None):
    """Return the index entry for (kind, tag, variant), plus "path". Deterministic. `own`: a folder of your own sounds, tried first."""
    if not isinstance(variant, int) or variant < 0:
        raise PickError("Variant must be a whole number from 0 up, got %r." % (variant,))
    c = _candidates(kind, tag, own)
    e = dict(c[variant % len(c)])
    if "path" not in e:
        e["path"] = os.path.normpath(os.path.join(HERE, e["file"]))
    return e


def pick_legacy(name, variant=None, own=None):
    """Resolve a cue name of your own through `legacy.json` in your sounds folder:
    {"whoosh-long": {"kind": "whoosh", "tag": "long", "variant": 0}}. It lets older specs that named
    sounds keep working after the sounds were renamed by kind. An explicit variant adds to the table's own."""
    table = {}
    lj = os.path.join(os.path.abspath(own), "legacy.json") if own else None
    if lj and os.path.isfile(lj):
        with open(lj, encoding="utf-8") as f:
            table = json.load(f)
    if name not in table:
        raise PickError("The cue name '%s' is not a WAV in your sounds folder, and no legacy.json there names it. "
                        "Ask for a sound by \"kind\" instead (python sound/pick.py --list)." % name)
    r = table[name]
    return pick(r["kind"], r.get("tag"), r.get("variant", 0) + (variant or 0), own)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Choose a sound by kind.")
    ap.add_argument("--kind")
    ap.add_argument("--tag")
    ap.add_argument("--variant", type=int, default=0)
    ap.add_argument("--legacy")
    ap.add_argument("--own", help="a folder of your own sounds, tried before the kit's")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args(argv)
    try:
        if a.list:
            mine = own_entries(a.own)
            for k, line in _load("kinds.json").items():
                es = [e for e in mine if e["kind"] == k] + [e for e in _load("index.json") if e["kind"] == k]
                tags = sorted({t for e in es for t in e["tags"]})
                own_n = sum(e["pack"] == "own" for e in es)
                print("%-8s %3d%s  %s\n         tags: %s" % (k, len(es), " (%d yours)" % own_n if own_n else "", line, ", ".join(tags)))
            return 0
        if a.legacy:
            e = pick_legacy(a.legacy, a.variant or None, a.own)
        elif a.kind:
            e = pick(a.kind, a.tag, a.variant, a.own)
        else:
            ap.error("give --kind, --legacy or --list")
    except PickError as err:
        print(str(err), file=sys.stderr)
        return 1
    print(json.dumps(e, ensure_ascii=False) if a.json else e["path"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
