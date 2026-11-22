// Before and after, as a change view in the window: the label is the panel's header, the old value is the removed row (a minus in
// its gutter). The pixel buddy jumps on the old row and stomps it: a strike runs through it and it greys. The cursor presses the
// header's apply button and the added row opens below (a plus in its gutter, an accent rule on its edge, a tint of the accent), and the
// buddy hops down onto it and cheers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rr, mix } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, B = M.buddy(P, T.px), c = M.content();
  const rx0 = c.x0, rx1 = c.x1, gut = 70, x0 = rtl ? rx0 + 30 : rx0 + gut + 20, x1 = rtl ? rx1 - gut - 20 : rx1 - 30;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: x1 - x0, minScale: 0.75, where: 'a compared value' });
  const btnW = 150, label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: rx1 - rx0 - btnW - 40, minPx: 44, where: 'the compare label' }) : null;
  const headH = Math.max(80, label ? label.height + 30 : 0), h1 = was.height + 40, h2 = now.height + 40, gapR = 150;
  const top = Math.max(c.y0 + 20, 720 - (headH + 110 + h1 + gapR + h2) / 2), r1 = top + headH + 110, r2 = r1 + h1 + gapR;
  const stomp = at + 0.85, open = at + 1.25, bx = rtl ? rx0 : rx1 - btnW, by = top + headH / 2 - 30;
  const mid = rtl ? rx0 + (rx1 - rx0) * 0.3 : rx1 - (rx1 - rx0) * 0.3, side = rtl ? rx1 - 50 : rx0 + 50;
  const stops = [{ t: 0, x: mid, y: r1 }, { t: stomp - 0.34, x: mid, y: r1, how: 'jump', height: 150 }, { t: open + 0.3, x: mid, y: r2, how: 'jump', height: 90 }];
  const path = [{ t: at - 0.3, x: W - 80, y: 1280 }, { t: open - 0.45, x: bx + btnW / 2 + 8, y: by + 40 }, { t: 2.0, x: bx + btnW / 2 + 8, y: by + 40 }, { t: 2.8, x: bx + btnW / 2 + 120, y: by + 220 }];
  const clicks = [open - 0.1];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.zoom(ctx, W, H, 1 + (T.zoom - 1) * M.IO(span(t, at + 0.4, at + 1.6)), W / 2, (r1 + r2 + h2) / 2);
      M.windowFrame(ctx, P, brand, rtl, t + clock, 3);
      if (label) kit.drawText(ctx, label, { x0: rtl ? rx0 + btnW + 40 : rx0, x1: rtl ? rx1 : rx1 - btnW - 40, y: top + headH / 2, align: 'start', color: P.grey });
      const pressed = t >= open - 0.1;
      ctx.fillStyle = pressed ? P.accent : P.chrome; rr(ctx, bx, by, btnW, 60, 30); ctx.fill();
      ctx.strokeStyle = pressed ? P.onAccent : P.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(bx + btnW / 2 - 16, by + 31); ctx.lineTo(bx + btnW / 2 - 4, by + 42); ctx.lineTo(bx + btnW / 2 + 16, by + 19); ctx.stroke();
      ctx.fillStyle = P.line; ctx.fillRect(rx0, top + headH + 10, rx1 - rx0, 2);
      const hit = t >= stomp, sk = M.E(span(t, stomp, stomp + 0.2));
      const g0 = rtl ? rx1 - gut : rx0;
      ctx.fillStyle = P.old; rr(ctx, rx0, r1, rx1 - rx0, h1, 14); ctx.fill();
      ctx.fillStyle = hit ? P.ui : P.grey; ctx.fillRect(g0 + gut / 2 - 14, r1 + h1 / 2 - 3, 28, 6);
      kit.drawText(ctx, was, { x0, x1, y: r1 + h1 / 2, align: 'start', color: hit ? P.grey : P.ink, key: hit ? P.grey : P.ink });
      if (sk > 0) { const w = was.width + 24; ctx.fillStyle = P.ink; ctx.fillRect(rtl ? x1 + 12 - w * sk : x0 - 12, r1 + h1 / 2 - 2, w * sk, 7); }
      const op = M.E(span(t, open, open + 0.22));
      if (op > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(rx0 - 10, r2, rx1 - rx0 + 20, h2 * op); ctx.clip();
        ctx.fillStyle = P.tint; rr(ctx, rx0, r2, rx1 - rx0, h2, 14); ctx.fill();
        ctx.fillStyle = P.accent; ctx.fillRect(rtl ? rx1 - 8 : rx0, r2, 8, h2);
        ctx.fillStyle = mix(P.accent, P.dark, 0.2); const gx = g0 + gut / 2; ctx.fillRect(gx - 14, r2 + h2 / 2 - 3, 28, 6); ctx.fillRect(gx - 3, r2 + h2 / 2 - 14, 6, 28);
        kit.drawText(ctx, now, { x0, x1, y: r2 + h2 / 2, align: 'start', color: P.ink, key: P.ink });
        ctx.restore();
      }
      const b = M.act(stops, t), cheer = b.landed < 99 && t > open;
      M.drawBuddy(ctx, B, P, b, { eyes: cheer ? 'happy' : 'open', arms: cheer && Math.floor(b.landed / 0.25) % 2 === 0 ? 'up' : 'down', time: t + clock, flip: !rtl });
      M.cursor(ctx, P, path, clicks, t);
      ctx.restore();
    },
  };
}
