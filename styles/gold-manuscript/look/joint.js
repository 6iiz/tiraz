// The manuscript joint: the next picture is gilded over the last one. Squares of gold leaf are laid across the frame in a diagonal run
// from the reading side; each square, as it settles, uncovers the next scene beneath it, and its leaf fades as the run moves on. Only a
// narrow band of squares is bright at any moment, so the frame never floods with one colour.
import { clamp, mix, rng } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand, look }) {
  const pal = palette(brand, look.tokens), C = 90, nx = Math.ceil(W / C), ny = Math.ceil(H / C), rtl = brand.dir !== 'ltr', r = rng(5150), cells = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const di = rtl ? nx - 1 - i : i;
    cells.push({ x: i * C, y: j * C, k: (di + j * 0.55) / (nx + ny * 0.55) * 0.75 + r() * 0.08, tone: r() });
  }
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      for (const c of cells) {
        const q = clamp((p - c.k) / 0.12); if (q <= 0) continue;
        ctx.drawImage(to, c.x, c.y, C, C, c.x, c.y, C, C);
        const a = q < 0.5 ? q * 2 : (1 - q) * 2;                       // the leaf, bright as it lands, gone as the run passes
        if (a > 0.01) { ctx.save(); ctx.globalAlpha = a * 0.6; ctx.fillStyle = mix(pal.leafLo, pal.leaf, c.tone); ctx.fillRect(c.x + 1, c.y + 1, C - 2, C - 2); ctx.restore(); }
      }
    },
  };
}
