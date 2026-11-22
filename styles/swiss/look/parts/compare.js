// Before and after: the old thing is set in grey and cut by the knife; then the new one rises in ink over an accent rule.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, leave, knife, E } = await import(look.base + 'motion.js');
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, single: true, where: 'the compare label' }) : null;
  const yLabel = 470, yWas = 640, yNow = 870, grey = mix(ground.paper, ground.ink, T.tone.grey);
  const cutT = at + 0.9, nowT = at + 1.4;
  const rise = (t, t0, size) => (w, i, box, c) => {
    if (arrive(c, span(t, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), box, size) === false) return false;
    if (leave(c, span(t, d - T.dur.out, d), box, size) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: grey, each: rise(t, at, label.size) });
      knife(ctx, span(t, cutT, cutT + 0.375), SAFE.left, SAFE.right, yWas, ground.ink, kit.rtl,
        () => kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas, align: 'start', color: grey, key: grey, each: rise(t, at + 0.2, was.size) }));
      const rw = maxW * E(span(t, nowT - 0.25, nowT)) * (1 - E(span(t, d - T.dur.out, d)));
      ctx.fillStyle = brand.colors.accent; ctx.fillRect(kit.rtl ? SAFE.right - rw : SAFE.left, yNow + now.size * 0.72, rw, 14);
      kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow, align: 'start', color: ground.ink, key: ground.ink, each: rise(t, nowT, now.size) });
    },
  };
}
