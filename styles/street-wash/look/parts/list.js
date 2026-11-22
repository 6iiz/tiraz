// A list as a checklist in the sketchbook: on the reading side a small box is drawn in pen for each item, the item is written beside
// it, then the box is ticked and a dab of wash is dropped into it, off its lines. Key words in an item are looped and washed. The title
// is written above and underlined with one loose stroke. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const bs = 46, indent = bs + 44, xr = SAFE.right - 40, xl = SAFE.left + 20;
  const tx0 = rtl ? xl : xl + indent, tx1 = rtl ? xr - indent : xr;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: xr - xl, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].lead * 1.3, 116), head = title ? title.lead + 54 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const grey = pal.quiet(T.tone.grey);
  let tb = [], ul = null;
  if (title) {
    tb = M.schedule(M.boxes(title, { x0: xl, x1: xr, y: top + title.lead / 2, rtl }), at - 0.1, title.size, T.dur.perPx * 0.8);
    const tw = title.width, ux1 = rtl ? xr : xl + tw, ux0 = rtl ? xr - tw : xl, uy = top + title.lead / 2 + title.size * 0.62;
    ul = M.pen(rtl ? [[ux1 + 8, uy], [(ux0 + ux1) / 2, uy + 4], [ux0 - 10, uy - 2]] : [[ux0 - 8, uy], [(ux0 + ux1) / 2, uy + 4], [ux1 + 10, uy - 2]], 7, { over: 6 });
  }
  const L = items.map((_, k) => {
    const ym = y0 + k * pitch + pitch / 2, t0 = at + 0.25 + k * T.beat, bxX = rtl ? xr - bs : xl, by = ym - bs / 2;
    const wb = M.boxes(rows[k], { x0: tx0, x1: tx1, y: ym, rtl }), tw = M.schedule(wb, t0 + 0.08, rows[k].size, T.dur.perPx * 0.75, 0.04);
    const done = tw.at(-1)[1];
    const keys = M.keySpans(wb).map((s, j) => ({ L: M.loop((s.x0 + s.x1) / 2, s.y, (s.x1 - s.x0) / 2 + rows[k].size * 0.3, rows[k].size * 0.68, 60 + k * 5 + j, rtl),
      P: M.patch(s.x1 - s.x0 + rows[k].size * 0.2, rows[k].size * 0.9, pal.wash, pal.washA(T.tone.wash), 70 + k * 5 + j), x: s.x0 - rows[k].size * 0.1, y: s.y - rows[k].size * 0.45 }));
    return { ym, t0, done, tw, keys, frame: M.box(bxX, by, bs, bs, 30 + k * 7), tick: M.tick(bxX + 4, by - 8, bs, 50 + k), dab: M.patch(bs * 0.8, bs * 0.8, pal.wash, pal.washA(T.tone.wash), 90 + k), bxX, by };
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      if (title) {
        kit.drawText(ctx, title, { x0: xl, x1: xr, y: top + title.lead / 2, align: 'start', color: grey, each: (w, i, box, c) => M.write(c, span(t, tb[i][0], tb[i][1]), out, box, title.size, rtl) });
        ctx.save(); ctx.globalAlpha = keep; M.draw(ctx, ul, M.PEN(span(t, tb.at(-1)[1], tb.at(-1)[1] + 0.25)), pal.line, 2.6); ctx.restore();
      }
      L.forEach((R, k) => {
        M.drop(ctx, R.dab, R.bxX + 4, R.by + 4, span(t, R.t0 + 0.3, R.t0 + 0.55), [7, -6], keep);
        for (const K of R.keys) M.drop(ctx, K.P, K.x, K.y, span(t, R.done + 0.25, R.done + 0.5), [7, -5], keep);
        ctx.save(); ctx.globalAlpha = keep;
        M.drawAll(ctx, R.frame, M.PEN(span(t, R.t0 - 0.15, R.t0 + 0.1)), pal.line, 2.6);
        M.draw(ctx, R.tick, M.PEN(span(t, R.t0 + 0.12, R.t0 + 0.28)), pal.line, 3.4);
        for (const K of R.keys) M.draw(ctx, K.L, M.PEN(span(t, R.done + 0.02, R.done + 0.32)), pal.line, 2.8);
        ctx.restore();
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: R.ym, align: 'start', color: pal.ink, key: pal.ink, each: (w, i, box, c) => M.write(c, span(t, R.tw[i][0], R.tw[i][1]), out, box, rows[k].size, rtl) });
      });
    },
  };
}
