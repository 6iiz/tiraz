// Before and after as a market board: the picture panel becomes an ink card with two rows. The old value rolls in on the upper row
// beside a falling marker, in a quiet tone, and is struck through; then the lower row lights up in the accent and the new value rolls
// in beside a rising marker. The label is the headline on the strap. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, D = T.dur, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const pic = M.picture(P, T, W, 0);
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const vx0 = SAFE.left + 50, vx1 = SAFE.right - 140;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: vx1 - vx0, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: Math.round(T.size.strap * 0.85), weight: T.weight.strap, maxW: SAFE.right - SAFE.left - T.strap.end - 66, minScale: 0.7, where: 'the compare label' }) : null;
  const st = M.strap({ kit, brand, P, T, tab: null, text: label });
  const rowH = Math.max(was.height, now.height) + 50, yA = pic.y + 40 + rowH / 2, yB = pic.y + pic.h - 40 - rowH / 2;
  const mx = rtl ? SAFE.right - 70 : SAFE.left + 70;
  const tri = (c, x, y, up, col) => { c.fillStyle = col; c.beginPath(); if (up) { c.moveTo(x, y - 26); c.lineTo(x + 28, y + 22); c.lineTo(x - 28, y + 22); } else { c.moveTo(x, y + 26); c.lineTo(x + 28, y - 22); c.lineTo(x - 28, y - 22); } c.closePath(); c.fill(); };
  const tA = at + 0.25, tCut = at + 0.85, tB = at + 1.2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - D.fold, d);
      pic.draw(ctx, t - at, (c) => {
        c.fillStyle = P.ink; c.fillRect(pic.x, pic.y, pic.w, pic.h);
        c.fillStyle = P.raise; c.fillRect(pic.x + 30, (yA + yB) / 2 - 1, pic.w - 60, 2);
        // the old row
        M.flip(c, span(t, tA, tA + D.flip), out, yA - rowH / 2, yA + rowH / 2, () => {
          c.fillStyle = P.raise; c.fillRect(pic.x + 20, yA - rowH / 2, pic.w - 40, rowH);
          tri(c, mx, yA, false, P.muted);
          kit.drawText(c, was, { x0: vx0, x1: vx1, y: yA - was.height / 2 + was.lead / 2, align: 'start', color: P.muted, key: P.muted });
          const k = M.Q(span(t, tCut, tCut + 0.22));
          if (k > 0) { const L = (was.width + 40) * k, s0 = rtl ? vx1 + 20 : vx0 - 20; c.fillStyle = P.paper; c.fillRect(rtl ? s0 - L : s0, yA - 4, L, 8); }
        }, P.ink);
        // the new row: the accent wipes across from the reading side, then the value rolls up onto it
        const w = M.Q(span(t, tB, tB + D.tab)) * (1 - M.I(out)), full = pic.w - 40;
        if (w > 0) { c.fillStyle = P.accent; c.fillRect(rtl ? pic.x + 20 + full * (1 - w) : pic.x + 20, yB - rowH / 2, full * w, rowH); }
        M.flip(c, span(t, tB + 0.12, tB + 0.12 + D.flip), out, yB - rowH / 2, yB + rowH / 2, () => {
          tri(c, mx, yB, true, P.onAccent);
          kit.drawText(c, now, { x0: vx0, x1: vx1, y: yB - now.height / 2 + now.lead / 2, align: 'start', color: P.onAccent, key: P.onAccent });
        });
      });
      st.draw(ctx, { pTab: span(t, at, at + D.tab), pText: span(t, at + 0.1, at + 0.1 + D.flip), out });
    },
  };
}
