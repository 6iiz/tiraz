# Structure: beats, pacing, endings

Read this after you have the hook and before you write `spec.json`. Tags: `[ours: …]` = recorded lesson or measurement (keys in `SOURCES.md`); `[adapted: …]` = rule from a permissively licensed guide (`THIRD-PARTY.md`); `[source: …]` = public reference (`references.md`); `[judgement]` = reasoning without a recorded test. Where an adapted rule disagrees with a lesson we tested, ours wins.

## 1. Before the beat map

- **One reel, one idea.** If the script carries two ideas, it is two reels; say so to the customer. [judgement; also P8 "what changes nothing goes"]
- **Agree first.** Show the customer the idea, the form, the exact on-screen lines, every fact with its source, and four stills (hook, the main moment, proof, ending) before the full render. Asking first is what saves rounds of "too fast / too generic". [ours: P11, K SKILL step 1]
- **Write the script as one spoken paragraph first, then cut it into beats.** Every line must answer the one before it ("how?", "so", "and here", "that is why"). If a line could be moved elsewhere without anyone noticing, it is not connected. A reel built as a list of facts was approved but corrected for exactly this. [ours: A content-writer 2026-11-15] The same test from writing practice: beats are joined by "but" or "therefore", never by "and then"; a beat joined by "and then" is usually not earning its place. [adapted: viral-short-form (Vyral)]
- **Diagnose a draft against three failures:** a weak hook (gone by the first second), no escalation (it opens well and then flatlines: each beat must add tension, specificity or progress), a buried payoff (the good part comes after most viewers have left: move a taste of it earlier). [adapted: viral-short-form (Vyral)]
- **Picture and voice may tell two complementary things** (the voice explains, the picture shows the consequence); never two contradictory ones. [adapted: viral-short-form (Vyral)]

## 2. Pacing numbers

| Thing | Number | Reason |
|---|---|---|
| Voice start | 0.0–0.3 s | Openings with a delay were called slow; voice from the first frame was approved. [ours: L 2026-11-16] |
| Speaking rate | 150–170 words per minute | Earlier reels at 100–130 wpm were judged slow; the faster cuts were approved. One approved 39 s reel ran at 159 wpm. [ours: L 2026-11-16, T reel 26] |
| Pauses inside narration | 0.4 s after a sentence, 0.3 s after a caption line, 0.2 s after a comma, ≤ 0.1 s between words | Recorded defaults of the narration pipeline. [ours: D pauses] |
| After the last word | 1.0 s, then the ending scene | [ours: L 2026-11-16] |
| Ending scene | the brand's own closing scene, at the length its designer gave it; part of the reel's length | It belongs to the brand's look (`look.md`). [ours: K ARCHITECTURE] Leave the ask finished at least 1 s before it starts, unless the brand's ending carries the ask itself: then the ask is the ending. [judgement] |
| One idea per beat | about 2 s per beat on screen | Calm pace rule of the brief; one visible change per sentence. [ours: P brief, N "what repeats" 2] |
| No motionless hold | nothing static longer than 1 s | A frame where nothing changes reads as a stall. [ours: P8] |
| Items in a list | a steady rhythm, about 2.2–2.6 s per item or phrase | Two strong references kept a fixed rhythm. [ours: N batch 6 (2.6 s per item), N batch 7 (~2.2 s per phrase)] |
| Biggest moment | on the payoff, after the proof, never on the hook | Measured in references: the loudest hit sat on the reveal. [ours: P13] Put the second-strongest moment near the top, to survive the early drop. [adapted: viral-short-form (Vyral)] |
| Beat lengths | shorten through the middle, let the last beat linger | Equal-length beats read as a template. [adapted: motionmaxxing slop Tm1] |
| CTA share | the ending (ask) ≤ 25% of the film | A long close drags; cut the hold, not a proof beat. [adapted: motionmaxxing gate G3] |
| Silence | one quiet bar or 0.4–1.0 s of near-stillness right before the payoff | Silence pulls harder than any motion. [ours: P5, N batch 6 (4 s of silence after 9 s of sound), O (400 ms of absolute stillness)] |

**Word budget** (voice from 0.2 s to 1.0 s before the ending scene starts, at 150–170 wpm):

| Length before the ending scene | Words |
|---|---|
| 12 s | 27–31 |
| 15 s | 35–39 |
| 20 s | 47–53 |
| 25 s | 60–67 |
| 32 s | 77–87 |
| 40 s | 97–110 |

Formula: words ≈ (length − 1.2) × wpm ÷ 60. If the script is longer, cut lines; do not speed the voice past 170. [judgement, from the numbers above]

**When the customer says "too fast" or "too slow".** Both have happened to us: one early reel was "too fast" and was slowed; later the owner asked for the information "on the fly" and approved 1.10–1.15× speed-ups made with ffmpeg (setpts + atempo). [ours: L reel 13, L 2026-11-16] The two are reconciled like this: the **voice** may be quick, the **picture** must stay calm (one idea per beat, no flicker, text held long enough to read). Record the customer's own preference in `rules.md`; it beats these defaults. [judgement]

## 3. Beat maps by goal

Times are seconds of the reel before the brand's ending scene. Each beat has one visible action and, if it has a sound, one sound (see `sound.md`). [judgement]

### 3.1 Sell a product

12–20 s (example 16 s):

| s | Beat |
|---|---|
| 0–1.5 | Hook: the real product (or its result) on frame 0, a number or promise line. |
| 1.5–4 | Who it is for, or the situation it fixes. One line. |
| 4–9.5 | What you get: 2–3 features, one per ~2 s, each shown, not listed. |
| 9.5–10 | Quiet half-beat. |
| 10–13 | Price, as written on the store page today (biggest hit), and its condition line (duration, limit, "from"). Hold ≥ 2 s. |
| 13–16 | One ask (see section 4). |

25–40 s (example 32 s):

| s | Beat |
|---|---|
| 0–1.5 | Hook. |
| 1.5–5 | The situation or pain, with one fixed example. |
| 5–9 | The real product appears. |
| 9–19 | Three features, ~3 s each, each shown working on the same example. |
| 19–20 | Quiet beat. |
| 20–24 | Price reveal (biggest hit) + what is included. |
| 24–28 | Conditions on screen; one trust fact from `facts.md` (an official count, a real review total). |
| 28–32 | One ask. |

### 3.2 Explain an idea

12–20 s (example 15 s): 0–1.5 hook (task or question) · 1.5–4 the problem · 4–4.5 quiet · 4.5–7 the one idea, the "aha" (biggest hit) · 7–12 two proof steps on one fixed example · 12–15 the rule in one sentence, or a step to do now.

25–40 s (example 32 s): 0–1.5 hook · 1.5–6 the problem, with one example that stays for the whole reel · 6–7 quiet · 7–10 the aha (biggest hit) · 10–22 three proof steps, ~4 s each, the same example, **one variable changed each time** · 22–26 the rule in one sentence · 26–29 what to do now · 29–32 ending.

Why one fixed example: the viewer learns the comparison, not new names. [ours: P14] This is the shape of the brief's beat map (hook, problem, aha, proof, quiet, ending). [ours: P brief]

### 3.3 Prove or demo

Result first, then how, then the result again. [ours: N "result first" mechanism, N batch 6 "every frame grows out of the last"]

12–20 s (example 15 s): 0–2 the finished result, moving · 2–4 the claim in one small line (what made it, how long) · 4–11 three steps of the "how", ~2.3 s each · 11–13 back to the result (biggest hit) · 13–15 ending; last frame close to the first, so a replay is seamless.

25–40 s (example 32 s): 0–3 result · 3–6 the claim plus a live counter that proves it (steps, seconds, cuts) · 6–24 five or six steps, ~3 s each · 24–28 all together, the result returns (biggest hit) · 28–32 ending, last frame ≈ first frame.

A claim like "no cuts" or "made in N steps" is a promise: check it (see `motion.md` gates) before saying it. [ours: P15]

### 3.4 A list

12–20 s (example 15 s): 0–1.5 hook with the count as a small marker, not a big title · 1.5–13 three items, ~3.8 s each: the name, its proof within 1.2 s of being named, one line on when to use it · 13–15 all items shown together as a summary card, save ask.

25–40 s (example 32 s): 0–2 hook (count + why it matters) · 2–28 five items, ~5 s each, at a steady rhythm, same template for every item · 28–32 summary card + save ask.

- Show the list as the progress bar: all item names small at the top for the whole reel, the current one lit, the rest dimmed; at the end all light together. The viewer always knows where they are without "STEP 2". [ours: N batch 5, N idea bank]
- Same layout for every item, only the content changes. [ours: P19]
- Useful lists are saved more than liked: four TikTok references had 0.78–1.27 saves per like, with no comment bait. TikTok only; not yet measured on our reels. [ours: P22]

### 3.5 A story

12–20 s (example 15 s): 0–2 in the middle of the trouble · 2–6 the turn ("and then…") · 6–7 quiet · 7–11 the solution happens on screen (biggest hit) · 11–15 what changed, and one strong closing line.

25–40 s, two shapes:
- **Pain → what if → solution** (example 32 s): 0–2 hook in the pain · 2–8 the pain grows, one concrete scene · 8–12 "what if…" · 12–13 quiet · 13–22 the solution, step by step (biggest hit at its first success) · 22–28 the result in the viewer's life · 28–32 ending. [ours: N idea bank "pain, what if, solution"]
- **The viewer is the experiment** (example 32 s): 0–3 a task · 3–8 the viewer fails, told it is normal · 8–12 the key, shown once · 12–17 the same task again, now they succeed (biggest hit) · 17–27 why it works, few pictures · 27–32 "you can't go back" and return to the first frame. Proportions scaled from the strongest reference in our library. [ours: N batch 5]

## 4. Endings and calls to action

- **Exactly one ask.** Every extra ask lowers the odds of any of them; if there are two real asks, lead with the one that fits the content and let the other ride as an aside. [adapted: viral-captions-and-ctas (Vyral)]
- **Match the ask to the content:** a how-to or a list asks for a save; a story, a warning or a recommendation asks for a send; a real debate asks for a stance in the comments; a demo asks for a save or a send. [adapted: viral-captions-and-ctas (Vyral)] Our fact sheet found no primary platform statement of how much each action (save, send, comment) counts for reach, so never tell the customer that one action "is weighted most". [source: references.md §2]
- **Name the moment or the person:** "save it for the next time you…" beats "save for later"; "send it to the one who still…" beats "share". [adapted: viral-captions-and-ctas (Vyral)]
- **Ask for the content of a comment, not the act:** «شو كنت رح تعمل؟» asks for content; «اكتب نعم» asks for the act and is bait. [adapted: viral-captions-and-ctas (Vyral)]
- **Avoid "follow / like / double-tap"** as the closing ask; it spends the last seconds on a low-value action and reads as bait. [adapted: viral-captions-and-ctas (Vyral)]
- **Layer it when the reel is long (25 s+):** a light, implicit hint around 70% of the length, then the explicit ask at the end. [adapted: viral-captions-and-ctas (Vyral)]
- **Vary the ending across reels:** a step to do now, thanks, a comment invitation, a send-to-someone, a save, or one strong line. Do not end every reel on a question. [ours: G "endings vary"; A qa (endings counted by kind, not wording)]
- **A comment invitation needs something real behind it** (the link, the file, a code). "Type a word" with nothing visible behind it did not lift comments. [ours: P after #21] Comment numbers from bait are sales-funnel numbers, not quality. [ours: P after #15]
- **Send-to-someone works when you name who** («ابعتو لأهلك»-type: the person who needs the warning). [ours: N batch 6]
- **Save** is the ask for lists, maps and references (section 3.4). [ours: P22]
- **A question works only if everyone has an answer** ("from which try did you see it?"). [ours: N batch 5]
- **Loop ending:** the last frame returns to the first, so a replay feels intended. [ours: N batch 5, N batch 6]
- The ask finishes at least 1 s before the ending scene starts. A brand whose ending is the ask (its closing words are the call to action) has no separate ask: do not say it twice. [judgement]
- An ending already used in the customer's last reel is not used again. [ours: A qa 2026-11-06]

## 5. Rules of an honest sales reel

These rules hold even when the customer asks otherwise; explain why and offer the honest version.

1. **A real product, sold now.** The reel is tied to one product the store actually sells. [ours: S §4]
2. **The price is read from its source that day** and written exactly as there (amount, currency, "from"). Update the row in `facts.md` with today's date first. [ours: K SKILL; S §4]
3. **Conditions are shown:** duration, limits, region, delivery time, expiry, "starts from". On screen, or in the caption when they do not fit. Never dropped to make a line cleaner. [ours: K SKILL]
4. **Only official numbers:** counts of orders, customers, reviews come from the store and live in `facts.md`. No "thousands of happy customers" without a number and a source. [ours: S §4; N batch 6 (unsourced counts we refused)]
5. **"Best", "cheapest", "only"** need a source in `facts.md`; otherwise drop the word. [ours: P19]
6. **No other company's logo or interface** in a way that suggests a partnership the store does not have; draw a generic interface in the brand's own style. [ours: S §4, §14; K SKILL "Never"]
7. **No national flags, religious text or symbols** in a commercial reel. A flag was left out of a national-ranking reel for this reason. [ours: S §13]
8. **Names exactly as the store writes them** (offer names, product names). A wrong singular/plural in an offer name was sent back. [ours: L 2026-11-14]
9. **A time-limited offer** carries its end date in the caption, and the reel must be delivered before it. [ours: S §15]
10. **A generic 3D product is not the real model:** say so if it could be read as the real one. [judgement]
11. **No customer data on screen,** ever: names, numbers, order ids, addresses. [ours: P brief banned list]
12. **A source that sells the fix** is disclosed in the caption. [ours: A content-writer 2026-11-12]
13. **Say that an ad is an ad where the law asks for it.** Saudi Arabia's Ministry of Commerce states that electronic commercial ads must clearly show they contain promotional material, that a brand may not promote a brand it has no right to use, and it has fined social-media advertisers for misleading or undisclosed ads. [source: Saudi Ministry of Commerce release, 2022] Ask the customer how they mark ads (a caption line, a platform label) and keep it every time. This is not legal advice; for other countries, ask the customer what applies.

Length context for a sales reel: TikTok recommends 21–34 s for most in-feed ads (up to 60 s allowed). [source: TikTok Video Advertising Guide] Both beat maps above are timed before the brand's ending scene; add its length before comparing them with that range.
