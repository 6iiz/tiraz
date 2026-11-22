// A number on a piece of alien junk: a chunky gadget pops up (springy), its screen flickers on, and the number on it races up to its
// value in jittery jumps, twelve a second, before it locks. The antenna bulb blinks in the accent. The blob says the label from a speech
// bubble and gapes when the number locks. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, C = T.cast;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const gx0 = SAFE.left + 40, gx1 = SAFE.right - 40, sx0 = gx0 + 50, sx1 = gx1 - 50;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > sx1 - sx0 - 60 && size > 100) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 100, minScale: 0.85, where: 'the count label' });
  const gH = size * 1.25 + 120, bH = label.height + 90, top = kit.place(gH + 60 + bH, 720);
  const gy0 = top, gy1 = top + gH, sy0 = gy0 + 50, sy1 = gy1 - 70, yNum = (sy0 + sy1) / 2, by0 = gy1 + 60, by1 = by0 + bH, yLabel = by0 + 45 + label.lead / 2;
  const [mx, my] = M.mouthOf(C, 'blob'), tLock = at + 1.5;
  const keys = M.layout(label, { x0: SAFE.left + 50, x1: SAFE.right - 50, y: yLabel }, kit.rtl).filter((b) => b.key);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = ground.k(t), tt = t + clock, take = span(t, tLock, tLock + 0.15) * (1 - span(t, tLock + 1.2, tLock + 1.7));
      M.duo(ctx, P, C, tt, k, { look: [0.5, -0.8] }, { take, talk: M.talk(tt, t > at + 0.5 && t < at + 1.4 ? 1 : 0), look: [-0.5, -0.8] });
      const pg = span(t, at, at + 0.35); if (pg <= 0) return;
      const s = M.ease.outBack(pg), cx = W / 2;
      ctx.save(); ctx.translate(cx, gy1); ctx.scale(s, s); ctx.translate(-cx, -gy1);
      // antenna, body, knobs, screen
      M.stroke(ctx, P, M.polyline([[gx1 - 120, gy0 + 10], [gx1 - 90, gy0 - 70], [gx1 - 60, gy0 - 110]]), k, 8, P.line, 51);
      M.shape(ctx, P, M.ellipse(gx1 - 60, gy0 - 116, 18, 18), k, { fill: Math.floor(tt * 3) % 2 ? P.accent : P.core, width: 6, seed: 52 });
      M.shape(ctx, P, M.box(gx0, gy0, gx1, gy1, 40), k, { fill: P.grey, shadow: M.mix(P.grey, P.dark, 0.35), seed: 53, sx: -16, sy: -16 });
      for (const [x, c] of [[gx0 + 70, P.accent], [gx0 + 140, P.skin], [gx1 - 90, P.skin]]) M.shape(ctx, P, M.ellipse(x, gy1 - 34, 18, 18), k, { fill: c, width: 5, seed: 54 + x });
      M.shape(ctx, P, M.box(sx0, sy0, sx1, sy1, 22), k, { fill: P.screen, width: 6, seed: 55 });
      ctx.fillStyle = rgba(P.light, 0.06); for (let y = sy0 + 8; y < sy1 - 4; y += 7) ctx.fillRect(sx0 + 10, y, sx1 - sx0 - 20, 2);
      const on = span(t, at + 0.3, at + 0.4);
      if (on > 0) {
        const p = span(t, at + 0.35, tLock), q = Math.floor(p * 14) / 14, v = countValue(0, S.value, q >= 1 ? 1 : q, (x) => 1 - (1 - x) ** 2);
        const jit = p < 1 ? ((Math.floor(t * 12) % 2) ? 3 : -3) : 0;
        kit.number(ctx, text(v), { x: cx + jit, y: yNum, size, color: P.light });
      }
      ctx.restore();
      if (M.bubble(ctx, P, k, SAFE.left, by0, SAFE.right, by1, mx, my, span(t, at + 0.45, at + 0.65)) === false) return;
      keys.forEach((b) => M.splat(ctx, P, b, label.size, span(t, at + 1.0, at + 1.3), k));
      kit.drawText(ctx, label, { x0: SAFE.left + 50, x1: SAFE.right - 50, y: yLabel, color: P.dark, key: P.onAccent,
        each: (w, i, box, c) => { const p = span(t, at + 0.62 + i * 0.07, at + 0.72 + i * 0.07); if (p <= 0) return false; c.translate(0, -(1 - M.ease.outCubic(p)) * 22); } });
    },
  };
}
