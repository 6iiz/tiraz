// Before and after, settled the sitcom way. The label is typed on a terminal tag; the old value hangs on a light tag. The tall one lifts
// his little ray gun and zaps it without a word: a boiling accent beam, the tag chars dark, shakes, and goes up in a puff of smoke.
// A small portal opens lower down and drops the new value on a tag with the accent splat, and the blob does its take.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, clamp, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, C = T.cast;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const bx0 = SAFE.left + 60, bx1 = SAFE.right - 60;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: bx1 - bx0 - 100, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: 500, maxW: SAFE.right - SAFE.left - 80, minScale: 0.88, where: 'the compare label' }) : null;
  const lH = label ? label.height + 40 : 0, wH = was.height + 60, nH = now.height + 60;
  const top = kit.place(lH + 50 + wH + 130 + nH, 700);
  const wy0 = top + lH + 50, wy1 = wy0 + wH, ny0 = wy1 + 130, ny1 = ny0 + nH, yWas = wy0 + 30 + was.lead / 2, yNow = ny0 + 30 + now.lead / 2;
  const tZap = at + 1.0, tBurn = tZap + 0.12, tPuff = tZap + 0.45, tDrop = tZap + 0.55;
  const gun = [C.tall + 90 + 30 + 76, C.y - 150 - 40 - 120 - 17];      // the muzzle when the gun is fully raised (see tallOne)
  const wc = [(bx0 + bx1) / 2, (wy0 + wy1) / 2];
  const nb = M.layout(now, { x0: bx0, x1: bx1, y: yNow }, rtl), na = Math.min(...nb.map((b) => b.x)), nz = Math.max(...nb.map((b) => b.x + b.width));
  const pY = ny0 - 40;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = ground.k(t), tt = t + clock;
      const zap = span(t, at + 0.55, at + 0.85) * (1 - span(t, tPuff + 0.3, tPuff + 0.6)), take = span(t, tDrop + 0.3, tDrop + 0.45) * (1 - span(t, tDrop + 1.5, tDrop + 2));
      M.duo(ctx, P, C, tt, k, { zap, look: [0.6, -0.9] }, { take, look: [-0.5, -0.8] });
      if (label) {
        M.tag(ctx, P, k, SAFE.left + 20, top, SAFE.right - 20, top + lH, span(t, at, at + 0.2));
        kit.drawText(ctx, label, { x0: SAFE.left + 40, x1: SAFE.right - 40, y: top + 20 + label.lead / 2, color: P.light, key: P.accent, each: (w, i) => { if (t < at + 0.08 + i * 0.07) return false; } });
      }
      // the old value: in, zapped (charred and shaking), gone in a puff
      const pin = span(t, at + 0.2, at + 0.45);
      if (pin > 0 && t < tPuff) {
        const burnt = span(t, tBurn, tBurn + 0.1), sh = burnt > 0 ? Math.sin(t * 90) * 6 : 0, s = M.ease.outBack(pin);
        ctx.save(); ctx.translate(wc[0] + sh, wc[1]); ctx.scale(s, s); ctx.translate(-wc[0], -wc[1]);
        M.shape(ctx, P, M.box(bx0, wy0, bx1, wy1, 24), k, { fill: burnt > 0 ? P.screen : P.paper, shadow: burnt > 0 ? undefined : P.shade, seed: 120, sx: -10, sy: -10 });
        kit.drawText(ctx, was, { x0: bx0, x1: bx1, y: yWas, color: burnt > 0 ? P.grey : P.dark, key: burnt > 0 ? P.grey : P.dark });
        if (burnt > 0) { ctx.strokeStyle = P.grey; ctx.lineWidth = 6; for (let i = 0; i < 3; i++) { const x = bx0 + 120 + i * 300; ctx.beginPath(); ctx.moveTo(x, wy0 - 10); ctx.quadraticCurveTo(x + 30 * Math.sin(tt * 8 + i), wy0 - 50, x, wy0 - 90); ctx.stroke(); } }
        ctx.restore();
      }
      // the beam
      if (t >= tZap && t < tBurn + 0.2) {
        const pts = M.polyline([gun, wc]);
        M.stroke(ctx, P, pts, k, 30, P.line, 130); M.stroke(ctx, P, pts, k, 22, P.accent, 131); M.stroke(ctx, P, pts, k, 7, P.core, 132);
        M.shape(ctx, P, M.ellipse(wc[0], wc[1], 70, 50, 8, 0.25, tt * 9), k, { fill: P.core, width: 6, seed: 133 });
      }
      // the puff
      const pp = span(t, tPuff, tPuff + 0.6);
      if (pp > 0 && pp < 1) {
        ctx.save(); ctx.globalAlpha = 1 - pp;
        for (let i = 0; i < 6; i++) { const a = i * 1.05, r = 60 + 90 * pp; M.shape(ctx, P, M.ellipse(wc[0] + Math.cos(a) * r * 2.2, wc[1] + Math.sin(a) * r * 0.5 - 40 * pp, 70 + 30 * pp, 50 + 20 * pp), k, { fill: P.grey, width: 5, seed: 140 + i }); }
        ctx.restore();
      }
      // a small portal drops the new value
      const pr = 90 * M.ease.outBack(span(t, tDrop - 0.25, tDrop)) * (1 - span(t, tDrop + 0.5, tDrop + 0.8));
      if (pr > 1) { ctx.save(); ctx.translate(W / 2, pY); ctx.scale(2.6, 0.45); ctx.translate(-W / 2, -pY); M.portal(ctx, P, W / 2, pY, pr, tt, k); ctx.restore(); }
      const pd = span(t, tDrop, tDrop + 0.3);
      if (pd > 0) {
        const fall = (1 - M.ease.outCubic(pd)) * -120, land = span(t, tDrop + 0.3, tDrop + 0.45), sq = land > 0 && land < 1 ? 1 - 0.1 * Math.sin(Math.PI * land) : 1;
        ctx.save(); ctx.beginPath(); ctx.rect(0, pY, W, H); ctx.clip();
        ctx.translate(W / 2, ny1); ctx.scale(2 - sq, sq); ctx.translate(-W / 2, -ny1 - fall * -1);
        M.shape(ctx, P, M.box(bx0, ny0, bx1, ny1, 24), k, { fill: P.paper, shadow: P.shade, seed: 150, sx: -10, sy: -10 });
        M.splat(ctx, P, { x: na, y: yNow, width: nz - na }, now.size, span(t, tDrop + 0.3, tDrop + 0.6), k);
        const on = t >= tDrop + 0.33 ? P.onAccent : P.dark; kit.drawText(ctx, now, { x0: bx0, x1: bx1, y: yNow, color: on, key: on });
        ctx.restore();
      }
    },
  };
}
export { clamp, rgba };
