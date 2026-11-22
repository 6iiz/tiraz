// The edge of the print: the handle in the mono face in the dark surround under the gate, between two small tinted diamonds, like the
// edge lettering of a film strip. Below the safe area; decoration only.
import { palette, diamond } from './motion.js';
export async function create({ W, brand, look, kit }) {
  const T = look.tokens, P = palette(brand, T), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const h = kit.fit(brand.handle, { family: mono, size: 22, weight: 600, maxW: 600, single: true, where: 'the mark' });
  const y = T.gate.y + T.gate.h + 42;
  return {
    draw(ctx) {
      diamond(ctx, W / 2 - h.width / 2 - 26, y, 6, P.accent); diamond(ctx, W / 2 + h.width / 2 + 26, y, 6, P.accent);
      kit.drawText(ctx, h, { x0: 0, x1: W, y, color: P.s(0.5), key: P.s(0.5), decor: true });
    },
  };
}
