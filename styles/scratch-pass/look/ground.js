// The scratch-pass ground: a scratchboard landscape crossed by one unbroken sideways camera move. Only two values exist, ink and paper (the
// brand's darker and lighter colours); grey is the width of parallel cuts. Layers, back to front: a sky that does not slide (horizontal cuts,
// wider and darker toward the top, with the one red as a low sun), a far faceted range, a forest band, water with cut ripples, a near hill
// with cuts down its slope and a fence. Each layer slides at its own rate on the reel's clock (time + clock), so the move never restarts at
// a scene. Every layer is drawn once per brand into a seamless tile (a module cache); a frame is a handful of drawImage calls.
import { mix, rng } from '/engine/kit.js';
import { palette } from './motion.js';

const cache = new Map();
const canvasOf = (W, H) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

// Parallel cuts of a colour across a clipped region: lines in direction (ux, uy), spaced `gap`, width from wf(i).
function cuts(g, x0, y0, x1, y1, ang, gap, wf, color) {
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  g.strokeStyle = color; g.lineCap = 'butt';
  for (let d = -R, i = 0; d <= R; d += gap, i++) {
    const w = wf(i, d); if (w <= 0) continue;
    g.lineWidth = w; g.beginPath(); g.moveTo(cx + nx * d - ux * R, cy + ny * d - uy * R); g.lineTo(cx + nx * d + ux * R, cy + ny * d + uy * R); g.stroke();
  }
}

function build(W, H, brand, T) {
  const key = `${W}x${H}:${JSON.stringify(brand.colors)}:${T.tile}`;
  if (cache.has(key)) return cache.get(key);
  const P = palette(brand), TW = T.tile, rtl = brand.dir !== 'ltr';
  // sky: paper, horizontal ink cuts that thicken toward the top; the red sun low on the far side, banded by paper cuts on its lower half
  const sky = canvasOf(W, 1120), s = sky.getContext('2d');
  s.fillStyle = P.paper; s.fillRect(0, 0, W, 1120);
  s.fillStyle = P.ink;
  for (let y = 0; y < 1120; y += 9) { const u = 1 - y / 1000, w = Math.max(0, 8.6 * u ** 1.6); if (w > 0.4) s.fillRect(0, y, W, Math.min(9, w)); }
  const sx = rtl ? 250 : W - 250, sy = 820, sr = 96;
  s.fillStyle = P.paper; s.beginPath(); s.arc(sx, sy, sr + 14, 0, 7); s.fill();
  s.fillStyle = P.red; s.beginPath(); s.arc(sx, sy, sr, 0, 7); s.fill();
  s.save(); s.beginPath(); s.arc(sx, sy, sr, 0, 7); s.clip(); s.fillStyle = P.paper;
  for (let y = sy + 6, k = 0; y < sy + sr; y += 11, k++) s.fillRect(sx - sr, y, sr * 2, 1.5 + k * 0.7);
  s.restore();
  const r = rng(1931);
  for (let i = 0; i < 4; i++) {                                         // clouds: paper with a few ink cuts under them
    const cx = r() * W, cy = 180 + r() * 380, cw = 160 + r() * 200;
    s.fillStyle = P.paper; s.beginPath(); s.ellipse(cx, cy, cw, 26 + r() * 14, 0, 0, 7); s.fill();
    s.fillStyle = P.ink; for (let k = 0; k < 3; k++) s.fillRect(cx - cw * (0.6 - k * 0.15), cy + 8 + k * 7, cw * (1.2 - k * 0.3), 1.6);
  }
  // a seamless tile: draw(g, x) is called at x and x - TW so features crossing the seam wrap
  const tile = (h, paint) => { const c = canvasOf(TW, h), g = c.getContext('2d'); for (const o of [0, -TW, TW]) { g.save(); g.translate(o, 0); paint(g); g.restore(); } return c; };
  // far range: faceted peaks; the sun is on the far side, so the facet toward it is paper with a few cuts near the ridge, the other is ink
  // with paper cuts running down the slope
  const range = (base, hMin, hMax, wMin, wMax, seed, density) => tile(base, (g) => {
    const q = rng(seed); let x = -200;
    while (x < TW + 200) {
      const w = wMin + q() * (wMax - wMin), h = hMin + q() * (hMax - hMin), ax = x + w * (0.4 + q() * 0.2), ay = base - h, rx = ax + (q() - 0.5) * w * 0.12;
      const lit = rtl ? [[x, base], [ax, ay], [rx, base]] : [[rx, base], [ax, ay], [x + w, base]];
      const dark = rtl ? [[rx, base], [ax, ay], [x + w, base]] : [[x, base], [ax, ay], [rx, base]];
      const poly = (pts) => { g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach((p) => g.lineTo(...p)); g.closePath(); };
      g.save(); poly(dark); g.fillStyle = P.ink; g.fill(); g.clip();
      const slope = Math.atan2(base - ay, (dark[2][0] - ax) || 1);
      cuts(g, Math.min(ax, dark[2][0]) - 10, ay, Math.max(ax, dark[2][0]) + 10, base, slope, 8, () => density, P.paper); g.restore();
      g.save(); poly(lit); g.fillStyle = P.paper; g.fill(); g.clip();
      const slope2 = Math.atan2(base - ay, (lit[0][0] - ax) || 1);
      cuts(g, Math.min(ax, lit[0][0]) - 10, ay, Math.max(ax, lit[0][0]) + 10, base, slope2, 16, (i) => (i % 3 === 0 ? 1.4 : 0), P.ink); g.restore();
      g.strokeStyle = P.ink; g.lineWidth = 2; poly([[x, base], [ax, ay], [x + w, base]]); g.stroke();
      x += w * (0.55 + q() * 0.3);
    }
  });
  const far = range(1000, 150, 330, 300, 520, 11, 3.6);
  const mid = range(1090, 90, 190, 220, 360, 23, 2.2);
  // forest: an ink band whose top edge is a row of small pointed trees, with short paper cuts on their sunny sides
  const forest = tile(1250, (g) => {
    const q = rng(37); g.fillStyle = P.ink; g.fillRect(0, 1130, TW, 120);
    for (let x = 0; x < TW; x += 18 + q() * 14) {
      const h = 40 + q() * 60, w = 18 + q() * 12, b = 1140 + q() * 10;
      g.fillStyle = P.ink; g.beginPath(); g.moveTo(x - w, b); g.lineTo(x, b - h); g.lineTo(x + w, b); g.closePath(); g.fill();
      g.strokeStyle = P.paper; g.lineWidth = 1.4; g.beginPath();
      for (let k = 1; k < 4; k++) { const yy = b - h + h * k / 4, xx = x + (rtl ? -1 : 1) * w * k / 4 * 0.6; g.moveTo(xx, yy); g.lineTo(xx + (rtl ? -1 : 1) * 6, yy + 4); }
      g.stroke();
    }
    g.fillStyle = P.paper; for (let k = 0; k < 6; k++) g.fillRect(0, 1170 + k * 13, TW, 0.8 + k * 0.4);
  });
  // water: ink with paper ripple cuts, denser and longer toward the front; a broken red path under the sun is on the sky layer's side
  const water = tile(1520, (g) => {
    const q = rng(53); g.fillStyle = P.ink; g.fillRect(0, 1240, TW, 280);
    g.fillStyle = P.paper;
    for (let y = 1250; y < 1520; y += 7 + (y - 1250) * 0.02) {
      const u = (y - 1250) / 270;
      for (let x = q() * 60; x < TW; x += 40 + q() * 90) g.fillRect(x, y, 20 + q() * 60 * (0.4 + u), 1 + u * 2.4);
    }
  });
  // near hill and fence: an ink hill with paper cuts following its top edge; posts with a lit edge; two wires
  const near = tile(H, (g) => {
    const q = rng(71), top = (x) => 1500 + 60 * Math.sin((x / TW) * Math.PI * 4) + 30 * Math.sin((x / TW) * Math.PI * 10 + 1);
    g.fillStyle = P.ink; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= TW; x += 20) g.lineTo(x, top(x)); g.lineTo(TW, H); g.closePath(); g.fill();
    g.strokeStyle = P.paper;
    for (let k = 1; k < 30; k++) {
      g.lineWidth = Math.max(0.6, 3.4 - k * 0.1); g.beginPath();
      for (let x = 0; x <= TW; x += 20) { const y = top(x) + k * 14 + Math.sin(x * 0.01 + k) * 3; x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
    }
    for (let x = 40; x < TW; x += 240 + q() * 60) {
      const b = top(x) + 30, h = 230 + q() * 40;
      g.fillStyle = P.ink; g.fillRect(x - 12, b - h, 24, h + 10);
      g.fillStyle = P.paper; g.fillRect(rtl ? x - 8 : x + 4, b - h + 6, 3, h - 10);
      g.fillStyle = P.ink; g.fillRect(x - 15, b - h - 6, 30, 8);
    }
    g.strokeStyle = P.paper; g.lineWidth = 2.4;
    for (const dy of [150, 90]) { g.beginPath(); for (let x = 0; x <= TW; x += 20) { const y = top(x) + 30 - dy + 10 * Math.sin(x * 0.026); x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  });
  const out = { P, sky, layers: [[far, 0.12], [mid, 0.22], [forest, 0.38], [water, 0.6], [near, 1]] };
  cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, B = build(W, H, brand, T), TW = T.tile, rtl = brand.dir !== 'ltr';
  return {
    pal: B.P,
    cam: (t) => (t + clock) * T.speed,
    draw(ctx, t) {
      const cam = (t + clock) * T.speed;
      ctx.drawImage(B.sky, 0, 0);
      for (const [c, f] of B.layers) {
        const s = rtl ? 1 : -1, x = ((((s * cam * f) % TW) + TW) % TW) - TW;   // the world slides toward the reading side's far end
        ctx.drawImage(c, x, 0); if (x + TW < W) ctx.drawImage(c, x + TW, 0);
      }
    },
  };
}
