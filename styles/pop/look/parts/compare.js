// Before and after, comic-style: the old value sits small in a plain panel tilted off to one side, in a soft ink tint; a chunky
// accent arrow with an ink outline pops in; then the new value explodes in on a big accent starburst, in the ink that reads on it,
// with action lines round it. Loud against quiet: the difference shows before a word is read. The label rides in a caption box.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const { arrive, zoom, panel, burstPath, burst, action, E } = await import(look.base + 'motion.js');
  const P = ground.P, rtl = kit.rtl, asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const was = kit.fit(asText(S.was), { size: T.size.compare * 0.62, weight: 700, maxW: SAFE.right - SAFE.left - 160, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare, weight: T.weight.line, maxW: SAFE.right - SAFE.left - 140, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 120, single: true, where: 'the compare label' }) : null;
  const lH = label ? label.lead + 14 : 0, lW = label ? label.width + 56 : 0, lX = rtl ? SAFE.right - lW - 30 : SAFE.left + 30, lY = 330;
  const wW = was.width + 90, wH = was.height + 40, wX = rtl ? SAFE.right - wW - 50 : SAFE.left + 50, wY = lY + lH + 40;
  const aY = wY + wH + 56, a = now.width / 2 + 30, b = now.height / 2 + 6, spike = now.size * 0.55;
  const cy = aY + 150 + spike + b, cx = W / 2, path = burstPath(cx, cy, a, b, spike, 20, 0.2);
  const cutT = at + 0.7, nowT = at + 1.1, out0 = d - T.dur.out;
  const arrow = (c, x, y) => {
    c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x + 30, y); c.lineTo(x + 30, y + 64); c.lineTo(x + 70, y + 64); c.lineTo(x, y + 130);
    c.lineTo(x - 70, y + 64); c.lineTo(x - 30, y + 64); c.closePath();
  };
  const pops = (t, t0, size) => (w, i, bx, c) => { const s0 = t0 + i * T.dur.step; if (arrive(c, span(t, s0, s0 + T.dur.in), bx, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d);
      action(ctx, cx, cy, a + spike + 20, a + spike + 80, 24, P, E(span(t, nowT, nowT + 0.4)) * (1 - q));
      if (label) {
        ctx.save();
        if (zoom(ctx, span(t, at, at + T.dur.panel), q, lX + lW / 2, lY + lH / 2, -0.03) !== false) {
          panel(ctx, lX, lY, lW, lH, P.accent, P, { ink: { line: T.ink.line * 0.75, shadow: T.ink.shadow * 0.6 } });
          kit.drawText(ctx, label, { x0: lX, x1: lX + lW, y: lY + lH / 2, color: P.on });
        }
        ctx.restore();
      }
      ctx.save();
      if (zoom(ctx, span(t, at + 0.12, at + 0.12 + T.dur.panel), q, wX + wW / 2, wY + wH / 2, rtl ? 0.04 : -0.04) !== false) {
        panel(ctx, wX, wY, wW, wH, P.paper, P, { ink: { line: T.ink.line * 0.6, shadow: T.ink.shadow * 0.5 } });
        kit.drawText(ctx, was, { x0: wX, x1: wX + wW, y: wY + 20 + was.lead / 2, color: P.soft, key: P.soft, each: pops(t, at + 0.25, was.size) });
      }
      ctx.restore();
      ctx.save();
      if (zoom(ctx, span(t, cutT, cutT + T.dur.panel), q, cx, aY + 65, 0) !== false) {
        ctx.save(); ctx.translate(T.ink.shadow * 0.7, T.ink.shadow * 0.7); arrow(ctx, cx, aY); ctx.fillStyle = P.ink; ctx.fill(); ctx.restore();
        arrow(ctx, cx, aY); ctx.fillStyle = P.accent; ctx.fill(); ctx.lineWidth = T.ink.line * 0.75; ctx.strokeStyle = P.ink; ctx.lineJoin = 'miter'; ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      if (zoom(ctx, span(t, nowT, nowT + T.dur.panel), q, cx, cy, -0.03) !== false) {
        burst(ctx, path, P.accent, P, T);
        kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: cy - now.height / 2 + now.lead / 2, color: P.on, key: P.on, each: pops(t, nowT + 0.12, now.size) });
      }
      ctx.restore();
    },
  };
}
