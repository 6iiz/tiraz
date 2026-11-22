// Before and after as a re-scan. The old value is scanned in grey; a cutting plane (one hairline) slices through it and it breaks back
// into its returns, which fall away into the cloud. Then the new value is scanned in, solid, with a dimension line under it in the
// accent. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const X0 = SAFE.left + 10, X1 = SAFE.right - 10, maxW = X1 - X0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 0.92, minPx: 44, where: 'the compare label' }) : null;
  const lH = label ? label.height + 40 : 0, top = kit.place(lH + Math.max(was.height, now.height) + 40, 600);
  const aL = label && { x0: X0, x1: X1, y: top + label.lead / 2, align: 'start' };
  const aW = { x0: X0, x1: X1, y: top + lH + was.lead / 2, align: 'start' };
  const aN = { x0: X0, x1: X1, y: top + lH + now.lead / 2, align: 'start' };      // the new value takes the old one's place
  const samp = (f, a) => Object.assign(M.sampleText(kit, f, a, T.step.line), { x0: X0, x1: X1 });
  const out0 = d - T.dur.out, cutT = at + 1.25, nowT = cutT + 0.3;
  const sL = label && M.scanned(samp(label, aL), { t0: at, sweep: 0.3, land: T.dur.land, out0, outDur: T.dur.out });
  const wasS = samp(was, aW), sW = M.scanned(wasS, { t0: at + 0.15, sweep: T.dur.sweep, land: T.dur.land });
  const sN = M.scanned(samp(now, aN), { t0: nowT, sweep: T.dur.sweep, land: T.dur.land, out0, outDur: T.dur.out });
  const nb = M.layout(kit, now, aN), nx0 = Math.min(...nb.map((b) => b.x)), nx1 = Math.max(...nb.map((b) => b.x + b.width));
  const clipDraw = (ctx, f, a, color) => (y0, y1) => { ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, y1 - y0); ctx.clip(); kit.drawText(ctx, f, { ...a, color, key: color }); ctx.restore(); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (sL) sL.draw(ctx, t, { text: pal.grey, key: pal.grey, front: pal.key }, clipDraw(ctx, label, aL, pal.grey));
      if (t < cutT) sW.draw(ctx, t, { text: pal.grey, key: pal.grey, front: pal.key }, clipDraw(ctx, was, aW, pal.grey));
      else {                                                                // the old value falls apart into returns
        const q = span(t, cutT, cutT + 0.75);
        if (q < 1) {
          ctx.save(); ctx.globalAlpha = 1 - M.inC(q); ctx.fillStyle = pal.grey;
          for (const p of wasS.pts) { const e = M.inC(Math.min(1, q * 1.3 - p.j * 0.3 + 0.05)); ctx.fillRect(p.x + p.ox * 0.5 * e, p.y + (60 + p.z * 260) * e, 2.4, 2.4); }
          ctx.restore();
        }
      }
      const cp = span(t, cutT - 0.22, cutT + 0.05);                         // the cutting plane passes through the old value
      if (cp > 0 && cp < 1) {
        const w = (X1 - X0) * M.outC(cp), x = kit.rtl ? X1 - w : X0;
        ctx.fillStyle = rgba(pal.key, 0.2); ctx.fillRect(x, aW.y - 8, w, 16); ctx.fillStyle = pal.accent; ctx.fillRect(x, aW.y - 1.5, w, 3);
      }
      sN.draw(ctx, t, { text: pal.light, key: pal.light, front: pal.key }, clipDraw(ctx, now, aN, pal.light));
      const dp = M.outC(span(t, nowT + 0.45, nowT + 0.85)) * (1 - M.inC(span(t, out0, d)));
      if (dp > 0) {                                                         // the dimension line under the new value
        const y = aN.y + now.size * 0.82, w = (nx1 - nx0) * dp, xa = kit.rtl ? nx1 - w : nx0;
        ctx.fillStyle = pal.accent; ctx.fillRect(xa, y - 1.5, w, 3);
        const xs = kit.rtl ? nx1 : nx0, xe = kit.rtl ? nx0 : nx1;
        ctx.fillRect(xs - 1.5, y - 14, 3, 28); if (dp > 0.97) ctx.fillRect(xe - 1.5, y - 14, 3, 28);
      }
    },
  };
}
