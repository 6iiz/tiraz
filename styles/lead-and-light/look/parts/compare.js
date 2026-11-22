// Before and after in glass. The old value is painted on a clear pane that the sun lights; then the pane cracks from a point, the
// cracks running out in leaded lines, and its light goes out. Below, a border of coloured pieces is set round a new pane one piece at a
// time, the pane drops in, and the sun crosses it from the reading side, bringing up the new value.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2, b = 34;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 2 * b - 120;
  const was = kit.fit(asText(S.was), { size: T.size.was, weight: 700, maxW: maxW - 60, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.now, weight: 800, maxW, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 140, single: true, where: 'the compare label' }) : null;
  const ww = Math.max(400, was.width + 120), wh = was.height + 70, nw = Math.min(SAFE.right - SAFE.left - 2 * b + 30, Math.max(560, now.width + 140)), nh = now.height + 90;
  const lh = label ? label.lead + 28 : 0, lH = label ? lh + 40 : 0, gap = 70 + b;
  const top = kit.place(lH + wh + gap + nh + b, 700);
  const yl = top, wy = top + lH, ny = wy + wh + gap;
  const wo = { x0: cx - was.width / 2, x1: cx + was.width / 2, y: wy + wh / 2 - was.height / 2 + was.lead / 2, align: 'center' };
  const no = { x0: cx - now.width / 2, x1: cx + now.width / 2, y: ny + nh / 2 - now.height / 2 + now.lead / 2, align: 'center' };
  const lo = label ? { x0: cx - label.width / 2, x1: cx + label.width / 2, y: yl + lh / 2, align: 'center' } : null;
  const cr = M.crack(cx + (rtl ? -ww * 0.18 : ww * 0.18), wy + wh * 0.45, ww, wh, 91);
  const frame = M.border(cx - nw / 2, ny, nw, nh, pal, 55, b, 6);
  const tCrack = at + 0.85, tNow = at + 1.15;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.q(t), out = span(t, d - T.dur.out, d), keep = 1 - Math.floor(out * 4) / 4;
      if (keep <= 0 || tq < at) return;
      ctx.save(); ctx.globalAlpha = keep;
      const L1 = M.sun(tq, at + 0.15, T.dur.sun, rtl, 0.08);
      if (label) {
        M.pane(ctx, cx - (label.width + 80) / 2, yl, label.width + 80, lh, pal, { lit: L1(cx, yl), lead: 7 });
        kit.drawText(ctx, label, { ...lo, color: pal.paint, each: (w, i, box, c) => M.painted(c, L1(box.x + box.width / 2, box.y) * 1.25) });
      }
      if (tq >= at + 0.1) {
        const broke = span(tq, tCrack, tCrack + 0.35), dark = 1 - 0.75 * broke;
        M.pane(ctx, cx - ww / 2, wy + (tq < at + 0.27 ? -10 : 0), ww, wh, pal, { lit: L1(cx, wy) * dark, r: 6 });
        kit.drawText(ctx, was, { ...wo, color: pal.paint, key: pal.paint, each: (w, i, box, c) => M.painted(c, L1(box.x + box.width / 2, box.y) * 1.25 * (1 - 0.45 * broke)) });
        ctx.save(); ctx.beginPath(); ctx.rect(cx - ww / 2, wy, ww, wh); ctx.clip(); cr(ctx, broke, pal.lead); ctx.restore();
      }
      frame.draw(ctx, span(tq, tNow, tNow + T.dur.set), () => clamp(span(tq, tNow + 0.3, tNow + 0.8)));
      if (tq >= tNow + T.dur.set - 0.1) {
        const L2 = M.sun(tq, tNow + T.dur.set + 0.05, T.dur.sun, rtl, 0.08), dy = tq < tNow + T.dur.set + 0.07 ? -12 : 0;
        ctx.save(); ctx.translate(0, dy);
        M.pane(ctx, cx - nw / 2, ny, nw, nh, pal, { color: pal.accent, lit: 0.3 + 0.7 * L2(rtl ? cx + nw / 4 : cx - nw / 4, ny), r: 6 });
        kit.drawText(ctx, now, { ...no, color: pal.keyText, key: pal.keyText, each: (w, i, box, c) => M.painted(c, L2(box.x + box.width / 2, box.y) * 1.25) });
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
