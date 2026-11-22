// The street wash ground: a sketchbook page in the brand's lighter colour, with the tooth of cold-pressed paper, a soft mottle and the
// shadow of the binding on the reading side. At the foot of the page, below the safe area, a street is sketched on the spot: building
// fronts, a few window marks, a lamp, a tree, the kerb, drawn in a thin wobbling pen in the first second and a half, then coloured with
// loose washes that sit a little off the lines and fray into dabs toward the page edge. Two birds, drawn in two strokes each, keep
// crossing the sky above the roofs, so the page is never still. Built once per brand; uses `clock`.
import { span, rng, rgba } from '/engine/kit.js';
import { palette, pen, box, draw, drawAll, patch, drop, E } from './motion.js';

const cache = new Map();
function build(W, H, pal) {
  const key = pal.paper + pal.ink + pal.accent; if (cache.has(key)) return cache.get(key);
  const r = rng(1987);
  const paper = document.createElement('canvas'); paper.width = W; paper.height = H;
  const g = paper.getContext('2d');
  g.fillStyle = pal.paper; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) { const x = r() * W, y = r() * H, rad = 220 + r() * 320, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba(pal.ink, 0.022)); gr.addColorStop(1, rgba(pal.ink, 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  const tile = document.createElement('canvas'); tile.width = tile.height = 160; const tg = tile.getContext('2d');
  for (let i = 0; i < 1300; i++) { tg.fillStyle = rgba(r() < 0.55 ? pal.ink : "#ffffff", 0.015 + r() * 0.025); tg.beginPath(); tg.arc(r() * 160, r() * 160, 0.6 + r() * 1.8, 0, 7); tg.fill(); }
  g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, W, H);

  // the street: building fronts standing on a kerb line, sketched; their washes; the order is the order they are drawn
  const kerb = 1790, strokes = [], washes = [];
  let x = -30, k = 0;
  while (x < W + 20) {
    const w = 110 + r() * 120, h = 160 + r() * 190, top = kerb - h, seed = 100 + k * 17;
    const S = box(x, top, w, h, seed);
    if (r() < 0.45) S.push(pen([[x - 6, top], [x + w / 2, top - 40 - r() * 50], [x + w + 6, top]], seed + 9));     // a pitched roof
    else S.push(pen([[x - 8, top - 14], [x + w + 8, top - 14]], seed + 9, { over: 4 }));                              // a cornice
    const rows = Math.floor(h / 70), cols = Math.max(1, Math.floor(w / 46));
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) if (r() < 0.55) {                                     // window marks, suggested
      const wx = x + 16 + j * (w - 32) / cols + r() * 4, wy = top + 26 + i * 70;
      S.push(pen([[wx, wy], [wx, wy + 26]], seed + 20 + i * 7 + j, { over: 2, wob: 0.6, gap: false }));
      if (r() < 0.6) S.push(pen([[wx + 4, wy], [wx + 18, wy]], seed + 40 + i * 7 + j, { over: 2, wob: 0.5, gap: false }));
    }
    strokes.push(S);
    const col = k % 3 === 1 ? pal.accent : pal.ink, a = col === pal.accent ? 0.42 : 0.16;
    washes.push({ P: patch(w * (0.75 + r() * 0.2), h * (0.6 + r() * 0.35), col, a, seed + 3), x: x + w * 0.05, y: top + h * 0.05, off: [6 + r() * 6, -4 - r() * 6] });
    x += w + (r() < 0.3 ? 30 + r() * 30 : -2); k++;
  }
  // a lamp and a tree in front, the kerb itself
  const lx = W * 0.62;
  strokes.push([pen([[lx, kerb + 6], [lx, kerb - 260]], 501), pen([[lx, kerb - 260], [lx + 34, kerb - 268], [lx + 44, kerb - 246]], 502, { gap: false }), ...box(lx + 34, kerb - 246, 20, 22, 503)]);
  const tx = W * 0.3, tree = [pen([[tx, kerb + 4], [tx + 4, kerb - 120]], 601)];
  { // the crown: one scalloped outline round an oval, a few bumps, left open at the bottom where the trunk enters
    const pts = [], cx = tx + 6, cy = kerb - 190, n = 9;
    for (let k = 0; k <= n * 6; k++) { const s = k / (n * 6), a = Math.PI * 0.62 + s * Math.PI * 1.76, bump = Math.abs(Math.sin(s * n * Math.PI)) * 16; pts.push([cx + Math.cos(a) * (95 + bump), cy + Math.sin(a) * (75 + bump * 0.8)]); }
    tree.push(pen(pts, 611, { gap: false, over: 3 }));
    tree.push(pen([[tx + 2, kerb - 110], [tx - 30, kerb - 160]], 612, { gap: false, over: 3 }), pen([[tx + 3, kerb - 125], [tx + 36, kerb - 170]], 613, { gap: false, over: 3 }));
  }
  strokes.push(tree);
  washes.push({ P: patch(190, 150, pal.accent, 0.3, 620), x: tx - 95, y: kerb - 270, off: [10, -6] });
  strokes.push([pen([[-20, kerb + 8], [W + 20, kerb + 4]], 700, { over: 0 }), pen([[-20, kerb + 70], [W * 0.4, kerb + 66]], 701), pen([[W * 0.55, kerb + 72], [W + 20, kerb + 68]], 702)]);
  // frayed dabs where the colour runs out at the page edges
  const dabs = []; for (let i = 0; i < 18; i++) { const side = i % 2, dx = side ? W - 20 - r() * 120 : 20 + r() * 120; dabs.push({ P: patch(14 + r() * 30, 10 + r() * 22, r() < 0.5 ? pal.accent : pal.ink, 0.3, 800 + i), x: dx, y: 1420 + r() * 420, off: [0, 0] }); }
  const out = { paper, strokes, washes, dabs }; cache.set(key, out); return out;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand), L = build(W, H, pal), rtl = brand.dir !== 'ltr';
  const n = L.strokes.length;
  const bird = (x, y, s) => [pen([[x - s, y - s * 0.35], [x - s * 0.4, y - s * 0.4], [x, y]], 900, { wob: 0.4, over: 0, gap: false }), pen([[x, y], [x + s * 0.4, y - s * 0.45], [x + s, y - s * 0.3]], 901, { wob: 0.4, over: 0, gap: false })];
  return {
    pal, paper: pal.paper, ink: pal.ink,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(L.paper, 0, 0);
      // the binding's shadow on the reading side
      const sx = rtl ? W : 0, gr = ctx.createLinearGradient(sx, 0, rtl ? W - 70 : 70, 0);
      gr.addColorStop(0, rgba(pal.ink, 0.1)); gr.addColorStop(1, rgba(pal.ink, 0)); ctx.fillStyle = gr; ctx.fillRect(rtl ? W - 70 : 0, 0, 70, H);
      L.washes.forEach((w, i) => drop(ctx, w.P, w.x, w.y, span(time, 0.7 + (i / L.washes.length) * 0.9, 1.1 + (i / L.washes.length) * 0.9), w.off));
      L.dabs.forEach((w, i) => drop(ctx, w.P, w.x, w.y, span(time, 1.3 + i * 0.03, 1.7 + i * 0.03), w.off));
      L.strokes.forEach((S, i) => drawAll(ctx, S, span(time, -0.6 + (i / n) * 1.5, -0.25 + (i / n) * 1.5), pal.line, 2.2));
      // two birds crossing the sky, slowly, flapping by changing their span
      for (let b = 0; b < 2; b++) {
        const u = ((time * 22 + b * 430) % (W + 300)) - 150, xx = rtl ? W - u : u, yy = 1300 + b * 46 + Math.sin(time * 0.8 + b) * 10, s = 15 + 4 * Math.sin(time * 5 + b * 2);
        drawAll(ctx, bird(xx, yy, s), 1, pal.line, 2);
      }
    },
  };
}
