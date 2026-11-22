// Before and after as a revision on the print: the old value develops in white, then fades back toward the coating as if it had
// been washed too long, and a drafting line strikes it through. A drawn arrow comes down from it, and the new value develops below
// on a paper mask, set in the print colour: the one thing on the sheet left white by the sun.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0 - 60;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 700, maxW, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: 500, maxW, minScale: 0.9, where: 'the compare label' }) : null;
  const arrowH = 150, block = (label ? label.height + 40 : 0) + was.lead + arrowH + now.lead;
  const top = kit.place(block, 720), yLabel = top + (label ? label.lead / 2 : 0);
  const yWas = top + (label ? label.height + 40 : 0) + was.lead / 2, yA0 = yWas + was.lead / 2 + 6, yA1 = yA0 + arrowH - 24, yNow = yA1 + 24 + now.lead / 2;
  const cx = W / 2, nowW = now.width, wasW = was.width;
  const fadeT = at + 0.75, nowT = at + 1.15;
  const out = (t) => M.WASH(span(t, d - T.dur.out, d));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = 1 - out(t);
      const pl = M.DEV(span(t, at, at + T.dur.dev)) * k;
      if (label && pl > 0) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: pal.soft, each: (w, i, b, c) => { c.translate(0, (1 - pl) * 8); return M.tone(pal, pl, pal.soft); } });
      const pw = M.DEV(span(t, at + 0.12, at + 0.12 + T.dur.dev)) * k, pf = M.DEV(span(t, fadeT, fadeT + 0.4));
      if (pw > 0) {
        const to = M.tone(pal, 1 - pf * 0.6), col = M.tone(pal, pw, to);
        kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'center', color: col, key: col, each: (w, i, b, c) => { c.translate(0, (1 - pw) * 8); } });
        const ps = span(t, fadeT + 0.1, fadeT + 0.35) * k;
        if (ps > 0) M.seg(ctx, cx + wasW / 2 + 24, yWas, cx + wasW / 2 + 24 - (wasW + 48) * ps, yWas, 1, pal.white, 3);
      }
      const pa = span(t, fadeT + 0.2, nowT) * k;
      if (pa > 0) { M.seg(ctx, cx, yA0, cx, yA1, pa, pal.soft, 2); if (pa >= 1) M.head(ctx, cx, yA1 + 22, Math.PI / 2, pal.soft, 24); }
      const pn = M.DEV(span(t, nowT, nowT + T.dur.dev + 0.1)) * k;
      if (pn > 0) {
        M.mask(ctx, pal, cx - nowW / 2 - 30, yNow - now.size * 0.66, cx + nowW / 2 + 30, yNow + now.size * 0.7, pn, 5);
        kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'center', color: pal.coat, key: pal.coat, each: (w, i, b, c) => { c.translate(0, (1 - pn) * 8); } });
      }
    },
  };
}
