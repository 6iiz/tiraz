// Before and after in the wind. The old value is carried in and settles; then a gust crosses it: a single dark thread is drawn
// through it from upwind and it fades to a pale ink, still readable. The new value is carried in below, in the key ink, with the
// accent gust under it. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: x1 - x0, single: true, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, minPx: T.minPx, where: 'the compare label' }) : null;
  const lH = label ? label.height + 40 : 0, gap = 80, top = kit.place(lH + was.lead + gap + now.lead, 720);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lH + was.lead / 2, yNow = yWas + was.lead / 2 + gap + now.lead / 2;
  const LL = label && M.layout(label, { x0, x1, y: yLabel }, rtl), LW = M.layout(was, { x0, x1, y: yWas }, rtl), LN = M.layout(now, { x0, x1, y: yNow }, rtl);
  const TH = ground.threads([...(LL ? LL.rows.map((r) => M.calm(r, label.size)) : []), M.calm(LW.rows[0], was.size), M.calm(LN.rows[0], now.size)], 41);
  const cutT = at + 0.95, nowT = at + 1.3, out0 = d - T.dur.out;
  const wr = LW.rows[0], nr = LN.rows[0];
  return {
    duration: d,
    draw(ctx, t) {
      const out = span(t, out0, d), cut = span(t, cutT, cutT + 0.35);
      ground.draw(ctx, t, TH, { gusts: [{ cx: (nr.x0 + nr.x1) / 2, cy: nr.y, a: (nr.x1 - nr.x0) / 2 + 160, b: now.size * 1.3, k: span(t, nowT + 0.3, nowT + 0.8) * (1 - out) }] });
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.lead,
        each: (w, i, box, c) => { const t0 = at + i * 0.06; return M.blow(c, span(t, t0, t0 + T.dur.in), out, rtl, T.drift); } });
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: pal.ink, key: pal.ink,
        each: (w, i, box, c) => { const t0 = at + 0.15 + i * 0.08; if (M.blow(c, span(t, t0, t0 + T.dur.in), out, rtl, T.drift) === false) return false; if (cut > 0) return M.S(cut) > 0.5 ? pal.ghost : undefined; } });
      if (cut > 0 && out < 1) {                                       // the crossing thread, drawn on from upwind, tapering
        const a = rtl ? wr.x1 + 30 : wr.x0 - 30, b = rtl ? wr.x0 - 30 : wr.x1 + 30, e = M.S(cut), n = 30;
        ctx.save(); ctx.globalAlpha = 1 - M.I(out); ctx.strokeStyle = pal.ink; ctx.lineCap = 'round'; ctx.lineWidth = 3.5; ctx.beginPath();
        for (let i = 0; i <= n * e; i++) { const s = i / n, x = a + (b - a) * s, y = yWas + 4 + Math.sin(s * Math.PI * 2) * 7; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.restore();
      }
      M.ribbon(ctx, nr.x0, nr.x1, yNow + now.size * 0.66, span(t, nowT + 0.3, nowT + 0.3 + T.dur.ribbon), out, pal.gust, rtl, 12);
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.key, key: pal.key,
        each: (w, i, box, c) => { const t0 = nowT + i * 0.08; return M.blow(c, span(t, t0, t0 + T.dur.in), out, rtl, T.drift); } });
    },
  };
}
