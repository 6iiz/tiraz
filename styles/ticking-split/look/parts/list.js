// A list as a checklist in real time: the clock counts down while the frame is cut into one more strip for every item, each cut on its
// beat. A strip has a check box on the reading side that turns to the accent with a tick as its item comes in, and a camera chip on
// the far side; the key phrase (*…*) gets the tracking brackets. When the last item is in, zero: the strips close into one panel.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock: clk, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, A = T.area, gut = T.gutter;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock: clk });
  const M = await import(look.base + 'motion.js'), P = ground.palette, mono = ground.mono, vig = M.vignette(P);
  const x0 = Math.max(A.x0 + 40, SAFE.left + 6), x1 = Math.min(A.x1 - 40, SAFE.right - 6), box = 44, chipW = 150;
  const tx0 = rtl ? x0 + chipW : x0 + box + 30, tx1 = rtl ? x1 - box - 30 : x1 - chipW;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0 - 40, minPx: 44, where: 'the list title' }) : null;
  const sh = Math.round(rows[0].size * 1.6 + 36), hT = title ? Math.round(title.height + 60) : 0;
  const total = hT + (title ? gut : 0) + items.length * sh + (items.length - 1) * gut;
  const top = A.y0 + Math.max(0, Math.round((A.y1 - A.y0 - total) / 2) - 40);
  const RT = { x: A.x0, y: top, w: A.x1 - A.x0, h: hT };
  const R = items.map((_, k) => ({ x: A.x0, y: top + hT + (title ? gut : 0) + k * (sh + gut), w: A.x1 - A.x0, h: sh }));
  const whole = { x: A.x0, y: top, w: A.x1 - A.x0, h: total };
  const tAt = (k) => at + 0.3 + k * T.beat, zero = Math.max(at + 2.4, tAt(items.length - 1) + 0.45);
  const tick = (ctx, bx, by, c) => { ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.lineCap = 'square'; ctx.beginPath(); ctx.moveTo(bx + 10, by + 23); ctx.lineTo(bx + 19, by + 32); ctx.lineTo(bx + 34, by + 13); ctx.stroke(); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.clock(ctx, t, zero, P, mono, rtl, M.clockBox(T, rtl));
      const m = M.snap(span(t, zero, zero + T.dur.merge));
      if (m > 0) M.cell(ctx, whole, P, mono, rtl, { vignette: vig, chip: 0 });
      if (title) {
        if (m < 1) M.cell(ctx, RT, P, mono, rtl, { vignette: vig, chip: 0, border: 1 - m });
        kit.drawText(ctx, title, { x0, x1, y: RT.y + RT.h / 2 - ((title.rows.length - 1) * title.lead) / 2, align: 'start', color: P.muted });
      }
      items.forEach((_, k) => {
        const t0 = tAt(k); if (t < t0) return;
        const r = R[k];
        if (m < 1) {
          if (m > 0) { ctx.save(); ctx.globalAlpha = 1 - m; }
          M.cell(ctx, r, P, mono, !rtl, { vignette: vig, code: `CAM ${k + 1}`, live: true, border: 1 });
          if (m > 0) ctx.restore();
          if (t - t0 < 0.07) { ctx.strokeStyle = P.accent; ctx.lineWidth = 3; ctx.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3); }   // the cut lands
        }
        const ym = r.y + r.h / 2, bx = rtl ? x1 - box : x0, by = ym - box / 2;
        ctx.fillStyle = P.accent; ctx.fillRect(bx, by, box, box); tick(ctx, bx, by, P.on(P.accent));
        M.keySpans(rows[k], tx0, tx1, ym, 'start', rtl).forEach((s) => M.brackets(ctx, s.x0, s.x1, s.y, rows[k].size, P, span(t, t0 + 0.05, t0 + 0.3)));
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.text, key: P.keyText });
      });
    },
  };
}
