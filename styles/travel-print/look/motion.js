// Travel-print motion: nothing slides, fades or bounces. Every layer is laid by a pull: a squeegee crosses the area from the reading
// side, a bead of the ink rolls in front of its rubber blade, and behind it the flat ink is down, opaque, with a ragged wet front.
// One ink per pull; a later ink covers an earlier one completely. This file also holds the inks (the palette) that every part shares.
import { clamp, mix, contrast, ease } from '/engine/kit.js';

export const PULL = (p) => ease.inOutQuad(p);          // the squeegee speeds up, crosses, slows at the far edge
export const O = (p) => clamp(p) ** 2.4;                // a layer lifted off at the end of a scene

// The inks, all from the brand: the lighter brand colour is the paper stock, the darker one the key ink, the accent the poster's
// colour. The other inks are mixes, stepped like a printer would mix them, never blended on screen.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const lighter = contrast(bg, '#000000') >= contrast(text, '#000000');
  const paper = lighter ? bg : text, ink = lighter ? text : bg;
  const readable = (c0, k) => { let c = mix(c0, paper, k); while (k > 0 && contrast(c, paper) < 4.6) { k -= 0.04; c = mix(c0, paper, Math.max(0, k)); } return c; };
  const onAccent = contrast(accent, paper) >= Math.max(3.2, contrast(accent, ink) * 0.7) ? paper : ink;
  return {
    paper, ink, accent, onAccent,
    muted: readable(ink, 0.35),
    sky1: mix(paper, accent, 0.13), sky2: mix(paper, accent, 0.28),
    ring: mix(paper, accent, 0.55),
    far: mix(mix(paper, accent, 0.42), ink, 0.22), mid: mix(accent, ink, 0.48), near: ink,
    blade: mix(ink, paper, 0.25), ghost: mix(ink, accent, 0.5),
    keyLine: contrast(accent, paper) >= 3 ? accent : mix(accent, ink, 0.45),
  };
}

// The ragged wet edge of a pull, a fixed function of position (no randomness): a few px of tooth.
const tooth = (v, seed) => 5 * Math.sin(v * 0.047 + seed) + 3.5 * Math.sin(v * 0.131 + seed * 1.7) + 2 * Math.sin(v * 0.37 + seed * 2.9);

// Lays what draw() paints with one pull across box {x0, x1, y0, y1}. dir 'start' crosses from the reading side, 'down' from the top.
// p 0..1 is the blade's travel. Before 0 nothing is drawn; at 1 the layer is simply there. The blade and the ink bead ride the front.
export function pull(ctx, p, box, inkColor, pal, draw, { dir = 'start', rtl = true, seed = 1, blade = true } = {}) {
  if (p <= 0) return;
  if (p >= 1) { draw(); return; }
  const q = PULL(p), pad = 26, { x0, x1, y0, y1 } = box;
  ctx.save(); ctx.beginPath();
  if (dir === 'down') {
    const f = y0 - pad + (y1 - y0 + pad * 2) * q;
    ctx.moveTo(x0 - 40, y0 - 40); ctx.lineTo(x1 + 40, y0 - 40);
    for (let x = x1 + 40; x >= x0 - 40; x -= 12) ctx.lineTo(x, f + tooth(x, seed));
    ctx.closePath(); ctx.clip(); draw(); ctx.restore();
    if (blade) { const bx0 = x0 - 30, bw = x1 - x0 + 60;
      ctx.fillStyle = inkColor; ctx.fillRect(bx0 + 10, f + 8, bw - 20, 9);                  // the bead of ink pushed ahead
      ctx.fillStyle = pal.blade; ctx.fillRect(bx0, f - 3, bw, 11);                          // the rubber blade
      ctx.fillStyle = pal.ink; ctx.fillRect(bx0 + 4, f - 9, bw - 8, 5); }                  // the edge of the handle
    return;
  }
  const fromRight = rtl, span = x1 - x0 + pad * 2;
  const f = fromRight ? x1 + pad - span * q : x0 - pad + span * q;
  const far = fromRight ? x1 + 60 : x0 - 60;
  ctx.moveTo(far, y0 - 40); ctx.lineTo(far, y1 + 40);
  for (let y = y1 + 40; y >= y0 - 40; y -= 10) ctx.lineTo(f + tooth(y, seed), y);
  ctx.closePath(); ctx.clip(); draw(); ctx.restore();
  if (blade) {
    const s = fromRight ? -1 : 1, by0 = y0 - 34, bh = y1 - y0 + 68;
    ctx.fillStyle = inkColor; ctx.fillRect(s < 0 ? f - 26 : f + 17, by0 + 8, 9, bh - 16);   // the bead of ink, ahead of the blade
    ctx.fillStyle = pal.blade; ctx.fillRect(s < 0 ? f - 14 : f + 3, by0, 11, bh);           // the rubber blade
    ctx.fillStyle = pal.ink; ctx.fillRect(s < 0 ? f - 3 : f - 2, by0 + 4, 5, bh - 8);       // the edge of the handle
  }
}

// A flat ink laid slightly off register: the layer is printed at (dx, dy) and a thin darker ghost of it sits under one edge,
// where the ink laps the paper. draw(color) paints the shape in the colour it is given.
export function off(ctx, dx, dy, draw) { ctx.save(); ctx.translate(dx, dy); draw(); ctx.restore(); }

// Concentric rings of a printed sun: alternating inks, the inner disc last.
export function rings(ctx, cx, cy, r, n, inks, p = 1) {
  for (let i = 0; i < n; i++) {
    const rr = r * (1 - i / n) * clamp(p * 1.3 - i * 0.08) ; if (rr <= 0) continue;
    ctx.fillStyle = inks[i % inks.length]; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
  }
}
