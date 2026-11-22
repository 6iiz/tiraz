// The chart-tale ending: the pencil sets its last point and lifts off the paper; the point swells into an accent disc that carries the
// logo, the chart keeps sliding under it, and a stem climbs to the last note: the name, the handle in the mono face and the slogan,
// written on from the reading side. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, minPx: 46, where: 'the slogan' }) : null;
  const block = name.lead + handle.lead + (slogan ? slogan.height + 8 : 0), top = kit.place(block, 560), bottom = top + block + 30;
  const yName = top + name.lead / 2, yHandle = yName + name.lead / 2 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 8 + (slogan ? slogan.lead / 2 : 0);
  const wxEnd = ground.wxAt(clock + 0.35), R = 92;
  const word = (t, t0, size) => (w, i, box, c) => { const s = t0 + i * 0.08; if (M.write(c, span(t, s, s + T.dur.in), box, size, rtl) === false) return false; };
  return {
    duration: d,
    draw(ctx, t0) {
      const t = t0 < 0.35 ? t0 : 0.35 + 0.5 * M.E((t0 - 0.35) / 1.2) + 0.1 * (t0 - 0.35);   // the camera slows to a drift under the logo
      ground.draw(ctx, t, { pen: false, until: wxEnd });
      const [px, py] = ground.point(wxEnd, t), g = M.E(span(t0, 0.35, 0.85)), lift = M.E(span(t0, 0.3, 0.9));
      if (t0 < 0.35) M.dot(ctx, ...ground.tip(t), 10, pal, true);
      if (g > 0) {
        const r = 12 + (R - 12) * g, cy = py - (R + 30) * g;
        ctx.strokeStyle = pal.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy + r); ctx.stroke();
        M.dot(ctx, px, py, 9, pal, true);
        ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.arc(px + 8, cy + 10, r, 0, 7); ctx.fill();
        ctx.fillStyle = pal.accent; ctx.strokeStyle = pal.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, cy, r, 0, 7); ctx.fill(); ctx.stroke();
        const ls = r * 1.15 * M.E(span(t0, 0.7, 1.05)); if (ls > 0) brand.logo.draw(ctx, px - ls / 2, cy - ls / 2, ls, pal.onAccent);
        M.stem(ctx, [px, cy - r + 17], bottom, span(t0, 0.9, 1.2), pal, { r: 0.1 });
      }
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: pal.ink, each: word(t0, 1.1, name.size) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: pal.muted, each: word(t0, 1.35, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: pal.ink, each: word(t0, 1.55, slogan.size) });
      if (lift < 1) { ctx.save(); ctx.globalAlpha = 1 - lift; ctx.translate(-ground.dir * 220 * lift, -260 * lift); ground.pen(ctx, Math.min(t, 0.35)); ctx.restore(); }
    },
  };
}
