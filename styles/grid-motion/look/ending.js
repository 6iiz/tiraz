// The grid-motion ending: an ink module shoots in from the far side and then walks across the columns to the reading side in hard
// snaps on the beat, carrying the brand's logo knocked out in the ground's colour. The name follows in giant type on its own track,
// then a heavy bar, the handle in the mono face and the slogan. The name crawls under the frame as giant tonal type. spec: { duration }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 900, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 700, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.lead, weight: 600, maxW, minScale: 0.85, where: 'the slogan' }) : null;
  const S = 300, yS = 330, step = ground.colW + T.grid.gutter;
  const home = rtl ? x1 - S : x0, stops = [2, 1, 0].map((j) => home + (rtl ? -1 : 1) * j * step);
  const yName = yS + S + 60 + name.lead / 2, yBar = yName + name.lead / 2 + 6, yHandle = yBar + 14 + 34 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 22 + (slogan ? slogan.lead / 2 : 0);
  const ghost = kit.fit(brand.name, { size: T.size.ghost, weight: 900, maxW: 99999, single: true, overflow: true, where: 'the ghost type' });
  const track = (t, t0, g) => M.travel(W, span(t, t0, t0 + T.dur.slide), 0, M.rowDir(g, rtl));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.ticker(ctx, kit, ghost, t + clock, { W, y: 1600, color: pal.ghost, speed: T.ticker });
      // the module: in from the far edge to the far column, then two snaps to the reading side
      const pin = M.SNAP(span(t, 0.1, 0.5));
      if (pin > 0) {
        let x = lerp(rtl ? -S - 40 : W + 40, stops[0], pin);
        for (let j = 1; j < stops.length; j++) x = lerp(x, stops[j], M.SNAP(span(t, 0.5 + j * 0.25, 0.5 + j * 0.25 + 0.22)));
        ctx.fillStyle = pal.ink; ctx.fillRect(x, yS, S, S);
        brand.logo.draw(ctx, x + S * 0.17, yS + S * 0.17, S * 0.66, pal.ground);
      }
      const on = track(t, 1.15, 1);
      if (on !== null) kit.drawText(ctx, name, { x0, x1, y: yName, align: 'start', color: pal.ink, each: (w, i, box, c) => { c.translate(on, 0); } });
      const ob = track(t, 1.3, 0);
      if (ob !== null) { ctx.fillStyle = pal.ink; ctx.fillRect(x0 + ob, yBar, maxW, 14); }
      const oh = track(t, 1.45, 1);
      if (oh !== null) kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'start', color: pal.ink, each: (w, i, box, c) => { c.translate(oh, 0); } });
      if (slogan) {
        kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'start', color: pal.ink,
          each: (w, i, box, c) => { const o = track(t, 1.6 + box.row * 0.1, box.row); if (o === null) return false; c.translate(o, 0); } });
      }
    },
  };
}
