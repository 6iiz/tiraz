// The etched-celluloid ending: rays are scratched out all round a centre with dye at their root, the logo is cut in from the top (light
// through the emulsion, crossed by fine hatching so it reads as a cut, not a stamp) and boils; then the brand's name is cut large, the
// handle in the mono face and the slogan faint, each behind the hot point. spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, sun: false });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, cx = W / 2;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.name, maxW: x1 - x0, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW: x1 - x0, single: true, where: 'the slogan' }) : null;
  const L = 230, cy = 540, yName = cy + L / 2 + 120 + name.lead / 2, yHandle = yName + name.lead / 2 + 20 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  // the logo, built once: light through the emulsion, crossed by fine diagonal cuts of emulsion so it reads as hatched, not stamped
  const logo = document.createElement('canvas'); logo.width = logo.height = L + 40;
  const g = logo.getContext('2d'); brand.logo.draw(g, 20, 20, L, P.cream);
  g.globalCompositeOperation = 'destination-out'; g.lineWidth = 1.8; g.beginPath();
  for (let k = -L - 40; k < L + 40; k += 8) { g.moveTo(k, L + 40); g.lineTo(k + L + 40, 0); }
  g.stroke();
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const n = ground.n(t), w = ground.weave(t);
      ctx.save(); ctx.translate(w.x, w.y);
      M.burst(ctx, cx, cy, 0, Math.PI * 2, L * 0.82, L * 1.15, 26, { n, seed: 81, P, p: span(t, 0.05, 0.6), alpha: 0.4 });
      const pl = span(t, 0.3, 0.8);
      if (pl > 0) {
        const b = M.boil(n, 82, 1.4);
        ctx.save(); ctx.translate(b.x, b.y);
        ctx.beginPath(); ctx.rect(cx - L / 2 - 10, cy - L / 2 - 10, L + 20, (L + 20) * pl); ctx.clip();
        ctx.shadowColor = rgba(P.cream, 0.6); ctx.shadowBlur = 24;
        ctx.drawImage(logo, cx - L / 2 - 20, cy - L / 2 - 20);
        ctx.restore();
        if (pl < 1) M.hot(ctx, cx + (M.boil(n, 83, 1).x * 60), cy - L / 2 - 10 + (L + 20) * pl, 120, P, n);
      }
      M.cutText(kit, ctx, name, { x0, x1, y: yName, align: 'center', t, t0: 0.9, step: 0.1, dur: 0.22, n, seed: 85, P });
      M.cutText(kit, ctx, handle, { x0, x1, y: yHandle, align: 'center', t, t0: 1.35, step: 0.06, dur: 0.25, n, seed: 86, P });
      if (slogan) M.cutText(kit, ctx, slogan, { x0, x1, y: ySlogan, align: 'center', t, t0: 1.7, step: 0.08, dur: 0.16, n, seed: 87, P, color: P.faint });
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
