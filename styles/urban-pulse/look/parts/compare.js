// Before and after, cut on the beat: the old value is written in grey, then a fast light trail runs straight through its middle and
// leaves a hairline scar while the old value sinks into the night; on the next downbeat the new value is written by a light trail and
// carries the long-exposure trail of the key phrase. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 1, where: 'the compare label' }) : null;
  const yLabel = 470, yWas = 470 + (label ? label.height : 0) + 40 + was.lead / 2, yNow = yWas + was.height + 90;
  const nw = M.layout(kit, now, { x0, x1, y: yNow }), nr = [{ x0: Math.min(...nw.map((w) => w.x)), x1: Math.max(...nw.map((w) => w.x + w.width)), y: yNow, row: 0, first: 0, last: nw.length - 1 }];
  const ww = M.layout(kit, was, { x0, x1, y: yWas });
  const wx0 = Math.min(...ww.map((w) => w.x)), wx1 = Math.max(...ww.map((w) => w.x + w.width));
  const cutT = at + 0.95, nowT = at + 1.5, out0 = d - T.dur.out - 0.1;
  const words = (t, t0, size, outAt) => (w, i, box, c) => {
    const s = t0 + i * T.dur.step;
    if (M.streakIn(c, span(t, s, s + T.dur.in), box, size, rtl, pal) === false) return false;
    if (M.streakOut(c, span(t, outAt, outAt + T.dur.out), box, size, rtl, pal) === false) return false;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel + label.lead / 2 - label.lead / 2, align: 'start', color: pal.grey, key: pal.key, each: words(t, at, label.size, out0) });
      // the old value: grey, then struck through by a passing light, then sunk
      const sunk = M.E(span(t, cutT + 0.12, cutT + 0.4));
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: mix(pal.grey, pal.dark, sunk * 0.45), key: mix(pal.grey, pal.dark, sunk * 0.45), each: words(t, at + 0.2, was.size, out0) });
      const sp = span(t, cutT, cutT + 0.22);
      if (sp > 0 && t < out0 + T.dur.out) {
        const xs = rtl ? wx1 + 40 : wx0 - 40, xe = rtl ? wx0 - 40 : wx1 + 40, head = xs + (xe - xs) * M.A(sp);
        ctx.save(); ctx.fillStyle = rgba(pal.light, 0.55 * (1 - span(t, out0, out0 + T.dur.out))); ctx.fillRect(Math.min(xs, head), yWas - 2, Math.abs(head - xs), 4);
        if (sp < 1) {
          const g = ctx.createLinearGradient(head, 0, head + (rtl ? 260 : -260), 0);
          g.addColorStop(0, pal.light); g.addColorStop(0.3, rgba(pal.accent, 0.8)); g.addColorStop(1, rgba(pal.accent, 0));
          ctx.fillStyle = g; ctx.shadowColor = rgba(pal.accent, 0.9); ctx.shadowBlur = 20; ctx.fillRect(Math.min(head, head + (rtl ? 260 : -260)), yWas - 5, 260, 10);
        }
        ctx.restore();
      }
      M.trail(ctx, nr[0], now.size, span(t, nowT, nowT + 0.4), rtl, pal, 1 - span(t, out0, out0 + T.dur.out));
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.key, key: pal.key, each: words(t, nowT, now.size, out0 + 0.05) });
    },
  };
}
