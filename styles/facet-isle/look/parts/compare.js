// Before and after: the old value sits on a dull gem bar; a crack runs down through it and the bar splits in two, the halves tipping
// apart and dimming. Then the new value drops in below on a bar of the accent and lands with the bounce.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 200;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, minPx: 44, where: 'the compare label' }) : null;
  const yLabel = 590, yWas = yLabel + 190, yNow = yWas + 260, cx = W / 2;
  const barOf = (f, y) => { const w = f.width + f.size * 0.9; return { x0: cx - w / 2, x1: cx + w / 2, y0: y - f.size * 0.75, y1: y + f.size * 0.72 }; };
  const bw = barOf(was, yWas), bn = barOf(now, yNow);
  // the crack: a zigzag from the top of the old bar to its bottom, a little off centre
  const r = rng(77), crack = []; for (let i = 0; i <= 6; i++) crack.push([cx + 14 + (i % 2 ? 1 : -1) * (10 + r() * 18), bw.y0 - 30 + i * ((bw.y1 - bw.y0 + 60) / 6)]);
  const cutT = at + 0.85, nowT = at + 1.35, ink = P.on(P.panel);
  const drawWas = (c) => {
    M.gemBar(c, P, bw.x0, bw.x1, bw.y0, bw.y1, P.panel);
    kit.drawText(c, was, { x0: bw.x0, x1: bw.x1, y: yWas, align: 'center', color: ink, key: ink });
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: P.muted,
        each: (w, i, box, c) => { const t0 = at + i * 0.06; if (M.drop(c, span(t, t0, t0 + T.dur.in), 50) === false) return false; if (M.lift(c, out) === false) return false; } });
      const pw = span(t, at + 0.15, at + 0.15 + T.dur.in);
      if (pw > 0 && out < 1) {
        const split = M.L(span(t, cutT + 0.08, cutT + 0.6));
        ctx.save(); M.drop(ctx, pw, 70); M.lift(ctx, out);
        if (t < cutT) drawWas(ctx);
        else {
          // two halves, cut along the crack
          for (const side of [-1, 1]) {
            ctx.save();
            const hx = side < 0 ? (bw.x0 + crack[3][0]) / 2 : (bw.x1 + crack[3][0]) / 2, far = side < 0 ? -40 : W + 40;
            ctx.globalAlpha *= 1 - 0.55 * split;
            ctx.translate(hx + side * 34 * split, yWas + 46 * split); ctx.rotate(side * 0.07 * split); ctx.translate(-hx, -yWas);
            ctx.beginPath(); ctx.moveTo(far, crack[0][1]); crack.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(far, crack.at(-1)[1]); ctx.closePath(); ctx.clip();
            drawWas(ctx); ctx.restore();
          }
          const flash = 1 - span(t, cutT, cutT + 0.15);
          if (flash > 0) { ctx.strokeStyle = P.dark; ctx.globalAlpha *= flash; ctx.lineWidth = 5; ctx.beginPath(); crack.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
        }
        ctx.restore();
      }
      const pn = span(t, nowT, nowT + T.dur.in);
      if (pn > 0 && out < 1) {
        ctx.save();
        M.hover(ctx, cx, bn.y1 + 50, bn.x1 - bn.x0, Math.min(1, pn * 2) * (1 - out));
        M.drop(ctx, pn, 110); M.lift(ctx, out);
        M.gemBar(ctx, P, bn.x0, bn.x1, bn.y0, bn.y1, P.accent);
        kit.drawText(ctx, now, { x0: bn.x0, x1: bn.x1, y: yNow, align: 'center', color: P.onAccent, key: P.onAccent });
        ctx.restore();
      }
    },
  };
}
