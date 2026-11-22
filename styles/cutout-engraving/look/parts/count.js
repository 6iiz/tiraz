// A number as a collage: the figure is set on a big torn paper card that is put down and pressed, and it rolls to its value on
// twos. Under it, a data engraving: a band of parallel engraved lines that swell from hair-thin to heavy as the count grows, cut
// out on its own strip with an accent wash. The label follows on a paper slip. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > T.textW - 80 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: T.textW, minScale: 0.8, where: 'the count label' });
  const cw = Math.max(420, kit.numberWidth(text(S.value), size, 900, 1) + 140), ch = size * 1.15 + 30, bw = 720, bh = 64;
  const lw = label.width + 80, lh = label.height + 34, block = ch + 30 + bh + 34 + lh;
  const top = Math.min(kit.place(block, 660), T.floor - block);
  const cyC = top + ch / 2, cyB = top + ch + 30 + bh / 2, cyL = cyB + bh / 2 + 34 + lh / 2;
  const card = M.torn(cw, ch, 51, 18, true), strip = M.torn(bw, bh, 53, 8), lab = M.torn(lw, lh, 57, 10);
  const tR = at + 0.15, tB = at + 0.45, tL = at + 1.3;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t), p = span(tt, tR, tR + 1.1);
      M.piece(ctx, P, M.press(span(tt, at, at + T.dur.press), -1.4, 1), W / 2, cyC, card, (c) => {
        M.slip(c, P, card, P.paper);
        kit.number(c, text(countValue(0, S.value, p, ease.outCubic)), { x: 0, y: 6, size, color: P.ink, settle: p });
      });
      M.piece(ctx, P, M.press(span(tt, tB, tB + T.dur.press), 1.0, -1), W / 2, cyB, strip, (c) => {
        M.slip(c, P, strip, P.paper);
        const L = (bw - 60) * ease.outCubic(p), s0 = rtl ? 1 : -1, x0 = s0 * (bw / 2 - 30);
        c.fillStyle = P.sheet; c.fillRect(rtl ? x0 - L : x0, -bh / 2 + 10, L, bh - 20);           // the wash
        c.strokeStyle = P.ink; c.lineCap = 'butt';
        for (let k = 0; k < 6; k++) { const y = -bh / 2 + 14 + k * 7.2;
          for (let i = 0; i < 40; i++) { const u0 = i / 40, u1 = (i + 1) / 40; if (u0 * (bw - 60) > L) break;
            c.lineWidth = 0.5 + 5 * u1 * p; c.beginPath(); c.moveTo(x0 - s0 * u0 * (bw - 60), y); c.lineTo(x0 - s0 * Math.min(L, u1 * (bw - 60)), y); c.stroke(); } }
        if (p >= 1) { c.fillStyle = P.accent; c.beginPath(); c.arc(x0 - s0 * L, 0, 13, 0, Math.PI * 2); c.fill(); }
      });
      M.piece(ctx, P, M.press(span(tt, tL, tL + T.dur.press), -0.8, 1), W / 2, cyL, lab, (c) => {
        M.slip(c, P, lab, P.paper);
        kit.drawText(c, label, { x0: -label.width / 2, x1: label.width / 2, y: -label.height / 2 + label.lead / 2, color: P.ink, key: P.ink });
      });
    },
  };
}
