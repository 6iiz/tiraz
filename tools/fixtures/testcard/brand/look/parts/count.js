// A number counting up from 0 with a label under it. spec: { duration, says: { value, label }, decimals? }
import { need, span, countValue } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, clock });
  const size = look.tokens.size.count, label = kit.fit(spec.says.label, { size: 60, maxW: 800, where: 'the count label' });
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = span(t, 0.2, 1.7);
      kit.number(ctx, kit.fmt(countValue(0, spec.says.value, p), spec.decimals ?? 0), { x: W / 2, y: 700, size, settle: p });
      kit.drawText(ctx, label, { x0: 140, x1: W - 140, y: 700 + size * 0.8 });
    },
  };
}
