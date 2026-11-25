// Cube-build motion: every readable thing is made of small cubes, and every cube moves the same way. It is thrown in from the
// reading-start side, tumbles in a short arc, drops onto its cell and snaps (a quick squash, no bounce). Leaving, cubes lift off
// in reading order and fly on towards the reading end, faster and faster. Morphs (a number counting, an old value rebuilt as the
// new one) hop each cube from where it is to where it is needed, rolling a quarter turn on the way. All of it is a function of t.
import { clamp } from '/engine/kit.js';

// A deterministic hash in 0..1 (no Math.random).
export const hash = (i, j, s = 0) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
export const out3 = (p) => 1 - Math.pow(1 - clamp(p), 3);
export const out5 = (p) => 1 - Math.pow(1 - clamp(p), 5);
export const accel = (p) => Math.pow(clamp(p), 2.6);
export const smooth = (p) => { const q = clamp(p); return q * q * (3 - 2 * q); };
// The snap when a cube seats: 0 → 1 → 0 over the short window after landing.
export const snap = (p) => (p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p) * (1 - p));

// A cube on its way in. p: 0 (thrown) .. 1 (landed). c: { gx, gy } (its cell), dir: +1 reading left-to-right, -1 right-to-left.
// Returns the offset from the cell { dx, dy } (frame px), the height above its rest { z } and its tumble { rx, ry, rz }.
export function arrive(p, c, dir, F, seed = 0) {
  const a = hash(c.gx, c.gy, seed + 1), b = hash(c.gy, c.gx, seed + 2), h = hash(c.gx + 7, c.gy - 3, seed + 3), r = hash(c.gx - 5, c.gy + 11, seed + 4);
  const q = clamp(p), e = 1 - Math.pow(1 - q, 2.2), rest = 1 - e;
  const sx = -dir * F.side * (0.55 + 0.9 * a), sy = (b - 0.72) * F.spread, sz = F.z * (0.55 + 0.7 * h);
  const lift = Math.sin(Math.PI * q) * F.arc * (0.5 + h);                   // a short arc over the last stretch
  const z = sz * Math.pow(1 - q, 1.7) + lift * (1 - q);
  const turn = (r < 0.5 ? -1 : 1) * Math.PI * (1 + Math.floor(r * 4) % 2);
  return { dx: sx * rest, dy: sy * rest, z, rx: turn * rest, ry: turn * 0.6 * rest * (a < 0.5 ? 1 : -1), rz: turn * 0.3 * rest };
}

// A cube on its way out. p: 0 (seated) .. 1 (gone off the frame, towards the reading end and up to the camera).
export function leave(p, c, dir, F, seed = 0) {
  const a = hash(c.gx, c.gy, seed + 21), b = hash(c.gy, c.gx, seed + 22), q = accel(p);
  const turn = (a < 0.5 ? -1 : 1) * Math.PI * 1.5;
  return { dx: dir * F.dx * (0.7 + 0.6 * a) * q, dy: (b - 0.6) * F.dx * 0.5 * q, z: F.z * (0.6 + 0.8 * b) * Math.pow(clamp(p), 1.6), rx: turn * q, ry: -turn * 0.5 * q, rz: 0 };
}

// A hop from a to b ({ x, y } frame px): an arc up and a roll of a quarter turn (so the cube seats square again).
export function hop(p, a, b, lift, k = 0) {
  const q = clamp(p), e = smooth(q);
  const roll = (Math.PI / 2) * (1 + (k % 2)) * e;
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z: Math.sin(Math.PI * q) * lift, rx: k % 3 === 0 ? roll : 0, ry: k % 3 === 1 ? roll : 0, rz: k % 3 === 2 ? roll * 0.5 : 0 };
}

// Pairs two sets of cells for a morph: every cell of b gets a source in a (in reading order), and cells of a that are left over
// travel to a cell of b and shrink away into it. Returns [{ from, to, grow: true|false (false = shrinks away) }].
export function pair(a, b, key = (c) => c.x * 1e4 + c.y) {
  const A = [...a].sort((p, q) => key(p) - key(q)), B = [...b].sort((p, q) => key(p) - key(q)), out = [];
  if (!A.length || !B.length) return out;
  for (let j = 0; j < B.length; j++) out.push({ from: A[Math.min(A.length - 1, Math.floor(j * A.length / B.length))], to: B[j], stay: true, k: j });
  if (A.length > B.length) {
    const used = new Set(out.map((o) => o.from));
    A.forEach((c, i) => { if (!used.has(c)) out.push({ from: c, to: B[Math.min(B.length - 1, Math.floor(i * B.length / A.length))], stay: false, k: i }); });
  }
  return out;
}
