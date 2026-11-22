// Before and after on one card: the old value is cut and lit; then a strip of dark paper slides in behind it from the reading side, so its
// light goes out and its letters show only as dark cuts. The new value lights below it through accent tissue, with its slot.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = T.textW, x0 = W / 2 - maxW / 2, x1 = W / 2 + maxW / 2;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 80, minScale: 0.8, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.9, where: 'the compare label' }) : null;
  const lh = label ? label.height + 24 : 0, gapV = now.size * 0.5, block = lh + was.height + gapV + now.height;
  const top = kit.place(block + 60, 720) + 30;
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + lh + was.lead / 2, yNow = yWas + was.lead / 2 + gapV + now.lead / 2;
  const cw = Math.min(W - 120, Math.max(600, Math.max(was.width, now.width, label ? label.width : 0) + 180)), C = M.card(cw, block + 100, P, 37);
  const cx0 = W / 2 - cw / 2, cy0 = top - 50, soft = mix(P.glow, P.card, 0.22);
  const offT = at + 0.95, nowT = at + 1.35, out = mix(P.card, P.light, 0.3);
  const runNow = { x0: W / 2 - now.width / 2, x1: W / 2 + now.width / 2 };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const g = M.groove(span(t, at, at + 0.42), span(t, d - T.dur.out, d));
      if (g) {
        ctx.save(); ctx.translate(ground.drift(t, 0.55), g.dy);
        M.layCard(ctx, C, cx0, cy0, g.lift);
        if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'center', color: soft,
          each: (w, i, box, c) => { const s0 = at + 0.1 + i * 0.05; return M.light(c, span(t, s0, s0 + T.dur.light), soft, P); } });
        // the old value: lit, then its light is shut off from the reading side by a strip of paper behind the card
        const off = M.O(span(t, offT, offT + 0.4));
        kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'center', color: P.glow, key: P.glow,
          each: (w, i, box, c) => {
            const s0 = at + 0.25 + i * 0.06, col = M.light(c, span(t, s0, s0 + T.dur.light), P.glow, P); if (col === false) return false;
            const edge = rtl ? x1 - (x1 - x0) * off : x0 + (x1 - x0) * off, f = rtl ? 1 - span(edge, box.x, box.x + box.width) : span(edge, box.x, box.x + box.width);
            if (f <= 0) return col;
            c.shadowBlur = c.shadowBlur * (1 - f); return mix(col, out, f);
          } });
        if (off > 0 && off < 1) { const ex = rtl ? x1 - (x1 - x0) * off : x0 + (x1 - x0) * off; ctx.save(); ctx.fillStyle = rgba(P.glow, 0.5 * (1 - off)); ctx.fillRect(ex - 1.5, yWas - was.size * 0.5, 3, was.size); ctx.restore(); }
        M.slot(ctx, runNow.x0, runNow.x1, yNow, now.size, span(t, nowT, nowT + 0.35), P);
        kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'center', color: P.key, key: P.key,
          each: (w, i, box, c) => { const s0 = nowT + i * 0.06; return M.light(c, span(t, s0, s0 + T.dur.light), P.key, P, 26); } });
        ctx.restore();
      }
      ground.drawFront(ctx, t);
    },
  };
}
