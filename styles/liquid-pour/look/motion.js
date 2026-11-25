// Liquid-pour motion. Everything is computed from time, as if by gravity and surface tension:
//  - a stream falls (constant acceleration), the mould fills (fast at first, slowing as the level reaches the top),
//  - a filled word sets with one soft wobble that dies out (a jelly settling, not a bounce),
//  - drops grow on the lowest edges, stretch, and some let go and fall into the pool, where rings spread.
import { clamp, span } from '/engine/kit.js';

// arrivals: quick start, long soft finish
export const E = (p) => 1 - (1 - clamp(p)) ** 3;
// the level in a mould: the flow is steady, but the top of a letter is narrow, so it seems to slow near the end
export const fill = (p) => 1 - (1 - clamp(p)) ** 1.7;
// draining: starts slow, then runs out
export const drain = (p) => clamp(p) ** 1.8;
// a liquid that has just set: one damped wobble, 0 at the start and at the end (so nothing jumps)
export const wobble = (u, f = 11, k = 5.5) => (u <= 0 ? 0 : Math.exp(-k * u) * Math.sin(f * u));
// how far a body has fallen after u seconds from rest, with g in px / s²
export const fall = (u, g) => (u <= 0 ? 0 : 0.5 * g * u * u);
// the time a body needs to fall a height h
export const fallTime = (h, g) => Math.sqrt(Math.max(0, 2 * h / g));
// a deterministic hash in 0..1 (no Math.random)
export const hash = (a, b = 0, s = 0) => { const v = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
export { span, clamp };
