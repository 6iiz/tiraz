# gl-transitions (vendored)

Source: https://github.com/gl-transitions/gl-transitions.git
Commit: 7df1f75f5136c0d3ab151d2d9f4d292f09d82082 (2026-11-17)
The `LICENSE` file next to this one is the repository's own (MIT, "2017-present gl-transitions contributors"). Each `.glsl` file keeps its author and licence line in its own header; the files are copied byte for byte.

Files in the source folder: 280. Copied: 279. Left out: 1.

## Copied, by licence (read from each file's header)

- MIT: 277
- BSD-3-Clause: 1
- BSD-2-Clause: 1

The two BSD files keep their full copyright notice and conditions inside the file; do not strip them.

## Left out

- CylinderRoll: failed to compile or to pass the test: broke the test: pair 1 progress 0: mean 53.56, 40.0% of pixels off

Regenerate with `node engine/transitions/build.mjs --src <gl-transitions>/transitions`. The compile test that fills excluded.json is not part of the kit: render a still of a transition on your own machine before you rely on it.
