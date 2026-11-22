// The Coded Gears ending: a large wheel in the accent system with a paper hub, meshed with a slate wheel and a deep-accent wheel. The
// slate wheel drives; the big wheel is dyed from the tooth where they meet, the logo clicks onto its hub, and the train keeps turning
// at its true ratios to the last frame. The name clicks in under it, then the handle in the mono face and the slogan in grey.
// spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 500, maxW, minScale: 0.9, minPx: 40, where: 'the slogan' }) : null;
  const tr = M.train(13, { N: 14, x: W / 2 + (rtl ? -159 : 159), y: 760 }, [{ N: 30, phi: rtl ? -0.98 : Math.PI + 0.98 }, { N: 12, phi: rtl ? -0.35 : Math.PI + 0.35 }]);
  const drv = tr.g[0], big = tr.g[1], kk = drv.G.r / (drv.G.r + big.G.r), contact = [drv.x + (big.x - drv.x) * kk, drv.y + (big.y - drv.y) * kk];
  const hub = big.G.r * 0.5, yName = 1000, yHandle = yName + name.lead / 2 + 8 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 8 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ck = (t0) => (w, i, box, c) => { if (M.click(c, t, t0 + i * 0.06, 0.25, d + 1, d + 2, box) === false) return false; };
      const inP = M.smooth(span(t, 0, 0.5)), A = tr.angles(t * 0.9);
      ctx.save(); ctx.globalAlpha = inP;
      M.drawGear(ctx, tr.g[2].G, tr.g[2].x, tr.g[2].y, A[2], pal.C);
      M.drawGear(ctx, drv.G, drv.x, drv.y, A[0], pal.B);
      M.drawGear(ctx, big.G, big.x, big.y, A[1], pal.A, { neutral: pal.N, dye: { x: contact[0], y: contact[1], r: 3 * big.G.r * M.smooth(span(t, 0.35, 1.25)) }, depth: 14 });
      // the hub: a paper disc that does not turn, ringed in the accent's own line, with the logo on it
      ctx.fillStyle = pal.P.side; ctx.beginPath(); ctx.arc(big.x + 6, big.y + 10, hub, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.P.fill; ctx.beginPath(); ctx.arc(big.x, big.y, hub, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pal.A.line; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      const lp = M.ratchet(span(t, 1.15, 1.45));
      if (lp > 0) { const s = hub * 1.25 * (0.85 + 0.15 * lp); ctx.save(); ctx.globalAlpha = Math.min(1, lp * 3); ctx.translate(big.x, big.y); ctx.rotate((1 - lp) * -0.3); brand.logo.draw(ctx, -s / 2, -s / 2, s, pal.ink); ctx.restore(); }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.ink, each: ck(1.5) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.ink, each: ck(1.85) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.grey, each: ck(2.1) });
    },
  };
}
