// The Icon Motion ending: the stage disc that carried every pictogram leaves its corner and takes the centre, growing as it travels;
// its four quarters fill with the accent one per sixteenth, and the brand's logo is stamped into it. The name slides in under it from
// the reading side, then an ink hairline, the handle in the mono face, and the slogan in grey. spec: { duration }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, S = ground.stage;
  const x0 = SAFE.left, x1 = SAFE.right, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: x1 - x0, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: x1 - x0, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join('  ·  '), { size: 48, weight: 600, maxW: x1 - x0, minScale: 0.92, where: 'the slogan' }) : null;
  const D = { x: W / 2, y: 540, r: 190 };
  const yName = D.y + D.r + 70 + name.lead / 2, yRule = yName + name.lead / 2 + 6, yHandle = yRule + 34 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const m = M.snap(span(t, 0.05, 0.7));
      const cx = lerp(S.x, D.x, m), cy = lerp(S.y, D.y, m), r = lerp(S.r, D.r, m);
      M.stage(ctx, cx, cy, r, P);
      for (let q = 0; q < 4; q++) {                                         // four quarters, one per sixteenth, on the beat after landing
        const k = M.snap(span(t, 0.75 + q * 0.125, 0.75 + q * 0.125 + 0.2)); if (k <= 0) continue;
        const a0 = -Math.PI / 2 + q * Math.PI / 2;
        ctx.fillStyle = P.acc; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r * k, a0, a0 + Math.PI / 2); ctx.closePath(); ctx.fill();
      }
      const st = M.snap(span(t, 1.3, 1.5));
      if (st > 0) { const s = r * 1.1; ctx.save(); ctx.beginPath(); ctx.rect(cx - s / 2, cy + s / 2 - s * st, s, s * st); ctx.clip(); brand.logo.draw(ctx, cx - s / 2, cy - s / 2, s, P.onAcc); ctx.restore(); }
      const iv = (t0) => (rr) => span(t, t0 + rr * 0.1, t0 + rr * 0.1 + T.dur.row);
      M.slideText(ctx, kit, name, { x0, x1, y: yName, align: 'center', color: P.ink, P, keyed: false, rowIn: iv(1.45) });
      const rw = (x1 - x0) * 0.62 * M.glide(span(t, 1.7, 2.0));
      ctx.fillStyle = P.ink; ctx.fillRect(W / 2 - rw / 2, yRule, rw, 4);
      M.slideText(ctx, kit, handle, { x0, x1, y: yHandle, align: 'center', color: P.ink, P, keyed: false, rowIn: iv(1.85) });
      if (slogan) M.slideText(ctx, kit, slogan, { x0, x1, y: ySlogan, align: 'center', color: P.grey, P, keyed: false, rowIn: iv(2.05) });
    },
  };
}
