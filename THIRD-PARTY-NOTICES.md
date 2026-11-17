# Third-party notices

Tiraz's own files are under the MIT licence (`LICENSE`). The kit also includes work by other authors, and each of those parts keeps its own licence. The detailed records (source, version or commit, the licence sentence relied on) are in the files named in the last column. Licence texts are beside each part and in `licenses/`.

## Code libraries

| Part | Where | Licence | Record |
|---|---|---|---|
| HarfBuzz for the web (harfbuzzjs 1.6.4) | `vendor/harfbuzzjs/` | MIT | `vendor/harfbuzzjs/LICENSE` |
| Flubber 0.4.2 | `vendor/flubber/` | MIT | `vendor/flubber/LICENSE` |
| three.js r170 (the core library, for a scene on a customer's page; copied into that page's folder with its licence) | `vendor/three/` | MIT, Copyright 2010-2024 three.js authors | `vendor/three/LICENSE` |
| gl-transitions (279 GLSL transitions, each by its own author) | `vendor/gl-transitions/` | MIT, except one BSD-2-Clause and one BSD-3-Clause; the licence and author are in the header of every file | `vendor/gl-transitions/LICENSES.md` |
| plinkfx synthesiser, ported to Python as `sound/plink.py` | `sound/plink.py` | MIT, Copyright (c) 2026 Maximilian Feix | `sound/LICENSES.md` |
| Playwright (installed by `npm install`, not included) | `package.json` | Apache-2.0 | its own package |

## Fonts

28 font families in `assets/fonts/` (27 with Arabic letters, and JetBrains Mono), each under the SIL Open Font License 1.1 with its `OFL.txt` in its folder. They come from the Google Fonts repository (JetBrains Mono from its own). The fonts may be used, embedded and redistributed with the kit; they may not be sold by themselves, and a modified font may not use a Reserved Font Name. Record: `assets/LICENSES.md`.

## Icons and emoji

| Set | Licence | Licence text |
|---|---|---|
| Tabler Icons, Copyright (c) 2020-2026 Paweł Kuna | MIT | `assets/icons/tabler/LICENSE` |
| Lucide, Copyright (c) 2026 Lucide Icons and Contributors; some icons from Feather, Copyright (c) 2013-present Cole Bemis (MIT) | ISC | `assets/icons/lucide/LICENSE` |
| Phosphor Icons, Copyright (c) 2023 Phosphor Icons | MIT | `assets/icons/ph/LICENSE` |
| Material Symbols (Google) | Apache-2.0 | `assets/icons/material-symbols/LICENSE` |
| Fluent Emoji, flat, Copyright (c) Microsoft Corporation | MIT | `assets/icons/fluent-emoji-flat/LICENSE` |

In `assets/icons/` as Iconify JSON. Two changes were made to each set: whitespace was removed from `icons.json`, and company logos and product marks that the original sets contain were left out. The drawings are not edited. Record: `assets/LICENSES.md`.

## Sounds

241 sounds in `sound/packs/`, every one CC0. Record: `sound/LICENSES.md`.

| Pack | From | Licence |
|---|---|---|
| `ui` | UI SFX (romainsimon/uisfx) | CC0 1.0 for the audio (`sound/packs/ui/LICENSE-AUDIO`) |
| `kenney` | Kenney interface and digital audio packs (kenney.nl) | CC0 1.0 |
| `libre` | the-libre-sample-pack | CC0 1.0 |
| `sonicpi` | the samples shipped with Sonic Pi | CC0 1.0 |
| `plink` | rendered from plinkfx sound definitions (maximilianfeix/plinkfx) | CC0 1.0 for the definitions and any audio rendered from them (`sound/packs/plink/LICENSE-SOUNDS`) |

The recorded sounds were trimmed (long ones cut short with a fade), converted to 48 kHz WAV and levelled. Six cymbals are played backwards to make swells, and three ambiences are folded into seamless loops to make beds; `sound/build_packs.py` holds every rule. The kit ships no sounds made by its authors: a brand's own sounds live in that brand's `sfx` folder.

## Guides

Some rules in `guides/` were adapted from MIT and Apache-2.0 licensed guides by Vyral, Jake Schincariol, Roman Knox, Artem Novitckii, Ahmed Badawood, Julio (juliobsz), Tejas Makwana and the impeccable project. The copyright lines, the MIT permission notice, the Apache attribution and the list of sections that drew on each are in `guides/THIRD-PARTY.md`. Facts quoted from public references are listed with their sources in `guides/references.md`.

## What the kit does not include

No look, scene, ending, background or site template: those are written for each brand, in that brand's own folder, and belong to that brand. No 3D scenes (three.js is the library alone) and no Blender files. No music.

## The author's mark

The plugin icon (`.claude-plugin/icon.png`) is the author's own logo, and `docs/3d-reels.jpg` shows frames of his own published reels. Both identify the author. They are not covered by the MIT licence and are not material for anyone else's brand.

## Licence texts

`licenses/MIT.txt`, `licenses/ISC-Lucide.txt`, `licenses/Apache-2.0.txt`, `licenses/BSD-2-Clause.txt`, `licenses/BSD-3-Clause.txt`, `licenses/OFL-1.1.txt`, `licenses/CC0-1.0.txt`.
