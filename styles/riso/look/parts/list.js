// A list, printed row by row: each row's number sits in an accent disc on the reading side (off register, like the second drum),
// the item in ink beside it, and a dotted rule of halftone ink under it. Rows feed in one per beat from their top edge.
// A key word (*…*) in an item sits on an accent patch. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, feed, blob, disc, overprint } = await import(look.base + 'motion.js');
  const P = ground.P, reg = ground.reg, rtl = kit.rtl;
  const R = T.size.item * 0.62, indent = 2 * R + 34, textW = SAFE.right - SAFE.left - indent;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead + 6, weight: T.weight.lead, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(150, rows[0].size * 2.1);
  const top = kit.place((title ? title.lead + 30 : 0) + pitch * items.length, 720);
  const dx = rtl ? SAFE.right - R : SAFE.left + R;              // the disc's centre
  const out0 = d - T.dur.out;
  const word = (t, t0, size, out) => (w, i, box, c) => {
    if (arrive(c, span(t, t0, t0 + T.dur.in), box, size) === false) return false;
    if (leave(c, out, box, size) === false) return false;
    if (w.key) { overprint(c, reg, () => blob(c, box.x - 10, box.y - size * 0.62, box.width + 20, size * 1.24, 51 + i, P.accent)); return P.on; }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d);
      let y = top;
      if (title) { kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: y + title.lead / 2, align: 'start', color: P.soft, each: word(t, at, title.size, out) }); y += title.lead + 30; }
      items.forEach((_, k) => {
        const t0 = at + 0.3 + k * T.beat, yr = y + k * pitch, ym = yr + pitch / 2 - 8;
        ctx.save();
        if (feed(ctx, span(t, t0, t0 + T.dur.in), out, 0, yr, W, pitch) !== false) {
          overprint(ctx, reg, () => disc(ctx, dx, ym, R, P.accent));
          ctx.fillStyle = ground.screen(ctx, 'ink'); ctx.fillRect(SAFE.left, yr + pitch - 12, SAFE.right - SAFE.left, 12);
          kit.number(ctx, String(k + 1), { x: dx, y: ym + 2, size: R * 1.15, color: P.on, decor: true });
        }
        ctx.restore();
        kit.drawText(ctx, rows[k], { x0: rtl ? SAFE.left : SAFE.left + indent, x1: rtl ? SAFE.right - indent : SAFE.right, y: ym, align: 'start',
          color: P.ink, key: P.on, each: word(t, t0 + 0.08, rows[k].size, out) });
      });
      ground.wear(ctx);
    },
  };
}
