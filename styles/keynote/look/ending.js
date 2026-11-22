// The keynote ending: the reveal. The stage is empty for a beat, then the logo snaps up on an accent tile (the shape of an app icon)
// with a pool of accent light under it, and the light sweeps across the tile. The name comes up centred under it, then the handle in
// the mono face in a pill, then the slogan, unlit-grey. spec: { duration }
import { need, span, mix, rgba, rr, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, rtl = kit.rtl, L = SAFE.left, R = SAFE.right;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: R - L, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: 34, maxW: R - L - 80, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead + 4, weight: 500, maxW: R - L, single: true, where: 'the slogan' }) : null;
  const tile = 280, cx = W / 2, ty = 330, yName = ty + tile + 80 + name.lead / 2;
  const pillW = handle.width + 64, pillH = handle.size * 2.1, yPill = yName + name.lead / 2 + 24, ySlogan = yPill + pillH + 34 + (slogan ? slogan.lead / 2 : 0);
  const glow = M.pool(pal.accent, 900, 520, T.tone.glow * 1.6);
  const face = (() => {
    const c = document.createElement('canvas').getContext('2d'), g = c.createLinearGradient(cx - tile / 2, ty, cx + tile / 2, ty + tile);
    g.addColorStop(0, mix(pal.accent, pal.light, 0.18)); g.addColorStop(1, mix(pal.accent, pal.dark, 0.22)); return g;
  })();
  const up = (t, t0, size) => (w, i, box, c) => { if (M.arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, 0.35, 0.95);
      if (p > 0) {
        ctx.save(); ctx.globalAlpha = M.E(p); ctx.drawImage(glow, cx - glow.width / 2, ty + tile * 0.75 - glow.height / 2); ctx.restore();
        ctx.save();
        const s = 0.86 + 0.14 * M.E(p), cy = ty + tile / 2;
        ctx.globalAlpha = Math.min(1, p * 3); ctx.translate(cx, cy + (1 - M.E(p)) * 40); ctx.scale(s, s); ctx.translate(-cx, -cy);
        rr(ctx, cx - tile / 2, ty, tile, tile, T.radius.tile); ctx.fillStyle = face; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(pal.light, 0.25); ctx.stroke();
        brand.logo.draw(ctx, cx - tile * 0.29, ty + tile * 0.21, tile * 0.58, pal.dark);
        ctx.restore();
        M.sheen(ctx, cx - tile / 2, ty, tile, tile, T.radius.tile, span(t, 0.8, 1.5), pal.light, rtl, 2.2);
      }
      kit.drawText(ctx, name, { x0: L, x1: R, y: yName, align: 'center', color: pal.light, each: up(t, 1.2, name.size) });
      M.card(ctx, cx - pillW / 2, yPill, pillW, pillH, pillH / 2, pal.s2, pal.border, span(t, 1.55, 1.55 + T.dur.in));
      kit.drawText(ctx, handle, { x0: L, x1: R, y: yPill + pillH / 2, align: 'center', color: pal.light, each: up(t, 1.6, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: L, x1: R, y: ySlogan, align: 'center', color: pal.dim, each: up(t, 1.9, slogan.size) });
    },
  };
}
