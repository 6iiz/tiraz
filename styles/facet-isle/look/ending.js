// The facet-isle ending: a faceted hexagonal medallion of the accent drops in over the island and lands with the bounce; the light
// slides slowly round its six bevels while it hovers. The brand's logo is set on its flat face, then the name, the handle (mono) and
// the slogan drop in under it one after another. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.lead, weight: 600, maxW, minPx: 44, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 600, R = 175, r = 122;
  const yName = cy + R + 60 + name.lead / 2, yHandle = yName + name.lead / 2 + 14 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const hexPt = (rad, i) => [cx + Math.cos(Math.PI / 6 + (i * Math.PI) / 3) * rad, Math.sin(Math.PI / 6 + (i * Math.PI) / 3) * rad];
  const fall = (t, t0, size) => (w, i, box, c) => { const s = t0 + i * 0.06; if (M.drop(c, span(t, s, s + T.dur.in), size * 0.6) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, 0.05, 0.05 + 0.5);
      if (p > 0) {
        const bob = Math.sin((t + clock) * 1.5) * 4, la = -2.2 + t * 0.5;
        M.hover(ctx, cx, cy + R + 34, R * 1.7, Math.min(1, p * 2));
        ctx.save(); M.drop(ctx, p, 160); ctx.translate(0, cy + bob);
        for (let i = 0; i < 6; i++) {                      // six bevels, each lit by its angle to a slowly sliding light
          const a = Math.PI / 6 + ((i + 0.5) * Math.PI) / 3, s = Math.cos(a - la) * 0.75;
          const [ax, ay] = hexPt(R, i), [bx, by] = hexPt(R, i + 1), [cx2, cy2] = hexPt(r, i + 1), [dx, dy] = hexPt(r, i);
          ctx.fillStyle = P.tone(P.accent, s); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2); ctx.lineTo(dx, dy); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = P.accent; ctx.beginPath(); for (let i = 0; i < 6; i++) { const [x, y] = hexPt(r, i); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); ctx.fill();
        const lp = M.B(span(t, 0.45, 0.8));
        if (lp > 0) { const s = 150 * lp; brand.logo.draw(ctx, cx - s / 2, -s / 2, s, P.onAccent); }
        ctx.restore();
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.text, each: fall(t, 0.75, name.size) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.accent === P.bg ? P.text : P.muted, each: fall(t, 1.05, 60) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.text, each: fall(t, 1.3, 70) });
    },
  };
}
