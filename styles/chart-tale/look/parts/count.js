// A number read off the chart: the pencil's point is marked with an accent dot, a dashed reading line runs from it back across
// the past part of the chart, and a stem climbs to a big number that counts up while the reading line is drawn. The label is written
// under the number, a key phrase circled. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 110) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 40, minPx: 46, where: 'the count label' });
  const block = size * 1.0 + 10 + label.height, top = kit.place(block, 600), bottom = top + block + 26;
  const yNum = top + size * 0.5, yLabel = top + size + 10 + label.lead / 2, lx0 = x0 + 20, lx1 = x1 - 20;
  const runs = M.keyRuns(label, { x0: lx0, x1: lx1, y: yLabel, align: 'start' }, rtl);
  const c0 = at + 0.25, c1 = at + 1.55, out = (t) => span(t, d - T.dur.out, d);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { pen: false });
      const o = out(t), [tx, ty] = ground.tip(t), rp = span(t, c0, c1);
      if (rp > 0 && o < 1) {                                  // the dashed reading line back across the chart, and the drop to zero
        const reach = (rtl ? W - tx : tx) * M.E(rp), a = 1 - M.OUT(o);
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = pal.line; ctx.lineWidth = 4; ctx.setLineDash([16, 11]);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - ground.dir * reach, ty); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty + (1470 - ty) * M.E(rp)); ctx.stroke(); ctx.restore();
      }
      M.stem(ctx, [tx, ty], bottom, span(t, at, at + 0.3) * (1 - M.OUT(o)), pal);
      const dp = M.E(span(t, at + 0.1, at + 0.4)) * (1 - M.OUT(o)); if (dp > 0) M.dot(ctx, tx, ty, 13 * dp, pal, true);
      ctx.save();
      if (M.erase(ctx, o) !== false && t >= c0 - 0.05) {
        const p = span(t, c0, c1), wp = M.W8(span(t, c0 - 0.05, c0 + 0.22)), nw = maxW * wp;
        ctx.beginPath(); ctx.rect(rtl ? x1 + 20 - nw : x0 - 20, yNum - size, nw + 40, size * 2); ctx.clip();
        kit.number(ctx, text(countValue(0, S.value, p, ease.outQuart)), { x: rtl ? x1 : x0, y: yNum, size, color: pal.ink, align: rtl ? 'right' : 'left', settle: p });
      }
      ctx.restore();
      kit.drawText(ctx, label, { x0: lx0, x1: lx1, y: yLabel, align: 'start', color: pal.ink, key: pal.keyText,
        each: (w, i, box, c) => { const s = at + 0.45 + i * 0.08; if (M.write(c, span(t, s, s + T.dur.in), box, label.size, rtl) === false) return false; if (M.erase(c, o) === false) return false; } });
      for (const r of runs) { const s = at + 0.6 + r.last * 0.08; ctx.save(); if (M.erase(ctx, o) !== false) M.loop(ctx, r, label.size, span(t, s, s + 0.3), pal.line, r.first); ctx.restore(); }
      ground.pen(ctx, t);
    },
  };
}
