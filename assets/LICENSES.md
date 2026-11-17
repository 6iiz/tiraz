# Licences of the bundled assets

Every third-party file in `assets/` has its licence recorded here (ARCHITECTURE.md rule 4). `tools/assets.py reindex` rewrites the two marked sections.

<!-- icons:start -->
## Icons and emoji

Everything under `assets/icons/<set>/` is a copy of an Iconify JSON package with two changes: whitespace is removed from `icons.json`, and icons that are company logos or product marks are left out (counted below). The drawings themselves are not edited. Licence text of each set: the URL below, taken from the set's own `info.json`.

### Fluent Emoji Flat (`fluent-emoji-flat`)
- Source: npm package `@iconify-json/fluent-emoji-flat` 1.2.6
- Author: Microsoft Corporation (https://github.com/microsoft/fluentui-emoji)
- Licence: MIT (https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE)
- Licence sentence in info.json: "MIT" (info.json carries only the licence name and a link, no longer sentence).
- Taken: 3174 emojis (colour) plus 7 aliases (company logos left out: 0), `icons.json`, `info.json`, `metadata.json`

### Lucide (`lucide`)
- Source: npm package `@iconify-json/lucide` 1.2.150
- Author: Lucide Contributors (https://github.com/lucide-icons/lucide)
- Licence: ISC (https://github.com/lucide-icons/lucide/blob/main/LICENSE)
- Licence sentence in info.json: "ISC" (info.json carries only the licence name and a link, no longer sentence).
- Taken: 2076 icons (stroke) plus 224 aliases (company logos left out: 19), `icons.json`, `info.json`, `metadata.json`

### Material Symbols (`material-symbols`)
- Source: npm package `@iconify-json/material-symbols` 1.2.97
- Author: Google (https://github.com/google/material-design-icons)
- Licence: Apache-2.0 (https://github.com/google/material-design-icons/blob/master/LICENSE)
- Licence sentence in info.json: "Apache 2.0" (info.json carries only the licence name and a link, no longer sentence).
- Taken: 16217 icons (fill) plus 7971 aliases (company logos left out: 258), `icons.json`, `info.json`, `metadata.json`

### Phosphor (`ph`)
- Source: npm package `@iconify-json/ph` 1.2.2, upstream version 2.1.1
- Author: Phosphor Icons (https://github.com/phosphor-icons/core)
- Licence: MIT (https://github.com/phosphor-icons/core/blob/main/LICENSE)
- Licence sentence in info.json: "MIT" (info.json carries only the licence name and a link, no longer sentence).
- Taken: 8687 icons (fill) plus 37 aliases (company logos left out: 474), `icons.json`, `info.json`, `metadata.json`

### Tabler Icons (`tabler`)
- Source: npm package `@iconify-json/tabler` 1.2.43, upstream version 3.50.0
- Author: Paweł Kuna (https://github.com/tabler/tabler-icons)
- Licence: MIT (https://github.com/tabler/tabler-icons/blob/master/LICENSE)
- Licence sentence in info.json: "MIT" (info.json carries only the licence name and a link, no longer sentence).
- Taken: 5871 icons (stroke) plus 183 aliases (company logos left out: 434), `icons.json`, `info.json`, `metadata.json`
<!-- icons:end -->

<!-- fonts:start -->
## Fonts

Each folder under `assets/fonts/` holds the font files and its `OFL.txt` (SIL Open Font License 1.1), as downloaded from the Google Fonts repository (the folder named in Source, main branch, November 2026; no commit hash was recorded). The reserved font names stay with their authors; the fonts are bundled unmodified and not sold on their own.

| Family | Folder | Source | Licence | Copyright (first line of OFL.txt) |
|---|---|---|---|---|
| Baloo Bhaijaan 2 | `Baloo Bhaijaan 2` | https://github.com/google/fonts/tree/main/ofl/baloobhaijaan2 | OFL-1.1 | Copyright 2019 The Baloo 2 Project Authors (https://github.com/EkType/Baloo2) |
| Blaka | `Blaka` | https://github.com/google/fonts/tree/main/ofl/blaka | OFL-1.1 | Copyright 2019 The Blaka Project Authors (https://github.com/Gue3bara/Blaka) |
| El Messiri | `El Messiri` | https://github.com/google/fonts/tree/main/ofl/elmessiri | OFL-1.1 | Copyright 2015 The El Messiri Project Authors (https://github.com/Gue3bara/El-Messiri) |
| Jomhuria | `Jomhuria` | https://github.com/google/fonts/tree/main/ofl/jomhuria | OFL-1.1 | Copyright 2015 KB-Studio (www.k-b-studio.com/tarobish@gmail.com). Copyright 2015 Lasse Fister (lasse@graphicore.de). Copyright 2015 Sorkin Type Co (www.sorkintype.com). Copyright 2010-2015 Khaled Hosny (khaledhosny@eglug.org). |
| Lalezar | `Lalezar` | https://github.com/google/fonts/tree/main/ofl/lalezar | OFL-1.1 | Copyright 2015 The Lalezar Project Authors (https://github.com/BornaIz/Lalezar) |
| Lemonada | `Lemonada` | https://github.com/google/fonts/tree/main/ofl/lemonada | OFL-1.1 | Copyright 2011 The Lemonada Project Authors (https://github.com/Gue3bara/Lemonada) |
| Marhey | `Marhey` | https://github.com/google/fonts/tree/main/ofl/marhey | OFL-1.1 | Copyright 2022 The Marhey Project Authors (https://github.com/namelatype/Marhey) |
| Qahiri | `Qahiri` | https://github.com/google/fonts/tree/main/ofl/qahiri | OFL-1.1 | Copyright 2021 The Qahiri Project Authors (github.com/aliftype/qahiri). |
| Rakkas | `Rakkas` | https://github.com/google/fonts/tree/main/ofl/rakkas | OFL-1.1 | Copyright 2016 Zeynep Akay |
| Playpen Sans Arabic | `Playpen Sans Arabic` | https://github.com/google/fonts/tree/main/ofl/playpensansarabic | OFL-1.1 | Copyright 2023 The Playpen Sans Project Authors (https://github.com/TypeTogether/Playpen-Sans) |
| Kufam | `Kufam` | https://github.com/google/fonts/tree/main/ofl/kufam | OFL-1.1 | Copyright 2019 The Kufam Project Authors (https://github.com/originaltype/kufam) |
| Noto Kufi Arabic | `Noto Kufi Arabic` | https://github.com/google/fonts/tree/main/ofl/notokufiarabic | OFL-1.1 | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/arabic) |
| Reem Kufi | `Reem Kufi` | https://github.com/google/fonts/tree/main/ofl/reemkufi | OFL-1.1 | Copyright 2015-2022 The Reem Kufi Project Authors (https://github.com/aliftype/reem-kufi), with Reserved Font Name "Josefin Sans". |
| JetBrains Mono | `JetBrains Mono` | https://github.com/JetBrains/JetBrainsMono | OFL-1.1 | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) |
| Amiri | `Amiri` | https://github.com/google/fonts/tree/main/ofl/amiri | OFL-1.1 | Copyright 2010-2022 The Amiri Project Authors (https://github.com/aliftype/amiri). |
| Noto Naskh Arabic | `Noto Naskh Arabic` | https://github.com/google/fonts/tree/main/ofl/notonaskharabic | OFL-1.1 | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/arabic) |
| Handjet | `Handjet` | https://github.com/google/fonts/tree/main/ofl/handjet | OFL-1.1 | Copyright 2018 The Handjet Project Authors (https://github.com/rosettatype/Handjet/) |
| Aref Ruqaa | `Aref Ruqaa` | https://github.com/google/fonts/tree/main/ofl/arefruqaa | OFL-1.1 | Copyright 2015-2020 The Aref Ruqaa Project Authors (https://github.com/alif-type/aref-ruqaa), with Reserved Font Name EURM10. |
| Alexandria | `Alexandria` | https://github.com/google/fonts/tree/main/ofl/alexandria | OFL-1.1 | Copyright 2022 The Alexandria Project Authors (https://github.com/Gue3bara/Alexandria) |
| Almarai | `Almarai` | https://github.com/google/fonts/tree/main/ofl/almarai | OFL-1.1 | Copyright 2019 The Almarai Project Authors (https://github.com/JuergenWillrodt/Almarai) |
| Beiruti | `Beiruti` | https://github.com/google/fonts/tree/main/ofl/beiruti | OFL-1.1 | Copyright 2024 The Beiruti Project Authors (https://github.com/googlefonts/beiruti) |
| Cairo | `Cairo` | https://github.com/google/fonts/tree/main/ofl/cairo | OFL-1.1 | Copyright 2009 The Cairo Project Authors (https://github.com/Gue3bara/Cairo) |
| Changa | `Changa` | https://github.com/google/fonts/tree/main/ofl/changa | OFL-1.1 | Copyright 2018 The Changa Project Authors (https://github.com/googlefonts/changa-vf) |
| IBM Plex Sans Arabic | `IBM Plex Sans Arabic` | https://github.com/google/fonts/tree/main/ofl/ibmplexsansarabic | OFL-1.1 | Copyright © 2017 IBM Corp. with Reserved Font Name "Plex" |
| Noto Sans Arabic | `Noto Sans Arabic` | https://github.com/google/fonts/tree/main/ofl/notosansarabic | OFL-1.1 | Copyright 2022 The Noto Project Authors (https://github.com/notofonts/arabic) |
| Readex Pro | `Readex Pro` | https://github.com/google/fonts/tree/main/ofl/readexpro | OFL-1.1 | Copyright 2018 The Readex Pro Project Authors (https://github.com/ThomasJockin/readexpro), with Reserved Font Name “RevReading Lexend”. |
| Tajawal | `Tajawal` | https://github.com/google/fonts/tree/main/ofl/tajawal | OFL-1.1 | Copyright 2018 Boutros International. (http://www.boutrosfonts.com) |
| Vazirmatn | `Vazirmatn` | https://github.com/google/fonts/tree/main/ofl/vazirmatn | OFL-1.1 | Copyright 2015 The Vazirmatn Project Authors (https://github.com/rastikerdar/vazirmatn) |
<!-- fonts:end -->
