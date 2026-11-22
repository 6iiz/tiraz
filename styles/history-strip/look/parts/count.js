// A number as a piece of territory: a big torn scrap of the accent is slapped onto the map and pinned at its corner, and the number
// printed on it counts up to its value. A card puppet at the foot of the panel points at it (held poses), and the label is a
// narration caption slapped under the scrap. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, G = ground.stage;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 700 && size > 110) size -= 8;
  const nw = kit.numberWidth(text(S.value), size, 900, 1), sw = Math.max(nw + 140, 420), sh = size * 1.3;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW: SAFE.right - SAFE.left - 80, minScale: 0.7, where: 'the count label' });
  const cx = W / 2, cy = 560, scrap = M.torn(sw, sh, 9, 8);
  const cw = label.width + 60, ch = label.height + 28, cyL = cy + sh / 2 + 70 + ch / 2, cap = M.torn(cw, ch, 4, 3);
  const px = rtl ? SAFE.left + 110 : SAFE.right - 110, py = G.y + G.h - 10, face = rtl ? 1 : -1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const h = M.held(t + clock), up = t > at + 0.3;
      M.puppet(ctx, px, py, 0.62, { arm: [up ? [2.1, 2.25][h % 2] : 0.3, 0.1], head: up ? -0.08 : 0, mouth: up && t < at + 1.6 && h % 2 === 0 }, P, { face });
      const pc = span(t, at + 0.25, at + 1.25);
      M.slapped(ctx, span(t, at, at + T.dur.slap), cx, cy, (s) => {
        ctx.rotate(-0.03); M.paper(ctx, scrap, P.accent, P, { shadow: s });
        kit.number(ctx, text(countValue(0, S.value, pc)), { x: 0, y: 4, size, color: P.onAccent, align: 'center', settle: pc });
        M.pin(ctx, (rtl ? 1 : -1) * (sw / 2 - 26), -sh / 2 + 24, P, 11);
      });
      M.slapped(ctx, span(t, at + 0.5, at + 0.5 + T.dur.slap), cx, cyL, (s) => {
        M.paper(ctx, cap, P.caption, P, { shadow: s, edge: P.ink });
        kit.drawText(ctx, label, { x0: -cw / 2 + 30, x1: cw / 2 - 30, y: -ch / 2 + 14 + label.lead / 2, align: 'center', color: P.ink });
      });
    },
  };
}
