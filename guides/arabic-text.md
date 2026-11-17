# Arabic on screen

Read this before you place any line, label or number. Tags: `[ours: …]` = our lesson or measurement (`SOURCES.md`); `[adapted: …]` = rule from a permissively licensed guide (`THIRD-PARTY.md`); `[source: …]` = public reference (`references.md`); `[judgement]` = reasoning without a recorded test. Where an adapted rule disagrees with a lesson we tested, ours wins.

What the kit does for you: text is shaped by HarfBuzz (`engine/type/shape.js`), so joins, ligatures and marks are resolved in the outlines; mixed lines are reordered by `engine/type/bidi.js`; `kit.fit` wraps on whole words inside the width you give it and never splits an Arabic word. [ours: K ARCHITECTURE, kit.js] What it cannot do for you: choose good words, keep numbers honest, or notice that a line sits under the app's buttons. That is this guide.

## 1. Whole words, joined

- **Reveal Arabic by whole words** (`revealWords`). Glyph-by-glyph reveals are allowed only on purpose (`revealGlyphs`), and glyphs must never move apart. [ours: K ARCHITECTURE type contract]
- Why: splitting Arabic into separately positioned letters breaks the joins. In our test a split word measured 467 px instead of 366 px and its letters stood apart. [ours: L 2026-11-09]
- If a glyph effect is needed, animate opacity and colour only, with the letters left in place. [ours: L 2026-11-09]
- **A fading word must fade as one shape.** Joined letters overlap a little at every join; when half-transparent text is drawn straight onto the frame with `fillText`, each letter is blended by itself and every join shows as a darker seam. `kit.drawText` draws a fading word solid first and lays it on the frame whole, so fade Arabic through it (set the opacity in `each`, or before the call). If you must draw Arabic yourself at partial opacity, draw it solid on a canvas of your own and draw that canvas with the opacity. [ours: product trial 2026-11-17, K selftest]
- **No letter-spacing (tracking) on anything that contains Arabic**, including a mixed span like «250 كم»: it visibly breaks the connected script. [adapted: designing-arabic-frontends] (Display tracking advice in Latin motion guides does not apply to Arabic.)
- **No italics or fake slant on Arabic.** Emphasis is colour, size or weight. [adapted: designing-arabic-frontends]
- **Kashida (tatweel) only as a deliberate move, at most once per piece.** A stretched word is a signature gesture; repeated, it reads as filler. [ours: P brief, A qa 2026-11-12] Excess kashida gives the text uneven colour, and several kashidas in one word should be avoided. [source: W3C Arabic Layout Requirements]

## 2. Right to left, with Latin and digits inside

- The base direction comes from `brand.json` (`dir`). Arabic lines are right-aligned or centred; never left-aligned in an RTL brand. [judgement]
- `bidi.js` handles one line with one base direction. It has **no embeddings, overrides or isolates**, and it ignores the invisible direction marks (U+200E/F, U+202A–E, U+2066–9). So do not try to fix order with invisible characters; rewrite the line. [ours: K bidi.js]
- Never paste direction marks into a spec or script. When code writes them they land as real invisible characters, not as escapes, and are hard to find. Scan spec and caption files for characters in U+200B–U+200F, U+202A–U+202E, U+2066–U+2069 before rendering. [ours: L 2026-11-16]
- Keep Latin islands short: one brand or product name, a code, a URL. A sentence that is half English reorders unpredictably and reads slowly. [judgement]
- **Check these on the rendered still, every time** (they are where order breaks): ranges («3–10 أيام»), prices with currency, percentages, a URL or handle, parentheses and quotes at the edge of a Latin run, a line that starts or ends with a number. [judgement; adapted: designing-arabic-frontends (LTR tokens inside Arabic are the classic breaker)]
- A URL, email or phone number is an LTR token. It must read left to right as a block inside the Arabic line; if the still shows it broken, put it on its own line. [adapted: designing-arabic-frontends]
- In a carousel or a swipe gesture, the layout inside a slide is RTL but the swipe direction is the platform's standard one; we got this backwards once and were corrected. [ours: L 2026-11-13]

## 3. Which digits

- Both Western (0123) and Arabic-Indic (٠١٢٣) digits are correct Arabic; the default differs by region. In Unicode's locale data, Saudi Arabia, Egypt, Syria, Lebanon, Jordan, Iraq, Kuwait, Qatar, Bahrain, Oman, Yemen, Sudan and Palestine default to Arabic-Indic digits; the UAE, Morocco, Algeria, Tunisia, Libya and generic Arabic default to Western digits. That is a software default, not proof of what a brand's audience reads. [source: Unicode CLDR via references.md §5; adapted: designing-arabic-frontends]
- The two digit families behave differently in right-to-left ordering (Arabic-Indic digits are a different bidi class from Western ones), so **after changing digit systems, re-check every still** with numbers, punctuation or ranges. [source: W3C Arabic Layout Requirements]
- **Decision order:** `voice.md` or `rules.md` if they say; otherwise the digits the customer's own store or site uses; otherwise the digits as written in `facts.md`. [judgement]
- **One system per reel**, on screen and in the caption. Mixing «٣ أيام» on one line with «3 days» styling on the next is a known failure. [adapted: designing-arabic-frontends]
- The checker reads both systems (it maps Eastern digits to Western before comparing with `facts.md`), so either is safe for the number gate. [ours: K reel_check]
- **Check the font's digits.** In one font the Latin "1" looked like a capital "I"; we took the digits from another font. Look at 0/O and 1/I/l on a still before using a font for numbers. [ours: L 2026-11-06]
- Currency follows the amount in Arabic («165 ريال», «89 €»), never glued before it. [adapted: designing-arabic-frontends]
- Counted nouns: 3–10 take the plural («4 آلاف», «5 أيام»), 11 and up the singular («15 يوم» in speech, «15 يومًا» in standard Arabic). Follow `voice.md` for the register. [adapted: designing-arabic-frontends (3–10 rule); judgement (11+)]

## 4. Diacritics

- Use a mark only where a reader could genuinely misread the word without it: «عَلَم» (flag) against «عِلْم» (knowledge). Fully voweled lines look like a textbook and get crowded. [judgement]
- Names of offers and products are written exactly as the store writes them, marks included. [ours: L 2026-11-14]
- Marks need vertical room. After any line with marks, look at the still at 100%: marks must not touch the line above, the edge of a backing shape or a label. Arabic needs a line height of about 1.6 for marks and descenders; `kit.fit` uses 1.6 × size by default. A two-row line with marks is still checked by eye, and if marks collide, split it into two timed lines rather than editing the shared engine. [adapted: designing-arabic-frontends (1.6); ours: K kit.js, safe.js (1.6 default)]
- The hamza is written where it belongs («يقرأ، رسائل، دقائق، سؤال»), not dropped or turned into ي. A missing hamza is a spelling error on screen, and the voice engine pronounces what is written. [ours: D, L 2026-11-11]

## 5. Line length, size and reading time

| Thing | Number | Reason |
|---|---|---|
| Words per line | about 5, one idea | [ours: K SKILL] |
| Wrap width | at most 940 px, the width of the safe zone (x 70–1010); you choose it in `kit.fit` (`maxW`) | 70 px each side of a 1080 frame. [ours: K safe.js, kit.js] |
| Main line size | about 72 px; 64–96 px | [judgement] |
| Smallest readable text | ≥ 4% of frame width (≈ 43 px at 1080) for anything the viewer must read | Text at 2–2.5% of width is unreadable on a phone. [ours: P23, A ref-analyst] A label at the edge of this size is one or two words; keep it that short. [judgement] |
| Weight | 400–700 for lines that are read (text, captions, labels); avoid 100–300 at reel sizes | Thin Arabic strokes vanish on phones. [adapted: designing-arabic-frontends] |
| Weight of display type | a hook or a number of two or three words may go heavier (800–900) when the brand is bold and the family has that weight | Open the still at 100% first: at heavy weights the counters and dots of some families close up, and a heavy family is wide, so a long word may not fit at the size you planned (`kit.fit` stops with a sentence when it cannot). [judgement; ours: product trial 2026-11-17] |
| Hold, voice carrying the line | after the line is complete: at least 0.45 s, and about 0.2 s per word for 2–5 words | [adapted: motionmaxxing type §10] |
| Hold, no voice | long enough to be read twice: about 2× the voiced hold, never under 1.2 s | The kit's rule is "read twice". [ours: K SKILL]; the multiplier is [judgement] |
| Lines on screen at once | one main line (plus at most one small label or caption) | Two competing lines split the eye. [judgement; ours: P brief "nothing else on screen"] |

Give a line at least its hold time plus its entrance and exit: `t1 − t0` ≥ hold + entrance + exit. [judgement]

## 6. Safe zones of a 1080×1920 reel

- **Meta's published Reels safe zone:** keep text, logos and key elements out of the top 14%, the bottom 35% and 6% on each side. On a 1080×1920 frame that leaves **x 65–1015, y 269–1248**. [source: Meta Ads Guide, Instagram Reels] TikTok publishes templates (including an Arabic RTL one) but no numbers; YouTube publishes none. [source: references.md §1]
- **The kit's safe zone is `SAFE`: x 70–1010, y 270–1248** (`engine/safe.js`, Meta's percentages in pixels), and the check warns about text placed below it. [ours: K safe.js, reel_check] So: **the hook, the price, the conditions and the ask go inside Meta's zone (y 269–1248)**; below it goes only text that may be partly covered without loss. A third-party reels guide gives a similar figure (bottom ~600 px, right ~150 px). [adapted: viral-captions-and-ctas (Vyral)]
- `SAFE` leaves 70 px each side, just inside Meta's 65 px side margins; keep the most important word away from the right edge, where the action buttons sit. [ours: K safe.js; source: Meta Ads Guide]
- Margins in static or framed layouts: ≥ 96 px from the frame edge, ≥ 64 px between text blocks, ≥ 56 px between text and a graphic, and at least 30% of the frame empty. Measure the real ink bounds; never guess. These numbers came from a layout that was sent back as cramped and approved once measured. [ours: L 2026-11-13]
- An icon or mark beside a word is placed by measuring the word, not at a fixed x. A fixed offset once put an icon on top of two words. [ours: L 2026-11-14]

## 7. Contrast

- Text must stay readable over everything that passes behind it, at every moment: aim for a contrast ratio of at least 4.5:1. [ours: G "contrast" rule] WCAG's minimum is 4.5:1 for normal text and 3:1 for large text (at least about 24 px, or about 18.5 px bold), and a computed ratio is never rounded up (4.499:1 fails). Reel text is almost always "large", but the background moves, so keep 4.5:1 against the brightest moment behind the line. [source: WCAG 2.2 contrast minimum; judgement for the reel margin]
- Over footage or a busy background, the brand's look decides how its text keeps that contrast, designed for that brand: its own backing shape, a calmer ground behind the text, or a progressive blur that grows under the text (see `look.md`). Prefer answers that keep the picture alive to a hard dark box. [ours: N batch 5, A edit-lab 2026-11-12]
- A soft shadow alone is not enough over bright frames. [judgement]
- Avoid a bright white full-frame moment behind or between text: on a dark brand it flashes. [ours: N batch 9]

## 8. One accent word

- Mark exactly one word per line with stars: `"بـ *[السعر]* ريال"`. It takes the brand's accent colour. [ours: K SKILL]
- Choose the word that carries the argument (the number, the verb that changes things), not the first or the last word by habit. [judgement]
- The brand's warning colour is for a warning only, never for decoration. [ours: G, P brief]
- Accent means one hue for "this matters"; do not add a second decorative highlight colour beside it. [ours: A content-writer 2026-11-05, A qa 2026-11-06]
- In word-by-word captions, the current word is lit and the others are dimmed (about 40% opacity). See `captions.md`. [ours: P20]

## 9. One dialect, and text written for the voice

- `voice.md` decides the dialect and its use/ban word lists. The same dialect runs through the voice, the screen and the caption. [ours: D principle]
- Before rendering, search every line and the caption for the banned words of `voice.md`. Bans slip in most in small connectors and in your own fixes. [ours: A qa 2026-11-06, 2026-11-13]
- The text sent to the voice engine decides the pronunciation. Write it as it must be heard: a loanword the engine misreads in Arabic letters may go to the voice in Latin letters while the screen keeps the Arabic spelling (we did this for a word the engine read as a different English word); a word that the engine confuses with another is rephrased. [ours: S §12, §14]
- How letters like ق ذ ث are pronounced is a brand decision written in `voice.md`; spell them on screen and for the voice to match that decision. [ours: D, L 2026-11-05]
- Translate quoted source sentences faithfully: "designed to prevent" is not "cannot", "most" is not "all". [ours: A qa 2026-11-11]

## 10. Mistakes we actually made, and how to catch each

| Mistake | How it showed | How to catch it |
|---|---|---|
| Fallback font | A page loaded with `setContent` refused `file://` fonts and fell back to a system font with no error. | Load fonts as data or from the local server; check `document.fonts` before capture; compare one letter with `brand/preview.jpg`. [ours: L 2026-11-16, K SKILL] |
| Broken joins | Letters split for animation stood apart (467 px vs 366 px). | Whole-word reveal; compare the animated word's width with the static width. [ours: L 2026-11-09] |
| Clipped lines | An RTL layout ran off the left edge and `scrollWidth` did not show it; a headless browser's minimum width also cut a phone capture. | Measure each element's bounds; check the left edge of every still; keep critical lines inside y 269–1248 (section 6). [ours: L 2026-11-06, L 2026-11-09] |
| Cramped layout | Objects stuck to each other, text in tight boxes; sent back. | The margin numbers in section 6, measured on ink bounds. [ours: L 2026-11-13] |
| Icon on a word | A fixed x put an icon over two words. | Place by measuring the text. [ours: L 2026-11-14] |
| Wrong digits | Latin 1 read as "I" in one font. | Inspect 0/O and 1/I/l at 100%. [ours: L 2026-11-06] |
| Dropped hamza | A title went out without its hamza and had to be redone. | Read every line for ء/أ/ئ/ؤ; search for the common wrong forms. [ours: L 2026-11-11] |
| Invisible characters | Direction marks written into a file as real characters. | Scan files for U+200B–200F, U+202A–202E, U+2066–2069. [ours: L 2026-11-16] |
| Dialect slips | A banned connector in a caption fix. | Search the ban list in voice, screen and caption, including your own edits. [ours: A qa 2026-11-13] |
