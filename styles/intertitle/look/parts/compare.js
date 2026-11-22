// Before and after on one intertitle card: the label is exposed small over an ornament rule, the old value is exposed in the dim silver,
// a strike is scratched across it from the reading side and it sinks a little further into the print; then a lozenge drops and the new
// value is exposed large, in full silver, with the flourish under it. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, C = T.card;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = C.x0 + C.padX, x1 = C.x1 - C.padX, cx = (C.x0 + C.x1) / 2;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const was = kit.fit(asText(S.was), { size: Math.round(T.size.compare * 0.8), weight: 600, maxW: x1 - x0, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare, weight: 800, maxW: x1 - x0, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, single: true, where: 'the compare label' }) : null;
  const head = label ? label.lead + 56 : 0, mid = 84;
  const h = C.padY * 2 + head + was.height + mid + now.height, top = kit.place(h, 720);
  const yLabel = top + C.padY + (label ? label.lead / 2 : 0), yRule = yLabel + (label ? label.lead / 2 + 22 : 0);
  const yWas = top + C.padY + head + was.lead / 2, yMid = top + C.padY + head + was.height + mid / 2, yNow = top + C.padY + head + was.height + mid + now.lead / 2;
  const sunk = mix(P.dim, P.card, 0.25), tWas = 0.45, tCut = tWas + 0.55, tNow = tCut + 0.5;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const w = ground.weave(t), tc = M.crank(t - at);
      ctx.save(); ctx.translate(w.x, w.y);
      M.card(ctx, C.x0, top, C.x1, top + h, span(tc, 0, 0.34), P, C.notch);
      if (label) {
        kit.drawText(ctx, label, { x0, x1, y: yLabel, color: P.dim, each: (wd, i, box, c) => M.expose(c, span(tc, 0.2, 0.45), label.size) });
        M.rule(ctx, cx, yRule, 380, span(tc, 0.3, 0.6), P);
      }
      const cut = span(tc, tCut, tCut + 0.3);
      kit.drawText(ctx, was, { x0, x1, y: yWas, color: cut >= 1 ? sunk : P.dim, key: cut >= 1 ? sunk : P.dim,
        each: (wd, i, box, c) => M.expose(c, span(tc, tWas, tWas + 0.25), was.size) });
      for (let r = 0; r < was.rows.length; r++) M.strike(ctx, cx - was.rows[r].width / 2, cx + was.rows[r].width / 2, yWas + r * was.lead, cut, P, kit.rtl);
      const pd = span(tc, tNow - 0.25, tNow);
      if (pd > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, pd * 2); M.diamond(ctx, cx, yMid - 14 + pd * 14, 10, P.flourish); M.diamond(ctx, cx, yMid - 14 + pd * 14, 3.5, P.card); ctx.restore(); }
      const pf = span(tc, tNow + 0.3, tNow + 0.65);
      kit.drawText(ctx, now, { x0, x1, y: yNow, color: P.silver, key: P.key,
        each: (wd, i, box, c) => M.expose(c, span(tc, tNow, tNow + 0.25), now.size) });
      if (pf > 0) { const r = now.rows.at(-1); M.flourish(ctx, cx - r.width / 2, cx + r.width / 2, yNow + (now.rows.length - 1) * now.lead + now.size * 0.8, pf, P, kit.rtl); }
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
