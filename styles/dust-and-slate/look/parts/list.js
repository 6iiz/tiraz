// A list on the slate: an optional title in the dimmer chalk with a short rule under it, then up to five rows. Each row begins with a
// tick made with the accent stick, then its words are written in white chalk; one row every half second. A key word is written with
// the accent stick. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, rtl = kit.rtl;
  const indent = 110, x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - indent, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.label, maxW: x1 - x0, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(130, rows[0].size * 1.9), tH = title ? title.lead + 50 : 0;
  const top = kit.place(tH + pitch * items.length, 680);
  const sTitle = title ? M.schedule(title, at + 0.0, at + 0.35, 0.04) : [];
  const tx = rtl ? x1 : x0, ruleY = top + (title ? title.lead + 8 : 0);
  const rule = title ? M.stroke(301, tx, ruleY, rtl ? tx - Math.min(title.width + 30, 320) : tx + Math.min(title.width + 30, 320), ruleY + 2, 3) : null;
  const yRow = (k) => top + tH + k * pitch + pitch / 2;
  const tickX = rtl ? x1 - 38 : x0 + 38;
  const ticks = items.map((_, k) => M.tick(400 + k * 7, tickX, yRow(k) - 4, 52));
  const starts = items.map((_, k) => at + 0.3 + k * 0.5);
  const sched = rows.map((r, k) => M.schedule(r, starts[k] + 0.14, starts[k] + 0.5, 0.04));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const white = M.chalk(ctx, P.chalk), dim = M.chalk(ctx, P.dim, 13), acc = M.chalk(ctx, P.accent, 17);
      if (title) {
        kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: dim, key: acc,
          each: (w, i, box, c) => { if (M.write(c, span(t, sTitle[i].s, sTitle[i].e), box, title.size, w.arabic) === false) return false; } });
        M.trace(ctx, rule, span(t, at + 0.32, at + 0.5), T.chalk.thin, dim);
      }
      rows.forEach((r, k) => {
        M.trace(ctx, ticks[k], span(t, starts[k], starts[k] + 0.16), T.chalk.line, acc);
        kit.drawText(ctx, r, { x0: rtl ? x0 : x0 + indent, x1: rtl ? x1 - indent : x1, y: yRow(k), align: 'start', color: white, key: acc,
          each: (w, i, box, c) => { if (M.write(c, span(t, sched[k][i].s, sched[k][i].e), box, r.size, w.arabic) === false) return false; } });
      });
    },
  };
}
