// The riso joint: one pass of the accent drum. A band of accent ink runs down the frame, multiplied over whatever it crosses, with a
// strip of halftone ink trailing it; above the band the next sheet is already printed, below it the old one still shows.
import { ease, rng } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look }) {
  const P = palette(brand, look), S = look.tokens.screen, band = 96;     // narrow: a wide dark band reads as a whole-frame flash
  const c = S.cell, tile = document.createElement('canvas'); tile.width = tile.height = c;
  const g = tile.getContext('2d'); g.fillStyle = P.ink; g.beginPath(); g.arc(c / 2, c / 2, c * Math.sqrt(S.ink / Math.PI), 0, Math.PI * 2); g.fill();
  const r = rng(29), wob = Array.from({ length: 13 }, () => (r() - 0.5) * 8);     // the band's edge is not a ruler line
  const made = new Map();
  const edge = (ctx, y) => { ctx.moveTo(0, y + wob[0]); for (let i = 1; i < wob.length; i++) ctx.lineTo((W * i) / (wob.length - 1), y + wob[i]); };
  return {
    draw(ctx, from, to, p) {
      const y = -band + (H + band * 2) * ease.inOutCubic(p), mid = y + band / 2;
      ctx.drawImage(from, 0, 0);
      if (mid > 0) { const h = Math.min(H, mid); ctx.drawImage(to, 0, 0, W, h, 0, 0, W, h); }
      if (!made.has(ctx.canvas)) { const pt = ctx.createPattern(tile, 'repeat'); pt.setTransform(new DOMMatrix().rotate(S.angleInk)); made.set(ctx.canvas, pt); }
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = made.get(ctx.canvas); ctx.fillRect(0, y - 28, W, 22);
      ctx.beginPath(); edge(ctx, y); ctx.lineTo(W, y + band); ctx.lineTo(0, y + band); ctx.closePath(); ctx.fillStyle = P.accent; ctx.fill();
      ctx.restore();
    },
  };
}
