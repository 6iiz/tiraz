// metal-cast motion: one gesture for everything that arrives. A piece of cast metal is let go just above the table, falls under
// gravity, lands flat with one small hop and rings (a quick rocking that dies away). Nothing fades out, slides or bounces like rubber:
// the weight is in the fast fall and the hard stop. Things that leave are struck and tip over, or the table itself moves on (joint.js).
import { screenBox } from '/engine/three3d.js';
import { clamp } from '/engine/kit.js';
import { fallAt, place } from './studio.js';

// The fall with this look's numbers. o may override { fall, h0, e, ring, seed }.
export const fall = (T) => (tau, o = {}) => fallAt(tau, { fall: T.fall.time, h0: T.fall.height, e: T.fall.bounce, ring: T.fall.ring, ...o });

// Gaps between pieces of one line: tighter when the line is long, so the whole line is down in about half a second.
export const gap = (T, n) => Math.min(T.fall.step, 0.42 / Math.max(1, n - 1));

// Drops piece p let go at t0 (seconds, the scene's own time); returns the fall state or null.
export function drop(T, p, t, t0, o = {}) { const st = fall(T)(t - t0, { seed: p.seed, ...o }); place(p, st); return st; }

// Tells the safe-area check where a piece of text is on screen (call after the frame is rendered).
export function rec(kit, ground, p, text = p.text, extra) {
  if (!p.group.visible) return;
  kit.rec(...screenBox(p.group, ground.camera, ground.W, ground.H), text, extra);
}

// Ease-in of something tipping past its balance point: slow at first, then gravity takes it.
export const tipping = (p) => { p = clamp(p); return p * p * (0.35 + 0.65 * p); };
export const E = (p) => { p = clamp(p); return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2; };
