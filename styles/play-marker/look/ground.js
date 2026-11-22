// The Play Marker ground: the studio's dark colour, plus the pitch as the broadcast camera sees it (built once per scene, see
// motion.pitch). Parts draw the live picture through motion.view at their own play time; this ground is what shows under it and
// under the ending: the dark brand colour with the pitch held far back.
import { palette, pitch } from './motion.js';

export function create({ W, H, brand, look }) {
  const P = palette(brand, look.tokens);
  let field = null;
  return {
    P,
    get field() { return field ?? (field = pitch(W, H, look.tokens, P)); },
    draw(ctx) { ctx.fillStyle = P.dark; ctx.fillRect(0, 0, W, H); },
  };
}
