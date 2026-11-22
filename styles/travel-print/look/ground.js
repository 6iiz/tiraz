// The travel-print ground: a screen-printed landscape poster on cream stock. The upper two thirds are bare paper (where the words are
// printed); near the horizon the sky turns in stepped bands (a flat ink, then thinning stripes, then the next ink), never a gradient.
// A sun of concentric rings sits on the horizon and climbs very slowly through the reel; flat clouds drift above the safe area; three
// ranges of hills, each one flat ink laid a few px off register, fill the lower third, with a row of pines on the nearest.
// Paper fibre and pinholes are built once. Everything static is cached; per frame: two images, the clouds and the sun.
import { rng, rgba } from '/engine/kit.js';
import { palette, rings } from './motion.js';

export const HORIZON = 1300;
export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), M = 34;                                 // the bare paper margin round the print
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const back = mk(), front = mk(), b = back.getContext('2d'), f = front.getContext('2d'), r = rng(1937);
  // back: paper, the stepped sky bands
  b.fillStyle = P.paper; b.fillRect(0, 0, W, H);
  const band = (y0, y1, col, thin) => {                              // thin: stripes that thin out upward before the solid band
    b.fillStyle = col;
    if (thin) { let y = y0, k = 0; while (y < y1) { const h = 2 + k * 1.6, g = Math.max(3, 14 - k * 2.2); b.fillRect(M, y + g, W - 2 * M, h); y += g + h; k++; } }
    else b.fillRect(M, y0, W - 2 * M, y1 - y0);
  };
  band(1120, 1176, P.sky1, true); band(1176, 1222, P.sky1); band(1222, 1252, P.sky2, true); band(1252, HORIZON + 40, P.sky2);
  // front: three ranges of hills, each a flat ink, with its off-register ghost under it
  const ridge = (base, amp, seed, step = 18) => { const pts = []; for (let x = M - 10; x <= W - M + 10; x += step) {
    const y = base + amp * (0.55 * Math.sin(x * 0.0061 + seed) + 0.3 * Math.sin(x * 0.0173 + seed * 2.1) + 0.15 * Math.sin(x * 0.041 + seed * 3.3)); pts.push([x, y]); } return pts; };
  const hill = (pts, col, ghost, dx, dy) => {
    for (const [c, ox, oy] of [[ghost, dx + 3, dy + 3], [col, dx, dy]]) {
      f.fillStyle = c; f.beginPath(); f.moveTo(M, H - M); pts.forEach(([x, y]) => f.lineTo(Math.max(M, Math.min(W - M, x + ox)), y + oy)); f.lineTo(W - M, H - M); f.closePath(); f.fill();
    }
  };
  f.save(); f.beginPath(); f.rect(M, 0, W - 2 * M, H - M); f.clip();
  hill(ridge(HORIZON - 30, 70, 0.7), P.far, P.mid, 2, 0);
    const midPts = ridge(1450, 90, 2.4, 14); hill(midPts, P.mid, P.near, -2, 1);
  // the shade face of the middle range: a second flat ink laid along its foot, its top a gentler ridge
  const shade = ridge(1505, 45, 5.2, 14).map(([x, y], i) => [x, Math.max(y, midPts[i] ? midPts[i][1] + 30 : y)]);
  f.fillStyle = P.ghost; f.beginPath(); f.moveTo(M, H - M); shade.forEach(([x, y]) => f.lineTo(Math.max(M, Math.min(W - M, x)), y)); f.lineTo(W - M, H - M); f.closePath(); f.fill();
  const nearPts = ridge(1610, 60, 4.1, 12); hill(nearPts, P.near, P.mid, 1, -1);
  // pines on the near range
  for (let i = 0; i < 26; i++) {
    const x = M + 20 + r() * (W - 2 * M - 40), base = nearPts[Math.min(nearPts.length - 1, Math.round((x - M + 10) / 12))][1] + 6, h = 50 + r() * 90, w = h * 0.34;
    f.fillStyle = P.near; f.beginPath(); f.moveTo(x, base - h);
    for (let k = 0; k < 4; k++) { const yy = base - h + (h * (k + 1)) / 4, ww = w * (0.4 + 0.6 * (k + 1) / 4); f.lineTo(x + ww, yy); f.lineTo(x + ww * 0.45, yy); }
    for (let k = 3; k >= 0; k--) { const yy = base - h + (h * (k + 1)) / 4, ww = w * (0.4 + 0.6 * (k + 1) / 4); f.lineTo(x - ww * 0.45, yy); f.lineTo(x - ww, yy); }
    f.closePath(); f.fill();
  }
  f.restore();
  // fibre and pinholes: specks of ink on the paper, specks of paper in the inks
  for (let i = 0; i < 9000; i++) { const x = r() * W, y = r() * H, top = y < 1110;
    f.fillStyle = top ? rgba(P.ink, 0.035 + r() * 0.04) : rgba(P.paper, 0.12 + r() * 0.2); f.fillRect(x, y, 1 + r() * 2.2, 1 + r() * 1.4); }
  for (let i = 0; i < 160; i++) { f.strokeStyle = rgba(P.ink, 0.05); f.lineWidth = 1; const x = r() * W, y = r() * 1100, a = r() * 6.28, l = 6 + r() * 14;
    f.beginPath(); f.moveTo(x, y); f.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); f.stroke(); }
  const clouds = [[0.18, 200, 300, 34], [0.62, 236, 220, 26], [0.9, 170, 160, 22]];
  return {
    P, paper: P.paper, ink: P.ink, M,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(back, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(M, 0, W - 2 * M, H); ctx.clip();
      for (const [u, y, w, h] of clouds) {                         // flat cloud bars drifting with the reading direction
        const x = ((u * (W + w) + time * 14 * (brand.dir !== 'ltr' ? -1 : 1)) % (W + w) + (W + w)) % (W + w) - w;
        ctx.fillStyle = P.sky1; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
        ctx.fillStyle = P.sky2; ctx.fillRect(x + h / 2, y + h - 6, w - h, 6);
      }
      // the sun climbs about 60 px over a reel
      const sy = HORIZON + 40 - Math.min(40, time * 1.5), sx = brand.dir !== 'ltr' ? W * 0.32 : W * 0.68;
      rings(ctx, sx + 3, sy + 2, 200, 5, [P.mid], 1);
      rings(ctx, sx, sy, 200, 5, [P.ring, P.accent], 1);
      ctx.restore();
      ctx.drawImage(front, 0, 0);
    },
  };
}
