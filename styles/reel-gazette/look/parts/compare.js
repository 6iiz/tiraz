// Before and after as two press clippings slapped down on the table. The old one lands a little askew and a grease pencil scrawls across
// its words in the accent; then the new one is slapped down over its corner, turned the other way, its value tinted by hand. The label is
// a small title card above. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const CW = 780, tw = CW - 120;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW: tw, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: 700, maxW: SAFE.right - SAFE.left - 120, single: true, where: 'the compare label' }) : null;
  const ch = Math.max(was.height, now.height) + 110, yLabel = 360, labH = label ? label.lead + 50 : 0;
  const yWas = (label ? yLabel + labH / 2 + 40 : 380) + ch / 2, yNow = yWas + ch * 0.82 + 30;
  const cxWas = W / 2 + (rtl ? 40 : -40), cxNow = W / 2 + (rtl ? -40 : 40);
  const tWas = at + 0.15, tCut = at + 0.75, tNow = at + 1.25, slap = T.dur.slap;
  const clip = (ctx, t, cx, cy, deg, p, draw) => {
    if (p <= 0) return;
    const e = M.O(p), s = 1 + 0.3 * (1 - e);
    ctx.save(); ground.weave(ctx, t); ctx.translate(cx, cy); ctx.rotate((deg * Math.PI) / 180); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, p * 4);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-CW / 2 + 12 * e, -ch / 2 + 16 * e, CW, ch);
    ctx.fillStyle = P.paper; ctx.fillRect(-CW / 2, -ch / 2, CW, ch);
    ctx.fillStyle = P.bar; ctx.fillRect(-CW / 2 + 40, ch / 2 - 34, CW - 80, 7); ctx.fillRect(-CW / 2 + 40, -ch / 2 + 26, CW * 0.4, 7);
    draw(); ctx.restore();
  };
  // the grease pencil: a wobbly stroke across the old value, drawn from the reading side
  const pts = []; { const n = 26; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([(rtl ? 1 - u : u) * (was.width + 80) - (was.width + 80) / 2, Math.sin(u * 9) * 9 + (u - 0.5) * 18]); } }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const f = M.q(t);
      if (label) {
        const pl = M.O(span(f, at, at + 0.25));
        if (pl > 0) {
          ctx.save(); ctx.globalAlpha = Math.min(1, pl * 3);
          ctx.fillStyle = P.card; ctx.fillRect(SAFE.left + 60, yLabel - labH / 2, SAFE.right - SAFE.left - 120, labH);
          M.frame(ctx, SAFE.left + 66, yLabel - labH / 2 + 6, SAFE.right - SAFE.left - 132, labH - 12, P.rule, P.accent);
          kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, color: P.light, key: P.light });
          ctx.restore();
        }
      }
      clip(ctx, t, cxWas, yWas, rtl ? 2.5 : -2.5, span(f, tWas, tWas + slap), () => {
        kit.drawText(ctx, was, { x0: -tw / 2, x1: tw / 2, y: -was.height / 2 + was.lead / 2 + 6, color: P.dark, key: P.dark });
        const k = span(f, tCut, tCut + 0.3);
        if (k > 0) {
          ctx.strokeStyle = P.accent; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
          const m = Math.max(1, Math.round(k * (pts.length - 1)));
          ctx.moveTo(pts[0][0], pts[0][1] + 6); for (let i = 1; i <= m; i++) ctx.lineTo(pts[i][0], pts[i][1] + 6); ctx.stroke();
        }
      });
      clip(ctx, t, cxNow, yNow, rtl ? -2 : 2, span(f, tNow, tNow + slap), () => {
        const yy = -now.height / 2 + now.lead / 2 + 6, pad = now.size * 0.2;
        if (f >= tNow + slap) M.tint(ctx, -now.width / 2 - pad, yy - now.size * 0.62, now.width + pad * 2, now.size * 1.24 * now.rows.length + (now.rows.length - 1) * (now.lead - now.size * 1.24), P.accent, 91);
        kit.drawText(ctx, now, { x0: -tw / 2, x1: tw / 2, y: yy, color: f >= tNow + slap ? P.onAccent : P.dark, key: f >= tNow + slap ? P.onAccent : P.dark });
      });
      ground.over(ctx, t);
    },
  };
}
