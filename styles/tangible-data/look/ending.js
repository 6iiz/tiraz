// The tangible-data ending: the stone base is laid, an accent block falls onto it with the brand's logo cut into its front face, and three
// small plates are set down beside it. The name, the handle (mono face) and the slogan are set down under the base on the plain sweep.
// The whole set creeps slowly towards the camera while it holds. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette;
  const maxW = SAFE.right - SAFE.left - 40, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle + 4, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, minPx: 44, where: 'the slogan' }) : null;
  const floor = 790, cube = 290, cx = (W - cube) / 2, cy = floor - cube;
  const yName = floor + 46 + 56 + name.lead / 2, yHandle = yName + name.lead / 2 + 6 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 4 + (slogan ? slogan.lead / 2 : 0);
  const PL = T.plate, pw = 150, px = rtl ? cx - 60 - pw : cx + cube + 60;
  const set = (t, t0, size) => (w, i, box, c) => { const tw = t0 + i * T.dur.stagger; if (M.setDown(c, span(t, tw, tw + T.dur.word), size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const z = 1 + 0.025 * M.E(span(t, 1.2, d));                    // the slow push in
      ctx.save(); ctx.translate(W / 2, 760); ctx.scale(z, z); ctx.translate(-W / 2, -760);
      M.base(ctx, SAFE.left - 30, SAFE.right + 30, floor, P, rtl, span(t, 0, 0.35));
      for (let k = 0; k < 3; k++) {                                   // plates set down beside the block
        const p = span(t, 1.0 + k * 0.18, 1.0 + k * 0.18 + 0.24); if (p <= 0) break;
        if (k === 0) M.shadow(ctx, px, floor - PL.thick, pw, PL.thick, PL.depth, P, rtl, 0.5, 1);
        const j = M.jitter(31, k); M.box(ctx, px + j.x, floor - (k + 1) * (PL.thick + PL.gap) + M.fall(p, 260), pw + j.w, PL.thick, PL.depth, k === 2 ? P.ruler : P.metal, rtl, 1);
      }
      const pc = span(t, 0.3, 0.7);
      if (pc > 0) {
        M.shadow(ctx, cx, cy, cube, cube, 90, P, rtl, pc, 0.6);
        const y = cy + M.fall(pc, 700);
        M.box(ctx, cx, y, cube, cube, 90, P.acc, rtl);
        const pl = M.E(span(t, 0.75, 1.1));                           // the logo is cut in: it grows from the centre of the face
        if (pl > 0) { const s = cube * 0.62 * pl; brand.logo.draw(ctx, cx + (cube - s) / 2, y + (cube - s) / 2, s, P.onAccent); }
      }
      kit.drawText(ctx, name, { x0, x1, y: yName, color: P.ink, each: set(t, 1.1, name.size) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, color: P.muted, each: set(t, 1.35, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: P.muted, each: set(t, 1.55, slogan.size) });
      ctx.restore();
    },
  };
}
