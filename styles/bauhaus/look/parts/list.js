// A list in primaries: each row is marked on the reading side by one of the three shapes (circle, square, triangle, in turn, in
// accent, ink and the mid tone), which slides in and turns into place; the item is set solid in ink beside it. The title sits on an
// ink slab. A key word (*…*) gets an accent block. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, circle, square, triangle } = await import(look.base + 'motion.js');
  const P = ground.P, dir = ground.dir, rtl = ground.rtl;
  const M = T.size.item * 1.15, indent = M + 40, textW = SAFE.right - SAFE.left - indent;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const tsize = T.size.lead + 6, tpad = tsize * T.bar.pad;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: tsize, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - tpad, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(140, rows[0].size * 2.1);
  const top = kit.place((title ? title.lead + 50 : 0) + pitch * items.length, 720);
  const mx = rtl ? SAFE.right - M / 2 : SAFE.left + M / 2;
  const fills = [P.accent, P.ink, P.mid], out0 = d - T.dur.out;
  const word = (t, t0, size, out) => (w, i, box, c) => {
    if (arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size, dir) === false) return false;
    if (leave(c, out, box, size, dir) === false) return false;
    if (w.key) { c.fillStyle = P.accent; c.fillRect(box.x - size * 0.12, box.y - size * 0.7, box.width + size * 0.24, size * 1.4); return P.on; }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), gone = (p) => (out > 0 ? Math.max(0, p - out * 1.4) : p);
      let y = top;
      if (title) {
        const ym = y + title.lead / 2, a = rtl ? SAFE.right - title.width - tpad : 0, b = rtl ? W : SAFE.left + title.width + tpad;
        ctx.save(); ctx.translate(-dir * W * out ** 2, 0);
        ground.slab(ctx, span(t, at, at + T.dur.in), a, b, ym, tsize * T.bar.h, P.ink); ctx.restore();
        kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: ym, align: 'start', color: P.paper, each: word(t, at + 0.12, title.size, out) });
        y += title.lead + 50;
      }
      items.forEach((_, k) => {
        const t0 = at + 0.3 + k * T.beat, ym = y + k * pitch + pitch / 2, p = gone(span(t, t0, t0 + T.dur.shape)), from = { x: dir * 500, y: 0 };
        const fill = fills[k % 3], shape = k % 3;
        if (shape === 0) circle(ctx, p, mx, ym, M / 2, fill, from);
        else if (shape === 1) square(ctx, p, mx, ym, M * 0.86, fill, from);
        else triangle(ctx, p, mx, ym + M * 0.08, M, fill, from);
        kit.drawText(ctx, rows[k], { x0: rtl ? SAFE.left : SAFE.left + indent, x1: rtl ? SAFE.right - indent : SAFE.right, y: ym, align: 'start',
          color: P.ink, key: P.on, each: word(t, t0 + 0.15, rows[k].size, out) });
      });
    },
  };
}
