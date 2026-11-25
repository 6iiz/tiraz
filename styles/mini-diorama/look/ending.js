// The mini-diorama ending: the shop gets its sign. A square board with the brand's logo standing out of it in the accent falls
// into place first, then the name board, then a small plate with the handle (mono) and one with the slogan. The little people
// carry on; the camera keeps circling the room. spec: { duration }
import { need } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const R3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 5 + Math.round(clock) });
  const rg = R3.region, pad = 2 * T.sign.padX;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: rg.w - pad, single: true, lead: 1.25, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 600, maxW: rg.w - pad, single: true, lead: 1.3, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW: rg.w - pad, single: true, lead: 1.3, where: 'the slogan' }) : null;
  const L = 260, bn = R3.boardSize(name), bh = R3.boardSize(handle), bs = slogan ? R3.boardSize(slogan) : null;
  const ys = R3.stack([L + 40, bn.h, bh.h, ...(slogan ? [bs.h] : [])], T.layout.centre, 14);
  const logo = R3.sign({ cx: rg.cx, cy: ys[0], wpx: L + 40, hpx: L + 40, depth: 22, paint: (g, w, h) => R3.plate(g, w, h), text: '' });
  R3.logoOn(logo, L * 0.78);
  const nm = R3.sign({ cx: rg.cx, cy: ys[1], wpx: Math.max(bn.w, 420), hpx: bn.h, depth: 18, paint: R3.textPaint(name, {}), text: brand.name });
  const hd = R3.sign({ cx: rg.cx, cy: ys[2], wpx: bh.w, hpx: bh.h, depth: 10, paint: R3.textPaint(handle, {}), text: brand.handle });
  const sl = slogan ? R3.sign({ cx: rg.cx, cy: ys[3], wpx: bs.w, hpx: bs.h, depth: 10, paint: R3.textPaint(slogan, { color: R3.tn.accent, ink: R3.tn.keyInk }), text: brand.slogan.join(' ') }) : null;
  const plan = [[logo, 0.15], [nm, 0.6], [hd, 0.95], [sl, 1.2]].filter(([s]) => s);
  return {
    duration: d,
    draw(ctx, t) {
      plan.forEach(([s, t0]) => s.pose(t, t0));
      R3.draw(ctx, t);
      plan.forEach(([s]) => s.rec());
    },
  };
}
