// The Icon Motion ground: clean paper (the brand's lighter colour) between two bands of the cell pattern, two rows at the top and
// five at the bottom, each row sliding sideways by one whole cell every five beats, out of phase with its neighbours. A hairline in
// ink closes each band. The stage disc, where each part's pictogram acts, sits on the edge of the bottom band at the far side.
// Uses `clock`, so the bands never jump between scenes.
import { SAFE } from '/engine/kit.js';
import { palette, sheet, row, shift } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, C = T.cell, P = palette(brand), rtl = brand.dir !== 'ltr';
  const nTop = T.band.top, nBot = T.band.bottom, sh = sheet(P, W, C, nTop + nBot, 45);
  const stage = { x: rtl ? SAFE.left + T.stage.r + 30 : SAFE.right - T.stage.r - 30, y: T.stage.y, r: T.stage.r };
  return {
    P, C, stage, sheet: sh,
    time: (t) => t + clock,
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
      for (let j = 0; j < nTop; j++) row(ctx, sh, j, j * C, shift(time, j, C), C, W);
      for (let j = 0; j < nBot; j++) row(ctx, sh, nTop + j, T.band.bottomY + j * C, shift(time, nTop + j, C), C, W);
      ctx.fillStyle = P.ink; ctx.fillRect(0, nTop * C, W, 3); ctx.fillRect(0, T.band.bottomY - 3, W, 3);
    },
  };
}
