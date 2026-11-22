// A small metronome below the safe area: four cells that light in turn on the beat (the downbeat in the accent), beside the handle in
// the mono face. Decoration only: the app may cover it.
import { rgba, SAFE } from '/engine/kit.js';
import { palette } from './motion.js';
export async function create({ W, brand, look }) {
  const T = look.tokens, pal = palette(brand, T), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const y = SAFE.bottom + 70;
  return {
    draw(ctx, t = 0) {
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.dark, 0.8); ctx.fillRect(SAFE.left - 12, y - 20, 116 + ctx.measureText(brand.handle).width, 40);
      const b = Math.floor(t / T.beat) % 4;
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i === b ? (i === 0 ? pal.accent : rgba(pal.light, 0.7)) : rgba(pal.light, 0.12); ctx.fillRect(SAFE.left + i * 18, y - 6, 12, 12); }
      ctx.font = `500 22px "${mono}"`; ctx.fillStyle = rgba(pal.light, 0.5); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(brand.handle, SAFE.left + 90, y + 1);
    },
  };
}
