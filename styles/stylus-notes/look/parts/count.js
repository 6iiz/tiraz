// A number inked on the glass: the stylus writes a giant figure from the reading side while its value rolls up, underlines it with one
// glowing wavy accent stroke, then writes the label under it. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, rgba, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW, minScale: 1, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 800, 1) > maxW && size > 120) size -= 8;
  const nw = kit.numberWidth(text(S.value), size, 800, 1), yNum = 590, yUnder = yNum + size * 0.5, yLabel = yUnder + 60 + label.lead / 2;
  const nbox = { x: rtl ? x1 - nw : x0, y: yNum, width: nw };
  const write = { t0: at + 0.05, t1: at + 0.75 };
  const und = { S: M.underline(nbox.x - 10, nbox.x + nw + 10, yUnder, 9, 12), t0: write.t1 + 0.08 }; und.t1 = und.t0 + T.dur.mark;
  if (!rtl) und.S = M.stroke([...und.S.pts].reverse());
  const lw = M.layout(kit, label, { x0, x1, y: yLabel }), ls = M.schedule(lw, und.t1 + 0.08, Math.min(1.0, 0.2 + 0.1 * lw.length));
  const R = M.runs(lw), loops = R.map((r, i) => ({ S: M.lasso(r, 51 + i, rtl), t0: ls.at(-1).t1 + 0.06 + i * 0.36 }));
  loops.forEach((l) => { l.t1 = l.t0 + T.dur.lasso; });
  const events = [{ ...write, word: { box: nbox, size, rtl } }, und, ...lw.map((w, i) => ({ ...ls[i], word: { box: w, size: label.size, rtl } })), ...loops];
  const glow = rgba(pal.light, 0.45);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, write.t0, write.t1);
      if (p > 0) {
        ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = size * 0.1;
        const head = rtl ? nbox.x + nw + 6 - (nw + 12) * p : nbox.x - 6 + (nw + 12) * p;
        ctx.beginPath(); if (rtl) ctx.rect(head, yNum - size, W, size * 2); else ctx.rect(0, yNum - size, head, size * 2); ctx.clip();
        const q = M.E(span(t, write.t0, write.t1 + 0.1));
        kit.number(ctx, text(countValue(0, S.value, q, (x) => x)), { x: rtl ? x1 : x0, y: yNum, size, weight: 800, color: pal.light, align: rtl ? 'right' : 'left', settle: q });
        ctx.restore();
      }
      M.ink(ctx, und.S, span(t, und.t0, und.t1), T.pen.mark, pal.key, pal.accent);
      for (const l of loops) M.ink(ctx, l.S, span(t, l.t0, l.t1), T.pen.lasso, pal.key, pal.accent);
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.grey, key: pal.key,
        each: (w, i, box, c) => M.inkWord(c, span(t, ls[i].t0, ls[i].t1), box, label.size, rtl, glow) });
      const pt = M.tipPath(events, t); if (pt) M.tip(ctx, pt, pal, pt.alpha ?? 1);
    },
  };
}
