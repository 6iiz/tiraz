// A number as a meter on the board: a row of ten LED pads on one trace. Current enters from the reading side's edge and runs along
// the trace; every LED it passes lights and stays lit, and the silkscreen figure above counts with it, landing on the value as the
// last LED comes on. The label is printed below in a clear field. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, ease, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > SAFE.right - SAFE.left - 80 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 60, minScale: 0.8, where: 'the count label' });
  const top = kit.place(size * 1.15 + 150 + label.height + 40, 700);
  const yNum = top + size * 0.58, yBar = top + size * 1.15 + 50, yLabel = yBar + 70 + label.lead / 2;
  const n = 10, lx0 = SAFE.left + 30, lx1 = SAFE.right - 30, step = (lx1 - lx0) / (n - 1);
  const leds = Array.from({ length: n }, (_, j) => (rtl ? lx1 - j * step : lx0 + j * step));
  const feed = M.route(rtl ? [[W + 20, yBar], [lx0 - 40, yBar]] : [[-20, yBar], [lx1 + 40, yBar]]);
  const xAt = (x) => Math.abs(x - feed.pts[0][0]);
  const run = (t) => ease.outQuad(span(t, at + 0.1, at + 1.5));
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = M.I(span(t, out0, d)); if (o >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, -36 * o);
      M.field(ctx, SAFE.left - 40, top - 30, SAFE.right + 40, yLabel + label.height - label.lead / 2 + 40, P);
      // the display window: corner marks in silkscreen
      ctx.strokeStyle = P.dim; ctx.lineWidth = 3; const wy0 = top - 6, wy1 = top + size * 1.15, wx0 = SAFE.left, wx1 = SAFE.right, c = 34;
      ctx.beginPath();
      for (const [x, y, sx, sy] of [[wx0, wy0, 1, 1], [wx1, wy0, -1, 1], [wx0, wy1, 1, -1], [wx1, wy1, -1, -1]]) { ctx.moveTo(x + sx * c, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * c); }
      ctx.stroke();
      const p = run(t), head = xAt(leds[n - 1]) * p + (p > 0 ? 40 * (1 - p) : 0);
      M.trace(ctx, feed, P, 9);
      if (p > 0) M.glow(ctx, feed, P, Math.max(0, head - 260), head, 9, p < 1 ? 1 : 0.5);
      leds.forEach((x, j) => {
        const on = xAt(x) <= head + 1 && p > 0, since = on ? 1 : 0;
        M.pad(ctx, x - 18, yBar - 18, 36, 36, 18, P, since * (j === n - 1 && p >= 1 ? 1 : 0.55));
      });
      const shown = p > 0 ? text(countValue(0, S.value, p, (x) => x)) : text(0);
      const pn = span(t, at - 0.2, at + 0.1);
      if (pn > 0) {
        ctx.save(); ctx.globalAlpha *= 0.25 + 0.75 * pn;
        if (p >= 1) M.halo(ctx, W / 2 - size * 1.4, yNum - size * 0.7, size * 2.8, size * 1.4, P, 0.4 * (1 - span(t, at + 1.5, at + 2.2)));
        kit.number(ctx, shown, { x: W / 2, y: yNum, size, weight: 800, color: P.silk, settle: p });
        ctx.restore();
      }
      kit.drawText(ctx, label, { x0: SAFE.left + 30, x1: SAFE.right - 30, y: yLabel, color: P.dim,
        each: (w, i, box, c2) => M.power(c2, t, at + 0.25 + i * 0.06, T.dur.in, box, label.size, P) });
      ctx.restore();
    },
  };
}
