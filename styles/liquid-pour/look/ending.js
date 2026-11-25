// The liquid-pour ending: the longest pour of the reel. A wide stream of the key liquid fills the brand's logo from the bottom,
// it sets with a slow wobble and drops grow on its feet; then the brand's name is poured under it in the light liquid, the handle
// (mono) and the slogan after it. Drops from the slogan fall into the pool and the rings keep spreading to the last frame.
// spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, never = 1e9;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 5 });
  const maxW = SAFE.right - SAFE.left - 40;
  const nameF = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const logo = W3.logo(T.size.logo);
  const name = await W3.slab(brand.name, { size: nameF.size, weight: 800, role: 'ink', drops: 1 });
  const handle = await W3.slab(brand.handle, { size: T.size.handle, weight: 600, face: 'mono', role: 'lead', ltr: true, drops: 0 });
  const slogan = brand.slogan?.length ? await W3.slab(brand.slogan.join(' '), { size: T.size.slogan, weight: 700, role: 'key', drops: 1 }) : null;
  const hLogo = logo.h, hName = nameF.size * 1.45, hHandle = T.size.handle * 1.6, hSlogan = slogan ? T.size.slogan * 1.6 : 0;
  const top = kit.place(hLogo + 60 + hName + hHandle + hSlogan, T.layout.centre - 20);
  W3.place(logo, { y: top + hLogo / 2, z: -(logo.depth / 2 + logo.bevel) });
  let y = top + hLogo + 60;
  W3.place(name, { y: y + hName / 2 }); y += hName;
  W3.place(handle, { y: y + hHandle / 2 }); y += hHandle;
  if (slogan) W3.place(slogan, { y: y + hSlogan / 2 });
  const poses = [
    W3.pour(logo, { t0: 0.05, step: 0, fall: 0.2, fill: 0.75, out0: never, out1: never }),
    W3.pour(name, { t0: 0.9, step: 0.08, out0: never, out1: never, drop: !slogan }),
    W3.pour(handle, { t0: 1.35, step: 0.05, out0: never, out1: never }),
    ...(slogan ? [W3.pour(slogan, { t0: 1.6, step: 0.07, out0: never, out1: never, drop: true })] : []),
  ];
  logo.words[0].rS *= 2.2;                                                   // the logo's stream is the widest of the reel
  return {
    duration: d,
    draw(ctx, t) {
      poses.forEach((p) => p(t));
      W3.draw(ctx, t);
    },
  };
}
