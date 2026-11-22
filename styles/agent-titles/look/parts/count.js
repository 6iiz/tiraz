// A number as a countdown clock cut from paper: on a location in the hot ink, a paper dial with an ink rim slaps down, its ink hand
// sweeps once on twos while the figure counts up on twos, and the figure slaps down when the hand comes home. The label is set on a
// snipped ink strip below. The agent walks in along the ledge and stops beside the dial.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, which: 'hot', seed: 7 });
  const M = await import(look.base + 'motion.js'), I = ground.I, G = ground.color;
  const maxW = SAFE.right - SAFE.left, R = 290;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > R * 1.6 && size > 90) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: maxW - 90, minScale: 0.8, where: 'the count label' });
  const lh = label.height + 44, top = kit.place(R * 2 + 70 + lh, 700), cx = W / 2, cy = top + R, yLab = top + R * 2 + 70 + lh / 2;
  const rim = M.cut(M.ring(0, 0, R + 18, 120), 30, 2.4), face = M.cut(M.ring(0, 0, R - 6, 120), 31, 2), hub = M.cut(M.ring(0, 0, 22, 24), 32, 1);
  const hand = M.cut([[-10, 20], [10, 20], [3, -R + 40], [-3, -R + 40]], 33, 0.8);
  const ticks = Array.from({ length: 12 }, (_, i) => M.cut(M.rect(-7, -R + 14, 14, i % 3 ? 26 : 44), 40 + i, 0.7));
  const stripP = M.cut(M.strip(0, -lh / 2, maxW, lh, 22), 50);
  const ledge = M.cut(M.rect(-40, 0, W + 80, 22), 12, 1.4);
  const tIn = at, tRun = at + 0.3, tHome = at + 1.5;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), o = M.I(out), dir = rtl ? 1 : -1;
      ctx.save(); ctx.translate(0, T.ledge); M.piece(ctx, ledge, I.ink, G); ctx.restore();
      const stopX = rtl ? SAFE.left + 60 : SAFE.right - 60, x = M.walkX(t, at, rtl ? W + 80 : -80, rtl ? -1 : 1), xx = rtl ? Math.max(stopX, x) : Math.min(stopX, x);
      M.agent(ctx, xx - dir * o * 1300, T.ledge + 2, T.agent, rtl ? -1 : 1, t, { fill: I.ink, scarf: I.paper, gap: G, walking: xx === x });
      // the dial
      const p = span(t, tIn, tIn + T.dur.slide); if (p <= 0) return;
      const k = M.slap(t - tIn - T.dur.slide);
      ctx.save(); ctx.translate(cx + (1 - M.O(p)) * dir * 900 - dir * o * 1300, cy); ctx.scale(k, k);
      M.piece(ctx, rim, I.ink, G); M.piece(ctx, face, I.paper, null, { shadow: false });
      ticks.forEach((tk, i) => { ctx.save(); ctx.rotate((i / 12) * Math.PI * 2); ctx.fillStyle = I.ink; ctx.fill(tk); ctx.restore(); });
      const q = span(M.twos(t), tRun, tHome);
      ctx.save(); ctx.rotate(q * Math.PI * 2); M.piece(ctx, hand, I.hot, I.paper, { gapW: 4 }); ctx.restore();
      const n = countValue(0, S.value, q, (x) => x), ks = M.slap(t - tHome);
      ctx.save(); ctx.translate(0, R * 0.38); ctx.scale(ks, ks);
      kit.number(ctx, text(n), { x: 0, y: 0, size: size * 0.7, color: I.ink, settle: q >= 1 ? 1 : 0 });
      ctx.restore();
      M.piece(ctx, hub, I.ink, null, { shadow: false });
      ctx.restore();
      // the label strip
      const pl = span(t, tRun + 0.2, tRun + 0.2 + T.dur.slide);
      if (pl > 0) {
        const dx = (1 - M.O(pl)) * -dir * 900 - dir * o * 1300;
        ctx.save(); ctx.translate(SAFE.left + dx, yLab); M.piece(ctx, stripP, I.ink, G); ctx.restore();
        kit.drawText(ctx, label, { x0: SAFE.left + 45 + dx, x1: SAFE.right - 45 + dx, y: yLab - label.height / 2 + label.lead / 2, align: 'center', color: I.on(I.ink), key: I.hot });
      }
    },
  };
}
