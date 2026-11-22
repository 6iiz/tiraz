// The iso-facts ending: the square clears and a stepped landmark of the accent grows out of the middle of the board, tier by tier.
// A leader shoots up from its top and the largest panel of the reel pops open: the logo on an accent tile, the name, the handle in
// the mono face and the slogan. The cars keep driving round it. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const pad = T.panel.pad, x0 = SAFE.left, x1 = SAFE.right, ix0 = x0 + pad, ix1 = x1 - pad, maxW = ix1 - ix0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, minPx: 46, where: 'the slogan' }) : null;
  const L = 170, cardH = T.panel.top + L + 26 + name.lead + handle.lead + (slogan ? slogan.height + 6 : 0) + pad * 0.3;
  const y0 = kit.place(cardH, 610), y1 = y0 + cardH;
  const yLogo = y0 + T.panel.top, yName = yLogo + L + 26 + name.lead / 2, yHandle = yName + name.lead / 2 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  const tiers = [[5.2, 5.2, 3.6, 3.6, 0, 1.1], [5.8, 5.8, 2.4, 2.4, 1.1, 1.2], [6.35, 6.35, 1.3, 1.3, 2.3, 1.5]];
  const plaza = (t) => (ctx, P) => {
    M.poly(ctx, [P(4.8, 4.8, 0.06), P(9.2, 4.8, 0.06), P(9.2, 9.2, 0.06), P(4.8, 9.2, 0.06)], pal.pave.left);
    tiers.forEach(([x, y, w, dd, z, h], k) => { const g = M.E(span(t, 0.1 + k * 0.18, 0.45 + k * 0.18)); if (g > 0) M.block(ctx, P, x, y, z, w, dd, h, k === 1 ? pal.blocks[4] : pal.hot, { grow: g, windows: k === 0 ? pal.blocks[3].right : null }); });
    [[4.0, 9.8], [9.9, 4.2], [9.6, 9.6]].forEach(([x, y], k) => M.tree(ctx, P, x, y, 1, pal, M.E(span(t, 0.3 + k * 0.1, 0.6 + k * 0.1))));
  };
  const word = (t, t0) => (w, i, box, c) => { const s = t0 + i * 0.06; if (M.settle(c, span(t, s, s + T.dur.in), box) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { plaza: plaza(t) });
      const pin = ground.at(7, 7, 3.8 * M.E(span(t, 0.46, 0.81)), t), top = [pin[0], y1];
      M.leader(ctx, pin, top, span(t, 0.6, 0.85), pal);
      ctx.save();
      if (M.pop(ctx, M.Q(span(t, 0.75, 1.05)), top[0], top[1]) !== false) {
        M.panel(ctx, x0, y0, x1, y1, pal, rtl);
        const s = M.Q(span(t, 0.95, 1.25));
        if (s > 0) {
          const cx = W / 2, cy = yLogo + L / 2;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
          ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.roundRect(cx - L / 2 + 8, yLogo + 10, L, L, 34); ctx.fill();
          ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.roundRect(cx - L / 2, yLogo, L, L, 34); ctx.fill();
          brand.logo.draw(ctx, cx - L * 0.33, yLogo + L * 0.17, L * 0.66, pal.onAccent); ctx.restore();
        }
        kit.drawText(ctx, name, { x0: ix0, x1: ix1, y: yName, align: 'center', color: pal.ink, each: word(t, 1.15) });
        kit.drawText(ctx, handle, { x0: ix0, x1: ix1, y: yHandle, align: 'center', color: pal.muted, each: word(t, 1.35) });
        if (slogan) kit.drawText(ctx, slogan, { x0: ix0, x1: ix1, y: ySlogan, align: 'center', color: pal.ink, each: word(t, 1.5) });
      }
      ctx.restore();
    },
  };
}
