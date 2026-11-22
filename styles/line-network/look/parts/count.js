// A number as a journey: the figure is printed large inside a cartouche, a double-ruled panel of the sheet. Under it a map line is
// drawn from the reading side through a run of stops; the figure counts with the pen tip and lands on the value when the line
// reaches its terminus, an interchange capsule that drops into place. The label is printed under the line.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, w = T.line.w;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), I = ground.I;
  const X = (x) => (rtl ? x : W - x);
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > SAFE.right - SAFE.left - 120 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, minScale: 0.8, where: 'the count label' });
  const boxH = size * 1.2 + 40, top = kit.place(boxH + 140 + label.height, 700);
  const yNum = top + boxH / 2, yR = top + boxH + 70, yLabel = yR + 60 + label.lead / 2;
  const xs = X(SAFE.right - 30), xe = X(SAFE.left + 40);
  const R = M.route([[X(W + 20), yR], [xe, yR]]);
  const n = 7, stops = Array.from({ length: n }, (_, j) => xs + (xe - xs) * (j / (n - 1)));
  const pAt = (t) => M.D(span(t, at + 0.1, at + 1.5));
  const reach = (x) => Math.abs(x - R.pts[0][0]);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = M.I(span(t, d - T.dur.out, d)); if (o >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, -30 * o);
      // the cartouche
      const pc = M.E(span(t, at - 0.3, at + 0.1));
      if (pc > 0) {
        const bw = (SAFE.right - SAFE.left) * (0.6 + 0.4 * pc), bx = W / 2 - bw / 2;
        ctx.fillStyle = I.paper; ctx.fillRect(bx, top, bw, boxH);
        ctx.strokeStyle = I.ink; ctx.lineWidth = 4; ctx.strokeRect(bx, top, bw, boxH); ctx.lineWidth = 1.5; ctx.strokeRect(bx + 10, top + 10, bw - 20, boxH - 20);
      }
      const p = pAt(t), head = R.total * p;
      M.line(ctx, R, I.lines[0], w, 0, head, true);
      stops.forEach((x, j) => {
        const on = reach(x) <= head + 0.5 && p > 0;
        if (j === n - 1) M.capsule(ctx, x, yR, 26, w, I, p >= 1 ? span(t, at + 1.5, at + 1.8) : 0, true);
        else if (on) M.station(ctx, x, yR, w * 0.62, I, 1);
      });
      if (pc > 0) kit.number(ctx, text(p > 0 ? countValue(0, S.value, p, (x) => x) : 0), { x: W / 2, y: yNum, size, weight: 800, color: I.ink, settle: p });
      kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: I.dim,
        each: (w2, i, box, c) => M.print(c, span(t, at + 0.3 + i * 0.06, at + 0.3 + i * 0.06 + T.dur.print), box, label.size, rtl) });
      ctx.restore();
    },
  };
}
