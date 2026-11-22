// Before and after as two cut panels on opposed slants. The old value is printed on a quiet panel turned one way and struck through by
// a bar of the accent; then the new value slams in on an accent panel turned the other way, over the old one's corner, with a wedge
// radiating from behind it. Values may be words or numbers (the poster states them, it does not chart them).
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, tilt = T.tilt;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = M.palette(brand, T);
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const pw = 760, tw = pw - 120;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: tw, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left - 40, single: true, where: 'the compare label' }) : null;
  const ph = Math.max(was.height, now.height) + 90, yLabel = 340;
  const wasC = [W / 2 + (rtl ? 70 : -70), 560], nowC = [W / 2 + (rtl ? -60 : 60), 560 + ph + 40];
  const wasInk = pal.readable(pal.onPanel, 0.25, pal.panel);
  const tNow = at + 1.0, tCut = at + 0.6;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      if (label) {
        const pm = M.E(span(t, at, at + 0.3)) * keep;
        if (pm > 0) { ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? SAFE.right - 22 : SAFE.left, yLabel - 11, 22, 22 * pm); }
        kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right - 40, y: yLabel, align: 'start', color: pal.text,
          each: (w, i, box, c) => {
            if (M.arrive(c, span(t, at + i * T.dur.stagger, at + i * T.dur.stagger + T.dur.in), box, label.size) === false) return false;
            if (M.leave(c, out, box, label.size) === false) return false;
          } });
      }
      // the wedge behind the new panel
      const pw2 = M.E(span(t, tNow + 0.1, tNow + 0.6)) * keep;
      if (pw2 > 0) M.wedge(ctx, nowC[0], nowC[1], rtl ? 20 : 160 - 34 * pw2, rtl ? 20 + 34 * pw2 : 160, 1100, pal.wedge);
      M.block(ctx, wasC[0], wasC[1], tilt, span(t, at + 0.15, at + 0.15 + T.dur.slam), out, (off) => {
        ctx.fillStyle = pal.panel; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
        if (off < M.SETTLE) kit.drawText(ctx, was, { x0: -tw / 2, x1: tw / 2, y: -was.height / 2 + was.lead / 2, color: wasInk, key: wasInk });
        const c = M.E(span(t, tCut, tCut + 0.3));                     // the strike, thrown across the old value
        if (c > 0) { ctx.fillStyle = pal.accent; ctx.save(); ctx.rotate(M.rad(-tilt * 1.6)); const L = (pw + 60) * c; ctx.fillRect(rtl ? pw / 2 + 30 - L : -pw / 2 - 30, -5, L, 10); ctx.restore(); }
      });
      M.block(ctx, nowC[0], nowC[1], -tilt * 0.8, span(t, tNow, tNow + T.dur.slam), out, (off) => {
        ctx.fillStyle = pal.accent; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
        ctx.fillStyle = pal.paper; ctx.fillRect(rtl ? -pw / 2 : pw / 2 - 24, -ph / 2, 24, ph);    // a paper edge on the far side, like a pasted cut
        if (off < M.SETTLE) kit.drawText(ctx, now, { x0: -tw / 2, x1: tw / 2, y: -now.height / 2 + now.lead / 2, color: pal.onAccent, key: pal.onAccent });
      }, -900);
    },
  };
}
