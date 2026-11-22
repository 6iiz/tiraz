// A number, cut in wood: rays of light are gouged out from behind it, then the figure is cut into the block as letters of light, first
// a hatching of thin cuts that widen until the strokes merge, counting up as they widen. The label stands in wood on a carved strip
// below. To leave, the block is inked again. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, padX = T.pad.x, padY = T.pad.y;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > full - 60 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full - 2 * padX, minScale: 0.85, where: 'the count label' });
  const nh = size * 1.1, bw = Math.min(full, label.width + 2 * padX), bh = label.height + 2 * padY;
  const top = kit.place(nh + 70 + bh, 700), cy = top + nh / 2, cx = W / 2, by = top + nh + 70, bx = (W - bw) / 2;
  const carve = M.patch(bx, by, bw, bh, 23, rtl, T);
  const rays = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.1, r0 = size * 0.62, r1 = r0 + 90 + (i % 3) * 50;
    rays.push(M.cutShape(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.8, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.8, 12 + (i % 2) * 8, 300 + i));
  }
  const out0 = d - T.dur.ink;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pr = span(t, at, at + 0.5), path = new Path2D();
      rays.forEach((c, i) => M.cutPath(path, c, M.E(span(pr, i * 0.03, i * 0.03 + 0.55))));
      ctx.fillStyle = P.paper; ctx.fill(path);
      ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(cx, cy, size * 0.6 + 50, size * 0.48 + 26, 0, 0, Math.PI * 2); ctx.fill();
      const p = span(t, at + 0.2, at + 1.4);
      M.hatch(ctx, p, 0, cy - size * 0.62, W, size * 1.24, () => {
        kit.number(ctx, text(countValue(0, S.value, p)), { x: cx, y: cy, size, color: P.paper, settle: p });
      }, 12);
      const pc = span(t, at + 0.6, at + 0.6 + T.dur.carve);
      carve.draw(ctx, pc, P.paper);
      if (pc > 0) kit.drawText(ctx, label, { x0: bx + padX, x1: bx + bw - padX, y: by + padY + label.lead / 2, color: P.ink });
      M.brayer(ctx, span(t, out0, d), W, H, P);
    },
  };
}
