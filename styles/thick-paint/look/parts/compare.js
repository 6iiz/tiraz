// Before and after, painted over: the old value is laid on a dull slab; then a loaded knife drags a thick band of the ground's own dark
// paint across it on a slant, burying its middle (its top and bottom still show what it was). The new value is laid below on a slab of
// the accent, larger. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const full = SAFE.right - SAFE.left, tw = full - 200;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: tw, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full - 20, single: true, where: 'the compare label' }) : null;
  const wh = was.height + 50, nh = now.height + 70, lh = label ? label.lead + 30 : 0;
  const top = kit.place(lh + wh + 60 + nh, 700), yLabel = top + (label ? label.lead / 2 : 0);
  const ww = Math.min(full - 60, was.width + 160), nw = Math.min(full, now.width + 200);
  const wx = rtl ? SAFE.right - ww : SAFE.left, wy = top + lh, nx = rtl ? SAFE.right - nw : SAFE.left, ny = wy + wh + 60;
  const wasSlab = M.plane(ww, wh, P.plane, [P.paint, P.ground], 61, { row: 48 });
  const nowSlab = M.plane(nw, nh, P.accent, [P.paint, P.ground], 62, { row: 52 });
  const band = M.plane(ww + 120, wh * 0.22, P.ground, [P.paint, P.ground, P.accent], 63, { row: wh * 0.22, pad: 14 });
  const tCover = at + T.dur.cover, tNow = tCover + 0.45;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - T.dur.out, d);
      if (label) M.knife(ctx, { x: SAFE.left - 20, y: top, w: full + 40, h: label.lead }, span(t, at, at + T.dur.pass * 0.8), q, rtl,
        () => M.relief(kit, ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.muted, surface: P.ground }), null);
      M.knife(ctx, { x: wx, y: wy, w: ww, h: wh }, span(t, at + 0.15, at + 0.15 + T.dur.pass), q, rtl, () => {
        M.drawPlane(ctx, wasSlab, wx, wy);
        M.relief(kit, ctx, was, { x0: wx + 70, x1: wx + ww - 70, y: wy + 25 + was.lead / 2, color: P.muted, key: P.muted, surface: P.plane });
      }, P.lift(P.plane, 0.15));
      // the burying stroke: a slanted band of the ground's paint dragged across the old value
      const bx = wx - 60, by = wy + wh * 0.42;
      ctx.save(); ctx.translate(wx + ww / 2, wy + wh / 2); ctx.rotate((rtl ? 1 : -1) * T.cover.tilt); ctx.translate(-(wx + ww / 2), -(wy + wh / 2));
      M.knife(ctx, { x: bx, y: by, w: band.w, h: band.h }, span(t, tCover, tCover + T.dur.pass * 0.8), q, rtl, () => M.drawPlane(ctx, band, bx, by), P.lift(P.ground, 0.2));
      ctx.restore();
      M.knife(ctx, { x: nx, y: ny, w: nw, h: nh }, span(t, tNow, tNow + T.dur.pass), q, rtl, () => {
        M.drawPlane(ctx, nowSlab, nx, ny);
        M.relief(kit, ctx, now, { x0: nx + 80, x1: nx + nw - 80, y: ny + 35 + now.lead / 2, color: P.onAccent, key: P.onAccent, surface: P.accent });
      }, P.lift(P.accent, 0.25));
    },
  };
}
