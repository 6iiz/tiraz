// Mini-diorama motion. A sign is hung, not animated in: it hangs on its nail folded up towards the lens, lets go, falls flat
// against the wall under its own weight, knocks it and gives two small bounces that die out within 0.8 s. The camera circles the
// little room slowly; the tiny people go about their day on their own clock. Every value is a function of time only.
import { clamp } from '/engine/kit.js';

// Settle curve: quick start, long soft landing, no overshoot.
export const E = (p) => { p = clamp(p); return 1 - Math.pow(1 - p, 3); };
export const inOut = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };

// The fall of a hanging sign, u seconds after it lets go. rx: swing away from the wall (negative = bottom towards the lens),
// rz: a small side sway. The board never passes through the wall: it bounces off it.
export const FALL = 0.17;                                        // seconds from letting go to the first knock
export function flap(u, lift = 1.45) {
  if (u <= 0) return { rx: -lift, rz: 0 };
  if (u >= 1.25) return { rx: 0, rz: 0 };
  const w = Math.PI / 2 / FALL, fade = 1 - span01(u, 0.95, 1.25);
  const rx = -lift * Math.exp(-6.2 * u) * Math.abs(Math.cos(w * u)) * fade;
  const rz = 0.045 * Math.exp(-5 * u) * Math.sin(12 * u) * fade;
  return { rx, rz };
}
const span01 = (t, a, b) => clamp((t - a) / (b - a));

// A wire gives way: the board drops to hang crooked from its other wire, swinging once around the new angle.
export function crooked(u, angle) {
  if (u <= 0) return 0;
  if (u >= 1.2) return angle;
  return angle * (1 - Math.exp(-7 * u) * Math.cos(10 * u) * (1 - span01(u, 0.9, 1.2)));
}

// A deterministic hash in 0..1 (no Math.random).
export const hash = (i, j = 0, s = 0) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };

// Back and forth between a and b at speed v (units / s), easing into each turn; returns { x, dir }.
export function pace(time, a, b, v, phase = 0) {
  const L = Math.abs(b - a), T = L / v, turn = 0.6, cyc = 2 * (T + turn);
  let u = ((time + phase * cyc) % cyc + cyc) % cyc;
  if (u < T) return { x: a + (b - a) * inOut(u / T), dir: Math.sign(b - a), walking: true };
  u -= T; if (u < turn) return { x: b, dir: Math.sign(b - a) * (u < turn / 2 ? 1 : -1), walking: false };
  u -= turn; if (u < T) return { x: b + (a - b) * inOut(u / T), dir: Math.sign(a - b), walking: true };
  return { x: a, dir: Math.sign(a - b) * ((u - T) < turn / 2 ? 1 : -1), walking: false };
}
