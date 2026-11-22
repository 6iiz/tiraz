// Before and after as a light going out and another catching: the old value rises in beside a burning lantern; the flame dies (the
// glass turns dark, a few pixel puffs of smoke climb), the value dims and a metal rule is drawn through it. Then the second lantern
// flares and the new value rises in the lit pill. The label rides on the name plate.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const px = SAFE.left, pw = SAFE.right - SAFE.left, pad = 50, lan = 7 * 6 + 40, inner = pw - 2 * pad - lan - 30;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: inner, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: pw - 140, minPx: 44, where: 'the compare label' }) : null;
  const tabH = label ? label.height + 26 : 0, tabW = label ? label.width + 84 : 0, over = tabH * 0.55, gap = 50;
  const ph = was.height + gap + now.height + 2 * pad + (label ? 14 : 0), top = kit.place(over + ph, 720), py = top + over;
  const yWas = py + pad + (label ? 14 : 0) + was.lead / 2, yNow = py + pad + (label ? 14 : 0) + was.height + gap + now.lead / 2;
  const tx = rtl ? px + pw - tabW - 34 : px + 34, lx = rtl ? px + pw - pad - 42 : px + pad;
  const x0 = rtl ? px + pad : px + pad + lan, x1 = rtl ? px + pw - pad - lan : px + pw - pad;
  const tWas = at + 0.2, tOut = at + 0.85, tNow = at + 1.4;
  const lit = { o: P.metal, L: P.light, W: P.l }, dark = { o: P.metal, L: P.floorD, W: P.floor }, ember = { o: P.metal, L: P.floorD, W: P.roof };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pin = M.out3(span(t, at, at + 0.3)), pout = M.in2(span(t, d - 0.35, d));
      if (pin <= 0 || pout >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - pout; ctx.translate(0, (1 - pin) * 26 + pout * 22);
      M.plate(ctx, px, py, pw, ph, P, pin);
      if (label) { M.plate(ctx, tx, top, tabW, tabH, P, M.out3(span(t, at + 0.08, at + 0.36)));
        kit.drawText(ctx, label, { x0: tx + 42, x1: tx + tabW - 42, y: top + 13 + label.lead / 2, align: 'start', color: P.metal, key: P.metal }); }
      // the old light, and its going out
      const dying = span(t, tOut, tOut + 0.4);
      M.sprite(ctx, M.LANTERN, lx, yWas - 30, t < tOut ? lit : dying < 0.5 ? ember : dark, 6);
      if (t >= tWas) M.bloom(ctx, ground.lampGlow, lx + 21, yWas, 120 * M.flicker(t + clock, 1) * (1 - dying), 0.65 * (1 - dying));
      if (dying > 0) for (let k = 0; k < 4; k++) { const s = span(t, tOut + k * 0.12, tOut + k * 0.12 + 0.9); if (s <= 0 || s >= 1) continue;
        ctx.save(); ctx.globalAlpha *= 0.5 * (1 - s); ctx.fillStyle = P.grey; ctx.fillRect(Math.round(lx + 18 + Math.sin(k * 2 + s * 6) * 10), Math.round(yWas - 44 - s * 90), 8, 8); ctx.restore(); }
      const dim = M.out3(span(t, tOut, tOut + 0.4));
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: dim > 0.5 ? P.grey : P.l, key: dim > 0.5 ? P.grey : P.l,
        each: (w, i, box, c) => M.rise(c, span(t, tWas + i * 0.06, tWas + 0.3 + i * 0.06), was.size) });
      if (dim > 0) { const wv = (was.rows[0].width + 24) * dim; ctx.fillStyle = P.metal; ctx.fillRect(rtl ? x1 + 12 - wv : x0 - 12, yWas - 2, wv, 4); }
      // the new light
      const nl = t >= tNow;
      M.sprite(ctx, M.LANTERN, lx, yNow - 30, nl ? lit : dark, 6);
      if (nl) M.bloom(ctx, ground.lampGlow, lx + 21, yNow, (120 + 160 * Math.max(0, 1 - (t - tNow) / 0.5)) * M.flicker(t + clock, 2), 0.75 * (1 - pout));
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: P.onA, key: P.onA,
        each: (w, i, box, c) => { if (M.rise(c, span(t, tNow + 0.05 + i * 0.06, tNow + 0.4 + i * 0.06), now.size) === false) return false; M.keyPill(c, box, now.size, P); } });
      ctx.restore();
    },
  };
}
