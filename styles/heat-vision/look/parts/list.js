// A list as spot meters: one measuring box holds up to five rows; each row is marked by a spot-meter crosshair on the reading side that
// drops onto it, and the row warms up when the meter lands, one per beat. A key phrase in a row sits in the isotherm.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const mark = 64, x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad;
  const tx0 = rtl ? x0 : x0 + mark + 20, tx1 = rtl ? x1 - mark - 20 : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the list title' }) : null;
  const pitch = rows[0].size * 1.75, tH = title ? title.height + 24 : 0;
  const hBox = tH + pitch * items.length + T.pad * 2, top = kit.place(hBox, 700);
  const out0 = d - T.dur.out, mx = rtl ? x1 - mark / 2 : x0 + mark / 2;
  const t0s = items.map((_, k) => at + 0.25 + k * T.dur.beat);
  const ys = items.map((_, k) => top + T.pad + tH + pitch * k + pitch / 2);
  const runs = rows.map((r, k) => M.keyRuns(r, { x0: tx0, x1: tx1, y: ys[k], align: 'start', rtl }));
  return {
    duration: d,
    draw(ctx, t) {
      const live = 1 - span(t, out0, d);
      const extra = ys.map((y, k) => ({ x: mx, y, r: 120, k: 0.5 * M.heat(t, t0s[k], 0.3, out0, T.dur.out) }));
      ground.draw(ctx, t, extra);
      M.areaBox(ctx, pal, SAFE.left, top, SAFE.right - SAFE.left, hBox, span(t, at, at + 0.25) * live, 'SP', mono);
      if (title) kit.drawText(ctx, title, { x0, x1, y: top + T.pad + title.lead / 2, align: 'start', color: pal.dim,
        each: (w, i, b, c) => M.warm(c, M.heat(t, at + i * T.dur.stagger, T.dur.rise, out0, T.dur.out), pal, pal.dim) });
      items.forEach((_, k) => {
        const y = ys[k], drop = M.outC(span(t, t0s[k] - 0.2, t0s[k])), kk = M.heat(t, t0s[k], T.dur.rise, out0, T.dur.out);
        if (drop > 0 && live > 0) {                                        // the spot meter: a crosshair that drops onto the row
          ctx.save(); ctx.globalAlpha = Math.min(1, drop * 2) * live; ctx.strokeStyle = kk > 0.5 ? pal.hot : pal.dim; ctx.lineWidth = 3;
          const yy = y - (1 - drop) * 50, r = 16;
          ctx.beginPath(); ctx.arc(mx, yy, r, 0, Math.PI * 2);
          ctx.moveTo(mx - r - 12, yy); ctx.lineTo(mx - r + 5, yy); ctx.moveTo(mx + r - 5, yy); ctx.lineTo(mx + r + 12, yy);
          ctx.moveTo(mx, yy - r - 12); ctx.lineTo(mx, yy - r + 5); ctx.moveTo(mx, yy + r - 5); ctx.lineTo(mx, yy + r + 12);
          ctx.stroke(); ctx.restore();
        }
        runs[k].forEach((r) => { M.isotherm(ctx, pal, r, M.heat(t, t0s[k] + 0.15, 0.28, out0, T.dur.out), rtl); });
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y, align: 'start', color: pal.hot, key: pal.onAccent,
          each: (w, i, b, c) => M.warm(c, M.heat(t, t0s[k] + i * 0.04, T.dur.rise, out0, T.dur.out), pal, w.key ? pal.onAccent : pal.hot) });
      });
    },
  };
}
