// Before and after as a change of focal plane. The old value comes into focus first; then the focus is racked down to the new one:
// the old value goes soft and pale, a hairline in the accent is drawn through it along its length, and the new value sharpens below,
// in the key ink, and is ringed. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, L = T.lens;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: 720, single: true, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: 760, minPx: T.minPx, where: 'the compare label' }) : null;
  const lH = label ? label.height + 40 : 0, gap = 70, block = lH + was.lead + gap + now.lead;
  const top = kit.place(block, L.cy);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lH + was.lead / 2, yNow = yWas + was.lead / 2 + gap + now.lead / 2;
  const rackT = at + 0.95, nowT = at + 1.25, out0 = d - T.dur.out;
  const soft = pal.lead;
  const xa = L.cx - was.width / 2 - 20, xb = L.cx + was.width / 2 + 20;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), rack = M.S(span(t, rackT, rackT + 0.4));
      if (label) kit.drawText(ctx, label, { x0: L.cx - 380, x1: L.cx + 380, y: yLabel, align: 'center', color: pal.lead,
        each: (w, i, box, c) => { const t0 = at + i * 0.06; return M.focus(c, span(t, t0, t0 + T.dur.in), out, box, label.size, T.blur); } });
      kit.drawText(ctx, was, { x0: L.cx - 400, x1: L.cx + 400, y: yWas, align: 'center', color: pal.ink, key: pal.ink,
        each: (w, i, box, c) => {
          const t0 = at + 0.15 + i * 0.08;
          if (M.focus(c, span(t, t0, t0 + T.dur.in), out, box, was.size, T.blur) === false) return false;
          if (rack > 0) { c.globalAlpha *= 1 - 0.3 * rack; const b = 2.2 * rack + (out > 0 ? T.blur * M.I(out) : 0); c.filter = `blur(${b.toFixed(1)}px)`; return soft; }
        } });
      const sp = span(t, rackT + 0.1, rackT + 0.4);
      if (sp > 0 && out < 1) { const w = (xb - xa) * M.S(sp); ctx.save(); ctx.globalAlpha = 1 - M.I(out); ctx.fillStyle = pal.ring; ctx.fillRect(rtl ? xb - w : xa, yWas - 2, w, 4); ctx.restore(); }
      M.ring(ctx, L.cx, yNow + now.size * 0.04, now.width / 2 + 34, now.size * 0.8, span(t, nowT + 0.3, nowT + 0.3 + T.dur.ring), out, pal);
      kit.drawText(ctx, now, { x0: L.cx - 400, x1: L.cx + 400, y: yNow, align: 'center', color: pal.key, key: pal.key,
        each: (w, i, box, c) => { const t0 = nowT + i * 0.08; return M.focus(c, span(t, t0, t0 + T.dur.in), out, box, now.size, T.blur); } });
    },
  };
}
