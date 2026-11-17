---
name: setup
description: First-time setup of Tiraz for one company or account. Checks the machine, interviews the owner about their brand, audience, tone and limits, builds their brand folder, then designs a look that is theirs alone - three directions shown as style frames, the owner chooses, and the chosen look is built as code in their folder. Use when someone installs the kit, says "setup", "ابدأ", "هيّئ النظام", "جهّز النظام", asks to change how their content looks, or when a project has no tiraz/brand/brand.json yet.
---

# Setup: one brand, and a look made for it

You are setting up Tiraz for one customer. At the end they have a brand folder that every reel reads, and a look that was designed for them and that they chose. Nothing is produced for publishing in this skill.

**The kit root** is two folders above this file (it holds `engine/`, `tools/`, `guides/`, `assets/`). Call it `<kit>`.
**The customer's files** live in their own project, never inside the kit: `<project>/tiraz/brand/`. `<project>` is the folder this session works in; confirm it with the customer once.

**The kit has no look of its own.** There is no template to fill. What the customer's content looks like is designed here, from their materials and their taste, and belongs to them. Never start from `tools/fixtures/` (a plain test card that exists only to test the kit), from a picture of someone else's result, or from another brand's folder.

Speak to the customer in their language. With Arabic speakers use clear simple Arabic and switch to their dialect once you hear it. One step at a time. Summarise tool output in a sentence; never paste JSON at them.

## 1. Is the machine ready?

Run `python <kit>/tools/doctor.py` and read the JSON.
- If `ready` is true, say so in one line and move on.
- For each item in `missing`, tell the customer what it is for and what the fix is, and ask before running any install. Install one thing at a time and run the doctor again after each.
- Never ask for, print or store an API key. `elevenlabs_key` only says whether one is set; narration needs it later, setup does not.

## 2. The interview

The questions are in `interview.md` beside this file. Ask them section by section, a few at a time, never all at once.
- "I don't know" is a valid answer. Record it and move on; do not fill the gap with a guess.
- If the customer is away and left their answers in writing: that file is the interview. Copy it as `answers.md`, record "I don't know" for whatever it does not say, and go on without stopping. Where a later step says to ask them or to wait for their choice, take the cautious option (leave the thing out; in the look step choose the direction yourself and write why), keep a list of the open questions, leave `"approved"` out of `brand.json`, and put the open questions first when you hand anything over.
- When an answer is vague ("modern", "professional"), ask for one piece of work they like and one they dislike, and what exactly they like in the first. Taste comes from examples, not adjectives.
- Ask for the materials listed at the end of `interview.md`. Copy what they give into `<project>/tiraz/brand/` (logo, fonts) and `<project>/tiraz/brand/refs/` (liked and disliked work, with their own reason for each in `refs/README.md`).
- Sounds are theirs to bring. If they have sound effects of their own, copy them as WAV files into `<project>/tiraz/brand/sfx/`, each named by what it is for (`pop.wav`, `whoosh.wav`, `impact.wav`, `bed.wav`; `python <kit>/sound/pick.py --list` shows the kinds). Their sounds are used first. With none, reels use the free sounds that ship with the kit, and you tell them so.
- Customer conversations they share must have names and phone numbers removed before you save anything from them.
- Save the raw answers as they were given to `<project>/tiraz/brand/answers.md`. Everything else is built from this file, so it can be rebuilt.
- 3D in reels is not part of a normal setup: the kit ships no 3D scenes. (A 3D scene on a web page is another matter and needs nothing here: it is drawn in the visitor's browser, `guides/web.md` section 11.) Only if the customer asks for 3D in their reels, or the work they point to as their taste is 3D renders, run `python <kit>/tools/check_device.py`, tell them the verdict in plain words, and save it as `brand/device.json` with `"3d": true|false`. On an `unfit` machine 3D stays off unless they write that they accept the risk; record their sentence in `rules.md`.

## 3. The brand folder

Write these in `<project>/tiraz/brand/`. Each one states only what the customer said or what their materials show. Mark anything you inferred as inferred, and ask them to confirm it.

| File | Holds |
|---|---|
| `brand.json` | the identity values (below) |
| `voice.md` | dialect, tone, words they use, words they never use, 5 to 10 of their real lines |
| `audience.md` | the customer in a paragraph, their top questions and objections |
| `facts.md` | a table of what may be stated: the claim, its exact wording or number, its source and date. Anything not in this table is not said in their content |
| `rules.md` | what never appears; who approves; then a dated list of corrections that grows |

```json
{ "name": "…", "shortName": "…", "handle": "@…", "platform": "instagram", "dir": "rtl", "digits": "latin",
  "slogan": ["…"],
  "colors": { "bg": "#……", "text": "#……", "accent": "#……" },
  "fonts": { "display": { "family": "…", "file": "/brand/fonts/….ttf", "weight": "400 900" } },
  "logo": { "file": "/brand/logo.svg" } }
```

- **Paths:** `/brand/…` is a file in the customer's brand folder; `/assets/…` is shipped with the kit.
- **Digits:** `"latin"` (0123) or `"arabic"` (٠١٢٣), decided as `guides/arabic-text.md` section 3 says.
- **A number that is a label, not a claim** (a step, a part number on a sticker) still needs a row in `facts.md`, marked as a label: the reel check refuses every number that has no row.
- **Colours come from their materials**, not from taste: read them from the brand guide, the logo file or their site. `bg` is the ground their content sits on, light or dark as the brand is. `accent` is the brand colour that carries the key word. More named colours may be added when the brand has them (`"gold": "#…"`).
- **Fonts:** their own font file if they have one and its licence allows it; keep the licence beside it. If they have none, do not pick a default: choose with them. Shortlist three families from the kit that fit what you learned (`python <kit>/tools/assets.py fonts` lists them), and render one of their own lines in each, on their own colours. Use a line that has a number in it, so the digits are judged too:
  ```
  python <kit>/tools/assets.py fonts --sheet <project>/tiraz/brand/fonts-shortlist.png --families "A,B,C" --text "<their line>" --colors "<bg>,<text>,<accent>"
  ```
  Add `--weight 800` (or another weight) when they want a heavy or a light face: the sheet says at which weight each family was drawn, and a family that stops lighter is drawn at its heaviest. Look at the sheet, and let them choose. Copy the chosen family's folder (the font file and its `OFL.txt`) into `brand/fonts/`.
- **Logo:** never redraw or "improve" a logo. It is given in one of two ways:
  - `"file"`: an SVG or a PNG with a transparent background. It is drawn in its own colours and cannot be tinted. If the look will place it on a surface where those colours fail, ask the customer for the version made for that (most brands have a one-colour or reversed logo) and keep it beside the first; a scene loads it with `kit.image`.
  - `"path"`: the SVG path data of a one-colour mark, with `"box"` (the size of its square, as in the SVG's `viewBox`) and `"rule": "evenodd"` when the mark has holes. A path logo takes whatever colour a scene gives it. Only copy path data out of the customer's own file; a `<circle>` or `<rect>` in that file may be written as the same shape in path data (a circle is two arcs), and if you are not sure the result is identical, use `"file"`.
  - With a detailed logo also give `"mark"`: a simple version (a file) for small sizes.
- **slogan:** their real one, in one or two parts. If they have none, leave it out; do not invent one.

Run `python <kit>/tools/brand_check.py <project>/tiraz/brand --preview`. Fix every problem; tell them each warning in plain words (for example low contrast) with what you suggest. Open `preview.jpg` yourself: the right font and not a fallback, the logo whole, the colours theirs, Arabic joined and reading right to left. Show it to them and confirm the values before designing anything.

## 4. The look

This is the part that makes their content theirs. Follow `<kit>/guides/look.md` step by step, and read `<kit>/guides/scenes.md`, `<kit>/guides/motion.md` and `<kit>/guides/arabic-text.md` before writing code.

1. **Evidence.** Fill the inventory in `look.md` section 1 from their logo, product, typeface, colours, voice and references. Write it into `look/notes.md`.
2. **Three directions.** One sentence each, different in kind and not in colour (`look.md` section 2). Put your first idea aside. Run the two tests on each: cover the logo, swap in a competitor.
3. **Style frames.** Build each direction roughly but truly in `look/directions/A`, `B` and `C` (a `scene.js` and a `spec.json` each), with the same content in all three: a hook line in their voice, one fact from `facts.md`, and the ending. The words and numbers go in each `spec.json` inside `"says"`, as in a reel. Render three stills from each and put the nine on one sheet:
   ```
   python <kit>/tools/make_reel.py <brand>/look/directions/A --brand <brand> --stills <t1>,<t2>,<t3>
   python <kit>/tools/sheet.py <brand>/look/directions/sheet.jpg --cols 3 A1=<file> A2=<file> A3=<file> B1=… B2=… B3=… C1=… C2=… C3=…
   ```
   - Choose the three moments after the direction's timing exists: one where the hook line has fully arrived, one where the fact has landed, one where the ending has settled. A still taken while words are still arriving shows half a frame.
   - `--stills` prints the files it wrote. They are in the direction's `stills/` folder, named by the moment: `at_000.40.png` for 0.4 s, `at_002.60.png` for 2.6 s.
   - `--stills` also writes `stills/sheet.jpg`, a plain row of that one folder's stills, and says if any text it measured reaches outside the safe area. `tools/sheet.py` is the one that puts stills from several folders side by side with a label on each.

   Open the sheet and look at it before anyone else does. Fix what is broken; drop a direction you would not build and make another.
4. **The choice.** Show the sheet. Say one sentence about each direction's idea and which you recommend and why. They choose; they may take one direction and one element of another. Write their choice in their words in `rules.md`. If they say "you choose", choose, say why, and still show them the three.
5. **Build the chosen look** in `<brand>/look/`: `look.md` (one page, the headings in `look.md` section 5 of the guide), `tokens.json`, `ground.js`, `motion.js`, the parts the preview needs in `parts/`, `ending.js` with `ending.json` (its length and its own sound cues), `joint.js` if this brand's scenes join by more than a cut (`scenes.md` section 2), `mark.js` only if they want a persistent mark, and `preview.json`. Add `"look": "/brand/look/"` to `brand.json`.
   - `preview.json` is written like a reel's `spec.json` (`"scenes"`, the look's `"transition"`, `"over"` if there is a mark): a short sequence of a line, one fact and the ending, plus `"stills": [seconds from the start of the sequence]`, one moment per thing worth showing. The times are counted as in a reel: each scene starts when the one before it ends, less the length of the transition between them. With no `"stills"`, five evenly spaced moments are taken.
   - The directions stay in `look/directions/` as the record of what was offered. They are not part of the look: no part imports from them.
6. **Check it.** `python <kit>/tools/brand_check.py <brand> --preview`, then answer the seven questions in `look.md` section 7 in writing, in `look/notes.md`. A look that fails one is not ready. The preview is stills, so it cannot show a flash: if the look has a joint or a sweep that covers the frame, keep it close to the ground's own brightness, and read the flash line of the first reel's check, which measures it.
7. **Approval.** Show them `preview.jpg`. Apply each correction to the look itself (`look.md`, `tokens.json`, the part), render the preview again, and add a dated line to `rules.md` in their words. When they approve, add `"approved": "<date>"` to `brand.json` and tell them in two or three lines what exists now and what they can ask for next.

## What this skill never does

- It does not publish, post or send anything anywhere.
- It does not use a ready-made look: not the test card, not a picture of another brand's result, not something made for another brand.
- It does not redraw the customer's logo, and it does not copy another brand's logo, font or look into their folder.
- It does not write into the kit folder.
- It does not state a price, promise or number that is not in `facts.md`.
