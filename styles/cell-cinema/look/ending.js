// The cell-cinema ending: the sheet zooms out (the window does not), and the brand's logo is computed into the cells: each cell inside
// the logo fires its rule, a flash and then the accent fill, spreading out from the middle, so close up it is a table and far away it is
// the logo. Under it the name, the handle and the slogan drop into merged ranges, the selection lands on the name, and the logo keeps a
// marching reference box. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette, Z = 0.45, S = M.sheet(T, W, rtl, Z);
  const mono = ground.mono;
  // the logo, sampled once at the centre of each cell of its block
  const lc = 11, lr = Math.round((lc * S.cw) / S.rh), c0 = Math.floor((S.cols - lc) / 2), rr0 = Math.round((330 - S.top) / S.rh);
  const L = S.rect(c0, rr0, c0 + lc - 1, rr0 + lr - 1);
  const cv = document.createElement('canvas'); cv.width = Math.ceil(L.w); cv.height = Math.ceil(L.h);
  const g = cv.getContext('2d', { willReadFrequently: true }), s = Math.min(L.w, L.h) * 0.92;
  brand.logo.draw(g, (L.w - s) / 2, (L.h - s) / 2, s, '#000000');
  const img = g.getImageData(0, 0, cv.width, cv.height).data, cells = [];
  for (let r = 0; r < lr; r++) for (let c = 0; c < lc; c++) {
    const R = S.rect(c0 + c, rr0 + r), px = Math.floor(R.x - L.x + R.w / 2), py = Math.floor(R.y - L.y + R.h / 2);
    if (img[(py * cv.width + px) * 4 + 3] > 127) cells.push({ R, dist: Math.hypot((c - lc / 2 + 0.5) * S.cw, (r - lr / 2 + 0.5) * S.rh) });
  }
  const far = Math.max(1, ...cells.map((q) => q.dist));
  const maxW = SAFE.right - SAFE.left - 40, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle + 4, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, minPx: 44, where: 'the slogan' }) : null;
  const rowsN = Math.ceil((name.size * 1.3) / S.rh), rowsH = Math.ceil((handle.size * 1.5) / S.rh), rowsS = slogan ? Math.ceil((slogan.height - slogan.lead + slogan.size * 1.5) / S.rh) : 0;
  const rN = rr0 + lr + 2, rH = rN + rowsN + 1, rS = rH + rowsH;
  const cA = 1, cB = S.cols - 2;
  const mid = (r, n) => S.yOf(r) + (n * S.rh) / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const z = 1 + (Z - 1) * (1 - (1 - span(t, 0, 0.6)) ** 3);
      ctx.save(); ctx.beginPath(); ctx.rect(0, T.grid.top - T.grid.headH, W, T.grid.bottom - T.grid.top + T.grid.headH); ctx.clip();
      ground.drawSheet(ctx, z);
      ctx.restore();
      M.formulaBar(ctx, T, P, mono, t, 0.1, M.ref(c0, rr0), `=LOGO(${M.ref(c0, rr0)}:${M.ref(c0 + lc - 1, rr0 + lr - 1)})`, W);
      if (z > Z + 0.001) return;
      for (const q of cells) M.paint(ctx, q.R, t, 0.65 + (q.dist / far) * 0.8, P.accent, P, T.dur.flash);
      M.refBox(ctx, L, P, t, span(t, 1.5, 1.7));
      if (t >= 1.45) { M.merged(ctx, S, cA, rN, cB, rN + rowsN - 1, P); kit.drawText(ctx, name, { x0, x1, y: mid(rN, rowsN), color: P.ink }); }
      if (t >= 1.65) { M.merged(ctx, S, cA, rH, cB, rH + rowsH - 1, P); kit.drawText(ctx, handle, { x0, x1, y: mid(rH, rowsH), color: P.muted }); }
      if (slogan && t >= 1.85) { M.merged(ctx, S, cA, rS, cB, rS + rowsS - 1, P); kit.drawText(ctx, slogan, { x0, x1, y: mid(rS, rowsS) - ((slogan.rows.length - 1) * slogan.lead) / 2, color: P.muted }); }
      if (t >= 1.45) M.selection(ctx, S.rect(cA, rN, cB, rN + rowsN - 1), P, t, rtl);
    },
  };
}
