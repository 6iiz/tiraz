// The street wash ending: a square frame is sketched in the middle of the page, a wash of the brand's colour is dropped into it off its
// lines, and the logo is drawn in ink inside; the name is written below and underlined with one loose stroke; the handle and slogan are
// written under it. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left - 40;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.name, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const S = 330, fx = (W - S) / 2, fy = 360;
  const frame = M.box(fx, fy, S, S, 201), wash = M.patch(S * 0.9, S * 0.9, pal.wash, pal.washA(T.tone.wash) * 1.15, 203);
  const yName = fy + S + 90 + name.lead / 2, yHandle = yName + name.lead / 2 + 40 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const X0 = SAFE.left, X1 = SAFE.right;
  const tn = M.schedule(M.boxes(name, { x0: X0, x1: X1, y: yName, align: 'center', rtl }), 1.3, name.size, T.dur.perPx);
  const th = [[2.05, 2.4]], ts = slogan ? M.schedule(M.boxes(slogan, { x0: X0, x1: X1, y: ySlogan, align: 'center', rtl }), 2.3, slogan.size, T.dur.perPx) : [];
  const uy = yName + name.size * 0.66, ux0 = (W - name.width) / 2, ux1 = ux0 + name.width;
  const ul = M.pen(rtl ? [[ux1 + 10, uy], [(ux0 + ux1) / 2, uy + 5], [ux0 - 12, uy - 3]] : [[ux0 - 10, uy], [(ux0 + ux1) / 2, uy + 5], [ux1 + 12, uy - 3]], 205, { over: 8 });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.drop(ctx, wash, fx + S * 0.05, fy + S * 0.05, span(t, 0.6, 1.0), [12, -9]);
      M.drawAll(ctx, frame, M.PEN(span(t, 0.05, 0.6)), pal.line, 3.2);
      const lq = span(t, 0.9, 1.3);
      if (lq > 0) { const s = S * 0.62; ctx.save(); ctx.beginPath(); ctx.rect(rtl ? fx + S - (S * lq) : fx, fy, S * lq, S); ctx.clip(); brand.logo.draw(ctx, fx + (S - s) / 2, fy + (S - s) / 2, s, pal.ink); ctx.restore(); }
      kit.drawText(ctx, name, { x0: X0, x1: X1, y: yName, color: pal.ink, each: (w, i, box, c) => M.write(c, span(t, tn[i][0], tn[i][1]), 0, box, name.size, rtl) });
      M.draw(ctx, ul, M.PEN(span(t, tn.at(-1)[1], tn.at(-1)[1] + 0.3)), pal.line, 3);
      kit.drawText(ctx, handle, { x0: X0, x1: X1, y: yHandle, color: pal.quiet(T.tone.grey), each: (w, i, box, c) => M.write(c, span(t, th[0][0], th[0][1]), 0, box, handle.size, false) });
      if (slogan) kit.drawText(ctx, slogan, { x0: X0, x1: X1, y: ySlogan, color: pal.quiet(T.tone.grey), each: (w, i, box, c) => M.write(c, span(t, ts[i][0], ts[i][1]), 0, box, slogan.size, rtl) });
    },
  };
}
