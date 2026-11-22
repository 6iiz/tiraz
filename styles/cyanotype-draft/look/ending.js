// The cyanotype ending: the brand's logo is the last photogram. It develops white out of the coating with a soft glow at its edge,
// the way an object's shadow clears in the rinse, inside a thin drafting circle traced around it; a dimension line opens under it.
// The name develops below, then a rule, the handle in the mono face and the slogan in the softer white. spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 700, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.lead, weight: 500, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const L = 250, cx = W / 2, cy = 300 + L / 2 + 40, R = L * 0.78;
  const yDim = cy + R + 34, yName = yDim + 60 + name.lead / 2, yRule = yName + name.lead / 2 + 8;
  const yHandle = yRule + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const draw = (ctx, t, f, y, t0, to) => {
    const p = M.DEV(span(t, t0, t0 + T.dur.dev)); if (p <= 0) return;
    kit.drawText(ctx, f, { x0, x1, y, align: 'center', color: to, each: (w, i, b, c) => { c.translate(0, (1 - p) * 8); return M.tone(pal, p, to); } });
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pc = span(t, 0.05, 0.6);
      if (pc > 0) { ctx.save(); ctx.strokeStyle = pal.soft; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * M.DEV(pc)); ctx.stroke(); ctx.restore(); }
      const pl = M.DEV(span(t, 0.35, 1.1));
      if (pl > 0) {
        ctx.save(); ctx.shadowColor = rgba(pal.white, 0.55 * pl); ctx.shadowBlur = 30 * (1.4 - pl);
        brand.logo.draw(ctx, cx - L / 2, cy - L / 2, L, M.tone(pal, pl)); ctx.restore();
      }
      M.dimension(ctx, cx - L / 2, cx + L / 2, cy + L / 2 + 10, yDim, span(t, 0.9, 1.3), pal.soft);
      draw(ctx, t, name, yName, 1.05, pal.white);
      const pr = span(t, 1.3, 1.7), rw = maxW * 0.6 * M.DEV(pr);
      if (pr > 0) M.seg(ctx, cx - rw / 2, yRule, cx + rw / 2, yRule, 1, pal.soft, 2);
      draw(ctx, t, handle, yHandle, 1.45, pal.white);
      if (slogan) draw(ctx, t, slogan, ySlogan, 1.65, pal.soft);
    },
  };
}
