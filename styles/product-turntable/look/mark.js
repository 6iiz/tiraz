// The handle, printed small in the mono face on the front of the podium's base, under its accent band, like a studio's name on its
// set. It sits where the front of the podium meets the plane that maps 1:1 to the frame, so it stays on the podium as the camera
// drifts. Decoration only (not measured; the app may cover it).
import { mix } from '/engine/kit.js';
import { tones } from './ground.js';
export async function create({ W, H, brand, look }) {
  const T = look.tokens, tn = tones(brand, T), mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const yTop = H / 2 - (T.set.floorY + T.set.podH - T.set.tableH), yBot = H / 2 - T.set.floorY, y = yTop + (yBot - yTop) * 0.5;
  const c = mix(tn.podium, tn.ink, 0.55);
  return {
    draw(ctx) {
      ctx.save(); ctx.font = `600 22px "${mono}"`; ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c; ctx.globalAlpha = 0.9; ctx.fillText(brand.handle, W / 2, y);
      ctx.restore();
    },
  };
}
