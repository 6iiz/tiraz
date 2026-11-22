// Before and after as two signs on the panel: the old word is lit in the plain gas when the scene opens; at the cut its tube
// stutters and dies, leaving dull glass with a crack of dark paint across it. Then the new word, bent in the accent circuit under
// it, strikes and its gas runs through. The label is painted above. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW, minPx: 46, where: 'the compare label' }) : null;
  const lh = label ? label.height + 30 : 0, gap = 60, block = lh + was.height + gap + now.height, top = kit.place(block, 700);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lh + was.lead / 2, yNow = top + lh + was.height + gap + now.lead / 2;
  const labSign = label ? M.sign(label, { x0, x1, y: yLabel, align: 'center' }, pal, rtl, { painted: true }) : null;
  const wasSign = M.sign(was, { x0, x1, y: yWas, align: 'center' }, pal, rtl, { tube: 'main' });
  const nowSign = M.sign(now, { x0, x1, y: yNow, align: 'center' }, pal, rtl, { tube: 'key' });
  const on = at + 0.05, cutT = at + 0.85, nowT = at + 1.35;
  return {
    duration: d,
    draw(ctx, t) {
      const time = t + clock, wb = M.fail(span(t, cutT, cutT + 0.4), 5), wp = span(t, on, on + T.dur.strike), np = span(t, nowT, nowT + T.dur.strike);
      ground.draw(ctx, t, { power: Math.max(wb * (wp > 0 ? 1 : 0), np > 0 ? 1 : 0) });
      ground.spill(ctx, W / 2, yWas, 520, 220, pal.main.glow, wb * Math.min(1, wp * 2));
      ground.spill(ctx, W / 2, yNow, 600, 260, pal.key.glow, Math.min(1, np * 2));
      if (labSign) { labSign.draw(ctx, () => null); labSign.rec(kit); }
      wasSign.draw(ctx, (i) => ({ run: wp * 1.2, b: M.strike(wp, i + 1) * wb * M.hum(time, i) })); wasSign.rec(kit);
      const cp = span(t, cutT + 0.25, cutT + 0.45);                        // the crack: a dark painted stroke across the dead tube
      if (cp > 0) {
        const xs = wasSign.words.map((w) => [w.x, w.x + w.width]).flat(), a = Math.min(...xs) - 18, b = Math.max(...xs) + 18, L = (b - a) * cp;
        ctx.save(); ctx.strokeStyle = pal.metal; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
        if (rtl) { ctx.moveTo(b, yWas - was.size * 0.18); ctx.lineTo(b - L, yWas - was.size * 0.18 + 22 * cp); } else { ctx.moveTo(a, yWas - was.size * 0.18); ctx.lineTo(a + L, yWas - was.size * 0.18 + 22 * cp); }
        ctx.stroke(); ctx.restore();
      }
      nowSign.draw(ctx, (i) => ({ run: np * 1.15, b: M.strike(np, i + 7) * M.hum(time, i + 3) })); nowSign.rec(kit);
      ground.glass(ctx, t);
    },
  };
}
