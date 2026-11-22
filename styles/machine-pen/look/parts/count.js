// A number, plotted: the ink pen rasters the numeral in many passes (a big figure takes the machine a moment), the accent pen hatches
// a tone bar under it, then the pen rules a scale with one tick per unit (up to twenty) and the grey pen rasters the label.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, SAFE, clamp } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const str = (S.prefix ?? '') + kit.fmt(S.value, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(str, size, 900, 1) > maxW && size > 120) size -= 8;
  const nw = kit.numberWidth(str, size, 900, 1);
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const yNum = 580, nx = rtl ? x1 - nw : x0;
  const numBox = { x: nx, y: yNum, width: nw, size };
  const yBar = yNum + size * 0.5, yScale = yBar + 70, yLabel = yScale + 60 + label.lead / 2;
  const jobs = [];
  const num = M.wordJob(numBox, 'ink', T, rtl, 1, 16); num.dur = 0.42; jobs.push(num);
  const bar = M.hatchJob({ x: nx, y: yBar, w: nw, h: 30 }, 'accent', T, rtl, 9); jobs.push(bar);
  const ticks = clamp(Math.round(Math.abs(S.value)), 2, 20), sa = rtl ? x1 : x0, sb = rtl ? x0 : x1, pts = [[sa, yScale], [sb, yScale]], lifts = [];
  for (let i = 0; i <= ticks; i++) { const x = sa + (sb - sa) * (i / ticks), h = i % 5 === 0 || i === ticks ? 26 : 14; lifts.push(pts.length); pts.push([x, yScale - h], [x, yScale]); }
  const scale = M.strokeJob(pts, 'ink', T, { lifts }); jobs.push(scale);
  const lb = M.boxes(label, x0, x1, yLabel, 'start', rtl), lj = lb.map((b) => M.wordJob(b, 'grey', T, rtl, 0.8)); jobs.push(...lj);
  const P = M.program(jobs, { start: at, park: ground.park, by: at < 0 ? -0.3 : at + 1.4 });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      bar.draw(ctx, P.q(bar, t), K.accent, 3);
      scale.draw(ctx, P.q(scale, t), K.ink, 3);
      const q = P.q(num, t);
      if (q > 0) { ctx.save(); M.rasterClip(ctx, num, q); kit.number(ctx, str, { x: nx, y: yNum, size, color: K.ink, align: 'left', settle: 1 }); ctx.restore(); }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: K.grey,
        each: (w, i, box, c) => (M.rasterClip(c, lj[i], P.q(lj[i], t)) ? undefined : false) });
      ground.machine(ctx, P.pen(t));
    },
  };
}
