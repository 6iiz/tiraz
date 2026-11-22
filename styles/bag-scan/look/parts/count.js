// A number on the belt: a case is pulled in and stops; inside it the numeral is the densest thing in the picture (the darker brand
// colour), and it counts up while the operator draws a measuring line under it, end ticks first. The label sits under the line.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > x1 - x0 && size > 120) size -= 8;
  const wNum = kit.numberWidth(text(S.value), size, 900, 1);
  const hBox = size * 1.1 + 50 + label.height + T.pad * 2, top = kit.place(hBox, 720);
  const yNum = top + T.pad + size * 0.55, yRule = yNum + size * 0.55 + 10, yLabel = yRule + 40 + label.lead / 2;
  const box = { x: SAFE.left, y: top, w: SAFE.right - SAFE.left, h: hBox };
  const shell = M.bag(box.w, box.h, pal, 2);
  const tStop = at + T.dur.belt, out0 = d - T.dur.out;
  const nx = rtl ? x1 : x0, rx0 = rtl ? x1 - wNum : x0, rx1 = rtl ? x1 : x0 + wNum;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx);
      const off = M.belt(t, at, T.dur.belt, out0, W, ground.dir), running = Math.min(1, Math.abs(off) / 60);
      ctx.save(); ctx.beginPath();
      ctx.rect(rtl ? 0 : ground.sensorX, ground.top, rtl ? ground.sensorX : W - ground.sensorX, ground.bottomY - ground.top); ctx.clip();
      ground.items(ctx, off); ctx.translate(off, 0);
      ctx.drawImage(shell.cv, box.x - shell.pad, box.y - shell.pad);
      const p = span(t, tStop - 0.1, tStop + 1.1);
      kit.number(ctx, text(countValue(0, S.value, p)), { x: nx, y: yNum, size, color: pal.ink, align: rtl ? 'right' : 'left', settle: p, decor: Math.abs(off) > 1 });
      // the measuring line: two end ticks, then the line between them, drawn from the reading side
      const pt = M.outC(span(t, tStop, tStop + 0.2)), pl = M.outC(span(t, tStop + 0.15, tStop + 1.1));
      if (pt > 0) {
        ctx.fillStyle = pal.mixed;
        ctx.fillRect(rx0 - 2, yRule - 16 * pt, 4, 32 * pt); ctx.fillRect(rx1 - 2, yRule - 16 * pt, 4, 32 * pt);
        const w = (rx1 - rx0) * pl; ctx.fillRect(rtl ? rx1 - w : rx0, yRule - 2, w, 4);
      }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', decor: Math.abs(off) > 1, color: pal.soft });
      ctx.restore();
      ground.sensor(ctx, running);
    },
  };
}
