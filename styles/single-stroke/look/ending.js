// The single-stroke ending: the line comes in for the last time, circles the brand's logo once in the accent (the logo appears inside the
// ring as it closes), runs under the name writing it, ties a small loop, and then, for the first time, does not leave: it wanders
// slowly to the middle of the lower margin and stops there in a blot of ink. The handle and the slogan are written under the name.
// spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: maxW - 60, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, minPx: 44, where: 'the slogan' }) : null;
  const s = 240, cx = W / 2, cy = 470;
  const yName = cy + s / 2 + 150 + name.lead / 2, yU = yName + name.size * 0.85;
  const yHandle = yU + 56 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const R = M.line(W, T, rtl), P = R.P, dir = R.dir, mx = R.mx;
  const nb = M.boxes(name, x0, x1, yName, 'center', rtl), near = rtl ? Math.max(...nb.map((b) => b.x + b.width)) + 40 : Math.min(...nb.map((b) => b.x)) - 40;
  const far = rtl ? Math.min(...nb.map((b) => b.x)) - 40 : Math.max(...nb.map((b) => b.x + b.width)) + 40;
  R.enter(); P.to(mx(1050), 1000); P.to(mx(860), cy + s * 0.55); P.mark('r0');
  P.loop(cx, cy, s * 0.78, s * 0.78, rtl ? 0.55 : Math.PI - 0.55, 1.06, rtl ? -1 : 1, true); P.mark('r1');
  P.to(near, yU - 30); P.to(near - dir * 20, yU).mark('u0');
  R.under(yU, near - dir * 20, far, []); P.mark('u1');
  P.loop(far - dir * 10, yU - 26, 18, 24, Math.PI / 2, 1, rtl ? 1 : -1);
  P.to(mx(66), yU + 14); P.to(mx(60), 1290); P.to(mx(200), 1380);
  P.garland(mx(260), W / 2 + (rtl ? 1 : -1) * 120, 1440, 120, 40, 21);
  P.to(W / 2 + (rtl ? 1 : -1) * 40, 1470); P.to(W / 2, 1480).mark('end');
  const L = R.build(T);
  const stop = Math.max(3.6, d - 0.9);
  const keys = [[0, 0], [0.5, L.at.r0], [1.25, L.at.r1], [1.55, L.at.u0], [2.05, L.at.u1], [stop, L.total]];
  const tLogo = M.timeAt(keys, L.at.r0) + 0.2, nt = nb.map((b) => M.timeAt(keys, M.crossing(L, b, rtl)));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (t >= tLogo) {
        const p = Math.min(1, (t - tLogo) / 0.5), k = 0.92 + 0.08 * M.io(p);
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, s * 0.75 * M.io(p) + 1, 0, Math.PI * 2); ctx.clip();
        brand.logo.draw(ctx, cx - (s * k) / 2, cy - (s * k) / 2, s * k, K.ink); ctx.restore();
      }
      const head = M.headAt(keys, t);
      M.drawLine(ctx, L, head, K, { blot: head >= L.total });
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: K.ink, each: (w, i, b, c) => M.write(c, t, nt[i], b, name.size, rtl) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: K.grey, each: (w, i, b, c) => M.write(c, t, 2.15 + i * 0.06, b, handle.size, rtl, 0.3) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: K.grey, each: (w, i, b, c) => M.write(c, t, 2.45 + i * 0.09, b, slogan.size, rtl, 0.3) });
    },
  };
}
