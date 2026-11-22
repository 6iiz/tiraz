// Before and after as two routes between the same two places. The old value settles in grey while the old route winds across the
// terrain the long way round; a stroke strikes the old value and the old route goes slack (grey, dashed). Then the new value comes
// down on an accent callout and the new route is drawn the direct way, lit and flowing.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, rtl = kit.rtl;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const X0 = SAFE.left + 10, X1 = SAFE.right - 10, maxW = X1 - X0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 40, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.lead, weight: 500, maxW, minScale: 0.92, minPx: 44, where: 'the compare label' }) : null;
  const lH = label ? label.height + 14 : 0, top = kit.place(lH + was.height + 30 + now.height, 540);
  const aL = label && { x0: X0, x1: X1, y: top + label.lead / 2, align: 'start' };
  const aW = { x0: X0, x1: X1, y: top + lH + was.lead / 2, align: 'start' }, aN = { x0: X0 + 20, x1: X1 - 20, y: top + lH + was.height + 30 + now.lead / 2, align: 'start' };
  const wb = M.layout(kit, was, aW), wx0 = Math.min(...wb.map((b) => b.x)), wx1 = Math.max(...wb.map((b) => b.x + b.width));
  const nb = M.layout(kit, now, aN), run = { x0: Math.min(...nb.map((b) => b.x)), x1: Math.max(...nb.map((b) => b.x + b.width)), y: aN.y };
  const t0 = clock + Math.max(0, at), P = (x, y) => { const s = ground.pick(x, y, t0); return [s.u, s.v]; };
  const A = P(rtl ? 900 : 180, 1270), B = P(rtl ? 180 : 900, 1140);
  const oldPath = M.spline([A, P(rtl ? 760 : 320, 1420), P(540, 1330), P(rtl ? 420 : 660, 1050), P(rtl ? 300 : 780, 1000), B], 16);
  const newPath = M.spline([A, P(540, 1220), B], 24);
  const out0 = d - T.dur.out, cutT = at + 1.0, nowT = cutT + 0.3;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, out0, d), keep = 1 - M.inC(out), cut = M.outC(span(t, cutT, cutT + 0.3));
      const op = oldPath.map(([u, v]) => ground.at(u, v, 1.5, time)), np = newPath.map(([u, v]) => ground.at(u, v, 1.5, time));
      M.route(ctx, pal, op, span(t, at + 0.15, at + 0.85), time, { glow: false, width: 4, color: cut > 0.5 ? pal.soft : pal.grey, dashed: cut > 0.5, alpha: keep });
      M.route(ctx, pal, np, M.outC(span(t, nowT + 0.1, nowT + 0.6)), time, { width: 6, alpha: keep });
      for (const q of [op[0], op.at(-1)]) { ctx.save(); ctx.globalAlpha = keep * M.outC(span(t, at + 0.1, at + 0.3)); ctx.fillStyle = pal.light; ctx.strokeStyle = pal.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, 11, 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (label) kit.drawText(ctx, label, { ...aL, color: pal.grey, each: M.drop(t, at, 0.04, T.dur.word, out, label.size) });
      kit.drawText(ctx, was, { ...aW, color: pal.grey, key: pal.grey, each: M.drop(t, at + 0.12, 0.05, T.dur.word, out, was.size) });
      const k = M.outC(span(t, cutT - 0.12, cutT + 0.12)) * keep;
      if (k > 0) { const sl = (wx1 - wx0 + 24) * k; ctx.fillStyle = pal.line; ctx.fillRect(rtl ? wx1 + 12 - sl : wx0 - 12, aW.y - 3, sl, 6); }
      M.callout(ctx, pal, run, now.size, now.space * 1.4, span(t, nowT, nowT + 0.3) * keep);
      const cal = span(t, nowT, nowT + 0.3);
      kit.drawText(ctx, now, { ...aN, color: cal > 0.5 && out < 0.5 ? pal.onAccent : pal.dark, key: cal > 0.5 && out < 0.5 ? pal.onAccent : pal.dark, each: M.drop(t, nowT + 0.05, 0.05, T.dur.word, out, now.size) });
    },
  };
}
