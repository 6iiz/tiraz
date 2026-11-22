// The felt-tip ground: one sheet of a matte pad in the brand's lighter colour, filling the frame. A gummed binding strip at the very top
// (under the app's own header), a faint paper formation and fibres, and the soft falloff of one lamp from the upper reading corner.
// What lives while a sheet holds: along the foot of the sheet (under the app's buttons) the black marker doodles a slow chain of loops,
// the way a hand doodles while it thinks. Built once per palette; the doodle runs on `clock`.
import { rgba, rng } from '/engine/kit.js';
import { palette, marker } from './motion.js';

const cache = new Map();
function build(W, H, P, rtl) {
  const key = [W, H, P.paper, P.ink, rtl].join();
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(808);
  g.fillStyle = P.paper; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H, s = 80 + r() * 220; const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, rgba(P.ink, 0.007)); gr.addColorStop(1, rgba(P.ink, 0)); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
  g.strokeStyle = rgba(P.ink, 0.06); g.lineWidth = 1;
  for (let i = 0; i < 300; i++) { const x = r() * W, y = r() * H, a = r() * 6.28, l = 4 + r() * 12; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l, y + Math.sin(a + 1) * l, x + Math.cos(a) * l * 1.5, y + Math.sin(a) * l * 1.5); g.stroke(); }
  const lx = rtl ? W : 0, lamp = g.createRadialGradient(lx, 0, 0, lx, 0, H * 1.1); lamp.addColorStop(0, 'rgba(255,255,255,0.05)'); lamp.addColorStop(1, rgba(P.ink, 0.035));
  g.fillStyle = lamp; g.fillRect(0, 0, W, H);
  g.fillStyle = P.strip; g.fillRect(0, 0, W, 64); g.fillStyle = rgba(P.ink, 0.12); g.fillRect(0, 64, W, 2);
  for (let x = 12; x < W; x += 14) { g.fillStyle = rgba(P.ink, 0.1); g.beginPath(); g.arc(x, 76, 2, 0, 6.29); g.fill(); }   // the perforation
  // the doodle: a chain of loops along the foot, as one long point list with a time per point
  const pts = []; let x = rtl ? W - 110 : 110, y0 = 1540, dir = rtl ? -1 : 1;
  for (let i = 0; i < 1400; i++) {
    const a = i * 0.3; x += dir * 2.6;
    if (x < 110 || x > W - 110) { dir = -dir; y0 += 110; if (y0 > 1800) break; }
    pts.push([x + Math.cos(a) * 24 * dir, y0 + Math.sin(a) * 26 + Math.sin(i * 0.02) * 10]);
  }
  const out = { cv, pts }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr', B = build(W, H, P, rtl), speed = look.tokens.doodle;
  return {
    P,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(B.cv, 0, 0);
      const n = Math.max(0, Math.min(B.pts.length, Math.floor(time * speed)));
      if (n > 1) marker(ctx, B.pts.slice(0, n + 1), 1, P.grey, 6);
    },
  };
}
