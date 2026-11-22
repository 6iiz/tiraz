// A list, as a checklist in the window. Each row appears with its empty checkbox, one per beat, and the pixel buddy jumps down from box
// to box: where it lands the box fills with the accent and a check, and a key phrase in that row is selected. The title is the
// checklist's heading over a hairline. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, rr } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, B = M.buddy(P, T.px), c = M.content();
  const box = 50, gap = 54, x0 = c.x0 + 20, x1 = c.x1 - 20;
  const tx0 = rtl ? x0 : x0 + box + gap, tx1 = rtl ? x1 - box - gap : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, minScale: 0.8, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: x1 - x0, minPx: 44, where: 'the list title' }) : null;
  const pitch = (k) => Math.max(rows[k].height + 44, 150), head = title ? title.height + 40 : 110;
  const total = head + items.reduce((s, _, k) => s + pitch(k), 0);
  const top = Math.max(c.y0 + 10, Math.min(740 - total / 2, c.y1 - total));
  const ys = []; { let y = top + head; items.forEach((_, k) => { ys.push(y); y += pitch(k); }); }
  const bxc = rtl ? x1 - box / 2 : x0 + box / 2, boxTop = (k) => ys[k] + 22 + rows[k].lead / 2 - box / 2;
  const beat = Math.min(T.beat, (d - 1.2) / Math.max(1, items.length)), land = (k) => at + 0.45 + k * beat;
  const stops = [{ t: 0, x: bxc, y: top + head - 22 }];
  items.forEach((_, k) => stops.push({ t: land(k) - 0.3, x: bxc, y: boxTop(k), how: 'jump', height: 70, dur: 0.3 }));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.zoom(ctx, W, H, 1 + (T.zoom - 1) * 0.6 * M.IO(span(t, at, at + 2)), W / 2, top + total / 2);
      M.windowFrame(ctx, P, brand, rtl, t + clock, 2);
      if (title) kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'start', color: P.ink });
      ctx.fillStyle = P.line; ctx.fillRect(x0, top + head - 22, x1 - x0, 2);
      const b = M.act(stops, t, 0.3);
      items.forEach((_, k) => {
        const a = span(t, land(k) - 0.3, land(k) - 0.18); if (a <= 0) return;
        const ym = ys[k] + 22 + rows[k].lead / 2;
        const done = t >= land(k), bt = boxTop(k);
        ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 14);
        ctx.fillStyle = P.line; ctx.fillRect(x0, ys[k] + pitch(k) - 1, x1 - x0, 1);
        ctx.lineWidth = 3; ctx.strokeStyle = done ? P.accent : P.ui; ctx.fillStyle = done ? P.accent : P.win;
        rr(ctx, bxc - box / 2, bt, box, box, 12); ctx.fill(); ctx.stroke();
        if (done) { ctx.strokeStyle = P.onAccent; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
          ctx.moveTo(bxc - 13, bt + box / 2 + 1); ctx.lineTo(bxc - 3, bt + box / 2 + 11); ctx.lineTo(bxc + 14, bt + box / 2 - 11); ctx.stroke(); }
        const spans = M.keySpans(rows[k], tx0, tx1, ym, 'start', rtl), sel = span(t, land(k), land(k) + 0.1);
        for (const s of spans) M.select(ctx, P, s, rows[k], sel, rtl);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.ink, key: P.onAccent, each: (w) => (w.key && sel <= 0 ? P.ink : undefined) });
        ctx.restore();
      });
      const cheer = b.landed < 0.4;
      M.drawBuddy(ctx, B, P, b, { eyes: cheer ? 'happy' : 'open', arms: cheer ? 'up' : 'down', time: t + clock, flip: rtl });
      ctx.restore();
    },
  };
}
