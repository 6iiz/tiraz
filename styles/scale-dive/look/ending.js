// The scale-dive ending: the last stop. The camera dives hard, a lock-on ring closes, and the brand's world grows out of the distance:
// a disc of the pointer colour with its hard glow rings and the logo set in it. The name, the handle (mono) and the slogan then come
// up out of the same point and settle under it. spec: { duration }
import { need, span, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, minPx: 44, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 520, R = 150;
  const yName = cy + R * 1.9 + 40 + name.lead / 2, yHandle = yName + name.lead / 2 + 18 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 22 + (slogan ? slogan.lead / 2 : 0);
  const rise = (t, t0) => (w, i, box, c) => { const s = t0 + i * 0.07; if (M.arrive(c, span(t, s, s + T.dur.in), box, cx, cy) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, 1.2 * ease.inOutCubic(span(t, 0, 1.2)));
      const lk = M.Q(span(t, 0.1, 1.1)), rr = M.logLerp(R * 4, R * 1.38, lk);
      const g = M.Q(span(t, 0.3, 1.2)), s = M.logLerp(0.08, 1, g);
      if (g > 0) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
        M.glow(ctx, 0, 0, R, pal, 0.62);
        M.disc(ctx, 0, 0, R, pal.sun, pal.sunTone(0.72), 0.16);
        const lp = span(t, 0.9, 1.3);
        if (lp > 0) { ctx.globalAlpha = lp; brand.logo.draw(ctx, -R * 0.56, -R * 0.56, R * 1.12, pal.onSun); }
        ctx.restore();
      }
      if (lk > 0) {
        M.ring(ctx, cx, cy, rr, pal.sun, 4);
        M.ring(ctx, cx, cy, rr + 18, pal.sun, 3, [2, 14], -(t + clock) * 20);
        ctx.fillStyle = pal.sun;
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4 + (1 - lk) * 0.9; ctx.save(); ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); ctx.rotate(a); ctx.fillRect(-26, -3, 30, 6); ctx.restore(); }
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.ink, each: rise(t, 1.25) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.ink, each: rise(t, 1.55) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.muted, each: rise(t, 1.75) });
    },
  };
}
