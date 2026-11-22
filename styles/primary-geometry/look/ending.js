// The primary-geometry ending: the machine assembles its last figure. Four accent quarter discs turn in from the corners and lock into
// one disc; a paper square of two triangles locks at its centre and the logo is set into it. Below, a plate locks together and the
// rolling square types the name, then the handle in the mono face and the slogan. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, pad = T.plate.pad, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const inW = SAFE.right - SAFE.left - pad * 2;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: inW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: inW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW: inW, minScale: 0.9, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 520, R = 190, S = 220;
  const h = pad * 0.8 + name.lead + handle.lead + (slogan ? slogan.height + 6 : 0) + pad * 0.7;
  const plate = { x: SAFE.left, y: cy + R + 60, w: SAFE.right - SAFE.left, h };
  const yName = plate.y + pad * 0.8 + name.lead / 2, yHandle = yName + name.lead / 2 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  const corners = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      // a night ring clears the machine behind the figure
      const pc = M.SNAP(span(t, 0, 0.3));
      if (pc > 0) { ctx.fillStyle = P.night; ctx.beginPath(); ctx.arc(cx, cy, (R + 40) * pc, 0, Math.PI * 2); ctx.fill(); }
      corners.forEach(([sx, sy], i) => {
        const p = span(t, 0.1 + i * 0.09, 0.1 + i * 0.09 + 0.34); if (p <= 0) return;
        const q = M.SNAP(p), a0 = Math.atan2(sy, sx) - Math.PI / 4;
        ctx.save(); ctx.translate(cx + sx * (1 - q) * 420, cy + sy * (1 - q) * 520); ctx.rotate((rtl ? -1 : 1) * (1 - q) * M.Q);
        ctx.fillStyle = P.accent; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a0 + M.Q); ctx.closePath(); ctx.fill(); ctx.restore();
      });
      M.stage(ctx, { x: cx - S / 2, y: cy - S / 2, w: S, h: S }, span(t, 0.55, 0.55 + T.dur.stage), 0, P.paper, () => {
        const pl = M.SNAP(span(t, 0.85, 1.05)); if (pl <= 0) return;
        const s = S * 0.66 * (0.6 + 0.4 * pl); ctx.save(); ctx.beginPath(); ctx.rect(cx - S / 2, cy - S / 2, S, S * pl); ctx.clip();
        brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, P.ink); ctx.restore();
      });
      M.stage(ctx, plate, span(t, 1.0, 1.0 + T.dur.stage), 0, P.paper, () => {
        M.typeset(ctx, kit, name, { x0: SAFE.left + pad, x1: SAFE.right - pad, y: yName, align: 'center', t, t0: 1.3, pal: P, T });
        M.typeset(ctx, kit, handle, { x0: SAFE.left + pad, x1: SAFE.right - pad, y: yHandle, align: 'center', t, t0: 1.62, pal: P, T, color: P.grey, square: false });
        if (slogan) M.typeset(ctx, kit, slogan, { x0: SAFE.left + pad, x1: SAFE.right - pad, y: ySlogan, align: 'center', t, t0: 1.8, pal: P, T, color: P.grey });
      }, true);
    },
  };
}
