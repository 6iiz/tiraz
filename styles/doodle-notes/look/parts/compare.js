// Before and after in the notes: the old value is written in a grey-shaded box and crossed out with an X; a fat outlined arrow is drawn
// down from it and shaded; then a second box is drawn, filled with highlighter, and the new value is written in it. Both stay on the page.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 180, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.label, maxW, single: true, where: 'the compare label' }) : null;
  const bh = was.size * 1.75, drop = 170, block = (label ? label.lead + 30 : 0) + bh * 2 + drop, top = kit.place(block, 660);
  const yLabel = top + (label ? label.lead / 2 : 0), yW = top + (label ? label.lead + 30 : 0) + bh / 2, yN = yW + bh + drop;
  const ww = Math.max(was.width, now.width) + 140, bx0 = W / 2 - ww / 2, bx1 = W / 2 + ww / 2;
  const boxW = M.roundBox(301, bx0, yW - bh / 2, bx1, yW + bh / 2, 26, rtl), boxN = M.roundBox(302, bx0, yN - bh / 2, bx1, yN + bh / 2, 26, rtl);
  const xa = [...M.line(303, W / 2 + was.width / 2 + 20, yW - was.size * 0.45, W / 2 - was.width / 2 - 20, yW + was.size * 0.5, 3)];
  const xb = [...M.line(304, W / 2 + was.width / 2 + 20, yW + was.size * 0.5, W / 2 - was.width / 2 - 20, yW - was.size * 0.4, 3)];
  const A = M.fatArrow(305, W / 2, yW + bh / 2 + 22, W / 2, yN - bh / 2 - 18, 46, 96);
  const ab = [W / 2 - 60, yW + bh / 2 + 18, W / 2 + 60, yN - bh / 2 - 14];
  const T0 = at + 0.05, tB = T0 + 0.25, tW = tB + 0.25, tX = tW + 0.45, tA = tX + 0.3, tN = tA + 0.35, tV = tN + 0.35;
  const sLabel = label ? M.schedule(label, T0, T0 + 0.3, 0.04) : [], sWas = M.schedule(was, tW, tW + 0.38, 0.05), sNow = M.schedule(now, tV, tV + 0.42, 0.05);
  const rect = (y) => (c) => { c.beginPath(); c.roundRect(bx0, y - bh / 2, ww, bh, 26); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); ctx.translate(0, ground.drift(t));
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, color: P.note, key: P.note, each: M.writer(t, sLabel, label.size) });
      M.shade(ctx, span(t, tB + 0.15, tB + 0.3), rect(yW), [bx0, yW - bh / 2, bx1, yW + bh / 2], P.grey, rtl, 31);
      M.trace(ctx, boxW, span(t, tB, tB + 0.22), T.pen.fine, P.ink);
      kit.drawText(ctx, was, { x0, x1, y: yW, color: P.note, key: P.note, each: M.writer(t, sWas, was.size) });
      M.trace(ctx, xa, span(t, tX, tX + 0.12), T.pen.bold, P.ink); M.trace(ctx, xb, span(t, tX + 0.14, tX + 0.26), T.pen.bold, P.ink);
      M.shade(ctx, span(t, tA + 0.18, tA + 0.32), A.poly, ab, P.greyDeep, rtl, 33);
      M.trace(ctx, A.outline, span(t, tA, tA + 0.24), T.pen.fine, P.ink);
      M.shade(ctx, span(t, tN + 0.12, tN + 0.32), rect(yN), [bx0, yN - bh / 2, bx1, yN + bh / 2], P.hl, rtl, 35);
      M.trace(ctx, boxN, span(t, tN, tN + 0.22), T.pen.bold, P.ink);
      kit.drawText(ctx, now, { x0, x1, y: yN, color: P.ink, key: P.ink, each: M.writer(t, sNow, now.size) });
      ctx.restore();
    },
  };
}
