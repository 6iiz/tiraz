# Scenes: building a brand's parts with the kit's mechanics

`look.md` decides how a brand looks. This guide is how to turn those decisions into code that renders the same frame every time, keeps Arabic whole, and passes the check. The kit gives mechanics; every visible choice is yours and the brand's.

## 1. What you write, and where

| You write | Where | What it is |
|---|---|---|
| The ground | `<brand>/look/ground.js` | a layer: what is behind everything |
| The motion grammar | `<brand>/look/motion.js` | how things arrive, stay alive and leave in this brand; every part uses it |
| Parts | `<brand>/look/parts/*.js` | scenes this brand reuses: a line, a product, a price, a list… written when a reel first needs one |
| The ending | `<brand>/look/ending.js` + `ending.json` | the closing scene and its default spec, with its own sound cues |
| A joint (optional) | `<brand>/look/joint.js` | how two scenes of this brand join, when it is more than a cut |
| A mark (optional) | `<brand>/look/mark.js` | a small persistent sign, drawn over a whole sequence |
| A reel's own choreography | `<reel>/scene.js` | a scene made for one reel, when the brand's parts are not enough |
| The reel's data | `<reel>/spec.json` | every word, number, time and sound of the reel |

A part that a second reel will need goes in `look/parts/`, so the brand stays consistent. A one-off stays in the reel folder. [judgement]

Nothing is written into the kit, and nothing is copied from the kit's test card (`tools/fixtures/`) or from another brand's folder. [ours: K ARCHITECTURE]

## 2. The contract, in code

The full contract is in `ARCHITECTURE.md`. These skeletons show the mechanics only; where a comment says the look decides, the code is yours to write.

**A layer** (the ground, the mark's drawing) is made once and drawn at any time:

```js
// <brand>/look/ground.js
export function create({ W, H, brand, look, clock = 0 }) {
  // build whatever the ground needs once, from rng(seed), never from Math.random()
  return {
    draw(ctx, t) {
      const time = t + clock;      // the reel's time, so the ground does not restart when a new scene begins
      // the look decides: the surface, its texture, its light, how it lives while a line holds
    },
  };
}
```

**The motion grammar** is one small module, so every part arrives and leaves the same way:

```js
// <brand>/look/motion.js
// p is 0 before a thing arrives and 1 when it has landed. What a thing does with p is this brand's motion.
export function arrive(ctx, p, box) { /* the look decides: where it comes from, with which ease, how far */ }
export function leave(ctx, p, box) { /* the look decides */ }
```

**A part** is a scene. It reads its words from the spec, fits them with the kit, and draws with the brand's ground and motion:

```js
// <brand>/look/parts/line.js      spec: { "duration": 2.4, "at"?: 0, "says": { "text": "… *key* …" } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec');
  const T = look.tokens, at = spec.at ?? 0;                 // when the arrival begins, in this scene's seconds
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave } = await import(look.base + 'motion.js');
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: SAFE.right - SAFE.left });
  const y = kit.place(line.height, spec.y);                 // a block of this height, inside the safe area
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: y + line.lead / 2, each: (word, i, box) => {
        const from = at + i * T.dur.stagger;
        arrive(ctx, span(t, from, from + T.dur.in), box);   // word by word, never letter by letter
        leave(ctx, span(t, spec.duration - T.dur.out, spec.duration), box);
      } });
    },
  };
}
```

Three things this skeleton relies on: [ours: K kit.js, K brand.js]

- **`each(word, index, box, ctx)`** runs just before each word is drawn, inside its own save and restore. There the look may move, fade or recolour that word (`ctx.translate`, `ctx.globalAlpha`, `ctx.fillStyle`), and nothing leaks to the next word. Return `false` to leave the word out of this frame, or a colour to draw it in that colour. `box` is `{ x, y, width, row }`: the word's left edge, the middle of its row, its width and its row number.
- **`"at"`** is when a part's arrival begins, in the scene's own seconds. Give every part one. In the middle of a reel it is 0 or a little more; in the scene that opens a reel it is negative (`"at": -1`), so that at t = 0 the hook has already landed. The first frame is what a viewer judges, and the check fails a reel whose first frame is only the ground.
- **The logo** is drawn with `brand.logo.draw(ctx, x, y, size, fill)`: a square of `size` whose top-left corner is `(x, y)`. `fill` colours a logo given as a path and is ignored by a logo given as a file, which keeps its own colours (`brand.logo.shape` is true for a path). `brand.logo.small` draws the simple mark when the brand gave one.

**A reel** is usually a sequence of parts, ending on the brand's ending:

```json
{ "scenes": [
    { "scene": "/brand/look/parts/line.js",  "spec": { "duration": 2.4, "says": { "text": "…" } } },
    { "scene": "/brand/look/parts/price.js", "spec": { "duration": 3.2, "says": { "was": 85, "now": 69, "unit": "ريال" },
                                                       "sfx": [ { "kind": "ding", "t": 1.3 } ] } },
    { "scene": "/brand/look/ending.js", "specUrl": "/brand/look/ending.json" } ],
  "transition": { "duration": 0 },
  "over": { "scene": "/brand/look/mark.js" },
  "cover": 1.6, "bed": -26,
  "sfx": [ { "kind": "pop", "t": 0.05 } ] }
```

A transition of 0 seconds is a cut, and a cut is what scenes get when the spec names no transition. How this brand's scenes join is part of its look, used the same way every time. There are three ways to build it: [ours: K sequence.js]

- **A cut that the parts prepare.** Each part ends on the shape the next one starts with, or draws its own half of a move (one sweeps out, the next sweeps in). The joint is in the parts; the spec says `"duration": 0`.
- **The brand's own joint**, `look/joint.js`, when the move needs both scenes at once (a wipe in the shape of the logo, an edge that uncovers the next scene):
  ```js
  // <brand>/look/joint.js       in the spec:  "transition": { "joint": "/brand/look/joint.js", "duration": 0.5 }
  export function create({ W, H, brand, look, spec }) {
    return {
      // from and to are canvases holding the outgoing and the incoming scene at this moment; p runs 0..1 across the joint
      draw(ctx, from, to, p) { /* the look decides. At p = 0 the frame is `from`, at p = 1 it is `to`. */ },
    };
  }
  ```
  The two scenes overlap by the joint's duration, and both keep playing under it.
- **A named transition** from `engine/transitions/index.json` (`"transition": { "name": "…", "duration": 0.4 }`; `engine/transitions/README.md` says which suit which mood).

A plain crossfade between unrelated frames is the weakest joint (`motion.md` section 5). Whatever the joint, render stills across it and look: a joint that floods the frame with a colour much lighter or darker than the scenes is a flash at every cut, and the check counts flashes.

`"sfx"` inside a scene's spec is timed in that scene's own seconds, so a part and the ending carry their sound with them. `python tools/make_reel.py <reel> --brand <brand> --timeline` prints where every scene starts and where every sound lands. [ours: K ARCHITECTURE]

## 3. Rules that keep a scene correct

- **A frame depends only on `t`.** No clocks, no `Math.random()`, nothing remembered from the last frame; particles and textures are built once in `create()` from `rng(seed)`. Render the same moments twice and the files must be identical; taken in another order they may differ by a level or two on a few edge pixels (the browser's rounding), never by anything you can see. [ours: K ARCHITECTURE, product trial 2026-11-17]
- **Words and numbers live in the spec, inside `"says"`.** A scene's spec has two kinds of fields: what a viewer reads, written inside its `"says"` object (`"says": { "was": 85, "now": 69, "unit": "ريال" }`), and everything else, which is control (times, positions, switches). The check reads every string and number inside `"says"` and compares the numbers with `facts.md`; it warns about text it finds outside `"says"` or typed into scene code. [ours: K reel_check]
- **Text goes through `kit.fit` and `kit.drawText`.** They wrap on whole words, never split an Arabic word, and place each word from the reading side, so Arabic mixed with digits and Latin keeps its order. Do not draw a sentence with one `fillText` and do not letter-space Arabic. [ours: K kit.js; adapted: designing-arabic-frontends]
- **Animate words, not letters.** Use `each` for per-word motion. Letter-level effects on Arabic go through the type engine (`/engine/type/effects.js`), which keeps the joins closed. [ours: K ARCHITECTURE]
- **Numbers that change use `kit.number` and `countValue`.** Digits sit in equal cells while they count, and the count lands exactly on the value. [ours: K kit.js]
- **Everything a viewer must read is inside `SAFE`** (x 70 to 1010, y 270 to 1248 on 1080x1920). The app covers the rest. [source: Meta Ads Guide, Instagram Reels] `make_reel.py --stills` measures this for every text drawn through `kit.drawText` and `kit.number` and names what reaches outside. Text you draw yourself is not measured unless you report its box: `kit.rec(x0, x1, y0, y1, text)`. [ours: K make_reel]
- **Text is 4.5:1 against what is behind it at every moment.** If the picture behind text moves or is busy, the look gives the text its own backing, designed for this brand. [source: W3C WCAG 2.2; judgement]
- **Sizes and times come from `tokens.json`,** so one change reaches every part. [judgement]
- **Pictures are the brand's own.** `kit.image(path)` loads a file from the brand or reel folder; `kit.icon('set:name', color)` draws from the asset store (`python tools/assets.py find "<words>"`). Never draw another company's logo. [ours: K ARCHITECTURE]
- **A missing field is a sentence.** `need(spec, [...], 'the price spec')` names what is missing; add your own checks for values that make no sense. [ours: K kit.js]
- **Build heavy things once.** A texture, a gradient map or a blurred copy is drawn to an offscreen canvas in `create()` and reused; 60 frames a second for 20 seconds is 1,200 draws. [judgement]

## 4. What common parts must do

These are behaviours, not designs. How each looks is the brand's.

| Part | Its data (inside `"says"`) | It must | Sound it usually asks for |
|---|---|---|---|
| A line (the hook, a statement) | `text` with one `*key*` word | be fully on screen in the first frame when it opens the reel; hold long enough to read twice (`arabic-text.md`) | one small sound on arrival |
| A product | `title`, an `image` or `icon`, facts about it | show the real thing; say what it is in three words or fewer | one sound as it lands |
| A price | `now`, and `was` only if `facts.md` has it, `unit` | show the old price before the new one lands; land exactly on the number | the reel's biggest sound on the landing |
| A number or proof | `value`, `label`, `prefix`/`suffix` | count with easing and stop exactly; leave time to read the final value | soft ticks while counting, one resolve |
| Steps or a list | `items` (3 to 5) | bring rows in reading order; one size for all rows | one tick per row |
| A comparison | two sides with the same fields | make the difference visible without reading | a turn sound on the switch |
| A quote or review | the real words and where they came from | be real, and say whose | none, or a quiet bed |
| Captions | `voice`, `words` (timings) | follow the spoken words (`captions.md`); never cover the subject | none of their own |
| A call to action | `kind` (comment word, link, follow), `text` | ask for exactly one thing (`structure.md`) | one click |
| The ending | `duration`, plus what the brand shows | be one beat; show the logo whole; hold long enough to read the handle once | its own cues in `ending.json` |

[judgement; the rules behind each row are in `structure.md`, `motion.md`, `sound.md` and `captions.md`]

A condition that changes what the buyer gets (a trial, a limit, an expiry) has a place in the part's data and on screen, not only in the caption. [ours: product trial 2026-11-17]

## 5. The order of work

1. Write the spec with the real words first. A part designed around placeholder text breaks on the real line. [judgement]
2. Render stills, not the whole reel: the first frame, a moment in each scene after its words have arrived, the middle of each transition, the last frame.
   `python tools/make_reel.py <reel> --brand <brand> --stills 0.05,1.2,2.2,3.6`
   It prints the files it wrote (`stills/at_001.20.png` is the moment 1.2 s; `stills/sheet.jpg` is all of them in a row) and any text it measured outside the safe area.
3. Open the sheet and look. Then open one still at full size and read the Arabic: joined, whole, right to left, marks not touching, digits in order. [ours: L 2026-11-16]
4. Fix, and look again. Only then render the whole reel; the check runs after it.
5. The measuring behind step 2: with `&debug=1` on the page URL, every box drawn through the kit in a frame is published in `window.__scene.boxes`, and the renderer's `--boxes` writes them to `boxes.json` beside the stills. A scene does nothing for this. [ours: K kit.js]

## 6. Layers made elsewhere

A 3D render or a filmed clip joins a scene as numbered frames: `frames({ pattern, fps, n, base })` from `/engine/frames.js` loads the frame a moment needs and draws it where you say; the ground, the words and the ending are still the brand's. [ours: K frames.js]

The kit ships no 3D scenes. If a brand's look needs one, write it for that brand (a Blender scene rendered to transparent frames), after `python tools/check_device.py` says the machine can do it, and render a few test frames before the full run. [ours: K ARCHITECTURE]

## 7. Before saying a part works

- The stills were opened and looked at, at full size for text.
- The same moments rendered twice give the same files, and taken in another order they show no difference you can see.
- A line twice as long and a number three digits longer still fit (try them).
- Every word and number on screen is in the spec, inside `"says"`.
- The part takes its sizes, times and colours from the brand, so nothing in it would need changing if a token changed.
