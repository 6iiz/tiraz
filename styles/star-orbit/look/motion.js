// Star-orbit motion. Words are moons: they swing round an orbit and come to rest in their line with a long, soft settle (no bounce);
// the camera never turns, it only drifts with a slow parallax so the stars and the planet move behind a still reading plane.
import { clamp } from '/engine/kit.js';

// Landing out of an orbit: most of the travel early, a long exact settle.
export const E = (p) => { p = clamp(p); return 1 - Math.pow(1 - p, 4); };
// A soft in-out for growing rings, the separation of two stars, the eclipse.
export const S = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
// Leaving at full speed.
export const away = (p) => Math.pow(clamp(p), 2.6);
// A deterministic hash in 0..1 (no Math.random).
export const hash = (i, j = 0, s = 0) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };

// Where a moon is on its orbit around (0,0,0) at angle a: an ellipse in the x-z plane, tipped so the near side sits lower.
export function onOrbit(a, rx, rz, tilt) { return [rx * Math.cos(a), rz * Math.sin(a) * Math.sin(tilt), rz * Math.sin(a) * Math.cos(tilt)]; }
