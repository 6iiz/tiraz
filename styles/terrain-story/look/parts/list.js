// A list as stops on a route. Each row settles in the sky with a stop marker on the reading side, and on the terrain below the route
// runs on to the matching stop, which lights up. A key phrase in a row gets the accent callout plate.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const X0 = SAFE.left + 10, X1 = SAFE.right - 10, indent = 64, tx0 = kit.rtl ? X0 : X0 + indent, tx1 = kit.rtl ? X1 - indent : X1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 500, maxW: X1 - X0, minScale: 0.92, minPx: 44, where: 'the list title' }) : null;
  const pitch = Math.max(98, rows[0].size * 1.72), tH = title ? title.height + 20 : 0, top = kit.place(tH + pitch * items.length, 580);
  const aT = title && { x0: X0, x1: X1, y: top + title.lead / 2, align: 'start' };
  const R = rows.map((f, k) => { const y = top + tH + k * pitch + pitch / 2, a = { x0: tx0, x1: tx1, y, align: 'start' }; return { f, a, y, t: at + 0.3 + k * T.dur.row, runs: M.runs(M.layout(kit, f, a)) }; });
  const t0 = clock + Math.max(0, at), mx = kit.rtl ? X1 - 22 : X0 + 22, nS = items.length + 1;
  const stops = Array.from({ length: nS }, (_, k) => { const fx = 0.1 + 0.8 * k / (nS - 1); return ground.pick((kit.rtl ? 1 - fx : fx) * W, 1170 + (k % 2 ? 90 : 0), t0); });
  const path = M.spline(stops.map((s) => [s.u, s.v]), 18);
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, out0, d), keep = 1 - M.inC(out);
      const pts = path.map(([u, v]) => ground.at(u, v, 1.5, time));
      let reach = 0; R.forEach((r, k) => { reach = Math.max(reach, (k + M.outC(span(t, r.t - 0.1, r.t + 0.3)))); });
      M.route(ctx, pal, pts, Math.min(1, (reach + (reach > 0 ? 0 : 0)) / (nS - 1)) * 1, time, { alpha: keep });
      stops.forEach((s, k) => {
        const on = k === 0 ? (t >= at + 0.2 ? 1 : 0) : span(t, R[k - 1].t + 0.2, R[k - 1].t + 0.4); if (on <= 0 || keep <= 0) return;
        const b = ground.at(s.u, s.v, 1.5, time);
        ctx.save(); ctx.globalAlpha = keep; ctx.fillStyle = pal.light; ctx.strokeStyle = pal.line; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(b.x, b.y, 9 + 4 * M.outC(on), 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore();
      });
      if (title) kit.drawText(ctx, title, { ...aT, color: pal.grey, each: M.drop(t, at, 0.04, T.dur.word, out, title.size) });
      R.forEach((r, k) => {
        const q = M.outC(span(t, r.t, r.t + 0.3)) * keep;
        if (q > 0) { ctx.save(); ctx.strokeStyle = pal.line; ctx.fillStyle = pal.light; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx, r.y - 12 * (1 - q), 11, 0, 6.283); ctx.globalAlpha = q; ctx.fill(); ctx.stroke(); ctx.restore(); }
        r.runs.forEach((rn) => M.callout(ctx, pal, rn, r.f.size, r.f.space, span(t, r.t + 0.15, r.t + 0.4) * keep));
        const cal = span(t, r.t + 0.15, r.t + 0.4);
        kit.drawText(ctx, r.f, { ...r.a, color: pal.dark, key: cal > 0.5 && out < 0.5 ? pal.onAccent : pal.dark, each: M.drop(t, r.t, 0.04, T.dur.word, out, r.f.size) });
      });
    },
  };
}
