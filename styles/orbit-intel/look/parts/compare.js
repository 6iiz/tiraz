// Before and after as two passes over the same ground. The caption plate holds the old value in grey; a hairline strikes it, and at
// the same moment a divider sweeps across the picture from the reading side, uncovering the later pass, where a new district stands;
// its buildings are outlined in the class colour. The new value settles under the old one and the reticle locks on it, tethered to
// the new district. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, P = T.plate;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, rtl = kit.rtl;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const X0 = SAFE.left + 20, X1 = SAFE.right - 20, maxW = X1 - X0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.lead, weight: 500, maxW, minScale: 0.92, minPx: 44, where: 'the compare label' }) : null;
  const lH = label ? label.height + 16 : 0, top = kit.place(lH + was.height + 24 + now.height, 560);
  const aL = label && { x0: X0, x1: X1, y: top + label.lead / 2, align: 'start' };
  const aW = { x0: X0, x1: X1, y: top + lH + was.lead / 2, align: 'start' }, aN = { x0: X0, x1: X1, y: top + lH + was.height + 24 + now.lead / 2, align: 'start' };
  const py0 = top - P.pad + 6, py1 = top + lH + was.height + 24 + now.height + P.pad - 14;
  const wb = M.layout(kit, was, aW), wx0 = Math.min(...wb.map((b) => b.x)), wx1 = Math.max(...wb.map((b) => b.x + b.width));
  const nb = M.layout(kit, now, aN), run = { x0: Math.min(...nb.map((b) => b.x)), x1: Math.max(...nb.map((b) => b.x + b.width)), y: aN.y, row: 0 };
  const out0 = d - T.dur.out, cutT = at + 1.0, nowT = cutT + 0.3;
  const site = ground.C.site, ca = Math.cos(site.a), sa = Math.sin(site.a);
  const corner = (x, y) => ({ x: site.x + x * ca - y * sa, y: site.y + x * sa + y * ca });
  return {
    duration: d,
    draw(ctx, t) {
      const time = t + clock, sw = M.outC(span(t, cutT, cutT + 0.8)), wipeX = rtl ? W * (1 - sw) : W * sw;
      ground.draw(ctx, t, { wipe: sw, wipeX });
      const hold = 1 - M.inC(span(t, out0, out0 + T.dur.out * 0.6));
      if (sw > 0 && sw < 1) {                                            // the divider
        ctx.fillStyle = pal.light; ctx.fillRect(wipeX - 1.5, 0, 3, H);
        ctx.beginPath(); ctx.moveTo(wipeX, 1280); ctx.lineTo(wipeX + (rtl ? -18 : 18), 1300); ctx.lineTo(wipeX, 1320); ctx.fill();
      }
      if (sw > 0 && hold > 0) {                                          // the new buildings, outlined as they are uncovered
        ctx.save(); ctx.globalAlpha = hold; ctx.strokeStyle = pal.key; ctx.lineWidth = 2;
        site.sheds.forEach(([x, y, w, h], i) => {
          const q = span(t, cutT + 0.35 + i * 0.04, cutT + 0.6 + i * 0.04); if (q <= 0) return;
          const cs = [corner(x, y), corner(x + w, y), corner(x + w, y + h), corner(x, y + h)].map((c) => ground.toScreen(c.x, c.y, time));
          if (rtl ? Math.min(...cs.map((c) => c.x)) < wipeX : Math.max(...cs.map((c) => c.x)) > wipeX) return;
          ctx.beginPath(); cs.forEach((c, k) => (k ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y))); ctx.closePath(); ctx.stroke();
        });
        ctx.restore();
      }
      const pp = M.plateP(t, at, T.dur.open, out0, T.dur.out); if (pp <= 0) return;
      M.plate(ctx, pal, P.x0, py0, P.x1, py1, pp, rtl);
      const w = (P.x1 - P.x0) * M.snap(pp);
      ctx.save(); ctx.beginPath(); ctx.rect(rtl ? P.x1 - w : P.x0, py0, w, py1 - py0); ctx.clip();
      if (label) M.settle(kit, ctx, label, aL, t, at + 0.05, 0.04, T.dur.word, pal.grey, pal.grey);
      M.settle(kit, ctx, was, aW, t, at + 0.2, 0.05, T.dur.word, pal.grey, pal.grey);
      const k = M.snap(span(t, cutT - 0.15, cutT + 0.1));
      if (k > 0) { const sl = (wx1 - wx0 + 24) * k; ctx.fillStyle = pal.key; ctx.fillRect(rtl ? wx1 + 12 - sl : wx0 - 12, aW.y - 2, sl, 4); }
      M.settle(kit, ctx, now, aN, t, nowT, 0.05, T.dur.word, pal.light, pal.light);
      ctx.restore();
      const sc = ground.toScreen(site.x, site.y, time);
      M.lockOn(ctx, pal, run, now.size, sc, span(t, nowT + 0.2, nowT + 0.2 + T.dur.lock), hold, hold);
    },
  };
}
