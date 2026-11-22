// The two-tone ending: one window holds the sign-off. It comes up through the dither; a square of the accent comes up inside it
// with the logo set in it; the name, the handle (mono) and the slogan are set behind the block cursor, one after another. The
// planet keeps turning behind. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, D = M.DOT;
  const x = SAFE.left, w = SAFE.right - SAFE.left, pad = 44;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: w - pad * 2, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: w - 200, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW: w - pad * 2, single: true, where: 'the slogan' }) : null;
  const bar = M.snap(handle.lead + 16), S = 232;
  const h = M.snap(bar + pad + S + 40 + name.lead + (slogan ? slogan.lead + 10 : 0) + pad);
  const y = M.snap(Math.min(kit.place(h, 720), T.floor - h));
  const sx = M.snap(W / 2 - S / 2), sy = M.snap(y + bar + pad), yName = sy + S + 40 + name.lead / 2, ySlogan = yName + name.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = M.step(t);
      M.dissolve(ctx, span(ts, 0.1, 0.4), [x, y, w + 16, h + 16], (c) => M.plate(c, P, x, y, w, h, { bar, gapW: handle.width }));
      if (ts < 0.4) return;
      M.dissolve(ctx, span(ts, 0.45, 0.85), [sx, sy, S, S], (c) => {
        c.fillStyle = P.paper; c.fillRect(sx, sy, S, S); c.fillStyle = P.accent; c.fillRect(sx + D, sy + D, S - 2 * D, S - 2 * D);
        brand.logo.draw(c, sx + S * 0.17, sy + S * 0.17, S * 0.66, P.onAccent);
      });
      kit.drawText(ctx, name, { x0: x + pad, x1: x + w - pad, y: yName, color: P.paper, key: P.paper, each: M.typed(ts, 0.9, T.dur.word, P, name.size, false) });
      kit.drawText(ctx, handle, { x0: x + 100, x1: x + w - 100, y: y + bar / 2 + D / 2, color: P.paper, key: P.paper, each: M.typed(ts, 1.3, T.dur.word, P, handle.size, false) });
      if (slogan) kit.drawText(ctx, slogan, { x0: x + pad, x1: x + w - pad, y: ySlogan, color: P.paper, key: P.paper, each: M.typed(ts, 1.6, T.dur.word, P, slogan.size, false) });
    },
  };
}
