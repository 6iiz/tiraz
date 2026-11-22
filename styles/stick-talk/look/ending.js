// The stick-talk ending: the people form a ring. They step out around a circle (feet on it, heads outward), join hands into one closed
// line, and the accent runs once round the ring; the brand's logo is set in the middle in ink. The name follows flush under it, the
// handle in the mono face under a fine rule, the slogan in grey. The crowd on the system line lifts its joined hands. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: x1 - x0, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 500, maxW: x1 - x0, minScale: 0.9, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 560, R = 140, fh = 135, N = 8;
  const yName = cy + R + fh + 70 + name.lead / 2, yRule = yName + name.lead / 2 + 6, yHandle = yRule + 22 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 4 + (slogan ? slogan.lead / 2 : 0);
  const ang = (i) => -Math.PI / 2 + (rtl ? 1 : -1) * (i / N) * Math.PI * 2;
  const sw = 0;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const lift = M.ease.inOutCubic(span(t, 1.6, 2.0));
      ground.crowd(ctx, t, { join: span(t, 0.9, 1.3), runP: span(t, 1.3, 2.0), runT: [1.3, 2.0], lift: M.ease.inOutCubic(span(t, 2.0, 2.4)) });
      const w = M.weight(fh), shR = R + fh * 0.75, figs = [];
      for (let i = 0; i < N; i++) {
        const p = span(t, 0.05 + i * 0.06, 0.3 + i * 0.06); if (p <= 0) continue;
        const a = ang(i);
        ctx.save(); ctx.globalAlpha = Math.min(1, p * 3); ctx.translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.rotate(a + Math.PI / 2);
        M.figure(ctx, P, 0, -(1 - M.ease.outCubic(p)) * 30, fh, { head: i === 0 ? 'accent' : 'paper', skipArms: span(t, 0.6, 0.9) > 0 ? { l: true, r: true } : null });
        ctx.restore();
        figs.push(i);
      }
      const jp = span(t, 0.6, 0.9);
      if (jp > 0 && figs.length === N) {
        const path = [];
        for (let i = 0; i < N; i++) {
          const a = ang(i), b = ang((i + 1) % N), da = (rtl ? 1 : -1) * sw;
          const A = [cx + Math.cos(a + da) * shR, cy + Math.sin(a + da) * shR], B = [cx + Math.cos(b - da) * shR, cy + Math.sin(b - da) * shR];
          const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], c = [M.lerp(mid[0], cx, 0.22), M.lerp(mid[1], cy, 0.22)], seg = [];
          for (let j = 0; j <= 16; j++) { const u = j / 16; seg.push([(1 - u) ** 2 * A[0] + 2 * (1 - u) * u * c[0] + u * u * B[0], (1 - u) ** 2 * A[1] + 2 * (1 - u) * u * c[1] + u * u * B[1]]); }
          const m = Math.max(1, Math.round(8 * jp));
          M.run(ctx, seg.slice(0, m + 1), Infinity, w, P.ink); M.run(ctx, seg.slice(16 - m).reverse(), Infinity, w, P.ink);
          path.push(...seg);
        }
        if (jp >= 1) M.run(ctx, path, M.lengthOf(path) * span(t, 0.95, 1.7), w * 1.15, P.accent);
      }
      const lp = M.ease.outCubic(span(t, 0.9, 1.2));
      if (lp > 0) { const s = R * 1.1 * lp; ctx.save(); ctx.globalAlpha = Math.min(1, lp * 2); brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, P.ink); ctx.restore(); }
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: P.ink, key: P.ink, each: (wd, i, box, c) => M.setDown(c, span(t, 1.3 + i * 0.08, 1.55 + i * 0.08), name.size) });
      const rw = 420 * M.ease.inOutCubic(span(t, 1.6, 1.9)); ctx.fillStyle = P.accent; ctx.fillRect(cx - rw / 2, yRule, rw, 5);
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: P.ink, key: P.ink, each: (wd, i, box, c) => M.setDown(c, span(t, 1.8, 2.0), handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: P.note, key: P.note, each: (wd, i, box, c) => M.setDown(c, span(t, 2.0 + i * 0.06, 2.22 + i * 0.06), slogan.size) });
    },
  };
}
