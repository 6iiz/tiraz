// The crimson-cut ending: a folded wedge of red paper snaps open into a great window flower with a solid centre, the logo is pasted
// into that centre, the brand's name is pasted on a deep red banner with swallow-tail ends, the handle and the slogan on the sheet below.
// Then the offcuts of the cutting drift down the sheet's margins, slowly, while the flower turns. spec: { duration }
import { need, SAFE, rng } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: maxW - 200, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW, single: true, where: 'the slogan' }) : null;
  const R = 250, ri = R * 0.5, cy = SAFE.top + R - 20, bh = name.size * 1.9, bw = Math.min(maxW + 40, name.width + 200);
  const yName = cy + R + 40 + bh / 2, yHandle = yName + bh / 2 + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const rose = M.rosette(R, P.red, ri, 3), ban = M.banner(bw, bh, P.deep, 25);
  const r = rng(62), scraps = [];
  for (let i = 0; i < 16; i++) {
    const s = 8 + r() * 14, n = 3 + Math.floor(r() * 2), pts = [];
    for (let k = 0; k < n; k++) { const b = (k / n) * 6.28 + r() * 0.8; pts.push([Math.cos(b) * s, Math.sin(b) * s * (0.5 + r() * 0.5)]); }
    scraps.push({ x: i % 2 ? 20 + r() * 130 : W - 20 - r() * 130, t0: 1.6 + r() * 3, v: 90 + r() * 70, sway: 20 + r() * 30, f: 1 + r() * 2, spin: (r() - 0.5) * 4, pts, c: r() < 0.6 ? P.red : P.far });
  }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      for (const s of scraps) {
        const u = t - s.t0; if (u < 0) continue; const y = -20 + s.v * u; if (y > H + 30) continue;
        ctx.save(); ctx.translate(s.x + Math.sin(u * s.f) * s.sway, y); ctx.rotate(u * s.spin); ctx.fillStyle = s.c;
        ctx.beginPath(); s.pts.forEach(([a, b], k) => (k ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.fill(); ctx.restore();
      }
      M.unfold(ctx, rose, W / 2, cy, t - 0.05, { gap: T.unfold.gap, dur: T.unfold.swing, turn: t * 0.05 });
      const kl = M.paste(t, 1.1);
      if (kl > 0) { const s = ri * 1.25; ctx.save(); ctx.translate(W / 2, cy); ctx.scale(kl, kl); brand.logo.draw(ctx, -s / 2, -s / 2, s, P.onRed); ctx.restore(); }
      const kn = M.paste(t, 1.35);
      if (kn > 0) {
        M.lay(ctx, ban, W / 2, yName, kn);
        ctx.save(); ctx.translate(W / 2, yName); ctx.scale(kn, kn); ctx.translate(-W / 2, -yName);
        kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName + name.size * 0.04, align: 'center', color: P.onDeep }); ctx.restore();
      }
      if (M.paste(t, 1.6) > 0) kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.txt });
      if (slogan && M.paste(t, 1.8) > 0) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.txt });
    },
  };
}
