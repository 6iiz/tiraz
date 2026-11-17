# Motion for the frame-exact engine

Read this before you write or change a scene. Tags: `[ours: …]` (`SOURCES.md`), `[adapted: …]` (`THIRD-PARTY.md`), `[source: …]` (`references.md`), `[judgement]`. Where an adapted rule disagrees with a lesson we tested, ours wins, and the text says so.

## 1. The engine's terms

- **A frame is a pure function of time.** Scenes draw from `t` and their inputs only: no clock, no `requestAnimationFrame` timing, no unseeded random, no state carried from the last frame. Randomness comes from `rng(seed)` in `engine/lib/base.js`. [ours: K ARCHITECTURE rule 2]
- The reel renders at **60 fps: one frame = 16.7 ms**. Numbers in this guide are in seconds; frames at 60 fps are given where it matters. [ours: K ARCHITECTURE]
- Nothing moves by itself: the kit's helpers draw no motion of their own, so every entrance, exit and hold is written by whoever builds the part (see `scenes.md`); `ease` in `engine/kit.js` gives the standard curves (`outCubic` and others). [ours: K ARCHITECTURE, kit.js]
- Type effects take a progress `p` from 0 to 1: `fillText`, `drawOn` (outline traced in reading order), `revealWords`, `revealGlyphs`, `morph(a, b, p)`. You decide how `p` moves with `t`; that is the ease. [ours: K effects.js]
- Determinism check: render the same moments twice and compare the files (identical), then once more in another order (no difference you can see; the browser may round a few edge pixels by a level or two). A scene that only draws from `t` and its inputs passes this; one that remembers something from the last frame does not. [ours: A edit-lab, product trial 2026-11-17]

## 2. Eases, as formulas

Write the ease as a function of `p` (0..1, clamp first). Pick by **role**: one ease for everything is the loudest sign of generated motion. [adapted: motionmaxxing motion §2, slop M1]

| Role | Ease | Formula | Default duration |
|---|---|---|---|
| Something lands (word, card, panel) | soft land | `1 − (1 − p)^3` | 0.40 s (0.2–0.7) |
| A hero element lands (the product, the price) | snap and settle | `1 − (1 − p)^7` (most of the travel in the first quarter, long soft tail) | 0.35–0.6 s |
| Medium all-purpose move | glide | `1 − (1 − p)^1.7` | 0.33 s |
| Something leaves across the frame or into a cut | accelerate out | `p^2.6` (ends at full speed) | 0.43 s |
| A fade starts, a slow push into a cut | gentle in | `p^2` | 0.3 s |
| Colour or background ramps, counters tied to a control | soft in-out | `p*p*(3 − 2p)` (the kit's `smooth`) | 0.3–0.7 s |
| Drift, creep, ambient motion | linear | `p` | 0.9 s and longer |
| A spring with no bounce | critically damped | `1 − (1 + ωt)·e^(−ωt)`, with ω = 5.83 ÷ settle time (98% at settle) | settle 0.35–0.5 s |

- Shapes and durations: [adapted: motionmaxxing motion §1.1, §2]; the critically damped form is standard physics [judgement]. Cross-check with published interface systems: Material 3's duration tokens run 50–1000 ms with "medium" at 250–400 ms, and IBM Carbon's run 70–700 ms with "slow-01" at 400 ms, so a 0.4 s landing sits in the same family. [source: Material 3 motion tokens; IBM Carbon motion] Durations were measured on launch films; they describe single moves and do not set a reel's pace: pace is how many things move per beat (section 3), not how slow each move is. [judgement]
- **The temperament is the brand's, and it is decided in its look, with numbers.** A calm brand lands softly (critically damped, no overshoot), holds long and moves little; an energetic one snaps, cuts hard and may whip between scenes. Both ends work when they are chosen: the adapted guide uses whips and hard slams in launch films [adapted: motionmaxxing motion §6.4], and a reel of ours that was judged "too fast" got better when it was slowed [ours: L reel 13]. What a look may not do is take its temperament from the last brand, or from this guide's examples. Whatever the temperament, the whole frame does not shake while a line is being read. [judgement]
- **Overshoot is rare and small:** at most one visible spring in the whole reel, on the payoff (about +4–8%, peaking late, around 70% of the move). Bounce on every pop is a template tell. [adapted: motionmaxxing motion §1.6, slop M2]
- **The camera is slower than the shapes:** camera settle ≥ 1.5× the shape's settle (for example 0.6 s against 0.4 s). One eased camera move per scene; never zoom in then straight back out. [ours: O, P16]
- **Content swaps (one line replacing another) take ≤ 0.2 s; a flood or expansion across the frame ≥ 0.3 s.** [ours: O]
- **Elements arrive by moving, not by fading:** a small offset, scale or blur that decays, with opacity only as a short helper (about 0.1 s). A pure opacity fade on everything reads as slideware. [adapted: motionmaxxing motion §1.4, slop T1]
- **Exits are new motion, not the entrance reversed:** faster, accelerating, overlapping the next entrance by about 2 frames at 30 fps (≈ 0.07 s). [adapted: motionmaxxing slop M13]

## 3. One motion idea per beat

- **Each beat has one hero move and one idea**, about 2 s per beat. Everything else on the frame is quiet or supporting. [ours: P brief, P8]
- **Every move must carry information.** A move that changes nothing is removed. [ours: P8]
- **Every change has a cause on screen** (a cursor presses, a counter reaches a value, a word is spoken). [ours: P6]
- **One hero per frame:** if two panels share a frame, one is at least twice the other's area, or the camera moves between them. [adapted: motionmaxxing gate G4]
- **One motion grammar per reel:** smooth everywhere, or crisp steps everywhere; mixed grammars look like different authors. [adapted: motionmaxxing type R1.1]
- **Staggers:** between steps of an idea (list items, proof steps) 0.3–0.4 s at a calm pace [ours: P brief], about half that at a fast one [judgement]; inside one gesture (letters of an effect, tiles, rows) 0.03–0.1 s with uneven gaps, each move about twice as long as the gap so tails overlap. A uniform timer-delay reads as a loading list. [adapted: motionmaxxing motion §1.5]
- **Words of a line arrive on the speech**, not on a metronome: with a voice, each word lands 0–0.07 s before it is spoken; without a voice, 0.12–0.20 s apart with some unevenness, and a longer gap before the key word. [adapted: motionmaxxing type §2.1, sound-sync §5] Arabic words arrive whole (see `arabic-text.md`).

## 4. Holds

- **Nothing on screen is motionless for more than 1 s.** [ours: P8]
- **No dead frame:** when a line holds, one thing on the frame stays alive: a slow drift (30–90 px per second), a 1–2% scale creep, light moving on the ground, a counter ticking. The adapted guide's drift figures convert to roughly 45–135 px per second at our frame width; a calm brand keeps the lower end. [adapted: motionmaxxing motion §1.7 R1.12, converted]
- **A designed breath is allowed:** 0.6–1.5 s of near-stillness with a reason you can state, right before the payoff; it pairs with the quiet bar in the sound. [adapted: motionmaxxing motion R1.12; ours: P5]
- **After the payoff lands, a true hold of 0.5–1.0 s** lets it become a fact; a single big number 0.5–1.2 s. [adapted: motionmaxxing slop Tm4]
- Reading holds for text are in `arabic-text.md` §5.
- **Energy is not noise.** A fast brand still gives the eye one thing at a time. In the references we studied, what tired the viewer was never speed itself: it was flashes, runs of rapid cuts and a tilting handheld frame. [ours: N batch 5, batch 7, batch 8]
- **Never more than three flashes in any one second** (a flash is a pair of opposite brightness changes of 10% or more; saturated red flashes count separately). This is an accessibility rule (WCAG 2.3.1, Level A), not taste: flashing can trigger seizures. [source: WCAG 2.2 three flashes]

## 5. Transitions

- **The strongest joint is a shape that carries over:** the last shape of a beat is the first shape of the next. A plain crossfade between two unrelated frames is the weakest. [ours: P2] Which joints a brand uses is part of its look (`look.md` section 3), built in one of the three ways in `scenes.md` section 2, and used the same way every time.
- **A carrier:** one element (a dot, a card, the product) that appears in every scene and becomes each step, returning at the end. Strong when the element *is* the subject; as a decorative flourish on every reel it becomes a cliché. [ours: P1; adapted: motionmaxxing slop never-ship 7 (a dot that becomes the logo as a house style)]
- Transitions that suit this engine, by what changes: [adapted: motionmaxxing transitions §2]
  - **Carried object:** the same object, at the same position, ends beat A and starts beat B.
  - **The effect becomes the next scene:** a card grows until it is the new background.
  - **Container replacement:** the content of a fixed card changes while the card stays.
  - **Occlusion:** a rising card covers the old content, instead of the old content fading.
  - **Wipe painted in the next scene's ground,** with a soft edge.
- **Never:** a white flash or a black dip between scenes, or an unrelated last frame and first frame joined by nothing. [adapted: motionmaxxing slop X1, X2, X4] A joint that floods the frame with a colour much lighter or darker than the scenes is that flash, however it is drawn: in a trial, a white sweep in the shape of a logo swung the frame's brightness from 73 to 195 and back at every cut, and passed every still. Make the sweep tonal (close to the ground's own brightness), and measure the finished reel: the check counts flashes. [ours: product trial 2026-11-17]
- **Start the transition 0.1–0.2 s before the voice line ends,** and bring the next hero in before the transition finishes, so there is no dead time at the seam. [adapted: motionmaxxing sound-sync §5]
- A child scene can be used more than once in a reel because each `create()` returns a fresh object; a parent scene builds the sequence and owns the transitions. [ours: K ARCHITECTURE scene contract]

## 6. Loops

- A loop ends where it began: **the last frame before the ending scene ≈ the first frame.** [ours: P brief, N batch 5]
- When the reel closes on the brand's ending scene, a seamless replay is a *narrative* loop: the story returns to its first image before the ending starts. [judgement]
- Every element delayed by `d` must finish its fade-out at least `d` before the loop's end, or it pops at the seam. [ours: A edit-lab (loop lesson)]
- Check the seam: frame 0 against the last frame of the loop. [ours: P17]
- Short loops (6–9 s, one beautiful movement) are a form of their own. [ours: N idea bank]

## 7. Counters and numbers in motion

- A counter that measures something real in the story (a count, a running total, "0 results") is content and is welcome; it must show the true value from `facts.md`. [ours: P12]
- Roll it **one value per frame with steps that shrink toward the end** (about 15–23 steps over 0.5–0.9 s), so the number *lands* instead of stopping; never a smooth tween of the digits. [adapted: motionmaxxing type §8]
- A number that is texture, not the claim, appears complete, with no count. [adapted: motionmaxxing type R8.5]
- A decorative chapter counter ("01 / 05"), a timecode or a corner label is page chrome; avoid it. A list shown as a progress bar is different: there the list *is* the content (see `structure.md` §3.4). [adapted: motionmaxxing slop never-ship 1; ours: N batch 5]

## 8. What reads as cheap

What we stopped doing after seeing it fail: drifting particles with no cause, blur-in on everything, a centred title on a gradient, a shaking frame, crossfades between unrelated scenes, big numbered titles, "STEP" labels, flashes, a white glare frame, invented screens or numbers. [ours: P brief, N batch 7, batch 9] None of these is a matter of temperament: each reads as unfinished at any pace.

From the adapted guide: one ease on everything; a bounce on every pop; the same small slide-in on every text with equal gaps; frozen holds where each card sits 1.2 s and is swapped; a group sliding as one block; a count-up tween to a round number; a fade to black at the end; a logo scaling up from zero; exits that replay the entrance backwards; mixed frame grammars. [adapted: motionmaxxing slop Part 1 (Motion, Type, Endings, Timing)]

## 9. Gates before the full render

Run these and say which passed (yes/no), not "looks fine": [ours: P15, P17, A edit-lab]
1. **Contact sheet:** one still per beat (the kit's `--stills`); open it.
2. **No cut where you claim none:** ffmpeg `select='gt(scene,0.35)'` and again at 0.12 (use `-v info`, or the count prints a false zero).
3. **No pop:** a scene detector misses dark-to-dark cuts; also flag any frame-to-frame change at least 3× its neighbours and at least 1.5/255 in mean value.
4. **Loop seam** (if it loops): frame 0 against the last frame.
5. **No text on text; critical text inside y 269–1248** (see `arabic-text.md` §6). `--stills` and the final check measure the safe area for every text drawn through the kit.
6. **No more than three flashes in any second.** The final check counts whole-frame flashes in the finished file and names a single big one; a small flashing detail is yours to see.
7. **Arabic intact:** joins closed, right to left, kashida only where intended.
The full render starts only when all are yes.
