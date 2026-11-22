// The lamp-shadows ending: a medallion of deeply dyed hide is pressed to the screen on its rod with the brand's logo cut through it, so the
// logo is lamp light. The name follows as a hard shadow, then the handle and the slogan as softer ones, while the lamp is turned up and the
// middle of the screen glows. The medallion keeps turning slowly on its rivet. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl, dir = rtl ? 1 : -1;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const R = 175, med = M.medallion(R, P.deep, P, 91);
  const block = 2 * R + 50 + name.height + handle.height + (slogan ? slogan.height + 10 : 0);
  const top = kit.place(block, 700), cy = top + R, yName = cy + R + 50 + name.lead / 2;
  const yHandle = yName + name.lead / 2 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const words = (t, t0, gapW) => (w, i, box, c) => { const s0 = t0 + i * gapW, mx = box.x + box.width / 2; if (M.press(c, span(t, s0, s0 + T.dur.press), mx, box.y, dir) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, M.O(span(t, 1.2, 2.4)) * (0.9 + 0.1 * M.flick(t)));
      ctx.save();
      if (M.press(ctx, span(t, 0.05, 0.5), W / 2, cy, dir) !== false) {
        ctx.translate(0, M.bob(t, 0.5, 3));
        M.rod(ctx, W / 2 + R * 0.55 * dir, cy + R * 0.8, 80 * dir, 240, P);
        ctx.save(); ctx.translate(W / 2, cy); ctx.rotate(0.05 * Math.sin(t * 0.7));
        M.lay(ctx, med, 0, 0);
        brand.logo.draw(ctx, -R * 0.48, -R * 0.48, R * 0.96, P.screen);
        ctx.restore();
      }
      ctx.restore();
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.ink, each: words(t, 0.55, 0.08) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.soft, each: words(t, 0.95, 0.05) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.soft, each: words(t, 1.2, 0.06) });
    },
  };
}
