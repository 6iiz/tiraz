// The card-glide ending: the one take closes by pulling back over the whole desk. The camera cranes up from close on a card to a wide
// view where the cards of the earlier stops lie around a centre card printed with the brand's logo, name and slogan, and a small label
// card with the handle. The voxel toy pops up on the centre card and hops along its top edge to stand over the logo. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, toy = M.toy(brand, P);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const cw = 720, cx0 = (W - cw) / 2, inner = cw - 100;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: inner, single: true, where: 'the brand name' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW: inner, minPx: 44, where: 'the slogan' }) : null;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: 560, single: true, where: 'the handle' });
  const logo = 190, ch = 60 + 40 + logo + 40 + name.height + (slogan ? slogan.height : 0) + 50;
  const top = 360, yLogo = top + 100, yName = yLogo + logo + 30 + name.lead / 2, ySlogan = yName + name.lead / 2 + (slogan ? slogan.lead / 2 : 0);
  const hw = handle.width + 80, hy = top + ch + 50, hh = handle.lead + 30;
  const others = [[-430, 140, 380, 300], [770, 220, 360, 420], [-380, 1060, 330, 260], [820, 980, 380, 330], [140, 1500, 420, 280]];
  const cxm = W / 2, stops = [{ t: 0, x: rtl ? cx0 + 110 : cx0 + cw - 110, y: top }, { t: 1.35, x: cxm, y: top, height: 120 }, { t: 2.0, x: cxm, y: top, height: 70 }];
  return {
    duration: d,
    draw(ctx, t) {
      const pull = M.IO(span(t, 0, 1.3)), s = 1.28 - 0.28 * pull - 0.015 * Math.max(0, t - 1.3);
      ctx.save(); ctx.translate(W / 2, 760); ctx.scale(s, s); ctx.translate(-W / 2, -760 + (1 - pull) * 120);
      ground.draw(ctx, t);
      for (const [x, y, w, h] of others) { M.card(ctx, P, x, y, w, h, { r: 22 }); M.printHead(ctx, P, x, y, w, rtl, brand, false); M.printFoot(ctx, P, x, y + h - 60, w, rtl, 2, -1); }
      M.card(ctx, P, cx0, top, cw, ch, { r: 32 });
      M.printHead(ctx, P, cx0, top, cw, rtl, brand, false);
      const lp = span(t, 0.55, 0.85);
      brand.logo.draw(ctx, cxm - logo / 2, yLogo - (lp > 0 ? 8 * M.POP(lp) : 0), logo, P.ink);
      kit.drawText(ctx, name, { x0: cx0 + 50, x1: cx0 + cw - 50, y: yName, color: P.ink });
      if (slogan) kit.drawText(ctx, slogan, { x0: cx0 + 50, x1: cx0 + cw - 50, y: ySlogan, color: P.grey });
      const hp = span(t, 1.15, 1.4);
      if (hp > 0) {
        ctx.save(); ctx.translate(W / 2, hy + hh); ctx.scale(1, M.POP(hp)); ctx.translate(-W / 2, -(hy + hh));
        M.card(ctx, P, (W - hw) / 2, hy, hw, hh, { r: 18, fill: P.accent, edge: P.chipEdge, lift: 1 - hp });
        kit.drawText(ctx, handle, { x0: (W - hw) / 2, x1: (W + hw) / 2, y: hy + hh / 2, color: P.onAccent });
        ctx.restore();
      }
      const tr = M.track(stops, t, 0.32);
      M.ring(ctx, P, tr.x, tr.y, tr.landed);
      M.drawToy(ctx, toy, tr.x, tr.y, { air: tr.air, sq: tr.sq, e: span(t, 0.9, 1.15), time: t + clock, flip: rtl ? tr.x > cxm + 1 : tr.x < cxm - 1 });
      ctx.restore();
    },
  };
}
