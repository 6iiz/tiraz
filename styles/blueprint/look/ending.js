// The blueprint ending: the logo is drawn as the subject of the sheet. Centre lines cross, a square is traced, the accent compass
// swings a circle inside it and the logo is plotted in the middle. Under it a title block is ruled, and the name, the handle (in the
// mono face) and the slogan are plotted into its cells. spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const ink = ground.ink, rtl = kit.rtl, L = SAFE.left, R = SAFE.right, inset = 30;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: R - L - 2 * inset, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: 38, maxW: R - L - 2 * inset, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW: R - L - 2 * inset, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 470, half = 170;
  const tb = 720, h1 = name.lead + 30, h2 = handle.lead + 26, h3 = slogan ? slogan.lead + 26 : 0, tbEnd = tb + h1 + h2 + h3;
  const plotIn = (t, t0, size) => (w, i, box, c) => {
    if (M.arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size, rtl, ink.accent) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.strokeStyle = rgba(ink.light, T.tone.guide * 1.4); ctx.lineWidth = 1.5;
      M.centre(ctx, cx, cy - half - 70, cx, cy + half + 70, span(t, 0, 0.4));
      M.centre(ctx, rtl ? cx + half + 70 : cx - half - 70, cy, rtl ? cx - half - 70 : cx + half + 70, cy, span(t, 0.1, 0.5));
      ctx.strokeStyle = rgba(ink.light, T.tone.line); ctx.lineWidth = 2;
      M.rect(ctx, cx - half, cy - half, 2 * half, 2 * half, span(t, 0.25, 0.85), rtl);
      ctx.strokeStyle = ink.accent; ctx.lineWidth = 3;
      M.circle(ctx, cx, cy, half - 14, span(t, 0.7, 1.2), rtl);
      // the logo, plotted behind a pen like a word
      const pl = span(t, 1.1, 1.6), ls = half * 1.08;
      if (pl > 0) {
        ctx.save();
        if (M.arrive(ctx, pl, { x: cx - ls / 2, y: cy, width: ls }, ls / 1.6, rtl, ink.accent) !== false) brand.logo.draw(ctx, cx - ls / 2, cy - ls / 2, ls, ink.light);
        ctx.restore();
      }
      // the title block
      ctx.strokeStyle = rgba(ink.light, T.tone.line); ctx.lineWidth = 2;
      M.rect(ctx, L, tb, R - L, tbEnd - tb, span(t, 1.2, 1.8), rtl);
      ctx.lineWidth = 1;
      M.seg(ctx, rtl ? R : L, tb + h1, rtl ? L : R, tb + h1, span(t, 1.5, 1.8));
      if (slogan) M.seg(ctx, rtl ? R : L, tb + h1 + h2, rtl ? L : R, tb + h1 + h2, span(t, 1.6, 1.9));
      kit.drawText(ctx, name, { x0: L + inset, x1: R - inset, y: tb + h1 / 2, align: 'start', color: ink.light, each: plotIn(t, 1.5, name.size) });
      kit.drawText(ctx, handle, { x0: L + inset, x1: R - inset, y: tb + h1 + h2 / 2, align: 'start', color: ink.light, each: plotIn(t, 1.9, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: L + inset, x1: R - inset, y: tb + h1 + h2 + h3 / 2, align: 'start', color: ink.dim, each: plotIn(t, 2.1, slogan.size) });
    },
  };
}
