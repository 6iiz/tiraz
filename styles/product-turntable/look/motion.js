// Product-turntable motion. Two moves only, both physical:
//  - a price tag swings on its cord: it arrives from behind, showing its back, turns round the cord and settles with one small,
//    dying sway, square to the lens; when the scene is done it is swung back round, picking up speed;
//  - the turntable turns slowly and evenly, always (it is the only thing that never stops, except in the ending, where it brakes
//    to show the logo square on).
// Every value is a function of time only.
import { clamp } from '/engine/kit.js';

// Calm in-out for things that are placed (a product lifted off, the logo set down).
export const E = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2; };
export const out = (p) => 1 - (1 - clamp(p)) ** 3;
export const inn = (p) => clamp(p) ** 2.2;

// How far round a tag still is (1 = its back to us, 0 = square on), for 0..1 of its swing. It overshoots once by a few degrees
// and the sway dies out exactly at p = 1, so a tag is still after its swing.
export function settle(p) {
  p = clamp(p); if (p >= 1) return 0;
  const q = 1 - (1 - p) ** 1.6;                       // a quick turn, then the sway
  return Math.exp(-3.2 * q) * Math.cos(q * Math.PI * 1.55) * (1 - p) ** 0.6;
}

// A deterministic hash in 0..1 (no Math.random).
export const hash = (i, j = 0, s = 0) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
