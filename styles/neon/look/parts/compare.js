// Before and after as two signs. The old one is lit at first; then it dies: a stutter, and it is left dull, with no bloom (still
// readable, but cold). An arrow tube lights pointing down, and the new one ignites below as a hot accent tube.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js');
  const pal = ground.pal, L = SAFE.left, R = SAFE.right;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: R - L, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW: R - L, single: true, where: 'the compare label' }) : null;
  const yLabel = 440, yWas = 590, yArrow = yWas - was.lead / 2 + was.height + 70, yNow = yArrow + 70 + now.lead / 2;
  const all = { base: pal.white, key: pal.white }, hot = { base: pal.hot, key: pal.hot };
  const sLabel = label && M.sign(kit, label, { x0: L, x1: R, y: yLabel, align: 'center' }, all, pal, T);
  const sWas = M.sign(kit, was, { x0: L, x1: R, y: yWas, align: 'center' }, all, pal, T);
  const sNow = M.sign(kit, now, { x0: L, x1: R, y: yNow, align: 'center' }, hot, pal, T, false);   // no glass: the new sign is a surprise
  const ax = W / 2, arrow = M.shape(ax - 30, yArrow - 50, 60, 100, (c) => {
    c.beginPath(); c.moveTo(ax, yArrow - 42); c.lineTo(ax, yArrow + 38); c.moveTo(ax - 20, yArrow + 18); c.lineTo(ax, yArrow + 40); c.lineTo(ax + 20, yArrow + 18); c.stroke();
  }, pal.white, pal, T, 5);
  const out0 = d - T.dur.out, dieT = at + 0.8, nowT = at + 1.3;
  const off = (t, seed) => M.douse(span(t, out0 + (seed % 3) * 0.03, d), seed);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ign = (t0, seed) => M.flick(span(t, t0, t0 + T.dur.ignite), seed) * off(t, seed);
      // the old sign: lit, then dying to a cold glow with no bloom
      const dying = span(t, dieT, dieT + 0.45), wl = (i) => ign(at + i * T.dur.step, 70 + i) * M.die(dying, 70 + i, 0);
      const bn = ign(nowT, 90);
      ground.spill(ctx, W / 2, yWas, 1100, 500, pal.light, wl(0) * 0.4);
      ground.spill(ctx, W / 2, yNow, 1200, 600, pal.accent, bn);
      if (sLabel) sLabel.draw(ctx, (i) => ign(at - 0.15 + i * T.dur.step, 80 + i) * 0.8);
      sWas.draw(ctx, wl, (w, i, b) => (dying > 0 ? mix(mix(pal.unlit, pal.dead, off(t, 70)), pal.white.core, clamp01(b)) : null));
      arrow.draw(ctx, ign(nowT - 0.35, 95));
      sNow.draw(ctx, (i) => ign(nowT + i * T.dur.step, 90 + i));
    },
  };
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
