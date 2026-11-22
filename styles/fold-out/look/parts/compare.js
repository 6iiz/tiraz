// Before and after: the old value pops up on a plain paper card; then it folds back halfway, leaning away into the page's shade, and the
// new value pops up in front of it on an accent card, a little lower and larger. The label sits on a small card above.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = T.textW - 100;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, minScale: 0.8, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: T.textW - 60, minScale: 0.9, where: 'the compare label' }) : null;
  const lw = label ? Math.min(W - 90, label.width + 90) : 0, lh = label ? label.height + 30 : 0;
  const ww = Math.min(W - 90, Math.max(was.width, now.width) + 130), wh = was.height + 50, nh = now.height + 60;
  const block = (label ? lh + 34 : 0) + wh + 26 + nh, top = kit.place(block, 700);
  const lBase = top + lh, wBase = top + (label ? lh + 34 : 0) + wh, nBase = wBase + 26 + nh;
  const LC = label ? M.card(lw, lh, P.card, P, 33) : null, WC = M.card(ww, wh, P.card, P, 35), NC = M.card(ww, nh, P.accent, P, 37);
  const backT = at + 0.95, nowT = at + 1.25;
  const out = (t, k) => M.fold(span(t, d - T.dur.out + k * 0.04, d - T.dur.out + k * 0.04 + 0.24));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) M.stand(ctx, LC, W / 2, lBase, M.pop(span(t, at, at + 0.4)) * out(t, 0),
        (c) => kit.drawText(c, label, { x0: W / 2 - lw / 2, x1: W / 2 + lw / 2, y: lBase - lh / 2, align: 'center', color: P.soft }));
      const back = M.O(span(t, backT, backT + 0.35)), sw = M.pop(span(t, at + 0.15, at + 0.55)) * (1 - 0.42 * back) * out(t, 1);
      M.stand(ctx, WC, W / 2, wBase, sw, (c) => {
        kit.drawText(c, was, { x0: W / 2 - ww / 2, x1: W / 2 + ww / 2, y: wBase - wh / 2, align: 'center', color: P.dark, key: P.dark });
        if (back > 0) { c.fillStyle = `rgba(0,0,0,${0.18 * back})`; c.fillRect(W / 2 - ww / 2 - 10, wBase - wh - 10, ww + 20, wh + 20); }
      });
      const sn = M.pop(span(t, nowT, nowT + 0.45)) * out(t, 2);
      M.stand(ctx, NC, W / 2, nBase, sn, (c) => kit.drawText(c, now, { x0: W / 2 - ww / 2, x1: W / 2 + ww / 2, y: nBase - nh / 2, align: 'center', color: P.on, key: P.on }));
    },
  };
}
