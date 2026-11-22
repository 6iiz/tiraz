// A list as one line of the map running down the reading side: the title is the line's name, beside a round line bullet; then the
// pen draws the line downward, one stop per beat, and each item's name is printed out of its stop. A key word makes its stop an
// interchange: a capsule drops onto the line and the word gets a name plate in the accent. spec: { duration, at?, says: { title?, items } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, w = T.line.w;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), I = ground.I;
  const xl = rtl ? SAFE.right - 26 : SAFE.left + 26, tx0 = rtl ? SAFE.left : xl + 56, tx1 = rtl ? xl - 56 : SAFE.right;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: tx1 - tx0, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(118, rows[0].lead + 30), head = title ? title.lead + 50 : 40;
  const top = kit.place(head + pitch * items.length + 30, 730), y0 = top + head;
  const ys = items.map((_, k) => y0 + k * pitch + pitch / 2);
  const yStart = title ? top + title.lead / 2 : top, yEnd = ys.at(-1) + 70;
  const times = items.map((_, k) => at + 0.25 + k * T.beat);
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const wb = rows.map((r, k) => M.boxes(kit, r, { x0: tx0, x1: tx1, y: ys[k], align: 'start' }));
  // the tip's height: it reaches each stop on its beat, and runs on a little past the last one
  const tipY = (t) => {
    let y = yStart;
    for (let k = 0; k < items.length; k++) { const a = (k ? ys[k - 1] : yStart), q = M.D(span(t, times[k] - 0.3, times[k])); y = a + (ys[k] - a) * q; if (q < 1) return y; }
    return ys.at(-1) + (yEnd - ys.at(-1)) * M.D(span(t, times.at(-1), times.at(-1) + 0.3));
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = M.I(span(t, d - T.dur.out, d)); if (o >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, -30 * o);
      const ty = tipY(t);
      if (ty > yStart) {
        ctx.strokeStyle = I.lines[0]; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xl, yStart); ctx.lineTo(xl, ty); ctx.stroke();
        if (ty >= yEnd - 0.5) { ctx.lineCap = 'butt'; ctx.lineWidth = w * 0.7; ctx.beginPath(); ctx.moveTo(xl - w * 1.4, yEnd); ctx.lineTo(xl + w * 1.4, yEnd); ctx.stroke(); }
      }
      if (title) {
        M.station(ctx, xl, yStart, w * 1.25, { paper: I.accent, ink: I.ink }, span(t, at - 0.3, at));
        kit.drawText(ctx, title, { x0: tx0, x1: tx1, y: yStart, align: 'start', color: I.ink,
          each: (w2, i, box, c) => M.print(c, span(t, at - 0.2 + i * 0.05, at - 0.2 + i * 0.05 + T.dur.print), box, title.size, rtl) });
      }
      items.forEach((_, k) => {
        const tk = times[k];
        if (keyed[k]) M.capsule(ctx, xl, ys[k], 20, w, I, span(t, tk, tk + 0.3), false);
        else M.station(ctx, xl, ys[k], w * 0.62, I, span(t, tk, tk + 0.25));
        if (keyed[k]) for (const b of M.spans(wb[k].filter((b) => b.key))) M.plate(ctx, b, rows[k].size, I.accent, span(t, tk + 0.12, tk + 0.42));
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ys[k], align: 'start', color: I.ink, key: I.ink,
          each: (w2, i, box, c) => {
            if (M.print(c, span(t, tk + 0.02 + i * 0.05, tk + 0.02 + i * 0.05 + T.dur.print), box, rows[k].size, rtl) === false) return false;
            if (w2.key && t >= tk + 0.12) return I.onAccent;
          } });
      });
      ctx.restore();
    },
  };
}
