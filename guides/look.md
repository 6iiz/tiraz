# Look: designing one brand's visual system

The kit has no look. Every brand gets its own, designed from that brand's materials and its owner's taste, written as code into `<project>/tiraz/brand/look/`, and used by every reel made for that brand afterwards. This guide is how to decide a look. `scenes.md` is how to build it.

Read it before the look step of setup, and again whenever a customer asks to change how their content looks.

## 0. What a look is, and what it is not

A look is a small system of decisions that makes ten different reels recognisably one brand's: what is behind everything, how words arrive, what shapes hold things, what the accent colour means, how things move and sound, and how a reel ends. Reels change their words and their choreography; they do not change the system. [judgement]

It is not:

- a recolour of something made for another brand. Swapping colours and a logo into an existing design gives the customer someone else's identity. [judgement]
- the test card in `tools/fixtures/`, or a picture of a result made for someone else. The test card exists to test the mechanics and is plain on purpose. Never start from it, never borrow a ground, an ending or a part from it. [ours: K ARCHITECTURE]
- a look you made for a previous customer. Each brand folder owns its look; nothing travels between brand folders. [judgement]

## 1. Evidence first: where the look is hiding

Do not open the canvas yet. Look at what the brand already is, and fill this in (one line each; "none" is an answer). The look comes out of this table, not out of a mood. [adapted: motionmaxxing idea §2]

| Look at | Ask | What it can give the look |
|---|---|---|
| The logo's shape | Is it round, sharp, stacked, drawn by hand, a letter, a container? What everyday object or gesture does it resemble? | the shape language: corner radius, stroke weight, angles, a mask, a frame |
| What the brand sells, in the hand | What is it made of, what does it look like up close: steam, paper, fabric, glass, a screen, a number, a voice? | the ground and its texture |
| The one thing a customer does | Pours, wears, opens, sends, books, compares, unboxes? | the motion: what things do when they arrive |
| Their typeface | Geometric, calligraphic, soft, technical, heavy, light? Do they own a font file? | the type scale and the rhythm of lines |
| Their colours and what each means | Which colour is "ours", which means price, new, warning, premium? | colour roles that stay the same in every reel |
| How they talk | Read `voice.md` aloud. Dry, warm, loud, exact, playful? | the pace, and how much is on screen at once |
| What they would never do | A calm brand does not glitch; a playful one does not wear black tie. | the edges of the look |
| What they like and dislike (`refs/`) | For each reference: which one thing do they like in it, in their own words? | permission and limits. Borrow the quality they named, never the piece itself |
| Who watches, and where | Age, place, phone in hand, sound on or off, what else is in their feed? | density, type size, contrast, how fast |

Keep literal: the logo (never redraw it), the typeface, the colour values and their meanings, real product pictures, the brand's real words. Invent: the stage, the light, the texture, the choreography, the sound, all drawn in the brand's own grammar. [adapted: motionmaxxing idea §2]

## 2. One idea, in one sentence

A look needs an idea that only this brand could own: one sentence that predicts what the frame is made of and what happens on it. "Warm, premium, modern" predicts nothing: any brand could say it, and it does not tell you what the first frame shows. A sentence that works names one of this brand's own things from the table above (its surface, its shape, its gesture) and says what every reel does with it, so that a stranger could sketch a frame from the sentence alone. [adapted: motionmaxxing idea §3]

There is no example sentence here, on purpose. In a trial, the example that used to stand in this place came back as the first direction offered to a brand it had nothing to do with. The sentence has to come out of the table. [ours: product trial 2026-11-17]

1. Write your first idea down, then put it aside. It is nearly always the category's costume: steam and beans for coffee, circuits for tech, gold for luxury. [adapted: motionmaxxing idea §3, slop Part 0 reach 7]
2. Write three directions that differ in **kind**, not in colour. Kinds that give different looks: [judgement]

| Kind | The frame is | Fits when |
|---|---|---|
| A material | a real surface of the product or its place: paper, cloth, ceramic, a counter, a screen | the brand sells something you can touch |
| Type as picture | words at scale, set with care; rhythm and size carry everything | the brand's value is what it says, or it has a strong typeface |
| A graphic system | one shape from the logo, repeated, scaled, used as frame and mask | the logo has a clear geometry |
| A stage for the product | the product or its photo, lit, with room around it | the product is beautiful or the photos are good |
| The brand's own screen | their app, site or receipt as the place where things happen | the product is digital |
| Made by hand | drawn lines, cut paper, stamps, tape, imperfect edges | the brand is small, personal, local, crafted |

3. Test each direction: [adapted: motionmaxxing idea §3]
   - **Cover the logo.** Does the frame still say whose it is?
   - **Swap in a competitor.** Would it work for them with the colours changed? Then it is the category's look, not this brand's.
4. Choose one. A look is chosen, never averaged: do not combine all three. A customer may take one direction and ask for one element of another; write down which and why. [adapted: motionmaxxing idea §3]

## 3. The decisions a look makes

Decide each one for a reason you can say in a sentence about this brand, and write the sentence in `look.md`.

**Ground.** What is behind everything. A flat colour only if the brand is truly flat; otherwise a surface, a texture or a light that belongs to the brand, alive but quiet, so a held line never sits on a dead frame. Light or dark follows the brand, not the idea that dark looks expensive. [adapted: motionmaxxing world §1, slop Part 0 reach 4]

**Colour roles.** `bg`, `text` and `accent` come from `brand.json`. Decide what the accent means (the key word, the price, "yes") and keep that meaning in every reel; add named colours only for meanings the brand has. Text needs 4.5:1 against the ground at every moment, and large text 3:1. `brand_check` says where the accent stands: under 4.5:1 it can colour large words only (about 66 px and up in a reel, 24 px and up on a page), and for small things it is a mark (an underline, a ring, a dot), not the colour of the text. Decide that here, so reels and pages agree. [adapted: motionmaxxing idea §2; source: W3C WCAG 2.2 contrast; ours: product trial 2026-11-17]

**Type.** The brand's own font first. If they have none, choose one that fits the evidence in section 1 from the families in `assets/fonts`; there is no default family. `python tools/assets.py fonts` lists them by kind (sans, kufi, naskh, display, hand) with their weights, and `fonts --sheet` draws a shortlist in the customer's own line, colours and weight, which is the only way to judge one. One family, used in a small scale of sizes (a hook, a line, a note, a number). Measure the heaviest weight before building on it: a wide heavy family may not fit a long word at the size you want. The rules for Arabic are in `arabic-text.md` and are not optional. [judgement]

**Shapes.** Take them from the logo: its corner radius, its stroke weight, its angles. A container (a card, a band, a frame) appears only when the content needs holding, and it is drawn in that grammar. A rounded dark card with a thin rim is not a decision; it is what a model draws when it has not looked at the logo. [adapted: motionmaxxing idea §2, slop "never ship" 3 and 8]

**Motion.** Three words about how this brand moves, turned into numbers: which ease, how long, how far, whether anything overshoots, how things leave, what stays alive while a line holds. The temperament is the brand's: a bakery that says "warm, quiet" and an app that says "fast, bold" must not move alike, and neither should move like the last brand you made. One grammar for arrivals, so a viewer learns it. The numbers and their reasons are in `motion.md`. [judgement]

**How scenes join.** A cut, a shape that carries from one scene into the next, or a joint of the brand's own (`joint.js`: a wipe in the shape of its logo, a page that turns, an edge that sweeps). Choose one way and use it the same way in every reel. Then look at the joint itself: render the frames across it and measure the reel, because a joint that covers the frame in a much lighter or darker colour is a flash at every cut (`motion.md` section 5). [judgement; ours: product trial 2026-11-17]

**Sound.** Which kinds of sound belong to this brand, how dense, how dry. The brand's own sounds first (`brand/sfx/`); the kit's free sounds stand in. `sound.md` has the craft. [ours: K ARCHITECTURE]

**The ending.** One beat, smaller than the reel's best moment. It arrives because something caused it (the last line resolves into it, the product settles into it), not because the reel ran out. Decide what is on it (the logo, the handle, the slogan if they have one, the ask), how long it holds, and its own sound. A logo, a slogan, a button and a link held for seconds is a web footer, not an ending. [adapted: motionmaxxing close, slop Part 0 reach 11]

**A mark (optional).** A small persistent sign of the brand through the reel, only if the customer wants one. If it must be read, it sits inside the safe zone; if it is decoration, it may sit outside and be covered by the app. [judgement; source: Meta Ads Guide]

## 4. Style frames: show three, do not describe them

A customer cannot choose from adjectives. Show the three directions as pictures, made with real code, with the **same content** in each so only the look differs: [judgement]

- a hook line from their own voice (with one accent word),
- a moment with a fact from `facts.md` (a price or a number),
- the ending.

Each direction is a small folder, `look/directions/<A|B|C>/`, with its `scene.js` and `spec.json`; render three stills from each (`tools/make_reel.py … --stills`) and put the nine side by side with `tools/sheet.py`. Take each still at a moment when its content has fully arrived: choose the moments after the direction's timing exists, not before. Rough is fine; false is not: never show a direction you would not build, and never mock up in a picture what the code cannot do. [judgement]

Say one sentence about each direction (its idea, not its features), recommend one, and let them choose. Write their choice and their words in `rules.md`.

## 5. Write the look down

`look/look.md`, one page, in the customer's language, with these headings: the idea (one sentence, and why only this brand); ground; colour roles; type scale; shapes; motion (with numbers); sound; ending; five things this look always does; five things it never does; what was taken from the customer's references and why.

`look/tokens.json` holds the numbers every part shares (sizes, weights, radii, spacing, durations, the names of eases, named colours), so a change is made once.

Then build `ground.js`, `motion.js`, the parts the first reels need, `ending.js` with `ending.json`, and `preview.json`, and show the customer `preview.jpg` before any reel is made (`python tools/brand_check.py <brand> --preview` names any of these that is missing). `preview.json` is a short reel in everything but name: a sequence of a line, one fact and the ending, written like a reel's `spec.json` (`scenes.md` section 2), plus `"stills"`, the moments to show, in seconds from its start. [ours: K brand_check]

## 6. Reaches to notice

None of these is banned. Each is fine if you chose it for a reason about this brand. What is not fine is arriving there by default. [adapted: motionmaxxing slop Part 0]

| The reach | Ask |
|---|---|
| A page instead of a picture: a headline block, a sub-line, a card, held while words swap | Would this frame work as a slide? Then it is a page. |
| Premium pastiche: near-black ground, a radial glow, a gold or coral spark, one italic serif word | Is the ground dark because the brand is dark? |
| The category's costume: beans for coffee, a shield for security, a rocket for a launch | What was my first idea, and did I look past it? |
| The same components for everyone: a rounded card with a rim, pill badges, a tick in a circle, glass panels | Did this shape come from the logo, or from habit? |
| Effects as proof of effort: a new technique in every beat | Does the idea need this effect? |
| Invented proof: numbers, reviews, screens, logos drawn to look real | Is everything on screen true and theirs? |
| Minimalism as a hiding place: a small thing on an empty ground, long holds | Is the emptiness doing a job, or was the world not built? |
| The ending as a footer: logo, tagline, button, link, held for seconds | Did it arrive by cause, and is it one beat? |

Told to be bold, a model overcorrects into a second default that is just as recognisable: a giant word cropped by the frame in every piece, texture inside the letters, a colour flood between every beat, a dot that becomes the logo, everything moving all the time. Eight brands made that way look like one designer's reel in eight colours. [adapted: motionmaxxing slop Part 0]

## 7. Before the customer sees it

Answer each in a sentence; a look that fails one is not ready. [adapted: motionmaxxing slop Part 0; judgement]

1. For the ground, the type, the shapes, the motion, the sound and the ending: which did I decide, and which did I reach for?
2. With the logo covered, does it still say whose it is? With a competitor's logo, would it still work? (It should not.)
3. With all text covered, does every frame still show a picture?
4. Is every line 4.5:1 against what is behind it, at every moment, and inside the safe zone? Is the Arabic joined, whole and unclipped at 100%?
5. Imagine a sales reel and an explanation reel in this look. Does the system hold both without a new idea?
6. Look at the sheet at a quarter of its size, the way a feed shows it. Is the accent word still the first thing seen?
7. Did anything come from the test card, a picture of someone else's result, or another brand's folder? Remove it.

## 8. When a look changes

A customer's correction to the look is a change to the system, not to one reel: update `look.md`, `tokens.json` and the part, render the preview again, and add a dated line to `rules.md` in their words. A look that drifts from reel to reel stops being one. [judgement]
