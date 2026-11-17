# Captions: the spoken words on screen

For reels with a voice, or reels where the captions *are* the voice. Read `arabic-text.md` first; this guide adds what is specific to captions. Tags: `[ours: …]` (`SOURCES.md`), `[adapted: …]` (`THIRD-PARTY.md`), `[source: …]` (`references.md`), `[judgement]`. Where an adapted rule disagrees with a lesson we tested, ours wins.

Two text layers exist in a voiced reel, and they are different things:
- **The line** (the hook and the key statements): short, written to sharpen what is said, placed by you (`hooks.md`, `structure.md`).
- **The captions**: the spoken words, verbatim, built from the word timings that `voice/vo.py` writes (`<stem>.words.json`, start and end of every word). [ours: K voice/vo.py]

Never let the two say different things at the same moment, and never let them overlap in space. [judgement]

## 1. When to caption

- **A voiced explainer meant to be understood muted: caption it.** Word-by-word captions with the current word lit were the common form across our strongest explainer references, and in one long reference the captions carried the whole story with no voice at all. [ours: P20; N batch 6, batch 7]
- **A picture-led reel with a few spoken lines: caption only the fragments that matter**, or none, and let the lines carry the hook. A motion-design guide treats "every spoken word on screen" as a default to avoid in launch films. [adapted: motionmaxxing sound-sync] Our rule for explainers above stands; for a film where the picture *is* the explanation, follow this one. [judgement]
- **No voice at all:** the captions become the narration; then pace them as reading text (section 4), not as speech. [ours: P20]
- Burn captions into the video. Platform auto-captions are off by default for most viewers and cannot be styled. [adapted: viral-captions-and-ctas (Vyral)]
- The platforms agree: Meta recommends captions on Reels ads, TikTok tells advertisers to use captions for clarity, and WCAG requires captions for prerecorded audio in synchronised media (Level A). [source: Meta Ads Guide; TikTok Video Advertising Guide; WCAG 2.2 1.2.2] No confirmed figure exists for how much viewing is muted; do not quote one. [source: references.md]

## 2. Verbatim, in the same dialect

- Captions show what is said, word for word, in the dialect of `voice.md`. Do not "correct" spoken dialect into standard Arabic on screen; do fix spelling (hamza, banned forms) the same way as every other line. [ours: D; A qa 2026-11-12] Netflix's Arabic subtitle guide uses standard Arabic with no dialect, but that is for translated subtitles; ours transcribe the brand's own voice, so `voice.md` wins. [source: Netflix Arabic Timed Text Style Guide (a secondary summary, for the dialect point)]
- A number from `facts.md` is written in digits in the captions, even where subtitle style would spell small numbers as words, so the number gate and the reader both see it. [judgement; Netflix's style spells 1–10 as words: source: Netflix Arabic guide]
- Punctuation: an ellipsis is the single character «…», no space before «،» «؟» «!», never «؟!» together, no italics. [source: Netflix Arabic Timed Text Style Guide]
- Automatic transcripts mishear. One of ours heard a word without its ق; the word had to be checked by a person listening at that second. Build captions from the script text aligned to the word timings, not from a transcript, and list any word you could not confirm. [ours: T reel 26]
- If the script and the timing file disagree on a word, the spoken audio is the authority: change the caption, not the audio. [adapted: motionmaxxing sound-sync]

## 3. Grouping

- **A group is one short phrase: 2–5 words, one row if it fits, never more than two.** Strong references changed caption phrase about every 2.2 s. [ours: N batch 7] At 150–170 wpm that is roughly 4–6 words per group at most; most groups will be shorter. [judgement, from L 2026-11-16 rate]
- **Hard limits from subtitle practice:** at most 42 characters per row and 2 rows, ideally one; reading speed at most 20 characters per second; each event on screen at least about 0.83 s and at most 7 s; at least 2 frames between events. [source: Netflix Arabic Timed Text Style Guide; Netflix Timed Text General Requirements and Timing pages] At reel caption sizes the safe zone's 940 px width usually fits fewer than 42 Arabic characters, so the width, not the 42, is the real limit: check the still. [judgement]
- **Break at the voice's pauses first** (the 0.4 s sentence pause and 0.2 s comma pause of the narration pipeline are natural break points). [ours: D pauses] Otherwise break after punctuation, or before a conjunction or a preposition. [source: Netflix General Requirements]
- **Never break inside these units:** a noun and its article or adjective; the parts of a name; a verb and its auxiliary or its negation («ما بيشتغل», «مش هيفتح»). [source: Netflix General Requirements] Also keep a number with its unit or noun («165 ريال», «3 أيام») and a preposition-led phrase that means nothing alone («على الشاشة»). [judgement]
- **Do not end a group on a dangling connector** («و», «بس», «إنو», «لأنو», «يعني»): move it to the next group, so each group reads as a thought. [judgement]
- Whole words only; `kit.fit` never splits an Arabic word and captions must not either. [ours: K kit.js, L 2026-11-09]
- The first caption group does not repeat the on-screen hook line; captions pick up where the line leaves off. [adapted: viral-captions-and-ctas (Vyral)]

## 4. Timing

| Thing | Number | Reason |
|---|---|---|
| Word appears | 0–0.07 s before it is spoken (0–4 frames at 60 fps); up to 0.16 s for a word that must be complete when heard (a name) | Text that lands after the voice reads as late. [adapted: motionmaxxing sound-sync §5] |
| Group appears | with its first word | [judgement] |
| Group leaves | at the start of the next group, or 0.2–0.3 s after its last word in a pause | No empty gap between groups during speech. [judgement] |
| Emphasis word | a slightly longer gap before it | The gap before the word is the emphasis. [adapted: motionmaxxing sound-sync §5] |
| No-voice captions | hold ≥ characters ÷ 20 seconds (the subtitle reading-speed ceiling), and in practice about twice that, never under 1.2 s | [source: Netflix Arabic guide (20 cps)]; [ours: K SKILL "read twice"]; the doubling is [judgement] |
| Voiced captions | the voice sets the pace; if a group would exceed 20 characters per second at the speaking rate, split it | [source: Netflix Arabic guide]; [judgement] |
| Last group | stays until 1.0 s after the last word, then the ending scene | [ours: L 2026-11-16] |

If timings are estimated (no real voice yet), lead text slightly more (2–3 frames at 30 fps, i.e. about 0.07–0.1 s), cut groups on phrase boundaries, and put no frame-exact hit on a word whose time you have not measured. [adapted: motionmaxxing sound-sync §9]

## 5. Style

- **Current word lit, the rest of the group dimmed to about 40% opacity** is the behaviour that read best in our tests. [ours: P20] How the lit word is shown (a colour, a weight, a shape behind it) is a decision of the brand's look, not of the kit.
- **The one accent word of the sentence** takes the brand accent colour when it is spoken; every other word uses the text colour. Never two accent colours in one group. [ours: P20, K SKILL]
- **Warning colour only for the warning word.** [ours: P20, G]
- Weight 600–700 for captions; thin weights vanish on a phone. [adapted: viral-captions-and-ctas (Vyral); adapted: designing-arabic-frontends (400–700 for Arabic)]
- Size: at least 4% of frame width (≈ 43 px); 48–60 px is a comfortable caption size under a 72 px main line. [ours: P23 (4% floor); judgement (48–60)]
- Contrast: aim for 4.5:1 against everything passing behind the group. When the background is busy, the brand's look decides how (its own backing shape, a calmer ground behind the text, a blur under it), designed for that brand; see `arabic-text.md` §7 and `look.md`. [ours: G]
- No letter-spacing, no italic, no per-word bounce on every word. [adapted: designing-arabic-frontends; ours: P brief banned "blur-in on everything"]
- Words arrive by a short change in opacity and colour in place; they do not fly in. Each word moving would make the line unreadable and, for Arabic, risks the joins. [ours: L 2026-11-09; judgement]
- Emoji are not caption content. [adapted: viral-hooks (Vyral)]

## 6. Position

- Captions live in one fixed band for the whole reel, so the eye learns where to look. [judgement]
- Inside Meta's published Reels safe zone, **x 65–1015, y 269–1248** on a 1080×1920 frame (top 14%, bottom 35%, 6% each side kept clear); the kit's `SAFE` is x 70–1010, y 270–1248. Never over the brand's mark, if its look has one. A good caption band is the lower part of the safe zone, about y 1000–1240. [source: Meta Ads Guide, Instagram Reels; ours: K safe.js; judgement for the mark and the band]
- A common layout: the main line in the upper-middle, captions lower-middle; never both in the same band. Leave at least 64 px between them. [adapted: viral-captions-and-ctas (headline + body pattern); ours: L 2026-11-13 (64 px)]
- Captions never cover the subject or a label; move the captions, not the subject. [ours: K SKILL step 5]

## 7. Check before render

- Every caption group appears in the stills sheet at least once; look at three of them at 100%: joins closed, current-word highlight on the right word, no clipped marks. [ours: K SKILL step 5]
- Scrub to five random word onsets and confirm the lit word is the word being said. [adapted: motionmaxxing sound-sync §8 ("scrub at each word-onset frame")]
- Search the caption text for `voice.md`'s banned words and for numbers that are not in `facts.md` (the checker refuses a number that is not in `facts.md` on screen, in the narration or in the caption, but it does not search for banned words). [ours: K reel_check]
- Report captions as "aligned to measured word timings" or "aligned to estimated timings", never just "synced". [ours: K SKILL "report only what you checked"]
