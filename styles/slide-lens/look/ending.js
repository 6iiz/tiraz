// The slide-lens ending, the climb back: the field of view pulls out and shrinks to a small round slide on the bench, the section
// clears to bare glass, and the brand's logo comes into focus on it in ink. A ring is traced round the slide in the accent, then the
// name, the handle and the slogan come into focus on the bench below. spec: { duration }
import { need, span, lerp, contrast, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, L = T.lens;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 500, maxW, minPx: T.minPx, where: 'the slogan' }) : null;
  const to = { x: L.cx, y: 560, r: 190 };
  const yName = to.y + to.r + 70 + name.lead / 2, yHandle = yName + name.lead / 2 + 10 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const handleC = contrast(brand.colors.accent, pal.bench) >= 3.2 ? brand.colors.accent : pal.benchGrey;
  const fx = (t0, size) => (w, i, box, c) => { const s = t0 + i * 0.07; return M.focus(c, span(t, s, s + T.dur.in), 0, box, size, T.blur); };
  let t = 0;
  return {
    duration: d,
    draw(ctx, time) {
      t = time;
      const z = M.S(span(t, 0.1, 1.1));
      const cx = lerp(L.cx, to.x, z), cy = lerp(L.cy, to.y, z), R = lerp(L.r, to.r, z);
      ground.bench(ctx);
      ground.lens(ctx, t, cx, cy, R, lerp(1, 0.45, z), 0.6 * Math.sin(Math.PI * z));
      const clear = M.S(span(t, 0.7, 1.2));                                   // the section clears to bare glass
      if (clear > 0) { ctx.save(); ctx.globalAlpha = clear * 0.92; ctx.fillStyle = pal.glass; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      const lp = span(t, 0.95, 1.45);
      if (lp > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, lp * 2.4); const b = T.blur * (1 - M.E(lp)); if (b > 0.4) ctx.filter = `blur(${b.toFixed(1)}px)`;
        const s = to.r * 1.08; brand.logo.draw(ctx, to.x - s / 2, to.y - s / 2, s, pal.ink); ctx.restore();
      }
      M.ring(ctx, to.x, to.y, to.r + 26, to.r + 26, span(t, 1.15, 1.7), 0, { ...pal, ring: brand.colors.accent, stain: () => 'rgba(0,0,0,0)' });
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.onBench, each: fx(1.45, name.size) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: handleC, each: fx(1.75, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.benchGrey, each: fx(1.95, slogan.size) });
    },
  };
}
