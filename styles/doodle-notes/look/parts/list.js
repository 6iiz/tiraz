// A list in the notes: an optional title on a small ribbon banner, then one rounded box per row, half a second apart. For each row the
// fineliner draws the box (it sits on a grey-marker shadow), ticks a little check box on the reading side, and writes the words; a key
// word gets a highlighter swipe. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 24, pad = 130;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - pad - 40, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: 640, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(138, rows[0].size * 2.25), bh = title ? title.size * 1.75 : 0, tH = title ? bh + 50 : 0;
  const top = kit.place(tH + pitch * items.length, 680);
  const B = title ? M.banner(81, W / 2, top + bh / 2, title.width + 100, bh) : null;
  const sTitle = title ? M.schedule(title, at + 0.2, at + 0.5, 0.04) : [];
  const yRow = (k) => top + tH + k * pitch + pitch / 2, h = pitch - 30;
  const starts = items.map((_, k) => at + 0.3 + k * 0.5);
  const boxes = items.map((_, k) => M.roundBox(90 + k, x0, yRow(k) - h / 2, x1, yRow(k) + h / 2, 24, rtl));
  const cbx = rtl ? x1 - 76 : x0 + 30, cb = 46;
  const checks = items.map((_, k) => M.roundBox(95 + k, cbx, yRow(k) - cb / 2, cbx + cb, yRow(k) + cb / 2, 8, rtl));
  const ticks = items.map((_, k) => [...M.line(99 + k, cbx + 8, yRow(k) - 2, cbx + 20, yRow(k) + 14, 1, 6), ...M.line(199 + k, cbx + 20, yRow(k) + 14, cbx + 54, yRow(k) - 30, 1, 8).slice(1)]);
  const tx0 = rtl ? x0 + 30 : x0 + pad, tx1 = rtl ? x1 - pad : x1 - 30;
  const sched = rows.map((r, k) => M.schedule(r, starts[k] + 0.2, starts[k] + 0.5, 0.04));
  const keys = rows.map((r, k) => M.layout(r, { x0: tx0, x1: tx1, y: yRow(k), align: 'start' }, rtl).filter((b) => b.key));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); ctx.translate(0, ground.drift(t));
      if (B) {
        const pt = span(t, at, at + 0.25), [bx0, by0, bx1, by1] = B.band;
        if (pt > 0) {
          for (const tail of B.tails) { M.fillPoly(ctx, tail, P.greyDeep); M.trace(ctx, [...tail, tail[0]], pt, T.pen.fine, P.ink); }
          ctx.fillStyle = P.paper; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
          M.shade(ctx, span(t, at + 0.15, at + 0.3), (c) => { c.beginPath(); c.rect(bx0, by0, bx1 - bx0, by1 - by0); }, B.band, P.grey, rtl, 8);
          M.trace(ctx, B.outline, pt, T.pen.fine, P.ink);
        }
        kit.drawText(ctx, title, { x0, x1, y: top + bh / 2, color: P.ink, key: P.ink, each: M.writer(t, sTitle, title.size) });
      }
      rows.forEach((r, k) => {
        const s = starts[k], pb = span(t, s, s + 0.2);
        if (pb <= 0) return;
        const y0 = yRow(k) - h / 2;
        M.shade(ctx, span(t, s + 0.05, s + 0.2), (c) => { c.beginPath(); c.roundRect(x0 + 12, y0 + 12, x1 - x0, h, 24); }, [x0 + 12, y0 + 12, x1 + 12, y0 + h + 12], P.greyDeep, rtl, 20 + k);
        ctx.fillStyle = P.paper; ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, h, 24); ctx.fill();
        M.trace(ctx, boxes[k], pb, T.pen.fine, P.ink);
        M.trace(ctx, checks[k], span(t, s + 0.1, s + 0.2), T.pen.fine, P.ink);
        M.trace(ctx, ticks[k], span(t, s + 0.5, s + 0.62), T.pen.bold, P.ink);
        keys[k].forEach((b) => M.highlight(ctx, span(t, s + 0.5, s + 0.68), b, r.size, P.hl, rtl));
        kit.drawText(ctx, r, { x0: tx0, x1: tx1, y: yRow(k), align: 'start', color: P.ink, key: P.ink, each: M.writer(t, sched[k], r.size) });
      });
      ctx.restore();
    },
  };
}
