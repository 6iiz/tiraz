// The street wash joint: the sketchbook page is turned. The old page folds away toward the binding on the reading side, narrowing as it
// turns, its face darkening a little as it tilts from the light; the new page lies under it with the turning page's soft shadow on it.
// Paper replaces paper: the brightness of the frame hardly moves.
import { rgba, contrast } from '/engine/kit.js';
export function create({ W, H, brand, look }) {
  const { bg, text } = brand.colors, lum = (c) => contrast(c, '#000000');
  const ink = lum(bg) >= lum(text) ? text : bg, rtl = brand.dir !== 'ltr';
  return {
    draw(ctx, from, to, p) {
      const q = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2, w = W * Math.cos(q * Math.PI / 2);   // the turning page's width seen flat
      ctx.drawImage(to, 0, 0);
      if (w < 1) return;
      const edge = rtl ? W - w : w;                                                                     // the free edge of the turning page
      // its shadow on the new page, just beyond the free edge
      const sh = ctx.createLinearGradient(edge, 0, rtl ? edge - 90 : edge + 90, 0);
      sh.addColorStop(0, rgba(ink, 0.18 * Math.sin(q * Math.PI))); sh.addColorStop(1, rgba(ink, 0));
      ctx.fillStyle = sh; ctx.fillRect(rtl ? edge - 90 : edge, 0, 90, H);
      // the turning page, squeezed toward the binding
      ctx.save(); ctx.drawImage(from, rtl ? edge : 0, 0, w, H);
      const tilt = ctx.createLinearGradient(rtl ? W : 0, 0, edge, 0);
      tilt.addColorStop(0, rgba(ink, 0)); tilt.addColorStop(1, rgba(ink, 0.12 * q));
      ctx.fillStyle = tilt; ctx.fillRect(rtl ? edge : 0, 0, w, H); ctx.restore();
    },
  };
}
