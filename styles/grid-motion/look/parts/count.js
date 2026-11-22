// A number as kinetic type: a giant numeral shoots in on its track flush to the reading side and then rolls up to its value like an
// odometer, each new value pushing the last one up out of the row, the steps coming faster then slower until it lands. A heavy ink
// bar and the label follow on their own tracks; the value crawls under the frame as giant tonal type.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 140) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW, minScale: 0.85, where: 'the count label' });
  const top = kit.place(size * 1.24 + 82 + label.height, 760), yNum = top + size * 0.62, yBar = yNum + size * 0.62 + 10, yLabel = yBar + 16 + 40 + label.lead / 2;
  // the roll: N values, the gaps between them shrinking then growing (fast in the middle, landing slow)
  const N = 7, steps = [];
  for (let k = 1; k <= N; k++) steps.push(at + 0.45 + 1.15 * (0.5 - 0.5 * Math.cos(Math.PI * k / N)));
  const valueAt = (k) => (k >= N ? S.value : countValue(0, S.value, k / N, (x) => x));
  const n = 2 + label.rows.length, out0 = d - T.dur.out - 0.04 * (n - 1);
  const dx = (t, g) => M.travel(W, span(t, at + g * 0.1, at + g * 0.1 + T.dur.slide), span(t, out0 + g * 0.04, out0 + g * 0.04 + T.dur.out), M.rowDir(g, rtl));
  const ghost = kit.fit(text(S.value), { size: T.size.ghost, weight: 900, maxW: 99999, single: true, overflow: true, where: 'the ghost type' });
  const num = (ctx, v, y, decor) => kit.number(ctx, text(v), { x: rtl ? x1 : x0, y, size, color: pal.ink, align: rtl ? 'right' : 'left', decor });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.ticker(ctx, kit, ghost, t + clock, { W, y: 1600, color: pal.ghost, speed: T.ticker });
      const o = dx(t, 0);
      if (o !== null) {
        let k = 0; while (k < N && t >= steps[k]) k++;
        const q = k > 0 ? M.SNAP(span(t, steps[k - 1], steps[k - 1] + T.dur.roll)) : 1, h = size * 1.02;
        ctx.save(); ctx.translate(o, 0); ctx.beginPath(); ctx.rect(0, yNum - size * 0.6, W, size * 1.2); ctx.clip();
        if (q < 1) num(ctx, valueAt(k - 1), yNum - q * h, true);
        num(ctx, valueAt(k), yNum + (1 - q) * h, q < 1);   // a value in flight is clipped by its row: not measured
        ctx.restore();
      }
      const ob = dx(t, 1);
      if (ob !== null) { ctx.fillStyle = pal.ink; ctx.fillRect(x0 + ob, yBar, maxW, 16); }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.ink,
        each: (w, i, box, c) => { const ol = dx(t, 2 + box.row); if (ol === null) return false; c.translate(ol, 0); } });
    },
  };
}
