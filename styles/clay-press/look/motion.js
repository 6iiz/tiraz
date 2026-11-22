// Clay motion: everything moves the way a hand-animated clay piece does. Time is cut into poses (12 a second, like a puppet moved
// and shot one frame at a time), and between two poses nothing moves. Pieces drop onto the table, flatten on contact, spring back
// and wobble until they rest; they leave with a small crouch and a hop. Every value here is a function of time only.
import { clamp } from '/engine/kit.js';

export const FPS = 12;                         // poses per second
export const POSE = 1 / FPS;
export const FALL = 3 / FPS;                   // a drop takes three poses
export const WOBBLE = 0.7;                     // how long a landed piece keeps wobbling

// The pose a moment belongs to. Poses are counted on the reel's own clock, so every scene steps on the same grid.
export const pose = (clock, t) => { const k = Math.floor((clock + t) * FPS + 1e-6); return { k, tq: k / FPS - clock }; };

// A small, fixed, pseudo-random number in -1..1 for (a, b): the tiny shift a hand leaves each time it touches a piece.
export const jitter = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };

// A piece dropped at time t0. Returns { on, lift (height above the table, 0..1), sx, sy, sz } for the moment t.
//   amp: how hard it squashes (1 normal, more for a heavy key piece).
export function plop(t, t0, amp = 1) {
  const u = t - t0;
  if (u < 0) return { on: false, lift: 1, sx: 1, sy: 1, sz: 1 };
  if (u < FALL) { const f = u / FALL; return { on: true, lift: 1 - f * f, sx: 0.9, sy: 1.12, sz: 1.15 }; }   // falling: stretched
  const e = u - FALL;
  if (e > WOBBLE) return { on: true, lift: 0, sx: 1, sy: 1, sz: 1 };
  const a = 0.3 * amp * Math.exp(-e * 6.5) * Math.cos(e * Math.PI * 2 * 2.6);   // squash on contact, then a damped wobble
  return { on: true, lift: 0, sx: 1 + a * 0.55, sy: 1 - a * 0.7, sz: 1 - a };
}

// A piece leaving from time t0: a crouch, then a hop up and out of the frame. Returns { on, crouch, up (0..1+), sx, sy, sz }.
export function hop(t, t0) {
  const u = t - t0;
  if (u <= 0) return { on: true, up: 0, sx: 1, sy: 1, sz: 1 };
  if (u < 2 * POSE) { const c = 0.22 * Math.sin(Math.PI * u / (2 * POSE)) + 0.1; return { on: true, up: 0, sx: 1 + c * 0.5, sy: 1 - c, sz: 1 - c }; }
  const f = (u - 2 * POSE) / (3 * POSE);
  if (f >= 1) return { on: false, up: 1, sx: 1, sy: 1, sz: 1 };
  return { on: true, up: f * f * 1.2 + f * 0.3, sx: 0.88, sy: 1.18, sz: 1.2 };
}

// A soft settle for anything that slides (the roller, the stamp): eased, then cut into poses by whoever calls it with tq.
export const ease = (p) => { p = clamp(p); return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2; };
