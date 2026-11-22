// The iso-facts ground: a pale sheet with a faint isometric dot lattice, and on it a small world on a floating board, seen in true
// isometric. The board is cut like a specimen: its two front faces show the layers under the lawn (soil, clay, rock) and the round
// ends of pipes. A ring road runs round a paved square; little cars, a van and a bus drive round it at a steady pace; a wind turbine
// turns at the front corner; two tiny data chips hover over the world with bars that breathe. The board floats: it rises and sinks a
// few pixels over its own shadow. The square in the middle belongs to the scene (a part may fill it with its own things).
// Everything still is drawn once per page and kept; each frame adds the vehicles, the turbine blades, the chips and the scene's square.
import { rng, mix } from '/engine/kit.js';
import { palette, project, block, tree, vehicle, poly, C30 } from './motion.js';

export const U = 40, B = 14, OX = 540, OY = 1000, TH = 2.2;   // unit, board size, where the back corner sits, board thickness
const LOOP = [2.5, 11.5];
let cache = null;

function layer(W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }

function build(W, H, pal) {
  const key = `${W}x${H}:${pal.light}:${pal.dark}:${pal.accent}`;
  if (cache?.key === key) return cache;
  const P = project(OX, OY, U), r = rng(2217);
  // the sheet: ground colour, dot lattice, the board's shadow
  const base = layer(W, H), b = base.getContext('2d');
  b.fillStyle = pal.ground; b.fillRect(0, 0, W, H);
  b.fillStyle = pal.faint;
  for (let i = -40; i < 40; i++) for (let j = -40; j < 40; j++) {
    const [x, y] = project(OX, OY - 2 * U * 12, U)(i * 2, j * 2); if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
    b.fillRect(x - 2, y - 2, 4, 4);
  }
  b.save(); b.filter = 'blur(22px)'; b.fillStyle = 'rgba(0,0,0,0.16)';
  b.beginPath(); b.ellipse(OX, OY + B * U * 0.5 + TH * U + 150, B * U * C30 * 0.95, 70, 0, 0, 7); b.fill(); b.restore();
  // the board: two cut faces with strata and pipe ends, the lawn, the ring road, the paved square, trees along the back edges
  const under = layer(W, H), g = under.getContext('2d');
  const bands = [[0, -0.32, pal.lawn], [-0.32, -1.0, pal.soil], [-1.0, -1.6, pal.clay], [-1.6, -TH, pal.rock]];
  for (const [z0, z1, tone] of bands) {
    poly(g, [P(0, B, z0), P(B, B, z0), P(B, B, z1), P(0, B, z1)], tone.left);
    poly(g, [P(B, 0, z0), P(B, B, z0), P(B, B, z1), P(B, 0, z1)], tone.right);
  }
  // pipe ends and pebbles drawn in each face's own plane
  const face = (side, draw) => {
    g.save();
    if (side === 'left') g.setTransform(C30 * U, 0.5 * U, 0, -U, OX - B * C30 * U, OY + B * 0.5 * U);
    else g.setTransform(-C30 * U, 0.5 * U, 0, -U, OX + B * C30 * U, OY + B * 0.5 * U);
    draw(); g.restore();
  };
  for (const side of ['left', 'right']) face(side, () => {
    for (const [a, z, rr] of [[3.2, -0.7, 0.22], [9.6, -0.7, 0.22], [6.4, -1.3, 0.3]]) {
      g.fillStyle = pal.pipe; g.beginPath(); g.arc(a, z, rr, 0, 7); g.fill();
      g.fillStyle = side === 'left' ? pal.clay.left : pal.clay.right; g.beginPath(); g.arc(a, z, rr * 0.55, 0, 7); g.fill();
    }
    g.fillStyle = side === 'left' ? pal.soil.right : pal.soil.left;
    for (let k = 0; k < 26; k++) { const a = 0.3 + r() * (B - 0.6), z = -1.7 - r() * 0.4; g.beginPath(); g.ellipse(a, z, 0.12 + r() * 0.12, 0.07, 0, 0, 7); g.fill(); }
  });
  poly(g, [P(0, 0), P(B, 0), P(B, B), P(0, B)], pal.lawn.top);
  const [c0, c1] = LOOP, rw = 0.72;
  poly(g, [P(c0 + rw + 0.1, c0 + rw + 0.1, 0.01), P(c1 - rw - 0.1, c0 + rw + 0.1, 0.01), P(c1 - rw - 0.1, c1 - rw - 0.1, 0.01), P(c0 + rw + 0.1, c1 - rw - 0.1, 0.01)], pal.pave.top);
  const strip = (x0, y0, x1, y1) => poly(g, [P(x0, y0, 0.02), P(x1, y0, 0.02), P(x1, y1, 0.02), P(x0, y1, 0.02)], pal.road);
  strip(c0 - rw, c0 - rw, c1 + rw, c0 + rw); strip(c0 - rw, c1 - rw, c1 + rw, c1 + rw); strip(c0 - rw, c0 - rw, c0 + rw, c1 + rw); strip(c1 - rw, c0 - rw, c1 + rw, c1 + rw);
  g.strokeStyle = pal.dash; g.lineWidth = 2.5; g.setLineDash([12, 12]);
  g.beginPath(); for (const [a, bb] of [[P(c0, c0), P(c1, c0)], [P(c1, c0), P(c1, c1)], [P(c1, c1), P(c0, c1)], [P(c0, c1), P(c0, c0)]]) { g.moveTo(...a); g.lineTo(...bb); } g.stroke(); g.setLineDash([]);
  const back = [];
  for (let k = 0.9; k < B - 1; k += 1.7 + r() * 0.7) back.push([0.8, k], [k, 0.8]);
  back.sort((p, q) => p[0] + p[1] - q[0] - q[1]).forEach(([x, y]) => tree(g, P, x, y, 0.8 + r() * 0.3, pal));
  // the front strip: houses and trees between the road and the front edges (they may stand in front of the road)
  const front = layer(W, H), f = front.getContext('2d');
  const things = [
    { b: [12.6, 1.0, 1.1, 1.5, 1.1, 0] }, { t: [13.2, 3.4] }, { b: [12.6, 4.4, 1.1, 1.8, 1.5, 5] }, { b: [12.6, 8.2, 1.1, 1.4, 0.9, 2] },
    { b: [1.0, 12.6, 1.6, 1.1, 1.3, 1] }, { t: [3.6, 13.2] }, { b: [4.6, 12.6, 1.8, 1.1, 0.9, 0] }, { t: [7.4, 13.2] }, { b: [8.6, 12.6, 1.4, 1.1, 1.6, 4] },
    { t: [10.6, 13.3] }, { t: [13.3, 10.4] },
  ].sort((p, q) => { const a = p.b ?? p.t, c = q.b ?? q.t; return a[0] + a[1] - c[0] - c[1]; });
  for (const o of things) {
    if (o.t) tree(f, P, o.t[0], o.t[1], 0.9, pal);
    else { const [x, y, w, d, h, k] = o.b; block(f, P, x, y, 0, w, d, h, pal.blocks[k], { windows: pal.glass }); }
  }
  const [tx, ty] = P(13.25, 7.2, 0), mast = 3.6 * U;               // the turbine mast (the blades turn each frame)
  f.fillStyle = pal.blocks[0].right; f.beginPath(); f.moveTo(tx - 5, ty); f.lineTo(tx + 5, ty); f.lineTo(tx + 2.5, ty - mast); f.lineTo(tx - 2.5, ty - mast); f.closePath(); f.fill();
  // the default square: a tower of the accent, an office block, a low hall, a pond and a few trees
  const plaza = layer(W, H), q = plaza.getContext('2d');
  poly(q, [P(7.6, 7.4, 0.03), P(10.0, 7.4, 0.03), P(10.0, 9.8, 0.03), P(7.6, 9.8, 0.03)], pal.water.left);
  poly(q, [P(7.8, 7.6, 0.04), P(9.8, 7.6, 0.04), P(9.8, 9.6, 0.04), P(7.8, 9.6, 0.04)], pal.water.top);
  block(q, P, 7.6, 3.8, 0, 2.6, 2.0, 1.9, pal.blocks[0], { windows: pal.glass });
  block(q, P, 3.8, 4.0, 0, 2.2, 2.2, 1.0, pal.blocks[1], { windows: pal.glass });
  tree(q, P, 9.8, 6.4, 1, pal); tree(q, P, 4.3, 7.4, 1, pal);
  block(q, P, 5.0, 7.2, 0, 1.8, 1.8, 3.6, pal.hot, { windows: pal.blocks[3].right });
  tree(q, P, 4.4, 10.0, 1, pal); tree(q, P, 6.6, 10.1, 0.9, pal);
  cache = { key, base, under, front, plaza, hub: [tx, ty - mast] };
  return cache;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand), world = build(W, H, pal), P = project(OX, OY, U);
  const bob = (time) => Math.sin(time * 1.15) * 5;
  const cars = [
    { s: 0, kind: 'bus', tones: pal.blocks[1] }, { s: 8.5, kind: 'car', tones: pal.hot }, { s: 15, kind: 'van', tones: pal.blocks[0] },
    { s: 22, kind: 'car', tones: pal.blocks[2] }, { s: 29, kind: 'car', tones: pal.blocks[4] },
  ];
  const along = (s) => {                                     // a point on the ring road, and whether that side is at the back
    const [c0, c1] = LOOP, n = c1 - c0, L = 4 * n; s = ((s % L) + L) % L;
    if (s < n) return { x: c0 + s, y: c0 + 0.32, dir: 'x', back: true };
    if (s < 2 * n) return { x: c1 - 0.32, y: c0 + (s - n), dir: 'y', back: false };
    if (s < 3 * n) return { x: c1 - (s - 2 * n), y: c1 - 0.32, dir: 'x', back: false };
    return { x: c0 + 0.32, y: c1 - (s - 3 * n), dir: 'y', back: true };
  };
  const chip = (ctx, x, y, time, k) => {                      // a tiny floating data card with three breathing bars
    const yy = y + Math.sin(time * 1.6 + k) * 6;
    ctx.strokeStyle = pal.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, yy + 34); ctx.lineTo(x, yy + 70); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.roundRect(x - 44 + 6, yy - 30 + 8, 88, 64, 12); ctx.fill();
    ctx.fillStyle = pal.card; ctx.beginPath(); ctx.roundRect(x - 44, yy - 30, 88, 64, 12); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const h = 14 + 22 * (0.5 + 0.5 * Math.sin(time * (1.3 + i * 0.4) + k * 2 + i * 1.7));
      ctx.fillStyle = i === 1 ? pal.accent : pal.grey.right; ctx.fillRect(x - 30 + i * 22, yy + 24 - h, 14, h);
    }
  };
  return {
    pal, P,
    // screen position of a board point at this moment (the board floats)
    at: (x, y, z, t) => { const [sx, sy] = P(x, y, z); return [sx, sy + bob(t + clock)]; },
    // o.plaza(ctx, P, time): draw the square yourself (it replaces the default square). o.cars: false keeps the road empty.
    draw(ctx, t, o = {}) {
      const time = t + clock, dy = bob(time);
      ctx.drawImage(world.base, 0, 0);
      ctx.save(); ctx.translate(0, dy);
      ctx.drawImage(world.under, 0, 0);
      const vs = o.cars === false ? [] : cars.map((c) => ({ ...c, ...along(c.s + time * 1.5) }));
      const drive = (back) => vs.filter((v) => v.back === back).sort((a, b) => a.x + a.y - b.x - b.y).forEach((v) => vehicle(ctx, P, v.x, v.y, v.dir, v.kind, v.tones, pal));
      drive(true);
      if (o.plaza) o.plaza(ctx, P, time); else ctx.drawImage(world.plaza, 0, 0);
      drive(false);
      ctx.drawImage(world.front, 0, 0);
      const [hx, hy] = world.hub;                               // three blades turning at a steady pace
      ctx.fillStyle = pal.blocks[0].top; ctx.strokeStyle = pal.blocks[0].right; ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        const a = time * 2.2 + k * (Math.PI * 2 / 3), ca = Math.cos(a), sa = Math.sin(a);
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + ca * 62 - sa * 7, hy + sa * 62 * 0.9 + ca * 7); ctx.lineTo(hx + ca * 66, hy + sa * 66 * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = pal.blocks[0].right; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, 7); ctx.fill();
      if (o.chips !== false) { const a = P(1.6, 13.2, 1.3), c = P(13.2, 1.6, 1.2); chip(ctx, a[0], a[1] - 110, time, 0); chip(ctx, c[0], c[1] - 110, time, 1); }
      ctx.restore();
    },
  };
}
