// A number noted on location: the figure is written and climbs to its value, a box is drawn round it in pen (four sides, each
// overshooting), and a wash of the brand's colour is dropped into the box, off the lines. The label is written underneath, and a curved
// arrow is drawn from the label up to the box. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > 660 && size > 110) size -= 8;
  const numW = kit.numberWidth(text(S.value), size, 800, 1);
  const x0 = SAFE.left + 30, x1 = SAFE.right - 40;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0 - 120, minScale: 0.8, where: 'the count label' });
  const bw = Math.max(numW + 120, size * 1.1), bh = size * 1.15;
  const top = kit.place(bh + 130 + label.height, 680), bxX = rtl ? x1 - bw : x0, by = top, cy = by + bh / 2;
  const yLabel = by + bh + 110 + label.lead / 2;
  const frame = M.box(bxX, by, bw, bh, 21), fill = M.patch(bw * 0.92, bh * 0.86, pal.wash, pal.washA(T.tone.wash), 23);
  const lbx = M.boxes(label, { x0, x1, y: yLabel, rtl }), tw = M.schedule(lbx, at + 0.7, label.size, T.dur.perPx);
  // the arrow: from the far end of the label's first row, up to the box's lower far corner
  const r0 = lbx.filter((b) => b.row === 0), lx = rtl ? Math.min(...r0.map((b) => b.x)) - 20 : Math.max(...r0.map((b) => b.x + b.width)) + 20;
  const arrow = M.arrow([lx, yLabel - label.size * 0.2], [rtl ? bxX - 14 : bxX + bw + 14, by + bh * 0.75], rtl ? -40 : 40, 29);
  const tLand = at + 1.4;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      M.drop(ctx, fill, bxX + bw * 0.04, by + bh * 0.07, span(t, at + 0.75, at + 1.1), [9, -7], keep);
      const p = span(t, at, tLand), q = span(t, at, at + 0.45);
      if (q > 0 && keep > 0) {
        ctx.save(); ctx.globalAlpha = keep; ctx.beginPath(); ctx.rect(bxX - 20, by - 40, (bw + 40) * q, bh + 80); ctx.clip();   // digits are written left to right
        kit.number(ctx, text(countValue(0, S.value, p, M.E)), { x: bxX + bw / 2, y: cy + size * 0.04, size, weight: 800, color: pal.ink, settle: p });
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = keep;
      M.drawAll(ctx, frame, M.PEN(span(t, at + 0.3, at + 0.75)), pal.line, 3);
      M.drawAll(ctx, arrow, span(t, tLand - 0.2, tLand + 0.2), pal.line, 2.6);
      ctx.restore();
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.quiet(T.tone.grey), each: (w, i, box, c) => M.write(c, span(t, tw[i][0], tw[i][1]), out, box, label.size, rtl) });
    },
  };
}
