# Third-party material in the guides

The guides in this folder are original text written for Tiraz. Some rules were **adapted** (reworded, restructured, merged, translated into our context) from permissively licensed guides. Each adapted rule is marked `[adapted: <source>]` in the guide. This file records, for each source, who made it, its licence, and which sections drew on it.

Licences were confirmed on 2026-11-17 from a `LICENSE` file in each source, or from the `license:` line in its `SKILL.md`. No text was taken from any source without a confirmed licence.

## MIT-licensed sources

| Source | Copyright | Used in |
|---|---|---|
| instagram-agent-skill · github.com/Jakeschincariol/instagram-agent-skill | (c) 2026 Jake Schincariol | hooks.md §2 (write the on-screen line separately from the spoken line) |
| viral-hooks-skill · github.com/rediumvex/viral-hooks-skill | (c) 2026 Roman Knox | hooks.md §7 (the list of hook families; mixing a scroll-stopping and a holding family) |
| content-skills (viral-hooks) · github.com/artemnovitckii/content-skills | (c) 2026 Artem Novitckii | hooks.md §3.3 (stated and implied contrast), §3.6 (you/your framing), §4 (the four ways a hook fails) |
| viral-hooks (skill by Vyral) | (c) 2026 Vyral | hooks.md §2 (three aligned layers, text sharpens the voice, two cover tests, sound as the fourth layer), §4 (fast upgrades), §9 (no imperative opener); captions.md §5 (no emoji as content) |
| viral-short-form (skill by Vyral) | (c) 2026 Vyral | structure.md §1 ("but/therefore", three failures of a draft, complementary picture and voice), §2 (second-strongest moment early) |
| viral-captions-and-ctas (skill by Vyral) | (c) 2026 Vyral | structure.md §4 (one ask, ask matched to content, name the moment or person, content not act, no follow/like ask, layered ask); arabic-text.md §6 (stricter interface figures for the hook line); captions.md §1, §3, §5, §6 (burn in, headline + body pattern, first caption does not repeat the headline, weight, position) |
| jury (skill) · github.com/juliobsz/skills | (c) 2026 Julio (juliobsz) | web.md §12 and the site skill, step 4 (a reader who sees only the pictures and the measurements names the page's idea and lists what is weak) |
| designing-arabic-frontends (skill by Ahmed Badawood) | (c) 2026 Ahmed Badawood | arabic-text.md §1 (no tracking, no italics), §2 (LTR tokens inside Arabic), §3 (digit systems by region, one system per view, currency after the amount, counted nouns 3–10), §4 (line height about 1.6), §5 (weights 400–700); captions.md §5; scenes.md §3 (no letter-spacing on Arabic, words placed one by one); web.md §5 (left-to-right islands inside Arabic, a phone number as one island, one digit system, currency after the amount, line height, no letter-spacing or italics, weights, mirroring icons by meaning) |

The MIT permission notice (identical for every MIT source above, each under its own copyright line):

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Apache-2.0-licensed sources

Apache-2.0 requires a copy of the licence with the distribution (`licenses/Apache-2.0.txt` at the root of this repository), a notice that the text was changed, and the attribution notices of the source. **The text in our guides was changed:** every adapted rule was reworded, condensed, converted to our frame rate (60 fps) and frame size (1080×1920), and in places overruled by our own lessons. No file from these sources is copied whole.

| Source | Author | Used in |
|---|---|---|
| motionmaxxing · github.com/Tejashmakwana/motionmaxxing | Tejas Makwana | motion.md §2 (eases by role, durations, overshoot, arrive by moving, exits), §3 (one hero per frame, one grammar, staggers, words on speech), §4 (no dead frame, designed breath, payoff hold), §5 (transition types, start before the line ends), §7 (counters), §8 (cheap tells); sound.md §1–§8 (kinds as a system, 1–3 big hits, gains per event, peak on the event, duck under speech and reading, clear before the payoff, no tick per letter, no swell over a real result, no silent tail); captions.md §1, §2, §4, §7 (caption timing lead, voice as authority, estimated timings, scrub at word onsets); arabic-text.md §5 (voiced hold time); structure.md §2 (beats shorten then linger, ending ≤ 25%); review.md §3 item 2; look.md §1 (the brand inventory, what to keep literal and what to invent), §2 (the first idea put aside, directions that differ in kind, the cover-the-logo and competitor-swap tests, a look chosen and not averaged), §3 (the ground, colour meanings, shapes from the logo, the ending as one beat that arrives by cause), §6 (the reaches to notice and the second default), §7 (the questions before showing) |
| impeccable (skill; `license: Apache 2.0` in its SKILL.md) | the impeccable project | review.md §2 (score each line 0–4, strict meaning of 4, n/a lines and renormalising the total); web.md §1 (a working action, clear within seconds), §2 (no invented claims or proof), §3 (an established world stays fixed, the look carries the page, the skeleton test), §4 (what the first screen shows, the memory test, a crop per screen), §5 (only the weights in use, no font service), §6 (squint test, proximity and rhythm, measure and type roles, `text-wrap`, spending the accent, secondary text on colour, the surfaces nobody draws, the table of defaults), §7 (hover, focus and active states, 44 px targets, narrow and wide screens, safe areas, long and short content), §8 (what motion is for on a page, durations, visible by default, transform and opacity, stopping loops), §9 (keyboard order, the focus indicator) |

Attribution notice for motionmaxxing:

> motionmaxxing: looksmaxxing for motion graphics. Made by Tejas Makwana (github.com/Tejashmakwana/motionmaxxing). Licensed under the Apache License, Version 2.0.

The third-party components that motionmaxxing itself bundles (GSAP, three.js, opentype.js, the Inter font, showcase brand images) were **not** used in any form.

## Public references

Facts taken from official platform documentation and standards are marked `[source: …]` in the guides and listed with their URLs and reading dates in `references.md`. They are stated in our own words; any quotation is twenty words or fewer.
