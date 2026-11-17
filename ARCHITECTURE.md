# Tiraz: how the parts fit

This file is the contract between the parts. Read it before adding or changing one.

## What the kit is

A director for Claude Code. It makes branded Arabic reels (1080x1920, 60 fps) and one-page sites on the user's own machine, and it ships **no look of its own**: no background, no ending, no scene design, no site template. For every brand, Claude designs a look from that brand's own materials and taste, writes it as code into the brand's folder, and builds every reel in it.

The kit owns four things:

| | What | Where |
|---|---|---|
| Direction | what to do, in what order, and what to show the customer | `skills/` |
| Craft | how to design a look, write a hook, set Arabic type, move things, place sound, review | `guides/` |
| Mechanics | drawing a frame exactly, fitting Arabic text, counting numbers, transitions, captions timing, mixing sound, encoding | `engine/`, `sound/`, `assemble.py` |
| Checks | the machine, the brand file, the finished reel against the brand's own facts | `tools/` |

The brand owns the look: `<project>/tiraz/brand/look/`.

## Rules every part follows

1. **The kit has no look.** Nothing in `engine/`, `tools/` or `skills/` decides how a brand looks: no colours, shapes, textures, motion style, ending or layout taste. A helper may measure, fit, count, time, load and place; it may not decorate. A file that draws something a viewer would recognise as a style belongs in a brand's `look/`, never here.
2. **A frame is a pure function of time.** Scenes draw from `t` and explicit inputs only. No `Date.now()`, no `requestAnimationFrame` timing, no unseeded `Math.random()`, no state carried from the previous frame. Randomness comes from `rng(seed)`. What this gives, as measured: rendering the same list of moments twice gives identical files; rendering a moment after different moments can differ by one or two levels of 255 on a few dozen edge pixels, which is the browser's own rounding and cannot be seen. A difference that can be seen means a scene carries state.
3. **Words and numbers live in data, under `"says"`.** Everything a viewer reads is written in the scene's spec inside its `"says"` object, never inside scene code, so the check can compare every number with the brand's `facts.md`. Everything else in a spec is control (times, positions, switches) and is never read as something a viewer sees.
4. **Nothing leaves the machine and nothing is fetched while rendering.** Pages load only from the local server started by `engine/render.mjs` (`/` is the kit root; `--mount name=<dir>` adds a folder).
5. **Every third-party file has a recorded licence.** Libraries go in `vendor/<name>/` with their LICENSE file. Asset packs go under `assets/` or `sound/packs/` with an entry in that part's `LICENSES.md`. Only MIT, BSD, ISC, Apache-2.0, Zlib, Unlicense, OFL and CC0 may be bundled.
6. **Errors are sentences.** A missing file, a bad value or a failed step ends with one plain-English message that says what is wrong and what to do. All problems found are reported together when that is possible.
7. **Verified means looked at or measured.** A part is done when its test passes and its author has opened the rendered frames (pictures) or measured the output (sound), and has written down what was checked and what was not.
8. **Small files, plain code.** No build step, no framework. ES modules in the browser, Python 3.10+ standard library plus numpy, soundfile and Pillow for tools. Comments say why, not what.

## Layout

```
.claude-plugin/              plugin and marketplace manifests, icon
skills/<name>/SKILL.md       what Claude reads: setup, reel, site
guides/*.md                  the craft: look, scenes, hooks, structure, arabic-text, captions, sound, motion, review, web
engine/                      the stage: mechanics only
  render.mjs                 page -> numbered frames (Playwright)
  index.html, main.js        loads one scene module and draws it
  brand.js                   reads and validates brand.json (identity values only)
  kit.js                     what a scene author needs: text fitting, numbers, time, safe area, icons, images
  safe.js                    where text may sit on a vertical frame
  captions.js                word timings -> what is on screen at t
  frames.js                  numbered image frames (a 3D render, footage stills) as a layer
  type/                      Arabic type engine (shaping to outlines, text effects)
  transitions/, scenes/sequence.js   scenes in a row with a transition between each pair
  assets.js                  icons and emoji by id
  scenes/assets-sheet.js, scenes/font-specimen.js   pages used by tools/assets.py
vendor/<lib>/                third-party JS with its LICENSE
assets/fonts, assets/icons   fonts (OFL) and icon sets with their indexes
sound/                       sound engine: free packs, index, pick (a brand's own sounds first), checks
tools/*.py                   doctor, check_device, brand_check, make_reel, reel_check, timeline, assets, captions, sheet
tools/selftest.py, test_*.py  the kit's own tests; tools/fixtures/testcard is the plain brand they run on
assemble.py                  frames + sound -> mp4
voice/vo.py                  narration with word timings
web/check.mjs                checks a finished site (and web/test_check.mjs tests the checker)
web/kit/                     page mechanics that a site copies into its own folder: stage.js (a three.js scene or a 2D drawing, mounted the careful way),
                             scroll.js (what answers the scroll and the hand); web/test_kit.mjs tests both
web/still.mjs                pictures one frame of a page's scene, to use as its still
docs/                        pictures of results, for the README: shown to people, never a starting point for a look
```

## A brand folder (in the customer's project, never in the kit)

```
<project>/tiraz/brand/
  brand.json                 identity values
  voice.md audience.md facts.md rules.md answers.md
  refs/                      work they like and dislike, with their reasons
  sfx/                       their own sounds, named by kind
  look/                      this brand's look, designed for it
    look.md                  the look in words: the idea, palette roles, type, shapes, motion, ending, do and never
    tokens.json              its numbers: sizes, radii, spacing, durations, eases, named colours
    ground.js                the background
    motion.js                how things arrive, stay alive and leave in this brand; every part uses it
    ending.js, ending.json   the closing scene and its default spec (with its own sound cues)
    joint.js                 optional: how two scenes of this brand join, when it is more than a cut
    mark.js                  optional: a small sign that stays on screen through a reel
    parts/*.js               this brand's reusable scenes (a line of text, a price, a list...), added as reels need them
    directions/              the style frames the customer chose from
    preview.json             a short sequence that shows the look, used for the approval picture
<project>/tiraz/reels/<nn>-<slug>/
  spec.json                  the reel's words, numbers, times and sounds
  scene.js                   optional: choreography written for this reel alone
  publish/                   reel.mp4, cover.jpg, caption.txt
```

## brand.json (identity values only)

```json
{ "name": "…", "shortName": "…", "handle": "@…", "platform": "instagram", "dir": "rtl", "digits": "latin",
  "slogan": ["…", "…"],
  "colors": { "bg": "#……", "text": "#……", "accent": "#……", "anyOtherName": "#……" },
  "fonts": { "display": { "family": "…", "file": "/brand/fonts/….ttf", "weight": "400 900" }, "text": { … }, "mono": { … } },
  "logo": { "file": "/brand/logo.svg" } }
```
Required: `name`, `colors.bg`, `colors.text`, `colors.accent`, `fonts.display`, `logo` (`file`: an image drawn in its own colours; or `path` + `box`, with `"rule": "evenodd"` when it has holes: a one-colour mark that takes the colour a scene gives it; `mark`: a simpler file for small sizes). Everything else is optional; `slogan` may be missing. Every colour is `#RRGGBB`. Paths start with `/brand/` (the brand folder) or `/assets/` (shipped with the kit). `loadBrand()` adds nothing that is a matter of taste: no derived colours, no defaults for a look. It gives `logo.draw(ctx, x, y, size, fill)` and `logo.small(...)` (from `logo.mark` when given). A light ground is as valid as a dark one.

## Scene contract

```js
export async function create({ W, H, brand, look, spec, base, clock, query, loadScene, kit }) {
  // brand: the identity. look: { base: '/brand/look/', tokens: {...} } (tokens is {} when the brand has no tokens.json).
  // spec: the parsed JSON given with &spec= (or inline by a parent), base: the folder it came from.
  // clock: seconds from the start of the reel to this scene's start (0 when the scene is the whole reel): a ground adds it to t so it never restarts at a cut.
  // loadScene(url, { spec, base, clock }): builds a child scene. kit: the mechanics of engine/kit.js bound to this brand.
  return {
    duration,                 // seconds
    async prepare(t) {},      // optional; awaited before draw (load what frame t needs)
    draw(ctx, t) {},          // draws the whole frame for time t
  };
}
```
`create()` returns a fresh object each call and keeps its state in a closure, never at module level. A scene must never import `engine/main.js`. A scene imports the kit's modules by absolute path (`/engine/kit.js`), its brand's look by `look.base + 'ground.js'`, and files beside its spec by `base`. Every scene spec has `"duration"`, and the words and numbers a viewer reads inside `"says"`: `{ "duration": 3.2, "at": -0.3, "says": { "label": "السعر", "was": 85, "now": 69, "unit": "ريال" } }`.

Try a scene with:
`node engine/render.mjs --root . --mount brand=<brand folder> --mount reel=<reel folder> --page "engine/index.html?scene=/reel/scene.js&brand=/brand/brand.json&spec=/reel/spec.json" --out <dir> --at 0.5,2 --png`

## The kit's mechanics (`engine/kit.js`)

Pure helpers: `clamp`, `lerp`, `smooth`, `span(t, t0, t1)` (0..1 between two moments), `ease` (`linear`, `inQuad`, `outQuad`, `inOutQuad`, `outCubic`, `inOutCubic`, `outQuart`, `outExpo`, `outBack`, `spring`), `rng(seed)`, `font(weight, size, family)`, `rr(ctx, x, y, w, h, r)`, `rgba(hex, a)`, `mix(a, b, p)`, `contrast(a, b)`, `need(spec, keys, where)`, `marks(text)` (splits a line into words and says which sit between `*stars*`), `formatNumber(v, decimals, digits)`, `countValue(from, to, p)`, `SAFE`, `LINE_GAP`.

`createKit({ W, H, brand, base, query })` (what `create()` receives as `kit`) adds helpers bound to the brand's font, direction and digits:

- `fit(text, { family?, weight, size, maxW, minScale, minPx, single, lead })` and `fitAll(list, opts)`: text that fits a box. Shrinks in steps, then wraps on whole words; an Arabic word is never split. Returns rows of words with widths. A text that is still too wide at 40% of the size asked for stops with a sentence that names it, unless `overflow: true` says the overflow is meant.
- `drawText(ctx, fitted, { x0, x1, y, align, color, key, each, decor })`: draws a fitted text word by word from the reading side, so Arabic mixed with digits keeps its order. A word that is not fully opaque is drawn solid first and laid on the frame whole, so a fading Arabic word shows no seams at its joins. `decor: true` marks decoration that is not held to the safe area. `each(word, index, box, ctx)` runs just before a word is drawn, inside its own save and restore, with `box = { x, y, width, row }`: there a look moves, fades or colours every word itself (returning `false` skips the word; returning a string draws it in that colour).
- `number(ctx, str, opts)` and `numberWidth(str, size, weight, settle)`: digits in equal cells while a number counts, so it does not wobble.
- `fmt(v, decimals)`, `place(h, centre)` (a block of height `h` inside the safe area), `abs(path)`, `icon(id, color)`, `image(path)`.
- `rec(x0, x1, y0, y1, text)` reports a box that a scene drew by itself, and `say(key, value)` a value; `drawText` and `number` report their own boxes. With `&debug=1` on the page, each frame publishes them in `window.__scene` (`{ boxes, strings }`), and `render.mjs --boxes` writes them beside the stills. This is how `make_reel.py --stills` and the check measure the safe area. A scene does nothing for it; `begin()` and `end()` remain as harmless calls.

None of them draws a panel, a shadow, a glow or a motion of its own.

## Sequences (`engine/scenes/sequence.js`)

```json
{ "scenes": [ { "scene": "/brand/look/parts/line.js", "spec": { "duration": 2.4, "says": { "text": "…" } } },
              { "scene": "/brand/look/ending.js", "specUrl": "/brand/look/ending.json" } ],
  "transition": { "name": "fade", "duration": 0.4 }, "transitions": [ … one per gap … ],
  "over": { "scene": "/brand/look/mark.js", "spec": { … } } }
```
Children play one after another and overlap by the transition. With no `"transition"` they join with a cut: any other joint is a decision of the brand's look. A transition is a named one (`"name"`, from `engine/transitions/index.json`) or the brand's own module (`"joint": "/brand/look/joint.js"`), which exports `create({ W, H, brand, look, spec })` and returns `{ draw(ctx, from, to, p) }`: `from` and `to` are canvases holding the two scenes at that moment, `p` runs 0..1, and the module draws the frame. A named transition or a joint with no `"duration"` lasts 0.5 s. `"over"` is drawn on top for the whole sequence (a brand's persistent mark). Scene `i+1` starts at `start[i] + duration[i] - transition[i]`; each child gets that start as `clock`. `python tools/make_reel.py <reel> --brand <brand> --timeline` prints the starts.

## Sound contract (`sound/`, `assemble.py`)

- A cue asks by kind: `{ "kind": "pop", "t": 2.5, "gain": -9, "tag"?: "low", "variant"?: 1, "pan"?: 0.2 }`. Kinds are the closed list in `sound/kinds.json`.
- `"sfx"` at the top of a reel spec uses reel seconds. `"sfx"` inside a child scene's spec uses that scene's own seconds; `assemble.py` adds the scene's start. So a part, and above all the brand's ending, can carry its own sound.
- **A brand's own sounds come first.** `<brand folder>/sfx/` (or `--sfx <folder>`) holds WAV files named by kind: `pop.wav`, `pop-2.wav`, `whoosh-long.wav`, `bed.wav`; the words after the kind are tags. `"name": "x"` asks for exactly `sfx/x.wav`. Optional files there: `pack.json`, `defaults.json`, `legacy.json`. The kit's packs are free stand-ins, every one CC0.
- Risers and swells carry `"anchor": "end"`: they end on the cue's time.
- `"bed": -26` adds a quiet looping layer under the whole reel; it steps down 12 dB while a narration speaks. As an object, `{ "gain": -26, "variant": 0, "dips": [ { "t": 5.2, "for": 1.5, "by": -8 } ] }`, it also steps down at the moments named (reel seconds).
- The mix lands at about -14 LUFS with peaks under -1 dB. `python sound/phone_check.py <file>` reports the share of energy above 250 Hz.

## Type contract (`engine/type/`)

- `shape.js`: `await shapeText({ fontUrl, text, size, dir, wght? })` returns glyph outlines and words in pixels. Shaping is HarfBuzz, so Arabic joins, ligatures and marks are already resolved in the outlines.
- `effects.js`: drawing helpers that take the shaped text and a progress `p` in 0..1: `fillText`, `drawOn`, `revealWords`, `revealGlyphs`, `morph(a, b, p)`.
- Arabic is revealed by whole words unless a scene asks for glyphs on purpose; glyph effects never move glyphs apart.

## Captions (`engine/captions.js`, `tools/captions.py`)

`groupWords(words, opts)` turns word timings into groups of lines; `buildPages` and `captionState(ctx, t, …)` say, for a moment, which words are on screen, where, and how far each is spoken (`speaking`, `shown`, both 0..1). How captions look is the brand's: a part draws them from that state.

## Assets (`assets/`, `engine/assets.js`, `tools/assets.py`)

An asset id is `<set>:<name>`. `python tools/assets.py find "<words>"` prints ids (Arabic or English); `loadAsset(id, { color })` returns `{ draw(ctx, x, y, size), width, height, paths? }`. No company logos are in the store. Fonts are in `assets/fonts/<Family>/` with their `OFL.txt`; `python tools/assets.py fonts` lists them with their character, and `python tools/assets.py webfont <font file>` writes one again as WOFF2 for a site (the same font, nothing taken out; it needs `fonttools` and `brotli`, and says so in a sentence when they are missing).

## Where text may sit (`engine/safe.js`)

`SAFE = { top: 270, bottom: 1248, left: 70, right: 1010 }` on the 1080x1920 frame, from Meta's published Reels safe zone (top 14%, bottom 35%, 6% each side). Everything a viewer must read sits inside it. `tools/make_reel.py --stills` and the final check measure it for every text drawn through the kit (`drawText`, `number`, and boxes a scene reports with `rec`), and name what reaches outside. Text a scene draws by itself and does not report is not measured.

## The check (`tools/reel_check.py`)

Measures the file (H.264, 1080x1920, 60 fps, bt709, about -14 LUFS, peaks under -1 dB, phone-speaker share), collects every word and number a viewer meets (each scene's `"says"`, the narration's words, the caption) and refuses a number that is not in `facts.md`, warns about text that sits outside `"says"` or inside scene code, checks that the first frame already shows something, counts whole-frame flashes (more than three in a second is refused), measures text against the safe area at nine moments, and writes a sheet of those moments for a person to look at. A clean check is not approval.

`facts.md` is a table: one row per thing that may be said, with its exact wording or number, its source and its date. The check takes the allowed numbers from the rows, and leaves out the columns whose heading names a source or a date, so the digits of a date do not become facts. A `facts.md` with no table is read whole, with a warning.

## The site check (`web/check.mjs`)

Serves a site folder on 127.0.0.1, refuses every request to another host before it is sent, and opens the page in Chrome at 390x844 and 1440x900, then with JavaScript off and with reduced motion; `guides/web.md` section 10 lists what it reports and what it cannot tell. What it decides from pictures (text over a picture, text against the rounded edge of its shape, focus and hover, a canvas that keeps moving under reduced motion) is measured on a picture of the window asked from the browser itself (`windowShot`): Playwright's own screenshot shows another part of the page than the one on screen when a right-to-left page scrolls sideways. `vendor/three/` is not used by the kit itself: it is there to be copied into a customer's page that carries a 3D scene (`guides/web.md` section 11). With `--more` the check also walks down the page in small steps, as a hand scrolls, and pictures it screen by screen on a desktop and on a phone (`walkTo`: a jump can land a page in a state no visitor sees); on the first and the last of those screens it asks the browser what lies on top of the middle of every control (`covered`), and a control under something else there is a problem; the last screen is also measured for its tallest stretch of bare ground (`emptyRun`), which is a note.

Text against what is behind it is one measure used in two places. `windowText` lists every piece of text standing in the window (the boxes of its lines, cut to the window and to what its clipping ancestors let show, its colour, how opaque it and its ancestors make it). It also asks the browser what is piled over each line (`elementsFromPoint` at five points, with pointer events switched on for every element while it asks, so the pile is the order of painting): where something that stays in the window and has a solid colour of its own lies over a line, the line is cut back to the part that shows, two pixels clear of that thing's edge, because words sliding under a bar is how a page scrolls and the bar's own rule is not "behind" them. `twoPictures` pictures the window with all text made transparent, then with all text painted in one loud colour; `behind` reads the first picture inside each line for the brightest and the darkest 1% of what is behind the words, and uses the second to leave out lines whose letters are not on screen. Text marked `data-over-picture` is measured this way in every run: the page is walked to each piece and its place read there (`measureOverPicture`), lower or higher in the window when the middle is covered. With `--more` the same measure is taken of every text in the window at each picture of the walk, half way between two pictures, and at four places 320 px wide (`textBehind`); each piece is reported once, where it was hardest to read. A picture or canvas that fills three fifths of the window or more and stays there (`position: fixed` or `sticky`) counts as lying under every unmarked text that passes over it; a band that holds less is left to the pixels of the walk. Sideways scrolling names its causes from the page's own edge, widest first, and a font served as `.ttf` or `.otf` is a note.

## Page mechanics (`web/kit/`)

Like the engine for reels, these files hold mechanics and no look, and a site copies them into its own folder. `stage.js` mounts a scene with its still, its one frame under reduced motion, its pause off screen and in a hidden tab, a capped pixel ratio and the still back when the browser refuses: `createStage(THREE, { box, still, rest, continuous, label })` for three.js and `createDrawing({ box, still, rest, continuous, label, clear })` for a 2D canvas, both built on one private `mount()` that holds the loop. The scene's function may return `true` (draw the next frame), a number (wait that many seconds first), `false` (stand until `invalidate()`) or nothing (the `continuous` option decides). `still` is one element or a list, for a scene that carries several moments of a page. A scene the browser refuses or takes away marks its box and `<html>` with the class `no-scene`; on a page already left to stand as written (`window.pageIsPlain`, set by the line in the page's head after four seconds without the script) nothing is mounted, `seen()` finishes everything and `count()` leaves numbers alone. Each mounted scene adds `{ box, ready, picture() }` to `window.__tirazStages`, which is all `web/still.mjs` knows about a page. `studio()` builds a reflection map from lit panels and `softShadow()` a round shadow that fades at its edge (its fade is painted in grey on black, because three.js reads an alpha map from the green channel, and its shape is laid flat in the geometry, so `scale.x` and `scale.z` are its width and depth). `scroll.js`: `progress(el)` and `pinned(el)` (0 to 1 through the window, or through a section that keeps its screen; both take the part of the window a band or a bar covers), `onScroll`, `onFrame`, `pointer` (with the pointer's type, where a press began, and letting go when a finger lifts), `sectionState` (the section on one line of the window names the state of the page), `seen` (which finishes at once whatever takes the keyboard focus, and counts an element on a screen that stays as seen once most of it is in the window), `depth`, `lean`, `count` (which leaves alone a number already in front of the visitor), and the small helpers `range`, `damp`, `lerp`, `clamp`, `reduced`. Most of them only set a CSS custom property, so what moves and how stays in the page's stylesheet. `web/still.mjs` opens a page with `?still=1` and saves the frame the stage draws for it, or with `--screen` the scene's box as the page shows it.

## The kit's own tests

```
python tools/selftest.py         the whole path on the test card: brand check, preview, timeline, stills, reel, the check and what it must refuse
python tools/test_assets.py      icons, emoji and fonts: search, licences, pages drawn in the families' own fonts, a font written again as WOFF2
python tools/test_captions.py    the caption grouping is the same in the tool and in the page
python sound/test_sound.py       the sound index, the picking order, own sounds first, the mix
node web/test_check.mjs          the site checker: a page made right passes, and every fault of a faulty page is named
node web/test_kit.mjs            the page mechanics: a scene and its still, reduced motion, JavaScript off, the scroll helpers, still.mjs
```
A change to a shared file is not done until these pass and the stills they write were opened.

## Shared files (one writer)

`assemble.py`, `engine/main.js`, `engine/brand.js`, `engine/kit.js`, `engine/render.mjs`, `engine/scenes/sequence.js`, `tools/make_reel.py`, `tools/reel_check.py`, `skills/**`, `package.json`, this file. A part that needs a change in one of them asks for it separately (its own issue or pull request).
