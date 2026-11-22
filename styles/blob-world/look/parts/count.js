// A number the crowd makes true: Pips hop up from the bottom of the board one after another and line up in neat rows under the label;
// the printed number counts the Pips as they land (when the value is larger than the board can hold, each Pip stands for an equal
// share, and the last one to land brings the exact value). spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S0 = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left, x1 = SAFE.right;
  const label = kit.fit(S0.label, { size: T.size.label, weight: 700, maxW: x1 - x0, minScale: 0.85, where: 'the count label' });
  const text = (v) => (S0.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S0.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S0.value), size, 900, 1) > x1 - x0 && size > 120) size -= 8;
  const V = Math.abs(S0.value), N = Math.max(1, Math.min(21, Math.round(V) || 1)), cols = Math.min(7, N), rowsN = Math.ceil(N / cols);
  const pitchX = 126, pitchY = 112, gridH = rowsN * pitchY;
  const block = size * 1.05 + 30 + label.height + 40 + gridH, top = kit.place(block, 700);
  const yNum = top + size * 0.52, yLabel = top + size * 1.05 + 30 + label.lead / 2, yGrid = yLabel + label.lead / 2 + 40 + 84;
  const r = rng(202), gap = Math.min(0.11, 1.3 / N), pips = [], lands = [];
  for (let k = 0; k < N; k++) {
    const row = Math.floor(k / cols), col = k % cols, inRow = row === rowsN - 1 ? N - row * cols : cols;
    const cx = W / 2 + (kit.rtl ? 1 : -1) * ((inRow - 1) / 2 - col) * pitchX, cy = yGrid + row * pitchY;
    const land = at + 0.25 + k * gap; lands.push(land);
    const plan = new M.Plan(cx + (r() - 0.5) * 300, 1990).hop(cx, cy, { at: land - 0.69, n: 3, per: 0.23, h: 60, happy: true });
    pips.push({ plan, spr: ground.spr[k % 4], size: 88, seed: k });
  }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const landed = lands.filter((l) => t >= l).length, out = span(t, d - T.dur.out, d);
      const v = landed >= N ? S0.value : Math.round((S0.value / N) * landed * Math.pow(10, spec.decimals ?? 0)) / Math.pow(10, spec.decimals ?? 0);
      const pin = span(t, at, at + 0.2);
      if (pin > 0 && out < 1) {
        ctx.save(); ctx.globalAlpha = Math.min(1, pin * 2) * (1 - out);
        const cx = kit.rtl ? x1 : x0, s = 1 + 0.05 * (1 - M.soft(pin)) + (landed && t - lands[landed - 1] < 0.12 ? 0.015 : 0);
        ctx.translate(cx, yNum); ctx.scale(s, s); ctx.translate(-cx, -yNum);
        kit.number(ctx, text(v), { x: cx, y: yNum, size, color: P.ink, align: kit.rtl ? 'right' : 'left', settle: landed >= N ? 1 : 0 });
        ctx.restore();
      }
      M.printText(ctx, kit, label, { x0, x1, y: yLabel, color: P.grey, P, when: (i) => at + 0.15 + i * T.dur.word, out, t });
      M.crowd(ctx, pips, t);
    },
  };
}
