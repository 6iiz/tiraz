// The page: the brand's lighter colour as warm paper with a faint grain, and a dot grid. The page rides slowly upward the whole reel,
// as if the eye follows the pen down the notes, so the grid is never quite still; a part moves its own notes with the same `drift`.
// Grain and grid are built once per palette; the drift uses `clock`, so a cut does not restart it.
import { rng, rgba } from '/engine/kit.js';
import { palette } from './motion.js';

const cache = new Map();
export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, P = palette(brand, T), pitch = T.grid.pitch, id = P.paper + P.dark;
  if (!cache.has(id)) {
    const r = rng(5150), cv = document.createElement('canvas'); cv.width = W; cv.height = H + pitch; const g = cv.getContext('2d');
    g.fillStyle = P.paper; g.fillRect(0, 0, W, H + pitch);
    for (let i = 0; i < 9000; i++) { g.fillStyle = rgba(r() < 0.5 ? P.dark : P.light, T.tone.grain * (0.3 + r())); g.fillRect(r() * W, r() * (H + pitch), 1 + r() * 1.6, 1 + r() * 1.6); }
    g.fillStyle = P.dot;
    for (let y = pitch / 2; y < H + pitch; y += pitch) for (let x = (W % pitch) / 2 + pitch / 2 - pitch / 2; x < W; x += pitch) { g.beginPath(); g.arc(x, y, T.grid.dot, 0, Math.PI * 2); g.fill(); }
    cache.set(id, cv);
  }
  const page = cache.get(id);
  return {
    P,
    drift: (t) => -t * T.drift,                          // how far a part's notes have ridden up, in this scene's seconds
    draw(ctx, t) {
      const off = ((t + clock) * T.drift) % pitch;
      ctx.drawImage(page, 0, -off);
    },
  };
}
