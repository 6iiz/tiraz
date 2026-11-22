// Before and after, as a plate is cancelled and a new one cut. The old value is engraved in a soft ink; then it is cancelled the way an
// engraver cancels a worn plate: two long scored lines cut across it in an X, each swelling as it runs. The new value is engraved below
// in full ink, framed by two rules, and a wash of the accent is laid over it once it is solid. To leave, the plate is wiped.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const full = SAFE.right - SAFE.left;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: full - 40, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: full, single: true, where: 'the compare label' }) : null;
  const lh = label ? label.lead + 46 : 0, gap = 90;
  const top = kit.place(lh + was.height + gap + now.height, 720), cx = W / 2;
  const yW = top + lh + was.lead / 2, yN = top + lh + was.height + gap + now.lead / 2;
  const xw = was.width / 2 + 40, tX = at + 0.95, tNow = at + 1.4;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.wiped(ctx, span(t, d - T.dur.out, d), W, H, rtl, () => {
        if (label) {
          kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: top + label.lead / 2, color: P.soft,
            each: (w, i, box, c) => M.engrave(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.word), box, label.size, P.soft, rtl) });
          M.ornament(ctx, cx, top + label.lead + 12, 360, span(t, at + 0.1, at + 0.6), P);
        }
        kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yW, color: P.soft, key: P.soft,
          each: (w, i, box, c) => M.engrave(c, span(t, at + 0.15 + i * T.dur.step, at + 0.15 + i * T.dur.step + T.dur.word), box, was.size, P.soft, rtl) });
        ctx.fillStyle = P.ink;                               // the cancellation
        const h = was.size * 0.62 + (was.rows.length - 1) * was.lead / 2, s = rtl ? 1 : -1, ym = yW + (was.rows.length - 1) * was.lead / 2;
        M.swell(ctx, cx + s * xw, ym - h, cx - s * xw, ym + h, 5, M.E(span(t, tX, tX + 0.25)));
        M.swell(ctx, cx + s * xw, ym + h, cx - s * xw, ym - h, 5, M.E(span(t, tX + 0.2, tX + 0.45)));
        const pr = M.E(span(t, tNow, tNow + 0.5)), rw = (now.width / 2 + 70) * pr;
        if (pr > 0) { M.swell(ctx, cx - rw, yN - now.lead / 2 - 6, cx + rw, yN - now.lead / 2 - 6, 2.6); M.swell(ctx, cx - rw, yN - now.lead / 2 + now.height + 6, cx + rw, yN - now.lead / 2 + now.height + 6, 2.6); }
        kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yN, color: P.ink, key: P.ink,
          each: (w, i, box, c) => M.engrave(c, span(t, tNow + i * T.dur.step, tNow + i * T.dur.step + T.dur.word), box, now.size, P.ink, rtl) });
        M.wash(ctx, cx, yN + 4 + (now.rows.length - 1) * now.lead / 2, now.width / 2 + 60, now.lead * 0.5 * now.rows.length + 10, span(t, tNow + T.dur.word + 0.15, tNow + T.dur.word + 0.15 + T.dur.wash), P, 88);
      });
    },
  };
}
