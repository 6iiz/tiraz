// A list as a written page inside the picture: a tall vellum panel is painted, faint ruling lines are drawn across it, and the title is
// written in red-letter ink on a forked ribbon over its top edge. Each item then gets a square of gold leaf at its reading side, laid
// and pearled, and is written by the pen; key words (*…*) get a bed of leaf first. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2, rtl = kit.rtl;
  const pw = SAFE.right - SAFE.left, px = SAFE.left, bullet = 38, padX = 56;
  const textW = pw - padX * 2 - bullet - 30;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: pw - 200, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].lead + 26, 118), rh = title ? title.lead + 24 : 0;
  const ph = pitch * items.length + 90 + (title ? rh / 2 + 20 : 0);
  const top = kit.place(ph + rh / 2, 740), py = top + rh / 2, y0 = py + 45 + (title ? rh / 2 + 20 : 0);
  const xr = rtl ? px + pw - padX : px + padX;                          // the reading edge of the rows
  const ro = rows.map((r, k) => ({ x0: rtl ? px + padX : px + padX + bullet + 30, x1: rtl ? px + pw - padX - bullet - 30 : px + pw - padX, y: y0 + k * pitch + pitch / 2, align: 'start' }));
  const boxes = rows.map((r, k) => M.boxesOf(kit, r, ro[k]));
  const when = [], leaves = [];
  rows.forEach((r, k) => {
    let tw = at + 0.75 + k * T.beat; const w = [];
    boxes[k].forEach((b) => { w.push([tw, tw + b.width / T.pen]); tw += b.width / T.pen + 0.04; });
    when.push(w);
    leaves.push(boxes[k].map((b, i) => (b.key ? M.leaf(b.x - 12, b.y - r.size * 0.62, b.width + 24, r.size * 1.24, pal, 200 + k * 9 + i, 15) : null)));
  });
  const bul = rows.map((r, k) => M.leaf(rtl ? xr - bullet : xr, ro[k].y - bullet / 2, bullet, bullet, pal, 300 + k, 13));
  const to = title ? { x0: cx - title.width / 2, x1: cx + title.width / 2, y: top + rh / 2, align: 'center' } : null;
  const tb = title ? M.boxesOf(kit, title, to) : [];
  let tt = at + 0.4; const twhen = tb.map((b) => { const t0 = tt; tt += b.width / T.pen + 0.04; return t0; });
  const rule = mix(pal.vellum, pal.ink, 0.16);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d), light = ground.light(time + 0.7);
      ctx.save(); ctx.globalAlpha = 1 - out;
      M.painted(ctx, span(t, at, at + 0.7), (c) => M.panelPath(c, px, py, pw, ph, 36), (pw + ph) * 2, pal,
        { inset: (c) => M.panelPath(c, px + 12, py + 12, pw - 24, ph - 24, 24) });
      const pr = M.S(span(t, at + 0.45, at + 0.95));                     // the ruling, drawn across the page
      if (pr > 0) { ctx.fillStyle = rule; for (let k = 0; k <= items.length; k++) { const y = y0 + k * pitch, w = (pw - 80) * pr; ctx.fillRect(rtl ? px + pw - 40 - w : px + 40, y, w, 1.5); } }
      if (title) {
        M.painted(ctx, span(t, at + 0.15, at + 0.55), (c) => M.ribbonPath(c, cx, top + rh / 2, title.width + 70, rh), (title.width + rh) * 2 + 120, pal, { weight: 3.5 });
        kit.drawText(ctx, title, { ...to, color: pal.rubric, each: (w, i, box, c) => M.pen(c, span(t, twhen[i], twhen[i] + box.width / T.pen), box, title.size, rtl) });
      }
      rows.forEach((r, k) => {
        const t0 = at + 0.75 + k * T.beat - 0.3, b = bul[k];
        b.draw(ctx, span(t, t0, t0 + 0.3), M.sweep(b.x, b.x + b.w, span(t, t0 + 0.35, t0 + 0.9), rtl, light));
        if (t >= t0 + 0.3) { ctx.strokeStyle = pal.ink; ctx.lineWidth = 3; ctx.strokeRect(b.x, b.y, b.w, b.h); M.pearl(ctx, b.x + b.w / 2, b.y + b.h / 2, 4, pal); }
        leaves[k].forEach((L, i) => { if (L) L.draw(ctx, span(t, when[k][i][0] - 0.35, when[k][i][0]), M.sweep(L.x, L.x + L.w, span(t, when[k][i][1] + 0.1, when[k][i][1] + 0.9), rtl, light)); });
        kit.drawText(ctx, r, { ...ro[k], color: pal.ink, key: pal.ink, each: (w, i, box, c) => M.pen(c, span(t, when[k][i][0], when[k][i][1]), box, r.size, rtl) });
      });
      ctx.restore();
    },
  };
}
