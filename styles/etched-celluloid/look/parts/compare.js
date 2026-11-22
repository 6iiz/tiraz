// Before and after, scratched: the label is cut faint, the old value is cut, then scratched out by a heavy zigzag of the needle (with dye in
// it) and it sinks back into the emulsion; a short arrow is cut downward, and the new value is cut large with a wake of dye under it.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, cx = W / 2;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const was = kit.fit(asText(S.was), { size: Math.round(T.size.compare * 0.78), weight: 700, maxW: x1 - x0, where: 'the old value' });
  const now = M.balanced(kit, asText(S.now), { size: T.size.compare, weight: 800, maxW: x1 - x0, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, single: true, where: 'the compare label' }) : null;
  const head = label ? label.lead + 40 : 0, mid = 120, h = head + was.height + mid + now.height, top = kit.place(h, 700);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + head + was.lead / 2, yMid = top + head + was.height + mid / 2, yNow = top + head + was.height + mid + now.lead / 2;
  const tWas = 0.3, tCut = 1.0, tNow = 1.5;
  const ww = was.width, zig = [];
  for (let i = 0, m = Math.max(6, Math.round(ww / 34)); i <= m; i++) { const x = rtl ? cx + ww / 2 + 16 - (ww + 32) * i / m : cx - ww / 2 - 16 + (ww + 32) * i / m; zig.push([x, yWas + (i % 2 ? -1 : 1) * was.size * 0.32]); }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const n = ground.n(t), w = ground.weave(t), tl = t - at;
      ctx.save(); ctx.translate(w.x, w.y);
      if (label) M.cutText(kit, ctx, label, { x0, x1, y: yLabel, align: 'center', t: tl, t0: 0, step: 0.06, dur: 0.14, n, seed: 61, P, color: P.faint });
      const sink = span(tl, tCut + 0.2, tCut + 0.45);
      ctx.save(); ctx.globalAlpha = 1 - 0.45 * sink;
      M.cutText(kit, ctx, was, { x0, x1, y: yWas, align: 'center', t: tl, t0: tWas, step: 0.08, dur: 0.18, n, seed: 63, P, color: P.faint });
      ctx.restore();
      const pc = span(tl, tCut, tCut + 0.3);
      M.needle(ctx, zig, { w: 9, n, seed: 64, color: P.dye, p: pc, alpha: 0.7, tremble: 3 });
      M.needle(ctx, zig, { w: 3.5, n, seed: 65, color: P.cream, p: pc, tremble: 2 });
      const pa = span(tl, tCut + 0.3, tNow);
      M.needle(ctx, M.seg(cx, yMid - 36, cx, yMid + 30, 8), { w: 3, n, seed: 66, color: P.cream, p: pa });
      if (pa >= 1) { M.needle(ctx, M.seg(cx - 16, yMid + 14, cx, yMid + 32, 6), { w: 3, n, seed: 67, color: P.cream }); M.needle(ctx, M.seg(cx + 16, yMid + 14, cx, yMid + 32, 6), { w: 3, n, seed: 68, color: P.cream }); }
      const last = now.rows.at(-1), yl = yNow + (now.rows.length - 1) * now.lead + now.size * 0.62;
      M.dye(ctx, cx - last.width / 2, cx + last.width / 2, yl, 26, { n, seed: 69, P, p: span(tl, tNow + 0.25, tNow + 0.6), rtl, strokes: 5, alpha: 0.6 });
      M.cutText(kit, ctx, now, { x0, x1, y: yNow, align: 'center', t: tl, t0: tNow, step: 0.08, dur: 0.18, n, seed: 70, P });
      ctx.restore();
      ground.over(ctx, t);
    },
  };
}
