// Before and after on the wall: the old value is written in graphite, then the eraser wipes it in the reading direction and leaves its
// ghost; an arrow is drawn in the accent from the ghost down to a card that lands with the new value, held by an accent magnet and
// underlined twice in the accent, the decision. The label is written small above. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 170, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 20, single: true, where: 'the compare label' }) : null;
  const cw = now.width + 150, ch = now.height + 70, lh = label ? label.lead + 20 : 0;
  const top = kit.place(lh + was.height + 170 + ch, 660);
  const yWas = top + lh + was.lead / 2, yCard = top + lh + was.height + 170, cx = W / 2 - cw / 2;
  const lt = label ? M.writeTimes(label, at, T.write.speed) : null, wt = M.writeTimes(was, at + (label ? 0.3 : 0.05), T.write.speed);
  const tWipe = wt.end + 0.2, tArrow = tWipe + 0.45, tNow = tArrow + 0.25;
  const ax = rtl ? SAFE.right - 120 : SAFE.left + 120, arrowFrom = [ax, yWas + was.height / 2 + 10], arrowTo = [rtl ? cx + cw + 30 : cx - 30, yCard + ch / 2];
  const arrow = M.line(arrowFrom, [ax + (rtl ? 1 : -1) * 10, yCard + ch / 2 - 10], 7, 3).concat(M.line([ax + (rtl ? 1 : -1) * 10, yCard + ch / 2 - 10], arrowTo, 8, 2));
  const ah = M.head(arrow.at(-2), arrowTo, 26);
  const yU = yCard + ch / 2 + now.height / 2 + 2, nb = [W / 2 - now.width / 2 - 10, W / 2 + now.width / 2 + 10];
  const u1 = M.line([rtl ? nb[1] : nb[0], yU], [rtl ? nb[0] : nb[1], yU + 4], 61, 2), u2 = M.line([rtl ? nb[1] - 20 : nb[0] + 20, yU + 16], [rtl ? nb[0] + 30 : nb[1] - 30, yU + 18], 62, 2);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - 0.42, d), keep = 1 - q;
      ctx.save(); ctx.globalAlpha = keep;
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: top + label.lead / 2, align: 'start', color: P.soft,
        each: (w, i, box, cc) => M.write(cc, t, lt[i], box, label.size, rtl, P.soft, 10 + i) });
      const we = span(t, tWipe, tWipe + 0.4), ex = M.eraserX(we, SAFE.left - 40, SAFE.right + 40, rtl);
      const wasText = (alpha, decor) => kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'start', color: P.ink, key: P.ink, decor,
        each: (w, i, box, cc) => { cc.globalAlpha *= alpha; return M.write(cc, t, wt[i], box, was.size, rtl, P.ink, 40 + i); } });
      ctx.save(); ctx.beginPath(); rtl ? ctx.rect(0, 0, ex, H) : ctx.rect(ex, 0, W - ex, H); ctx.clip(); wasText(1, false); ctx.restore();
      if (we > 0) { ctx.save(); ctx.beginPath(); rtl ? ctx.rect(ex, 0, W - ex, H) : ctx.rect(0, 0, ex, H); ctx.clip(); wasText(0.12, false); ctx.restore(); }
      M.eraser(ctx, we, SAFE.left - 40, SAFE.right + 40, yWas + (was.rows.length - 1) * was.lead / 2, was.height + 30, P, rtl);
      M.stroke(ctx, arrow, span(t, tArrow, tArrow + 0.3), 6, P.accent);
      M.stroke(ctx, ah, span(t, tArrow + 0.28, tArrow + 0.38), 6, P.accent);
      ctx.restore();
      M.card(ctx, cx, yCard, cw, ch, P, span(t, tNow, tNow + 0.35), q, rtl ? -0.012 : 0.012, () => {
        kit.drawText(ctx, now, { x0: cx, x1: cx + cw, y: yCard + 35 + now.lead / 2, color: P.ink, key: P.ink });
        M.magnet(ctx, rtl ? cx + cw - 26 : cx + 26, yCard + 12, 16, P.accent, span(t, tNow + 0.25, tNow + 0.4));
        M.stroke(ctx, u1, span(t, tNow + 0.45, tNow + 0.7), 7, P.accent); M.stroke(ctx, u2, span(t, tNow + 0.65, tNow + 0.85), 6, P.accent);
      });
    },
  };
}
