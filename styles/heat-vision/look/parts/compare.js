// Before and after as two readings of the same box: the old value is warm at first, then cools down the ramp until it is a dim trace, and
// a cold line runs through it; the new value warms up under it and lands inside the isotherm, with the hot-spot tracker closing on it.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad, maxW = x1 - x0 - 40;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the compare label' }) : null;
  const gapV = 60, hBox = (label ? label.height + 20 : 0) + was.height + gapV + now.height + T.pad * 2, top = kit.place(hBox, 700);
  const yLabel = top + T.pad + (label ? label.lead / 2 : 0), yWas = top + T.pad + (label ? label.height + 20 : 0) + was.lead / 2;
  const yNow = yWas - was.lead / 2 + was.height + gapV + now.lead / 2;
  const cool = at + 0.75, nowT = at + 1.25, out0 = d - T.dur.out;
  const runs = M.keyRuns({ ...now, rows: now.rows.map((r) => ({ ...r, words: r.words.map((w) => ({ ...w, key: true })) })) }, { x0, x1, y: yNow, align: 'start', rtl });
  return {
    duration: d,
    draw(ctx, t) {
      const live = 1 - span(t, out0, d);
      const pn = M.heat(t, nowT + 0.15, 0.3, out0, T.dur.out);
      ground.draw(ctx, t, [{ x: W / 2, y: yNow, r: 420, k: 0.45 * pn }, { x: W / 2, y: yWas, r: 380, k: 0.4 * (1 - span(t, cool, cool + 0.6)) * span(t, at, at + 0.4) }]);
      M.areaBox(ctx, pal, SAFE.left, top, SAFE.right - SAFE.left, hBox, span(t, at, at + 0.25) * live, 'Δ', mono);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.dim,
        each: (w, i, b, c) => M.warm(c, M.heat(t, at + i * T.dur.stagger, T.dur.rise, out0, T.dur.out), pal, pal.dim) });
      // the old value: warms in, then cools to a dim trace (it stays readable) and a cold line runs through it
      const kc = span(t, cool, cool + 0.5), kw = M.heat(t, at + 0.15, T.dur.rise, out0, T.dur.out);
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: pal.hot, key: pal.hot, each: (w, i, b, c) => {
        if (kw <= 0) return false;
        c.globalAlpha = Math.min(1, kw * 3); if (kw < 1) c.filter = `blur(${((1 - kw) * 7).toFixed(1)}px)`;
        return kc > 0 ? pal.css(1 - 0.38 * M.outC(kc)) : (kw < 1 ? pal.css(0.45 + 0.55 * kw) : pal.hot);
      } });
      const ls = M.outC(span(t, cool + 0.2, cool + 0.5)) * live;
      if (ls > 0) { const w = (was.width + 30) * ls; ctx.fillStyle = pal.hot; ctx.fillRect(rtl ? x1 + 15 - w : x0 - 15, yWas - 3, w, 6); }
      // the new value: inside the isotherm
      runs.forEach((r) => { M.isotherm(ctx, pal, r, pn, rtl); M.tracker(ctx, pal, r, M.heat(t, nowT + 0.35, 0.3, out0, T.dur.out), rtl); });
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.onAccent, key: pal.onAccent,
        each: (w, i, b, c) => M.warm(c, M.heat(t, nowT + i * T.dur.stagger, T.dur.rise, out0, T.dur.out), pal, pal.onAccent) });
    },
  };
}
