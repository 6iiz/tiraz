// A list read along the line: for every item the pencil sets a numbered point on the line where it is drawing at that moment, and
// the item is written in the note above with the same number. The points then travel away with the chart, one after another, like
// milestones. A key phrase in an item is circled. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, br = 24, indent = br * 2 + 28;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - indent - 30, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, minPx: 46, where: 'the list title' }) : null;
  const pitch = Math.max(96, rows[0].size * 1.6), th = title ? title.height + 10 : 0;
  const top = kit.place(th + pitch * items.length, 600), bottom = top + th + pitch * items.length + 10;
  const tx0 = rtl ? x0 + 20 : x0 + indent, tx1 = rtl ? x1 - indent : x1 - 20, bx = rtl ? x1 - br : x0 + br;
  const at0 = (k) => at + 0.5 + k * T.beat, out = (t) => span(t, d - T.dur.out, d);
  const key = rows.map((f) => f.rows.some((r) => r.words.some((w) => w.key)));
  const marks = items.map((_, k) => ground.wxAt(clock + at0(k)));        // where on the line each item's point is set
  const badge = (ctx, x, y, r, n, hot) => {
    M.dot(ctx, x, y, r, pal, hot);
    ctx.fillStyle = hot ? pal.onAccent : pal.ink; ctx.font = `700 ${Math.round(r * 1.1)}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    ctx.fillText(String(n), x, y + 1);
  };
  const word = (t, t0, size, o) => (w, i, box, c) => { const s = t0 + i * 0.07; if (M.write(c, span(t, s, s + T.dur.in), box, size, rtl) === false) return false; if (M.erase(c, o) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { pen: false });
      const o = out(t), a = 1 - M.OUT(o);
      M.stem(ctx, ground.tip(t), bottom, span(t, at, at + 0.3) * a, pal, { dash: [3, 9] });
      items.forEach((_, k) => {                                            // the milestones on the line
        const p = M.E(span(t, at0(k) - 0.05, at0(k) + 0.2)); if (p <= 0 || a <= 0) return;
        const [x, y] = ground.point(marks[k], t); if (x < -40 || x > W + 40) return;
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y - 12 - 44 * p); ctx.stroke();
        badge(ctx, x, y - 12 - 44 * p - 17, 17 * p, k + 1, key[k]); ctx.restore();
        kit.rec(x - 17, x + 17, y - 90, y - 56, String(k + 1), { decor: true });
      });
      let y = top;
      if (title) { kit.drawText(ctx, title, { x0, x1, y: y + title.lead / 2, align: 'start', color: pal.muted, each: word(t, at + 0.15, title.size, o) }); y += th; }
      items.forEach((_, k) => {
        const ym = y + k * pitch + pitch / 2, t0 = at0(k), bp = M.E(span(t, t0 - 0.12, t0 + 0.12));
        if (bp > 0) { ctx.save(); if (M.erase(ctx, o) !== false) { badge(ctx, bx, ym, br * bp, k + 1, key[k]); kit.rec(bx - br, bx + br, ym - br, ym + br, String(k + 1), { decor: true }); } ctx.restore(); }
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.ink, key: pal.keyText, each: word(t, t0, rows[k].size, o) });
        for (const r of M.keyRuns(rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start' }, rtl)) {
          const s = t0 + r.last * 0.07 + 0.15; ctx.save(); if (M.erase(ctx, o) !== false) M.loop(ctx, r, rows[k].size * 0.9, span(t, s, s + 0.3), pal.line, k); ctx.restore();
        }
      });
      ground.pen(ctx, t);
    },
  };
}
