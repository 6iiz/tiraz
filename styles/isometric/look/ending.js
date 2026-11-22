// The isometric ending: a floor tile lands, a cube of the brand's accent extrudes out of it, and the logo is printed onto the cube's
// top face in true isometric (the logo's square mapped onto the face). The name, the handle in the mono face and the slogan settle
// under it, centred. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, u = 60;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const oy = 560, P = M.project(W / 2, oy, u), side = 4;
  const yName = oy + (side + 1.6) * u + name.lead / 2, yHandle = yName + name.lead / 2 + handle.lead / 2 + 6, ySlogan = yHandle + handle.lead / 2 + (slogan ? slogan.lead / 2 : 0) + 6;
  const rise = (t, t0, size) => (w, i, box, c) => { if (M.arrive(c, span(t, t0 + i * T.dur.stagger, t0 + i * T.dur.stagger + T.dur.in), box, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tile = M.G(span(t, 0, 0.35));
      if (tile > 0) M.block(ctx, P, -1, -1, 0, side + 2, side + 2, 0.4 * tile, pal.floor);
      const h = side * M.G(span(t, 0.3, 1.0));
      if (h > 0) M.block(ctx, P, 0, 0, 0.4, side, side, h, pal.hot);
      const st = M.E(span(t, 1.0, 1.4));
      if (st > 0) {
        // the logo's square goes onto the top face: x axis along the cube's x edge, y axis along its y edge
        const z = 0.4 + h, [ox, oy2] = P(0, 0, z), [ax, ay] = P(1, 0, z), [bx, by] = P(0, 1, z);
        ctx.save();
        ctx.transform(ax - ox, ay - oy2, bx - ox, by - oy2, ox, oy2);       // 1 unit of the face = 1 px of this space
        ctx.scale(side / 256, side / 256);
        ctx.beginPath(); ctx.rect(0, 0, 256, 256 * st); ctx.clip();
        brand.logo.draw(ctx, 40, 40, 176, pal.onAccent);
        ctx.restore();
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, color: pal.text, each: rise(t, 1.3, name.size) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, color: pal.keyText, each: rise(t, 1.6, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, color: pal.muted, each: rise(t, 1.8, slogan.size) });
    },
  };
}
