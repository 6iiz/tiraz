# Transitions and sequences

## What is here

- `vendor/gl-transitions/`: 279 shader files from gl-transitions (277 MIT, 1 BSD-2-Clause, 1 BSD-3-Clause), unchanged, with `LICENSE` and `LICENSES.md` (source commit, counts, what was left out and why).
- `index.json`: 280 entries: the 279 shaders plus the kit's own `fade`. Each has a name, author, licence, description, tags and parameters (type, default, range and note when the shader file gives them).
- `run.js`: `const tr = await loadTransition('CrossZoom'); ctx.drawImage(tr.draw(fromCanvas, toCanvas, 0.5, { param: value }), 0, 0)`. WebGL2 on one shared canvas, inputs uploaded as textures. The returned canvas is shared: draw it before the next `draw()`. `fade` is a 2D cross-fade and needs no WebGL. Without WebGL2 any other name fails with a sentence that says so and points to `fade`. Names are case-sensitive (`Fade` is the shader, `fade` the 2D one).
- `parse.js`, `build.mjs`: read the shader headers and `uniform` lines and rebuild the index from a gl-transitions checkout.
- `engine/scenes/sequence.js`: plays scenes in a row. With no transition written, scenes join with a cut; a transition from this folder is asked for by name (`"transition": { "name": "…", "duration": 0.4 }`). A brand can also bring its own joint, a module in its look (`"transition": { "joint": "/brand/look/joint.js", "duration": 0.5 }`, see `guides/scenes.md` section 2): how a brand's scenes join is part of its look, and these shaders are one of three ways to build it.
- Two shaders need an extra texture (`LumaWipe`, `DisplacementMap`): they get a fixed noise map, or pass your own canvas as that parameter.

## What was measured, and on what

- One machine: Chrome headless with WebGL2 on an NVIDIA card. Not tried on a machine without a graphics card.
- All 279 shaders compile and run there. At progress 0 and 1 each shows the outgoing and the incoming picture (mean error under 1/255). The same frame drawn twice is byte-identical.
- One shader from the source, `CylinderRoll`, failed that test (it does not start on the outgoing picture) and was left out.
- Eleven transitions hold or go dark in the middle by design: DoomMelt, EyeBlink, FadeColor, Faint, GlowDissolve, RectangleCover, RectangleIris, SimpleFlip, StarWipe, ZoomWipeLeft, ZoomWipeRight.
- `CrossZoom` is a heavy blur at its middle: text on both sides shows as streaks there.

## Known limits

- Compile results come from one graphics driver. Render a still of a transition on your machine before building a reel on it.
- Transition progress is linear; the shaders ease themselves. Two transitions around one scene may not overlap each other.
- A legacy module-level scene may appear only once in a sequence.

## Calm brand or energetic (judgement, not measured)

| Calm | Energetic |
|---|---|
| fade, Dreamy, DreamyZoom, FadeColor, LuminanceMelt, CircleOpen, Directional, SimpleZoom, PerlinDissolve, WaterDrop | CrossZoom, GlitchMemories, WhipPan, DoomMelt, Pixelize, Cube, Swirl, FlashFade, FilmBurn, StaticFade |

## Which sound goes with which transition (kinds from `sound/kinds.json`)

- `fade` and dissolves: `rustle`, or none.
- Wipes, slides, pans: `swish` (short) or `whoosh`.
- Zooms and spins: a long `whoosh`; a `riser` before a big reveal.
- Glitch and static ones: `glitch`.
- Flashes and burns: `impact` or `shimmer`.

Place the sound at the start of the transition: scene `i+1` starts at `start[i] + duration[i] - transition`.
