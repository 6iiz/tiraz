// The evidence-table ending: a slide mount is set down on the table with the brand's logo in its window as a negative (light on
// the dark film). The loupe comes down on it, and inside the glass the logo is seen positive, in the accent. Then the name settles on
// the table under it, the handle in the mono face on a catalogue card, and the slogan in a soft ink. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: maxW - 100, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const S = 330, mx = W / 2, my = 520, win = S * 0.7;
  const yName = my + S / 2 + 110, hh = handle.lead + 24, hw = handle.width + 100, yHandle = yName + name.lead / 2 + 30;
  const ySlogan = yHandle + hh + 30 + (slogan ? slogan.lead / 2 : 0);
  const logoInk = P.mark;
  const mount = (ctx, positive) => {
    ctx.save(); M.shade(ctx, 0); ctx.fillStyle = P.card; ctx.fillRect(mx - S / 2, my - S / 2, S, S); M.noShade(ctx);
    ctx.strokeStyle = P.edge; ctx.lineWidth = 2; ctx.strokeRect(mx - S / 2, my - S / 2, S, S);
    ctx.fillStyle = positive ? P.positive : P.film; ctx.fillRect(mx - win / 2, my - win / 2, win, win);
    const s = win * 0.72; brand.logo.draw(ctx, mx - s / 2, my - s / 2, s, positive ? logoInk : P.filmText);
    ctx.restore();
  };
  const rise = (t0, size) => (w, i, box, c) => { if (M.arrive(c, span(t, t0 + i * 0.07, t0 + i * 0.07 + 0.4), size) === false) return false; };
  let t = 0;
  return {
    duration: d,
    draw(ctx, time) {
      t = time;
      ground.draw(ctx, t);
      ctx.save(); ctx.translate(M.slide(span(t, 0, 0.55), 0, W * 1.15, rtl), 0); mount(ctx, false); ctx.restore();
      M.loupe(ctx, mx + Math.sin(t * 0.8) * 5, my + Math.cos(t * 0.6) * 4, S * 0.5 + 24, span(t, 0.55, 1.15), 0, P, rtl, () => mount(ctx, true), 1.08);
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: P.ink, each: rise(1.3, name.size) });
      const pc = span(t, 1.7, 2.2);
      if (pc > 0) {
        ctx.save(); ctx.translate(M.slide(pc, 0, W * 1.15, rtl), 0);
        M.card(ctx, W / 2 - hw / 2, yHandle, hw, hh, P, rtl, 0, false);
        kit.drawText(ctx, handle, { x0: W / 2 - hw / 2, x1: W / 2 + hw / 2, y: yHandle + hh / 2, color: P.ink });
        ctx.restore();
      }
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.soft, each: rise(2.2, slogan.size) });
    },
  };
}
