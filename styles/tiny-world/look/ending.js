// The tiny-world ending: the tallest roof in town rises in time-lapse steps; on it a round helipad of the accent is painted ring by
// ring and the logo is set down in its middle; the name, the handle (mono) and the slogan are set down under it. The focus band
// narrows onto this roof while the town keeps running around it. spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left - 80;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, minPx: 44, where: 'the slogan' }) : null;
  const R = 130, top = 330, cy = top + 60 + R;
  const yName = cy + R + 50 + name.lead / 2, yHandle = yName + name.lead / 2 + 10 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const bottom = (slogan ? ySlogan + slogan.height - slogan.lead / 2 : yHandle + handle.lead / 2) + 50;
  const roof = { x: 110, y: top, w: W - 220, h: bottom - top };
  const band = { y: roof.y + roof.h / 2 - 30, h: roof.h + 40 };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, band);
      const tl = M.lapse(t);
      ctx.save();
      if (M.slab(ctx, roof, pal, tl / 0.34, 60)) {
        const k = Math.ceil(Math.min(1, Math.max(0, (tl - 0.35) / 0.4)) * 4);          // the pad is painted ring by ring
        if (k >= 1) { ctx.fillStyle = pal.tarpEdge; ctx.beginPath(); ctx.arc(W / 2, cy, R + 6, 0, 7); ctx.fill(); }
        if (k >= 2) { ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, 7); ctx.fill(); }
        if (k >= 3) { ctx.strokeStyle = pal.onAccent; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W / 2, cy, R - 18, 0, 7); ctx.stroke(); }
        if (tl >= 0.85) { const s = tl < 0.85 + 1 / 12 ? 1.2 : 1, L = R * 1.05 * s; brand.logo.draw(ctx, W / 2 - L / 2, cy - L / 2, L, pal.onAccent); }
        kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.ink, each: (w, i, box, c) => M.setDown(c, t, 1.1 + i * 0.08, box) });
        kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.ink, each: (w, i, box, c) => M.setDown(c, t, 1.4, box) });
        if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.muted, each: (w, i, box, c) => M.setDown(c, t, 1.6 + i * 0.08, box) });
      }
      ctx.restore();
    },
  };
}
