---
name: site
description: Make a one-page website for the customer in their own look, from an agreed plan to a checked folder of plain files ready for their approval - one job, true facts only, Arabic right to left, the first screen shown as a picture before the rest is built, and a browser check of the finished page. Use when the customer asks for a website, a landing page, a store or link-in-bio page, or says "اصنع موقعاً", "أنشئ صفحة", "سوّي موقع" or "اعمل صفحة". Needs the brand folder and the look made by the setup skill.
---

# Site: one page, in the customer's look, checked before they see it

**The kit root** is two folders above this file (`web/`, `tools/`, `guides/`, `assets/`). Call it `<kit>`.
**The customer's files** are in `<project>/tiraz/`: `brand/` (made by setup, with their look in `brand/look/`) and one folder per site, `sites/<slug>/`, which holds `plan.md`, `content.md`, `first-screen/` and `site/` (the folder that is handed over). Nothing is written into the kit.

The kit has no site template and no look of its own. Every page is designed from the customer's look and built for them. Never start from a template, from `tools/fixtures/` (a plain test card that exists only to test the kit), or from another brand's folder or site.

Speak to the customer in their language and dialect. Summarise tool output in a sentence. Report only what you checked: "built" is not "looks right", and "the script passed" is not "looked at".

## 0. Before anything

1. `<project>/tiraz/brand/brand.json` must exist, pass `python <kit>/tools/brand_check.py <project>/tiraz/brand`, and name a look (`"look"`). If it has none, run the setup skill's look step first: a site is not made in a borrowed look.
2. Read all of `voice.md`, `audience.md`, `facts.md` and `rules.md`. `rules.md` is the customer's own corrections: it wins over every default here and over every guide.
3. Read `look/look.md` and `look/tokens.json`. This is the system the page is built in; if `look.md` already has a "web" heading from an earlier page, its decisions stand.
4. Read the guides. They hold the craft; this file holds the steps.

| When | Read |
|---|---|
| before planning the page | `<kit>/guides/web.md`, `<kit>/guides/look.md` |
| before putting Arabic on the page | `<kit>/guides/arabic-text.md` |
| before building a scene on a canvas (3D, particles) | `<kit>/guides/web.md` section 11 |

Each rule in a guide says where it comes from: `[ours]` was tested by the kit's authors, `[adapted]` and `[source]` come from others, `[judgement]` is reasoning. Weigh them in that order.

## 1. Agree the page first (one message)

Tell the customer, briefly:
- the page's one job, in one sentence, and who lands on it from where;
- the sections and their order, each with the question it answers;
- the page as a short film the visitor plays by scrolling (`web.md` section 12): an opening, three to five moments and a closing. For each: what the visitor sees happen, which of the brand's own things does it, what the visitor's hand does, the line of words it carries, and the still that stands in when nothing may move. Every moment comes from this brand (what marks them when they are seen, their product, the gesture of their trade) and carries a fact or sets up the action. A page planned only as sections comes out ordinary;
- the headline and the button, word for word, in their voice, and where the button goes. A button says what it does: if the action needs something the customer has not given (a phone number, a store link), it goes to a channel they did give and is worded for that channel, and the missing piece is your first open question;
- every number, price, condition and claim that will appear, each with its `facts.md` row (or the page it is read from today);
- what is left out because there is no fact for it: reviews, a client count, a phone number, a guarantee.

Wait for their yes.

If they asked you not to stop: write the same into `<project>/tiraz/sites/<slug>/plan.md` and go on. Wherever a guide says to ask the customer something, take the cautious option (leave the thing out), add the open question to `plan.md`, and put those questions first when you hand the site over.

## 2. Show the first screen before building the rest

Build only the first screen, truly, in the look: real code, the real headline, the real picture, the real button. Put it in `sites/<slug>/first-screen/` with its own `index.html`, then capture it:

```
node <kit>/web/check.mjs <project>/tiraz/sites/<slug>/first-screen --draft
```

`--draft` tells the check the page is not finished, so it does not complain that there is too little text. Open `390x844-top.png` and `1440x900-top.png` in `first-screen.check/`. Contrast, fonts, overflow and text touching the edge of its shape matter already. Check `web.md` sections 3 and 4: the one job is clear before any scroll, the look carries it, the text over any picture is readable, and the two tests of `look.md` section 2 hold. Then look at each capture alone, as a poster (`web.md` section 12): the picture or scene is the ground of the whole screen and not a box beside the text, the type is part of the picture, and the frame holds without motion. If it reads as a headline, a picture and a button, it is not done: compose it again before building anything else.

If they asked you not to stop, one first screen is enough: this step is then your own check before building the rest. If the customer wants a choice, make two or three first screens that differ in idea (what leads, what the picture does, where the action sits), never only in colour, in `first-screen/A`, `B`, `C`. Put the phone and desktop captures side by side:
```
python <kit>/tools/sheet.py <project>/tiraz/sites/<slug>/first-screen/sheet.jpg --cols 2 A-phone=… A-desktop=… B-phone=… B-desktop=…
```
Say one sentence about each idea, recommend one, and let them choose. Write their choice and their words in `rules.md`. Then build the rest from the chosen one.

## 3. Build

- **Where:** `<project>/tiraz/sites/<slug>/site/`. Everything the page needs is inside this folder. From here on the first screen lives in `site/`: `first-screen/` stays as the record of what was shown in step 2 and is not kept in step with the build.
- **Plain files:** `index.html`, a stylesheet, and a little JavaScript only where it earns its place. No framework and no build step unless the customer's project already has one and they ask for it.
- **The look as code:** `look/tokens.json` becomes CSS custom properties at the top of the stylesheet, with the same names. Colours, weights and the character of the motion come from there as they are. Its sizes are pixels of a reel's frame and it has no spacing scale, so the page's sizes (in `rem`), spacing steps and radii are new decisions (`web.md` section 3): add them to `tokens.json` under a `"web"` key and write the reasons into `look/look.md` under a "web" heading, with the other decisions a reel never needed (reading width, touch targets, states).
- **Fonts and pictures:** copy the brand's font files (with their licence file) and the customer's own pictures into the site folder, and load them from there. Nothing is fetched from another host. Write each font again as WOFF2 for the page (`python <kit>/tools/assets.py webfont <font file> --out <site folder>/fonts`: the same font, less than half the size, nothing taken out; `web.md` section 5).
- **Words:** every word a visitor reads is also listed in `sites/<slug>/content.md`, section by section, each number, price, condition and claim with the `facts.md` row it comes from. Dialect and tone from `voice.md`; copy its rhythm, not its sentences.
- **Markup the check relies on:** `<html lang="…" dir="…">`, one `h1`, the content in one `<main>`, fonts through `@font-face`, and `data-over-picture` on the element that holds any text over a picture, video, canvas, gradient or texture, and not on a plain coloured surface (`web.md` sections 4 and 10). A scene that stays in the window while the page scrolls lies under every text that passes over it: mark the element that holds those words.
- **The accent:** if `brand_check` says the accent is under 4.5:1 on the ground, it can be the colour of a large headline word only. For anything smaller it is a mark (an underline, a ring, a dot), not the colour of the text. Under 3:1 it is never the colour of text at any size: a mark, or a surface with the text colour written on it.
- **The moments** (`web.md` section 12): copy `<kit>/web/kit/scroll.js` to `site/kit/scroll.js`. It holds the mechanics (a section's progress through the window, a screen that stays while its section scrolls, the state of the world following the section in view, layers at different depths, a card that leans, a number that counts to its fact) and no look: the distances, angles, durations and eases are the brand's, in the page's own stylesheet. Build one moment at a time and capture it before the next.
- **A drawn or 3D scene**, when the plan calls for one (`web.md` section 11): copy `<kit>/web/kit/stage.js` to `site/kit/stage.js` and mount the scene through it, which keeps the still, reduced motion, the pause off screen and the pixel ratio right: `createDrawing` for lines and flat shapes on a 2D canvas (no library), `createStage` for a three.js scene (copy `<kit>/vendor/three/`, the library and its `LICENSE`, to `site/vendor/three/`). Make the stills from the scene itself: `node <kit>/web/still.mjs <site folder> <site folder>/img/<name>.webp`, one for each moment of a scene that follows the scroll (`--t`). Those stills are `img` elements in the markup, each beside its moment's words, given to the stage as a list and hidden by one rule while the scene runs; never in a `<noscript>`. The words stay in HTML.
- **The head** (`web.md` section 9): a title, a description of one true sentence, and what a shared link shows. What needs the page's final address waits for the customer to give it.
- **When the script never arrives** (`web.md` section 12): if the layout depends on the script, the one line in the head that gives the plain page back after four seconds. The page's script says it is alive (`window.pageIsLive = true`) from its light part, before a scene's library is asked for, so a slow connection keeps the designed page; and anything that arrives after the four seconds stands down (`window.pageIsPlain`), which the kit's two files already do.
- Nothing from `rules.md`'s "never" list appears.

## 4. Check, then look

```
node <kit>/web/check.mjs <project>/tiraz/sites/<slug>/site --more
```
It writes `site.check/` next to the site (not inside it): `390x844-top.png`, `390x844-full.png`, `1440x900-top.png`, `1440x900-full.png`, `390x844-nojs-full.png` and `check.json`; and, with `--more`, the page 320 and 1920 px wide, with the text size doubled, with keyboard focus on its first controls, with the pointer over its first action, screen by screen as a visitor scrolls it on a desktop and on a phone, at four places 320 px wide, and under reduced motion (`more-*.png`). On that walk every piece of text is measured against what is really behind it at each place, so words that a moving thing passes behind are reported with the picture that shows them (`more-behind-*.png` when it is not one of the walk's own). A long page, or one with short moments, takes `--shots 24` for more pictures of the scroll. **Every problem is fixed and the check run again** until it exits with 0. The check never reads `facts.md`: compare every number in `content.md` with its row yourself. A number that is not there is removed or sourced, never waved through.

Then open the screenshots yourself, each one, and go through this list:
- the brand's font, not a fallback (compare letter shapes with `brand/preview.jpg`), on headings, text and buttons
- Arabic joined and right-aligned; every number with `+`, `%`, a range or a currency reads as written in `facts.md`; one digit system
- the first screen does its job before any scroll, on the phone and on the desktop
- text over every picture readable at both sizes; nothing cut, overlapping or scrolling sideways on the phone
- no text touching the edge of the shape that holds it: look at the two ends of every line inside a button, a pill, an arch or a circle
- a scene on a canvas: drawn on both captures, its still in its place on the no-JavaScript one, no words hidden behind it
- every price, fact and condition matches `content.md` exactly, and each condition sits next to what it qualifies
- it looks like this brand's reels and `look.md`, and like no other brand's site
- the no-JavaScript screenshot shows all the text

Then open the `more-*.png` pictures, each one: the page at 320 px (whole, and at four places of the scroll: `more-320-N.png`) and at 1920 px, with the text size doubled, the focus on each of the first controls (is it plain to see, in the brand's colours?), and the first action under the pointer. They stand in for doing these by hand; a script of your own is not needed.

Then open the `more-scroll-*.png` pictures in order, desktop then phone: this is the page as the visitor meets it, one screen after another, and the only pictures that show a scene fixed behind the page or a moment tied to the scroll. For each screen ask: is it composed, or only filled? Would a crop of it be recognised as this brand? Is its moment there, and does it carry its fact? Is the phone screen planned for a phone, or squeezed? Do the pictures that fall between two moments read as intended? The last picture of each is the closing: its action is on it, nothing lies over it, and nothing comes after it. Then the `more-reduced-*.png` pictures: the same page for a visitor who asked for no motion, complete and calm. A screen that fails goes back to step 3. A page that is correct and ordinary is not finished (`web.md` section 12).

**A blind read**, when the tool you run in can start a fresh reader that has seen neither the plan nor the code (in Claude Code, a new agent started for this one job, or a second session). Give it only the pictures in `site.check/` and `check.json`, and ask: what is this page's idea, in one sentence; what is weak on each screen, named by picture, most serious first; and what a visitor would not understand. Nothing else: not `plan.md`, not `look.md`, not what you were going for. Whoever built a page judges what they meant; a reader who sees only the screen judges what is there. If its sentence is not the idea in `plan.md`, the page is not saying it yet. Fix what it lists, or write in `review.md` why not. A second read after the fixes is a new reader, never the first one again: it would judge against what it already said. In the kit's own trials this read found a closing hidden on the phone and patches cut out of the page's ground, both passed by the builder's own review.

Write what you looked at, what the blind read said, and what nobody could check (a real phone, Safari, a screen reader, load speed) into `sites/<slug>/review.md`. A page that only passes the script is not done.

## 5. Hand over

The page needs its own yes: approval of the look is not approval of a page. Give the customer the path to `site/` and, in five lines or fewer: what the page is for, what you verified and how, what you could not verify (a real phone, Safari, load speed), what was left out and why, and which facts were read on which date. To see it, open the folder through any local web server; how they host it is their decision.

Every correction they give:
1. apply it and run the check again,
2. add it to `brand/rules.md` as a dated line in their words with what it changed,
3. if it is about how their brand looks in general (a colour, the type, the way things move), change the look itself (`look.md`, `tokens.json`), so the reels and the next page follow.

## Never

- Never deploy, upload, publish, register a domain or connect a host. Delivery is a folder; putting it online is the customer's step, each time.
- Never use a site template, a theme, a picture of another brand's result, or another brand's site or look as a starting point. Never take a moment from another brand's page, however good: take the way it was made, and find this brand's own.
- Never state a price, count, duration, rating or guarantee that is not in `facts.md`, and never write a review, a testimonial or a client logo that the customer did not give.
- Never load a font, script, picture or tracker from another host.
- Never tell the customer the site is ready while the check reports problems or before you have opened the screenshots.
