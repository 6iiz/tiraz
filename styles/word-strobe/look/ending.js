// The word-strobe ending, the end card: on the façade of windows the logo cuts in on a paper square, then the brand's name cuts in on
// a paper field running from the reading edge, the handle in the mono face beside an accent rail, and the slogan on an accent field,
// each a few uneven frames after the last. Behind, the name itself strobes as a giant tonal word on every beat. spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, room: 'facade' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW: x1 - x0 - 40, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW: x1 - x0 - 60, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join('  '), { size: T.size.slogan, weight: 800, maxW: x1 - x0 - 40, single: true, where: 'the slogan' }) : null;
  const S = 300, lx = rtl ? x1 - S : x0, ly = 330;
  const yName = ly + S + 80 + name.lead / 2, yHandle = yName + name.lead / 2 + 40 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 50 + (slogan ? slogan.lead / 2 : 0);
  const ct = M.cuts(4, 0.12, T).map((x, i) => x + i * 0.12);
  const giants = M.giantsOf(kit, brand.name, T, brand.fonts.display.family);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, t / d);
      if (t >= ct[1] + 0.3) M.ghost(ctx, kit, W, giants, Math.floor((t - ct[1] - 0.3) / T.beat), pal.ghost);
      if (t >= ct[0]) {
        ctx.fillStyle = pal.paper; ctx.fillRect(lx, ly, S, S);
        brand.logo.draw(ctx, lx + S * 0.15, ly + S * 0.15, S * 0.7, pal.ink);
        ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? lx - 34 : lx + S + 18, ly, 16, S);
      }
      if (t >= ct[1]) {
        M.field(ctx, W, M.rowBoxes(kit, name, x0, x1, yName)[0], name.size, M.opens(t, ct[1], T), pal.paper, rtl);
        if (t >= ct[1] + 2 * T.frame) kit.drawText(ctx, name, { x0, x1, y: yName, align: 'start', color: pal.ink });
      }
      if (t >= ct[2]) {
        ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? W - 34 : 0, yHandle - handle.size * 0.6, 34, handle.size * 1.2);
        kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'start', color: pal.paper });
      }
      if (slogan && t >= ct[3]) {
        M.field(ctx, W, M.rowBoxes(kit, slogan, x0, x1, ySlogan)[0], slogan.size, M.opens(t, ct[3], T), pal.accent, rtl);
        if (t >= ct[3] + 2 * T.frame) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'start', color: pal.onAccent });
      }
    },
  };
}
