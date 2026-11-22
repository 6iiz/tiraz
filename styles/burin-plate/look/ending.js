// The burin-plate ending: a large roundel is cut around, its ring filled with engine-turned lines, and the brand's logo is engraved in
// it in three passes (lines, crossed lines, solid). Then colour arrives by hand: a wash of the accent is laid inside the roundel. The
// name is engraved below as the plate's title, over a rule with a lozenge, then the handle in the mono face and the slogan in a soft ink.
// spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: full, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: full, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW: full, single: true, where: 'the slogan' }) : null;
  const R = 195, cx = W / 2, cy = 300 + R, yName = cy + R + 50 + name.lead / 2, yRule = yName + name.lead / 2 + 8;
  const yHandle = yRule + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  const ring = [];
  for (let i = 0; i < 140; i++) { const a = (i / 140) * Math.PI * 2, b = a - 0.14; ring.push([cx + Math.cos(a) * (R - 44), cy + Math.sin(a) * (R - 44), cx + Math.cos(b) * (R - 12), cy + Math.sin(b) * (R - 12)]); }
  const word = (t, t0, f, color) => (w, i, box, c) => M.engrave(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.word), box, f.size, color, rtl);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.roundel(ctx, cx, cy, R, span(t, 0.05, 0.55), P, 4);
      M.roundel(ctx, cx, cy, R - 50, span(t, 0.15, 0.65), P, 2);
      const n = Math.floor(ring.length * M.E(span(t, 0.3, 1.0)));
      ctx.fillStyle = P.ink; for (let i = 0; i < n; i++) { const [a, b, c2, e] = ring[i]; M.swell(ctx, a, b, c2, e, 1.6); }
      const pl = span(t, 0.45, 1.25);
      if (pl > 0) {
        const s = (R - 60) * 1.25;
        ctx.save();
        if (pl < 1 / 3) { const w = s * M.E(pl * 3); ctx.beginPath(); ctx.rect(rtl ? cx + s / 2 - w : cx - s / 2, cy - s / 2, w, s); ctx.clip(); }
        brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, M.inkFor(ctx, pl, P.ink));
        ctx.restore();
      }
      M.wash(ctx, cx, cy, R - 54, R - 56, span(t, 1.35, 1.35 + T.dur.wash + 0.2), P, 5);
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: P.ink, each: word(t, 1.0, name, P.ink) });
      M.ornament(ctx, cx, yRule, Math.max(name.width, 360) + 40, span(t, 1.3, 1.8), P);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: P.ink, each: word(t, 1.6, handle, P.ink) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: P.soft, each: word(t, 1.85, slogan, P.soft) });
    },
  };
}
