// The riso ground: a sheet of the brand's light colour with a fine paper grain, and at the foot of the frame (below the safe area,
// where nothing has to be read) a printed pair: an accent disc and an ink disc in halftone, overlapping so the overlap goes dark,
// as two drums do. They print in during the first second of the reel and then stay; the ground uses `clock`, so a cut does not reprint them.
// It also hands the parts what they share: the palette, this sheet's registration error, the halftone screens and the wear of the ink.
import { span, rng } from '/engine/kit.js';
import { palette, feed, disc, overprint, rgbOf } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, look), S = T.screen;
  // Each sheet is misregistered a little differently, but always the same way for the same scene.
  const r = rng(Math.round(clock * 1000) + 101), ang = r() * Math.PI * 2, mag = T.reg.min + r() * (T.reg.max - T.reg.min);
  const reg = { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag };

  // Specks of a colour on a transparent tile: `density` of the pixels, at up to `alpha`.
  const specks = (color, density, alpha, seed, fibres = 0) => {
    const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const g = cv.getContext('2d'), img = g.createImageData(N, N), q = rng(seed), [cr, cg, cb] = rgbOf(color);
    for (let i = 0; i < N * N; i++) {
      if (q() >= density) continue;
      img.data[i * 4] = cr; img.data[i * 4 + 1] = cg; img.data[i * 4 + 2] = cb; img.data[i * 4 + 3] = Math.round(255 * alpha * (0.35 + 0.65 * q()));
    }
    g.putImageData(img, 0, 0);
    g.strokeStyle = color; g.lineWidth = 0.8;
    for (let i = 0; i < fibres; i++) {
      const x = q() * N, y = q() * N, a = q() * Math.PI, l = 4 + q() * 10;
      g.globalAlpha = alpha * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    return cv;
  };
  // One halftone cell: a dot whose area is `density` of the cell. Repeated and turned to the screen angle, it is the tint of a drum.
  const cell = (color, density) => {
    const c = S.cell, cv = document.createElement('canvas'); cv.width = cv.height = c;
    const g = cv.getContext('2d'); g.fillStyle = color; g.beginPath(); g.arc(c / 2, c / 2, c * Math.sqrt(density / Math.PI), 0, Math.PI * 2); g.fill();
    return cv;
  };
  const grain = specks(P.ink, 0.05, T.tone.grain, 7, 60), wearTile = specks(P.paper, 0.03, T.tone.wear, 13, 40);
  const tiles = { ink: cell(P.ink, S.ink), accent: cell(P.accent, S.accent) };
  const made = new Map();                                     // patterns are made once per canvas they are used on
  const pattern = (ctx, tile, angle) => {
    const k = ctx.canvas; if (!made.has(k)) made.set(k, {});
    const box = made.get(k), id = tile === grain ? 'g' : tile === wearTile ? 'w' : tile === tiles.ink ? 'i' : 'a';
    if (!box[id]) { box[id] = ctx.createPattern(tile, 'repeat'); if (angle) box[id].setTransform(new DOMMatrix().rotate(angle)); }
    return box[id];
  };
  const screen = (ctx, which) => pattern(ctx, tiles[which], which === 'ink' ? S.angleInk : S.angleAccent);

  const rtl = brand.dir !== 'ltr', side = (x) => (rtl ? x : W - x);
  return {
    P, reg, paper: P.paper, ink: P.ink,
    screen,
    // the uneven coverage of riso ink: paper shows through in specks. Call it after shapes and before text.
    wear(ctx) { ctx.save(); ctx.fillStyle = pattern(ctx, wearTile); ctx.fillRect(0, 0, W, H); ctx.restore(); },
    draw(ctx, t) {
      const time = t + clock;
      ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = pattern(ctx, grain); ctx.fillRect(0, 0, W, H);
      const y0 = H - 560;
      ctx.save();
      if (feed(ctx, span(time, -0.4, 0.5), 0, 0, y0, W, H - y0) !== false) {
        disc(ctx, side(330), H - 150, 250, screen(ctx, 'ink'));
        overprint(ctx, reg, () => disc(ctx, side(720), H + 40, 380, P.accent));
      }
      ctx.restore();
      this.wear(ctx);
    },
  };
}
