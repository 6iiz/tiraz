// The field-notebook ground: a plate of a naturalist's notebook. Toothed paper in the brand's lighter colour, a pencilled margin rule
// on the far side, and, low in the frame under the app's own buttons, a cutaway of the earth: a ground line with tufts of grass, then
// soil horizons hatched in pencil at their own angles (one of them in the accent pencil), with stones drawn in outline. Through the whole reel a root grows slowly down through the
// horizons, branching as it goes. That root is what lives while a line holds. Built once per palette; the growth uses `clock`.
import { mix, rgba, rng } from '/engine/kit.js';
import { palette, hatchStrokes, drawHatch, wobble, pencil } from './motion.js';

const cache = new Map();
function build(W, H, P, T, rtl) {
  const key = [W, H, P.paper, P.ink, P.pen, rtl].join();
  if (cache.has(key)) return cache.get(key);
  const r = rng(2207), gl = T.ground.line;
  const paper = document.createElement('canvas'); paper.width = W; paper.height = H;
  const g = paper.getContext('2d');
  g.fillStyle = P.paper; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 16000; i++) { g.fillStyle = rgba(P.ink, 0.02 + r() * 0.04); g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1); }   // the tooth
  g.strokeStyle = rgba(P.ink, 0.05); g.lineWidth = 1;
  for (let i = 0; i < 160; i++) { const x = r() * W, y = r() * H, a = r() * 6.28, l = 6 + r() * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  // the cutaway, on its own canvas so it can be hatched in
  const cut = document.createElement('canvas'); cut.width = W; cut.height = H - gl + 40;
  const c = cut.getContext('2d'), oy = gl - 40;
  const bands = [[gl, gl + 70, 0, -0.5], [gl + 70, gl + 200, 1, -1.05], [gl + 200, gl + 380, 2, 0.75], [gl + 380, H + 20, 3, -0.35]];
  let edge = []; for (let x = -20; x <= W + 60; x += 40) edge.push([x, gl + (r() - 0.5) * 6]);
  const curves = bands.map(([y0, y1]) => { const pts = []; for (let x = -20; x <= W + 80; x += 60) pts.push([x, y1 + (r() - 0.5) * 18]); return pts; });
  bands.forEach(([y0, y1, k, ang], i) => {
    c.save(); c.beginPath(); const top = i ? curves[i - 1] : edge;
    c.moveTo(top[0][0], top[0][1] - oy); top.forEach(([x, y]) => c.lineTo(x, y - oy));
    [...curves[i]].reverse().forEach(([x, y]) => c.lineTo(x, y - oy)); c.closePath(); c.clip();
    drawHatch(c, hatchStrokes(W, y1 - y0 + 60, { angle: ang, gap: 6 + k, len: 40, seed: 70 + i, dens: 1 }), 0, y0 - 30 - oy, 1, P.soil[k]);
    if (k >= 2) drawHatch(c, hatchStrokes(W, y1 - y0 + 60, { angle: ang + 1.3, gap: 12, len: 30, seed: 90 + i, dens: 1 }), 0, y0 - 30 - oy, 1, mix(P.soil[k], P.ink, 0.25));
    c.restore();
    if (i < bands.length - 1) pencil(c, curves[i].map(([x, y]) => [x, y - oy]), 1, P.soft, 1.6);
  });
  for (let i = 0; i < 9; i++) {                                       // stones in outline with a little shadow hatching
    const sx = 60 + r() * (W - 120), sy = gl + 220 + r() * 320, rw = 18 + r() * 34, rh = rw * (0.5 + r() * 0.3), pts = [];
    for (let a = 0; a <= 6.4; a += 0.45) pts.push([sx + Math.cos(a) * rw * (0.9 + r() * 0.2), sy - oy + Math.sin(a) * rh * (0.9 + r() * 0.2)]);
    c.fillStyle = P.paper; c.beginPath(); pts.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.fill();
    pencil(c, pts, 1, P.graphite, 2);
  }
  pencil(c, edge.map(([x, y]) => [x, y - oy]), 1, P.graphite, 3);
  for (let x = 10; x < W; x += 9 + r() * 14) {                        // grass on the ground line
    const n = 1 + Math.floor(r() * 3);
    for (let j = 0; j < n; j++) { const h = 10 + r() * 30, lean = (r() - 0.5) * 14; pencil(c, [[x, gl - oy], [x + lean * 0.4, gl - h * 0.5 - oy], [x + lean, gl - h - oy]], 1, r() < 0.3 ? P.pen : P.soft, 1.6); }
  }
  // the root: a branching walk down from a sprig on the ground line, with each point's time of growth
  const root = [], sx = rtl ? W * 0.3 : W * 0.7;
  const grow = (x, y, a, len, t0, depth) => {
    const pts = [[x, y]]; let tt = t0;
    for (let i = 0; i < len; i++) { a += (r() - 0.5) * 0.5; x += Math.cos(a) * 14; y += Math.sin(a) * 14; pts.push([x, y]); tt += 0.32;
      if (depth < 3 && r() < 0.12) grow(x, y, a + (r() < 0.5 ? -0.9 : 0.9), Math.floor(len * 0.45), tt, depth + 1); }
    root.push({ pts, t0, t1: tt, w: 3 - depth * 0.6 });
  };
  grow(sx, gl, Math.PI / 2, 38, 0.6, 0);
  pencil(c, wobble([sx, gl - oy], [sx - 6, gl - 120 - oy], 5, 2, 8), 1, P.graphite, 2.4);
  for (let i = 0; i < 5; i++) { const y = gl - 30 - i * 20, s = i % 2 ? 1 : -1; pencil(c, [[sx - 2 - i, y - oy], [sx + s * 24, y - 14 - oy], [sx + s * 36, y - 6 - oy]], 1, P.pen, 2); }
  const out = { paper, cut, oy, root };
  cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand), rtl = brand.dir !== 'ltr', B = build(W, H, P, T, rtl);
  const marginX = rtl ? 44 : W - 44;
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(B.paper, 0, 0);
      const m = Math.min(1, Math.max(0, (time + 0.3) / 0.9));
      if (m > 0) { ctx.fillStyle = rgba(P.pen, 0.35); ctx.fillRect(marginX - 1, 0, 2, H * m); ctx.fillRect(marginX + (rtl ? 6 : -6) - 0.5, 0, 1, H * m); }
      ctx.drawImage(B.cut, 0, B.oy);
      for (const s of B.root) { const p = (time - s.t0) / (s.t1 - s.t0); if (p > 0) pencil(ctx, s.pts, p, P.graphite, s.w); }
    },
  };
}
