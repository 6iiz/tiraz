// A list of findings on one slide: each item is a specimen that is marked and then focused on. A small ring is traced on the reading
// side, a hairline leader runs from it to the row, and the row's words come into focus. A key phrase (*…*) in an item is ringed as
// one thing and its marker is filled. The optional title is a quieter note above. spec: { duration, at?, says: { title?, items: [...] } }
import { need, span, clamp } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, L = T.lens;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const colW = 700, cx0 = rtl ? L.cx - 370 : L.cx - 330, cx1 = cx0 + colW;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: colW, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 600, maxW: 780, minPx: T.minPx, where: 'the list title' }) : null;
  const pitch = Math.max(118, rows[0].size * 1.9), tH = title ? title.height + 34 : 0;
  const top = kit.place(tH + pitch * items.length, L.cy);
  const mx = rtl ? cx1 + 34 : cx0 - 34;
  const gapT = Math.min(0.42, (d - 1.4) / Math.max(1, items.length));
  const out0 = d - T.dur.out;
  const layout = rows.map((f, k) => {
    const ym = top + tH + k * pitch + pitch / 2;
    return { f, ym, t0: at + 0.3 + k * gapT, runs: M.keyRuns(f, { x0: cx0, x1: cx1, y: ym, align: 'start' }, rtl), key: M.lastKey(f) >= 0 };
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), o = M.I(out);
      if (title) kit.drawText(ctx, title, { x0: L.cx - 390, x1: L.cx + 390, y: top + title.lead / 2, align: 'center', color: pal.lead,
        each: (w, i, box, c) => { const t0 = at + i * 0.06; return M.focus(c, span(t, t0, t0 + T.dur.in), out, box, title.size, T.blur); } });
      for (const r of layout) {
        const pm = span(t, r.t0 - 0.15, r.t0 + 0.2);
        if (pm > 0 && out < 1) {
          ctx.save(); ctx.globalAlpha = 1 - o; ctx.strokeStyle = pal.ring; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(mx, r.ym, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * M.S(pm)); ctx.stroke();
          if (r.key && pm >= 1) { ctx.fillStyle = pal.ring; ctx.beginPath(); ctx.arc(mx, r.ym, 6, 0, Math.PI * 2); ctx.fill(); }
          const ll = 20 * clamp((pm - 0.5) * 2); ctx.beginPath(); ctx.moveTo(mx + (rtl ? -14 : 14), r.ym); ctx.lineTo(mx + (rtl ? -14 - ll : 14 + ll), r.ym); ctx.stroke();
          ctx.restore();
        }
        for (const run of r.runs) M.ring(ctx, (run.x0 + run.x1) / 2, run.y + r.f.size * 0.04, (run.x1 - run.x0) / 2 + Math.max(16, r.f.space * 0.7), r.f.size * 0.78,
          span(t, r.t0 + 0.3, r.t0 + 0.3 + T.dur.ring), out, pal);
        kit.drawText(ctx, r.f, { x0: cx0, x1: cx1, y: r.ym, align: 'start', color: pal.ink, key: pal.key,
          each: (w, i, box, c) => { const t0 = r.t0 + i * 0.05; return M.focus(c, span(t, t0, t0 + T.dur.item), out, box, r.f.size, T.blur); } });
      }
    },
  };
}
