// The data ending: a ring is drawn around the logo like a dial closing on its full value, a dot riding its end; then the name lands
// flush to the reading side over a ruled axis with ticks, the handle in the mono face, the slogan in the quiet tone. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const R = 150, cx = rtl ? SAFE.right - R - 10 : SAFE.left + R + 10, cy = 470;
  const yName = cy + R + 90 + name.lead / 2, yAxis = yName + name.lead / 2 + 14, yHandle = yAxis + 44 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const rise = (t, t0, size) => (w, i, box, c) => { if (M.arrive(c, span(t, t0 + i * T.dur.stagger, t0 + i * T.dur.stagger + T.dur.in), box, size, rtl) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pt = M.D(span(t, 0, 0.4));
      if (pt > 0) { ctx.save(); ctx.strokeStyle = pal.track; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pt); ctx.stroke(); ctx.restore(); }
      const pr = M.D(span(t, 0.25, 1.15));
      if (pr > 0) {
        const a1 = -Math.PI / 2 + (rtl ? -1 : 1) * Math.PI * 2 * pr;
        ctx.save(); ctx.strokeStyle = pal.accent; ctx.lineWidth = 14; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, a1, rtl); ctx.stroke();
        ctx.fillStyle = pal.text; ctx.beginPath(); ctx.arc(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      const pl = M.E(span(t, 0.9, 1.3));
      if (pl > 0) {
        const s = R * 1.15 * (0.92 + 0.08 * pl);
        ctx.save(); ctx.globalAlpha = pl; brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, pal.text); ctx.restore();
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'start', color: pal.text, each: rise(t, 1.2, name.size) });
      const pa = M.D(span(t, 1.35, 1.35 + T.dur.draw));
      M.rule(ctx, SAFE.left, SAFE.right, yAxis, pa, pal.axis, 2, rtl);
      M.ticks(ctx, SAFE.left, SAFE.right, yAxis, maxW / 10, pa, pal.axis, rtl, 10);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'start', color: pal.keyText, each: rise(t, 1.6, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'start', color: pal.muted, each: rise(t, 1.8, slogan.size) });
    },
  };
}
