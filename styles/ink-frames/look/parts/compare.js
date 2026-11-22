// Before and after as two panels. The old value sits in a narration box on a dark dot-tone panel; two brush slashes cross it out and
// it goes grey. Then the panel below is inked, focus lines rush in, and the new value is stamped on, lettered as a sound effect.
// The label sits in a box across the gutter above. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, maxW = X1 - X0;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: maxW - 100, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 60, minScale: 0.85, where: 'the compare label' }) : null;
  const cutA = 400, cutB = 735, yWas = 575, yNow = 995;
  const lw = label ? label.width + 56 : 0, lh = label ? label.height + 26 : 0, lx = kit.rtl ? X1 - lw : X0, ly = Math.max(290, cutA - lh / 2);
  const ww = was.width + 70, wh = was.height + 30, wx = W / 2 - ww / 2, wy = yWas - wh / 2;
  const [p0, p1, p2, p3] = M.page(W, H, [{ y: cutA, slope: 0.03 }, { y: cutB, slope: -0.04 }, { y: 1262, slope: 0.03 }]);
  const toneTop = M.tone(W, 420, T.tone.cell, (u, v) => 0.08 + 0.3 * u * v, P.ink);
  const toneWas = M.tone(W, 380, T.tone.cell, (u, v) => 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(u * 3 + v * 2)), P.ink);
  const lines = M.focus(W, H, W / 2, yNow, now.width / 2 + 80, now.height / 2 + 70, 180, 202, P.ink);
  const toneLow = M.tone(W, 700, T.tone.cell, (u, v) => 0.06 + 0.3 * v * (1 - u), P.ink);
  const cutT = at + 0.9, nowT = at + 1.3;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.camera(ctx, W, H, span(t, 0, d));
      const i0 = 1, i1 = span(t, at, at + T.dur.ink);
      const i2 = span(t, nowT, nowT + T.dur.ink), i3 = 1;
      M.panel(ctx, p0, i0, P.ink, i0 > 0.5 ? () => ctx.drawImage(toneTop, 0, 0) : null);
      M.panel(ctx, p3, i3, P.ink, i3 > 0.5 ? () => ctx.drawImage(toneLow, 0, 1240) : null);
      M.panel(ctx, p1, i1, P.ink, i1 > 0.5 ? () => ctx.drawImage(toneWas, 0, cutA) : null);
      // the old value: in a box, then crossed out by two slashes and greyed
      ctx.save();
      if (M.stamp(ctx, span(t, at + 0.25, at + 0.25 + T.dur.stamp), W / 2, yWas, 0.15) !== false) {
        M.box(ctx, wx, wy, ww, wh, P);
        kit.drawText(ctx, was, { x0: wx, x1: wx + ww, y: wy + 15 + was.lead / 2, align: 'center', color: t >= cutT + 0.05 ? P.grey : P.ink, key: t >= cutT + 0.05 ? P.grey : P.ink });
        M.slash(ctx, wx - 30, wy + wh * 0.15, wx + ww + 30, wy + wh * 0.8, 22, M.SNAP(span(t, cutT, cutT + 0.12)), P.ink);
        M.slash(ctx, wx + ww + 20, wy + wh * 0.1, wx - 20, wy + wh * 0.9, 18, M.SNAP(span(t, cutT + 0.12, cutT + 0.24)), P.ink);
      }
      ctx.restore();
      // the new value: its panel, focus lines rushing in, the value stamped on
      M.panel(ctx, p2, i2, P.ink, () => {
        const f = M.SNAP(span(t, nowT + 0.05, nowT + 0.3));
        if (f <= 0) return;
        const s = 1 + 0.6 * (1 - f);
        ctx.save(); ctx.translate(W / 2, yNow); ctx.scale(s, s); ctx.translate(-W / 2, -yNow); ctx.drawImage(lines, 0, 0); ctx.restore();
      });
      const pn = span(t, nowT + 0.15, nowT + 0.15 + T.dur.stamp);
      kit.drawText(ctx, now, { x0: X0, x1: X1, y: yNow - now.height / 2 + now.lead / 2, align: 'center', color: P.accent, key: P.accent,
        each: (w, i, b, c) => { if (M.stamp(c, pn, b.x + b.width / 2, b.y, 0.45) === false) return false; return M.sfx(c, w, b, now.size, P); } });
      if (label) {
        ctx.save();
        if (M.stamp(ctx, span(t, at + 0.1, at + 0.1 + T.dur.stamp), lx + lw, ly, 0.12) !== false) {
          M.box(ctx, lx, ly, lw, lh, P);
          kit.drawText(ctx, label, { x0: lx + 28, x1: lx + lw - 28, y: ly + 13 + label.lead / 2, align: 'start', color: P.ink });
        }
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
