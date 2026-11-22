// Before and after: the old value is a grey brick on the desk; a push knocks it over, and in held poses it tips and tumbles down to
// lie crooked below. Then the new value, on a brick of the accent, is set down where the old one stood and clicks into place.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: 640, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 120, minPx: 44, where: 'the compare label' }) : null;
  const cx = W / 2, yLabel = 520, yVal = 740, bh = Math.round(was.lead);
  const box = (f) => { const w = Math.max(f.width + f.size * 1.1, 300); return { l: cx - w / 2, r: cx + w / 2 }; };
  const bw = box(was), bn = box(now);
  const pcW = M.piece(P, bw.r - bw.l, bh, P.mid), pcN = M.piece(P, bn.r - bn.l, bh, P.accent);
  const tile = label ? (() => { const w = label.width + 56; return { l: cx - w / 2, r: cx + w / 2, pc: M.piece(P, w, label.lead * 0.88, P.tile, { studs: false, deep: 16 }) }; })() : null;
  const cutT = at + 0.9, nowT = at + 1.4, tOut = d - 4 * M.POSE;
  // the tumble: held poses after the push (dx, dy, degrees), the last one is where it comes to rest
  const FALL = [[0, 0, 0], [-10, 4, -5], [-34, 40, -13], [-60, 130, -17], [-72, 230, -9], [-76, 262, -6]];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.Q(t), [ox, oy] = ground.cam(t);
      ctx.save(); ctx.translate(ox, oy);
      if (tile) {
        const pose = M.poseAt(tq, at, tOut);
        if (pose) {
          ctx.save(); M.apply(ctx, pose, cx, yLabel); M.put(ctx, tile.pc, tile.l, yLabel - label.lead * 0.44);
          kit.drawText(ctx, label, { x0: tile.l + 28, x1: tile.r - 28, y: yLabel, align: 'center', color: P.onTile }); ctx.restore();
        }
      }
      const pw = M.poseAt(tq, at + 2 * M.POSE, tOut + M.POSE);
      if (pw) {
        const k = tq < cutT ? -1 : Math.min(FALL.length - 1, Math.floor((tq - cutT) / M.POSE + 1e-6)), [fx, fy, fr] = k < 0 ? [0, 0, 0] : FALL[k];
        ctx.save(); M.apply(ctx, pw, cx, yVal);
        ctx.translate(cx + fx * (rtl ? 1 : -1), yVal + fy); ctx.rotate((fr * (rtl ? 1 : -1) * Math.PI) / 180); ctx.translate(-cx, -yVal);
        M.put(ctx, pcW, bw.l, yVal - bh / 2);
        kit.drawText(ctx, was, { x0: bw.l, x1: bw.r, y: yVal, align: 'center', color: P.onMid, key: P.onMid });
        ctx.restore();
      }
      const pn = M.poseAt(tq, nowT, tOut);
      if (pn) {
        ctx.save(); M.apply(ctx, pn, cx, yVal); M.put(ctx, pcN, bn.l, yVal - bh / 2);
        kit.drawText(ctx, now, { x0: bn.l, x1: bn.r, y: yVal, align: 'center', color: P.onAccent, key: P.onAccent }); ctx.restore();
      }
      ctx.restore();
    },
  };
}
