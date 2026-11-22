// The bulletin sign-off: the picture panel runs the skyline once more, the channel plate (a slanted block of the accent) is switched
// in over it and the brand's logo is stamped into it; the handle rolls onto the tab, the name onto the strap, and the slogan is set
// under the strap on the studio wall. The skyline keeps panning under it all, so the long last shot is never still. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, D = T.dur, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const pic = M.picture(P, T, W, 0);
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: SAFE.right - SAFE.left - T.strap.end - 66, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 700, maxW: SAFE.right - SAFE.left - 120, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW: SAFE.right - SAFE.left, single: true, where: 'the slogan' }) : null;
  const st = M.strap({ kit, brand, P, T, tab: handle, text: name });
  const pw = 420, ph = 270, px = pic.x + (pic.w - pw) / 2, py = pic.y + (pic.h - ph) / 2 + 4, ySlogan = st.y1 + 40 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      pic.draw(ctx, t + 3);
      // the plate: switched in from the reading side on its slant, then the logo is stamped into it
      const pp = M.Q(span(t, 0, 0.45));
      if (pp > 0) {
        ctx.save(); ctx.translate((rtl ? 1 : -1) * (1 - pp) * 760, 0);
        ctx.fillStyle = P.ink; M.plate(ctx, px + 18, py + 18, pw, ph, 60); ctx.fill();
        ctx.fillStyle = P.accent; M.plate(ctx, px, py, pw, ph, 60); ctx.fill();
        const s = M.Q(span(t, 0.5, 0.75));
        if (s > 0) { const ls = 160 * (1.25 - 0.25 * s); ctx.globalAlpha = Math.min(1, s * 2.5); brand.logo.draw(ctx, px + pw / 2 - ls / 2, py + ph / 2 - ls / 2, ls, P.onAccent); }
        ctx.restore();
      }
      st.draw(ctx, { bar: 1, pTab: span(t, 0.7, 0.7 + D.tab), pText: span(t, 0.85, 0.85 + D.flip) });
      if (slogan) M.flip(ctx, span(t, 1.15, 1.15 + D.flip), 0, ySlogan - slogan.lead / 2, ySlogan + slogan.lead / 2,
        () => kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'start', color: P.ink, key: P.ink }));
    },
  };
}
