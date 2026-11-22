// A number as a backlit title: the number in cel lettering, lit from behind by the accent, counts up on the held drawings (twelve a
// second) and lands with a star glint and a ring of light rays turning slowly behind it. The label slides in on a dark cel plate below.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - 60 && size > 120) size -= 8;
  const numW = kit.numberWidth(text(S.value), size, 900, 1);
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 90, minScale: 0.88, where: 'the count label' });
  const yNum = 620, lw = label.width + 90, lh = label.height + 22, lx = W / 2 - lw / 2, ly = yNum + size * 0.62 + 50;
  const land = at + 1.1;
  // the rays: a fan of soft accent wedges behind the number, built once
  const rays = document.createElement('canvas'); rays.width = 1400; rays.height = 1400;
  { const g = rays.getContext('2d'), gr = g.createRadialGradient(700, 700, 60, 700, 700, 700);
    gr.addColorStop(0, rgba(P.accent, 0.5)); gr.addColorStop(1, rgba(P.accent, 0)); g.fillStyle = gr; g.beginPath();
    for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2, a1 = a0 + Math.PI / 22; g.moveTo(700, 700); g.arc(700, 700, 700, a0, a1); g.closePath(); }
    g.fill(); }
  const cel = (c, str, x, y) => {                                      // the number as a cel: fringe, glow + outline, fill, shade band
    const o = { x, y, size, weight: 900, align: 'center', settle: 1 };
    kit.number(c, str, { ...o, x: x - 6, y: y + 2, color: rgba(P.accent, 0.45), decor: true });
    c.save(); c.shadowColor = P.halo; c.shadowBlur = size * 0.25;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; kit.number(c, str, { ...o, x: x + Math.cos(a) * size * 0.045, y: y + Math.sin(a) * size * 0.045, color: P.line, decor: true }); }
    c.restore();
    kit.number(c, str, { ...o, color: P.light });
    c.save(); c.beginPath(); c.rect(0, y + size * 0.1, W, size); c.clip(); kit.number(c, str, { ...o, color: P.shade, decor: true }); c.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      const th = M.held(t);
      ground.draw(ctx, t);
      const pr = M.E(span(th, land - 0.15, land + 0.3));
      if (pr > 0) { ctx.save(); ctx.globalAlpha = pr; ctx.translate(W / 2, yNum); ctx.rotate(th * 0.12); ctx.scale(0.6 + 0.4 * pr, 0.6 + 0.4 * pr); ctx.drawImage(rays, -700, -700); ctx.restore(); }
      const p = span(th, at + 0.1, land);
      if (p > 0) {
        const s = M.slide(span(th, at + 0.1, at + 0.1 + T.dur.slide), 500, rtl);
        ctx.save(); ctx.translate(s.dx, 0);
        cel(ctx, text(countValue(0, S.value, p)), W / 2, yNum);
        ctx.restore();
      }
      if (th >= land) { const cyc = (th - land) % 1.6; M.glint(ctx, W / 2 + (rtl ? -1 : 1) * numW * 0.42, yNum - size * 0.38, size * 0.3, cyc / 0.5, P.light); }
      M.bar(ctx, lx, ly, lw, lh, P, span(th, at + 0.4, at + 0.57));
      M.cel(kit, ctx, label, { x0: lx + 45, x1: lx + lw - 45, y: ly + 11 + label.lead / 2, align: 'center', P, rtl, at: () => span(th, at + 0.5, at + 0.5 + T.dur.slide) });
      ground.over(ctx, t);
    },
  };
}
