// A number counted in bricks: on the far side a tower is stacked one brick at a time (each set down in four held poses), and the big
// numeral beside it jumps to its next value each time a brick clicks into place, landing on the true value with the last, accent
// brick. The label is printed on flat tiles under the numeral. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const N = 6, bw = 150, bh = 84, towerX = rtl ? SAFE.left + 30 : SAFE.right - 30 - bw, base = 1215;
  const room = SAFE.right - SAFE.left - bw - 100;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > room && size > 100) size -= 8;
  const label = M.balanced(kit, S.label, { size: T.size.label, weight: T.weight.label, maxW: room - 60, minPx: 44, where: 'the count label' });
  const xs = rtl ? [SAFE.right - 20 - room, SAFE.right - 20] : [SAFE.left + 20, SAFE.left + 20 + room];
  const yNum = 560, yLabel = yNum + size * 0.62 + 50 + label.lead / 2;
  const bricks = Array.from({ length: N }, (_, k) => ({ y0: base - (k + 1) * bh, t0: at + 0.05 + k * 3.5 * M.POSE, tOut: d - 4 * M.POSE - (N - 1 - k) % 2 * M.POSE,
    pc: M.piece(P, bw, bh, k === N - 1 ? P.accent : k % 2 ? P.mid : P.brick, { pitch: 75 }) }));
  const tiles = label.rows.map((row, r) => { const y = yLabel + r * label.lead, w = row.width + 52, x1 = rtl ? xs[1] : xs[0] + w;
    return { y, l: x1 - w, r: x1, t0: at + 0.2 + r * 2 * M.POSE, pc: M.piece(P, w, label.lead * 0.88, P.tile, { studs: false, deep: 16 }) }; });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.Q(t), [cx, cy] = ground.cam(t);
      ctx.save(); ctx.translate(cx, cy);
      let seated = 0;
      for (let k = N - 1; k >= 0; k--) { const b = bricks[k]; if (tq >= b.t0 + 3 * M.POSE - 1e-6) seated = Math.max(seated, k + 1); }
      for (const b of bricks) {                     // bottom first, so each brick covers the studs of the one under it
        const pose = M.poseAt(tq, b.t0, b.tOut); if (!pose) continue;
        ctx.save(); M.apply(ctx, pose, towerX + bw / 2, b.y0 + bh / 2); M.put(ctx, b.pc, towerX, b.y0); ctx.restore();
      }
      const outPose = M.takeAway(tq, d - 4 * M.POSE);
      if (outPose) {
        ctx.save(); M.apply(ctx, outPose, W / 2, yNum);
        const v = seated >= N ? S.value : (S.value * seated) / N;
        kit.number(ctx, text(seated >= N ? S.value : Math.round(v * 10 ** (spec.decimals ?? 0)) / 10 ** (spec.decimals ?? 0)), { x: rtl ? xs[1] : xs[0], y: yNum, size, color: P.text, align: rtl ? 'right' : 'left', settle: 1 });
        ctx.restore();
      }
      for (const tl of tiles) {
        const pose = M.poseAt(tq, tl.t0, d - 4 * M.POSE); if (!pose) continue;
        ctx.save(); M.apply(ctx, pose, (tl.l + tl.r) / 2, tl.y); M.put(ctx, tl.pc, tl.l, tl.y - label.lead * 0.44); ctx.restore();
      }
      kit.drawText(ctx, label, { x0: xs[0] + (rtl ? 0 : 26), x1: xs[1] - (rtl ? 26 : 0), y: yLabel, align: 'start', color: P.onTile,
        each: (w, i, box, c) => { const tl = tiles[box.row], pose = M.poseAt(tq, tl.t0, d - 4 * M.POSE); if (!pose) return false; M.apply(c, pose, (tl.l + tl.r) / 2, tl.y); } });
      ctx.restore();
    },
  };
}
