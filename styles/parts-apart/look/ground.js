// The Parts Apart ground: a studio sweep in the brand's darker colour. A soft pool of light sits low in the frame where the object
// stands, the corners fall away into a vignette, and a faint band of light slides slowly across the back wall so the frame is never
// still. The sweep is painted once to its own canvas; a frame only lays it down and moves the band.
import { mix, rgba } from '/engine/kit.js';
import { palette } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const pal = palette(brand);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = pal.dark; g.fillRect(0, 0, W, H);
  const pool = g.createRadialGradient(W / 2, H * 0.58, 0, W / 2, H * 0.58, H * 0.62);
  pool.addColorStop(0, mix(pal.dark, pal.light, 0.13)); pool.addColorStop(0.55, mix(pal.dark, pal.light, 0.05)); pool.addColorStop(1, rgba(pal.dark, 0));
  g.fillStyle = pool; g.fillRect(0, 0, W, H);
  const vig = g.createRadialGradient(W / 2, H * 0.5, H * 0.3, W / 2, H * 0.5, H * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = vig; g.fillRect(0, 0, W, H);
  // where the floor bends into the wall: a very soft horizon
  const hz = g.createLinearGradient(0, H * 0.62, 0, H * 0.74); hz.addColorStop(0, rgba(pal.light, 0)); hz.addColorStop(0.5, rgba(pal.light, 0.025)); hz.addColorStop(1, rgba(pal.light, 0));
  g.fillStyle = hz; g.fillRect(0, H * 0.62, W, H * 0.12);
  const band = document.createElement('canvas'); band.width = 520; band.height = H;
  const b = band.getContext('2d'), bg = b.createLinearGradient(0, 0, 520, 0);
  bg.addColorStop(0, rgba(pal.light, 0)); bg.addColorStop(0.5, rgba(pal.light, 0.035)); bg.addColorStop(1, rgba(pal.light, 0));
  b.fillStyle = bg; b.fillRect(0, 0, 520, H);
  return {
    pal,
    draw(ctx, t) {
      ctx.drawImage(cv, 0, 0);
      const x = ((t + clock) * 38) % (W + 520) - 520;
      ctx.drawImage(band, x, 0);
    },
  };
}
