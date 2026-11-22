// The wave-trace ground: the face of a scope tube. Near-black glass with a faint ambient of the beam's colour in its middle, the
// graticule (ten by ten square divisions, minor lines dotted, the two centre axes solid with fifth-of-a-division ticks), a vignette,
// and the rounded edge of the screen. A vector screen has no scanlines. Built once; nothing on the ground moves.
import { rgba } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), G = T.grid;
  const g = { x0: G.x, x1: G.x + G.div * 10, y0: G.y, y1: G.y + G.div * 10, div: G.div };
  g.cx = (g.x0 + g.x1) / 2; g.cy = (g.y0 + g.y1) / 2;
  const base = document.createElement('canvas'); base.width = W; base.height = H;
  {
    const c = base.getContext('2d');
    c.fillStyle = pal.tube; c.fillRect(0, 0, W, H);
    const a = c.createRadialGradient(g.cx, g.cy, 30, g.cx, g.cy, 760);
    a.addColorStop(0, rgba(pal.beam, T.tone.ambient)); a.addColorStop(1, rgba(pal.beam, 0)); c.fillStyle = a; c.fillRect(0, 0, W, H);
    c.fillStyle = pal.grid;
    for (let i = 0; i <= 10; i++) {
      const x = g.x0 + i * g.div, y = g.y0 + i * g.div;
      for (let k = g.y0; k <= g.y1; k += 8) c.fillRect(x - 1, k, 2, 2);
      for (let k = g.x0; k <= g.x1; k += 8) c.fillRect(k, y - 1, 2, 2);
    }
    c.fillStyle = pal.axis; c.fillRect(g.cx - 1, g.y0, 2, g.y1 - g.y0); c.fillRect(g.x0, g.cy - 1, g.x1 - g.x0, 2);
    c.strokeStyle = pal.axis; c.lineWidth = 2; c.strokeRect(g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0);
    for (let k = 0; k <= 50; k++) { const x = g.x0 + (k * g.div) / 5, y = g.y0 + (k * g.div) / 5, l = k % 5 ? 7 : 12; c.fillRect(x - 1, g.cy - l, 2, l * 2); c.fillRect(g.cx - l, y - 1, l * 2, 2); }
    const v = c.createRadialGradient(W / 2, H * 0.42, H * 0.3, W / 2, H * 0.42, H * 0.72);
    v.addColorStop(0, rgba(pal.tube, 0)); v.addColorStop(1, rgba('#000000', 0.55)); c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.fillStyle = rgba('#000000', 0.6); c.beginPath(); c.rect(0, 0, W, H); c.roundRect(g.x0 - 34, g.y0 - 34, g.x1 - g.x0 + 68, g.y1 - g.y0 + 68, 56); c.fill('evenodd');
  }
  return {
    pal, g,
    draw(ctx) { ctx.drawImage(base, 0, 0); },
  };
}
