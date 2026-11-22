// A number as a measured reading. A range line is drawn across the ground between two points (a hairline in the class colour with
// end ticks), and as it runs the reading in the caption plate rolls to its value in shrinking steps; a dashed leader ties the reading
// to the line's midpoint. The label settles under the numeral. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, P = T.plate;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 120) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const top = kit.place(size * 0.95 + 20 + label.height, 560), yNum = top + size * 0.47, aLab = { x0, x1, y: top + size * 0.95 + 20 + label.lead / 2, align: 'start' };
  const py0 = top - P.pad, py1 = top + size * 0.95 + 20 + label.height + P.pad - 12;
  const t0 = clock + Math.max(0, at), A = ground.fromScreen(kit.rtl ? 930 : 150, 1170, t0), B = ground.fromScreen(kit.rtl ? 170 : 910, 1060, t0);
  const out0 = d - T.dur.out, roll = [at + 0.25, at + 1.45];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pp = M.plateP(t, at, T.dur.open, out0, T.dur.out); if (pp <= 0) return;
      const hold = 1 - M.inC(span(t, out0, out0 + T.dur.out * 0.6)), p = span(t, roll[0], roll[1]), e = M.outC(p);
      const a = ground.toScreen(A.x, A.y, t + clock), b = ground.toScreen(B.x, B.y, t + clock);
      if (p > 0 && hold > 0) {                                           // the range line, drawn along its length
        ctx.save(); ctx.globalAlpha = hold; ctx.strokeStyle = pal.key; ctx.lineWidth = 2.5;
        const bx = a.x + (b.x - a.x) * e, by = a.y + (b.y - a.y) * e, nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny), ux = nx / nl * 18, uy = ny / nl * 18;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bx, by); ctx.moveTo(a.x - ux, a.y - uy); ctx.lineTo(a.x + ux, a.y + uy); ctx.moveTo(bx - ux, by - uy); ctx.lineTo(bx + ux, by + uy); ctx.stroke();
        for (const q of [a, { x: bx, y: by }]) { ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, 6.283); ctx.stroke(); }
        if (e > 0.98) { const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(mx, my - 10); ctx.lineTo(mx, py1 + 4); ctx.stroke(); }
        ctx.restore();
      }
      M.plate(ctx, pal, P.x0, py0, P.x1, py1, pp, kit.rtl);
      const w = (P.x1 - P.x0) * M.snap(pp);
      ctx.save(); ctx.beginPath(); ctx.rect(kit.rtl ? P.x1 - w : P.x0, py0, w, py1 - py0); ctx.clip();
      kit.number(ctx, text(countValue(0, S.value, p, (x) => 1 - (1 - x) ** 3)), { x: kit.rtl ? x1 : x0, y: yNum, size, color: pal.light, align: kit.rtl ? 'right' : 'left', settle: p });
      M.settle(kit, ctx, label, aLab, t, at + 0.35, 0.04, T.dur.word, pal.grey, pal.key);
      ctx.restore();
    },
  };
}
