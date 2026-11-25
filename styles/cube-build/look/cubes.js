// How a set of cells (a voxelised text) is built and unbuilt, frame by frame, on a range of the pool's instances.
//   const B = builder(W3, set, { base, t0, window, color, tall, out0, seed });   then per frame: B.at(t) -> { landed, gone }
// Cubes are thrown in along the reading order (c.u) inside `window` seconds, each flight T.fly.dur long, and snap when they seat.
// While a text holds, a slow ripple runs through it in reading order, a few pixels high, so the frame is never dead.
// From out0 they lift off in reading order and fly away towards the reading end.
import { span } from '/engine/kit.js';
import { arrive, leave, snap } from './motion.js';

export function size(W3, set, c, tall = 1) {
  const T = W3.T, p = set.pitch;
  return { s: p * T.cube.fill, h: p * T.cube.h * (c.key ? T.cube.keyH : 1) * tall };
}

export function builder(W3, set, o) {
  const T = W3.T, pool = o.pool, base = o.base ?? 0, F = { ...T.fly, ...(o.fly || {}) }, L = { ...T.leave, ...(o.leave || {}) };
  const win = o.window ?? F.window, dur = o.dur ?? F.dur, out0 = o.out0 ?? 1e9, seed = o.seed ?? 0, colorOf = o.color || ((c) => (c.key ? W3.P.key : W3.P.ink));
  set.cells.forEach((c, k) => pool.color(base + k, colorOf(c)));
  const last = o.t0 + win + dur;
  return {
    n: set.cells.length, last,
    at(t) {
      let landed = 0, gone = 0;
      set.cells.forEach((c, k) => {
        const i = base + k, ts = o.t0 + c.u * win, p = (t - ts) / dur;
        if (p <= 0) { pool.hide(i); return; }
        const { s, h } = size(W3, set, c, o.tall);
        let x = c.x, y = c.y, z = h / 2, hh = h, rx = 0, ry = 0, rz = 0;
        if (p < 1) { const a = arrive(p, c, W3.dir, F, seed); x += a.dx; y += a.dy; z += a.z; rx = a.rx; ry = a.ry; rz = a.rz; }
        else {
          landed++;
          const sq = snap(span(t, ts + dur, ts + dur + 0.13)) * 0.32; hh = h * (1 - sq); z = hh / 2;
          const life = span(t, last + 0.15, last + 0.5), ph = (t - last) * T.life.speed - c.u * T.life.len;
          z += life * T.life.amp * Math.pow(Math.max(0, Math.sin(ph * Math.PI * 2)), 10);
        }
        const te = out0 + c.u * L.window, pe = (t - te) / L.dur;
        if (pe > 0) {
          if (pe >= 1) { pool.hide(i); gone++; return; }
          const l = leave(pe, c, W3.dir, L, seed); x += l.dx; y += l.dy; z += l.z; rx += l.rx; ry += l.ry; rz += l.rz; if (pe > 0.15) gone++;
        }
        pool.put(i, x, y, z, s, hh, rx, ry, rz);
      });
      const n = Math.max(1, set.cells.length);
      return { landed: landed / n, gone: gone / n };
    },
  };
}

// Records each row of a set for the safe-area check, while it is readable.
export function rec(W3, kit, set, st, tall = 1) {
  if (!kit || st.landed < 0.9 || st.gone > 0.2) return;
  const zTop = set.pitch * W3.T.cube.h * W3.T.cube.keyH * tall;
  for (const r of set.rows) kit.rec(...W3.screen(r.x0, r.x1, r.y0, r.y1, 0, zTop), r.text);
}
