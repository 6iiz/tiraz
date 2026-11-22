// A number as a reading: the measuring box holds a giant numeral that heats up as it counts (its colour climbs the brand's ramp with the
// value), beside a tall colour scale whose pointer rises with it; the picture around the box warms too. The label warms in under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const barW = 26, x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad, room = x1 - x0 - barW - 50;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 120) size -= 8;
  const hBox = size * 1.15 + 40 + label.height + T.pad * 2, top = kit.place(hBox, 700);
  const yNum = top + T.pad + size * 0.6, yLabel = yNum + size * 0.55 + 40 + label.lead / 2;
  const barX = rtl ? x0 : x1 - barW, barY0 = yNum - size * 0.5, barH = size;
  const nx = rtl ? x1 : x0 + 0, cool0 = d - T.dur.out;
  const lut = pal.lut;
  return {
    duration: d,
    draw(ctx, t) {
      const live = 1 - span(t, cool0, d), p = span(t, at + 0.1, at + 1.5), e = M.outC(p);
      ground.draw(ctx, t, [{ x: W / 2, y: yNum, r: 300 + 300 * e, k: 0.5 * e * live }]);
      M.areaBox(ctx, pal, SAFE.left, top, SAFE.right - SAFE.left, hBox, span(t, at, at + 0.25) * live, 'SP1', mono);
      // the scale: drawn from cold (bottom) to hot (top); the pointer rides at the current warmth
      const show = span(t, at, at + 0.3) * live;
      if (show > 0) {
        ctx.save(); ctx.globalAlpha = show;
        for (let i = 0; i < barH; i += 4) { const c = lut[Math.round(255 * (1 - i / barH))]; ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fillRect(barX, barY0 + i, barW, 4); }
        const py = barY0 + barH * (1 - e);
        ctx.fillStyle = pal.hot; ctx.beginPath();
        if (rtl) { ctx.moveTo(barX + barW + 6, py); ctx.lineTo(barX + barW + 26, py - 12); ctx.lineTo(barX + barW + 26, py + 12); }
        else { ctx.moveTo(barX - 6, py); ctx.lineTo(barX - 26, py - 12); ctx.lineTo(barX - 26, py + 12); }
        ctx.fill(); ctx.fillRect(barX - 4, py - 1.5, barW + 8, 3);
        ctx.restore();
      }
      const k = M.heat(t, at + 0.05, 0.3, cool0, T.dur.out);
      if (k > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, k * 3); if (k < 1) ctx.filter = `blur(${((1 - k) * 8).toFixed(1)}px)`;
        kit.number(ctx, text(countValue(0, S.value, p)), { x: nx, y: yNum, size, color: live < 1 ? pal.css(0.45 + 0.55 * live) : pal.css(0.5 + 0.5 * e), align: rtl ? 'right' : 'left', settle: p });
        ctx.restore();
      }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.hot,
        each: (w, i, b, c) => M.warm(c, M.heat(t, at + 0.45 + i * T.dur.stagger, T.dur.rise, cool0, T.dur.out), pal, pal.hot) });
    },
  };
}
