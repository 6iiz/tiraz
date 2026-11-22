// The intertitle ending: the iris opens on a closing card. Inside it the logo sits in an oval medallion (a double ring drawn round), the
// brand's name is exposed large, an ornament rule is drawn, then the handle in the mono face and the slogan in dim silver. The flourish
// is drawn under the name last. spec: { duration }
import { need, span, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, C = T.card;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = C.x0 + C.padX, x1 = C.x1 - C.padX, cx = (C.x0 + C.x1) / 2;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.name, maxW: x1 - x0, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW: x1 - x0, single: true, where: 'the slogan' }) : null;
  const med = 250, h = C.padY * 2 + med + 40 + name.lead + 46 + handle.lead + (slogan ? slogan.lead : 0), top = Math.max(300, (270 + 1248 - h) / 2);
  const yMed = top + C.padY + med / 2, yName = top + C.padY + med + 40 + name.lead / 2, yRule = yName + name.lead / 2 + 30;
  const yHandle = yRule + 32 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + (slogan ? slogan.lead / 2 : 0);
  const R = Math.hypot(W, H) / 2 + 40, irisC = [cx, yMed];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const w = ground.weave(t), tc = M.crank(t), ti = M.crank(t, 24);
      ctx.save(); ctx.translate(w.x, w.y);
      M.card(ctx, C.x0, top, C.x1, top + h, span(tc, 0.35, 0.65), P, C.notch);
      const pr = span(tc, 0.1, 0.6);
      if (pr > 0) {
        ctx.save(); ctx.strokeStyle = P.silver;
        ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, yMed, med * 0.62, med / 2, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); ctx.stroke();
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, yMed, med * 0.62 - 12, med / 2 - 12, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); ctx.stroke();
        ctx.restore();
      }
      const pl = span(tc, 0.45, 0.75);
      if (pl > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, pl * 1.35); const s = med * 0.56; brand.logo.draw(ctx, cx - s / 2, yMed - s / 2 + (1 - pl) * 8, s, P.silver); ctx.restore(); }
      kit.drawText(ctx, name, { x0, x1, y: yName, color: P.silver, each: (wd, i, box, c) => M.expose(c, span(tc, 0.85, 1.1), name.size) });
      M.rule(ctx, cx, yRule, 420, span(tc, 1.1, 1.4), P);
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, color: P.silver, each: (wd, i, box, c) => M.expose(c, span(tc, 1.3, 1.55), handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: P.dim, each: (wd, i, box, c) => M.expose(c, span(tc, 1.55, 1.8), slogan.size) });
      M.flourish(ctx, cx - name.width / 2, cx + name.width / 2, yName + name.size * 0.8, span(tc, 1.8, 2.3), P, kit.rtl);
      ctx.restore();
      ground.over(ctx, t);
      // the iris opens on the medallion
      const q = span(ti, 0, 0.75), r = R * q * q * (3 - 2 * q);
      if (q < 1) {
        const g = ctx.createRadialGradient(irisC[0], irisC[1], Math.max(0, r - 34), irisC[0], irisC[1], r + 0.5);
        g.addColorStop(0, rgba(P.house, 0)); g.addColorStop(1, P.house);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    },
  };
}
