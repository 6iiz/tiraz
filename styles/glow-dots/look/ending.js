// The glow-dots ending: every point in the night is called in. They spiral from all over the frame onto the brand's logo and it
// kindles whole in light; a slow ring of accent fireflies settles round it. Then the name gathers below, and the handle and the
// slogan kindle under it in dimmer light. spec: { duration }
import { need, span, mix, contrast, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? M.balanced(kit, brand.slogan.join(' · '), { size: T.size.slogan, weight: 500, maxW, minPx: T.minPx, where: 'the slogan' }) : null;
  const ls = 300, ly = 400, lx = W / 2 - ls / 2;
  const LOGO = M.lightPicture((g, c) => brand.logo.draw(g, lx, ly, ls, brand.logo.shape === false ? undefined : c), { x0: lx, y0: ly, x1: lx + ls, y1: ly + ls }, { color: pal.glow, gap: 7, seed: 61, glow: 36 });
  const yName = ly + ls + 90 + name.lead / 2, yHandle = yName + name.lead / 2 + 14 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 12 + (slogan ? slogan.lead / 2 : 0);
  const NM = M.lightText(kit, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: pal.glow, key: pal.key, gap: T.gap.line, seed: 62 });
  const hc = contrast(pal.key, pal.night) >= 4.5 ? pal.key : pal.lead;
  const HD = M.lightText(kit, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: hc, key: hc, gap: 400, seed: 63 });
  const SL = slogan && M.lightText(kit, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: pal.lead, key: pal.lead, gap: T.gap.small, seed: 64 });
  const run = { x0: lx - 40, x1: lx + ls + 40, y: ly + ls / 2, first: 0, last: 0 };
  const forever = { t1: 999, q: 1 };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, 1 - 0.6 * M.S(span(t, 0, 1.2)));           // the night's own fireflies are called in
      M.drawLight(ctx, LOGO, t, () => ({ t0: 0.05, g: 1.2, ...forever }), { rest: 0.22, kindleFrom: 0.8 });
      M.halo(ctx, run, ls * 0.72, t, { t0: 0.6, g: 0.8, ...forever }, pal.spark);
      M.drawLight(ctx, NM, t, (i) => ({ t0: 1.1 + i * 0.08, g: 0.7, ...forever }), { rest: 0.2 });
      M.drawLight(ctx, HD, t, () => ({ t0: 1.6, g: 0.35, ...forever }), { rest: 0 });
      if (SL) M.drawLight(ctx, SL, t, (i) => ({ t0: 1.8 + i * 0.05, g: 0.5, ...forever }), { rest: 0.15 });
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, each: () => false });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, each: () => false });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, each: () => false });
    },
  };
}
