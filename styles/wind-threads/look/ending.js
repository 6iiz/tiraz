// The wind-threads ending: the wind turns into one slow eddy round a printed cartouche. The threads cross-fade from the free stream
// to the eddy, a double ring is drawn round the cartouche and the brand's logo is printed in it, one accent gust curls round the
// ring, and the name, the handle and the slogan are carried in beneath. spec: { duration }
import { need, span, contrast, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' · '), { size: T.size.slogan, weight: 500, maxW, minPx: T.minPx, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 560, R = 175;
  const yName = cy + R + 90 + name.lead / 2, yHandle = yName + name.lead / 2 + 12 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const rowsOf = (f, y) => M.layout(f, { x0: SAFE.left, x1: SAFE.right, y, align: 'center' }, rtl).rows.map((r) => M.calm(r, f.size));
  const obs = [{ cx, cy, a: R + 50, b: R + 50 }, ...rowsOf(name, yName), ...rowsOf(handle, yHandle), ...(slogan ? rowsOf(slogan, ySlogan) : [])];
  const EDDY = ground.threads(obs, 51, { vortex: { x: cx, y: cy, g: rtl ? 1 : -1, r: R + 140 } });
  const hc = contrast(pal.key, pal.paper) >= 4.5 ? pal.key : pal.ink;
  const fx = (t, t0) => (w, i, box, c) => M.blow(c, span(t, t0 + i * 0.07, t0 + i * 0.07 + T.dur.in), 0, rtl, T.drift);
  return {
    duration: d,
    draw(ctx, t) {
      const turn = M.S(span(t, 0, 1.0));
      ground.draw(ctx, t, undefined, { alpha: 1 - turn });
      if (turn > 0) { ctx.save(); ctx.globalAlpha = turn; ctx.drawImage(EDDY.cv, 0, 0); ctx.restore(); M.comets(ctx, EDDY, t + clock, pal, { alpha: turn, rate: 0.8 }); }
      const rp = M.S(span(t, 0.5, 1.2));                               // the cartouche: paper disc, double ring drawn round
      if (rp > 0) {
        ctx.save(); ctx.fillStyle = pal.paper; ctx.globalAlpha = rp; ctx.beginPath(); ctx.arc(cx, cy, R + 26, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = pal.ink; ctx.lineCap = 'round';
        const a0 = rtl ? 0 : Math.PI, dir = rtl ? -1 : 1;
        ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R + 22, a0, a0 + dir * Math.PI * 2 * rp, dir < 0); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R + 10, a0, a0 + dir * Math.PI * 2 * rp, dir < 0); ctx.stroke();
        ctx.restore();
      }
      const lp = span(t, 1.0, 1.5);
      if (lp > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, lp * 2.5); const s = R * 1.25, dx = (rtl ? 1 : -1) * 40 * (1 - M.E(lp)); brand.logo.draw(ctx, cx - s / 2 + dx, cy - s / 2, s, pal.ink); ctx.restore(); }
      const gp = M.S(span(t, 1.2, 1.9));                               // one accent gust curling round the ring
      if (gp > 0) {
        ctx.save(); ctx.fillStyle = pal.gust; ctx.beginPath();
        const n = 50, a0 = rtl ? -0.3 : Math.PI + 0.3, dir = rtl ? -1 : 1, span_ = Math.PI * 1.25 * gp, outer = [], inner = [];
        for (let i = 0; i <= n; i++) { const s = i / n, a = a0 + dir * span_ * s, w = 9 * Math.sin(Math.PI * s) ** 0.6 + 0.5, r0 = R + 44 + 8 * s; outer.push([cx + Math.cos(a) * (r0 + w / 2), cy + Math.sin(a) * (r0 + w / 2)]); inner.push([cx + Math.cos(a) * (r0 - w / 2), cy + Math.sin(a) * (r0 - w / 2)]); }
        outer.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(...inner[i]);
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.ink, each: fx(t, 1.45) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: hc, each: fx(t, 1.75) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.lead, each: fx(t, 1.95) });
    },
  };
}
