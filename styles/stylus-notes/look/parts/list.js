// A list sketched on the glass: for each item the stylus draws a small hand-made box on the reading side, writes the item beside it,
// then ticks the box with one glowing accent check. A key phrase gets one lasso after it is written. spec: { duration, at?, says: { title?, items } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, bs = 46, indent = bs + 34;
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0 - 40, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 600, maxW: x1 - x0, minScale: 1, where: 'the list title' }) : null;
  const pitch = Math.max(128, rows[0].size * 1.9);
  const top = kit.place((title ? title.height + 30 : 0) + pitch * items.length, 700);
  const yTitle = top + (title ? title.lead / 2 : 0), y0 = top + (title ? title.height + 30 : 0);
  const glow = rgba(pal.light, 0.45), keyGlow = rgba(pal.accent, 0.55);
  const tl = title ? M.layout(kit, title, { x0, x1, y: yTitle }) : [], ts = title ? M.schedule(tl, at, 0.4) : [];
  const step = Math.min(0.62, (d - 1.5) / items.length);
  const plan = items.map((_, k) => {
    const ym = y0 + k * pitch + pitch / 2, bx = rtl ? x1 - bs : x0, start = at + 0.55 + k * step;
    const B = { S: M.box(bx, ym - bs / 2, bs, 90 + k), t0: start, t1: start + 0.16 };
    const words = M.layout(kit, rows[k], { x0: tx0, x1: tx1, y: ym }), ws = M.schedule(words, B.t1 + 0.05, Math.min(step * 0.62, 0.12 + 0.09 * words.length));
    const C = { S: M.check(bx + bs * 0.05, ym - bs / 2, bs * 0.9), t0: ws.at(-1).t1 + 0.04 }; C.t1 = C.t0 + 0.14;
    const L = M.runs(words).map((r, i) => ({ S: M.lasso(r, 70 + k * 5 + i, rtl), t0: C.t1 + 0.03 + i * 0.3 })); L.forEach((l) => { l.t1 = l.t0 + T.dur.lasso * 0.8; });
    return { ym, B, C, L, words, ws };
  });
  const events = [...tl.map((w, i) => ({ ...ts[i], word: { box: w, size: title.size, rtl } })),
    ...plan.flatMap((p) => [p.B, ...p.words.map((w, i) => ({ ...p.ws[i], word: { box: w, size: rows[0].size, rtl } })), p.C, ...p.L])].sort((a, b) => a.t0 - b.t0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) kit.drawText(ctx, title, { x0, x1, y: yTitle, align: 'start', color: pal.grey, key: pal.key, each: (w, i, box, c) => M.inkWord(c, span(t, ts[i].t0, ts[i].t1), box, title.size, rtl, glow) });
      plan.forEach((p, k) => {
        M.guide(ctx, x0, x1, p.ym + rows[k].size * 0.62, span(t, p.B.t0 - 0.2, p.B.t0 + 0.1), pal, rtl);
        M.ink(ctx, p.B.S, span(t, p.B.t0, p.B.t1), 3.5, pal.grey, pal.light);
        for (const l of p.L) M.ink(ctx, l.S, span(t, l.t0, l.t1), T.pen.lasso, pal.key, pal.accent);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: p.ym, align: 'start', color: pal.light, key: pal.key,
          each: (w, i, box, c) => M.inkWord(c, span(t, p.ws[i].t0, p.ws[i].t1), box, rows[k].size, rtl, w.key ? keyGlow : glow) });
        M.ink(ctx, p.C.S, span(t, p.C.t0, p.C.t1), T.pen.check, pal.key, pal.accent);
      });
      const pt = M.tipPath(events, t); if (pt) M.tip(ctx, pt, pal, pt.alpha ?? 1);
    },
  };
}
