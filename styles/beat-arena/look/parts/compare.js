// Before and after as a judged round on the split stage: the old value on a paper card, struck through with an ink bar and stamped
// with a round miss badge (its words dim but stay legible); then the new value pops in below on an accent card with a burst and a round check badge: the round is won.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, set: 'split' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const cw = 780, cx0 = W / 2 - cw / 2;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: cw - 120, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: cw, minScale: 0.92, minPx: 44, where: 'the compare label' }) : null;
  const chW = was.height + 40, chN = now.height + 40, labH = label ? label.height + 18 : 0, labW = label ? label.width + 72 : 0;
  const yWas = 560, yNow = 830, labY = yWas - 56 - labH, labX = W / 2 - labW / 2;
  const cutT = at + 0.75, nowT = at + 0.75 + T.beat * 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.shrink(span(t, d - T.dur.out, d));
      if (out <= 0) return;
      ctx.save(); M.around(ctx, W / 2, 720, out);
      if (label) {
        const s = M.pop(span(t, at, at + T.dur.pop));
        if (s > 0) { ctx.save(); M.around(ctx, W / 2, labY + labH / 2, s); M.ribbon(ctx, labX, labY, labW, labH, pal);
          kit.drawText(ctx, label, { x0: labX + 36, x1: labX + labW - 36, y: labY + 9 + label.lead / 2, align: 'center', color: pal.paper }); ctx.restore(); }
      }
      const sw = M.pop(span(t, at + 0.15, at + 0.15 + T.dur.pop)), struck = M.ease(span(t, cutT, cutT + 0.15));
      if (sw > 0) {
        const ym = yWas + chW / 2;
        ctx.save(); M.around(ctx, W / 2, ym, sw * (1 - 0.06 * struck)); ctx.translate(0, 10 * struck);
        M.card(ctx, cx0, yWas, cw, chW, pal.paper, pal.ink, T);
        const c = struck > 0 ? pal.dim : pal.ink;
        kit.drawText(ctx, was, { x0: cx0 + 60, x1: cx0 + cw - 60, y: yWas + 20 + was.lead / 2, align: 'center', color: c, key: c });
        const xs = M.ease(span(t, cutT, cutT + 0.14));                       // a thick ink strike runs through, then the miss badge stamps
        if (xs > 0) { const sw2 = (was.width + 40) * xs; ctx.fillStyle = pal.ink; ctx.fillRect(kit.rtl ? W / 2 + (was.width + 40) / 2 - sw2 : W / 2 - (was.width + 40) / 2, ym - 5, sw2, 10); }
        const bs = M.pop(span(t, cutT + 0.1, cutT + 0.1 + T.dur.pop));
        if (bs > 0) {
          const bx = kit.rtl ? cx0 + 14 : cx0 + cw - 14, by = yWas + 4;
          ctx.save(); M.around(ctx, bx, by, bs);
          ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.arc(bx, by, 44, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = pal.paper; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath();
          ctx.moveTo(bx - 15, by - 15); ctx.lineTo(bx + 15, by + 15); ctx.moveTo(bx + 15, by - 15); ctx.lineTo(bx - 15, by + 15); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      const sn = M.pop(span(t, nowT, nowT + T.dur.pop)) * M.nod(t, nowT + 0.8, T.beat);
      if (sn > 0) {
        const ym = yNow + chN / 2;
        M.burst(ctx, W / 2, ym, cw / 2, chN / 2, span(t, nowT + 0.05, nowT + 0.45), pal.ink, 16);
        ctx.save(); M.around(ctx, W / 2, ym, sn);
        M.card(ctx, cx0, yNow, cw, chN, pal.accent, pal.ink, T, { stroke: 10, shadow: 18 });
        kit.drawText(ctx, now, { x0: cx0 + 60, x1: cx0 + cw - 60, y: yNow + 20 + now.lead / 2, align: 'center', color: pal.onAccent, key: pal.onAccent });
        const cs = M.pop(span(t, nowT + 0.2, nowT + 0.2 + T.dur.pop));        // the round's check badge on the far corner
        if (cs > 0) {
          const bx = kit.rtl ? cx0 + 14 : cx0 + cw - 14, by = yNow + 4;
          ctx.save(); M.around(ctx, bx, by, cs);
          ctx.fillStyle = pal.paper; ctx.strokeStyle = pal.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(bx, by, 44, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(bx - 19, by + 1); ctx.lineTo(bx - 5, by + 16); ctx.lineTo(bx + 21, by - 14); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
