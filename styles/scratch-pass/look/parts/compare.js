// Before and after on two carved slips. The first slip opens with the label (grey) and the old value (ink); a heavy knife stroke is cut
// across the old value, then the slip is inked back over in fine lines so the old value sinks into tone. The second slip is carved lower and
// further toward the far side, and the new value slides in, large, with a red knife stroke under it. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, pad = T.pad;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const maxW = (SAFE.right - SAFE.left) + 48 - 2 * pad.x - 60;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const was = kit.fit(asText(S.was), { size: Math.round(T.size.compare * 0.8), weight: 700, maxW, where: 'the old value' });
  const now = M.balanced(kit, asText(S.now), { size: T.size.compare, weight: 800, maxW, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, single: true, where: 'the compare label' }) : null;
  const h1 = pad.y * 2 + (label ? label.lead + 6 : 0) + was.height, h2 = pad.y * 2 + now.height + 18, gap = 70;
  const top = kit.place(h1 + gap + h2, 700);
  const w1 = Math.max(was.width, label ? label.width : 0) + 2 * pad.x, w2 = now.width + 2 * pad.x;
  const e1 = rtl ? SAFE.right + 24 : SAFE.left - 24, e2 = rtl ? SAFE.right - 36 : SAFE.left + 36;
  const [a1, b1] = rtl ? [e1 - w1, e1] : [e1, e1 + w1], [a2, b2] = rtl ? [e2 - w2, e2] : [e2, e2 + w2];
  const yLabel = top + pad.y + (label ? label.lead / 2 : 0), yWas = top + pad.y + (label ? label.lead + 6 : 0) + was.lead / 2;
  const top2 = top + h1 + gap, yNow = top2 + pad.y + now.lead / 2;
  const tCut = 0.95, tNow = 1.45;
  const slide = (tl, t0, size) => (w, i, box, c) => M.arrive(c, span(tl, t0 + i * T.dur.step, t0 + i * T.dur.step + T.dur.in), size, rtl);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tl = t - at;
      M.carve(ctx, a1, top, b1, top + h1, span(tl, 0, T.dur.carve), P, { pitch: T.pitch, rtl });
      if (label) kit.drawText(ctx, label, { x0: a1 + pad.x, x1: b1 - pad.x, y: yLabel, align: 'start', color: P.grey, each: slide(tl, 0.3, label.size) });
      kit.drawText(ctx, was, { x0: a1 + pad.x, x1: b1 - pad.x, y: yWas, align: 'start', color: P.ink, key: P.ink, each: slide(tl, 0.45, was.size) });
      const pk = span(tl, tCut, tCut + 0.22);
      for (let r = 0; r < was.rows.length; r++) {
        const rw = was.rows[r].width, xa = rtl ? b1 - pad.x - rw : a1 + pad.x;
        M.knife(ctx, xa - 14, xa + rw + 14, yWas + r * was.lead + 4, 13, P.ink, pk, rtl);
      }
      const ink = clamp((tl - tCut - 0.25) / 0.35);                       // the old slip is inked back over, in fine lines
      if (ink > 0) { ctx.fillStyle = P.ink; for (let y = top + 3; y < top + h1 - 3; y += T.pitch) ctx.fillRect(a1, y, b1 - a1, T.pitch * 0.42 * ink); }
      M.carve(ctx, a2, top2, b2, top2 + h2, span(tl, tNow - 0.25, tNow + 0.2), P, { pitch: T.pitch, rtl });
      kit.drawText(ctx, now, { x0: a2 + pad.x, x1: b2 - pad.x, y: yNow, align: 'start', color: P.ink, key: P.key, each: slide(tl, tNow + 0.05, now.size) });
      const last = now.rows.at(-1), lx = rtl ? b2 - pad.x - last.width : a2 + pad.x;
      M.knife(ctx, lx - 6, lx + last.width + 6, yNow + (now.rows.length - 1) * now.lead + now.size * 0.7, 12, P.red, span(tl, tNow + 0.4, tNow + 0.7), rtl);
    },
  };
}
