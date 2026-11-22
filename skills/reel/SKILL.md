---
name: reel
description: Make one reel in the customer's own look, from the idea to a checked file ready for their approval - the hook, the lines, the beats, scenes built from the brand's own parts or written for this reel, sound, and a check that refuses any number that is not in the customer's facts. Use when the customer asks for a reel, a short video, a product promo, or says "اصنع ريلاً", "أنشئ ريلاً", "سوّي ريل" or "اعمل ريل". Needs the brand folder and the look made by the setup skill.
---

# Reel: one idea, in the customer's look, checked before they see it

**The kit root** is two folders above this file (`engine/`, `tools/`, `sound/`, `guides/`, `assets/`). Call it `<kit>`.
**The customer's files** are in `<project>/tiraz/`: `brand/` (made by setup, with their look in `brand/look/`) and one folder per reel, `reels/<nn>-<slug>/`. Nothing is written into the kit.

The kit has no scenes and no look of its own. Every reel is drawn with the customer's ground, motion, parts and ending, and what is missing is written for them. Never take a scene, a ground or an ending from `tools/fixtures/` (a plain test card that exists only to test the kit), or from another brand's folder.

Speak to the customer in their language and dialect. Summarise tool output in a sentence. Report only what you checked: "rendered" is not "looks right", and "measured" is not "heard".

The kit's tools print Arabic correctly by themselves. A script of your own that prints Arabic on Windows needs `PYTHONUTF8=1` in front of it, or it stops with an encoding error.

## 0. Before anything

1. `<project>/tiraz/brand/brand.json` must exist, pass `python <kit>/tools/brand_check.py <project>/tiraz/brand`, and name a look (`"look"`). If it has none, run the setup skill's look step first: a reel is not made in a borrowed look.
2. Read all of `voice.md`, `audience.md`, `facts.md` and `rules.md`. `rules.md` is the customer's own corrections: it wins over every default here and over every guide.
3. Read `look/look.md` and `look/tokens.json`, and list `look/parts/`: this is what the brand already has. Read the code of the parts you will use.
4. Read the guides this reel needs. They hold the craft; this file holds the steps.

| When | Read |
|---|---|
| before writing any line | `<kit>/guides/hooks.md`, `<kit>/guides/structure.md` |
| before putting Arabic on screen | `<kit>/guides/arabic-text.md` |
| before writing or changing a scene | `<kit>/guides/scenes.md`, `<kit>/guides/motion.md` |
| the reel has a narration | `<kit>/guides/captions.md` |
| before placing sounds | `<kit>/guides/sound.md` |
| before showing the customer | `<kit>/guides/review.md` |

Each rule in a guide says where it comes from: `[ours]` was tested by the kit's authors, `[adapted]` and `[source]` come from others, `[judgement]` is reasoning. Weigh them in that order.

## 1. Agree the idea first (one message)

Give the customer three genuinely different hooks (see `hooks.md`) and recommend one. Then, briefly: what the reel sells or explains, its beats in order, the lines as they will appear, every fact it uses and where each comes from, and whether it has a voice. Wait for their yes. Skip this only if they asked you not to stop.

If they asked you not to stop: write the three hooks, the one you chose and why into `<reel>/idea.md` and go on. Wherever a guide says to ask the customer something, take the cautious option, add the open question to `idea.md`, and put those questions first when you hand the reel over. Cautious means: a claim, a number or a promise you are not sure of is left out; a disclosure or a condition you are not sure is needed (that the post is an ad, that an offer has terms) is kept in, or named as the first open question. A reel that waits on such an answer is handed over as waiting on it, not as ready to publish.

## 2. Write the lines

The guides give the craft. These rules are not negotiable:

- Dialect and tone from `voice.md`. Copy its rhythm, not its sentences. A fixed line the customer asked for (their closing words, their slogan) is the exception: it is used exactly as they gave it.
- The hook is on screen in the very first frame, already arrived: the opening scene starts its arrival before the reel does (`scenes.md` section 2, `"at"`). The check fails a reel whose first frame shows only the ground.
- Mark the one word that carries a line with stars: `"بـ *69* ريال"`. It takes the meaning the look gave the accent.
- **Every number, price, duration and count comes from `facts.md`, written exactly as it is there.** If it is not there, it is not said, shown or narrated.
- A fact that lives on a web page (a price, a stock, an offer) is read again from that page today. Update its row in `facts.md` with today's date first, then use it.
- A condition that changes what the buyer gets (a trial, a limit, an expiry) is shown on screen or in the caption. It is never left out to make the line cleaner.
- An old price is shown beside the new one only when `facts.md` has both. If `facts.md` does not say when an offer ends, the reel does not say or hint that it ends («اليوم بس», «لفترة محدودة», a countdown): show the price as it is, and put the question to the customer.
- The customer's way of speaking is theirs, including words such as «هلق» or «يلا». What a reel must not carry is a statement that is only true on the day it was posted («طالعين هلق من الفرن», «اليوم»): a reel is watched for weeks.
- Nothing from `rules.md`'s "never" list appears.
- Everything a viewer must read sits inside x 70 to 1010 and y 270 to 1248. The app covers the rest (Meta publishes this zone; `engine/safe.js`).

## 3. Plan the beats, then the scenes

A ready shape may help: `<kit>/arrangements/` holds five (system, before-after, steps, proof, question; its `README.md` says how one becomes a spec). Offer the customer the one that fits their idea, or build the beats yourself. Write the beats first (`structure.md`): for each, what the viewer sees, the one thing that happens, how long it lasts, and its sound. Then give each beat a scene:

| The beat needs | Use |
|---|---|
| something the brand already has | the part in `<brand>/look/parts/` |
| something a later reel will need too (a price, a list, a quote) | a new part, written into `<brand>/look/parts/` in the brand's look |
| something only this reel does | `<reel>/scene.js` |

A new part obeys the look: it draws on the brand's ground, arrives and leaves with the brand's `motion.js`, takes its sizes, times and colours from `tokens.json`, and draws shapes in the grammar `look.md` describes. `scenes.md` has the contract, the mechanics the kit gives you (`kit.fit`, `kit.drawText`, `kit.number`, the eases, the safe area, icons, images) and what each common part must do. If a beat needs something the look has no answer for, decide it the way the look would, and add that decision to `look.md`.

The reel ends on the brand's ending (`look/ending.js` with `look/ending.json`). The ending is part of the reel's length.

## 4. The reel folder

`<project>/tiraz/reels/<nn>-<slug>/spec.json` holds every word, number, time and sound. A reel is usually a sequence:

```json
{ "scenes": [
    { "scene": "/brand/look/parts/line.js",  "spec": { "duration": 2.4, "says": { "text": "… *…* …" } } },
    { "scene": "/brand/look/parts/price.js", "spec": { "duration": 3.2, "says": { "was": 85, "now": 69, "unit": "ريال" },
                                                       "sfx": [ { "kind": "ding", "t": 1.3, "gain": -7 } ] } },
    { "scene": "/reel/scene.js",             "spec": { "duration": 4.0, "says": { "items": [ "…", "…" ] } } },
    { "scene": "/brand/look/ending.js", "specUrl": "/brand/look/ending.json" } ],
  "transition": { "duration": 0 },
  "over": { "scene": "/brand/look/mark.js" },
  "cover": 1.6, "bed": -26,
  "sfx": [ { "kind": "pop", "t": 0.05, "gain": -9 } ] }
```

- `/brand/…` is the brand folder, `/reel/…` this reel's folder, any other path starting with `/` is in the kit. Every scene's spec has `"duration"`.
- How scenes join belongs to the look (`look/look.md`; `scenes.md` section 2 has the three ways). With no `"transition"` the scenes join with a cut, right when a shape carries from one scene into the next. `"transition": { "joint": "/brand/look/joint.js", "duration": 0.5 }` uses the brand's own joint, and `{ "name": "…", "duration": 0.4 }` a named transition from `<kit>/engine/transitions/index.json`; with either, neighbours overlap by that long. Use the joints this brand uses, the same way every time.
- `python <kit>/tools/make_reel.py <reel> --brand <brand> --timeline` prints where each scene starts and where each sound lands: use it instead of adding times by hand.
- `"over"` draws the brand's mark over the whole reel, if the look has one.
- A reel that is a single scene names it with `"scene": "/reel/scene.js"` (or just has that file) and gives `"duration"`.
- **What a viewer reads goes inside `"says"`.** Every word and number on screen is written in its scene's `"says"` object; everything else in a spec is control. The check reads `"says"` and nothing else, so a price left outside it, or typed into scene code, is a price nobody checked.

### Sound

A cue asks for a kind, not a file: `{ "kind": "pop", "t": 2.5, "gain": -9, "tag"?: "low", "variant"?: 1, "pan"?: 0.2 }`. `python <kit>/sound/pick.py --list` shows the kinds, how many sounds each has, and their tags.

Kinds: `click` `tick` `pop` `toggle` `type` `swish` `whoosh` `riser` `swell` `drop` `impact` `thump` `shimmer` `sparkle` `success` `error` `notify` `ding` `glitch` `rustle` `scratch` `bed`.

- `"sfx"` at the top of the spec is timed in reel seconds. `"sfx"` inside a scene's spec is timed in that scene's own seconds: put a part's sounds with the part, so they move with it.
- A `riser` or `swell` ends on its `t`: give it the moment of the hit it leads to.
- One sound for each thing that visibly happens, and none for nothing. The biggest sound goes on the moment the reel pays off.
- `"bed": -26` adds a quiet looping layer; it steps down by itself while a narration speaks. `"bed": { "gain": -26, "dips": [ { "t": 5.2, "for": 1.5, "by": -8 } ] }` also lowers it at moments you choose, in reel seconds: while a price is read, or just before the payoff.
- A quiet brand is made with soft kinds and few of them over a bed that is present, not with a nearly silent mix: the file is always brought to about -14 LUFS, so when little sounds, everything is lifted and the hits flatten. The tool says how far it had to lift; over about 6 dB, raise the bed or add the sounds the picture is missing (`sound.md` section 6).
- **The customer's own sounds come first.** WAV files in `<project>/tiraz/brand/sfx/` named by kind (`pop.wav`, `pop-2.wav`, `whoosh-long.wav`, `bed.wav`) are used before the kit's; `make_reel.py` finds that folder by itself. `"name": "sting"` plays exactly `sfx/sting.wav`. Only use sounds the customer has the right to use.
- The kit's own sounds are free stand-ins (all CC0), chosen by measurement, not by ear. If the customer says a sound is wrong, try another `variant`, and write what they chose in `rules.md`.

### Icons and pictures

`python <kit>/tools/assets.py find "سلة"` (Arabic or English) prints ids such as `tabler:shopping-cart`; `python <kit>/tools/assets.py sheet <ids...> --out sheet.png` shows them. The store has no company logos: never draw another company's mark from memory either. Product pictures are the customer's own files, in the reel or brand folder.

### A narration

`python <kit>/voice/vo.py <text.txt> <reel>/voice --voice <voice id>` writes `voice.mp3` and `voice.words.json`. It spends the customer's ElevenLabs credits and needs their key in `ELEVENLABS_API_KEY`: say what it will cost in characters and ask before each run. The voice must be one the customer has the right to use. In the spec: `"voice": "voice.mp3", "words": "voice.words.json"`.

Captions follow the spoken words. `python <kit>/tools/captions.py build <words.json> --out captions.json --script script.txt` groups the words into lines (`captions.py check` reports captions that are too short or too fast to read). `captionState` in `<kit>/engine/captions.js` says which words are on screen at a moment and how far each is spoken; the brand's caption part draws them in the brand's type (`captions.md`).

### 3D and footage

The kit ships no 3D scenes. A rendered or filmed layer joins a scene as numbered frames through `<kit>/engine/frames.js` (`scenes.md` section 6). If the look calls for 3D, `brand/device.json` must say `"3d": true`; write the Blender scene for this brand, render three test frames and look at them, and only then start the full render in the background, telling the customer the wait.

## 5. Stills, then the whole reel

Write `publish/caption.txt` before the full run, so its numbers are checked too. The caption follows `voice.md`, repeats no number that is not in `facts.md`, and carries any condition that did not fit on screen: the hook first, then one fact a line, the call to action, a few hashtags.

```
python <kit>/tools/make_reel.py <reel> --brand <project>/tiraz/brand --stills 0.05,1.2,3,6,9
```
The moments are seconds from the start of the reel; include the first frame, a moment in each scene after its words have arrived, the middle of a transition, and the ending. It prints the files it wrote (`stills/at_001.20.png` is the moment 1.2 s, and `stills/sheet.jpg` is all of them in a row) and names any text it measured outside the safe area: fix those first. Then open `stills/sheet.jpg`, then one still at full size, and check every item before going on:

- the brand's font, not a fallback (compare a letter with `brand/preview.jpg`)
- Arabic joined and right to left; no word split across lines; digits and Latin in the right order; marks not touching
- each line readable against what is behind it at that moment, and not covering the subject
- nothing a viewer must read outside x 70 to 1010, y 270 to 1248; nothing on top of anything else
- the accent word is the one that matters
- it looks like this brand's other work (`look/look.md`, `brand/preview.jpg`), and like no other brand's
- the logo and handle are the customer's

Then the whole reel:
```
python <kit>/tools/make_reel.py <reel> --brand <project>/tiraz/brand
```
It renders at 60 fps, mixes the sound to about -14 LUFS, writes `publish/reel.mp4` and `publish/cover.jpg`, then runs the check.

## 6. The check is a gate

Read `check.json`.
- **Every problem is fixed and the reel is made again.** A number that is not in `facts.md` is removed or sourced; it is never waved through.
- Each warning is either fixed or told to the customer in plain words. A warning about text inside scene code means a word or number escaped the check: move it into the spec.
- Open `sheet.jpg` (nine moments of the finished file) and go through the list in step 5 once more, plus: the ending shows the logo whole, and the first frame already shows the hook.
- Score the reel with the rubric in `guides/review.md` before anyone else sees it, and write the scores into `<reel>/review.md`. Under its bar, fix the weakest line and score again. A line that is weak only because the customer gave no material for it (no picture of the product, no sounds of their own) is not yours to fix: hand the reel over with that line named, and say what material would raise it.
- A clean check and a clean sheet are still not a listen. Unless a person has heard the sound, say that the sound was measured and not heard.

## 7. Show the customer

Give them `publish/reel.mp4`, the cover and the caption, in five lines or fewer: what it is, what you verified and how, what you could not verify, and anything they must decide.

Every correction they give:
1. apply it and make the reel again,
2. add it to `brand/rules.md` as a dated line in their words with what it changed,
3. if it is about how their content looks or sounds in general (a colour, the type, the way things move, the ending, a sound they dislike), change the look itself (`look.md`, `tokens.json`, the part), so the next reel is already right.

## Never

- Never publish, post, upload or send the reel anywhere. Delivery is a file in `publish/`; posting is the customer's decision, each time.
- Never use a scene, ground or ending that was not made for this brand.
- Never use another brand's logo, product screens or official marks in a way that suggests a partnership the customer does not have.
- Never state a price, count, duration or guarantee that is not in `facts.md`.
- Never tell the customer a reel is ready while `check.json` has problems.
