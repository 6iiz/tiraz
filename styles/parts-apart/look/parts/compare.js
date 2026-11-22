// Before and after is a part swap. The device stands open; its middle layer is the old part. The old value is struck with a hairline
// and its part slides out of the stack sideways and sinks away; the new part, in the accent, slides into the empty seat, and the new
// value lands in the key colour over a callout bracket. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, M0 = T.model;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left, x0 = SAFE.left, x1 = SAFE.right, rtl = kit.rtl;
  const was = kit.fit(asText(S.was), { size: T.size.compare * 0.72, weight: 600, maxW, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare, weight: 800, maxW, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 0.96, minPx: 44, where: 'the compare label' }) : null;
  let y = SAFE.top + 30;
  const yLabel = label ? y + label.lead / 2 : 0; if (label) y += label.height + 18;
  const yWas = y + was.lead / 2; y += was.height + 10;
  const yNow = y + now.lead / 2; y += now.height;
  const cutT = at + 0.85, nowT = at + 1.35, out0 = d - T.dur.out;
  const kinds = ['base', 'cell', 'board', 'lid'];
  const oldDev = M.makeDevice(pal, { kinds, chip: false, seed: 4 }), newDev = M.makeDevice(pal, { kinds, chip: false, accentLayer: 2, seed: 4 });
  const s = 0.78, cy = Math.max(1170, y + 520), cx = W / 2, slot = 2, away = rtl ? -1 : 1;
  const nowRun = { x0: 0, x1: 0, y: yNow, row: now.rows.length - 1 };
  { const b = M.boxes(kit, now, x0, x1, yNow).filter((q) => q.row === now.rows.length - 1); nowRun.x0 = Math.min(...b.map((q) => q.x)); nowRun.x1 = Math.max(...b.map((q) => q.x + q.width)); nowRun.y = b[0].y; }
  const wasRows = M.boxes(kit, was, x0, x1, yWas);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const close = M.E(span(t, d - 0.5, d - 0.08));
      const P = M.view(M0.theta + M0.turn * t, s, cx, cy, M0.squash);
      const open = M.E(span(t, 0.05, 0.6)) * (1 - close), gap = 120;
      const hs = M.heights(oldDev, gap, () => open);
      // every layer but the slot from the old device; the slot layer is drawn on its own track
      const outP = M.E(span(t, cutT, cutT + 0.45)), inP = M.E(span(t, nowT - 0.35, nowT + 0.05));
      const draw = (dev, idx, dx, dy, alpha) => {
        const sub = { ...dev, layers: [dev.layers[idx]] };
        const Q = M.view(M0.theta + M0.turn * t, s, cx + dx, cy + dy, M0.squash);
        M.drawDevice(ctx, sub, Q, [hs[idx]], { alpha, shadow: idx === 0 && dx === 0 });
      };
      oldDev.layers.forEach((Ly, i) => {
        if (i === slot) {
          if (outP < 1) draw(oldDev, i, away * 620 * outP, 260 * outP * outP, 1 - outP * 0.6);
          if (inP > 0) draw(newDev, i, -away * 640 * (1 - inP), 0, 1);
        } else draw(oldDev, i, 0, 0, 1);
      });
      const q = span(t, out0, d);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.grey,
        each: (w, i, box, c) => { if (M.settle(c, t, at + i * 0.05, T.dur.word, out0, d) === false) return false; } });
      // the old value: set in grey, struck from the reading side, then it sinks back to a ghost
      const ghost = lerp(1, 0.4, M.soft(span(t, cutT + 0.2, cutT + 0.6)));
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: pal.grey, key: pal.grey,
        each: (w, i, box, c) => { if (M.settle(c, t, at + 0.15 + i * 0.05, T.dur.word, out0, d) === false) return false; c.globalAlpha *= ghost; } });
      const ps = span(t, cutT - 0.1, cutT + 0.15) * (1 - q);
      if (ps > 0) {
        ctx.fillStyle = pal.light;
        was.rows.forEach((r, ri) => {
          const b = wasRows.filter((z) => z.row === ri), a0 = Math.min(...b.map((z) => z.x)) - 10, a1 = Math.max(...b.map((z) => z.x + z.width)) + 10, w = (a1 - a0) * ps;
          ctx.fillRect(rtl ? a1 - w : a0, yWas + ri * was.lead + was.size * 0.06, w, 3);
        });
      }
      ctx.save(); ctx.globalAlpha = 1 - q; M.bracket(ctx, nowRun, now.size, pal.key, span(t, nowT + 0.05, nowT + 0.35), rtl); ctx.restore();
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.key, key: pal.key,
        each: (w, i, box, c) => { if (M.settle(c, t, nowT + i * 0.05, T.dur.word, out0, d) === false) return false; } });
    },
  };
}
