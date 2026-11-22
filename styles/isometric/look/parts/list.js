// A list: a tower of floating isometric slabs, one floor per item, built from the top floor down in reading order. Each slab extrudes
// and a leader line runs from its corner to its row of text. The item with a key word (*…*) gets the accent slab.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const rtl = kit.rtl, tower = 300;                                    // the tower takes the far side, the text the reading side
  const tx0 = rtl ? SAFE.left + tower : SAFE.left, tx1 = rtl ? SAFE.right : SAFE.right - tower;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(150, rows[0].size * 2.4);
  const top = kit.place((title ? title.lead + 40 : 0) + pitch * items.length, 740);
  const y0 = top + (title ? title.lead + 40 : 0);
  const u = 34, cx = rtl ? SAFE.left + 130 : SAFE.right - 130;
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const word = (t, t0, size, out) => (w, i, box, c) => {
    if (M.arrive(c, span(t, t0 + i * T.dur.stagger, t0 + i * T.dur.stagger + T.dur.in), box, size) === false) return false;
    if (M.leave(c, out, box, size) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), shrink = 1 - M.E(span(t, d - T.dur.out - 0.05, d));
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: pal.muted, each: word(t, at, title.size, out) });
      // a thin spine joins the floors, drawn first so the slabs sit on it
      const ys = items.map((_, k) => y0 + k * pitch + pitch / 2);
      const sp = span(t, at, at + 0.25 + items.length * T.beat) * shrink;
      if (sp > 0) { ctx.fillStyle = pal.floor.right; const yA = ys[0], yB = ys[0] + (ys.at(-1) + 40 - ys[0]) * sp; ctx.fillRect(cx - 3, yA, 6, yB - yA); }
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.beat, ym = ys[k];
        const g = M.G(span(t, t0 - 0.1, t0 - 0.1 + T.dur.build)) * shrink;
        if (g > 0) {
          const P = M.project(cx, ym - 1.05 * u, u), h = 0.9 * g;
          M.block(ctx, P, 0, 0, 0, 3, 3, h, keyed[k] ? pal.hot : pal.neutral);
          const [lx, ly] = P(rtl ? 3 : 0, rtl ? 0 : 3, h), tx = rtl ? SAFE.right - rows[k].width - 26 : SAFE.left + rows[k].width + 26;
          M.leader(ctx, [[lx, ly], [lx + (rtl ? 30 : -30), ym], [tx, ym]], span(t, t0, t0 + 0.3) * shrink, keyed[k] ? pal.accent : pal.line);
        }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.text, key: pal.keyText, each: word(t, t0 + 0.1, rows[k].size, out) });
      });
    },
  };
}
