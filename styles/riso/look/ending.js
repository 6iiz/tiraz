// The riso ending: the sheet is printed one last time and brought into register. An accent disc and a halftone ink disc land far off
// register, then slide together until the error is the sheet's usual few pixels; the brand's logo is printed into the disc, and the name,
// handle and slogan feed in under it. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, feed, disc, overprint, blob, E } = await import(look.base + 'motion.js');
  const P = ground.P, maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 520, R = 215, yName = 870, yHandle = yName + name.lead / 2 + 40 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const rise = (t, t0, size) => (w, i, box, c) => { if (arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = 1 - E(span(t, 0.35, 1.0));                      // how far off register the two drums still are
      const reg = { x: ground.reg.x + k * 90, y: ground.reg.y - k * 60 };
      ctx.save();
      if (feed(ctx, span(t, 0, 0.4), 0, 0, cy - R - 60, W, 2 * R + 160) !== false) {
        disc(ctx, cx - 150 * k + R * 0.55, cy + R * 0.5, R * 0.55, ground.screen(ctx, 'ink'));
        overprint(ctx, reg, () => disc(ctx, cx, cy, R, P.accent));
      }
      ctx.restore();
      ctx.save();
      const s = R * 1.05;
      if (feed(ctx, span(t, 1.0, 1.35), 0, cx - s / 2, cy - s / 2, s, s) !== false) brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, P.on);
      ctx.restore();
      ground.wear(ctx);
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      kit.drawText(ctx, name, { x0: SAFE.left + reg.x, x1: SAFE.right + reg.x, y: yName + reg.y, color: P.accent, decor: true, each: rise(t, 1.3, name.size) });
      ctx.restore();
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: P.ink, each: rise(t, 1.3, name.size) });
      const rw = Math.max(handle.width, 200) + 60, pr = span(t, 1.6, 1.9);
      ctx.save();
      if (feed(ctx, pr, 0, cx - rw / 2 - 10, yHandle - handle.size, rw + 20, handle.size * 2) !== false)
        overprint(ctx, reg, () => blob(ctx, cx - rw / 2, yHandle - handle.size * 0.75, rw, handle.size * 1.5, 113, P.accent));
      ctx.restore();
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: P.on, each: rise(t, 1.7, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.soft, each: rise(t, 1.95, slogan.size) });
    },
  };
}
