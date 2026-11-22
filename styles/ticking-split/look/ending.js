// The ticking-split ending: the last countdown. Four cameras show the brand's logo at once, each framed differently (wide, close, from
// either side); at zero they close into one picture, the clock flips, and the logo stands whole in the accent with the name, the handle
// (mono face) and the slogan cut in under it. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock: clk, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl, A = T.area, gut = T.gutter;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock: clk });
  const M = await import(look.base + 'motion.js'), P = ground.palette, mono = ground.mono, vig = M.vignette(P);
  const maxW = SAFE.right - SAFE.left - 40, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle + 4, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, minPx: 44, where: 'the slogan' }) : null;
  const full = { x: A.x0, y: A.y0, w: A.x1 - A.x0, h: A.y1 - A.y0 }, hw = (full.w - gut) / 2, hh = (full.h - gut) / 2;
  const quads = [0, 1, 2, 3].map((i) => ({ x: A.x0 + (i % 2) * (hw + gut), y: A.y0 + Math.floor(i / 2) * (hh + gut), w: hw, h: hh }));
  const frames = [{ s: 0.55, dx: 0, dy: 0 }, { s: 1.5, dx: 0.25, dy: 0.2 }, { s: 1.2, dx: -0.3, dy: -0.1 }, { s: 2.2, dx: 0.1, dy: -0.3 }];
  const zero = 0.9, L = 330, lx = (W - L) / 2, ly = A.y0 + 70;
  const yName = ly + L + 60 + name.lead / 2, yHandle = yName + name.lead / 2 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + (slogan ? slogan.lead / 2 : 0);
  const logoC = P.keyText;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.clock(ctx, t, zero, P, mono, rtl, M.clockBox(T, rtl));
      const m = M.snap(span(t, zero, zero + T.dur.merge));
      if (m < 1) quads.forEach((Q, i) => {
        const R = M.lerpRect(Q, full, m), f = frames[i], s = f.s * (1 + t * 0.03);
        M.cell(ctx, R, P, mono, rtl, { vignette: vig, chip: 1 - m, code: `CAM ${i + 1}` });
        ctx.save(); ctx.beginPath(); ctx.rect(R.x + 1, R.y + 1, R.w - 2, R.h - 2); ctx.clip();
        const sz = Math.min(R.w, R.h) * s; brand.logo.draw(ctx, R.x + R.w / 2 - sz / 2 + f.dx * sz, R.y + R.h / 2 - sz / 2 + f.dy * sz, sz, logoC);
        ctx.restore(); M.cell(ctx, R, P, mono, rtl, { fill: false, chip: 1 - m, code: `CAM ${i + 1}` });
      });
      if (m <= 0) return;
      ctx.save(); ctx.globalAlpha = m; M.cell(ctx, full, P, mono, rtl, { vignette: vig, chip: 0 }); ctx.restore();
      const z = 1 + 0.02 * span(t, zero, d);
      brand.logo.draw(ctx, W / 2 - (L * z) / 2, ly + L / 2 - (L * z) / 2, L * z, logoC);
      if (t >= zero + 0.35) kit.drawText(ctx, name, { x0, x1, y: yName, color: P.text });
      if (t >= zero + 0.55) kit.drawText(ctx, handle, { x0, x1, y: yHandle, color: P.muted });
      if (slogan && t >= zero + 0.75) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: P.muted });
    },
  };
}
