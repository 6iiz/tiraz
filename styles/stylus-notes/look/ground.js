// The Stylus Notes ground: a dark glass drawing canvas lit from within. The darker brand colour (a hair toward the accent) is the glass,
// with a slow inner glow, a fine dot grid as the canvas's snapping guide, and a soft fall-off to the corners. One reflection drifts
// slowly across the glass so a held frame is never still. Painted once per brand (module cache); a frame draws one image and the glint.
import { mix, rgba } from '/engine/kit.js';
import { palette } from './motion.js';

const cache = new Map();
function build(W, H, pal, T) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = pal.glass; g.fillRect(0, 0, W, H);
  const lift = g.createRadialGradient(W * 0.5, H * 0.36, 0, W * 0.5, H * 0.36, H * 0.7);
  lift.addColorStop(0, rgba(mix(pal.glass, pal.light, 0.08), 1)); lift.addColorStop(1, rgba(pal.glass, 0));
  g.fillStyle = lift; g.fillRect(0, 0, W, H);
  const p = T.grid.pitch;
  g.fillStyle = rgba(pal.light, T.grid.alpha);
  for (let y = p / 2; y < H; y += p) for (let x = p / 2; x < W; x += p) { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, rgba(pal.dark, 0)); v.addColorStop(1, rgba(pal.dark, 0.6));
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

export function create({ W, H, brand, look, clock = 0 }) {
  const T = look.tokens, pal = palette(brand, T), key = [W, H, pal.dark, pal.light, pal.accent].join();
  if (!cache.has(key)) cache.set(key, build(W, H, pal, T));
  const img = cache.get(key);
  return {
    pal,
    draw(ctx, t) {
      const time = t + clock;
      ctx.drawImage(img, 0, 0);
      // the screen's own light: two very soft pools (accent and ink) drifting slowly under the glass
      for (const [cx, cy, rad, col, a, sp] of [[W * 0.85, H * 0.78, 760, pal.accent, 0.1, 0.11], [W * 0.15, H * 0.22, 640, pal.light, 0.045, 0.08]]) {
        const x = cx + Math.sin(time * sp) * 120, y = cy + Math.cos(time * sp * 0.8) * 90;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // a long, faint reflection crossing the glass, very slowly
      const x = ((time * 26) % (W + 1400)) - 700;
      ctx.save(); ctx.translate(x, H * 0.45); ctx.rotate(-0.5);
      const g = ctx.createLinearGradient(-260, 0, 260, 0);
      g.addColorStop(0, rgba(pal.light, 0)); g.addColorStop(0.5, rgba(pal.light, 0.028)); g.addColorStop(1, rgba(pal.light, 0));
      ctx.fillStyle = g; ctx.fillRect(-260, -1400, 520, 2800); ctx.restore();
    },
  };
}
