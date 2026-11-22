// The clay ending: a soft slab of the accent clay drops onto the table and settles. The brand's logo, made of dark clay, comes down
// from above like a stamp and is pressed into the slab, which squashes and wobbles under it; the logo stays half sunk in. The name
// lands under it in dark clay, then the handle and the slogan in the soft clay colour. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const world = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { POSE, FALL, plop, ease } = await import(look.base + 'motion.js');
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const side = 360, thick = 70, ySlab = 300 + side / 2;
  const slab = world.slab(side, side, thick), slabRest = world.at(W / 2, ySlab, thick).setZ(0);
  const logo = await world.logo(side * 0.62), lDepth = side * 0.62 * 0.16;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: brand.fonts.mono?.family ?? brand.fonts.display.family, weight: 700, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: T.weight.lead, maxW, where: 'the slogan' }) : null;
  const yName = ySlab + side / 2 + 110 + name.lead / 2, yHandle = yName + name.lead / 2 + 20 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const N = await world.text(name, { x0, x1, y: yName });
  const Hd = await world.text(handle, { x0, x1, y: yHandle, face: 'mono', color: world.soft });
  const Sg = slogan ? await world.text(slogan, { x0, x1, y: ySlogan, color: world.soft }) : { rows: [], pieces: [] };
  const press = 1.3;                                                   // the moment the logo meets the slab
  return {
    duration: d,
    draw(ctx, t) {
      world.frame(ctx, t, (tq, k) => {
        world.drop({ obj: slab, rest: slabRest, i: 1 }, tq, k, 0.05, { amp: 1.2 });
        if (tq >= press - FALL) {                                      // pressed: the slab flattens and wobbles back
          const w = plop(tq, press - FALL, 1.3); slab.scale.set(w.sx, w.sy, w.sz);
        }
        // the stamp: hangs high, comes down in poses, sinks into the slab
        const down = ease(span(tq, press - 0.45, press)), top = thick * slab.scale.z;
        logo.visible = tq >= 0.55;
        const z0 = top - lDepth * 0.2, cam = world.camera.position, f = (1 - down) * 650 / (cam.z - z0);   // straight down the line of sight
        logo.position.set(slabRest.x + (cam.x - slabRest.x) * f, slabRest.y + (cam.y - slabRest.y) * f, z0 + (cam.z - z0) * f);
        logo.scale.set(1, 1, 1); logo.rotation.set(0, 0, (1 - down) * 0.1);
        N.pieces.forEach((p, i) => world.drop(p, tq, k, press + 0.35 + i * POSE, { amp: 1.2 }));
        Hd.pieces.forEach((p, i) => world.drop(p, tq, k, press + 0.75 + i * POSE));
        Sg.pieces.forEach((p, i) => world.drop(p, tq, k, press + 1.0 + i * POSE));
        return [...N.rows, ...Hd.rows, ...Sg.rows].map((x) => [x.pieces.map((p) => p.obj), x.text]);
      });
    },
  };
}
