// The travel-print ending: the poster's title plate printed pull by pull. A sun of rings is laid in the accent with the brand's
// logo in its centre; the name is pulled in the key ink under it; the information band follows with the handle knocked out in
// paper; the slogan is printed last in the muted ink. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: maxW - 40, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const R = 175, cy = 300 + R, yName = cy + R + 50 + name.lead / 2, bandH = handle.lead + 40, yBand = yName + name.lead / 2 + 24;
  const ySlogan = yBand + bandH + 40 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.pull(ctx, span(t, 0.1, 0.6), { x0: W / 2 - R - 10, x1: W / 2 + R + 10, y0: cy - R - 10, y1: cy + R + 10 }, P.accent, P, () => {
        M.rings(ctx, W / 2 + 4, cy + 3, R, 5, [P.mid]); M.rings(ctx, W / 2, cy, R, 5, [P.accent, P.ring]);
        ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(W / 2, cy, R * 0.66, 0, Math.PI * 2); ctx.fill();
        brand.logo.draw(ctx, W / 2 - R * 0.44, cy - R * 0.44, R * 0.88, P.onAccent);
      }, { rtl, seed: 1 });
      M.pull(ctx, span(t, 0.65, 1.1), { x0: SAFE.left, x1: SAFE.right, y0: yName - name.lead / 2, y1: yName + name.lead / 2 }, P.ink, P,
        () => kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: P.ink, key: P.ink }), { rtl, seed: 3 });
      M.pull(ctx, span(t, 1.05, 1.5), { x0: SAFE.left - 20, x1: SAFE.right + 20, y0: yBand, y1: yBand + bandH + 14 }, P.ink, P, () => {
        ctx.fillStyle = P.ghost; ctx.fillRect(SAFE.left - 17, yBand + 3, SAFE.right - SAFE.left + 40, bandH);
        ctx.fillStyle = P.ink; ctx.fillRect(SAFE.left - 20, yBand, SAFE.right - SAFE.left + 40, bandH);
        ctx.fillStyle = P.accent; ctx.fillRect(SAFE.left - 20, yBand + bandH + 6, SAFE.right - SAFE.left + 40, 6);
        kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yBand + bandH / 2, color: P.paper, key: P.paper });
      }, { rtl, seed: 5 });
      if (slogan) M.pull(ctx, span(t, 1.45, 1.85), { x0: SAFE.left, x1: SAFE.right, y0: ySlogan - slogan.lead / 2, y1: ySlogan + slogan.lead / 2 }, P.muted, P,
        () => kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.muted, key: P.muted }), { rtl, seed: 7 });
    },
  };
}
