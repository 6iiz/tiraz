// The duotone-press ground: a dark press bed (the brand's darker colour) with a sheet of the brand's light colour laid on it, a fine
// paper fibre in the sheet, trim marks at its corners, and at its foot, below the safe area, the printer's control strip: the tone
// scale of this duotone in seven patches, and a registration target. All of it is built once; the sheet does not move.
import { rng, rgba } from '/engine/kit.js';
import { palette, luts } from './motion.js';

export function create({ W, H, brand, look }) {
  const T = look.tokens, P = palette(brand, T), S = T.sheet, rtl = brand.dir !== 'ltr', LUT = luts(P, T);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(1839);
  g.fillStyle = P.night; g.fillRect(0, 0, W, H);
  g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 8; g.fillStyle = P.paper; g.fillRect(S.x, S.y, S.w, S.h); g.restore();
  g.save(); g.beginPath(); g.rect(S.x, S.y, S.w, S.h); g.clip();
  for (let i = 0; i < 9000; i++) { g.fillStyle = rgba(r() < 0.5 ? P.night : P.paper, T.tone.fibre * (0.3 + r())); const x = S.x + r() * S.w, y = S.y + r() * S.h, a = r() * Math.PI; g.fillRect(x, y, 1 + Math.cos(a) * 5, 1 + Math.sin(a) * 2); }
  g.restore();
  // trim marks on the bed, outside the sheet's corners
  g.fillStyle = P.rule;
  for (const [x, y] of [[S.x, S.y], [S.x + S.w, S.y], [S.x, S.y + S.h], [S.x + S.w, S.y + S.h]]) {
    const sx = x === S.x ? -1 : 1, sy = y === S.y ? -1 : 1;
    g.fillRect(x + (sx < 0 ? -20 : 4), y - 1, 16, 2); g.fillRect(x - 1, y + (sy < 0 ? -20 : 4), 2, 16);
  }
  // the control strip
  const sy = S.y + S.h - 70, pw = 46;
  for (let i = 0; i < 7; i++) {
    const k = Math.round((i / 6) * 255) * 3, x = rtl ? S.x + S.w - 60 - (i + 1) * pw : S.x + 60 + i * pw;
    g.fillStyle = `rgb(${LUT.rich[k]},${LUT.rich[k + 1]},${LUT.rich[k + 2]})`; g.fillRect(x, sy, pw - 4, 30);
  }
  const tx = rtl ? S.x + 60 : S.x + S.w - 60, ty = sy + 15;
  g.strokeStyle = P.night; g.lineWidth = 2; g.beginPath(); g.arc(tx, ty, 14, 0, Math.PI * 2); g.stroke();
  g.fillStyle = P.night; g.fillRect(tx - 22, ty - 1, 44, 2); g.fillRect(tx - 1, ty - 22, 2, 44);
  return {
    P, LUT, sheet: S,
    draw(ctx) { ctx.drawImage(cv, 0, 0); },
  };
}
