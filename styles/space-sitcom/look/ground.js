// The alien night: a sky in flat bands from the brand's dark colour toward its accent, flat four-point stars, a ringed planet and a
// small moon (each with a hard shadow crescent), then two ridges of lumpy ground with craters and a few bulb plants. Everything has the
// thick dark boiling outline, so the backdrop is painted three times (the three boil drawings) once per palette and picked by the clock.
import { rng, rgba } from '/engine/kit.js';
import { palette, shape, stroke, ellipse, polyline, drawing } from './motion.js';

const cache = new Map();
function paint(W, H, P, T, k) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), r = rng(4242), G = T.land;
  const bands = [0, 520, 900, 1160, G.back];
  bands.forEach((y, i) => { g.fillStyle = P.sky[i] ?? P.sky[3]; g.fillRect(0, y, W, H - y); });
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = r() * (G.back - 60), s = 3 + r() * 7; g.fillStyle = rgba(P.light, 0.35 + r() * 0.5);
    g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s * 0.6, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s * 0.6, y); g.quadraticCurveTo(x, y, x, y - s); g.fill();
  }
  // ringed planet (upper corner) and a small moon
  const px = 880, py = 175;
  stroke(g, P, ellipse(px, py, 150, 34, 0, 0), k, 10, P.grey, 61);
  shape(g, P, ellipse(px, py, 84, 84), k, { fill: P.blob, shadow: P.blobShade, seed: 62, sx: -26, sy: -20 });
  g.save(); g.beginPath(); g.rect(0, py, W, 200); g.clip(); stroke(g, P, ellipse(px, py, 150, 34, 0, 0), k, 10, P.grey, 61); g.restore();
  shape(g, P, ellipse(150, 230, 40, 40), k, { fill: P.skin, shadow: P.shade, seed: 63, sx: 12, sy: -10 });
  // ridges
  const ridge = (y0, amp, seed) => { const pts = [[-20, H + 20]]; for (let x = -20; x <= W + 20; x += 8) pts.push([x, y0 - amp * (0.6 * Math.sin(x * 0.006 + seed) + 0.4 * Math.sin(x * 0.017 + seed * 2))]); pts.push([W + 20, H + 20]); return pts; };
  shape(g, P, ridge(G.back, 40, 1), k, { fill: P.land2, seed: 64 });
  shape(g, P, ridge(G.front, 24, 4), k, { fill: P.land, seed: 65 });
  for (const [x, y, w] of [[140, G.front + 120, 70], [930, G.front + 70, 50], [610, G.front + 330, 90]]) shape(g, P, ellipse(x, y, w, w * 0.3), k, { fill: P.land2, width: 5, seed: 66 + x });
  for (const [x, h] of [[60, 120], [1010, 150], [470, 70]]) {
    const yb = G.front + 18; stroke(g, P, polyline([[x, yb], [x + 10, yb - h * 0.5], [x - 6, yb - h]]), k, 8, P.line, 70 + x);
    shape(g, P, ellipse(x - 6, yb - h - 20, 24, 28), k, { fill: P.accent, width: 6, seed: 71 + x });
  }
  return cv;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), id = P.dark + P.light + P.accent;
  if (!cache.has(id)) cache.set(id, [0, 1, 2].map((k) => paint(W, H, P, T, k)));
  const set = cache.get(id);
  return {
    P,
    k: (t) => drawing(t + clock),
    draw(ctx, t) { ctx.drawImage(set[drawing(t + clock)], 0, 0); },
  };
}
