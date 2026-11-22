// A number as loot: a chest sits on the window's top edge, springs open and throws coins, while the value counts up inside the window
// in pixel digits, twelve hard ticks to its value. When it lands, pixel stars twinkle around it. The label is the message under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, u = M.PX;
  const wx = 72, ww = 936, pad = 9 * u, inner = ww - 2 * pad;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const full = text(S.value), pix = M.canPix(full);
  const b = pix ? Math.max(8, Math.min(T.size.dot, Math.floor(inner / M.pixUnits(full)))) : 0;
  let nsize = 7 * T.size.dot; if (!pix) while (kit.numberWidth(full, nsize, 900, 1) > inner && nsize > 80) nsize -= 6;
  const nh = pix ? 7 * b : nsize;
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: inner, minPx: 44, where: 'the count label' });
  const h = M.snap(pad + 3 * u + nh + 3 * u + 4 * u + label.height + pad), top = M.snap(kit.place(h, 760));
  const yNum = top + pad + 3 * u, yLabel = yNum + nh + 7 * u + label.lead / 2, cx = wx + ww / 2;
  const tc0 = at + 0.3, tc1 = at + 1.5, tClear = d - 0.3, cm = M.chestMap(P);
  const coins = Array.from({ length: 9 }, (_, i) => ({ t0: tc0 + i * 0.13, vx: (i % 2 ? 1 : -1) * (30 + ((i * 37) % 50)), vy: 150 + ((i * 53) % 60) }));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const open = M.stepped(span(t, at, at + 0.24)) * (1 - M.stepped(span(t, d - 0.26, d - 0.04), 3));
      // coins fly up out of the chest and fall back behind the window (one game pixel at a time)
      for (const c of coins) { const s = t - c.t0; if (s < 0 || s > 0.9 || open < 1) continue;
        const x = M.snap(cx + c.vx * s * 2), y = M.snap(top - 10 * u - c.vy * s * 2 + 520 * s * s);
        ctx.fillStyle = P.d; ctx.fillRect(x - u, y - u, 4 * u, 4 * u); ctx.fillStyle = P.a; ctx.fillRect(x, y, 2 * u, 2 * u);
        ctx.fillStyle = P.l; if (Math.floor(s * 10) % 2) ctx.fillRect(x, y, u, u); }
      if (!M.win(ctx, wx, top, ww, h, P, open) || open < 1) return;
      const opened = t >= tc0 - 0.05;
      M.sprite(ctx, opened ? M.CHEST.open : M.CHEST.shut, M.snap(cx - 8 * u), top - 8 * u, cm, u);
      if (t >= tClear) return;
      const q = Math.floor(span(t, tc0, tc1) * 12) / 12, v = countValue(0, S.value, q, (x) => x), s = text(v);
      if (t >= tc0 - 0.05) {
        if (pix) { const wpx = M.pixUnits(s) * b, x = M.snap(cx - wpx / 2);
          M.pixText(ctx, s, x, yNum, b, P.l, P.a);
          kit.rec(x, x + wpx, yNum, yNum + 7 * b, s); }
        else kit.number(ctx, s, { x: cx, y: yNum + nh / 2, size: nsize, color: P.l, align: 'center' });
      }
      if (t >= tc1 && t < tc1 + 1.2) {                                     // it landed: stars twinkle around the number
        const k = Math.floor((t - tc1) * 6), wv = (pix ? M.pixUnits(full) * b : nsize * 2) / 2 + 5 * u;
        [[-1, 0.1], [1, 0.75], [-0.6, 1.05], [0.7, -0.15]].forEach(([sx, sy], i) =>
          M.sprite(ctx, M.STAR[(k + i) % 2], M.snap(cx + sx * wv), M.snap(yNum + sy * nh - 2 * u), { o: P.lead }, u));
      }
      if (t >= at + 0.35) kit.drawText(ctx, label, { x0: wx + pad, x1: wx + ww - pad, y: yLabel, align: 'center', color: P.l, key: P.l,
        each: (w, i, box, c) => { if (t < at + 0.35 + i * 0.06) return false;
          if (w.key) { M.block(c, box.x - 10, box.y - label.size * 0.62, box.x + box.width + 10, box.y + label.size * 0.62, P.a); return P.onA; } } });
    },
  };
}
