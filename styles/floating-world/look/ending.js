// The floating-world ending: the brand's seal is pressed onto the sheet (a square of the accent with the logo cut out of it, printed a
// hair off its key frame and settling), then the name unrolls beneath it in a cartouche, and the handle and slogan are uncovered under
// that. Mist and sea keep drifting while it holds. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, padX = T.pad.x, padY = T.pad.y;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: full - 2 * padX, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: full, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW: full, single: true, where: 'the slogan' }) : null;
  const S = 290, cx = W / 2, cy = 500, bw = Math.min(full, Math.max(name.width + 2 * padX, 560)), bh = name.height + 2 * padY;
  const bx = (W - bw) / 2, by = cy + S / 2 + 80, yHandle = by + bh + 40 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ps = span(t, 0.2, 0.5), reg = 1 + 3 * (1 - M.E(span(t, 0.45, 1.0)));
      if (ps > 0) {
        ctx.save(); ctx.translate(T.reg.x * reg, T.reg.y * reg); M.seal(ctx, brand, cx, cy, S, P, ps); ctx.restore();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.globalAlpha = Math.min(1, ps * 4);
        ctx.strokeRect(cx - S / 2 - 16, cy - S / 2 - 16, S + 32, S + 32); ctx.globalAlpha = 1;
      }
      M.scroll(ctx, span(t, 0.75, 0.75 + T.dur.unroll), 0, bx, by, bw, bh, rtl, P, () => {
        M.cartouche(ctx, bx, by, bw, bh, P);
        kit.drawText(ctx, name, { x0: bx + padX, x1: bx + bw - padX, y: by + padY + name.lead / 2, color: P.ink });
      });
      M.scroll(ctx, span(t, 1.3, 1.3 + T.dur.lead), 0, SAFE.left, yHandle - handle.lead / 2, full, handle.lead, rtl, P,
        () => kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: P.ink }), false);
      if (slogan) M.scroll(ctx, span(t, 1.6, 1.6 + T.dur.lead), 0, SAFE.left, ySlogan - slogan.lead / 2, full, slogan.lead, rtl, P,
        () => kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.soft }), false);
    },
  };
}
