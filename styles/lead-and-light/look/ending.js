// The lead-and-light ending: a wheel window is glazed piece by piece, clockwise from the top, round a clear roundel in which the logo
// stands as a leaded silhouette; the sun then comes through the wheel and its pieces glow. The name is painted on a pane below it, and
// the handle and the slogan on a narrower pane under that. spec: { duration }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: SAFE.right - SAFE.left - 140, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: SAFE.right - SAFE.left - 120, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW: SAFE.right - SAFE.left - 120, single: true, where: 'the slogan' }) : null;
  const R = 235, r0 = 140, N = 16, cy = 290 + R;
  const nw = Math.min(SAFE.right - SAFE.left, name.width + 120), nh = name.lead + 40, ny = cy + R + 50;
  const sw = Math.min(SAFE.right - SAFE.left, Math.max(handle.width, slogan ? slogan.width : 0) + 100), sh = handle.lead + (slogan ? slogan.lead : 0) + 36, sy = ny + nh + 34;
  const no = { x0: cx - name.width / 2, x1: cx + name.width / 2, y: ny + nh / 2, align: 'center' };
  const ho = { x0: SAFE.left, x1: SAFE.right, y: sy + 18 + handle.lead / 2, align: 'center' };
  const so = { x0: SAFE.left, x1: SAFE.right, y: ho.y + handle.lead / 2 + (slogan ? slogan.lead / 2 : 0), align: 'center' };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.q(t), set = span(tq, 0, 0.9), L = M.sun(tq, 0.9, 0.7, rtl, 0.1);
      ctx.fillStyle = M.glass(pal, pal.tints[3], 0); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < N; i++) {
        if (i / N >= set) continue;
        const a0 = -Math.PI / 2 + (i / N) * Math.PI * 2, a1 = a0 + Math.PI * 2 / N, mx = cx + Math.cos((a0 + a1) / 2) * (R + r0) / 2, my = cy + Math.sin((a0 + a1) / 2) * (R + r0) / 2;
        const lit = L(mx, my);
        ctx.fillStyle = M.glass(pal, pal.tints[i % 2 ? 0 : 1], lit); ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.arc(cx, cy, r0, a1, a0, true); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = pal.lead; ctx.lineWidth = 7; ctx.stroke();
        M.jewel(ctx, mx, my, 12, pal, pal.tints[i % 2 ? 4 : 2], lit);
      }
      ctx.strokeStyle = pal.lead; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      if (tq >= 0.5) {
        ctx.fillStyle = M.glass(pal, pal.clear, clamp(0.15 + L(cx, cy))); ctx.beginPath(); ctx.arc(cx, cy, r0, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 9; ctx.stroke();
        const s = 170; brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, pal.lead);
      }
      if (tq >= 1.3) {
        const L2 = M.sun(tq, 1.4, T.dur.sun, rtl, 0.1);
        M.pane(ctx, cx - nw / 2, ny + (tq < 1.47 ? -12 : 0), nw, nh, pal, { lit: L2(rtl ? cx + nw / 4 : cx - nw / 4, ny), r: 6 });
        kit.drawText(ctx, name, { ...no, color: pal.paint, each: (w, i, box, c) => M.painted(c, L2(box.x + box.width / 2, box.y) * 1.25) });
      }
      if (tq >= 1.9) {
        const L3 = M.sun(tq, 2.0, T.dur.sun, rtl, 0.1);
        M.pane(ctx, cx - sw / 2, sy + (tq < 2.07 ? -10 : 0), sw, sh, pal, { color: pal.tints[4], lit: L3(cx, sy), r: 6, lead: 7 });
        const ink = pal.on(pal.tints[4]);
        kit.drawText(ctx, handle, { ...ho, color: ink, each: (w, i, box, c) => M.painted(c, L3(box.x + box.width / 2, box.y) * 1.25) });
        if (slogan) kit.drawText(ctx, slogan, { ...so, color: ink, each: (w, i, box, c) => M.painted(c, L3(box.x + box.width / 2, box.y) * 1.25) });
      }
    },
  };
}
