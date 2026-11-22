// The subtitle-wire sign-off: the crowd footage keeps drifting under the scrim; the logo is slammed on, on a square of the accent; the
// name is slammed on under it as a caption, the handle slides in as a label chip, and the slogan lands in chunks. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock: 0 });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 700, maxW: maxW - 60, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 800, maxW, minScale: 0.8, where: 'the slogan' }) : null;
  const S = 230, top = 400, yLogo = top + S / 2, yName = top + S + 40 + name.lead / 2, yHandle = yName + name.lead / 2 + 30 + handle.size * 0.75;
  const ySlogan = yHandle + handle.size * 0.75 + 40 + (slogan ? slogan.lead / 2 : 0);
  const ch = slogan ? M.chunks(slogan, 2) : null, cx = kit.rtl ? SAFE.right - S / 2 : SAFE.left + S / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, top);
      ctx.save();
      if (M.slam(ctx, span(t, 0.05, 0.05 + T.dur.slam), cx, yLogo, T) !== false) {
        ctx.fillStyle = P.accent; ctx.fillRect(cx - S / 2, top, S, S);
        brand.logo.draw(ctx, cx - S * 0.32, yLogo - S * 0.32, S * 0.64, P.onAccent);
      }
      ctx.restore();
      M.caption(kit, ctx, name, { y: yName, t, t0: 0.45, gap: 0, P, T });
      M.chip(kit, ctx, handle, { y: yHandle, p: span(t, 0.8, 0.8 + T.dur.chip), P, rtl: kit.rtl });
      if (slogan) M.caption(kit, ctx, slogan, { y: ySlogan, t, t0: 1.1, gap: T.caption.gap, P, T, ch });
    },
  };
}
