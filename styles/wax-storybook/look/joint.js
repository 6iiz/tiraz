// The storybook joint: the page turns. The free edge of the page lifts on the far side of the reading direction and sweeps across;
// the new page is uncovered under it, the back of the turning leaf (the paper a shade darker, shaded towards its fold) rides over the
// old page, and a soft shadow falls from the fold onto the new one. Paper over paper, so the frame never flashes.
import { ease, rgba, mix, contrast } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const { bg, text } = brand.colors, rtl = brand.dir !== 'ltr';
  const paper = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, ink = paper === bg ? text : bg;
  const back = mix(paper, ink, 0.07);
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), flap = Math.sin(Math.PI * Math.min(1, p * 1.1)) * 190 + 30;
      const f = q * (W + flap * 2);                                  // how far the fold has travelled from the free edge
      const fx = rtl ? f : W - f;                                     // where the fold is, in frame x
      ctx.drawImage(from, 0, 0);
      ctx.save(); ctx.beginPath(); if (rtl) ctx.rect(0, 0, fx, H); else ctx.rect(fx, 0, W - fx, H); ctx.clip();
      ctx.drawImage(to, 0, 0);
      const sh = ctx.createLinearGradient(fx, 0, rtl ? fx - 120 : fx + 120, 0);
      sh.addColorStop(0, rgba('#000000', 0.18)); sh.addColorStop(1, rgba('#000000', 0));
      ctx.fillStyle = sh; ctx.fillRect(rtl ? fx - 120 : fx, 0, 120, H); ctx.restore();
      const w = Math.min(flap, f), x0 = rtl ? fx : fx - w;            // the back of the leaf, over the old page
      if (w > 1) {
        ctx.fillStyle = back; ctx.fillRect(x0, 0, w, H);
        const g = ctx.createLinearGradient(fx, 0, rtl ? fx + w : fx - w, 0);
        g.addColorStop(0, rgba('#000000', 0.1)); g.addColorStop(0.5, rgba('#ffffff', 0.08)); g.addColorStop(1, rgba('#000000', 0.06));
        ctx.fillStyle = g; ctx.fillRect(x0, 0, w, H);
        ctx.fillStyle = rgba(ink, 0.25); ctx.fillRect(rtl ? fx + w - 2 : fx - w, 0, 2, H);
      }
    },
  };
}
