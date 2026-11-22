// The subtitle-wire ground: full-bleed footage, graded toward the brand's darker colour (a crowd at dusk out of focus, or a road seen
// from a drone, chosen by where the scene sits in the reel; or a source document, when a part asks for one), always drifting or
// pushing in slowly, with a scrim that darkens it under the captions. draw(ctx, t, top): top is where the captions begin.
import { palette, footage, documentShot, scrim } from './motion.js';

export function create({ W, H, brand, look, clock = 0, shot = null, at = 0 }) {
  const T = look.tokens, P = palette(brand, T);
  const film = shot === 'document' ? documentShot(P, T, W, H, 77 + Math.floor(clock), 0.25) : footage(P, T, W, H, Math.floor(clock / 3));
  return {
    P,
    draw(ctx, t, top = 760) {
      film(ctx, t + 2, at);
      scrim(ctx, P, W, H, top, T);
    },
  };
}
