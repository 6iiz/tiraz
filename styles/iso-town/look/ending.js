// The iso-town ending: a house stands up in the middle of the square, its roof lifts off like a paper flap, and a round sign of the
// accent with the logo rises out of it. The name, the handle (mono) and the slogan stand up off the page under it, and two townsfolk
// stop in front of the house. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 600, maxW, minPx: 44, where: 'the slogan' }) : null;
  const u = 36, hw = 5, hd = 5, hh = 3.2, cx = W / 2 + 40, base = 740;              // base: the front corner of the house on the page
  const P = M.project(cx - ((hw - hd) / 2) * M.C30 * u, base - (hw + hd) * 0.5 * u, u);
  const [sx, sy0] = P(hw / 2, hd / 2, hh), R = 88;
  const yName = base + 70 + name.lead / 2, yHandle = yName + name.lead / 2 + 6 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const rise = (t, t0, size) => (w, i, box, c) => { const s = t0 + i * 0.07; if (M.unfold(c, span(t, s, s + T.dur.in), box, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const g = M.E(span(t, 0.1, 0.6)), lift = M.S(span(t, 0.75, 1.3)), up = M.E(span(t, 0.95, 1.6));
      if (up > 0) {                                     // the sign rises out of the open house (drawn first: the walls stay in front)
        const sy = sy0 - up * 250;
        ctx.fillStyle = pal.trunk; ctx.fillRect(sx - 4, sy, 8, sy0 - sy);
        ctx.fillStyle = pal.awnEdge; ctx.beginPath(); ctx.arc(sx, sy, R + 6, 0, 7); ctx.fill();
        ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(sx, sy, R, 0, 7); ctx.fill();
        brand.logo.draw(ctx, sx - R * 0.62, sy - R * 0.62, R * 1.24, pal.onAccent);
      }
      M.house(ctx, P, hw, hd, hh, 2.2, pal.walls[0], pal.roofs[0], { grow: g, lift, inside: pal.walls[3].top, glass: pal.glass, lit: pal.lit, doorAt: 1 });
      [[-250, -10, 1], [-190, 6, 3]].forEach(([dx, dy, c], k) => M.person(ctx, cx + dx, base + dy - 20, 1.3, pal.coats[c], pal, 0, M.E(span(t, 0.4 + k * 0.1, 0.8 + k * 0.1))));
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: pal.ink, each: rise(t, 1.3, name.size) });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: pal.ink, each: rise(t, 1.55, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: pal.muted, each: rise(t, 1.75, slogan.size) });
    },
  };
}
