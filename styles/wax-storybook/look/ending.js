// The storybook ending, the last page: a big crayon sun is coloured in with the accent and ringed in dark wax, the brand's logo is
// pressed into its middle, then the name is printed under it and underlined in crayon, with the handle and the slogan beneath, like
// the last words of a picture book. The page keeps boiling softly to the end. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, K = M.masks(W, H);
  const maxW = SAFE.right - SAFE.left - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.reduce((a, b) => a + (/[\p{P}]$/u.test(a) ? ' ' : '، ') + b), { size: T.size.slogan, weight: 600, maxW, minScale: 0.7, where: 'the slogan' }) : null;
  const cx = W / 2, cy = 480, R = 140, yName = 760, yHandle = yName + name.lead / 2 + 50, ySlogan = yHandle + 70;
  const write = (t, t0, f) => (w, i, box, c) => M.write(c, span(t, t0 + i * T.dur.gap, t0 + i * T.dur.gap + T.dur.word), box, f.size, rtl);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const b = ground.boil(t), pf = span(t, 0.05, 0.75), po = span(t, 0.3, 0.95);
      if (pf > 0) M.wax(ctx, K.heavy, [cx - R - 120, cy - R - 120, R * 2 + 240, R * 2 + 240], (c) => {
        M.colour(c, M.ellipse(cx, cy, R, R), [cx - R - 8, cy - R - 8, R * 2 + 16, R * 2 + 16], P.key, M.E(pf), b * 7, -0.6, 14);
        M.stroke(c, M.loop(cx, cy, R + 6, R + 4, b * 3 + 1), 9, P.ink, b * 3 + 2, M.E(po));
        for (let i = 0; i < 12; i++) {
          const q = span(t, 0.8 + i * 0.03, 0.95 + i * 0.03), a = (i / 12) * Math.PI * 2 + 0.13;
          if (q > 0) M.stroke(c, [[cx + Math.cos(a) * (R + 28), cy + Math.sin(a) * (R + 28)], [cx + Math.cos(a) * (R + 74), cy + Math.sin(a) * (R + 74)]], 9, P.deep, b * 41 + i, q);
        }
      });
      const pl = span(t, 0.95, 1.2);
      if (pl > 0) {
        const s = R * 1.05 * (1.12 - 0.12 * M.E(pl));
        M.wax(ctx, K.heavy, [cx - R, cy - R, R * 2, R * 2], (c) => { c.globalAlpha = Math.min(1, pl * 3); brand.logo.draw(c, cx - s / 2, cy - s / 2, s, P.ink); });
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.ink, each: write(t, 1.2, name) });
      const pu = span(t, 1.55, 1.95);
      if (pu > 0) M.wax(ctx, K.mid, [cx - name.width / 2 - 40, yName + name.size * 0.4, name.width + 80, 70], (c) => {
        const w = name.width + 30, x0 = cx - w / 2, yy = yName + name.size * 0.72, wv = [];
        for (let j = 0; j <= 22; j++) wv.push([rtl ? x0 + w - (w * j) / 22 : x0 + (w * j) / 22, yy + Math.sin(j * 1.15) * 7]);
        M.stroke(c, wv, 9, P.deep, b * 13, pu);
      });
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.grey, each: write(t, 1.85, handle) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.ink, each: write(t, 2.1, slogan) });
    },
  };
}
