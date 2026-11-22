// The gouge-print ending: a round of the block is carved away to paper, row by row, and the brand's logo is what the gouge left
// standing in it; rays of light are cut out around it. The print's one colour is rolled on a ring around the disc. The name stands in
// wood on a carved strip below; the handle and slogan are cut into the block as letters of light. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, padX = T.pad.x, padY = T.pad.y;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: full - 2 * padX, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW: full, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW: full, single: true, where: 'the slogan' }) : null;
  const R = 170, cx = W / 2, cy = 500, bw = Math.min(full, name.width + 2 * padX), bh = name.height + 2 * padY;
  const bx = (W - bw) / 2, by = cy + R + 110, yHandle = by + bh + 46 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 8 + (slogan ? slogan.lead / 2 : 0);
  const disc = M.patch(cx - R, cy - R, 2 * R, 2 * R, 5, rtl, T), strip = M.patch(bx, by, bw, bh, 9, rtl, T);
  const rays = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, r0 = R + 46, r1 = r0 + 60 + (i % 2) * 70;
    rays.push(M.cutShape(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, 9 + (i % 2) * 7, 500 + i));
  }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pd = span(t, 0.1, 0.75);
      if (pd > 0) {
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); disc.draw(ctx, pd, P.paper); ctx.restore();
        const s = R * 1.15; brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, P.ink);
      }
      const pr = span(t, 0.6, 1.1), path = new Path2D();
      rays.forEach((c, i) => M.cutPath(path, c, M.E(span(pr, (i % 6) * 0.06, (i % 6) * 0.06 + 0.6))));
      ctx.fillStyle = P.paper; ctx.fill(path);
      const pa = M.E(span(t, 0.95, 1.3));                   // the one colour, rolled round the disc
      if (pa > 0) {
        ctx.strokeStyle = P.accent; ctx.lineWidth = 18; ctx.beginPath();
        ctx.arc(cx, cy, R + 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pa * (rtl ? -1 : 1), rtl); ctx.stroke();
      }
      const pc = span(t, 1.1, 1.1 + T.dur.carve);
      strip.draw(ctx, pc, P.paper);
      if (pc > 0) kit.drawText(ctx, name, { x0: bx + padX, x1: bx + bw - padX, y: by + padY + name.lead / 2, color: P.ink });
      M.hatch(ctx, span(t, 1.6, 1.6 + T.dur.letters), SAFE.left, yHandle - handle.size, full, handle.size * 2,
        () => kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: P.paper }), 7);
      if (slogan) M.hatch(ctx, span(t, 1.85, 1.85 + T.dur.letters), SAFE.left, ySlogan - slogan.size, full, slogan.size * 2,
        () => kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.soft }), 7);
    },
  };
}
