// A number, counted in people. The numeral (large, ink, flush to the reading side) climbs while people step onto the system line one
// by one from the reading side, as many as the number when it is small (up to 12), otherwise ten; the last one has the accent head.
// When the number lands they join hands and the accent runs through them. The label sits under a fine rule; a key word in it is
// underlined in the accent. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > x1 - x0 && size > 110) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minScale: 0.85, where: 'the count label' });
  const top = kit.place(size * 1.1 + 50 + label.height, 680), yNum = top + size * 0.55, yRule = yNum + size * 0.6, yLabel = yRule + 40 + label.lead / 2;
  const keys = M.keySpans(label, { x0, x1, y: yLabel, align: 'start' }, rtl);
  const N = Number.isInteger(S.value) && S.value >= 1 && S.value <= 12 ? S.value : 10, gap = (W - 140) / N, h = Math.min(ground.h, gap * 1.9);
  const xs = Array.from({ length: N }, (_, i) => { const x = 70 + gap * (i + 0.5); return rtl ? W - x : x; });
  const tc0 = at + 0.2, tc1 = at + 1.5, tIn = (i) => tc0 + (tc1 - tc0) * (N === 1 ? 1 : i / (N - 1)) - 0.12;
  const tJ = tc1 + 0.1, runT = [tJ + 0.35, tJ + 0.35 + Math.min(1.0, Math.max(0.5, d - tJ - 0.9))];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = t + clock, w = M.weight(h), join = N > 1 ? span(t, tJ, tJ + 0.35) : 0, figs = [];
      const yL = ground.yL;
      const shoulder0 = xs.map((x) => [x, yL - 14 - h * (0.46 + 0.34 * 0.86)]);
      const arms = shoulder0.slice(1).map((b, i) => M.joined(shoulder0[i], b, h)), reachAt = [0]; arms.forEach((a, i) => reachAt.push(reachAt[i] + M.lengthOf(a)));
      const total = reachAt.at(-1) || 1, runP = span(t, runT[0], runT[1]);
      xs.forEach((x, i) => {
        const p = span(t, tIn(i), tIn(i) + 0.2); if (p <= 0) { figs.push(null); return; }
        const since = t - (runT[0] + (reachAt[i] / total) * (runT[1] - runT[0]));
        ctx.save(); ctx.globalAlpha = Math.min(1, p * 3);
        const skip = join > 0 ? { [rtl ? 'l' : 'r']: i < N - 1, [rtl ? 'r' : 'l']: i > 0 } : null;
        figs.push(M.figure(ctx, P, x, yL - 14 - (1 - M.ease.outCubic(p)) * 40, h, { hop: M.reactHop(since, h), lean: Math.sin(tt * 1.3 + i) * 2, head: i === N - 1 ? 'accent' : 'paper', skipArms: skip }));
        ctx.restore();
      });
      if (join > 0 && figs.every(Boolean)) {
        const path = []; for (let i = 0; i < N - 1; i++) path.push(...M.reach(ctx, P, figs[i].sh, figs[i + 1].sh, h, join, w));
        if (join >= 1 && runP > 0) M.run(ctx, path, runP * M.lengthOf(path), w * 1.15, P.accent);
      }
      const pc = M.ease.outCubic(span(t, tc0, tc1)), v = countValue(0, S.value, pc, (x) => x);
      if (t >= tc0 - 0.1) kit.number(ctx, text(v), { x: rtl ? x1 : x0, y: yNum, size, color: P.ink, align: rtl ? 'right' : 'left', settle: pc });
      const rw = (x1 - x0) * M.ease.inOutCubic(span(t, at + 0.1, at + 0.6));
      ctx.fillStyle = P.ink; ctx.fillRect(rtl ? x1 - rw : x0, yRule, rw, 3);
      keys.forEach((b) => M.underline(ctx, P, b, label.size, span(t, tc1, tc1 + 0.3), rtl));
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.ink, key: P.ink, each: (w, i, box, c) => M.setDown(c, span(t, at + 0.4 + i * 0.08, at + 0.62 + i * 0.08), label.size) });
    },
  };
}
