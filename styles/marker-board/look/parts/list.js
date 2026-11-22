// A list on the white board: the marker writes an optional title and underlines it, then for each row draws a short accent arrow on
// the reading side pointing into the row and writes the row's words after it, one row every half second. A key word is written with
// the accent marker. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, indent = 120;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - indent, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.label, maxW: x1 - x0, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(132, rows[0].size * 1.95), tH = title ? title.lead + 46 : 0, top = kit.place(tH + pitch * items.length, 680);
  const sTitle = title ? M.schedule(title, at + 0.0, at + 0.32, 0.04) : [];
  const bTitle = title ? M.layout(title, { x0, x1, y: top + title.lead / 2 }, rtl) : [];
  const uy = top + (title ? title.lead + 4 : 0), uw = title ? title.width + 24 : 0;
  const under = title ? (rtl ? M.stroke(820, x1 + 8, uy, x1 - uw, uy + 3, 3) : M.stroke(820, x0 - 8, uy, x0 + uw, uy + 3, 3)) : null;
  const yRow = (k) => top + tH + k * pitch + pitch / 2;
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const starts = items.map((_, k) => at + 0.3 + k * 0.5);
  const arrows = items.map((_, k) => rtl ? M.arrow(830 + k, x1 - 4, yRow(k) - 6, x1 - 84, yRow(k) + 2, 0.18, 22) : M.arrow(830 + k, x0 + 4, yRow(k) - 6, x0 + 84, yRow(k) + 2, -0.18, 22));
  const sched = rows.map((r, k) => M.schedule(r, starts[k] + 0.16, starts[k] + 0.5, 0.04));
  const boxes = rows.map((r, k) => M.layout(r, { x0: tx0, x1: tx1, y: yRow(k) }, rtl));
  const jobs = [];
  if (title) { bTitle.forEach((b, i) => jobs.push(M.wordJob(b, sTitle[i].s, sTitle[i].e, P.soft))); jobs.push(M.pathJob(under, at + 0.32, at + 0.42, P.soft)); }
  rows.forEach((r, k) => { jobs.push(M.pathJob(arrows[k], starts[k], starts[k] + 0.14, P.accent)); boxes[k].forEach((b, i) => jobs.push(M.wordJob(b, sched[k][i].s, sched[k][i].e, b.key ? P.accent : P.ink))); });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ink = M.ink(ctx, P.ink, P.board), soft = M.ink(ctx, P.soft, P.board, 6), acc = M.ink(ctx, P.accent, P.board, 7);
      if (title) {
        kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: soft, key: acc,
          each: (w, i, box, c) => { if (M.write(c, span(t, sTitle[i].s, sTitle[i].e), box, title.size, w.arabic) === false) return false; } });
        M.trace(ctx, under, span(t, at + 0.32, at + 0.42), T.pen.thin, soft);
      }
      rows.forEach((r, k) => {
        M.trace(ctx, arrows[k], span(t, starts[k], starts[k] + 0.14), T.pen.line, acc);
        kit.drawText(ctx, r, { x0: tx0, x1: tx1, y: yRow(k), align: 'start', color: ink, key: acc,
          each: (w, i, box, c) => { if (M.write(c, span(t, sched[k][i].s, sched[k][i].e), box, r.size, w.arabic) === false) return false; } });
      });
      M.drawPen(ctx, M.penAt(jobs, t, W, rtl), P, rtl);
    },
  };
}
