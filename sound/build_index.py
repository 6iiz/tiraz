"""Measure every file in packs/ and write index.json and LICENSES.md.

Run it after adding or removing files in packs/. Every pack folder has a pack.json next to its WAVs with
the kind, tags and source of every file. Everything in the index is measured from the file on disk.
"""
import json
import os

import soundfile as sf

import phone_check
import soundlib as S

PACKS = {
    "ui": {
        "licence": "CC0", "repo": "https://github.com/romainsimon/uisfx", "commit": "9950fe66f993a6660dab9c2651dcbcd899ffd83b",
        "taken": "packages/uisfx/sounds/<style>/<cue>.ogg (generated UI sounds, 12 styles)",
        "sentence": "UI SFX audio assets are dedicated to the public domain under the Creative Commons CC0 1.0 Universal Public Domain Dedication. (LICENSE-AUDIO)",
        "note": "Code of that repository is MIT and was not taken. Nothing under its .generated folder was used.",
    },
    "kenney": {
        "licence": "CC0", "repo": "https://github.com/kapishdima/soundcn (assets/kenney_interface-sounds, assets/kenney_digital-audio; original author Kenney, kenney.nl)",
        "commit": "7cbfbb3f56e8548b81fb26410bdcea657447d087",
        "taken": "Interface Sounds 1.0 and Digital Audio",
        "sentence": "License: (Creative Commons Zero, CC0) ... This content is free to use in personal, educational and commercial projects. (License.txt in each of the two folders)",
        "note": "Only the two Kenney folders that carry a License.txt were used. kenney_casino-audio, kenney_impact-sounds, kenney_rpg-audio, kenney_sci-fi-sounds and kenney_music-jingles have no licence text in the folder, so nothing was taken from them. Voiceover packs and the repository's wow folder (Blizzard property) were not touched.",
    },
    "libre": {
        "licence": "CC0", "repo": "https://github.com/TheSmallTeaBoi/the-libre-sample-pack", "commit": "23c02341707128162fc875e622f41b6af921fed3",
        "taken": "fx/uplifters, fx/downlifters, fx/others, drums/one shot (hi hats, rimshots, kicks)",
        "sentence": "All contributions will be licensed under CC0 (README.md, 'To contribute'); the README's License section reads: CC0.",
        "note": "Contributors are credited by the @name tag in the original file names; the source path is kept in each index entry's source field.",
    },
    "sonicpi": {
        "licence": "CC0", "repo": "https://github.com/sonic-pi-net/sonic-pi (etc/samples)", "commit": "e70873e09c105407e9fbc8f3bba6343c2da24511",
        "taken": "etc/samples/*.flac (ambi_, perc_, elec_, glitch_, vinyl_, misc_cineboom, bass_drop_c; drum_ and elec_ cymbals played backwards as swells; ambi_ and tbd_ ambiences looped as beds)",
        "sentence": "The samples prefixed with `arovane_` have been kindly donated by Uwe Zahn (Arovane) under a Creative Commons 0 license. All other samples in this directory are from http://freesound.org and have also been placed in the public domain via the Creative Commons 0 License. The tbd_ samples are listed there as 'Donated by The Black Dog under a CC0 license'. (etc/samples/README.md)",
        "note": "Sonic Pi's own code is MIT/other and was not taken; only the sample README's statement was relied on.",
    },
    "plink": {
        "licence": "CC0", "repo": "https://github.com/maximilianfeix/plinkfx", "commit": "7e5f6a477037679a29df9c5141e9853b1267e7d8",
        "taken": "sound definitions from src/sounds.gen.ts, rendered by sound/plink.py",
        "sentence": "The sounds in plinkfx are dedicated to the public domain under CC0 1.0 Universal. This covers the sound definitions (library/*.ts, src/sounds.gen.ts, library/catalog.gen.json) and every audio file rendered from them. (LICENSE-SOUNDS)",
        "note": "plink.py is a port of plinkfx/src/core/synth.ts, which is MIT: Copyright (c) 2026 Maximilian Feix. The MIT permission notice applies to plink.py and is kept here as required.",
    },
}
SUB_SHARE = 0.3
ANCHOR_END = {"riser", "swell"}


def build():
    entries = []
    per_pack = {}
    for pack in sorted(PACKS):
        d = os.path.join(S.HERE, "packs", pack)
        pj = os.path.join(d, "pack.json")
        if not os.path.exists(pj):
            raise SystemExit("Missing %s: every pack folder needs a pack.json (kind, tags and source of each file)." % pj)
        with open(pj, encoding="utf-8") as f:
            meta = json.load(f)
        for fn in sorted(meta):
            path = os.path.join(d, fn)
            if not os.path.exists(path):
                raise SystemExit("pack.json lists %s but the file is missing." % path)
            m = S.measure(path)
            e = meta[fn]
            x, _ = sf.read(path)
            share = phone_check.energy_share_above(x if x.ndim == 1 else x.mean(axis=1))
            tags = set(e["tags"])
            if share < SUB_SHARE:
                tags.add("sub")   # most energy under 250 Hz: weak on a phone, meant to be layered
            tags = sorted(tags)
            entries.append({
                "id": "%s/%s" % (pack, os.path.splitext(fn)[0]),
                "kind": e["kind"], "file": "packs/%s/%s" % (pack, fn), "pack": pack,
                "licence": PACKS[pack]["licence"], "seconds": m["seconds"], "peak_db": m["peak_db"],
                "tags": tags, "anchor": e.get("anchor", "end" if e["kind"] in ANCHOR_END else "start"),
                "centroid_hz": m["centroid_hz"], "hi_share": round(float(share), 3), "source": e["source"],
            })
            per_pack[pack] = per_pack.get(pack, 0) + 1
    ids = [e["id"] for e in entries]
    if len(ids) != len(set(ids)):
        raise SystemExit("Two sounds have the same id; rename one of the source files.")
    with open(os.path.join(S.HERE, "index.json"), "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=1, ensure_ascii=False)
    write_licences(per_pack)
    return entries


def write_licences(per_pack):
    out = ["# Sound licences", "",
           "Every file in `packs/` is CC0: recorded samples, and sounds rendered from CC0 definitions. All were trimmed and levelled; a few were",
           "played backwards or made into loops, and the `source` of those entries says so. Each entry in `index.json` names its pack and keeps the original",
           "source path in `source`. Source folders were read as data only; no script from them was run.", "",
           "Not bundled on purpose: Meta-open-sound's Oculus Audio Pack (CC BY 4.0) and the Meta instruments (nothing from",
           "that repository was needed), soundcn's wow folder (Blizzard property), Kenney folders without licence text.", "",
           "Your own sounds are not part of this record: a brand's `sfx` folder is tried before these packs (see `pick.py`).", ""]
    for pack in sorted(PACKS):
        p = PACKS[pack]
        out += ["## %s" % pack, "",
                "- Source: %s" % p["repo"], "- Commit: %s" % p["commit"], "- Licence: %s" % p["licence"],
                "- Files taken: %d (%s)" % (per_pack.get(pack, 0), p["taken"]),
                "- Sentence relied on: \"%s\"" % p["sentence"], "- Note: %s" % p["note"], ""]
    lic = os.path.join(S.HERE, "plinkfx-LICENSE.txt")
    text = open(lic, encoding="utf-8").read().strip() if os.path.exists(lic) else "MIT License, Copyright (c) 2026 Maximilian Feix (full text: plinkfx/LICENSE)"
    out += ["## plinkfx MIT notice (applies to plink.py)", "", text, ""]
    with open(os.path.join(S.HERE, "LICENSES.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(out))


if __name__ == "__main__":
    es = build()
    kinds = {}
    for e in es:
        kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
    print("index.json: %d entries" % len(es))
    print(dict(sorted(kinds.items())))
