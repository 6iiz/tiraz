// The copper-traces ending: a large square pad of exposed metal in the middle of the board, with buses of traces running in from the
// top and from both sides. Current runs in along every bus at once; when it arrives the pad lights, and the brand's logo is etched
// into it in the colour that reads best on gold. The name powers up in silkscreen below, then the handle (mono) and the slogan.
// spec: { duration }
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
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 560, S = 280, h = S / 2;
  const yName = cy + h + 120, yHandle = yName + name.lead / 2 + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const buses = [
    ...M.bus([[-20, cy + 150], [150, cy + 150], [240, cy + 60], [cx - h, cy + 60]], 3, 34),
    ...M.bus([[W + 20, cy + 150], [W - 150, cy + 150], [W - 240, cy + 60], [cx + h, cy + 60]], 3, 34),
    ...M.bus([[cx, 250], [cx, cy - h]], 3, 44),
    ...M.bus([[-20, cy - 110], [cx - h, cy - 110]], 2, 34),
    ...M.bus([[W + 20, cy - 110], [cx + h, cy - 110]], 2, 34),
  ].map(M.route);
  const word = (t0, size) => (w, i, box, c) => M.power(c, ctx0.t, t0 + i * 0.05, T.dur.in, box, size, P);
  const ctx0 = { t: 0 };
  return {
    duration: d,
    draw(ctx, t) {
      ctx0.t = t;
      ground.draw(ctx, t);
      M.field(ctx, -4, 250, W + 4, Math.max(ySlogan, yHandle) + 80, P);
      const run = M.Q(span(t, 0.1, 0.8));
      for (const R of buses) { M.trace(ctx, R, P, 9); if (run > 0) M.glow(ctx, R, P, run < 1 ? R.total * run - 200 : 0, R.total * run, 9, run < 1 ? 1 : 0.4); }
      const lit = span(t, 0.8, 0.95) * (1 - 0.55 * span(t, 1.0, 1.8));
      ctx.fillStyle = P.mask; ctx.fillRect(cx - h - 14, cy - h - 14, S + 28, S + 28);
      M.pad(ctx, cx - h, cy - h, S, S, 22, P, lit);
      const st = M.E(span(t, 0.95, 1.2));
      if (st > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(cx - h, cy - h, S, S * st); ctx.clip();
        brand.logo.draw(ctx, cx - S * 0.36, cy - S * 0.36, S * 0.72, P.onGold); ctx.restore();
      }
      ctx.strokeStyle = P.dim; ctx.lineWidth = 2.5; ctx.strokeRect(cx - h - 24, cy - h - 24, S + 48, S + 48);
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: P.silk, each: word(1.15, name.size) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: P.dim, each: word(1.45, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.dim, each: word(1.65, slogan.size) });
    },
  };
}
