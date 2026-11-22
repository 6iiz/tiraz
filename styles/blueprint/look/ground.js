// The blueprint ground: a drafting sheet in the brand's darker colour, a fine 24 px grid with a heavier line every fifth, a double
// border with ticks at every major line, and registration crosses in the corners. In the first second of the reel the sheet is ruled
// (lines grow along their length, the border is traced); after that it is still, drawn from a picture made once.
// Uses `clock`, so the ruling does not repeat at every scene.
import { rgba, span, clamp } from '/engine/kit.js';
import { inks, plot } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, G = T.grid, ink = inks(brand, T.tone);
  const minor = rgba(ink.light, T.tone.minor), major = rgba(ink.light, T.tone.major), border = rgba(ink.light, T.tone.border);
  const b = G.border;

  function paint(c, p) {
    c.fillStyle = ink.sheet; c.fillRect(0, 0, W, H);
    // a faint lift in the middle, the way light falls on a sheet pinned to a board
    const g = c.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, H * 0.75);
    g.addColorStop(0, rgba(ink.light, 0.045)); g.addColorStop(1, rgba(ink.light, 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const grow = (k, n) => plot(clamp(p * 1.6 - (k / n) * 0.6));
    c.lineWidth = 1;
    for (let x = b, k = 0; x <= W - b; x += G.minor, k++) {
      const q = grow(k, W / G.minor); if (q <= 0) continue;
      c.strokeStyle = (x - b) % G.major === 0 ? major : minor;
      c.beginPath(); c.moveTo(x + 0.5, b); c.lineTo(x + 0.5, b + (H - 2 * b) * q); c.stroke();
    }
    for (let y = b, k = 0; y <= H - b; y += G.minor, k++) {
      const q = grow(k, H / G.minor); if (q <= 0) continue;
      c.strokeStyle = (y - b) % G.major === 0 ? major : minor;
      c.beginPath(); c.moveTo(W - b, y + 0.5); c.lineTo(W - b - (W - 2 * b) * q, y + 0.5); c.stroke();
    }
    // the double border, traced from the top corner on the reading side
    const tr = plot(clamp(p * 1.4 - 0.2)), per = 2 * (W + H - 4 * b);
    c.strokeStyle = border;
    for (const [inset, lw] of [[b, 2], [b + 10, 1]]) {
      c.lineWidth = lw; c.setLineDash([per * tr, per]); c.beginPath();
      c.moveTo(W - inset, inset); c.lineTo(inset, inset); c.lineTo(inset, H - inset); c.lineTo(W - inset, H - inset); c.closePath(); c.stroke();
    }
    c.setLineDash([]);
    if (tr >= 1) {
      c.lineWidth = 1;
      for (let x = b + G.major; x < W - b; x += G.major) { c.beginPath(); c.moveTo(x + 0.5, b); c.lineTo(x + 0.5, b + 10); c.moveTo(x + 0.5, H - b); c.lineTo(x + 0.5, H - b - 10); c.stroke(); }
      for (let y = b + G.major; y < H - b; y += G.major) { c.beginPath(); c.moveTo(b, y + 0.5); c.lineTo(b + 10, y + 0.5); c.moveTo(W - b, y + 0.5); c.lineTo(W - b - 10, y + 0.5); c.stroke(); }
      for (const [x, y] of [[b + 50, b + 50], [W - b - 50, b + 50], [b + 50, H - b - 50], [W - b - 50, H - b - 50]]) {
        c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.moveTo(x - 22, y); c.lineTo(x + 22, y); c.moveTo(x, y - 22); c.lineTo(x, y + 22); c.stroke();
      }
    }
  }

  const done = document.createElement('canvas'); done.width = W; done.height = H;
  paint(done.getContext('2d'), 1);
  return {
    ink,
    draw(ctx, t) {
      const p = span(t + clock, -0.2, 0.9);
      if (p >= 1) ctx.drawImage(done, 0, 0); else paint(ctx, p);
    },
  };
}
