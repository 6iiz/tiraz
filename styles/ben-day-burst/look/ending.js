// The ben-day-burst ending: one big print. A giant paper dot sits on the dot field and the brand's logo is printed in it in the key
// colour; the print is pulled again in each colourway in turn. The name is printed by the blade on a slab of the key colour, then the
// handle in the mono face and the slogan. spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left - 60;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const r = { x: 40, y: 40, w: W - 80, h: 780 }, R = 250, cx = W / 2, cy = r.y + r.h / 2 + 40;
  const yName = r.y + r.h + 70 + name.lead / 2, yHandle = yName + name.lead / 2 + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.cycling(ctx, r, P.ways, 0, { t, t0: -0.25, start: 1.6, lag: 0, every: T.dur.swap, rtl, dots: ground.dots, keyC: P.night, paperC: P.paper, step: T.dur.step, plate: T.dur.plate,
        extra: (c) => {
          c.fillStyle = P.paper; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill(); c.strokeStyle = P.night; c.lineWidth = 12; c.stroke();
          brand.logo.draw(c, cx - R * 0.6, cy - R * 0.6, R * 1.2, P.night);
        } });
      const o = { x0: SAFE.left + 30, x1: SAFE.right - 30, align: 'center', t, P, d: 0.4 };
      M.pullText(ctx, kit, name, { ...o, y: yName, t0: 0.7, color: P.paper, slab: P.night });
      M.pullText(ctx, kit, handle, { ...o, y: yHandle, t0: 1.0 });
      if (slogan) M.pullText(ctx, kit, slogan, { ...o, y: ySlogan, t0: 1.15 });
    },
  };
}
