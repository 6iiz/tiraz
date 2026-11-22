// Before and after as two pulls of one print. The first pull comes off under-inked: a pale proof of the photograph with the old
// value in grey, which the printer then strikes out with a rule of the shadow ink. A second leaf is pulled over the same sheet and
// the photograph comes up in its full two inks, with the new value printed in the dark ink below.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = (spec.at ?? 0) - look.tokens.dur.pre,  // the pull starts under the joint, so a cut never shows a blank sheet
        d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.88, where: 'the compare label' }) : null;
  const block = (label ? label.height + 6 : 0) + was.height + 20 + now.height;
  const top = Math.max(T.photo.y + 300 + 40, kit.place(block, 1030));
  const win = { x: SAFE.left, y: T.photo.y, w: maxW, h: top - 40 - T.photo.y };
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + (label ? label.height + 6 : 0) + was.lead / 2, yNow = yWas + was.height / 2 + 20 + now.lead / 2;
  const ph = M.photo('sea', Math.round(win.w * T.photo.res), Math.round(win.h * T.photo.res), 23);
  const pale = M.print(ph, ground.LUT.pale), rich = M.print(ph, ground.LUT.rich);
  const pl1 = M.peel({ x: SAFE.left - 20, y: win.y - 20, w: maxW + 40, h: yWas + was.height / 2 + 10 - win.y + 20 }, rtl);
  const pl2 = M.peel({ x: SAFE.left - 20, y: win.y - 20, w: maxW + 40, h: yNow + now.height / 2 + 20 - win.y + 20 }, rtl);
  const tCut = at + T.dur.peel + 0.3, tNow = at + 1.3;
  const wasW = was.rows[0].width;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const s1 = M.pull(pl1, t, at, T.dur.peel), s2 = M.pull(pl2, t, tNow, T.dur.peel);
      ctx.save(); pl1.clip(ctx, s1); M.framed(ctx, pale, win, T.photo.push * span(t, at, d)); ctx.restore();
      if (s2 > 0) { ctx.save(); pl2.clip(ctx, s2); M.framed(ctx, rich, win, T.photo.push * span(t, at, d)); ctx.restore(); }
      const o = { t, pl: pl1, t0: at, dur: T.dur.peel, P, T, x0: SAFE.left, x1: SAFE.right };
      if (label) M.press(ctx, kit, label, { ...o, y: yLabel, color: P.grey });
      M.press(ctx, kit, was, { ...o, y: yWas, color: P.grey });
      const pc = ease.outCubic(span(t, tCut, tCut + 0.3));               // the strike, drawn along its length from the reading side
      if (pc > 0) { const w = (wasW + 40) * pc; ctx.fillStyle = P.deep; ctx.fillRect(rtl ? SAFE.right + 20 - w : SAFE.left - 20, yWas - 4, w, 10); }
      pl1.flap(ctx, s1, P.back);
      M.press(ctx, kit, now, { ...o, pl: pl2, t0: tNow, y: yNow });
      pl2.flap(ctx, s2, P.back);
    },
  };
}
