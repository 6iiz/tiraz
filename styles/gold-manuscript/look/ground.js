// The manuscript ground: the whole frame is one painted picture. A deep mineral field (the accent sunk into the ink) carries a fine
// diaper lattice with a fleck of leaf at every crossing and three pearls of white lead in every lozenge; round it runs a painted border:
// a firm ink line, a band of gold leaf laid in squares, another ink line and a row of pearls, with a leaf quatrefoil in each corner.
// All of it is painted once. A frame lays it down, then re-lays only the leaf squares that a passing light is catching, so the border
// flashes square by square while the pigment stays matte.
import { rgba, rng } from '/engine/kit.js';
import { palette, leaf, passing, pearl } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = pal.field; g.fillRect(0, 0, W, H);
  const r = rng(1311), D = 96;
  g.strokeStyle = pal.fieldLine; g.lineWidth = 1.5; g.beginPath();                      // the diaper lattice
  for (let k = -H; k < W + H; k += D) { g.moveTo(k, 0); g.lineTo(k + H, H); g.moveTo(k + H, 0); g.lineTo(k, H); }
  g.stroke();
  for (let y = 0; y <= H + D; y += D / 2) for (let x = ((y / (D / 2)) % 2) * (D / 2); x <= W + D; x += D) {
    g.fillStyle = pal.fieldDot; g.fillRect(x - 3, y - 3, 6, 6);                          // leaf fleck on a crossing
    const cx = x + D / 2, cy = y;                                                          // white triad in the lozenge
    g.fillStyle = rgba(pal.lead, 0.18 + r() * 0.08);
    for (const [dx, dy] of [[0, -6], [-5, 4], [5, 4]]) { g.beginPath(); g.arc(cx + dx, cy + dy, 2.2, 0, Math.PI * 2); g.fill(); }
  }
  const tone = g.createRadialGradient(W / 2, H * 0.4, H * 0.15, W / 2, H * 0.4, H * 0.8);   // the pigment is a little thinner in the middle
  tone.addColorStop(0, rgba(pal.light, 0.05)); tone.addColorStop(1, rgba(pal.ink, 0.3)); g.fillStyle = tone; g.fillRect(0, 0, W, H);
  // the border
  const m = 30, b = 30;
  const bands = [leaf(m + b, m, W - 2 * m - 2 * b, b, pal, 11, 15), leaf(m + b, H - m - b, W - 2 * m - 2 * b, b, pal, 12, 15),
    leaf(m, m + b, b, H - 2 * m - 2 * b, pal, 13, 15), leaf(W - m - b, m + b, b, H - 2 * m - 2 * b, pal, 14, 15)];
  bands.forEach((l) => l.draw(g));
  g.fillStyle = pal.bole; for (const [x, y] of [[m, m], [W - m - b, m], [m, H - m - b], [W - m - b, H - m - b]]) g.fillRect(x, y, b, b);
  g.strokeStyle = pal.ink; g.lineWidth = 4; g.strokeRect(m, m, W - 2 * m, H - 2 * m); g.strokeRect(m + b, m + b, W - 2 * (m + b), H - 2 * (m + b));
  g.fillStyle = pal.vellum; g.fillRect(m + b + 2, m + b + 2, W - 2 * (m + b + 2), 3); g.fillRect(m + b + 2, H - m - b - 5, W - 2 * (m + b + 2), 3);
  g.fillRect(m + b + 2, m + b + 2, 3, H - 2 * (m + b + 2)); g.fillRect(W - m - b - 5, m + b + 2, 3, H - 2 * (m + b + 2));
  const pi = m + b + 16;
  for (let x = pi; x <= W - pi; x += 30) { pearl(g, x, pi, 3, pal); pearl(g, x, H - pi, 3, pal); }
  for (let y = pi + 30; y < H - pi; y += 30) { pearl(g, pi, y, 3, pal); pearl(g, W - pi, y, 3, pal); }
  for (const [x, y] of [[m + b / 2, m + b / 2], [W - m - b / 2, m + b / 2], [m + b / 2, H - m - b / 2], [W - m - b / 2, H - m - b / 2]]) {
    g.fillStyle = pal.ink;                                                                  // a quatrefoil on each corner
    for (const [dx, dy] of [[0, -14], [14, 0], [0, 14], [-14, 0]]) { g.beginPath(); g.arc(x + dx, y + dy, 16, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = pal.leaf;
    for (const [dx, dy] of [[0, -14], [14, 0], [0, 14], [-14, 0]]) { g.beginPath(); g.arc(x + dx, y + dy, 12, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = pal.accent; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); pearl(g, x, y, 4, pal);
  }
  return {
    pal,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(c, 0, 0);
      const light = passing(time, T.light, 0, W, H);
      for (const l of bands) l.draw(ctx, 1, light, true);
      ctx.save(); ctx.strokeStyle = pal.ink; ctx.lineWidth = 4; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m); ctx.strokeRect(m + b, m + b, W - 2 * (m + b), H - 2 * (m + b)); ctx.restore();
    },
    light: (time) => passing(time, T.light, 0, W, H),
  };
}
