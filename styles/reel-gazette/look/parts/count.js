// A number as a film leader: a pale disc with a crosshair and two rings, a hand that sweeps round it once for every step, and the figure
// in the middle climbing to its value on the projector's frames; the last sweep is the slowest. The label is a title card under it, light
// words on a dark card in a deco frame. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const R = 320, text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > R * 1.35 && size > 80) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW: SAFE.right - SAFE.left - 120, minScale: 0.75, where: 'the count label' });
  const cardH = label.height + 70, cy = 300 + R + 20, yCard = cy + R + 50 + cardH / 2;
  const steps = [0.25, 0.5, 0.72, 0.9, 1], t0 = at + 0.2, per = [0.28, 0.28, 0.3, 0.34, 0.45];
  const ends = per.reduce((a, p) => (a.push((a.at(-1) ?? 0) + p), a), []);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const f = M.q(t), into = f - t0;
      let k = ends.findIndex((e) => into < e); if (k < 0) k = steps.length;
      const loc = k < steps.length ? (into - (ends[k] - per[k])) / per[k] : 1;
      const shown = into < 0 ? 0 : k >= steps.length ? S.value : countValue(0, S.value, k ? steps[k - 1] : 0, (x) => x);
      ctx.save(); ground.weave(ctx, t);
      const pop = M.O(span(f, at, at + 0.25));
      if (pop > 0) {
        ctx.translate(W / 2, cy); ctx.scale(0.8 + 0.2 * pop, 0.8 + 0.2 * pop);
        ctx.fillStyle = P.leader; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
        if (into >= 0 && k < steps.length) { ctx.fillStyle = P.sweep; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * loc); ctx.arc(0, 0, R * 0.7, -Math.PI / 2 + Math.PI * 2 * loc, -Math.PI / 2, true); ctx.closePath(); ctx.fill(); }
        ctx.strokeStyle = P.dark; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, R * 0.92, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = rgba(P.dark, 0.7);
        for (const sg of [-1, 1]) { ctx.fillRect(sg > 0 ? R * 0.7 : -R, -1.5, R * 0.3, 3); ctx.fillRect(-1.5, sg > 0 ? R * 0.7 : -R, 3, R * 0.3); }
        ctx.lineWidth = 2; ctx.strokeStyle = P.dark; ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2); ctx.stroke();
        kit.number(ctx, text(shown), { x: 0, y: size * 0.04, size, color: P.dark, settle: k >= steps.length ? 1 : 0 });
        if (k >= steps.length) M.diamond(ctx, 0, R * 0.85, 14, P.accent);
      }
      ctx.restore();
      // the title card
      const pc = M.O(span(f, at + 0.1, at + 0.35));
      if (pc > 0) {
        ctx.save(); ctx.translate(0, (1 - pc) * 40); ctx.globalAlpha = Math.min(1, pc * 3);
        ctx.fillStyle = P.card; ctx.fillRect(SAFE.left, yCard - cardH / 2, SAFE.right - SAFE.left, cardH);
        M.frame(ctx, SAFE.left + 8, yCard - cardH / 2 + 8, SAFE.right - SAFE.left - 16, cardH - 16, P.rule, P.accent);
        kit.drawText(ctx, label, { x0: SAFE.left + 60, x1: SAFE.right - 60, y: yCard - label.height / 2 + label.lead / 2, color: P.light, key: P.light });
        ctx.restore();
      }
      ground.over(ctx, t);
    },
  };
}
