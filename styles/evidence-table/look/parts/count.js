// A number as evidence: one large frame of negative film is slid onto the table and the figure counts up on it in light letters.
// When it lands, the frame is developed: a line of light crosses it from the reading side and leaves it positive, the figure in ink,
// with accent reading brackets at its corners. The label is on a catalogue card under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, pad = T.film.pad;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - 160 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: maxW - 110, minScale: 0.8, where: 'the count label' });
  const fw = Math.min(maxW + 40, Math.max(560, kit.numberWidth(text(S.value), size, 900, 1) + 220)), fh = size * 1.05 + pad * 2;
  const cardH = label.height + 44;
  const top = kit.place(fh + 60 + cardH, 700), fx = W / 2 - fw / 2, yNum = top + fh / 2;
  const yCard = top + fh + 60, cw = Math.min(maxW, label.width + 110), cx = rtl ? SAFE.right - cw : SAFE.left;
  const tDev = at + 1.45;
  const frame = (ctx, str, settle, positive) => {
    M.film(ctx, fx, top, fw, fh, P, positive, 0);
    kit.number(ctx, str, { x: W / 2, y: yNum, size, color: positive ? P.ink : P.filmText, settle, decor: positive });
    if (positive) {                                                              // reading brackets at the corners
      const b = 44, m = pad + 6; ctx.strokeStyle = P.mark; ctx.lineWidth = 7; ctx.lineCap = 'square'; ctx.beginPath();
      for (const [x, y, sx, sy] of [[fx + 26, top + m, 1, 1], [fx + fw - 26, top + m, -1, 1], [fx + 26, top + fh - m, 1, -1], [fx + fw - 26, top + fh - m, -1, -1]]) {
        ctx.moveTo(x, y + sy * b); ctx.lineTo(x, y); ctx.lineTo(x + sx * b, y);
      }
      ctx.stroke();
    }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - 0.4, d);
      const p = span(t, at + 0.15, at + 1.4), str = text(countValue(0, S.value, p));
      const sx = M.slide(span(t, at, at + 0.5), out, W * 1.15, rtl);
      ctx.save(); ctx.translate(sx, 0);
      M.shade(ctx, 0); ctx.fillStyle = P.film; ctx.fillRect(fx, top, fw, fh); M.noShade(ctx);
      const dv = M.E(span(t, tDev, tDev + 0.5)), edge = rtl ? fx + fw * (1 - dv) : fx + fw * dv;
      ctx.save(); ctx.beginPath(); rtl ? ctx.rect(fx - 1, top, edge - fx + 1, fh) : ctx.rect(edge, top, fx + fw - edge + 1, fh); ctx.clip(); frame(ctx, str, p, false); ctx.restore();
      if (dv > 0) {
        ctx.save(); ctx.beginPath(); rtl ? ctx.rect(edge, top, fx + fw - edge, fh) : ctx.rect(fx, top, edge - fx, fh); ctx.clip(); frame(ctx, str, p, true); ctx.restore();
        if (dv < 1) { ctx.fillStyle = P.accent; ctx.fillRect(edge - 3, top - 10, 6, fh + 20); }
      }
      ctx.restore();
      const cxo = M.slide(span(t, at + 0.3, at + 0.8), out, W * 1.15, rtl);
      ctx.save(); ctx.translate(cxo, 0);
      M.card(ctx, cx, yCard, cw, cardH, P, rtl);
      kit.drawText(ctx, label, { x0: cx + (rtl ? 50 : 30), x1: cx + cw - (rtl ? 30 : 50), y: yCard + 22 + label.lead / 2, align: 'start', color: P.ink });
      ctx.restore();
    },
  };
}
