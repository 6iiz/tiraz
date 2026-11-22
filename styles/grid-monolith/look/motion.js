// Grid-monolith motion: one precise curve for everything that locks into the grid, an accelerating curve for things that sink
// away, and the beat that makes the floor breathe. Words never fade or bounce: they slide out of a gate along their grid row and
// lock; blocks rise and sink on the beat. The single linear move of a reel belongs to the accent unit in the ending.
import { clamp } from '/engine/kit.js';

function bezier(x1, y1, x2, y2) {
  const bx = (u) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  return (t) => { t = clamp(t); if (t <= 0 || t >= 1) return t; let lo = 0, hi = 1, u = t;
    for (let i = 0; i < 26; i++) { const x = bx(u); if (Math.abs(x - t) < 1e-6) break; if (x < t) lo = u; else hi = u; u = (lo + hi) / 2; } return by(u); };
}
// The lock: fast travel, a long exact settle, no overshoot.
export const E = bezier(0.62, 0, 0.14, 1);
// Sinking away: starts slow, leaves at full speed.
export const sink = (p) => Math.pow(clamp(p), 2.4);
// A short press at the end of a lock (0 → 1 → 0), for the few pixels a slab gives when it seats.
export const press = (p) => (p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p));

// A deterministic hash in 0..1 for a grid cell and a seed (no Math.random).
export const hash = (i, j, s = 0) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };

// One beat of a floor block: rises in the first quarter of the beat, holds, sinks back during the next beat. 0..1.
export function beatEnv(u, beat) {
  if (u <= 0 || u >= beat * 1.9) return 0;
  if (u < beat * 0.45) return E(u / (beat * 0.45));
  if (u < beat * 1.0) return 1;
  return 1 - E((u - beat) / (beat * 0.9));
}

// Climb to 1 in n locked steps (one module at a time).
export const steps = (p, n = 4) => { p = clamp(p) * n; const i = Math.floor(p); return i >= n ? 1 : (i + E(Math.min(1, (p - i) * 2.5))) / n; };
