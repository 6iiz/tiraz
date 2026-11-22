// Before and after, in glass. The old value sits behind frosted glass, dim and soft-edged; a hairline of light with the accent split
// under it cuts across it. Then a slab of clear glass is revealed below: its rim is drawn round by a comet of the accent, and the new
// value comes into focus on it, lit. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, rr, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal;
  const bx0 = 110, bx1 = W - 110, x0 = bx0 + 40, x1 = bx1 - 40;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 500, maxW: x1 - x0, minScale: 0.75, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 40, minPx: 44, where: 'the compare label' }) : null;
  const h1 = was.height + 60, h2 = now.height + 70, lh = label ? label.height + 50 : 0, total = lh + h1 + 90 + h2;
  const top = kit.place(total, 760), y1 = top + lh, y2 = y1 + h1 + 90;
  const cut = at + 0.85, reveal = at + 1.2, frost = mix(P.field, P.light, 0.1), dim = P.grey;
  const fade = (t0, size) => (w, i, box, c) => { const s = t0 + i * 0.05; if (M.arrive(c, span(t, s, s + T.dur.in), box, size) === false) return false; };
  let t = 0;
  const per = (x0r, y0r, w, h, r) => 2 * (w + h - 4 * r) + 2 * Math.PI * r;
  return {
    duration: d,
    draw(ctx, tt) {
      t = tt; ground.draw(ctx, t);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left + 20, x1: SAFE.right - 20, y: top + label.lead / 2, color: P.grey, each: fade(at, label.size) });
      // the frosted pane and the old value
      ctx.fillStyle = frost; rr(ctx, bx0, y1, bx1 - bx0, h1, 22); ctx.fill();
      ctx.strokeStyle = P.a(P.light, 0.2); ctx.lineWidth = 1.5; ctx.stroke();
      kit.drawText(ctx, was, { x0, x1, y: y1 + h1 / 2, color: dim, key: dim, each: fade(at + 0.15, was.size) });
      const k = M.IO(span(t, cut, cut + 0.3));
      if (k > 0) { const w = was.width + 60, xm = W / 2; M.hairline(ctx, P, xm - w / 2, xm + w / 2, y1 + h1 / 2 - 1, k); }
      // the clear slab: its rim drawn round by the comet, then the new value focuses in
      const rp = span(t, reveal, reveal + 0.55);
      if (rp > 0) {
        const len = per(bx0, y2, bx1 - bx0, h2, 26);
        ctx.save(); ctx.globalAlpha = M.IO(rp); ctx.fillStyle = P.keyText === P.light ? P.keySlab : P.a(P.light, 0.05); rr(ctx, bx0, y2, bx1 - bx0, h2, 26); ctx.fill(); ctx.globalAlpha = 1;
        ctx.setLineDash([len * M.IO(rp), len]); ctx.lineDashOffset = 0;
        ctx.save(); ctx.translate(2.5, 1); ctx.strokeStyle = P.a(P.accent, 0.75); ctx.lineWidth = 2.4; rr(ctx, bx0, y2, bx1 - bx0, h2, 26); ctx.stroke(); ctx.restore();
        ctx.strokeStyle = P.a(P.light, 0.9); ctx.lineWidth = 2; rr(ctx, bx0, y2, bx1 - bx0, h2, 26); ctx.stroke();
        ctx.restore();
        const sx = ground.sweep(t);
        if (sx !== null) { ctx.save(); rr(ctx, bx0, y2, bx1 - bx0, h2, 26); ctx.clip(); const g = ctx.createLinearGradient(sx - 80, 0, sx + 80, 0);
          g.addColorStop(0, P.a(P.light, 0)); g.addColorStop(0.5, P.a(P.light, 0.16)); g.addColorStop(1, P.a(P.light, 0)); ctx.fillStyle = g; ctx.fillRect(sx - 80, y2, 160, h2); ctx.restore(); }
      }
      kit.drawText(ctx, now, { x0, x1, y: y2 + h2 / 2, color: P.keyText, key: P.keyText, each: fade(reveal + 0.25, now.size) });
    },
  };
}
