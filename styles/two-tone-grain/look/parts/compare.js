// Before and after as two 1-bit windows. The first comes up with the label as its title and the old value set inside; then a paper
// bar strikes the value and the whole window is screened to half dots, the "disabled" state of a 1-bit interface. The second window
// comes up lower and overlapping, its body a field of the brand's accent with the new value set in it behind the block cursor.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, D = M.DOT;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x = SAFE.left, w = SAFE.right - SAFE.left, pad = 40, w1 = M.snap(w - 120), w2 = M.snap(w - 60);
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: w1 - pad * 2, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.title, weight: 600, maxW: w1 - 200, single: true, where: 'the compare label' }) : null;
  const bar1 = label ? M.snap(label.lead + 16) : 48, h1 = M.snap(bar1 + pad * 2 + was.height), h2 = M.snap(48 + pad * 2 + now.height);
  const total = h1 + h2 - 40, y1 = M.snap(Math.min(kit.place(total, 700), T.floor - total)), y2 = M.snap(y1 + h1 - 40);
  const x1 = M.snap(kit.rtl ? x + w - w1 : x), x2 = M.snap(kit.rtl ? x : x + w - w2);
  const yWas = y1 + bar1 + pad + was.lead / 2, yNow = y2 + 48 + pad + now.lead / 2;
  const tCut = at + 0.8, tOff = at + 1.0, tNow = at + 1.2;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = M.step(t);
      M.dissolve(ctx, span(ts, at, at + T.dur.open), [x1, y1, w1 + 16, h1 + 16], (c) => M.plate(c, P, x1, y1, w1, h1, { bar: bar1, gapW: label ? label.width : 0,
        title: label && ((cx, cy) => kit.drawText(c, label, { x0: cx - label.width / 2 - 4, x1: cx + label.width / 2 + 4, y: cy, color: P.paper, key: P.paper })) }));
      if (ts >= at + T.dur.open) {
        kit.drawText(ctx, was, { x0: x1 + pad, x1: x1 + w1 - pad, y: yWas, align: 'center', color: P.paper, key: P.paper, each: M.typed(ts, at + T.dur.open, T.dur.word, P, was.size, false) });
        const ys = M.snap(yWas + (was.rows.length - 1) * was.lead / 2);
        const sp = span(ts, tCut, tCut + 0.2), sw = (was.width + 60) * sp;
        if (sp > 0) { ctx.fillStyle = P.paper; ctx.fillRect(M.snap(x1 + w1 / 2 + (kit.rtl ? (was.width + 60) / 2 - sw : -(was.width + 60) / 2)), ys - 2 * D, M.snap(sw), 3 * D); }
        if (ts >= tOff) M.screen(ctx, x1 + D, y1 + bar1 + D, w1 - 2 * D, h1 - bar1 - 2 * D, P.ink, 20);
      }
      M.dissolve(ctx, span(ts, tNow, tNow + T.dur.open * 0.7), [x2, y2, w2 + 16, h2 + 16], (c) => {
        M.plate(c, P, x2, y2, w2, h2, { bar: 48 });
        c.fillStyle = P.accent; c.fillRect(x2 + 3 * D, y2 + 48 + 3 * D, w2 - 6 * D, h2 - 48 - 6 * D);
      });
      if (ts >= tNow + T.dur.open * 0.7) kit.drawText(ctx, now, { x0: x2 + pad, x1: x2 + w2 - pad, y: yNow, align: 'center', color: P.onAccent, key: P.onAccent,
        each: M.typed(ts, tNow + T.dur.open * 0.7, T.dur.word, P, now.size, false) });
    },
  };
}
