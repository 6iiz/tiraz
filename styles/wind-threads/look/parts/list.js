// A list of places on the chart: each item is pinned with a small ring on the reading side and carried in on the wind beside it,
// one after another; the threads part round every row. A key phrase (*…*) in an item gets the gust under it and a filled pin.
// spec: { duration, at?, says: { title?, items: [...] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const indent = 62, cx0 = rtl ? SAFE.left + 10 : SAFE.left + indent, cx1 = rtl ? SAFE.right - indent : SAFE.right - 10;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: cx1 - cx0, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left - 20, minPx: T.minPx, where: 'the list title' }) : null;
  const pitch = Math.max(128, rows[0].size * 2), tH = title ? title.height + 40 : 0;
  const top = kit.place(tH + pitch * items.length, 720);
  const yT = title ? top + title.lead / 2 : 0;
  const TLay = title && M.layout(title, { x0: SAFE.left + 10, x1: SAFE.right - 10, y: yT }, rtl);
  const gapT = Math.min(0.45, (d - 1.5) / Math.max(1, items.length)), out0 = d - T.dur.out;
  const px = rtl ? SAFE.right - 20 : SAFE.left + 20;
  const R = rows.map((f, k) => { const ym = top + tH + k * pitch + pitch / 2; return { f, ym, t0: at + 0.3 + k * gapT, lay: M.layout(f, { x0: cx0, x1: cx1, y: ym }, rtl) }; });
  const obstacles = [...(TLay ? TLay.rows.map((r) => M.calm(r, title.size)) : []), ...R.map((r) => { const o = M.calm(r.lay.rows[0], r.f.size); const xa = Math.min(r.lay.rows[0].x0, px - 20), xb = Math.max(r.lay.rows[0].x1, px + 20); return { ...o, cx: (xa + xb) / 2, a: (xb - xa) / 2 + 70, b: r.f.size * 0.8 + 10 }; })];
  const TH = ground.threads(obstacles, 31);
  return {
    duration: d,
    draw(ctx, t) {
      const out = span(t, out0, d);
      const gusts = R.flatMap((r) => r.lay.runs.map((u) => ({ cx: (u.x0 + u.x1) / 2, cy: u.y, a: (u.x1 - u.x0) / 2 + 140, b: r.f.size * 1.2, k: span(t, r.t0 + 0.3, r.t0 + 0.8) * (1 - out) })));
      ground.draw(ctx, t, TH, { gusts });
      if (title) kit.drawText(ctx, title, { x0: SAFE.left + 10, x1: SAFE.right - 10, y: yT, align: 'start', color: pal.lead,
        each: (w, i, box, c) => { const t0 = at + i * 0.06; return M.blow(c, span(t, t0, t0 + T.dur.in), out, rtl, T.drift); } });
      for (const r of R) {
        const pp = span(t, r.t0 - 0.1, r.t0 + 0.25);
        if (pp > 0 && out < 1) {
          ctx.save(); ctx.globalAlpha = 1 - M.I(out); ctx.strokeStyle = pal.ink; ctx.lineWidth = 3;
          const rad = 12 * M.E(pp); ctx.beginPath(); ctx.arc(px, r.ym, rad, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = r.lay.runs.length ? pal.gust : pal.ink; ctx.beginPath(); ctx.arc(px, r.ym, r.lay.runs.length ? 8 * M.E(pp) : 3.5 * M.E(pp), 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        for (const u of r.lay.runs) M.ribbon(ctx, u.x0, u.x1, u.y + r.f.size * 0.66, span(t, r.t0 + 0.3, r.t0 + 0.3 + T.dur.ribbon), out, pal.gust, rtl, 9);
        kit.drawText(ctx, r.f, { x0: cx0, x1: cx1, y: r.ym, align: 'start', color: pal.ink, key: pal.key,
          each: (w, i, box, c) => { const t0 = r.t0 + i * 0.05; return M.blow(c, span(t, t0, t0 + T.dur.item), out, rtl, T.drift); } });
      }
    },
  };
}
