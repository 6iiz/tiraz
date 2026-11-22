// A number as a splash panel: a big panel inks in and focus lines rush toward its middle, where the number counts up lettered as a
// sound effect (spot colour, ink outline, paper rim). When it lands it is stamped and a ring of impact flecks bursts round it. The
// label sits in a narration box that breaks across the gutter below. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rng } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW - 80 && size > 120) size -= 8;
  const numW = kit.numberWidth(text(S.value), size, 900, 1);
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 60, minScale: 0.85, where: 'the count label' });
  const yNum = 640, cut = 1090, lw = label.width + 56, lh = label.height + 26, lx = W / 2 - lw / 2, ly = cut - lh / 2;
  const [p0, p1, p2] = M.page(W, H, [{ y: 236, slope: 0.03 }, { y: cut, slope: -0.05 }]);
  const lines = M.focus(W, H, W / 2, yNum, numW / 2 + 70, size * 0.6, 190, 99, P.ink);
  const toneTop = M.tone(W, 300, T.tone.cell, (u, v) => 0.1 + 0.45 * u * (0.5 + 0.5 * v), P.ink);
  const toneLow = M.tone(W, 900, T.tone.cell, (u, v) => 0.06 + 0.3 * (1 - v) * (1 - u), P.ink);
  const rush = M.speed(W, 900, 80, 57, P.ink);
  const r = rng(321), flecks = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2 + r() * 0.25, l: 40 + r() * 50, w: 6 + r() * 6 }));
  const land = at + 1.15;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.camera(ctx, W, H, span(t, 0, d));
      const i0 = 1, i1 = span(t, at, at + T.dur.ink), i2 = 1;
      M.panel(ctx, p0, i0, P.ink, i0 > 0.5 ? () => ctx.drawImage(toneTop, 0, 0) : null);
      M.panel(ctx, p2, i2, P.ink, i2 > 0.5 ? () => { ctx.drawImage(toneLow, 0, 1020); ctx.drawImage(rush, 0, 1020); } : null);
      M.panel(ctx, p1, i1, P.ink, () => {
        const f = M.SNAP(span(t, at + 0.12, at + 0.4)), g = M.SNAP(span(t, land, land + 0.25)), s = 1 + 0.6 * (1 - f) + 0.08 * (1 - g) * (t >= land ? 1 : 0);
        if (f <= 0) return;
        ctx.save(); ctx.translate(W / 2, yNum); ctx.scale(s, s); ctx.translate(-W / 2, -yNum); ctx.drawImage(lines, 0, 0); ctx.restore();
      });
      // the number: counts on the beat of the drawing (twelve drawings a second), then is stamped
      const p = span(t, at + 0.25, land), stepped = Math.floor(p * 0.9 * 12) / (0.9 * 12);
      if (p > 0) {
        const v = countValue(0, S.value, p >= 1 ? 1 : stepped);
        ctx.save(); M.stamp(ctx, t >= land ? span(t, land, land + 0.15) : 1, W / 2, yNum, 0.16);
        M.sfxNumber(kit, ctx, text(v), { x: W / 2, y: yNum, size, weight: 900, align: 'center', settle: p }, P);
        ctx.restore();
      }
      const fb = M.SNAP(span(t, land, land + 0.3));
      if (fb > 0) {
        ctx.fillStyle = P.ink;
        for (const f of flecks) {
          const rx = numW / 2 + 60 + 40 * fb, ry = size * 0.55 + 30 * fb, x = W / 2 + Math.cos(f.a) * rx, y = yNum + Math.sin(f.a) * ry;
          M.slash(ctx, x, y, x + Math.cos(f.a) * f.l, y + Math.sin(f.a) * f.l, f.w, 1, P.ink);
        }
      }
      ctx.save();
      if (M.stamp(ctx, span(t, at + 0.5, at + 0.5 + T.dur.stamp), W / 2, cut, 0.12) !== false) {
        M.box(ctx, lx, ly, lw, lh, P);
        kit.drawText(ctx, label, { x0: lx + 28, x1: lx + lw - 28, y: ly + 13 + label.lead / 2, align: 'center', color: P.ink });
      }
      ctx.restore();
      ctx.restore();
    },
  };
}
