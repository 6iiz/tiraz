# Review: judge your own reel before the customer sees it

Read this after `make_reel.py` and `check.json`, before you show anything. Tags: `[ours: …]` (`SOURCES.md`), `[adapted: …]` (`THIRD-PARTY.md`), `[source: …]` (`references.md`), `[judgement]`.

The checker measures what a tool can measure; the rest is your eyes on the frames and your honesty about what you could not check. A clean `check.json` is not approval. [ours: K reel_check]

## 1. Order of work

1. **Hard gates first.** Every problem in `check.json` is fixed and the reel is made again; a number not in `facts.md` is removed or sourced, never waved through. [ours: K SKILL step 6]
2. **Motion gates** (contact sheet, no cut where claimed, no pop, loop seam, no text on text, Arabic intact): see `motion.md` §9. [ours: P17]
3. **Look before you score.** Open `sheet.jpg` (nine moments, first frame included) and the stills at 100%. Watch the file once at full speed and once frame by frame around the hook (0–2 s) and the payoff. Judge the rendered file, not the spec or your intentions: the spec says what you meant, the frames say what you made. [ours: K SKILL; judgement]
4. **Score the rubric** (section 2).
5. **Run the list of past failures** (section 3).
6. **Report** (section 4).

## 2. The rubric

Score each line 0–4. Be strict: a 4 means it would survive the toughest reviewer you know, not "good enough". Most honest first drafts land around 2–3 per line. A line that genuinely cannot apply (for example "proof" in a pure brand sting) is marked n/a with one sentence of reason, and the total is compared against 4 × the lines you scored. [adapted: impeccable (0–4 scale, n/a and renormalising)]

| Line | 0 | 2 | 4 |
|---|---|---|---|
| **Hook** | Empty or logo first frame; topic after 2 s. | Clear but generic; one layer (picture, voice, text) is weak. | Passes `hooks.md` §5 with ≥ 9/10; all three layers agree; payoff second named. |
| **Clarity** | Two ideas, or the viewer cannot say what it was about. | One idea, but a beat is filler or out of order. | One idea; every beat answers the last ("but/therefore"); the script reads as one connected talk. |
| **Proof** | Claims with nothing shown. | Shown, but small, unreadable or generic (a drawn screen where a real one exists). | The claim is visible on screen: the real product, the real step, the counter landing on the true value. |
| **Brand** | Wrong font (fallback), wrong colours, another brand's mark. | Brand assets right, but a second accent colour or a generic look. | Brand font and colours verified against `brand/preview.jpg`; one accent; the customer's logo, handle and the brand's ending scene. |
| **Readability** | Text clipped, under the app's buttons, or unreadable over the background. | Readable, but tight timing, cramped margins or a two-row line with crowded marks. | Critical lines inside Meta's safe zone (y 269–1248), held long enough to read (twice, without voice), contrast ≥ 4.5:1 at every moment, joins closed. |
| **Sound and picture** | Silent stretches by accident; sounds with no visible cause; biggest hit on the hook. | Sounds placed, but too many kinds, or a flat bed, or a hit off its frame. | One sound per visible action, 3–5 kinds, biggest hit on the payoff, quiet before it, phone check passed, voice from frame 1. |
| **Honesty** | Any invented, rounded or unsourced number; a condition hidden; a picture that claims more than the source. | All numbers sourced, but a sentence stronger than its source, or a condition only in the caption when it fit on screen. | Every number and claim traces to `facts.md` with today's date where it lives on the web; conditions shown; the picture claims nothing the source does not. |

**To show the reel:** Honesty is 4; Readability is at least 3; no line is below 2; the total is at least 75% of the possible score. Below that, fix the weakest line first and score again. [judgement; our writers gate their concepts the same way, at 35 of 50 [ours: A content-writer]] A line that cannot be raised by the maker stays as it is: weak because the customer gave no material for it (no picture of the product for Proof, no sounds of their own for Sound), or held down by a question only the customer can answer (whether a price has conditions, for Honesty). Hand the reel over as not ready to publish, with that line named, the score as it is, and exactly what would raise it: the material, or the answer. Do not raise the score instead. [ours: product trial 2026-11-17]

## 3. Failures that slipped through in our own work

Each of these passed a check that looked clean. Run every one.

1. **A still is not proof that something works.** In one audit, 63 of 66 faults passed 66 clean screenshots because the check took pictures and never clicked. For a reel: stills do not show motion faults, sync, pops or sound. Play it; scrub it. [ours: L 2026-11-12]
2. **A render nobody looked at.** A completely black film was once certified clean by another tool's checks. Open the frames, always. [adapted: motionmaxxing slop never-ship 12]
3. **The silent font swap.** A capture fell back to a system font with no error. Compare one letter with `brand/preview.jpg`. [ours: L 2026-11-16]
4. **Colour tags.** Video built from JPG frames came out as full-range BT.601 and shifted colours by two to three steps; two of our reels went out like that. The checker now requires `yuv420p` with bt709/tv tags. [ours: L 2026-11-17, K reel_check]
5. **A promise not paid.** A hook asked "what does this mean for you?" and the answer was "probably nothing"; it saved once and shared zero times. [ours: N reel 17]
6. **A list of facts instead of a talk.** Approved, but corrected for having no connection between lines. [ours: A content-writer 2026-11-15]
7. **Pace judged wrong in both directions.** "Too fast" once, "too slow" later. Ask, then record the customer's preference in `rules.md`. [ours: L reel 13, L 2026-11-16]
8. **The picture as a false claim.** An ending showed a gap closing while the source said it was still open. Read your last frame as a sentence. [ours: A qa 2026-11-12]
9. **A source made stronger in translation.** "Designed to prevent" became "cannot"; "most" became "all". Compare the screen line with the source sentence, not with your notes. [ours: A qa 2026-11-11]
10. **Words that expire.** "Today" on screen is false tomorrow; a live price or stock figure changes within hours. Write full dates; give no counter to a number that moves. [ours: A qa 2026-11-12] This is about statements, not about a customer's way of speaking: their «هلق» or «يلا» stays, but a line that is only true on the day it is posted («طالعين هلق من الفرن») belongs in a story, not in a reel. [judgement]
11. **Recalled instead of read.** Two timestamps written from memory were wrong by 9 and 16 minutes. Read dates, prices and counts from their source at the moment you use them. [ours: L 2026-11-12]
12. **Unequal comparisons.** A one-day-old reel was reported as 96% under an average of year-old reels. Compare results only at the same age. [ours: L 2026-11-12]
13. **Machine hearing.** An automatic transcript heard a word wrong; a person had to listen at that second. List words you could not confirm. [ours: T reel 26]
14. **Cramped and overlapping.** A layout was sent back as "stuck together", an icon sat on two words. Measure margins on ink bounds; place by measurement. [ours: L 2026-11-13, L 2026-11-14]
15. **Invisible damage in files.** Direction marks written as real invisible characters; Windows paths in a script turned into control characters with no error. After writing any file by script, scan it for characters under U+0020 and for U+200B–200F, U+202A–202E, U+2066–2069. [ours: L 2026-11-16, L 2026-11-17]
16. **Funnel numbers mistaken for quality.** Comment counts driven by "type X" are sales-funnel numbers; do not use them to judge a reel. [ours: P after #15, after #21]
17. **Platform "facts" from memory.** Safe zones, loudness targets and "what the algorithm rewards" are often repeated without a source. Use only what `references.md` cites; where it says "not found", say you do not know. [source: references.md "Not found or unverified"]

Two accessibility checks that are not taste: no more than three flashes in any second, and text contrast of at least 4.5:1 (never rounded up). [source: WCAG 2.2]

## 4. Report honestly

Use exactly these verbs, and never stronger ones: [ours: K SKILL, ARCHITECTURE rule 7]
- **rendered:** the file exists.
- **measured:** a tool produced a number (loudness, peak, size, frame rate, cut count, phone check). Quote the number.
- **looked at:** you opened the frames or the sheet. Say which moments.
- **heard:** a person listened. You cannot hear; unless the customer or another person did, write "sound measured, not heard".
- **not verified:** anything else. Say it plainly.

Never write "looks great", "perfect" or "ready" for something you only rendered. Never call a reel ready while `check.json` has problems. [ours: K SKILL "Never"]

Give the customer five lines or fewer: what the reel is; what you verified and how (with the verbs above); what you could not verify; anything they must decide. Example:

> ريل 15 ثانية لعرض [المنتج]، بصوت.
> قستو: الصوت −14.1 LUFS، الذروة −1.6، فحص الجوال فرق 3.4 dB، صفر قص.
> شفت: الشيت التسعة ولقطات الهوك والسعر بالحجم الكامل.
> ما سمعتو: الصوت مقاس بس، محتاج حدا يسمعو.
> قرارك: السعر من صفحة المتجر اليوم [التاريخ]؛ أكّد إنو العرض لسا ساري.

(Write it in the customer's own dialect from `voice.md`; the example is Levantine with placeholder values.)

Every correction the customer gives: apply it, make the reel again, add it to `brand/rules.md` as a dated line in their words with what it changed, and if it is about how their content looks or sounds in general, change the look itself (`look/look.md`, `tokens.json`, the part) or `brand.json`, so the next reel starts right. [ours: K SKILL step 7]
