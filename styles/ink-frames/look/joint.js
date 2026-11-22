// The ink-frames joint: the next page arrives as the next panel. A slanted gutter (paper, with an inked edge either side) sweeps across
// in reading order; the new page is already printed behind it. Tonal: only a strip of paper and two ink rules cross the frame.
import { ease } from '/engine/kit.js';
import { palette } from './motion.js';
export function create({ W, H, brand }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr', lean = 260, g = 30;
  return {
    draw(ctx, from, to, p) {
      ctx.drawImage(from, 0, 0);
      const q = ease.inOutCubic(p), span = W + lean + g * 2;
      // edge x at the top of the frame, measured from the reading side; the cut leans so its foot trails
      const e = q * span - g;
      const xTop = rtl ? W - e : e, xBot = rtl ? xTop + lean : xTop - lean;
      const side = (dx) => { ctx.beginPath(); ctx.moveTo(xTop + dx, 0); ctx.lineTo(xBot + dx, H); ctx.lineTo(rtl ? W + lean + 100 : -lean - 100, H); ctx.lineTo(rtl ? W + lean + 100 : -lean - 100, 0); ctx.closePath(); };
      const back = rtl ? g : -g;
      ctx.save(); side(back); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore();
      ctx.save(); ctx.fillStyle = P.paper; ctx.beginPath();
      ctx.moveTo(xTop, 0); ctx.lineTo(xBot, H); ctx.lineTo(xBot + back, H); ctx.lineTo(xTop + back, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 7;
      for (const dx of [0, back]) { ctx.beginPath(); ctx.moveTo(xTop + dx, -10); ctx.lineTo(xBot + dx, H + 10); ctx.stroke(); }
      ctx.restore();
    },
  };
}
