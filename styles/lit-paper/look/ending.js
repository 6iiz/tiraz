// The lit-paper ending: one last card slides up into the box with the brand's logo cut through it, lit through accent tissue; the name,
// the handle and the slogan light below it in turn, and then the lamp behind the whole box swells, so the sky and every lit cut brighten
// together. spec: { duration }
import { need, span, mix, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = T.textW, x0 = W / 2 - maxW / 2, x1 = W / 2 + maxW / 2;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const L = 230, block = L + 50 + name.height + handle.height + (slogan ? slogan.height + 8 : 0);
  const top = kit.place(block + 60, 700) + 30, yLogo = top, yName = top + L + 50 + name.lead / 2;
  const yHandle = yName + name.lead / 2 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 8 + (slogan ? slogan.lead / 2 : 0);
  const cw = Math.min(W - 120, Math.max(640, Math.max(name.width, slogan ? slogan.width : 0) + 180)), C = M.card(cw, block + 100, P, 47);
  const soft = mix(P.glow, P.card, 0.22);
  const words = (t, t0, col, g = 0.07) => (w, i, box, c) => { const s0 = t0 + i * g; return M.light(c, span(t, s0, s0 + T.dur.light), col, P); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, M.O(span(t, 1.5, 2.6)));
      const g = M.groove(span(t, 0, 0.45), 0);
      if (g) {
        ctx.save(); ctx.translate(ground.drift(t, 0.55), g.dy);
        M.layCard(ctx, C, W / 2 - cw / 2, top - 50, g.lift);
        const q = M.O(span(t, 0.35, 0.75));
        if (q > 0) { ctx.save(); ctx.shadowColor = rgba(P.key, 0.7 * q); ctx.shadowBlur = 30 * q; brand.logo.draw(ctx, W / 2 - L / 2, yLogo, L, mix(P.dim, P.key, q)); ctx.restore(); }
        kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: P.glow, each: words(t, 0.7, P.glow, 0.09) });
        kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: soft, each: words(t, 1.05, soft) });
        if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: soft, each: words(t, 1.25, soft) });
        ctx.restore();
      }
      ground.drawFront(ctx, t);
    },
  };
}
