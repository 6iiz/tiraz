// Before and after with scissors: the old value is pasted on a plain paper card; the scissors run a serrated cut across it and the
// lower half falls away as an offcut. Then a card of red paper, folded in half, is pasted below and snaps open ("pa!") with the new value.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE, mix } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const was = kit.fit(asText(S.was), { size: T.size.compare, weight: 800, maxW: maxW - 140, single: true, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: Math.round(T.size.compare * 1.25), weight: 900, maxW: maxW - 140, single: true, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, single: true, where: 'the compare label' }) : null;
  const cw = Math.min(maxW, Math.max(was.width, now.width) + 160), wh = was.size * 1.9, nh = now.size * 1.8;
  const labH = label ? label.size * 1.6 + 30 : 0, top = kit.place(labH + wh + 70 + nh, 720);
  const yLab = top + (label ? label.size * 0.8 : 0), yWas = top + labH + wh / 2, yNow = top + labH + wh + 70 + nh / 2;
  const pale = mix(P.ground, P.txt, 0.1), wasCard = M.card(cw, wh, pale, 61), nowCard = M.card(cw, nh, P.red, 62);
  const tWas = at + 0.1, tCut = at + 0.6, tDrop = at + 1.0, tNow = at + 1.25, tOpen = at + 1.45;
  // the cut line: a zigzag across the card, a little above its middle on the reading side, lower on the far side
  const zig = []; for (let i = 0; i <= 24; i++) { const q = i / 24; zig.push([-cw / 2 - 10 + q * (cw + 20), (rtl ? -1 : 1) * (q - 0.5) * wh * 0.25 + (i % 2 ? 7 : -7)]); }
  if (rtl) zig.reverse();
  const upper = new Path2D(), lower = new Path2D();
  [upper, lower].forEach((p, j) => { p.moveTo(zig[0][0], zig[0][1]); zig.forEach(([x, y]) => p.lineTo(x, y)); const yy = j ? wh : -wh; p.lineTo(zig.at(-1)[0], yy); p.lineTo(zig[0][0], yy); p.closePath(); });
  const drawWas = (ctx, k) => { M.lay(ctx, wasCard, 0, 0, k); kit.drawText(ctx, was, { x0: -cw / 2 + 40, x1: cw / 2 - 40, y: was.size * 0.04, align: 'center', color: P.txt, key: P.txt }); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d); if (out >= 1) return;
      ctx.save(); ctx.translate(0, M.steps12(out) * 140);
      if (label) { const k = M.paste(t, at); if (k > 0) { ctx.save(); ctx.translate(W / 2, yLab); ctx.scale(k, k); ctx.translate(-W / 2, -yLab); kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLab, align: 'center', color: P.txt }); ctx.restore(); } }
      const kw = M.paste(t, tWas);
      if (kw > 0) {
        ctx.save(); ctx.translate(W / 2, yWas);
        if (t < tDrop) {
          drawWas(ctx, kw);
          const pc = span(t, tCut, tDrop - 0.05);                     // the scissors' track, drawn as the cut opens
          if (pc > 0) { ctx.strokeStyle = P.ground; ctx.lineWidth = 4; ctx.beginPath(); const n = Math.max(1, Math.round(pc * (zig.length - 1)));
            ctx.moveTo(zig[0][0], zig[0][1]); for (let i = 1; i <= n; i++) ctx.lineTo(zig[i][0], zig[i][1]); ctx.stroke(); }
        } else {
          ctx.save(); ctx.clip(upper); drawWas(ctx, 1); ctx.restore();
          const f = t - tDrop, y = 900 * f * f + 30 * f, a = (rtl ? -1 : 1) * f * 0.6;        // the offcut falls away
          if (y < 1400) { ctx.save(); ctx.translate(0, y); ctx.rotate(a); ctx.clip(lower); drawWas(ctx, 1); ctx.restore(); }
        }
        ctx.restore();
      }
      // the red card: pasted folded in half, then it opens over its middle fold
      const kn = M.paste(t, tNow);
      if (kn > 0) {
        const s = -1 + 2 * M.O(span(t, tOpen, tOpen + 0.2)), half = cw / 2, x = W / 2;
        ctx.save(); ctx.translate(x, yNow);
        ctx.save(); ctx.beginPath(); ctx.rect(rtl ? -half - 8 : 0, -nh, half + 8, nh * 2); ctx.clip(); M.lay(ctx, nowCard, 0, 0, kn); ctx.restore();
        ctx.save(); ctx.scale(rtl ? s : s, 1); ctx.beginPath(); ctx.rect(rtl ? 0 : -half - 8, -nh, half + 8, nh * 2); ctx.clip(); M.lay(ctx, nowCard, 0, 0, kn);
        if (s < 1) { ctx.fillStyle = s < 0 ? 'rgba(255,255,255,0.3)' : `rgba(0,0,0,${0.3 * (1 - s)})`; ctx.fillRect(rtl ? 0 : -half - 8, -nh / 2, half + 8, nh); }
        ctx.restore();
        if (s >= 1) { const k = M.paste(t, tOpen + 0.2); ctx.scale(k, k); kit.drawText(ctx, now, { x0: -half + 40, x1: half - 40, y: now.size * 0.04, align: 'center', color: P.onRed, key: P.onRed }); }
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
