// Before and after, as a teacher corrects a board: the old value is written in white chalk, struck through with a quick scribble,
// rubbed out with one pass of the felt (a pale smear stays behind), and the new value is written with the accent stick in the very
// same place, then underlined. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, rtl = kit.rtl;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 80, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the compare label' }) : null;
  const block = (label ? label.lead + 40 : 0) + was.lead, top = kit.place(block, 650);
  const yLabel = top + (label ? label.lead / 2 : 0), yV = top + (label ? label.lead + 40 : 0) + was.lead / 2;
  const T0 = at + 0.05, tW = T0 + 0.3, tS = tW + 0.6, tR = tS + 0.35, tN = tR + 0.45, tU = tN + 0.5;
  const sLabel = label ? M.schedule(label, T0, T0 + 0.35, 0.04) : [], sWas = M.schedule(was, tW, tW + 0.45, 0.05), sNow = M.schedule(now, tN, tN + 0.45, 0.05);
  const wb = { x0: W / 2 - was.width / 2, x1: W / 2 + was.width / 2, y0: yV - was.size * 0.75, y1: yV + was.size * 0.75 };
  const strike = M.scribble(510, wb.x0 - 10, wb.x1 + 10, yV + 4, was.size * 0.45, rtl);
  const nb = { x0: W / 2 - now.width / 2, x1: W / 2 + now.width / 2 }, yU = yV + now.size * 0.68;
  const under = rtl ? M.stroke(520, nb.x1 + 16, yU, nb.x0 - 16, yU + 4, 6) : M.stroke(520, nb.x0 - 16, yU, nb.x1 + 16, yU + 4, 6);
  const writer = (t, sched, size) => (w, i, box, c) => { if (M.write(c, span(t, sched[i].s, sched[i].e), box, size, w.arabic) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const white = M.chalk(ctx, P.chalk), dim = M.chalk(ctx, P.dim, 13), acc = M.chalk(ctx, P.accent, 17);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, color: dim, key: dim, each: writer(t, sLabel, label.size) });
      const old = () => {
        kit.drawText(ctx, was, { x0, x1, y: yV, color: white, key: white, each: writer(t, sWas, was.size) });
        M.trace(ctx, strike, span(t, tS, tS + 0.22), T.chalk.line, white);
      };
      M.rubOut(ctx, span(t, tR, tR + 0.38), wb, rtl, P, old);
      kit.drawText(ctx, now, { x0, x1, y: yV, color: acc, key: acc, each: writer(t, sNow, now.size) });
      M.trace(ctx, under, span(t, tU, tU + 0.25), T.chalk.line, acc);
    },
  };
}
