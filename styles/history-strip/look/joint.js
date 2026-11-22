// The history strip's joint: the camera travels across the comic page to the next panel. It pulls back a little as it goes (the
// table shows round the page for a moment), slides the way the page is read, and pushes in again on the next panel.
import { ease, mix, contrast } from '/engine/kit.js';
export function create({ W, H, brand }) {
  const { bg, text } = brand.colors, dir = brand.dir !== 'ltr' ? 1 : -1;
  const paper = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, ink = paper === bg ? text : bg;
  const table = mix(paper, ink, 0.22), gap = 50;
  return {
    draw(ctx, from, to, p) {
      const q = ease.inOutCubic(p), z = 1 - 0.16 * Math.sin(Math.PI * p), x = dir * (W + gap) * q;
      ctx.fillStyle = table; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      ctx.drawImage(from, x, 0); ctx.drawImage(to, x - dir * (W + gap), 0);
      ctx.restore();
    },
  };
}
