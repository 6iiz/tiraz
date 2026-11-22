// A number as a measurement. A scan front uncovers the numeral, which rolls to its value in shrinking steps while a classification
// plane rises through the cloud below and the returns under it take the class colour; a hairline ruler with ticks runs from the
// reading: number above, the measured cloud below. The label is a scanned block of its own.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 70, maxW = x1 - x0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 120) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const yNum = kit.place(size + 40 + label.height, 620) + size / 2, yLabel = yNum + size * 0.5 + 24 + label.lead / 2;
  const atLabel = { x0, x1, y: yLabel, align: 'start' };
  const sLab = M.sampleText(kit, label, atLabel, T.step.line); Object.assign(sLab, { x0, x1 });
  const out0 = d - T.dur.out, roll = [at + 0.15, at + 1.5];
  const scanL = M.scanned(sLab, { t0: at + 0.45, sweep: 0.3, land: T.dur.land, out0, outDur: T.dur.out });
  const nTop = yNum - size * 0.62, nH = size * 1.24, xr = kit.rtl ? SAFE.right - 26 : SAFE.left + 26, nx = kit.rtl ? x1 : x0;
  const nw = kit.numberWidth(text(S.value), size, 900, 1);
  const rollP = (t) => M.outC(span(t, roll[0], roll[1])) ** 0.85;
  return {
    duration: d,
    draw(ctx, t) {
      const p = span(t, roll[0], roll[1]), out = span(t, out0, d), live = 1 - M.inC(out);
      ground.draw(ctx, t, { plane: rollP(t) * live });
      // the ruler on the far edge: drops from the numeral's top toward the cloud, ticks every 24 px, the class colour up to the reading
      const rp = M.outC(span(t, at, at + 0.6)) * live, yb = nTop + (1200 - nTop) * rp;
      if (rp > 0) {
        ctx.fillStyle = rgba(pal.light, 0.5); ctx.fillRect(xr - 1, nTop, 2, yb - nTop);
        for (let y = nTop, k = 0; y < yb; y += 24, k++) ctx.fillRect(kit.rtl ? xr - (k % 5 ? 8 : 18) : xr, y, k % 5 ? 8 : 18, 2);
        const ym = nTop + (yb - nTop) * rollP(t); ctx.fillStyle = pal.accent; ctx.fillRect(xr - 2, nTop, 4, ym - nTop);
        ctx.beginPath(); ctx.arc(xr, ym, 8, 0, 6.283); ctx.fill();
      }
      // the numeral, uncovered by a scan front, then rolling
      const fy = nTop + nH * M.outC(span(t, at, at + 0.35));
      if (out < 1) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, nTop - 10, W, fy - nTop + 10); ctx.clip();
        if (out > 0) { ctx.globalAlpha = live; ctx.translate(0, -60 * M.inC(out)); }
        kit.number(ctx, text(countValue(0, S.value, p, (x) => 1 - (1 - x) ** 3)), { x: nx, y: yNum, size, color: pal.light, align: kit.rtl ? 'right' : 'left', settle: p });
        ctx.restore();
        if (fy < nTop + nH) { const fa = kit.rtl ? nx - nw - 24 : nx - 24, fw = nw + 48; ctx.fillStyle = rgba(pal.key, 0.16); ctx.fillRect(fa, fy - 10, fw, 20); ctx.fillStyle = pal.key; ctx.fillRect(fa, fy - 1, fw, 2); }
      }
      scanL.draw(ctx, t, { text: pal.grey, key: pal.key, front: pal.key }, (a, b) => {
        ctx.save(); ctx.beginPath(); ctx.rect(0, a, W, b - a); ctx.clip(); kit.drawText(ctx, label, { ...atLabel, color: pal.grey, key: pal.key }); ctx.restore();
      });
    },
  };
}
