// The retro-cel ground: the painted night plate (sky, low sun, city, wet street), slid slowly sideways across the whole reel as a
// painted background is panned under the cels, with its lit windows glowing through. `over` lays the tape on top of the finished frame
// (noise, scanlines, a dark rim): every part calls it last. Uses `clock`, so the pan runs on through the scenes.
import { held, palette, plate, playback } from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), pl = plate(W, H, P);
  return {
    P,
    draw(ctx, t) {
      const time = held(t + clock, 24), off = Math.min(pl.PW - W, 20 + time * 7);
      ctx.drawImage(pl.color, -off, 0);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 + 0.12 * Math.sin(held(t + clock, 12) * 2.1);   // the windows breathe a little, on the drawings
      ctx.drawImage(pl.glow, -off, 0); ctx.restore();
    },
    over(ctx, t) { playback(ctx, W, H, P, t + clock); },
  };
}
