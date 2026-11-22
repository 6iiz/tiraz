// Before and after, cut in wood. The old value is carved out and stands in wood; then the knife goes back in and slashes it with three
// long diagonal cuts, so the old letters are cut through and broken. The new value is carved below and the print's one colour is rolled
// over its whole patch: it is the thing that burns. To leave, the block is inked again.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const full = SAFE.right - SAFE.left, padX = T.pad.x + 10, padY = T.pad.y;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: full - 2 * padX, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full, single: true, where: 'the compare label' }) : null;
  const ww = Math.min(full, was.width + 2 * padX), nw = Math.min(full, now.width + 2 * padX), hw = was.height + 2 * padY, hn = now.height + 2 * padY;
  const lh = label ? label.lead + 30 : 0, gap = 70;
  const top = kit.place(lh + hw + gap + hn, 720), yW = top + lh, yN = yW + hw + gap;
  const xW = rtl ? SAFE.right - ww : SAFE.left, xN = rtl ? SAFE.right - nw : SAFE.left;
  const cW = M.patch(xW, yW, ww, hw, 61, rtl, T), cN = M.patch(xN, yN, nw, hn, 67, rtl, T);
  const slash = [0, 1, 2].map((i) => {
    const x0 = xW + ww * (0.12 + i * 0.3), dx = ww * 0.16;
    return M.cutShape(rtl ? x0 + dx : x0 - dx * 0.2, yW - 16, rtl ? x0 - dx * 0.2 : x0 + dx, yW + hw + 16, 11, 400 + i);
  });
  const tCut = at + 0.95, tNow = at + 1.4, out0 = d - T.dur.ink;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) M.hatch(ctx, span(t, at, at + T.dur.letters), SAFE.left, top + label.lead / 2 - label.size, full, label.size * 2,
        () => kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: top + label.lead / 2, align: 'start', color: P.soft }));
      const pw = span(t, at + 0.15, at + 0.15 + T.dur.carve);
      cW.draw(ctx, pw, P.paper);
      if (pw > 0) kit.drawText(ctx, was, { x0: xW + padX, x1: xW + ww - padX, y: yW + padY + was.lead / 2, color: P.ink, key: P.ink });
      const path = new Path2D();
      slash.forEach((c, i) => M.cutPath(path, c, M.E(span(t, tCut + i * 0.1, tCut + i * 0.1 + 0.18))));
      ctx.fillStyle = P.ink; ctx.save(); ctx.lineWidth = 7; ctx.strokeStyle = P.ink; ctx.stroke(path); ctx.restore();
      ctx.fillStyle = P.paper; ctx.fill(path);
      const pn = span(t, tNow, tNow + T.dur.carve), pk = span(t, tNow + T.dur.carve, tNow + T.dur.carve + T.dur.colour + 0.1);
      cN.draw(ctx, pn, P.paper);
      if (pk > 0) M.colour(ctx, pk, xN + 8, yN + 8, nw - 16, hn - 16, P, rtl, 91);
      if (pn > 0) kit.drawText(ctx, now, { x0: xN + padX, x1: xN + nw - padX, y: yN + padY + now.lead / 2, color: pk >= 1 ? P.on : P.ink, key: pk >= 1 ? P.on : P.ink });
      M.brayer(ctx, span(t, out0, d), W, H, P);
    },
  };
}
