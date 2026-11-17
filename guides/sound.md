# Sound for a reel

Read this before you write the `sfx` and `bed` fields of `spec.json`. Tags: `[ours: …]` (`SOURCES.md`), `[adapted: …]` (`THIRD-PARTY.md`), `[source: …]` (`references.md`), `[judgement]`. Where an adapted rule disagrees with a lesson we tested, ours wins, and the text says so.

You cannot hear. Everything you do with sound is placed by rule and checked by measurement; say so in your report (section 9).

## 1. The core rules

1. **One sound for each visible action, and none for nothing.** A sound with no visible cause is wallpaper; an action with no sound feels weightless. [ours: K SKILL, P18; adapted: motionmaxxing sound-sync §6a]
2. **Few kinds, reused as a system:** choose 3–5 kinds for the reel (for example click, swish, impact, tick) and reuse them. Fifteen different sounds sound like a library demo. [adapted: motionmaxxing sound-sync §7]
3. **Only 1–3 big hits in the whole reel,** on the moments that matter, and **the biggest on the payoff, not on the hook.** In measured references the loudest hit sat on the reveal and the other sounds were 10–20 dB lighter, within about ±0.2 s of their visual events. [ours: P13] The motion guide we adapted calls a hit on every cut a failure; we agree for *big* hits, but our own measurement of a reference we were asked to match found a sound on 8 of 12 scene changes (within ±0.15 s), so small sounds on transitions stay. [ours: N ElevenLabs reference; adapted: motionmaxxing sound-sync §6a]
4. **Density:** about 1.5–2 sound events per second on average, spread out, not in bursts. The reference we measured had 2.1 per second with a median gap of 0.32 s; our first reel had 0.86 per second and felt thin. [ours: N ElevenLabs reference, P18] Those were fast explainers. Density follows the pace of the picture: a calm brand whose frames hold has fewer events, and it is still wrong for something to happen on screen in silence. [judgement]
5. **Texture, not tones:** use the real samples of the sound packs. Our early synthetic sounds (pure sine and thin clicks) measured a spectral flatness of 0.001 against 0.036 for the reference and read as "plastic". [ours: P18]

## 2. Which kind for which event

The kinds are a closed list in `sound/kinds.json`; ask by kind in the spec: `{ "kind": "pop", "t": 2.5, "gain": -9 }`. `python sound/pick.py --kind <k> [--tag …] [--variant n]` shows which file is chosen; the same arguments always choose the same file. [ours: K ARCHITECTURE sound contract]

| Visible event | Kind | Gain (dB, relative; voice is the loudest layer) |
|---|---|---|
| A word or card lands, a choice is confirmed | `click` | −6 to −10 |
| Items of a list or a counter step | `tick` (on every 3rd–4th value of a fast counter) | −16 to −20 |
| An element or emoji appears | `pop` (tags low/mid/high) | −12 to −16 |
| Before/after, on/off, yes/no | `toggle` | −12 to −16 |
| Text typed in a field or terminal | `type`, as a quiet texture across the span or one per word; never one per letter | −16 to −22 |
| A card slides, a small wipe | `swish` (under 0.3 s) | −10 to −14 |
| A scene change, a big element flies in | `whoosh` (peak meets the peak of the motion) | −10 to −14 |
| Tension towards a reveal | `riser` or `swell` (ends exactly on the reveal) | under the voice |
| A price drops, a number falls, mood turns down | `drop` | −8 to −12 |
| The reveal, the payoff, the big number | `impact` (has a mid-range thump for phones) | the loudest sound effect, still under the voice peak |
| A soft landing under a pop, a punch on a cut | `thump` | −8 to −12 |
| Something clean or precious appears | `shimmer` / `sparkle` | −14 to −18 |
| Problem solved, a check turns green | `success` | −10 to −14 |
| Something fails or is blocked | `error` | −10 to −14 |
| A notification arrives | `notify` | −10 to −14 |
| A price or a value is revealed | `ding` | −10 to −14 |
| A hack, a broken frame | `glitch` (short) | −12 to −16 |
| A page turn, cloth, soft movement | `rustle` | −14 to −18 |
| A sudden stop of the story | `scratch` | −10 to −14 |

Kinds and their meanings: [ours: K sound/kinds.json]. Gains: [adapted: motionmaxxing sound-sync §7, mapped to our kinds]; they are starting points, check them with the measurements in section 8.

## 3. Placing a sound exactly

- `t` is the moment of the visible event; the packs trim leading silence so `t` is the hit. Put the transient on the event's frame. [ours: K ARCHITECTURE]
- A sound with a slow attack (a `whoosh`, a `swell`) is placed so its **peak** meets the event: start = event time − time to peak. A `riser` of 2 s that should peak on a reveal at 7.0 s starts at 5.0 s. [adapted: motionmaxxing sound-sync §7; judgement]
- **If you trim a sample, subtract the trim from its anchor.** We once forgot, and a reversed cymbal landed two seconds early. [ours: L 2026-11-15]
- A motion that is meant to hit a beat should be at its **fastest** on the beat, not ending on it: an ease-out word starts about 0.06 s before the beat; an in-out move is centred on it. Measured on our own renders: "end on the beat" was 244 ms late, "peak on the beat" 2 ms. [ours: A edit-lab 2026-11-13]
- When the voice and the picture disagree, the voice is the authority: move the picture, never retime the voice. [adapted: motionmaxxing sound-sync §5]

## 4. The phone-speaker lesson

A mix can hit the loudness target and still sound empty on a phone. One of our launch mixes measured −14.3 LUFS overall, but 84% of its energy was below 120 Hz, and above 250 Hz it was only −21.7 LUFS: on a phone speaker it sounded weak and hollow. [ours: L 2026-11-15]
- The fix: pair every low hit with a mid-range thump (a sweep from about 230 Hz down to 78 Hz) plus a snap and a click; give the bass harmonics (soft saturation, then a high-pass at 170 Hz). The gap between the full mix and the mix above 250 Hz fell from 7.4 dB to 3.3 dB. [ours: L 2026-11-15]
- The kit's `impact` kind already carries a mid-range thump for this reason. [ours: K sound/kinds.json]
- **Check every mix:** `python sound/phone_check.py <wav or mp4>` reports loudness after a 250 Hz high-pass and the share of energy above 250 Hz. A large gap between the full loudness and the high-passed loudness means the reel lives below the phone's range. Aim for a gap near 3 dB, as in the fixed mix; above about 6 dB, fix it. [ours: K ARCHITECTURE; threshold judgement from the 7.4 → 3.3 dB lesson]

## 5. Loudness and levels

- **Integrated loudness −14 LUFS (±1), true peak under −1 dB.** The kit mixes to this and the checker fails a reel outside it. [ours: K reel_check, SKILL]
- Where the numbers come from: −14 LUFS is common practice for social video; **no platform page we could reach states a loudness target** (Meta, TikTok and YouTube included; YouTube only says its "Stable Volume" balances levels inside a video). The −1 dBTP ceiling matches the broadcast standard EBU R 128, whose own programme target is −23 LUFS for television, not for phones. [source: references.md §3; EBU R 128; YouTube Help (Stable Volume)] So do not tell a customer a platform "requires −14".
- Meta's Reels ad spec asks for stereo AAC at 128 kbps or more; the kit's AAC output must stay at or above that. [source: Meta Ads Guide, Instagram Reels]
- **The voice is the loudest sustained layer.** No sound effect is louder than the voice peak except the one strongest hit. [adapted: motionmaxxing sound-sync §8]
- The whole reel has sound to its last frame: no silent tail, no digital silence before the ending scene. [adapted: motionmaxxing sound-sync §6a, §8]

## 6. The bed

- `"bed"` in the spec is a quiet continuous layer, given as a gain in dB (for example −26), or `null`. Written as an object it can also step aside at chosen moments: `"bed": { "gain": -26, "dips": [ { "t": 5.2, "for": 1.5, "by": -8 } ] }` lowers it by 8 dB from second 5.2 of the reel for 1.5 s (down in 80 ms, back in 300 ms). That is how the two rules below about reading and about the payoff are carried out. [ours: K assemble.py]
- **A bed that is alive, not one flat loop:** in the reference we measured, the bed never fell silent (only 4% of the time more than 30 dB under the median) and its upper bands moved a lot (37–42 dB between quiet and busy moments) while ours stayed flat. Layers should enter and leave with the state of the story. [ours: N ElevenLabs reference, P18]
- **Duck it under speech** by about 9 dB (fast in, about 80 ms; slower out, about 300 ms), and back up in gaps longer than about 0.4 s. [adapted: motionmaxxing sound-sync §8]
- **Pull it down 6–10 dB while the viewer must read** a claim, a number or a price. [adapted: motionmaxxing sound-sync §6a]
- **A quiet brand needs a present bed, not a near-silent mix.** The finished file is always brought to about −14 LUFS. When few sounds play over a very low bed (−30 and under), the whole mix is lifted to get there, by 15 dB or more in our trial, which flattens the hits and raises the noise under them. The tool says how far it lifted. Over about 6 dB, raise the bed to −22…−26, or give the picture's events their sounds; "calm" is made by soft kinds (`rustle`, `tick`, a low `pop`) and long gaps, not by level. [ours: product trial 2026-11-17]
- **Its character comes from the brand and the audience**, not from a default pad. One store owner rejected a calm pad as wrong for the brand and chose a different music style per reel within one family. [ours: S §10, §12] Record the customer's choice in `rules.md`.
- **Any music must be music the customer may use.** The kit ships only permissively licensed audio; a track the customer supplies is their responsibility, and you ask where it came from. [ours: K ARCHITECTURE rule 5]

## 7. Silence

- **Silence before the biggest moment pulls harder than any sound.** Plan one quiet bar, or clear the bed by 8–15 dB (or cut it) for 0.2–0.5 s right before the payoff, and let the payoff bring the sound back. [ours: P5; adapted: motionmaxxing sound-sync §6a]
- In the reference we measured, the high "air" band dropped 18–19 dB in the second before each big transition, five times. [ours: N ElevenLabs reference]
- A longer silence can be the event itself: one reference ran 9 s of sound, then about 4 s of near-silence, and the eye kept searching. [ours: N batch 6] Use it once, on purpose.
- Silence is a decision, never an accident. A silent stretch you did not plan is a defect. [adapted: motionmaxxing sound-sync §6a]

## 8. What not to stack

- Two separate hits within 0.1 s of each other. Layers of **one** event designed together (impact + thump + click for the phone) are fine; two events colliding are not. [judgement; ours: L 2026-11-15 (designed layers)]
- A tick per typed letter, or a tick per counter value: use a texture across the span, a tick per word, or a tick on every 3rd–4th value. [adapted: motionmaxxing sound-sync §7]
- A swell over a real result: when the event is the climax, let it be; "no swell" is sometimes the right swell. [adapted: motionmaxxing sound-sync §6a]
- Sound over the brand's ending scene other than the ending's own cues. [judgement; the ending carries its own sound in the brand's look]
- A riser that does not end on anything.
- Music with vocals under a voice-over. [adapted: motionmaxxing sound-sync §6]

## 9. Measure, then say what you did

- After `make_reel.py`, read `check.json` (loudness, peak) and run `phone_check.py`. [ours: K SKILL, ARCHITECTURE]
- Scrub the render at each hit and each word onset; a sync fault is invisible in continuous playback. [adapted: motionmaxxing sound-sync §8]
- Our measured comparisons used: energy in six bands, spectral flatness, and onsets per second. Before and after a sound change, measure at least band share above 250 Hz and onset density. [ours: P18]
- **Report sound as "measured, not heard"** unless a person listened. A clean check is not a listen. One of our reels needed a person to listen to one word at one second because the automatic transcript heard it wrong. [ours: K SKILL, T reel 26]
