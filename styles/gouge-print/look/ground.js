// The gouge-print ground: a proof of one wood block. A narrow margin of paper (the brand's lighter colour) around a block inked in the
// brand's darker colour, its edge ragged as a plank's; the wood's grain runs down the block in faint lines. Above the safe area, rays of
// light are cut with a U-gouge, fanning from a sun beyond the top edge and turning very slowly; below it, a field is cut in furrows whose
// cuts grow wider toward the foot (wider cuts = more light), the way a woodcutter makes tone. Built once per brand; the turn uses `clock`.
import { rng, SAFE } from '/engine/kit.js';
import { palette, cutShape, cutPath } from './motion.js';

const made = new Map();
function build(W, H, P, T) {
  const key = [W, H, P.paper, P.ink, P.accent].join();
  if (made.has(key)) return made.get(key);
  const r = rng(1919), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), m = 24;
  g.fillStyle = P.paper; g.fillRect(0, 0, W, H);
  // the block, with a chipped edge
  g.fillStyle = P.ink; g.beginPath();
  const j = () => (r() - 0.5) * 7;
  g.moveTo(m + j(), m + j());
  for (let x = m; x <= W - m; x += 30) g.lineTo(x + j(), m + j());
  for (let y = m; y <= H - m; y += 30) g.lineTo(W - m + j(), y + j());
  for (let x = W - m; x >= m; x -= 30) g.lineTo(x + j(), H - m + j());
  for (let y = H - m; y >= m; y -= 30) g.lineTo(m + j(), y + j());
  g.closePath(); g.fill();
  g.save(); g.clip();
  // grain: long lines down the plank that swerve around two knots
  const knots = [[W * (0.2 + r() * 0.6), H * (0.3 + r() * 0.2)], [W * (0.2 + r() * 0.6), H * (0.62 + r() * 0.15)]];
  g.strokeStyle = P.grain;
  for (let i = 0; i < 70; i++) {
    const x0 = (i / 70) * W + r() * 10; g.lineWidth = 0.8 + r() * 1.6; g.beginPath();
    for (let y = 0; y <= H; y += 24) {
      let x = x0 + 6 * Math.sin(y * 0.004 + i);
      for (const [kx, ky] of knots) { const dy = (y - ky) / 140, dx = x - kx; x += Math.sign(dx || 1) * 60 * Math.exp(-dy * dy) * Math.exp(-(dx * dx) / 30000); }
      y ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  for (const [kx, ky] of knots) for (let k = 1; k <= 4; k++) { g.beginPath(); g.ellipse(kx, ky, 6 * k, 22 * k, 0, 0, Math.PI * 2); g.stroke(); }
  // the field below the safe area: furrows on low hills, cuts wider toward the foot
  const path = new Path2D(), top = SAFE.bottom + 150;
  for (let row = 0; top + row * 22 < H - 20; row++) {
    const yb = top + row * 22, w = 3 + row * 0.75;
    for (let x = 30 + r() * 60; x < W - 20; x += 50 + r() * 120) {
      const len = 40 + r() * 140, hill = (xx) => yb - 34 * Math.sin(xx * 0.004 + 1.3) * (1 - row / 30);
      cutPath(path, cutShape(x, hill(x), x + len, hill(x + len), w, 700 + row * 97 + Math.round(x)));
    }
  }
  g.fillStyle = P.paper; g.fill(path);
  g.restore();
  const rays = [];                                           // the sun's rays: cut once, turned at draw time
  for (let i = 0; i < 30; i++) {
    const a = Math.PI * (0.06 + (i / 29) * 0.88) + (r() - 0.5) * 0.03, r0 = 250 + r() * 40, r1 = r0 + 140 + r() * 190;
    rays.push(cutShape(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1, 7 + r() * 11, 900 + i));
  }
  const out = { cv, rays };
  made.set(key, out);
  return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), B = build(W, H, P, T), rtl = brand.dir !== 'ltr';
  const sx = rtl ? W * 0.72 : W * 0.28, sy = -150;
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(B.cv, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(30, 30, W - 60, 228); ctx.clip();
      ctx.translate(sx, sy); ctx.rotate(time * 0.008 * (rtl ? -1 : 1));
      const path = new Path2D(); for (const c of B.rays) cutPath(path, c, 1);
      ctx.fillStyle = P.paper; ctx.fill(path);
      ctx.restore();
    },
  };
}
