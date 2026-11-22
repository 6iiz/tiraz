// A number as a rising sun: a disc of the accent, its rim wiped toward the paper, climbs out from behind a band of mist and the figure
// counts up on it, cut in whichever ink reads on the accent. The label is uncovered under it in a cartouche that unrolls from the
// reading side. The sun sinks behind the mist again to leave and the cartouche is rolled up.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const R = 230, full = SAFE.right - SAFE.left, padX = T.pad.x, padY = T.pad.y;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > R * 1.62 && size > 90) size -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full - 2 * padX, minScale: 0.85, where: 'the count label' });
  const bw = Math.min(full, Math.max(label.width + 2 * padX, 520)), bh = label.height + 2 * padY;
  const top = kit.place(2 * R + 70 + bh, 720), cx = W / 2, cy = top + R, horizon = cy + R + 24;
  const bx = (W - bw) / 2, by = horizon + 46;
  const out0 = d - T.dur.roll;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const rise = M.E(span(t, at, at + 0.7)) - M.OUT(span(t, out0 - 0.1, d)), lift = (1 - rise) * (2 * R + 30);
      if (rise > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, horizon); ctx.clip();
        ctx.translate(0, lift);
        const g = ctx.createRadialGradient(cx, cy, R * 0.78, cx, cy, R);
        g.addColorStop(0, P.accent); g.addColorStop(1, P.pale);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx + T.reg.x, cy + T.reg.y, R, 0, Math.PI * 2); ctx.stroke();
        const p = span(t, at + 0.35, at + 1.5);
        if (lift < 40) kit.number(ctx, text(countValue(0, S.value, p)), { x: cx, y: cy + 8, size, color: P.on, settle: p });
        ctx.restore();
      }
      M.mist(ctx, cx - 560, horizon - 6, 1120, 40, P.mist, 1);
      ctx.fillStyle = P.ink; ctx.fillRect(cx - 420, horizon - 1, 840, 2.5);
      M.scroll(ctx, span(t, at + 0.55, at + 0.55 + T.dur.unroll), span(t, out0, d), bx, by, bw, bh, rtl, P, () => {
        M.cartouche(ctx, bx, by, bw, bh, P);
        kit.drawText(ctx, label, { x0: bx + padX, x1: bx + bw - padX, y: by + padY + label.lead / 2, color: P.ink });
      });
    },
  };
}
