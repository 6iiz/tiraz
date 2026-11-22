// A list as a column of carved slips: the title (if any) on a short grey-lettered slip, then one slip per item, each cut out of the ink one
// beat after the last and sized to its words, with a knife mark at the reading side (red for the item that holds the key word). Words slide
// in along the direction of travel once their slip is open. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, pad = T.pad;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const mark = 46, maxW = (SAFE.right - SAFE.left) + 48 - 2 * pad.x - mark;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: maxW + mark, single: true, where: 'the list title' }) : null;
  const ih = rows[0].lead + 2 * 14, gap = 16, th = title ? title.lead + 24 : 0;
  const total = (title ? th + gap + 8 : 0) + items.length * ih + (items.length - 1) * gap, top = kit.place(total, 720);
  const edge = rtl ? SAFE.right + 24 : SAFE.left - 24, dir = rtl ? -1 : 1;
  const slip = (w) => (rtl ? [edge - w, edge] : [edge, edge + w]);
  const keyed = rows.map((r) => r.rows[0].words.some((w) => w.key));
  const y0 = top + (title ? th + gap + 8 : 0), t0 = title ? 0.35 : 0.2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tl = t - at;
      if (title) {
        const [a, b] = slip(title.width + 2 * pad.x);
        M.carve(ctx, a, top, b, top + th, span(tl, 0, 0.35), P, { pitch: T.pitch, rtl, frame: false });
        kit.drawText(ctx, title, { x0: a + pad.x, x1: b - pad.x, y: top + th / 2, align: 'start', color: P.grey,
          each: (w, i, box, c) => M.arrive(c, span(tl, 0.2 + i * T.dur.step, 0.2 + i * T.dur.step + T.dur.in), title.size, rtl) });
      }
      items.forEach((_, k) => {
        const tk = t0 + k * T.beat, yt = y0 + k * (ih + gap), [a, b] = slip(rows[k].width + mark + 2 * pad.x);
        M.carve(ctx, a, yt, b, yt + ih, span(tl, tk, tk + 0.3), P, { pitch: T.pitch, rtl, frame: false });
        const ym = yt + ih / 2, mx = rtl ? b - pad.x : a + pad.x;
        M.knife(ctx, rtl ? mx - 26 : mx, rtl ? mx : mx + 26, ym, 12, keyed[k] ? P.red : P.ink, span(tl, tk + 0.2, tk + 0.35), rtl);
        kit.drawText(ctx, rows[k], { x0: rtl ? a + pad.x : a + pad.x + mark, x1: rtl ? b - pad.x - mark : b - pad.x, y: ym, align: 'start', color: P.ink, key: P.key,
          each: (w, i, box, c) => M.arrive(c, span(tl, tk + 0.22 + i * 0.05, tk + 0.22 + i * 0.05 + T.dur.in), rows[k].size, rtl) });
      });
    },
  };
}
