// The fold-out ending: the book's last spread. A big accent badge pops up with the brand's logo printed on it, then the name on a wide
// paper card in front of its foot, then the handle and the slogan on a small card that pops up last. Everything keeps breathing on its
// hinge while the outro plays. spec: { duration }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = T.textW - 80;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const R = 150, badge = M.piece(2 * R, 2 * R, (g) => {
    M.wobble(g, Array.from({ length: 40 }, (_, k) => { const a = (k / 40) * Math.PI * 2; return [R + Math.cos(a) * (R - 6), R + Math.sin(a) * (R - 6)]; }), 1.5, 19);
    g.fillStyle = P.accent; g.fill(); g.lineWidth = 4.5; g.strokeStyle = P.ink; g.stroke();
  }, P, { seed: 43 });
  const nw = Math.min(W - 90, name.width + 120), nh = name.height + 40, sw = Math.min(W - 90, Math.max(handle.width, slogan ? slogan.width : 0) + 100);
  const sh = handle.height + (slogan ? slogan.height : 0) + 40;
  const NC = M.card(nw, nh, P.card, P, 47), SC = M.card(sw, sh, P.card, P, 49);
  const block = 2 * R + nh - 30 + sh + 20, top = kit.place(block, 680);
  const bBase = top + 2 * R, nBase = bBase + nh - 30, sBase = nBase + 20 + sh;
  const breathe = (t, k) => 1 - 0.01 * (1 + Math.sin(t * 1.4 + k));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const s1 = M.pop(span(t, 0.05, 0.5)) * breathe(t, 0), s2 = M.pop(span(t, 0.45, 0.9)) * breathe(t, 1), s3 = M.pop(span(t, 0.85, 1.3)) * breathe(t, 2);
      M.stand(ctx, badge, W / 2, bBase, s1, (c) => brand.logo.draw(c, W / 2 - R * 0.55, bBase - R - R * 0.55, R * 1.1, P.on));
      M.stand(ctx, NC, W / 2, nBase, s2, (c) => kit.drawText(c, name, { x0: W / 2 - nw / 2, x1: W / 2 + nw / 2, y: nBase - nh / 2, align: 'center', color: P.dark }));
      M.stand(ctx, SC, W / 2, sBase, s3, (c) => {
        const y = sBase - sh + 20 + handle.lead / 2;
        kit.drawText(c, handle, { x0: W / 2 - sw / 2, x1: W / 2 + sw / 2, y, align: 'center', color: P.soft });
        if (slogan) kit.drawText(c, slogan, { x0: W / 2 - sw / 2, x1: W / 2 + sw / 2, y: y + handle.lead / 2 + slogan.lead / 2, align: 'center', color: P.dark });
      });
    },
  };
}
