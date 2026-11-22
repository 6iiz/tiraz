// A number as a market-board graphic: the picture panel turns into an ink card with a split-flap window, and the figure climbs to its
// value one flap at a time (each step folds its upper half down over the old figure), slowing toward the end. The label is the
// headline on the strap. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, ease, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, D = T.dur;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const pic = M.picture(P, T, W, 0);
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const room = pic.w - 160;
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 0) > room && size > 90) size -= 6;
  const label = kit.fit(S.label, { size: Math.round(T.size.strap * 0.85), weight: T.weight.strap, maxW: SAFE.right - SAFE.left - T.strap.end - 66, minScale: 0.7, where: 'the count label' });
  const st = M.strap({ kit, brand, P, T, tab: null, text: label });
  const N = 14, f0 = at + 0.3, f1 = at + 1.6;
  const val = (k) => (k >= N ? S.value : countValue(0, S.value, k / N, ease.outCubic));
  const winW = kit.numberWidth(text(S.value), size, 900, 0) + 110, winH = size * 1.18;
  const cx = pic.x + pic.w / 2, cy = pic.y + pic.h / 2 + 4, top = mix(P.raise, P.paper, 0.05);
  const num = (ctx, str, half, sy = 1, settle = 0) => {
    ctx.save(); ctx.beginPath();
    if (half < 0) ctx.rect(cx - winW / 2, cy - winH / 2, winW, winH / 2); else ctx.rect(cx - winW / 2, cy, winW, winH / 2);
    ctx.clip();
    if (sy !== 1) { ctx.translate(0, cy); ctx.scale(1, Math.max(0.001, sy)); ctx.translate(0, -cy); }
    kit.number(ctx, str, { x: cx, y: cy + size * 0.04, size, color: P.paper, settle });
    ctx.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - D.fold, d);
      pic.draw(ctx, t - at, (c) => {
        c.fillStyle = P.ink; c.fillRect(pic.x, pic.y, pic.w, pic.h);
        c.fillStyle = P.raise; for (let x = pic.x + 40; x < pic.x + pic.w; x += 80) c.fillRect(x, pic.y, 1, pic.h);
        M.flip(c, span(t, at, at + D.flip), out, cy - winH / 2, cy + winH / 2, () => {
          c.fillStyle = top; c.fillRect(cx - winW / 2, cy - winH / 2, winW, winH / 2);
          c.fillStyle = P.raise; c.fillRect(cx - winW / 2, cy, winW, winH / 2);
          const p = span(t, f0, f1) * N, k = Math.floor(p), f = p - k;
          if (k >= N) { num(c, text(S.value), -1, 1, 1); num(c, text(S.value), 1, 1, 1); }
          else {
            const old = text(val(k)), neu = text(val(k + 1));
            num(c, neu, -1); num(c, f < 0.5 ? old : neu, 1);
            if (f < 0.5) num(c, old, -1, 1 - 2 * f); else num(c, neu, 1, 2 * f - 1);
          }
          c.fillStyle = P.ink; c.fillRect(cx - winW / 2, cy - 3, winW, 6);
        }, P.ink);
      });
      st.draw(ctx, { pTab: span(t, at, at + D.tab), pText: span(t, at + 0.2, at + 0.2 + D.flip), out });
    },
  };
}
