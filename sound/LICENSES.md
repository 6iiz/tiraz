# Sound licences

Every file in `packs/` is CC0: recorded samples, and sounds rendered from CC0 definitions. All were trimmed and levelled; a few were
played backwards or made into loops, and the `source` of those entries says so. Each entry in `index.json` names its pack and keeps the original
source path in `source`. Source folders were read as data only; no script from them was run.

Not bundled on purpose: Meta-open-sound's Oculus Audio Pack (CC BY 4.0) and the Meta instruments (nothing from
that repository was needed), soundcn's wow folder (Blizzard property), Kenney folders without licence text.

Your own sounds are not part of this record: a brand's `sfx` folder is tried before these packs (see `pick.py`).

## kenney

- Source: https://github.com/kapishdima/soundcn (assets/kenney_interface-sounds, assets/kenney_digital-audio; original author Kenney, kenney.nl)
- Commit: 7cbfbb3f56e8548b81fb26410bdcea657447d087
- Licence: CC0
- Files taken: 43 (Interface Sounds 1.0 and Digital Audio)
- Sentence relied on: "License: (Creative Commons Zero, CC0) ... This content is free to use in personal, educational and commercial projects. (License.txt in each of the two folders)"
- Note: Only the two Kenney folders that carry a License.txt were used. kenney_casino-audio, kenney_impact-sounds, kenney_rpg-audio, kenney_sci-fi-sounds and kenney_music-jingles have no licence text in the folder, so nothing was taken from them. Voiceover packs and the repository's wow folder (Blizzard property) were not touched.

## libre

- Source: https://github.com/TheSmallTeaBoi/the-libre-sample-pack
- Commit: 23c02341707128162fc875e622f41b6af921fed3
- Licence: CC0
- Files taken: 27 (fx/uplifters, fx/downlifters, fx/others, drums/one shot (hi hats, rimshots, kicks))
- Sentence relied on: "All contributions will be licensed under CC0 (README.md, 'To contribute'); the README's License section reads: CC0."
- Note: Contributors are credited by the @name tag in the original file names; the source path is kept in each index entry's source field.

## plink

- Source: https://github.com/maximilianfeix/plinkfx
- Commit: 7e5f6a477037679a29df9c5141e9853b1267e7d8
- Licence: CC0
- Files taken: 89 (sound definitions from src/sounds.gen.ts, rendered by sound/plink.py)
- Sentence relied on: "The sounds in plinkfx are dedicated to the public domain under CC0 1.0 Universal. This covers the sound definitions (library/*.ts, src/sounds.gen.ts, library/catalog.gen.json) and every audio file rendered from them. (LICENSE-SOUNDS)"
- Note: plink.py is a port of plinkfx/src/core/synth.ts, which is MIT: Copyright (c) 2026 Maximilian Feix. The MIT permission notice applies to plink.py and is kept here as required.

## sonicpi

- Source: https://github.com/sonic-pi-net/sonic-pi (etc/samples)
- Commit: e70873e09c105407e9fbc8f3bba6343c2da24511
- Licence: CC0
- Files taken: 38 (etc/samples/*.flac (ambi_, perc_, elec_, glitch_, vinyl_, misc_cineboom, bass_drop_c; drum_ and elec_ cymbals played backwards as swells; ambi_ and tbd_ ambiences looped as beds))
- Sentence relied on: "The samples prefixed with `arovane_` have been kindly donated by Uwe Zahn (Arovane) under a Creative Commons 0 license. All other samples in this directory are from http://freesound.org and have also been placed in the public domain via the Creative Commons 0 License. The tbd_ samples are listed there as 'Donated by The Black Dog under a CC0 license'. (etc/samples/README.md)"
- Note: Sonic Pi's own code is MIT/other and was not taken; only the sample README's statement was relied on.

## ui

- Source: https://github.com/romainsimon/uisfx
- Commit: 9950fe66f993a6660dab9c2651dcbcd899ffd83b
- Licence: CC0
- Files taken: 44 (packages/uisfx/sounds/<style>/<cue>.ogg (generated UI sounds, 12 styles))
- Sentence relied on: "UI SFX audio assets are dedicated to the public domain under the Creative Commons CC0 1.0 Universal Public Domain Dedication. (LICENSE-AUDIO)"
- Note: Code of that repository is MIT and was not taken. Nothing under its .generated folder was used.

## plinkfx MIT notice (applies to plink.py)

MIT License

Copyright (c) 2026 Maximilian Feix

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The sounds (sound definitions and rendered audio) are CC0 1.0, see LICENSE-SOUNDS.
