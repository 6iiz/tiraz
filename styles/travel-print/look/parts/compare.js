// Before and after, as two pulls of a poster. The old value is printed in the muted ink; a band of the accent is pulled straight
// through it (the strike is a printed stripe, opaque, over the words). Then the new value is printed on the poster's information
// band: a full-width bar of the key ink with the words knocked out in paper, and a thin accent line under it.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: x1 - x0 - 80, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: x1 - x0, single: true, where: 'the compare label' }) : null;
  const bandH = now.height + 70, head = label ? label.lead + 40 : 0, block = head + was.height + 60 + bandH;
  const top = Math.min(kit.place(block, 720), T.floor - block);
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + head + was.lead / 2, yBand = top + head + was.height + 60, yNow = yBand + 35 + now.lead / 2;
  const sw = Math.min(x1 - x0, was.width + 90);
  const tW = at + 0.1, tC = at + 0.75, tN = at + 1.25;
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) M.pull(ctx, span(t, at, at + T.dur.pull * 0.8), { x0, x1, y0: top - 6, y1: top + label.lead + 6 }, P.muted, P,
        () => kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: P.muted, key: P.muted }), { rtl, seed: 2 });
      M.pull(ctx, span(t, tW, tW + T.dur.pull), { x0, x1, y0: yWas - was.lead / 2, y1: yWas + was.height - was.lead / 2 }, P.muted, P,
        () => kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'center', color: P.muted, key: P.muted }), { rtl, seed: 4 });
      const ys = yWas + (was.rows.length - 1) * was.lead / 2;
      M.pull(ctx, span(t, tC, tC + T.dur.pull * 0.8), { x0: W / 2 - sw / 2, x1: W / 2 + sw / 2, y0: ys - 20, y1: ys + 20 }, P.accent, P, () => {
        ctx.fillStyle = P.ghost; ctx.fillRect(W / 2 - sw / 2 + 3, ys - 7, sw, 16);
        ctx.fillStyle = P.accent; ctx.fillRect(W / 2 - sw / 2, ys - 9, sw, 16);
      }, { rtl, seed: 8 });
      M.pull(ctx, span(t, tN, tN + T.dur.pull * 1.1), { x0: SAFE.left - 20, x1: SAFE.right + 20, y0: yBand, y1: yBand + bandH + 18 }, P.ink, P, () => {
        ctx.fillStyle = P.ghost; ctx.fillRect(SAFE.left - 20 + 3, yBand + 3, SAFE.right - SAFE.left + 40, bandH);
        ctx.fillStyle = P.ink; ctx.fillRect(SAFE.left - 20, yBand, SAFE.right - SAFE.left + 40, bandH);
        ctx.fillStyle = P.accent; ctx.fillRect(SAFE.left - 20, yBand + bandH + 8, SAFE.right - SAFE.left + 40, 8);
        kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'center', color: P.paper, key: P.paper });
      }, { rtl, seed: 12 });
    },
  };
}
