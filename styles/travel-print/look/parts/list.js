// A list as the legend of a poster: each item is one row laid by its own short pull, one per beat, with a small printed sun (three
// rings of the accent) on the reading side and a thin stepped rule under it. A key word (*…*) gets the accent block, knocked out like
// the line's. The title is printed first in the muted ink. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const indent = 96, x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - indent, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(118, rows[0].size * 1.9), head = title ? title.lead + 34 : 0;
  const top = Math.min(kit.place(head + pitch * items.length, 720), T.floor - head - pitch * items.length);
  const knock = P.onAccent === P.paper;
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const keys = rows.map((f, k) => { const out = []; const c = document.createElement('canvas').getContext('2d');
    kit.drawText(c, f, { x0: tx0, x1: tx1, y: top + head + k * pitch + pitch / 2, align: 'start', each: (w, i, b) => { if (w.key) out.push(b); return false; } }); return out; });
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) M.pull(ctx, span(t, at, at + T.dur.pull), { x0, x1, y0: top - 6, y1: top + title.lead + 6 }, P.muted, P,
        () => kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: P.muted, key: P.muted }), { rtl, seed: 4 });
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.beat, ym = top + head + k * pitch + pitch / 2, f = rows[k];
        const box = { x0, x1, y0: ym - pitch / 2 + 6, y1: ym + pitch / 2 - 6 };
        M.pull(ctx, span(t, t0, t0 + T.dur.pull), box, P.accent, P, () => {
          const cx = rtl ? x1 - 34 : x0 + 34;
          M.rings(ctx, cx + 2, ym + 2, 30, 3, [P.mid]); M.rings(ctx, cx, ym, 30, 3, [P.accent, P.ring]);
          ctx.fillStyle = P.sky2; ctx.fillRect(x0, ym + pitch / 2 - 10, x1 - x0, 4); ctx.fillRect(x0, ym + pitch / 2 - 3, x1 - x0, 2);
          for (const b of keys[k]) { const px = f.size * 0.16, py = f.size * 0.64; ctx.fillStyle = P.accent; ctx.fillRect(b.x - px + 3, b.y - py + 2, b.width + px * 2, py * 2); }
          kit.drawText(ctx, f, { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.ink, key: knock ? P.paper : P.ink });
        }, { rtl, seed: 6 + k });
      });
    },
  };
}
