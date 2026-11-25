// The gallery-walk ending: the last canvas of the corridor. The visitor walks up to it; the brand's logo stands out of the canvas as a
// relief in the accent and pushes forward, catching the picture light and throwing its shadow on the canvas. The name is painted under
// it, then an accent stroke, the slogan in grey and the handle in the mono face. The light comes up, and the visitor slowly steps back
// to take in the whole wall. spec: { duration, at? }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, at = spec.at ?? 0;
  const G = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { E } = await import(look.base + 'motion.js');
  const A = G.area, maxW = A.x1 - A.x0, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the name' });
  const slogans = (brand.slogan ?? []).map((s) => kit.fit(s, { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }));
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 600, maxW, single: true, where: 'the handle' });
  const lg = 300, g0 = 56, g1 = 34;
  const hB = lg + g0 + name.lead + g1 + slogans.reduce((s, f) => s + f.lead, 0) + handle.lead;
  const top = A.cy - hB / 2;
  const logo = G.logo(lg, A.cx, top + lg / 2);
  let y = top + lg + g0 + name.lead / 2;
  const nm = await G.row(name, 0, { y }); y += name.lead / 2;
  const rule = G.bar({ x0: A.cx - 70, x1: A.cx + 70, y: y + g1 / 2 - 6, h: 12 }); y += g1;
  const sl = []; for (const f of slogans) { sl.push(await G.row(f, 0, { y: y + f.lead / 2, color: G.P.grey })); y += f.lead; }
  const hd = await G.row(handle, 0, { y: y + handle.lead / 2, color: G.P.key });
  const w = T.walk, tl = at + w + 0.05, pull = { t0: Math.max(at + w + 1.8, d - 2.6), t1: d, by: 0.16 };
  const plan = [[nm, tl + 0.35], ...sl.map((l, i) => [l, tl + 0.75 + i * 0.16]), [hd, tl + 0.8 + sl.length * 0.16]];
  return {
    duration: d,
    draw(ctx, t) {
      const walking = G.pose(t, at, d, { exit: false, pull }); G.lamp(t, at, d, false);
      logo.grow(E(span(t, tl, tl + 0.6)));
      for (const [l, t0] of plan) { G.wipe(l, E(span(t, t0, t0 + T.dur.wipe))); G.rec(l, walking); }
      G.wipe(rule, E(span(t, tl + 0.6, tl + 0.6 + 0.2)));
      G.render(ctx);
    },
  };
}
