// The cut-out ending: a torn disc of the accent is put down and pressed with the brand's logo printed on it, the name follows on a
// big torn paper slip, the handle on a dark label slip, the slogan on a last paper slip, each turned its own small way. The pinned
// engravings keep rocking around them. spec: { duration }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const { rng } = await import('/engine/kit.js');
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: T.textW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: T.textW - 60, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW: T.textW - 40, single: true, where: 'the slogan' }) : null;
  const R = 150, nw = name.width + 100, nh = name.lead + 30, hw = handle.width + 60, hh = handle.lead + 22, sw = slogan ? slogan.width + 60 : 0, sh = slogan ? slogan.lead + 22 : 0;
  const cyD = 300 + R + 10, cyN = cyD + R + 40 + nh / 2, cyH = cyN + nh / 2 + 26 + hh / 2, cyS = cyH + hh / 2 + 22 + sh / 2;
  const r = rng(91), pts = []; for (let a = 0; a < Math.PI * 2; a += 0.08) pts.push([Math.cos(a) * (R + (r() - 0.5) * 12), Math.sin(a) * (R + (r() - 0.5) * 12)]);
  const disc = (c) => { c.moveTo(...pts[0]); pts.forEach((p) => c.lineTo(...p)); c.closePath(); };
  const nameS = M.torn(nw, nh, 93, 14, true), handS = M.torn(hw, hh, 95, 8), sloS = slogan ? M.torn(sw, sh, 97, 9) : null;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      M.piece(ctx, P, M.press(span(tt, 0.1, 0.1 + T.dur.press * 1.3), -3, 1), W / 2, cyD, disc, (c) => {
        c.fillStyle = P.paper; c.beginPath(); disc(c); c.fill(); c.scale(0.96, 0.96); c.fillStyle = P.accent; c.beginPath(); disc(c); c.fill(); c.scale(1 / 0.96, 1 / 0.96);
        brand.logo.draw(c, -R * 0.55, -R * 0.55, R * 1.1, P.onAccent);
      });
      M.piece(ctx, P, M.press(span(tt, 0.6, 0.6 + T.dur.press), 1.2, -1), W / 2, cyN, nameS, (c) => {
        M.slip(c, P, nameS, P.paper); kit.drawText(c, name, { x0: -name.width / 2, x1: name.width / 2, y: 0, color: P.ink, key: P.ink });
      });
      M.piece(ctx, P, M.press(span(tt, 1.0, 1.0 + T.dur.press), -1.6, 1), W / 2, cyH, handS, (c) => {
        M.slip(c, P, handS, P.ink); kit.drawText(c, handle, { x0: -handle.width / 2, x1: handle.width / 2, y: 0, color: P.paper, key: P.paper });
      });
      if (slogan) M.piece(ctx, P, M.press(span(tt, 1.35, 1.35 + T.dur.press), 0.9, -1), W / 2, cyS, sloS, (c) => {
        M.slip(c, P, sloS, P.paper); kit.drawText(c, slogan, { x0: -slogan.width / 2, x1: slogan.width / 2, y: 0, color: P.ink, key: P.ink });
      });
    },
  };
}
